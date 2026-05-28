---
description: "INTERIM: one-time migration from legacy JSONL-in-git beads sync to canonical refs/dolt/data sync. Idempotent, safe to re-run. Remove this command once all active repos have migrated."
argument-hint: "[--dry-run]"
---

# Migrate beads to canonical refs/dolt/data sync

Migrate a legacy-mode beads repo (where `.beads/issues.jsonl` is committed and serves as cross-clone transport) to upstream's canonical mode (where `refs/dolt/data` on the git remote is the sync channel and JSONL is a passive local export).

Source of truth: [upstream SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md).

**Reversibility:** Migration is reversible up to `git push`. After push, peer clones need `bd dolt pull` once to pick up the new sync.

**Idempotency:** Safe to re-run. Steps already applied are detected and skipped.

**`--dry-run` flag:** Run Phase 1 (inventory) only. Print the plan. Exit without mutating anything.

---

## Phase 0 — Preconditions

Verify all. If any fails, STOP and surface to user. Do not auto-fix.

```bash
bd --version                                   # require 1.0.4+
cat .beads/metadata.json | jq -r .dolt_mode    # require "embedded"
git status --short                             # require clean
git remote get-url origin                      # require origin exists
git ls-files .beads/issues.jsonl               # if EMPTY: already migrated → exit 0
bd dolt remote list | grep -q origin && \
  [ -z "$(git ls-files .beads/issues.jsonl)" ] && echo "already canonical"
```

If working tree is dirty: stop. Don't mix migration with other work.

---

## Phase 1 — Inventory (read-only)

Print for user review. Sets expectations and surfaces gotchas.

- `bd --version`
- `bd config list` filtered for: `export.auto`, `export.git-add`, `sync.remote`
- `.beads/hooks/pre-commit` BEADS-marker section content
- Custom hook files outside beads markers: `.beads/hooks/commit-msg`, `.beads/hooks/post-merge`, `.beads/hooks/post-checkout`, `.beads/hooks/post-rewrite` (if they have non-BEADS-marker content, these are user-authored and need attention in Phase 6)
- `.beads/issues.jsonl` row count (`wc -l`)
- Custom JSONL-related scripts: `ls scripts/bd-{export-owned,sync-import,jsonl-guard,install-*}.sh 2>/dev/null`
- Justfile recipes referencing those scripts: `grep -E 'bd-(export-owned|sync-import|jsonl-guard)' justfile 2>/dev/null`
- Beads section heading in AGENTS.md or CLAUDE.md (first ~5 lines after the heading)

Stop after this output if `--dry-run`.

---

## Phase 2 — Set up canonical sync (network)

This is the first network-touching phase. If it fails, abort cleanly — no local state has been changed yet.

1. **Set `sync.remote` if unset:**
   ```bash
   if ! bd dolt remote list | grep -q origin; then
     bd dolt remote add origin "$(git remote get-url origin)"
   fi
   bd dolt remote list  # verify
   ```
   Known quirk: `bd dolt remote add` occasionally writes a wrong path. If `bd dolt remote list` shows something other than `origin <git-url>`, edit `.beads/config.yaml` directly to set `sync.remote:` to the git origin URL.

2. **Push current Dolt state to `refs/dolt/data` on origin:**
   ```bash
   bd dolt push
   ```
   If this fails (auth, network, divergence): STOP, surface stderr, do not proceed.

3. **Verify the push landed on origin:**
   ```bash
   git ls-remote origin refs/dolt/data | grep -q . && echo "ok" || echo "FAILED"
   ```
   If empty: STOP.

---

## Phase 3 — Local config + gitignore

1. **Flip config:**
   ```bash
   bd config set export.auto false
   bd config set export.git-add false
   ```

2. **Untrack JSONL files and add to `.beads/.gitignore`:**
   ```bash
   git rm --cached .beads/issues.jsonl 2>/dev/null || true
   git rm --cached .beads/sync_base.jsonl 2>/dev/null || true
   for f in issues.jsonl sync_base.jsonl; do
     grep -q "^${f}$" .beads/.gitignore 2>/dev/null || echo "${f}" >> .beads/.gitignore
   done
   ```

3. **Surface (don't auto-remove) legacy allowlist entries in root `.gitignore`:**
   ```bash
   grep -nE '^!\.beads/(issues\.jsonl|sync_base\.jsonl)' .gitignore 2>/dev/null
   ```
   If matches found: show them, ask user whether to remove.

---

## Phase 4 — Hooks

With `export.auto=false`, the beads-managed pre-commit hook reads config at runtime and skips the JSONL auto-export. Verify and refresh shims:

```bash
bd hooks install --force --beads      # refresh BEADS marker block
bd hooks list                          # confirm versions current
command -v timbers >/dev/null && timbers hooks install  # re-attach timbers if installed
```

**Optional — surface-on-failure git hooks** (ask user; default no). Wire `bd dolt push` into pre-push and `bd dolt pull` into post-merge so manual `bd dolt push` isn't forgotten. Use this pattern to avoid silent failures:

```sh
# pre-push (mirror for post-merge with bd dolt pull):
if command -v bd >/dev/null 2>&1; then
  _bd_err=$(mktemp -t bd-dolt-push.err.XXXXXX 2>/dev/null || echo /tmp/bd-dolt-push.err)
  if ! bd dolt push 2>"$_bd_err"; then
    echo >&2 "beads: 'bd dolt push' failed (continuing with git push); see $_bd_err"
  else
    rm -f "$_bd_err"
  fi
fi
```

Default recommendation: skip auto-hooks for now. Manual `bd dolt push` surfaces failures in-session, which is the safer default during the migration period.

---

## Phase 5 — Steering update

Update AGENTS.md (or CLAUDE.md if that's the project's convention). Diff and merge — don't replace wholesale.

1. Find the beads section: grep for `bd dolt`, `issues.jsonl`, `sync model`, `auto-export`.
2. Identify content injected by `bd setup claude` (look for managed markers) vs user-authored prose. Don't modify managed sections — they're owned by bd.
3. For user-authored prose:
   - Replace "JSONL is the source of truth" / "auto-export on commit" / "JSONL transport" with canonical-mode language (refs/dolt/data, bd dolt push/pull as load-bearing).
   - Add a reference to upstream's SYNC_CONCEPTS.md.
   - Update fresh-clone onboarding to use `bd bootstrap` (auto-detects canonical).
   - Add the note that `bd dolt push` doubles as the divergence verifier and `bd dolt status` does NOT report remote-divergence in 1.0.4.
4. Reference `dm-work:repo-init`'s `references/AGENTS.md` for canonical-mode wording.
5. Show the diff. Apply only after user confirmation.

---

## Phase 6 — Clean up legacy JSONL-discipline artifacts (user-confirmed)

If Phase 1 found any of:
- `scripts/bd-export-owned.sh`, `bd-sync-import.sh`, `bd-jsonl-guard.sh`, `install-*-hooks.sh`
- Justfile recipes wrapping the above
- Custom `.beads/hooks/commit-msg` enforcing JSONL scope
- Custom `.beads/hooks/post-merge` / `post-checkout` / `post-rewrite` doing `bd-sync-import --auto`
- `prepare-commit-msg` / `post-commit` automation for JSONL auto-export-on-message-parse

Surface each. Under canonical mode none are needed. Ask user: **delete / archive / keep**. Default recommendation: delete.

If the user keeps them, surface that the scripts will silently no-op or misbehave under canonical mode (e.g., `bd-export-owned` will write a JSONL that's gitignored).

---

## Phase 7 — Verification

Before commit, verify ALL of:

- [ ] `bd dolt remote list` shows `origin <git-url>`
- [ ] `git ls-remote origin refs/dolt/data` returns a SHA
- [ ] `git ls-files .beads/issues.jsonl` is empty
- [ ] `git ls-files .beads/sync_base.jsonl` is empty
- [ ] `bd config get export.auto` returns `false`
- [ ] `bd config get export.git-add` returns `false`
- [ ] `bd ready` works (local Dolt intact)
- [ ] `bd dolt push` (second run) is no-op (`Push complete.` with no chunks transferred)
- [ ] `just check` passes (if justfile exists)
- [ ] `timbers pending` clean (if timbers installed)

If any fails: STOP, surface to user. Don't proceed to commit.

---

## Phase 8 — Commit (user-reviewed)

Stage the migration. Use specific paths — never `git add -A` (could grab unrelated agent work).

Files typically included:
- `.beads/.gitignore` (new entries)
- `.beads/config.yaml` (if config is committed in this repo — many repos don't track it)
- `.gitignore` (if root cleanup was applied)
- `AGENTS.md` / `CLAUDE.md` (steering update)
- Deletion of `.beads/issues.jsonl` (was tracked)
- Deletion of `.beads/sync_base.jsonl` (if was tracked)
- Deleted legacy JSONL-discipline scripts + justfile recipe removals (if Phase 6 deleted them)
- `.beads/hooks/*` (if refreshed)

Commit message template:

```
feat(beads): migrate to canonical refs/dolt/data sync

Replace legacy JSONL-in-git transport with refs/dolt/data sync per
upstream SYNC_CONCEPTS. JSONL is now a local-only export; bead state
syncs via `bd dolt push` (after work) / `bd dolt pull` (after pull).

Includes: config flip (export.auto=false), gitignored JSONL, steering
update, removal of legacy JSONL-discipline scripts.

Peer clones: run `bd dolt pull` once to pick up the new sync, or
re-clone (`bd bootstrap` auto-detects canonical).
```

Show the diff and proposed commit to user BEFORE pushing. Push is the point of no easy return.

---

## Phase 9 — Tell the user what's next

After push, hand off:

- **Peer clones** need to run `bd dolt pull` once to pick up the migration. Or re-clone (`bd bootstrap` auto-detects canonical mode).
- **Daily flow:** `bd dolt push` after bead work; `bd dolt pull` after `git pull`. Both safe to run anytime — no-ops when in sync.
- **Verification:** `bd dolt push` is also the divergence verifier (no chunks transferred = clean). Do NOT use `bd dolt status` — it reports only engine info, nothing about sync state.
- **Failed pushes:** `bd dolt push` failures surface clearly on stderr (auth, network, divergence). If divergence: usually `bd dolt pull` first, then re-push.

---

## HITL escalation triggers

Stop and surface to user when any of these fire:

- `bd --version` below 1.0.4
- `dolt_mode` is `server` (different migration path, out of scope)
- Working tree dirty
- `bd dolt remote add` doesn't take effect (wrong-path quirk) — let user fix `.beads/config.yaml` directly
- `bd dolt push` fails
- `git ls-remote origin refs/dolt/data` empty after push
- AGENTS.md / CLAUDE.md has heavy user customization in the beads section
- Custom JSONL-discipline scripts found and user hasn't confirmed disposition
- Any verification step in Phase 7 fails
- Working tree becomes unexpectedly dirty mid-migration

---

## Notes

- **This command is interim.** Once all active repos have migrated, this can be removed from the plugin. Until then it's safe to leave installed (idempotent, exits early on already-canonical repos).
- **Don't run this in dm-work or other meta-repos.** It's for project repos using beads for task tracking, not the marketplace itself.
- **If beads later adds `bd migrate` upstream:** prefer that command. This is a stopgap.

## Related

- `dm-work:repo-init` Step 8 — canonical mode init for new repos
- For sync mode detection: `bd dolt remote list` (canonical → has remote) vs `git ls-files .beads/issues.jsonl` (legacy → tracked)
- For worktree behavior under canonical mode: `bd worktree` operates without JSONL discipline; Dolt state lives in `refs/dolt/data` on origin
- Upstream [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
- Upstream [DOLT.md](https://github.com/gastownhall/beads/blob/main/docs/DOLT.md)

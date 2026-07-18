---
description: "INTERIM: one-time migration from legacy JSONL-in-git beads sync to canonical refs/dolt/data sync. Idempotent, safe to re-run. Remove this command once all active repos have migrated."
argument-hint: "[--dry-run]"
---

# Migrate beads to canonical refs/dolt/data sync

Migrate a legacy-mode beads repo (where `.beads/issues.jsonl` is committed and serves as cross-clone transport) to upstream's canonical mode (where `refs/dolt/data` on the git remote is the sync channel and JSONL is a passive local export).

Source of truth: [upstream SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md).

**Reversibility:** Migration is reversible until Phase 2.2 (`bd dolt push` to origin). After that point, peers can observe `refs/dolt/data` on origin even if you abort the migration commit locally. Plan accordingly.

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
git worktree list                              # surface sibling worktrees
```

If working tree is dirty: stop. Don't mix migration with other work.

**Multi-agent / multi-worktree quiescence.** Migration mutates `.beads/embeddeddolt/` and `.beads/hooks/` — both shared across all worktrees. If sibling worktrees exist, confirm with the user that other agents are quiesced and have no unflushed bd mutations. If unsure, stop.

**Where to run.** Prefer a dedicated worktree (e.g. `.worktrees/tooling-beads-migrate/`) over primary. Mutating work belongs in worktrees per the project convention; migration is no exception.

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

   **Note on config.yaml propagation.** If `.beads/config.yaml` is gitignored in this repo (check `git check-ignore .beads/config.yaml`), the `sync.remote` setting does not propagate via git. Peer clones must either run `bd dolt remote add origin <url>` themselves or rely on `bd bootstrap` (which auto-detects `refs/dolt/data` on origin and sets the remote). Covered in Phase 10.

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

With `export.auto=false`, the beads-managed pre-commit hook reads config at runtime and skips the JSONL auto-export. Refresh shims after surfacing any custom patches first.

**Preflight — surface custom patches inside BEADS markers.** Some repos have applied repo-specific fixup patches to mitigate legacy-mode bugs (e.g., vellum's `DISABLED-BY-VELLUM-UNR` markers on post-merge / post-checkout). Force-install silently overwrites these.

```bash
grep -lE 'DISABLED-BY-|# (vellum|strike|[a-z-]+):' .beads/hooks/* 2>/dev/null
```

For each hit, surface the patch to the user. Most are obsolete under canonical mode (they were patching legacy-mode bugs that no longer apply). Ask the user to confirm the patches are obsolete before proceeding. Do NOT force-install if the user hasn't acknowledged the patches.

Once cleared, refresh shims:

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

Real repos have a superset of any list this skill could enumerate. Sweep liberally — surface everything `bd-*`-shaped or hook-shaped for user disposition. Err on showing too much, not too little; a missed legacy script becomes silent technical debt the user can't easily find later.

```bash
# Custom scripts under scripts/
ls scripts/bd-* 2>/dev/null

# Justfile recipes referencing bd-* helpers
grep -E '\bbd-[a-z-]+' justfile 2>/dev/null | grep -v '^#'

# Custom hooks (anything beyond the beads-managed marker blocks)
ls .beads/hooks/ 2>/dev/null | grep -v -E '^(README|\.gitignore)$'
```

Typical legacy-mode artifacts that should be deleted:
- Per-bead-scope guards (`bd-export-owned`, `bd-jsonl-guard`, `bd-sync-import`, `bd-audit`, `install-<repo>-hooks`)
- Justfile recipes wrapping the above (`just bd-export-owned`, `just bd-sync-import`, `just bd-audit`)
- Custom `commit-msg` enforcing JSONL bead-id scope
- Custom `post-merge` / `post-checkout` / `post-rewrite` doing `bd-sync-import --auto`
- `prepare-commit-msg` / `post-commit` automation for JSONL auto-export-on-message-parse
- `.beads/hooks/<event>` files with `DISABLED-BY-<repo>` no-op patches (Phase 4 should have already flagged these)

For each item: ask user **delete / archive / keep**. Default recommendation: delete.

If the user keeps any, warn that the scripts will silently no-op or misbehave under canonical mode (e.g., `bd-export-owned` will write a JSONL that's gitignored; custom commit-msg guards will run against empty staged diffs).

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

- **Peer clones** must run the Phase 10 playbook (NOT just `bd dolt pull`). Their pre-existing `.beads/embeddeddolt/` has no shared history with origin's freshly-created `refs/dolt/data`, so a plain `bd dolt pull` either diverges or no-ops without reconciling. Send peers the Phase 10 instructions.
- **Daily flow** (after Phase 10 on each clone): `bd dolt push` after bead work; `bd dolt pull` after `git pull`. Both safe to run anytime — no-ops when in sync.
- **Verification:** `bd dolt push` is also the divergence verifier (no chunks transferred = clean). Do NOT use `bd dolt status` — it reports only engine info, nothing about sync state.
- **Failed pushes:** `bd dolt push` failures surface clearly on stderr (auth, network, divergence). If divergence: usually `bd dolt pull` first, then re-push.

---

## Phase 10 — Peer clone playbook (after sender pushes)

After the migration lands on origin, peer clones need to migrate their own local state. Their pre-existing `.beads/embeddeddolt/` has NO shared history with origin's freshly-created `refs/dolt/data`. The fix is to rename the old local Dolt aside and let `bd bootstrap` hydrate fresh from `refs/dolt/data`.

**⚠️ This step discards any local-Dolt state not also in `refs/dolt/data`.** Peers with unflushed local bead mutations will lose them. Run the preflight first.

### Preflight (mandatory — skipping risks silent data loss)

```bash
# 1. Inspect local state vs JSONL/Dolt
git status --short .beads/                 # any uncommitted bd-related changes?
bd ready                                   # what does local Dolt currently think is open?

# 2. Working tree clean
git status --short

# 3. No active sibling worktrees
git worktree list                          # if other worktrees present, quiesce them first

# 4. Fetch the migration's refs/dolt/data WITHOUT importing — to inspect divergence
git fetch origin "refs/dolt/data:refs/dolt/data-incoming" 2>&1
git log --oneline refs/dolt/data-incoming  # peek at the incoming history
```

If `bd ready` shows beads in states (closed / claimed / updated) that won't survive a re-bootstrap from origin: STOP. Sender side should `bd dolt push` from a clone that has those mutations, OR the peer should manually port them (open / close / update the relevant beads after bootstrap). Don't run the playbook with unflushed state.

### Playbook

```bash
# 1. Tidy and align
git checkout main && git pull --ff-only

# 2. Refresh hooks BEFORE bootstrap. Hooks operate on git, not Dolt — safe pre-bootstrap;
#    running them first means the post-bootstrap state is clean immediately.
just hooks                                 # or: bd hooks install --force --beads

# 3. Rename old local Dolt aside (preserves it as recovery insurance)
mv .beads/embeddeddolt .beads/embeddeddolt.pre-migration

# 4. Hydrate fresh from refs/dolt/data
bd bootstrap --yes

# 5. Verify
bd dolt remote list                        # should show origin <git-url>
bd ready                                   # should match expectations (peer-side)
bd dolt push                               # should be no-op ("Push complete." with no chunks)
```

### Cleanup (after verification)

```bash
# Once confident the hydrated Dolt is correct, remove the preserved copy
rm -rf .beads/embeddeddolt.pre-migration

# Also clean up the inspection ref from preflight
git update-ref -d refs/dolt/data-incoming 2>/dev/null || true
```

Leave the `.pre-migration` directory in place for at least a few days as recovery insurance — disk cost is minimal and reverting is easy if something looks off later.

---

## HITL escalation triggers

Stop and surface to user when any of these fire:

- `bd --version` below 1.0.4
- `dolt_mode` is `server` (different migration path, out of scope)
- Working tree dirty
- Sibling worktrees present and sender can't confirm they're quiesced
- Custom patches detected inside BEADS markers (`DISABLED-BY-*`, `# <repo>:`) and user hasn't acknowledged
- `bd dolt remote add` doesn't take effect (wrong-path quirk) — let user fix `.beads/config.yaml` directly
- `bd dolt push` fails
- `git ls-remote origin refs/dolt/data` empty after push
- AGENTS.md / CLAUDE.md has heavy user customization in the beads section
- Custom JSONL-discipline scripts found and user hasn't confirmed disposition
- Any verification step in Phase 7 fails
- Working tree becomes unexpectedly dirty mid-migration

**Peer side (Phase 10):**
- `bd ready` shows local Dolt state that wouldn't survive a re-bootstrap from origin — peer has unflushed mutations
- `git fetch refs/dolt/data:refs/dolt/data-incoming` fails
- `bd bootstrap --yes` fails or produces unexpected state

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

# Beads Dolt Upgrade: Decision & Migration Guide

**Date:** 2026-03-04 (updated 2026-03-13 for 0.60)
**Status:** Decided — upgrade to beads 0.60+

---

## Why We Use Beads

Beads provides three things nothing else gives us:

1. **Dependency graphs** — `blocked_by` relationships between issues, with `bd ready` surfacing only unblocked work
2. **Activation power** — `bd prime` injects full workflow context before compaction, preventing context loss
3. **Cross-session persistence** — issues survive `/clear`, compaction, and session rotation without any human bookkeeping

These aren't nice-to-haves. They're load-bearing for the orchestrator/subagent workflow.

---

## What Changed (0.58)

Beads 0.58 removed SQLite entirely. The storage backend is now **Dolt** — a version-controlled SQL database.

| Before (≤0.49) | After (0.58+) |
|-----------------|---------------|
| SQLite file: `.beads/beads.db` | Dolt database: `.beads/dolt/` |
| `bd sync` pushes via git refs | `bd dolt push` pushes via `refs/dolt/data` |
| Manual `bd import` after corruption | Dolt journal can corrupt if CLI used while server runs (see Troubleshooting) |
| `bd sync` (bidirectional) | `bd dolt push` / `bd dolt pull` (explicit direction) |

The `bd sync` command does not exist in 0.59+. All remote operations go through `bd dolt push` and `bd dolt pull`. As of 0.60, these auto-commit pending changes before executing, so explicit `bd dolt commit` is no longer needed.

---

## The Dolt Sidecar

Each repo with beads gets its own Dolt SQL server. It's managed automatically:

- **Starts on demand** — first `bd` command spins it up
- **Idle timeout** — kills itself after 30 minutes of inactivity
- **Concurrency** — max 3 concurrent servers across your machine
- **Binary size** — ~100MB (installed via `brew install dolt`)
- **Disk usage** — `.beads/dolt/` directory, typically small (< 10MB for most projects)

You don't manage the server. Beads handles start/stop. If a server is already running for a repo, subsequent `bd` commands reuse it.

---

## Dolt Remotes

Dolt remotes piggyback on your existing git remote. Data is stored under `refs/dolt/data` in the same git repo — no separate database server, no new credentials.

**When you need remotes:**
- Multi-machine work (laptop + desktop sharing beads state)
- Multi-developer collaboration on the same beads issues
- CI/CD that reads or writes beads state

**When you don't need remotes:**
- Single-machine, single-developer projects
- Projects where beads is local-only scratchpad

**Setup** (manual — beads does not auto-detect your git remote):
```bash
# Add the remote (git+ssh:// form of your git remote URL)
bd dolt remote add origin "git+ssh://git@github.com/<owner>/<repo>.git"

# Push/pull explicitly:
bd dolt push
bd dolt pull
```

The remote uses `git+ssh://` transport, so existing SSH keys and GitHub access work without additional config.

---

## Hybrid: Beads + External Tracker

Beads and external trackers serve different audiences at different granularities:

| | Beads | External Tracker (Linear, Jira, etc.) |
|---|-------|---------------------------------------|
| **Audience** | Agents (Claude, subagents) | Humans (developers, PMs, stakeholders) |
| **Granularity** | Task-level (atomic, agent-completable) | Epic/milestone-level (cross-team, multi-session) |
| **Speed** | Local, instant, no network roundtrip | API call per operation |
| **Dependencies** | First-class (`blocked_by`, `bd ready`) | Varies (Linear has relations, GH Issues doesn't) |
| **Persistence** | Git refs (survives push/pull) | Cloud |

### Plan: Linear sync bridge (preferred)

Beads 0.58 ships with `bd linear sync` — a bidirectional sync bridge with priority/state/label mapping built in:

```bash
# Configure
bd config set linear.api_key "$LINEAR_API_KEY"
bd config set linear.team_id "$LINEAR_TEAM_ID"

# Sync
bd linear sync --pull    # import from Linear
bd linear sync --push    # export to Linear
bd linear sync           # bidirectional
bd linear sync --dry-run # preview
```

This replaces the manual bridge pattern — agents work beads locally, `bd linear sync` keeps the human-facing tracker in step. Priority mapping, state mapping, and relation types are all configurable.

Beads also has `bd jira sync` and `bd gitlab` integrations with similar patterns.

### Fallback: manual bridge via `--external-ref`

If the Linear sync doesn't work out (or for repos using GitHub Issues/Projects where no sync bridge exists):

- Use `--external-ref` on beads to link to an external issue: `bd create --title="..." --external-ref="gh:owner/repo#42"`
- Use labels or automation on the external tracker to mark which issues have active beads work
- Agents work beads; humans work the external tracker. Neither needs to touch the other's system directly.

---

## Migration Steps

### 1. Install Dolt

```bash
brew install dolt
```

Verify: `dolt version` should print a version string.

### 2. Upgrade Beads

```bash
# Whichever install method you used:
brew upgrade steveyegge/beads/bd
# or: npm update -g @beads/bd
# or: go install github.com/steveyegge/beads/cmd/bd@latest
```

Verify: `bd --version` should show 0.60+.

### 3. Initialize Per Repo

Run `bd init` in each repo. This creates a fresh dolt database:

```bash
cd your-repo
bd init
```

**Issues are NOT auto-migrated.** The old `issues.jsonl` is still on disk but 0.58 has no `import` command. If this repo has open issues you need to preserve, re-create them manually before deleting the old data:

```bash
# Check what you had
cat .beads/issues.jsonl | python3 -c "
import json, sys
for line in sys.stdin:
    i = json.loads(line)
    if i.get('status') in ('open', 'in_progress'):
        print(f'[{i[\"status\"]}] {i[\"id\"]} — {i[\"title\"]}')"

# Re-create important ones manually
bd create --title="..." --type=task --priority=2 -d "..."
```

For repos with many open issues, script the re-creation from the jsonl. For repos with only closed issues, no action needed — the history lives in git.

The old `.beads/beads.db*` files are no longer used. You can delete them after verifying migration succeeded.

### 4. Configure Dolt Remote

Beads does **not** auto-detect your git remote. You must add it manually:

```bash
# Format: git+ssh:// version of your git remote
bd dolt remote add origin "git+ssh://git@github.com/<owner>/<repo>.git"

# First push must be forced to establish common ancestor
bd dolt push --force

# Verify roundtrip
bd dolt pull
bd dolt push    # should work without --force now
```

This uses `refs/dolt/data` in the same git repo — no separate server or credentials needed. Your existing SSH keys work.

Skip this step if you only need beads locally (single machine, no sharing).

### 5. Update .gitignore

Beads 0.58+ creates `.beads/.gitignore` automatically to exclude `dolt/` and runtime files. Verify it exists:

```bash
cat .beads/.gitignore
```

### 6. Discard `bd init` Artifacts

`bd init` generates an `AGENTS.md` and appends to `.gitignore`. If your repo already has these, discard the generated versions:

```bash
# If you already have AGENTS.md
rm AGENTS.md  # or: git checkout AGENTS.md

# If .gitignore was modified unnecessarily
git checkout .gitignore
```

Note: `bd init` injects a `<!-- BEGIN BEADS INTEGRATION -->` block into AGENTS.md. If your AGENTS.md already has beads instructions, you'll get duplicates. The injected block may reference stale commands. Remove manually. Be aware `bd doctor --fix` re-injects it, so you may need to remove it again after running doctor.

### 7. Clean Up Legacy Artifacts

The old beads created worktrees and branches that 0.58 no longer uses:

```bash
# Remove orphaned beads-sync worktree and branch
git worktree remove --force .git/beads-worktrees/beads-sync 2>/dev/null
git branch -D beads-sync 2>/dev/null
git push origin --delete beads-sync 2>/dev/null  # if pushed to remote
rmdir .git/beads-worktrees 2>/dev/null            # if empty

# Old SQLite and daemon files (harmless but noisy)
# bd doctor --fix cleans some of these
# .beads/.gitignore excludes all legacy files from git
```

### 8. Replace `bd sync` in Scripts/Docs

Replace any `bd sync` references with `bd dolt push` in automation, AGENTS.md, or workflow docs. `bd sync` does not exist in 0.59+. As of 0.60, `bd dolt push` auto-commits pending changes, so `bd dolt commit && bd dolt push` can be simplified to just `bd dolt push`.

---

## Troubleshooting

### Journal corruption from concurrent CLI + SQL server writes

**Symptom:** `invalid journal record length` errors, `dolt fsck` reports corruption.

**Cause:** Using `dolt` CLI commands directly while the beads-managed SQL server is running. The CLI and server write to the same journal concurrently, corrupting it. This does **not** self-heal.

**Prevention:** Never use raw `dolt` CLI commands while the SQL server is running. Use `bd dolt push` / `bd dolt pull` instead — they route through the server. If you must use the CLI, kill the server first:

```bash
kill $(cat .beads/dolt-server.pid)
```

**Recovery:**
```bash
# 1. Kill the server
kill $(cat .beads/dolt-server.pid)

# 2. Try journal repair (may lose uncommitted data)
cd .beads/dolt/os && dolt fsck --revive-journal-with-data-loss

# 3. If repair fails, clone fresh from remote
cd .beads/dolt
rm -rf os
dolt clone <remote-url> os
```

After clone recovery, `bd dolt push` will fail with "no common ancestor". Fix with a one-time force push:
```bash
bd dolt push --force   # re-establishes common ancestor
bd dolt push           # works normally after this
```

### "no common ancestor" on push

Usually happens after a fresh `bd init` or clone recovery. The local and remote tracking refs haven't been linked yet.

**Fix:** `bd dolt push --force` (one-time). Regular pushes work after.

### Claude Code sandbox blocks dolt connections

**Symptom:** `bd ready` fails with "port is in use by a non-dolt process" or `connect: operation not permitted`, but `bd dolt status` shows the server is running fine. Commands work with `dangerouslyDisableSandbox: true`. (Prior to 0.60, this referenced port 3307; now beads uses OS-assigned ephemeral ports.)

**Cause:** Claude Code's sandbox and permissions are **two independent security layers**. Even in `bypassPermissions` mode, the OS-level sandbox blocks TCP connections to localhost because it isn't in the network allowlist. Beads misdiagnoses the blocked connection as a port conflict with a non-dolt process.

**Fix options:**
1. **Disable sandbox** — Run `/sandbox` and select "No Sandbox". If you're already running `bypassPermissions` + `skipDangerousModePermissionPrompt`, the sandbox isn't adding meaningful protection and is only creating friction with dolt.
2. **Add localhost to allowlist** — If you want to keep the sandbox, add `127.0.0.1` to the network allowlist via `/sandbox` overrides.

---

## Impact on Sandboxing (srt)

If you use srt for autonomous Claude runs and need beads remote push:
- GitHub access is still required (`github.com`, `*.github.com` in allowlist)
- The transport is `git+ssh://` under `refs/dolt/data` — same network path as before
- If you skip remote push in sandbox, review beads state manually after the run

---

## What We're NOT Doing

- **Not pinning to 0.49 anymore** — the SQLite corruption issues (`no such column: spec_id`) made pinning a liability, not an asset
- **Not running a shared Dolt server** — per-repo sidecar is simpler and sufficient for our single-developer workflow (though 0.60 adds shared server mode via `BEADS_DOLT_*` env vars if needed for multi-agent setups)
- **Not replacing beads with GitHub Issues** — they serve different purposes (see hybrid section above)

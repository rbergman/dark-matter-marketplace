# Beads Dolt Upgrade: Decision & Migration Guide

**Date:** 2026-03-04
**Status:** Decided — upgrade to beads 0.58+

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
| Manual `bd import` after corruption | Dolt handles integrity natively |
| `bd sync` (bidirectional) | `bd dolt push` / `bd dolt pull` (explicit direction) |

The `bd sync` command still exists but is a **deprecated no-op**. All remote operations go through `bd dolt push` and `bd dolt pull`.

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

## Hybrid: Beads + GitHub Issues/Projects

Beads and GitHub Issues serve different audiences at different granularities:

| | Beads | GitHub Issues/Projects |
|---|-------|------------------------|
| **Audience** | Agents (Claude, subagents) | Humans (developers, PMs, stakeholders) |
| **Granularity** | Task-level (atomic, agent-completable) | Epic/milestone-level (cross-team, multi-session) |
| **Speed** | Local, instant, no network roundtrip | API call per operation |
| **Dependencies** | First-class (`blocked_by`, `bd ready`) | Labels/milestones (no dependency graph) |
| **Persistence** | Git refs (survives push/pull) | GitHub cloud |

**Bridge pattern:**
- Use `--external-ref` on beads to link to a GitHub issue: `bd create --title="..." --external-ref="gh:owner/repo#42"`
- Use GitHub labels or automation to track which issues have active beads work
- Agents work beads; humans work GitHub Issues. Neither needs to touch the other's system directly.

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

Verify: `bd --version` should show 0.58+.

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

# Test the roundtrip
bd dolt push
bd dolt pull
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

### 7. Replace `bd sync` in Scripts/Docs

Replace `bd sync` with `bd dolt push` in any automation, AGENTS.md, or workflow docs. `bd sync` is a no-op now.

---

## Impact on Sandboxing (srt)

If you use srt for autonomous Claude runs and need beads remote push:
- GitHub access is still required (`github.com`, `*.github.com` in allowlist)
- The transport is `git+ssh://` under `refs/dolt/data` — same network path as before
- If you skip remote push in sandbox, review beads state manually after the run

---

## What We're NOT Doing

- **Not pinning to 0.49 anymore** — the SQLite corruption issues (`no such column: spec_id`) made pinning a liability, not an asset
- **Not running a shared Dolt server** — per-repo sidecar is simpler and sufficient for our single-developer workflow
- **Not replacing beads with GitHub Issues** — they serve different purposes (see hybrid section above)

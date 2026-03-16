# Beads 0.61 + Git Backup Repo Update Prompt

Paste this prompt into a Claude Code session in any repo that needs updating.

---

## Prompt

You need to update this repo for beads 0.61 changes from the dark-matter-marketplace plugins.

### 1. Verify beads 0.61

```bash
bd --version   # should show 0.61.0+
```

If not on 0.61+, stop and tell the user to upgrade first (`brew upgrade steveyegge/beads/bd`).

### 2. Patch pre-commit hook for beads-backup branch

`bd backup export-git` creates a worktree commit on a `beads-backup` branch. If this repo has a pre-commit hook that runs quality gates (linting, tests, type checks), it will fail in the detached worktree context (no `node_modules`, wrong working directory, etc.).

**Check for a pre-commit hook:**
```bash
ls -la .git/hooks/pre-commit .husky/pre-commit 2>/dev/null
```

**If one exists, add a branch guard at the top** (after the shebang line):
```bash
# Skip hooks on beads backup branch
if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "beads-backup" ]; then
  exit 0
fi
```

This is safe — the `beads-backup` branch only contains JSONL backup snapshots, not code.

### 3. Switch from Dolt remotes to git backup

Beads 0.61 introduces `bd backup export-git` and `bd backup fetch-git` — a git-native sync mechanism that replaces Dolt remotes. Benefits:
- **Fast**: milliseconds via regular git (vs 10+ seconds for Dolt push)
- **Conflict-safe**: git merge on a dedicated `beads-backup` branch (vs non-fast-forward rejections)
- **Zero config**: auto-detects git remote (vs manual `bd dolt remote add`)

**Remove Dolt remote if configured (must run on every machine that uses this repo):**
```bash
bd dolt remote remove origin 2>/dev/null   # safe to run even if no remote
```

The Dolt remote config is local to each machine's `.beads/dolt/` database — it does not propagate via sync. If this repo is used on multiple machines, run the remove command on each one to avoid confusion.

**Verify git backup is active:**
```bash
bd backup status   # should show "enabled=true (auto: git remote detected)"
```

**Test the new sync flow (after hook patch):**
```bash
bd backup export-git    # should push to beads-backup branch
bd backup fetch-git     # should fetch and restore (idempotent)
```

### 4. Update steering files

Search AGENTS.md, CLAUDE.md (check if symlinked or independent copy), justfile, .claude/rules/, and .claude/projects/*/memory/ files for these patterns:

| Find | Replace with |
|------|-------------|
| `bd dolt push` | `bd backup export-git` |
| `bd dolt pull` | `bd backup fetch-git` |
| `bd dolt commit && bd dolt push` | `bd backup export-git` |
| `bd dolt commit` (standalone) | Remove — auto-commit handles this |
| `bd dolt remote add origin "git+ssh://..."` | Remove — git backup auto-detects remote |
| Dolt clone recovery patterns (`bd dolt stop; dolt clone; bd dolt start`) | `bd backup fetch-git` |
| References to "Dolt Sync" section headers | Rename to "Sync (Git Backup)" |
| "Syncs via Dolt remote (push/pull)" | "Syncs via git backup branch (fast, conflict-safe)" |
| "Push beads to remote" | "Sync beads state to git" |
| Version references "0.60+" | Update to "0.61+" where appropriate |

**AGENTS.md vs CLAUDE.md:** Check whether these are symlinked, hardlinked, or independent copies. If symlinked (`CLAUDE.md -> AGENTS.md`), only edit AGENTS.md. If independent, update both.

Also update session-end patterns:
```
# Old:
bd dolt push
git push

# New:
bd backup export-git
git push
```

And session-start patterns:
```
# Old:
bd dolt pull
bd ready

# New:
bd backup fetch-git
bd ready
```

### Troubleshooting: UUID migration failure

If `bd backup fetch-git` (or any `bd` command) fails with a UUID primary keys migration error, the local Dolt database is likely corrupt — especially if the repo experienced journal corruption before upgrading to 0.61. Don't try to fix the migration; nuke and restore:

```bash
# Kill any running Dolt server
kill $(cat .beads/dolt-server.pid 2>/dev/null) 2>/dev/null

# Move corrupt database aside
mv .beads/dolt .beads/dolt-corrupt

# Reinitialize
bd init --force --prefix <project-prefix>

# Restore from JSONL backup (local .beads/backup/ files)
bd backup restore

# Then pull authoritative state from git
bd backup fetch-git

# Verify
bd backup status
bd ready
```

The git backup branch (`beads-backup`) has authoritative state. After restore, you can delete `.beads/dolt-corrupt`.

### 5. Add new 0.61 features to workflow guidance

If this repo's AGENTS.md has a beads workflow section, consider adding:
- `bd close <id> --claim-next` — atomic close-and-claim for continuous work
- `bd create --no-history` — skip Dolt commits for ephemeral/high-frequency beads
- `bd create --skills="skill1,skill2"` — attach relevant skills to issues
- `bd create --context="key=value"` — attach context metadata to issues

### Instructions

1. Patch the pre-commit hook first (step 2) — everything else depends on `bd backup export-git` working
2. Search for all patterns listed above across the repo (AGENTS.md, CLAUDE.md, justfile, .claude/rules/, .claude/projects/*/memory/)
3. Check AGENTS.md ↔ CLAUDE.md relationship (symlink? independent?) and update accordingly
4. Make the replacements — be conservative, only change beads-related patterns
5. Remove any Dolt remote configuration instructions
6. Test `bd backup export-git` roundtrip
7. Commit: `git commit -m "Update beads integration for 0.61 — switch to git backup sync"`
8. Push: `git push`

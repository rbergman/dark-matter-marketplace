---
description: Pre-merge checklist for worktree branches. Ensures quality gates, review, and beads are complete before merging.
argument-hint: "[branch-name] or empty for current branch"
---

# Merge Pre-Flight

Arguments: $ARGUMENTS

## Pre-Flight Checklist

Before merging, verify ALL of these:

### 1. Branch Verification
- Confirm current branch: `git branch --show-current`
- Confirm target branch (usually main): ask user if unclear
- Confirm with user: "Merging [source] into [target]. Proceed?"

### 2. Quality Gates
- Run `just check` or `npm run check` (project-appropriate gate)
- ALL gates must pass. No exceptions, no --no-verify.

### 3. Review
- Has `/review` been run since last significant change?
- If not, run it now or ask user if they want to skip

### 4. Beads
- Check for open beads on this branch: `bd list --status=in_progress`
- All branch-related beads should be closed or explicitly deferred
- If open beads remain, confirm with user before proceeding

### 5. User Approval
- Present summary: branch, passing gates, review status, bead status
- **Wait for explicit user approval before executing merge**

## Lint-Staged & Merge Commits

Merge commits can stage dozens of files through prettier/lint-staged, creating formatting churn and false lint errors in previously-clean files. Handle this:

- If lint-staged is configured and the merge stages many files, check for `MERGE_HEAD` before running formatting:
  ```bash
  # In pre-commit hook or lint-staged config
  if [ -f .git/MERGE_HEAD ]; then
    echo "Merge commit — skipping lint-staged formatting. Run npm run check post-merge."
    exit 0
  fi
  ```
- Document this pattern in per-repo AGENTS.md if the repo uses lint-staged + prettier
- Validation (typecheck, lint errors) should still run post-merge via `npm run check` — only skip formatting during the merge commit itself

## Execute Merge

Only after ALL checks pass AND user approves:

```bash
git checkout <target>
git merge <source> --no-ff
```

## Post-Merge

- Run quality gates again on the merged result
- If conflicts arose and were resolved, run gates again
- **Clean up worktree and branch** (mandatory for worktree-based work):
  ```bash
  # Remove the worktree
  bd worktree remove <name>   # or: git worktree remove <path>
  # Delete the merged branch
  git branch -d <source-branch>
  ```
  Prompt user for confirmation before cleanup, but don't skip it — stale worktrees and merged branches create confusion in future sessions.
- **Suggest post-merge review:**
  After a successful merge, suggest: "Run `/dm-work:post-merge` to review the merged code?"
  This is advisory — the user decides. Post-merge review runs the review pipeline + evaluator on the merged diff and files findings as beads for next-session triage.

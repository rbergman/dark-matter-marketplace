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

## Execute Merge

Only after ALL checks pass AND user approves:

```bash
git checkout <target>
git merge <source> --no-ff
```

## Post-Merge

- Run quality gates again on the merged result
- If conflicts arose and were resolved, run gates again
- Delete worktree if applicable (with user approval): `bd worktree remove <name>`

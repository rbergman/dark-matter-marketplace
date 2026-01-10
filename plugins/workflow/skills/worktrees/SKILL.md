---
name: worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Git Worktrees

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

---

## When to Use

- Parallel subagents need filesystem isolation
- Feature work that shouldn't affect current workspace
- Separate builds/servers running simultaneously
- Before executing implementation plans

---

## Directory Selection

### Priority Order

1. **Existing directory** — Check for `.worktrees/` or `worktrees/`
2. **CLAUDE.md preference** — Check for documented convention
3. **Ask user** — If neither exists

```bash
# Check existing
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

If both exist, `.worktrees/` wins.

---

## Safety Verification

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null
```

**If NOT ignored:**
1. Add to `.gitignore`
2. Commit the change
3. Then proceed

**Why:** Prevents accidentally committing worktree contents.

---

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Create with new branch
git worktree add .worktrees/$BRANCH_NAME -b $BRANCH_NAME
cd .worktrees/$BRANCH_NAME
```

### 3. Run Project Setup

Auto-detect and run:

```bash
# Node.js
[ -f package.json ] && npm install

# Rust
[ -f Cargo.toml ] && cargo build

# Go
[ -f go.mod ] && go mod download

# Python
[ -f requirements.txt ] && pip install -r requirements.txt
[ -f pyproject.toml ] && poetry install
```

### 4. Verify Clean Baseline

```bash
npm test        # or cargo test, go test ./..., pytest
```

**If tests fail:** Report failures, ask whether to proceed.
**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

---

## Beads Integration

For parallel work with beads:

```bash
# In worktree, beads state is shared via sync-branch
bd ready        # Shows same beads as main workspace
bd claim <id>   # Claims in shared state
```

**sync-branch:** `beads-sync` shares issue state across worktrees.

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report + ask before proceeding |

---

## Cleanup

When done with worktree:

```bash
cd ..                              # Exit worktree
git worktree remove .worktrees/$BRANCH_NAME
git branch -d $BRANCH_NAME         # If merged
```

Or use `dm-work:finishing-branch` skill for guided cleanup.

---

## Anti-Patterns

| Don't | Why |
|-------|-----|
| Skip ignore verification | Worktree contents pollute git status |
| Assume directory location | Violates project conventions |
| Proceed with failing baseline tests | Can't distinguish new bugs from existing |
| Skip project setup | Missing deps cause confusing failures |

---

## Example

```bash
# Verify ignored
git check-ignore -q .worktrees || (echo '.worktrees/' >> .gitignore && git add .gitignore && git commit -m "Ignore worktrees directory")

# Create worktree
git worktree add .worktrees/feature-auth -b feature-auth
cd .worktrees/feature-auth

# Setup
npm install

# Verify baseline
npm test
# ✓ 47 tests passing

# Ready to work
```

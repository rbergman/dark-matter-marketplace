---
description: Create a session snapshot for handoff, recovery, or reset
argument-hint: "[special instructions for next session]"
---

Generate a high-fidelity session snapshot for context rotation. Output to terminal (NOT to a file). The goal: a fresh session reading this snapshot should be able to pick up work with zero information loss.

Arguments: $ARGUMENTS

If the user provided arguments, treat them as special instructions — things to emphasize, carry forward, or do differently in the next session. Include them prominently in the snapshot under "Handoff Instructions."

## What to Capture

### 1. Gather State (do this BEFORE writing anything)

```bash
# Git state
git branch --show-current
git status --short
git log --oneline -10

# Worktree info (if applicable)
git worktree list 2>/dev/null

# Beads state
bd list --status=in_progress 2>/dev/null
bd ready 2>/dev/null
bd blocked 2>/dev/null
```

Read any active plan docs, design docs, or specs referenced in conversation.

### 2. Write the Snapshot

Use this template. **Every section is required** — if a section doesn't apply, write "N/A" rather than omitting it. Omitted sections cause information loss.

---

```markdown
# Session Snapshot

**Workspace:** `<absolute path>` | **Branch:** `<branch>`
**Worktree:** `<worktree path>` or "main repo"

## Handoff Instructions

<If user provided $ARGUMENTS, put them here prominently.>
<If no arguments, write: "No special instructions.">

## Worktree Rules

<If in a worktree:>
You are working in a git worktree. DO NOT merge until user gives explicit sign-off.

- Worktree: <absolute path>
- Branch: <branch name>
- Main repo: <absolute path>

Workflow: implement → quality gates → commit → STOP → wait for user approval → only then merge/cleanup.

<If not in a worktree: "N/A — working in main repo.">

## Active Work

Epic/Issue: <bead ID + title>
Design doc: <path(s) to plans, specs, or reference docs>
Quality gates: <project-specific command, e.g., `npm run check`, `just check`>

| Phase | Task ID | Title | Status |
|-------|---------|-------|--------|
| ... | ... | ... | ... |

Progress: X/Y tasks complete.

## Conversation Context

**This section is critical.** Capture the ephemeral understanding built during this session that isn't recorded anywhere else:

- **Decisions made**: What was decided and why. Include trade-offs discussed.
- **Understanding built**: Mental models, architecture insights, or domain knowledge that emerged during conversation.
- **User preferences expressed**: How the user wants things done, style preferences, things they pushed back on.
- **Approaches tried and failed**: What didn't work and why — prevent the next session from repeating mistakes.
- **Open questions**: Things discussed but not yet resolved. Be specific about what's unresolved and what the options are.

## Loose Ends

Things that should eventually be beads but aren't yet, or work that's in-flight but not captured in any artifact:

- <item: what it is, why it matters, what to do about it>
- <item: ...>

If there are no loose ends, write "None — all work tracked in beads."

## Recent Commits

<Last 5-10 commits on the current branch, one-line format>

## Git State

<Output of git status — staged, unstaged, untracked files>

## Ready Tasks

<Output of bd ready, with notes on parallelizability>

## Blocked Tasks

<Output of bd blocked, with notes on what's blocking>

## Key Files

<Files that are central to current work — the ones the next session needs to read first>

## Commands

### Quality gates
<exact commands to run>

### Beads
<relevant bd commands for current work>

## Pre-Merge Checklist

Before merging to main:
- [ ] Quality gates passing
- [ ] `/dm-work:review` or `/dm-team:review` for comprehensive review
- [ ] All beads closed for completed work
- [ ] `bd sync`

## Next Steps

<Ordered list of what to do next. Be specific — not "continue implementation" but "implement the validation logic in src/auth/validator.ts per the spec in docs/plans/auth-design.md, then run quality gates">
```

---

## Quality Criteria

Before outputting, verify:

| Check | Question |
|-------|----------|
| Cold start | Could a fresh session with zero history pick this up? |
| Decisions | Are all decisions from this session recorded? |
| Loose ends | Is everything not in beads captured here? |
| Specificity | Are next steps specific enough to act on immediately? |
| Paths | Are all file paths absolute? |
| State | Does git/beads state match what's described? |

If any check fails, add the missing information before outputting.

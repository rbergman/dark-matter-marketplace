---
description: Rotate the session — generate snapshot, save to disk, and prepare for /clear
argument-hint: "[special instructions for next session]"
---

Session rotation: capture current state, persist to disk, output for clipboard copy, then `/clear` and paste to resume.

Arguments: $ARGUMENTS

If the user provided arguments, treat them as special instructions for the next session. Include them prominently under "Handoff Instructions."

## Steps

### 1. Gather state

```bash
git branch --show-current
git status --short
git log --oneline -10
git worktree list 2>/dev/null
bd list --status=in_progress 2>/dev/null
bd ready 2>/dev/null
bd blocked 2>/dev/null
```

Read any active plan docs, design docs, or specs referenced in conversation.

### 2. Write the snapshot

Use this template. **Every section is required** — write "N/A" for sections that don't apply.

```markdown
# Session Snapshot — YYYY-MM-DD

**Workspace:** `<absolute path>` | **Branch:** `<branch>`
**Worktree:** `<worktree path>` or "main repo"

## Handoff Instructions

<$ARGUMENTS if provided, otherwise "No special instructions.">

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
Quality gates: <project-specific command>

| Phase | Task ID | Title | Status |
|-------|---------|-------|--------|
| ... | ... | ... | ... |

Progress: X/Y tasks complete.

## Conversation Context

**Critical section.** Capture ephemeral understanding not recorded elsewhere:

- **Decisions made**: What was decided and why.
- **Understanding built**: Architecture insights, domain knowledge that emerged.
- **User preferences expressed**: Style preferences, things pushed back on.
- **Approaches tried and failed**: What didn't work and why — prevent repeats.
- **Open questions**: Unresolved items with options.

## Loose Ends

Things not yet tracked in beads:

- <item: what it is, why it matters, what to do>

If none: "None — all work tracked in beads."

## Recent Commits

<Last 5-10 commits, one-line format>

## Git State

<git status output>

## Ready Tasks

<bd ready output with parallelizability notes>

## Blocked Tasks

<bd blocked output with notes on what's blocking>

## Key Files

<Files central to current work — read these first in next session>

## Commands

### Quality gates
<exact commands>

### Beads
<relevant bd commands>

## Pre-Merge Checklist

- [ ] Quality gates passing
- [ ] `/dm-work:review` or `/dm-team:review`
- [ ] All beads closed
- [ ] `bd sync`

## Next Steps

<Ordered, specific list — not "continue implementation" but "implement X in src/Y per spec Z, then run gates">
```

### 3. Save to disk

```bash
mkdir -p history
```

Write the snapshot to `history/snapshot.md` using the Write tool. Raw markdown, no code fences.

### 4. Sync beads

```bash
bd sync 2>/dev/null
```

### 5. Output to terminal

Output the full snapshot, then this footer:

```
---

**Session rotation ready.**

Snapshot saved to `history/snapshot.md`.

**To resume in a fresh session:**
1. `/copy` — copies the snapshot to your clipboard
2. `/clear` — clears the conversation
3. Paste the snapshot as your first message

The pasted snapshot becomes the new session's starting context.
```

## Recovery Priority

When a new session starts and BOTH a pasted snapshot and `history/snapshot.md` exist:

- **Pasted input wins.** It's more recent and may contain edits.
- The file on disk is a fallback for when clipboard is lost.
- After recovery from either source, delete the file: `rm -f history/snapshot.md`

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

---
description: Create a session snapshot for handoff, recovery, or reset
argument-hint: (no arguments)
---

Write a session snapshot directly to terminal output (NOT to a file).

The user will copy your output, run /clear, then paste it into the fresh session. This works for pre-compaction handoffs, post-compaction recovery, or session resets.

Include the following with high fidelity:

- current status and next steps
- any and all info about worktree and branch requirements
- that, if working on a worktree, you must not complete work on the worktree until i give a greenlight to merge and close

Use the following as a suitable template and level of detail.  If not working in a worktree, you should omit worktree-specific instructions.

---

# Session Snapshot

## Critical Worktree Requirements

You are working in a git worktree. DO NOT merge until user gives explicit sign-off.

Worktree: (absolute system path)
Branch: (required git branch name for all changes)
Main repo: (absolute system path to this repository)

Workflow:
1. Implement features in the worktree (if in a worktree)
1. Run quality gates: (project specific, eg `npm run check`)
1. Commit to branch
1. STOP - Inform user feature is ready for testing
1. WAIT for explicit user approval before ANY merge/cleanup
1. Only after "greenlight" or explicit approval: merge to main, push, cleanup

## Current Epic (or Issue) Status

Epic: (beads epic or issue id and summary)
Design doc: (any and all working reference docs, specs, plans, or other context)

| Phase | Task ID | Title                                      | Status            |
|-------|---------|--------------------------------------------|-------------------|
| 5     | (beads) | (summary                                 ) | (status)          |

Progress: X/Y subtasks complete

## Recent Commits on feature branch

(...)

## Git State

(...)

## Ready Tasks (note if can be run in parallel with subagents)

(...)

## Key Files

(...)

## Commands

### Quality gates (run before every commit)

(...)

### Beads commands

(...)

## Pre-Merge Checklist

Before merging to main, consider running:
- [ ] `feature-dev:code-reviewer` - Code review for bugs, security, quality
- [ ] `feature-dev:code-architect` - Architecture review for patterns, design

## Next Steps

(...)

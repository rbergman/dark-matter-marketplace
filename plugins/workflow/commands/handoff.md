---
description: Write a high-fidelity session handoff so a new session can pick up the current workstream
argument-hint: "[optional: specific instructions for the next session]"
---

Write a high-fidelity session handoff covering everything a new session needs to continue this workstream. Optimize for a fresh Claude opening this as the first message and being able to resume without re-reading the prior conversation.

If `$ARGUMENTS` is provided, weave those instructions into the handoff prominently.

**Before writing the handoff**: review in-progress beads and close any whose work is actually done. Run `bd list --status=in_progress` (filter to the current actor/branch if there's noise), then `bd close <id1> <id2> ...` for any that finished during this session. Stale `in_progress` state corrupts the next session's `bd ready` view and misleads the resumer about what's still active. If a bead is half-done, leave it open but note its real state in the handoff under section 1.

Cover, in order, only the sections that apply (skip rather than pad):

1. **Where we are** — current branch, worktree (if any), bead(s) in progress, last commit/state
2. **What we're doing and why** — the goal, the motivation, the success criteria
3. **What's been tried** — approaches taken, what worked, what was rejected and why; failed paths matter as much as the chosen one
4. **What's left** — concrete next steps, in order, with file paths
5. **Open questions / decisions pending** — anything blocked on a judgment call
6. **Gotchas** — non-obvious things the next session would otherwise have to rediscover (lint quirks, env requirements, flaky tests, surprising file relationships)
7. **Files in play** — the working set with a one-line note on each: what role it plays, what's been changed
8. **Quality state** — last gate run (when, what passed, what failed)
9. **Resume command** — the exact first action to take

Constraints:
- Be specific. File paths, bead IDs, function names, exact commands — not vague descriptions.
- Don't summarize the conversation. Capture *state and intent*, not history.
- If something is in beads already (`bd show <id>`), reference it rather than restating it.
- Aim for tight prose. Bullets and short paragraphs over walls of text.

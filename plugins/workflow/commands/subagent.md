---
description: Delegate implementation work to a subagent with appropriate profile, skills, and boundaries
argument-hint: "task description, bead ID, or additional context"
---

# Subagent Delegation

## 1. Infer Context (PRIORITY ORDER)

Arguments: $ARGUMENTS

**If no/incomplete args, check IN ORDER:**
1. **CONVERSATION FIRST** — Did we just discuss next steps? Phase summary? Task list? Bead IDs? **If yes, use that. Skip bd queries.**
2. In-progress beads — `bd list --status=in_progress`
3. Ready beads — `bd ready`

## 2. Auto-Select Profile & Skills

**Profile:** Match task domain → eg `game-developer`, `debugger`, `dx-optimizer`, or default `general-purpose`

**Skills:** Infer from language/task:
- TypeScript → `typescript-pro`
- Bug fix → `dm-work:debugging`
- New feature → TDD
- Refactoring → `solid-architecture`
- Entities → `data-oriented-architecture`

## 3. Generate Prompt

~~~
CONTEXT:
- Bead: <id> - <title>
- Workspace: <path>

PRIME DIRECTIVE: Grow complexity from simple working systems. Small, verifiable changes.

TASK: <specific description>
- What to create/modify
- Expected behavior
- Patterns to follow (reference files)

SKILLS: <list>
QUALITY GATE: npm run check

OWNERSHIP:
- OWN: <files to create/edit>
- READ ONLY: <reference files>

DELIVERABLES:
- Working code passing quality gates
- Do NOT commit or close beads
- Write detailed report to: history/subagent-reports/<bead-id>.md
- Return ONLY the minimal response format below

RESPONSE FORMAT (return ONLY this, nothing else):
```
STATUS: success | partial | failed
BEAD: <id>
FILES_CHANGED: <comma-separated list>
TESTS: <pass count> / <total> | skipped
SUMMARY: <1-2 sentences max>
COMMIT_MSG: <ready-to-use commit message, 1 line>
REPORT: history/subagent-reports/<bead-id>.md
```
~~~

## 4. Pre-Delegation Checklist (M+ tasks)

Before launching, verify against the orchestrator's pre-delegation checklist:
- [ ] Requirements mapped (every bead requirement has a prompt action)
- [ ] Correct architectural layer
- [ ] File ownership explicit (OWN/READ-ONLY are specific)
- [ ] Gate command named exactly
- [ ] Exit criteria unambiguous

If any check fails, fix the prompt first. Log catches to `history/checkpoint-effectiveness.log`.

## 5. Launch

```
Task(subagent_type="<type>", model="opus", description="<3-5 words>", prompt="<prompt>")
```

## 6. After Completion

**DO NOT read full report into context unless there's a problem.**

1. Parse the minimal response (STATUS, FILES, SUMMARY)
2. If STATUS=success AND task is M+:
   - Launch intent review subagent (see orchestrator skill: Post-Subagent Verification Step 1)
   - If VERDICT=accept, run quality gates: `just check` or `npm run check`
   - If VERDICT=rework, send gaps back to subagent
   - If gates pass, proceed to commit
3. If STATUS=success AND task is XS/S:
   - Run quality gates yourself: `just check` or `npm run check`
   - If gates pass, proceed to commit
4. If STATUS=partial|failed:
   - Read `history/subagent-reports/<bead-id>.md` for details
   - Fix or re-launch
5. Commit: `git add . && bd close <id> --reason "..." && git commit -m "<COMMIT_MSG from response>"`

**Log review outcomes** to `history/checkpoint-effectiveness.log` (see orchestrator skill: Checkpoint Effectiveness Tracking).

## Parallel Safety

- Non-overlapping file ownership per subagent
- YOU handle: index.ts, package.json, configs
- Consider worktrees for isolation (`dm-work:worktrees`)

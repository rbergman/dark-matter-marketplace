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
- Bug fix → `superpowers:systematic-debugging`
- New feature → TDD
- Refactoring → `solid-architecture`
- Entities → `data-oriented-architecture`

## 3. Generate Prompt

```
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

RESPONSE FORMAT (CRITICAL - return ONLY this, nothing else):
```
STATUS: success | partial | failed
BEAD: <id>
FILES_CHANGED: <comma-separated list>
TESTS: <pass count> / <total> | skipped
SUMMARY: <1-2 sentences max>
COMMIT_MSG: <ready-to-use commit message, 1 line>
REPORT: history/subagent-reports/<bead-id>.md
```
```

## 4. Launch

```
Task(subagent_type="<type>", model="opus", description="<3-5 words>", prompt="<prompt>")
```

## 5. After Completion (MINIMAL CONTEXT)

**DO NOT read full report into context unless there's a problem.**

1. Parse the minimal response (STATUS, FILES, SUMMARY)
2. If STATUS=success:
   - Run quality gates yourself: `just check` or `npm run check`
   - If gates pass, proceed to commit
   - If gates fail, read the report and fix or re-launch
3. If STATUS=partial|failed:
   - Read `history/subagent-reports/<bead-id>.md` for details
   - Fix or re-launch
4. Commit: `git add . && bd close <id> --reason "..." && git commit -m "<COMMIT_MSG from response>"`

**For thorough review:** Spawn a `superpowers:code-reviewer` subagent pointing at the report file instead of reviewing inline.

## Parallel Safety

- Non-overlapping file ownership per subagent
- YOU handle: index.ts, package.json, configs
- Consider worktrees for isolation (`superpowers:using-git-worktrees`)

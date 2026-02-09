---
description: Orchestrate multiple subagents in parallel or serial based on task dependencies and file ownership
argument-hint: "bead IDs, task list, or context for batch work"
---

# Multi-Subagent Orchestration

## 1. Identify Work Set (PRIORITY ORDER)

Arguments: $ARGUMENTS

**If no args, check IN ORDER:**

1. **CONVERSATION FIRST** — Scan for "Next Ready Work:", phase summaries, task tables, bead IDs. **If found, use that list. Do NOT query bd.**

2. **Only if conversation unclear:** `bd list --status=in_progress` then `bd ready`

**WRONG:** Running `bd ready` when conversation just listed "Next Ready Work (Phase 3): ywrw.4.8, ywrw.4.9..."
**CORRECT:** Extract work set from conversation, skip bd queries.

## 2. Analyze Parallelizability

| Condition | Strategy |
|-----------|----------|
| Independent files, no deps | PARALLEL |
| Same files touched | SERIAL |
| Dependency chain | SERIAL in order |
| Mixed | HYBRID (parallel sets, serial joins) |

## 3. Map Ownership

**For parallel, you MUST:**
- Assign exclusive files to each subagent
- Reserve for yourself: `index.ts`, `package.json`, configs, any shared files
- Consider worktrees if >2-3 parallel or risk of conflicts

Example:
```
Subagent A: OWN src/physics/asteroid.ts, READ src/entities/asteroid.ts
Subagent B: OWN src/rendering/asteroid.ts, READ src/entities/asteroid.ts
Orchestrator: src/entities/index.ts (merge exports after)
```

## 4. Launch

**PARALLEL:** Single message, multiple Task calls:
```
Task(...) Task(...) Task(...)
```

**SERIAL:** One at a time, commit between if needed.

**HYBRID:** Parallel independent sets → merge → serial dependent tasks.

**MODEL:** Always specify `model="opus"` for implementation subagents. Use `model="haiku"` only for exploration/search tasks.

Each subagent prompt follows `/subagent` template with:
- Explicit OWN/READ boundaries
- Report file path: `history/subagent-reports/<bead-id>.md`
- RESPONSE FORMAT requirement (minimal structured output)

## 5. Collect Results (CONTEXT-EFFICIENT)

**As each subagent completes:**

1. **Parse minimal response only** - STATUS, BEAD, FILES_CHANGED, SUMMARY, COMMIT_MSG
2. **DO NOT read reports into context** - they exist for debugging, not routine review
3. **Track in a simple table:**

```
| Bead | Status | Files | Summary |
|------|--------|-------|---------|
| n7vy.2 | success | game.ts, world.ts | Consolidated mines to World |
| 1s08.2 | success | game-renderer*.ts | Split into 5 sub-renderers |
```

4. **If all success:** Proceed to intent review
5. **If any failed:** Read ONLY that report, fix or re-launch

## 6. Intent Review (M+ tasks)

For M+ subagent returns, launch review subagents (can parallelize — one per returning subagent):

```
Task(subagent_type="general-purpose", model="opus", description="Review subagent output", prompt="
ROLE: Post-subagent intent reviewer.
TASK DESCRIPTION: <original task>
FILES CHANGED: <from response>
Run git diff to see the actual changes. Answer:
1. COVERAGE: full|partial|miss
2. DRIFT: none|minor|major
3. GAPS: <list or 'none'>
VERDICT: accept|rework
DETAIL: <1 sentence if rework>
")
```

- VERDICT=accept for all → proceed to merge
- Any VERDICT=rework → send gaps back, re-launch targeted fix
- Log outcomes to `history/checkpoint-effectiveness.log`

## 7. Merge & Complete (BATCH)

1. Merge shared files yourself (barrel exports, etc.)
2. Run quality gates yourself — MANDATORY: `just check` or `npm run check`
   - Do NOT skip this. Subagent summaries may be stale or incomplete.
3. Batch close and commit:
   ```bash
   bd close <id1> <id2> <id3> --reason "Parallel implementation"
   git add .
   git commit -m "feat: <combined summary from COMMIT_MSGs>"
   ```

## 8. Handle Failures

- Don't let one failure block parallel work
- Read failed subagent's report file for details
- Fix or re-launch failed subagent only
- If unexpected conflicts: revert one, re-run serial

## 9. Optional: Batch Code Review

If thorough review needed before commit:
```
Task(subagent_type="superpowers:code-reviewer", prompt="
Review changes from parallel subagents:
- Reports: history/subagent-reports/n7vy.2.md, history/subagent-reports/1s08.2.md
- Focus: integration issues, missed edge cases
- Return: PASS/FAIL + issues list (if any)
")
```

This keeps review work OUT of orchestrator context.

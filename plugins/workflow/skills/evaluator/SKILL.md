---
name: evaluator
description: Grade implementation work against bead acceptance criteria using a separate judge agent. Use after subagent work passes mechanical gates, as a pre-merge check, or on-demand to evaluate existing features. The evaluator is NOT the orchestrator and NOT the implementer — it only judges. Integrates with browser-qa for runtime verification when CDT MCP is available.
---

# Evaluator Protocol

Separate the agent doing work from the agent judging it. This is more tractable than making one agent self-critical.

## When to Invoke

The orchestrator calls the evaluator in these situations:

1. **Post-subagent, pre-merge** — after implementation passes mechanical gates AND either:
   - Browser-qa is available (CDT MCP connected + app running) — runtime evaluation
   - Acceptance criteria require runtime testing ("user can...", "page shows...", "form validates...")
2. **On-demand** — `evaluate <bead-id>` to test an existing feature against its criteria
3. **Post-merge** — `/dm-work:post-merge` runs evaluator against closed beads

**Skip evaluator when:**
- XS/S tasks without acceptance criteria
- Intent review returned COVERAGE: full, DRIFT: none, GAPS: none AND no browser-qa available
- Bead has no acceptance criteria (report to orchestrator, don't run empty evaluation)
- Task has no bead (ad-hoc work)

The intent review and evaluator have complementary scope:
- **Intent review** checks CODE COVERAGE — does the diff contain the right changes?
- **Evaluator** checks BEHAVIORAL CORRECTNESS — does the running app satisfy each criterion?

If no runtime testing is possible, the evaluator's value over intent review is minimal. Skip it.

## Evaluator Agent Template

```
Task(subagent_type="general-purpose", model="opus", description="Evaluate against acceptance criteria", prompt="
# Use model="haiku" for code-only evaluation with simple criteria (no browser-qa)
ROLE: Evaluator. You judge work against acceptance criteria. You do NOT implement or fix.

BEAD: <id>
ACCEPTANCE CRITERIA (from bead --design field):
<numbered list of criteria>

CODE DIFF:
<git diff output or summary of changes>

EVALUATION PROCESS:

1. Classify each criterion:
   - RUNTIME: requires browser interaction to verify ("user can...", "page shows...", "form validates...")
   - CODE: verifiable from code inspection ("function exists", "type is correct", "test passes")

2. If browser-qa available (CDT MCP connected, app running at <url>):
   - Activate dm-work:browser-qa
   - For each RUNTIME criterion: navigate, interact, assert
   - For each CODE criterion: inspect the diff

3. If browser-qa NOT available:
   - For each CODE criterion: inspect the diff
   - For each RUNTIME criterion: mark UNTESTABLE with reason
   - If ALL criteria are UNTESTABLE: return early with overall: SKIP

4. Grade each criterion: PASS / FAIL / UNTESTABLE
   - PASS: criterion is satisfied (code or runtime evidence)
   - FAIL: criterion is not satisfied (describe what's wrong)
   - UNTESTABLE: cannot verify without runtime / missing prerequisite

SKILLS: dm-work:browser-qa (if CDT MCP available)

OUTPUT FORMAT (JSON to stdout):
{
  \"bead_id\": \"<id>\",
  \"criteria_results\": [
    {
      \"criterion\": 1,
      \"text\": \"User can navigate to /settings\",
      \"type\": \"RUNTIME\",
      \"result\": \"PASS\",
      \"detail\": \"Navigated to /settings, page loads with profile form visible\"
    },
    {
      \"criterion\": 2,
      \"text\": \"Email validates client-side\",
      \"type\": \"RUNTIME\",
      \"result\": \"FAIL\",
      \"detail\": \"Entered invalid email 'notanemail', no validation error shown\"
    }
  ],
  \"overall\": \"FAIL\",
  \"pass_count\": 1,
  \"fail_count\": 1,
  \"untestable_count\": 0,
  \"summary\": \"1/2 criteria pass. Email validation missing on client side.\"
}

RULES:
- Judge ONLY against the listed acceptance criteria. Do not invent requirements.
- PASS means the criterion is satisfied, not that the code is perfect.
- Report what you observed, not what you assumed.
- If a criterion is ambiguous, grade it and note the ambiguity in detail.
- Do NOT modify code, commit, or close beads.
")
```

## Handling Evaluator Results

The orchestrator processes evaluator output:

**overall: PASS** → proceed to merge
**overall: SKIP** → all criteria untestable, proceed (evaluator adds no value here)
**overall: FAIL** →
1. Check fail count vs total:
   - 1-2 failures: send FAIL details back to original subagent for targeted fix
   - >50% failures: likely a spec problem — escalate to user, don't iterate
2. Check if failures are criteria bugs (criterion is impossible/ambiguous):
   - If so, update the bead criteria, don't blame the implementation
3. Create beads for persistent failures:
   ```bash
   bd create --title="Eval: <failed criterion>" --type=bug --priority=2
   bd dep add <new-bead> discovered-from:<parent-bead>
   ```

**Circuit breaker:** If evaluator fails twice on the same criterion after rework, escalate to user. Don't loop.

## Cost and Timing

- Evaluator adds ~1-2 minutes per invocation (code-only) or ~2-4 minutes (with browser-qa)
- Skip aggressively when not needed (see skip conditions above)
- Use haiku model for code-only evaluation if criteria are simple
- Use opus for browser-qa evaluation (needs to drive CDT tools effectively)

## Integration Points

| Component | How evaluator connects |
|-----------|----------------------|
| **Orchestrator** | Calls evaluator as Step 1.5 in post-subagent verification |
| **Browser-qa** | Evaluator activates browser-qa skill for runtime testing |
| **Beads** | Reads acceptance criteria from bead; files new beads for failures |
| **Sprint contracts** | Acceptance criteria in bead ARE the sprint contract |
| **Post-merge review** | Post-merge command uses evaluator for closed beads |
| **Intent review** | Complementary: intent checks code coverage, evaluator checks behavior |

---
description: Iterate a queue of beads or tasks with a disciplined Definition-of-Done per item. Designed to wrap inside /loop for unattended progress, but runs standalone for a single cycle. Each fire runs ONE full DoD cycle on the next queue item, then exits cleanly.
argument-hint: "<queue-spec> [flags] — e.g. bd:ready --label X | ids:foo-1,foo-2 | file:tasks.md"
---

# Devloop

Process a queue of work items with a strict per-item Definition of Done. One fire = one item, cleanly. Wrap inside `/loop` for unattended progress across a queue; or run once for a single disciplined cycle.

This command is for **well-defined work**. If items have ambiguous scope or undefined acceptance criteria, run `/dm-work:breakdown` first — devloop will refuse to claim work whose intake step fails (see HITL escalation below).

## Arguments

```
$ARGUMENTS
```

### Queue spec (first positional arg)

| Form | Meaning |
|------|---------|
| `bd:<bd-args>` | Beads query — e.g. `bd:ready --label track:engine --priority 2`. Re-run each iteration; takes the next OPEN, unblocked, unclaimed item. |
| `ids:<csv>` | Explicit comma-separated bead IDs — e.g. `ids:foo-7w0g,foo-9llj`. Iterated in order, skipping already-closed. |
| `file:<path>` | Markdown task list, one task per line, `- [ ]` / `- [x]` style. Already-checked tasks are skipped; the file is updated in place after each task closes. |

### Flags

| Flag | Effect | Default |
|------|--------|---------|
| `--no-review` | Skip subagent review even for M+ items. Reserve for items reviewed out-of-band. | review on |
| `--no-push` | Don't push the branch after commit. For batch-then-push patterns. | push on |
| `--max-iters N` | Hard cap on iterations within a single fire. | 1 (single cycle per fire is the design) |
| `--realign-every N` | Stop and emit a re-align report every Nth closed item; counter persisted in `.devloop-state.json`. | 3 |
| `--profile <orchestrator\|implementer>` | `implementer` does the work directly. `orchestrator` delegates implementation to a `Task()` subagent and only manages the loop (orient/intake/plan/validate/gate/review/close/commit/push). | `implementer` |
| `--review-mode <diff\|full>` | `diff` = single diff-reviewer subagent. `full` = `/dm-work:review` parallel arch/code/security. | `diff` |

## Per-iteration protocol

Each fire runs ONE item end-to-end, then exits. `/loop` re-fires at the configured interval to pick up the next.

### 1. Orient

- `pwd` and verify you're in the expected working tree (not primary if a worktree pattern is in use)
- `git status` — clean tree required. If dirty from a prior incomplete iteration: STOP, surface state, do not claim new work.
- `git pull --ff-only` if a tracked upstream exists
- `bd prime` if beads is in use
- Read project steering (AGENTS.md / CLAUDE.md) if not already in context

### 2. Pick next item

- Resolve the queue-spec to a candidate list
- Filter: open, no blocking deps, not `in_progress` by another actor
- For `bd:` queries: order by priority, then ascending size (smaller wins ties)
- For `ids:`: take next non-closed in supplied order
- For `file:`: take next un-checked line
- Queue empty → write handoff (see step 12) and STOP
- **Re-align gate:** if closes-since-last-realign ≥ `--realign-every`, skip the pick and run the re-align block instead

### 3. Intake

Establish the four anchors for this item before touching anything else. If any anchor is missing or ambiguous in a way that would shape implementation, ESCALATE — do not silently choose between materially different interpretations.

| Anchor | What to identify |
|--------|------------------|
| Goal | What the item is trying to accomplish, in one sentence |
| Source of truth | The bead description, spec, ticket, or file the work derives from |
| Outcome | The observable post-condition (what changes for users / code / data) |
| Acceptance criteria | The concrete, testable conditions for "done" |

- `bd show <id>` (if bead) or read the task description in full
- Open every referenced source file. Verify line numbers, function signatures, and structure against current state.
- If the description has drifted from source in non-trivial ways → ESCALATE.

### 4. Plan

Produce an internal plan with these five elements. The plan does not need to be written to a file; it just needs to be concrete enough to execute against. Escalate if any element forces a design call that isn't in the source.

| Element | Decide |
|---------|--------|
| Implementation path | Which files change, in what order |
| Validation path | Which targeted tests cover the change; what integration / UX checks apply |
| Risk areas | Where this could break something else; what to watch in gates |
| Assumptions | What you're taking as given without proof (call these out before relying on them) |
| Out-of-scope boundary | What you will explicitly NOT touch in this iteration — adjacent dead code, unrelated bugs, style nits, etc. |

Check HITL escalation triggers (below). If any fires: ESCALATE. Do NOT claim the item.

### 5. Claim and implement

- `bd update <id> --claim` (or equivalent for the queue type)
- Implement minimal, surgical changes inside the out-of-scope boundary. Single item per iteration; multiple commits within the item are fine if naturally coherent.
- **Add or update automated tests** alongside the change, unless equivalent coverage already exists or the task is explicitly exploratory.
- **Surgical scope:** do not reformat, rename, reorganize, or modernize adjacent code unless it's necessary for the requested outcome. Note unrelated dead code or bugs as discoveries (step 6) rather than editing them.

If `--profile orchestrator`: spawn a `Task()` subagent for the implementation step with a tight brief (acceptance criteria, files in scope, validation expectations, out-of-scope boundary from the plan). The orchestrator profile still runs the rest of the protocol (validate, gate, review, close, commit, push) itself.

### 6. Validate

Run the cheap, focused checks first — they fail fast and point at the change.

- **Targeted tests** for the changed behavior — the ones identified in the plan's validation path
- **Integration tests** if the change crosses module boundaries
- **Manual UX check** for user-facing surfaces — render the artifact, navigate the flow, inspect for layout/clipping/missing content. For web apps with CDT MCP available, see `dm-work:browser-qa`.

**Out-of-scope discoveries:** if validation surfaces a failure outside this item's scope, capture it with concrete evidence — affected surfaces, severity, close conditions — and file it as a follow-up bead before continuing. Do not silently fix it.

### 7. Gate

- Run the project's full quality gate (`just check`, `npm run check`, `cargo test`, whatever the project uses)
- Pre-existing failures are still your problem — fix per the prime directive ("already broken ≠ excuse")
- Introduced failures: fix before proceeding. If unresolvable in this iteration: ESCALATE per the circuit breaker.
- Gate exceptions (e.g., `--no-verify`) are forbidden by default. They require explicit human approval recorded with reason and follow-up.

### 8. Review (M+ items, unless `--no-review`)

Give the reviewer the same five inputs they'd need from a human author. Don't make them guess.

Default `--review-mode diff`:
```
Task(subagent_type="feature-dev:code-reviewer", model="opus", prompt="
Review the diff at HEAD vs <merge-base>.

ORIGINAL INPUT: <bead description or task source>
ACCEPTANCE CRITERIA: <from intake>
CHANGED FILES: <list>
KNOWN RISKS: <from plan>
CHECKS ALREADY RUN: <targeted tests + gate>

Focus: correctness, integration, missed edge cases, regression risk.
Return:
- BLOCKING: <list or 'none'>
- IN-SCOPE FIXES: <list or 'none'>
- FILE-AS-BEAD: <list or 'none'>
- FALSE-POSITIVE: <list with reason or 'none'>
")
```

`--review-mode full`: invoke `/dm-work:review --commits <range> --no-interactive --format json --skip-beads --min-severity medium` with the same input context.

Apply confidence filtering (drop noise, prioritize concrete findings):
- **Tier 0 / speculative** — drop findings with no concrete failure mode rather than leave them as silent caveats
- **Blocking** → fix before close, or ESCALATE
- **In-scope fixes** → apply now while context is hot
- **File-as-bead** → `bd create` follow-ups with surfaces + severity before closing the current item
- **False positives** → classify explicitly with reason; do not let them pile up silently

S-size items: review optional unless `--review-mode full` is forced.

### 9. Maintain context

Update reference material so future sessions can orient from project docs. Touch only what the change actually shifted:

- ADR or design-decision doc if architectural intent moved
- Audit / fixture / eval docs if the change affects existing artifacts
- User-facing docs (README, quickstart, command help) if behavior changed
- Changelog if the project keeps one
- AGENTS.md / CLAUDE.md if conventions or workflow shifted

### 10. Close the item

- `bd close <id> --reason "..."` citing concrete shipped artifacts (file:line, commit SHA when known)
- For dotted-bead epics: close children before parents
- For `file:` queue: rewrite the task line to `- [x]` in place

### 11. Commit and push

- Conventional Commits message: `type(scope): subject`
- Body explains WHY when the diff doesn't
- `Refs:` / `Closes:` / `Fixes:` lines for every bead touched
- Project activity-log entry if the project tracks one (e.g., timbers log)
- `git push origin <branch>` unless `--no-push`
- Do NOT attempt to merge to main from a worktree. Merging is the orchestrator's job from primary via `/dm-work:merge`.

### 12. Handoff

Write a plain-English statement before exiting. This is what the next iteration (or human reader) needs to orient instantly.

- **What landed** — one sentence on the change
- **What was verified** — targeted tests + gate + review status
- **What was discovered** — out-of-scope items filed, surprising state in code/docs
- **What surprised you** — anything that pushed back on the plan or assumptions
- **Where remaining work is captured** — follow-up bead IDs, deferred items

Then verify final state:
- `git status` clean
- Any activity-log pending count is 0
- `bd ready` reflects the just-closed item gone from the queue
- Increment `.devloop-state.json` close counter (for re-align tracking)

Exit cleanly. `/loop` re-fires for the next item.

## Re-align (periodic)

Every `--realign-every` iterations (default 3), the loop skips picking a new item and instead runs a big-picture audit. Output: a short re-align report covering:

- **Drift check** — do the last N closes still trace to the original epic/goal, or has the queue shifted?
- **Architectural pressure** — has anything in the last N closes hinted at a needed ADR, refactor, or scope change?
- **Blind spots** — what should the queue contain that it doesn't?
- **Proposed adjustments** — concrete changes to the queue, priorities, or plan

After the re-align report, the loop STOPS. The user reads it, decides whether to continue (which resets the counter via `rm .devloop-state.json` or `--realign-every 0` to disable), adjust the queue, or pivot.

## Definition of Done

An item is DONE when ALL hold:

- [ ] Intake anchors identified — goal, source, outcome, acceptance criteria
- [ ] Plan covers implementation path, validation path, risk areas, assumptions, out-of-scope boundary
- [ ] Source change implemented within scope (no adjacent-code drift)
- [ ] Tests added or updated (unless coverage already equivalent)
- [ ] Targeted + integration + UX validation passes
- [ ] Full project quality gate passes (no `--no-verify`)
- [ ] Subagent review applied (M+) with the five-input briefing; findings dispositioned (fixed / filed / classified-false-positive / escalated) — no silent pile-up
- [ ] Out-of-scope discoveries filed as beads with surfaces + severity
- [ ] Docs / ADRs / changelogs / steering updated where the change shifted understanding
- [ ] Bead/task closed with concrete reason citing shipped artifacts
- [ ] Commit landed with proper message and Refs/Closes lines
- [ ] Activity-log entry written (if the project uses one)
- [ ] Branch pushed (unless `--no-push`)
- [ ] Handoff statement written
- [ ] Working tree clean

## HITL escalation triggers

Surface to the user (exit cleanly with a handoff) when any of these fire. **Do not claim the item.**

- Intake anchors incomplete — no clear outcome or acceptance criteria
- Acceptance criteria require a design call not present in the source (e.g., "wire X OR remove dead field" with no preference)
- Plan requires choosing between materially different interpretations
- Schema change affects persisted data, public API, network protocol, or shared types
- New external dependency would be needed
- Test infrastructure change required (new harness, fixture format, etc.)
- ADR-affecting change required
- Subagent review surfaces a load-bearing concern needing human judgment
- Item description references files/code that don't match current state in non-trivial ways
- Push rejected for non-FF reasons and rebase fails
- Validation exposes a failure outside the task scope that can't be cleanly filed-and-deferred

## Circuit breakers

The loop EXITS (does not skip-to-next) when:

- 3 consecutive iterations fail at the same step → state is wrong
- A test failure unresolvable in one iteration → file follow-up bead, escalate
- Working tree stuck dirty (cannot return to clean)
- `--max-iters` reached
- Queue empty
- Re-align gate fired (see above)
- Sentinel `.devloop-stop` file present, or env `DEVLOOP_STOP=1` set

For unresolvable failures, investigate root cause before re-attempting. Random patching creates new bugs faster than it fixes the old one.

## Examples

```bash
# Beads-driven engine queue, 15-min cadence
/loop 15m /dm-work:devloop bd:ready --label track:engine --priority 2

# Explicit bead sequence
/loop 15m /dm-work:devloop ids:foo-7w0g,foo-9llj,foo-jok2

# Markdown task file with checkboxes
/loop 15m /dm-work:devloop file:docs/sprint-tasks.md

# Long cadence, capped run, no auto re-align
/loop 30m /dm-work:devloop bd:ready --label track:content --max-iters 20 --realign-every 0

# Orchestrator-mode: this session orchestrates, subagents implement
/loop 20m /dm-work:devloop bd:ready --priority 2 --profile orchestrator

# Standalone single cycle, no /loop wrapping
/dm-work:devloop bd:ready
```

## Related

- `/dm-work:breakdown` — run first when queue items fail the Intake step
- `/dm-work:review` — invoked by `--review-mode full`
- `/dm-work:merge` — for landing branches; devloop never merges to main
- `/dm-work:post-merge` — after a merge, run autonomous review and file findings as beads
- `dm-work:browser-qa` — for the UX validation step on web apps
- `bd worktree` — for the working-tree assumptions in step 1 when running inside an isolated branch

## Source inspiration

The per-item loop is the user's own — iteratively refined across multiple conversations. Sharpening of certain step framings (Intake anchors, out-of-scope plan boundary, Review dispositions, Re-align cadence, plain-English Handoff) was cross-pollinated from the **Disciplined Development Loop** in the user's global AGENTS.md (Karpathy / GPT-5.5-inspired). Queue mechanics (/loop wrapping, queue-spec forms, sentinels, DoD checklist) are devloop-specific.

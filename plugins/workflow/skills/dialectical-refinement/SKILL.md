---
name: dialectical-refinement
description: Transform ambiguous specs into implementable work items through adversarial refinement. Use when receiving specs, claiming epics, or starting complex (l/xl) tasks. Use /breakdown for spec→tasks decomposition, /refine for sharpening individual items.
---

# Dialectical Refinement

## Overview

Surface hidden complexity before implementation through adversarial tension. A single reviewer tends toward over-engineering or over-simplification; opposing passes converge on correct scope.

## When to Use (Proactive Triggers)

| Trigger | Action |
|---------|--------|
| Receiving external spec/PRD | `/breakdown <spec.md>` |
| Claiming an epic | `/refine` then `/breakdown` |
| Starting l/xl complexity task | `/refine <task-id>` |
| Spec feels "clear but big" | Run refinement—hidden complexity likely |

## Protected Categories

Before any simplification, identify items that must NOT be cut:

| Category | Description | Examples |
|----------|-------------|----------|
| **Core Workflow** | The minimal viable loop | CRUD operations, essential commands |
| **Agent Primitives** | Flags/features enabling agent autonomy | `--json`, `--range`, `--auto`, structured output |
| **User-Requested Features** | Explicitly requested by user | Items called out in original spec |
| **Token Efficiency** | Batch operations, context injection | Bulk APIs, pagination, streaming |
| **Structured Output** | Machine-parseable output | JSON on all commands, typed responses |

Tag protected items early. The Proposer phase should not propose cutting them.

## The 5-Phase Process

### Phase 1: Formalize (Analyst)
**Goal:** Surface ambiguity and tag protected items.
- What terms are undefined?
- What's the input/output contract?
- What exists vs. genuinely new?
- What are acceptance criteria?
- What dependencies are implicit?
- **Which items fall into protected categories?**

**Output:** Detailed spec with gaps called out and protected items tagged.

**Checkpoint:** If significant unknowns remain (scope, architecture, must-have vs nice-to-have), ask 1-3 focused questions before proceeding.

**HITL Clarification Protocol:** When asking users, use `AskUserQuestion` with 2-4 concrete options and trade-offs (not open-ended). Structured questions prevent silent assumptions.

### Phase 2: Propose Cuts (Proposer)
**Goal:** Identify candidates for simplification—propose, don't execute.

The Proposer suggests cuts with confidence levels. It does NOT produce a reduced spec; it produces a list of proposals for the Advocate to argue against.

**Output Format:**

```markdown
## PROTECTED (never cut)
- [List items from protected categories with rationale]

## PROPOSED CUTS

### Strong Cut Candidates (high confidence)
- `<item>` — [Rationale: clearly deferrable or unnecessary]

### Moderate Cut Candidates (medium confidence)
- `<item>` — [Rationale: could defer, but note trade-offs]

### Weak Cut Candidates (low confidence, protect carefully)
- `<item>` — [Rationale: seems optional, but may have hidden value]
```

**Key Constraint:** Proposer argues for cuts but does NOT execute them. The Advocate reviews each proposal.

### Phase 3: Challenge (Advocate)
**Goal:** Argue against proposed cuts, restore what matters.

The Advocate receives the Proposer's proposals and responds to EACH one:

**Output Format:**

```markdown
## ADVOCATE RESPONSES

### Strong Cuts — Agreed
- `<item>` — Agree: [brief reason]

### Strong Cuts — Contested
- `<item>` — Contest: [why this should stay]

### Moderate Cuts — Agreed
- `<item>` — Agree, defer to phase 2

### Moderate Cuts — Contested
- `<item>` — Contest: [hidden value / future cost of adding later]

### Weak Cuts — Recommendations
- `<item>` — [Keep/Cut with reasoning]

### Cheap Additions Missed
- [Items not in spec that are low-effort, high-impact]
```

**Key Constraint:** Advocate argues from the proposals, not from memory. Every proposal gets a response.

### Phase 4: Scope Lock (Checkpoint)
**Goal:** Verify essential scope before synthesis.

Before the Judge produces final output, verify:

| Check | Status | Action if Failed |
|-------|--------|------------------|
| Core workflow commands preserved | ✅/❌ | Restore from Phase 1 |
| Agent primitives preserved | ✅/❌ | Restore `--json`, ranges, etc. |
| User-requested features addressed | ✅/❌ | Review with user |
| Structured output on all commands | ✅/❌ | Add missing |
| Token efficiency considered | ✅/❌ | Review batch/bulk operations |

**"Too Thin" Indicators:**
- Fewer than 5 commands/features for a system? ⚠️
- Removed structured output (`--json`)? ⚠️
- Removed range/anchor/batch capabilities? ⚠️
- All m+ tasks cut to xs/s? ⚠️

If 2+ indicators trigger, return to Phase 3 with guidance to restore scope.

### Phase 5: Synthesize (Judge)
**Goal:** Produce actionable, externally-reviewable spec with quality gates.

- Resolve remaining Proposer/Advocate debates
- Write concrete implementation details
- Define testable acceptance criteria (see Sprint Contract below)
- Document OUT OF SCOPE explicitly
- **Ensure spec is standalone-reviewable** (see below)
- **Write acceptance criteria into the bead** (see Sprint Contract below)

**Standalone Context Requirement:**

The final spec must be reviewable by an external agent without access to conversation history. Include:

1. **Introduction** — What this spec is and why it exists (2-3 sentences)
2. **Context appendix** (if spec is part of larger system):
   - Brief description of the parent project/system
   - Where this spec fits in the bigger picture
   - Key constraints inherited from the larger context
   - Reference this appendix in the introduction

Keep context token-efficient: enough for an external reviewer to assess readiness, not a full project overview.

**Sprint Contract — Acceptance Criteria:**

Phase 5 MUST produce specific, testable acceptance criteria. These are the contract between the agent doing work and the agent judging it. Vague criteria produce vague evaluation.

Good criteria are **observable from outside the code** — an evaluator using `browser-qa` should be able to verify each one by navigating the app, clicking, and checking results.

```markdown
## Acceptance Criteria
1. User can navigate to /settings and see their profile
2. Email field rejects invalid format with visible error message
3. Save button is disabled while the form is submitting
4. Success toast appears within 2 seconds after save
5. No console errors during the entire flow
6. Settings persist after page reload
```

After synthesis, **write the criteria into the bead**:
```bash
bd update <id> --design="Acceptance criteria:
1. ...
2. ...
"
```

This is the sprint contract. The evaluator grades against it. The browser QA skill tests it. Without criteria in the bead, there is nothing to evaluate.

**Spec Structure:**
```markdown
## Introduction
[What + Why in 2-3 sentences. If partial: "See Appendix A for project context."]

## Scope
[What's being built]

## Acceptance Criteria
[Testable outcomes — same criteria written to the bead]

## Out of Scope
[Explicit boundaries]

## Appendix A: Project Context (if needed)
[Token-efficient big picture: ~100-200 words max]
```

**Synthesis Quality Check:**

| Indicator | Status | Action if Failed |
|-----------|--------|------------------|
| Commands/features ≥ minimum viable | ✅/❌ | Restore essentials |
| All commands have structured output | ✅/❌ | Add `--json` flags |
| Agent primitives present | ✅/❌ | Restore ranges, batching |
| User requests addressed | ✅/❌ | Review with user |
| Acceptance criteria testable | ✅/❌ | Add specifics |
| Spec standalone-reviewable | ✅/❌ | Add intro/context |

If 2+ indicators fail, output **REVISE** with specific gaps—don't ship a thin spec.

**Quality Gate:**
- **GO** — Ready to implement
- **GO with caveats** — Workable with listed risks
- **REVISE** — Too thin or too vague, needs another pass with specific guidance

## Early Exit Rules

Not every spec needs all 5 phases:

| Complexity | Refinement |
|------------|------------|
| xs/s | Skip entirely |
| m | 2-phase (Formalize → Synthesize) |
| l/xl | Full 5-phase |

If the Proposer has no cuts and Advocate has no additions, skip Scope Lock and proceed to Synthesize.

## Complexity Estimation

| Level | Description | Refinement? |
|-------|-------------|-------------|
| xs | Trivial, obvious | No |
| s | Small, well-understood | No |
| m | Some unknowns | 2-phase |
| l | Significant unknowns | 5-phase |
| xl | Many unknowns | 5-phase |

**Rule of thumb:** If you can't describe implementation in 2-3 sentences, it's l or higher.

## Command Reference

### `/refine <target>`
Runs 5-phase refinement on a bead or spec file.
1. Reads target
2. Runs 5 sequential phases (separate agents for adversarial tension)
3. Presents synthesized spec
4. Updates bead, adds `refined` label

### `/breakdown <target>`
Decomposes epic/spec into tasks.
1. Refines target first (if not already)
2. Proposes task breakdown with complexity estimates
3. Creates beads with dependencies and labels
4. Links tasks to parent epic

## Breakdown Output Rules

| Task Complexity | Label | Rationale |
|-----------------|-------|-----------|
| xs/s | `refined` | Obvious enough to implement |
| m/l/xl | `needs-refinement` | Review at claim time |

Tasks get:
- `parent-child` dep to source epic
- `blocks` for sequential dependencies
- Complexity estimate
- Brief description (details filled at refinement)

## Integration with bd

```bash
# Find work needing refinement
bd list --labels needs-refinement

# Find refined work ready to implement
bd ready --labels refined

# Find epics needing breakdown
bd list --type epic --labels needs-breakdown
```

## Refined Spec Criteria

A spec is refined when:
1. **Standalone** — Introduction + context sufficient for external review
2. **Concrete** — Files, functions, line estimates clear
3. **Bounded** — OUT OF SCOPE section exists
4. **Testable** — Acceptance criteria are observable
5. **Sized** — Complexity reflects actual uncertainty
6. **Unblocked** — Dependencies identified/tracked

## Anti-Patterns

- **Refinement theater** — Running phases without meaningful changes
- **Premature refinement** — Refining backlog items that may never be done
- **Skipping Advocate** — Proposer cuts can go too far without challenge
- **Executing cuts in Proposer** — Proposer proposes; Advocate + Judge decide
- **One-person dialectic** — Use separate agents per phase for genuine tension
- **Ignoring Scope Lock** — Too Thin indicators exist for a reason

## Why Separate Agents Per Phase

Each phase agent receives only previous output + goals, not internal reasoning. This prevents self-reinforcing mistakes. The Proposer shouldn't remember why the Analyst included something—it should propose cuts from scratch. The Advocate shouldn't remember the Proposer's reasoning—it should challenge each proposal independently.

## Resources

For examples and extended reference material, see:
- `references/examples.md` — Before/after refinement examples

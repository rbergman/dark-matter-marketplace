---
name: dialectical-refinement
description: Transform ambiguous specs into implementable work items through adversarial refinement. This skill should be used PROACTIVELY when receiving specs, claiming epics, or starting work on complex (l/xl) tasks. Use /breakdown for spec→tasks decomposition, /refine for sharpening individual items.
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

## The 4-Pass Process

### Pass 1: Formalize (Analyst)
**Goal:** Surface ambiguity.
- What terms are undefined?
- What's the input/output contract?
- What exists vs. genuinely new?
- What are acceptance criteria?
- What dependencies are implicit?

**Output:** Detailed spec with gaps called out.

**Checkpoint:** If significant unknowns remain (scope, architecture, must-have vs nice-to-have), ask 1-3 focused questions before proceeding.

**HITL Clarification Protocol:** When asking users, use `AskUserQuestion` with 2-4 concrete options and trade-offs (not open-ended). Structured questions prevent silent assumptions.

### Pass 2: Simplify (Skeptic)
**Goal:** Cut to minimum viable.
- What can defer to future phase?
- What's nice-to-have vs essential?
- Can we hardcode now, parameterize later?
- What's the smallest valuable change?

**Output:** Dramatically reduced spec. Should feel "too minimal."

### Pass 3: Challenge (Advocate)
**Goal:** Restore what was cut too aggressively.
- Did Pass 2 cut something essential?
- Are there cheap additions (small effort, high impact)?
- Will deferred items be much harder to add later?

**Output:** Restored scope where cuts went too far.

### Pass 4: Synthesize (Judge)
**Goal:** Produce actionable spec.
- Resolve remaining debates
- Write concrete implementation details
- Define testable acceptance criteria
- Document OUT OF SCOPE explicitly

**Quality Gate:**
- **GO** — Ready to implement
- **GO with caveats** — Workable with listed risks
- **REVISE** — Too vague/large, needs another pass

## Early Exit Rules

Not every spec needs 4 passes:

| Complexity | Refinement |
|------------|------------|
| xs/s | Skip entirely |
| m | 2-pass (Formalize → Synthesize) |
| l/xl | Full 4-pass |

If Pass 2 and Pass 3 produce nearly identical output, skip to Pass 4.

## Complexity Estimation

| Level | Description | Refinement? |
|-------|-------------|-------------|
| xs | Trivial, obvious | No |
| s | Small, well-understood | No |
| m | Some unknowns | 2-pass |
| l | Significant unknowns | 4-pass |
| xl | Many unknowns | 4-pass |

**Rule of thumb:** If you can't describe implementation in 2-3 sentences, it's l or higher.

## Command Reference

### `/refine <target>`
Runs 4-pass refinement on a bead or spec file.
1. Reads target
2. Runs 4 sequential passes (separate agents for adversarial tension)
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
1. **Concrete** — Files, functions, line estimates clear
2. **Bounded** — OUT OF SCOPE section exists
3. **Testable** — Acceptance criteria are observable
4. **Sized** — Complexity reflects actual uncertainty
5. **Unblocked** — Dependencies identified/tracked

## Anti-Patterns

- **Refinement theater** — Running passes without meaningful changes
- **Premature refinement** — Refining backlog items that may never be done
- **Skipping Pass 3** — Minimalism can go too far
- **One-person dialectic** — Use separate agents per pass for genuine tension

## Why Separate Agents Per Pass

Each pass agent receives only previous output + goals, not internal reasoning. This prevents self-reinforcing mistakes. The Skeptic shouldn't remember why the Analyst included something—it should challenge from scratch.

## Resources

For examples and extended reference material, see:
- `references/examples.md` — Before/after refinement examples

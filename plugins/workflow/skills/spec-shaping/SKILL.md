---
name: spec-shaping
description: >-
  Shape a durable spec before implementation — interview the operator to the goal, draft the spec as a repo artifact, checkpoint key decisions explicitly, then slice into bounded beads. Use when starting any M+ piece of work, when a request is fuzzy at any size ("make it feel better", "add reporting"), when the user asks for a spec / plan doc / design doc, before a long autonomous implementation run, or before delegating implementation to subagents or Codex. Do NOT use for XS/S well-understood work — a bead description suffices there, and forcing the protocol onto small work is waterfall ceremony. The spec is what makes implementers interchangeable: any model, any session, any harness can pick up a bounded slice and be judged against the same criteria.
---

# Spec Shaping

The operator's understanding is the scarce input; the spec is how it reaches the
agent in a form that survives the session. Plans that live in conversation die
with the context window. A spec is a durable repo artifact.

## When

- **M+ work** (per bead complexity estimate), always.
- **Fuzzy work at any size** — the goal, not the task, is unclear.
- **Before long autonomous runs or delegation** — the implementer gets the spec
  excerpt, not the conversation.

**Exempt: XS/S well-understood work.** A good bead description is its spec.
Small specs beat big ones — the recurring failure of spec-driven tooling is
overhead exceeding return on small features. Scale the spec to the work.

## Protocol

### 1. Interview to the goal (3–6 questions, not a ceremony)

The operator states a task; the spec needs the goal — the decision or outcome
the work drives. Ask narrow questions that discriminate between implementations:

- What decision/outcome does this serve? What does done *enable*?
- What must NOT change (invariants, non-goals, scope boundary)?
- What's the felt acceptance criterion? (Feel belongs to the operator — an
  unspecified feel target gets silently filled by a proxy metric. Ask; don't
  substitute.)
- Which known decision would you most regret being assumed?

Skip questions the request or the repo already answers. If the operator has
answered everything up front, say so and go straight to the draft.

### 1b. Study the best existing solutions (when they exist)

For a user-facing feature, a workflow, or an algorithm with established
solutions, write a short brief into the spec before drafting: the named references you
studied, the patterns they share, where they differ, and what each rules out
for this work. Research informs the spec; it does not authorize a pivot from
the operator's goal. Skip it for internal plumbing.

### 2. Draft the spec artifact

**Size the target** within the requested scope, by goal and resources, not human build time: a well-mapped
strongest solution is the target, built smallest working slice first.

**Home: the bead's linked plan doc is the spec.** Use `docs/specs/<slug>.md`
only when no bead exists yet, and link it from the bead once one does. One
home, no drift.

Template — include only sections that carry content, never pad:

```markdown
# <slug> — spec

**Goal:** <the decision/outcome this drives — not the task restated>
**Non-goals:** <what this deliberately does not do>
**Approach changes if:** <result or evidence that would overturn this approach>

## Invariants
<what must stay true: contracts, architecture boundaries, data shapes>

## Key decisions
| Decision | Choice | Status |
|----------|--------|--------|
| <e.g. identity model> | <persistent user IDs> | decided-by-operator / PROPOSED |

## Acceptance criteria
<numbered; split RUNTIME ("user can...") vs CODE ("function exists...") —
 each one checkable by an independent judge; tag each machine-checked,
 felt (operator), or measured>

## Verification plan
<which gates run; which external signal proves it (browser-qa, state dump,
 seed replay, API response, historical artifact); whether an independent judge runs;
 name the real entry points the checks exercise>

## Slices
<ordered bounded slices, each → one bead carrying its criteria>
```

**UI specs: keep product copy and evaluator notes apart.** When someone will
evaluate the screen before it ships (a prototype, mock backend, sample data, inert
features), do not write the honesty into the product's copy. Specify an
**annotation layer**: on by default with one control to turn it off, notes anchored
to elements, all notes in one registry. Acceptance checks both directions: every
evaluator-only disclosure has a note, and with the layer off no demo or prototype
wording is left in the product.

### 3. Decision checkpoint

The lead owns task definition,
architecture, acceptance criteria, and verification design. Present unsettled
decisions with their concrete consequences. Honor decisions and authority already
given; do not ask for the same approval again. Resolve routine reversible details
from the code and context. Checkpoint materially different product/architectural
choices with the operator before dependent implementation, continuing independent
work where useful. Understanding cannot be outsourced: explain consequential
tradeoffs clearly enough that the operator can judge the decision.

### 4. Slice into beads

Each slice = one bead. The bead carries its acceptance criteria and links the
spec. Implementers (subagent, Codex, fresh session) receive the spec excerpt +
criteria — bounded context, not conversation history. Return consequential
ambiguity to the lead instead of silently changing the contract.

## After the spec

- Implementation proceeds per the Disciplined Development Loop.
- **Judging slices.** An independent judge checks each criterion against exact
  evidence: the reviewed commit or build, and what was observed. Never rewrite a
  criterion to make a failed implementation pass. A criterion that cannot be
  tested is unresolved, not passed. After repeated failure on one criterion,
  re-examine the approach or the check instead of repeating the loop.
- Independent review per the standing review rule; for foundational specs, a
  cross-model pass (Codex, if installed) is recommended — a second model has
  different blind spots. Codex absent → note it once, proceed single-model.
- When implementation invalidates a spec decision, update the spec — it is the
  record later sessions orient from, not a one-shot prompt.

## Related skills

- **dm-work:compare-options** — settles a taste decision by comparing real options before it is written into the spec
- **dm-work:repo-init** — scaffolds the AGENTS.md template whose bead discipline this protocol feeds

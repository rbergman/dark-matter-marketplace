---
name: spec-shaping
description: Shape a durable spec before implementation — interview the operator to the goal, draft the spec as a repo artifact, checkpoint key decisions explicitly, then slice into bounded beads. Use when starting any M+ piece of work, when a request is fuzzy at any size ("make it feel better", "add reporting"), when the user asks for a spec / plan doc / design doc, before a long autonomous implementation run, or before delegating implementation to subagents or Codex. Do NOT use for XS/S well-understood work — a bead description suffices there, and forcing the protocol onto small work is waterfall ceremony. The spec is what makes implementers interchangeable: any model, any session, any harness can pick up a bounded slice and be judged against the same criteria.
---

# Spec Shaping

The operator's understanding is the scarce input; the spec is how it reaches the
agent in a form that survives the session. Plans that live in conversation die
with the context window. A spec is a durable repo artifact.

Grounding: Karpathy, Sequoia Ascent 2026 — "you work with your agent to design a
detailed spec, maybe basically the docs, and get agents to write them." His
MenuGen failure case: agents matched Stripe/Google emails because persistent
user IDs were never specified. The decision existed; it just wasn't in the spec.

## When

- **M+ work** (per bead complexity estimate), always.
- **Fuzzy work at any size** — the goal, not the task, is unclear.
- **Before long autonomous runs or delegation** — the implementer gets the spec
  excerpt, not the conversation.

**Exempt: XS/S well-understood work.** A good bead description is its spec.
Small specs beat big ones — the recurring failure of spec-driven tooling is
overhead exceeding return on small features. Scale the spec to the work.

## Protocol

### 0. Brain-dump intake (when the request arrives as one)

Operators legitimately arrive with everything at once — five threads, half
goals, half reactions. That is intake, not a violation. Before interviewing:
capture every distinct thread, list them back in one short block, propose which
one this turn serves, and park the rest as beads — naming where each went. The
spec protocol then runs on the chosen thread only. A dropped thread is a
protocol failure; a deferred, tracked one is the protocol working.

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

### 2. Draft the spec artifact

**Home: the bead's linked plan doc is the spec.** Use `docs/specs/<slug>.md`
only when no bead exists yet, and link it from the bead once one does. One
home, no drift.

Template — include only sections that carry content, never pad:

```markdown
# <slug> — spec

**Goal:** <the decision/outcome this drives — not the task restated>
**Non-goals:** <what this deliberately does not do>

## Invariants
<what must stay true: contracts, architecture boundaries, data shapes>

## Key decisions
| Decision | Choice | Status |
|----------|--------|--------|
| <e.g. identity model> | <persistent user IDs> | decided-by-operator / PROPOSED |

## Acceptance criteria
<numbered; split RUNTIME ("user can...") vs CODE ("function exists...") —
 evaluator-ready, see dm-work:evaluator>

## Verification plan
<which gates run; which external signal proves it (browser-qa, state dump,
 seed replay, API response, historical artifact); whether evaluator runs>

## Slices
<ordered bounded slices, each → one bead carrying its criteria>
```

### 3. Decision checkpoint

Before any implementation: present the Key decisions table, PROPOSED rows
flagged, in **one message**. Every assumption an agent makes is a drift
opportunity; this is where assumptions become decisions. The operator confirms
or corrects; PROPOSED flips to decided. Do not start building with PROPOSED
rows open on anything architectural.

### 4. Slice into beads

Each slice = one bead. The bead carries its acceptance criteria and links the
spec. Implementers (subagent, Codex, fresh session) receive the spec excerpt +
criteria — bounded context, not conversation history.

## After the spec

- Implementation proceeds per the Disciplined Development Loop.
- **dm-work:evaluator** judges slices against the criteria written here — write
  criteria it can grade.
- Independent review per the standing review rule; for foundational specs, a
  cross-model pass (Codex, if installed) is recommended — a second model has
  different blind spots. Codex absent → note it once, proceed single-model.
- When implementation invalidates a spec decision, update the spec — it is the
  record later sessions orient from, not a one-shot prompt.

## Related skills

- **dm-work:evaluator** — grades work against the acceptance criteria this spec defines
- **dm-work:council** — deliberates a spec when the *decision itself* is contested; spec-shaping authors, council stress-tests
- **dm-work:repo-init** — scaffolds the AGENTS.md template whose bead discipline this protocol feeds

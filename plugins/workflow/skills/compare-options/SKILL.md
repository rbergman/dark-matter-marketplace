---
name: compare-options
description: >-
  Settle a taste or feel decision by comparing a few real options instead of steering one build round after round. Use when a layout, interaction, visual direction or wording choice is substantially a matter of taste: before it goes into a spec, or when one attempt has not settled it; when two rounds of UI changes have passed without the operator saying it hits the mark; or when asked "which of these is better" about something only a person can judge. Do NOT use for work a test can settle, or for decisions already made: settled work gets built once.
---

# Compare Options

For a decision only a person can judge, one build tuned round after round
converges slowly and hides the alternatives. A few options that differ on a
real axis, shown side by side, settle it in one sitting.

## Protocol

1. **Write it down first.** The question, the effort limit, and what makes an
   option kept or discarded.
2. **Make about three options** (not a quota), with the current baseline as one when useful.
   They must differ on a real axis. Rethemes of one idea resolve nothing.
3. **Hold content and scenarios constant** across options, including the
   stress cases (longest label, empty state, worst input).
4. **Use the cheapest fidelity that exposes the decision.** A sketch settles
   structure: what goes where. It does not settle look, density or wording.
   For those, render the options in the real app with its real components
   and compare them once, before the first build is called done.
5. **Cull before showing.** Discard options that fail the stated criteria
   yourself. The operator picks among options that change direction or feel;
   pick the rest yourself and record it.
6. **Delete the losers and keep the lesson** in the spec or the bead. A single
   prototype that has run past its effort limit is culled the same way.

## Asking the operator to evaluate

- Before making options, ask for a reference they already like. A screenshot
  beats an adjective.
- Give a recognizable situation and a goal, then let them choose their path.
- Explain the context without giving away the answer.
- Take confusion and aesthetic reactions as data. Do not ask them to classify it.
- Judge each option from a rendered screenshot, not from the DOM or the source.
- Show each option in the state the operator will use: real data, working
  controls. Where a capture differs from the product, say so beside the image.

## Related skills

- **spec-shaping** — records the decision once it is made

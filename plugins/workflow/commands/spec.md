---
description: Shape a spec for a piece of work — interview to the goal, draft the spec artifact, checkpoint key decisions, slice into beads
argument-hint: "[work description | bead-id] (empty: ask what we're specing)"
---

# /spec

Arguments: $ARGUMENTS

Activate the **dm-work:spec-shaping** skill and run its protocol on the given
work item.

1. **Resolve the subject.** A bead id → `bd show <id>` and treat its
   title/description as the starting material. A description → work from it.
   Empty → ask in one line what we're specing.
2. **Size check first.** If this is XS/S and well understood, say so and offer
   to write it straight into a bead description instead — do not run the full
   protocol on work that doesn't need it.
3. **Run the protocol**: interview to the goal (3–6 questions max, skip
   already-answered ones) → draft the spec artifact (bead-linked plan doc; the
   skill has the template) → present the decision checkpoint → on confirmation,
   slice into beads (`bd create` per slice, criteria in `--design`, spec
   linked).
4. **Report**: spec path, decisions confirmed vs still PROPOSED, beads created.

The spec is the deliverable of this command. Implementation is a separate
step — do not start building in the same breath unless the operator says to.

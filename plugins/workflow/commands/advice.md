---
description: Generate a second-opinion brief for an external agent with no prior context
argument-hint: "topic or problem to get advice on"
---

You are generating a request for a second opinion addressed to an external agent who has no other context. Produce a concise, complete brief that lets them review and advise on the current problem with a fully informed yet fresh point of view.

Topic: $ARGUMENTS (or infer from conversation if not provided)

Follow this outline. Adapt section names to the domain — the skeleton is generic, the contents should be specific to whatever we're actually working on.

1. **Summary** — 2-4 bullets on what we're trying to solve and why it matters.
2. **Current symptoms or concerns** — observed behavior, error messages, screenshots (describe), and why each is suspect.
3. **Recent changes** — bullets referencing specific files/code paths and what changed functionally.
4. **How it works today** — short paragraphs describing the architecture or flow as it exists, with file references. Cover the systems involved, key parameters/inputs, and the data path. Tailor the subheadings to the domain (e.g., "Auth pipeline" / "Render loop" / "Job queue" — not a fixed list).
5. **Defaults and parameters** — list the values currently in use that the reviewer needs to evaluate.
6. **Specific questions for the reviewer** — explicit, actionable asks ("Is X correct?", "Should we separate Y from Z?"). Make them answerable.
7. **Possible next steps** — ranked list of changes we're considering.
8. **Repro / validation steps** — how to reproduce the symptom and what to look for. Include exact commands or UI steps.
9. **Quality state** — last lint/typecheck/test status and when it was run.
10. **File references** — enumerate the relevant files with inline paths.

Constraints:
- Keep it tight. No filler.
- Use inline code for file paths.
- Assume the reviewer cannot run the app — provide enough detail for static review.
- Omit any section that genuinely doesn't apply rather than padding it.

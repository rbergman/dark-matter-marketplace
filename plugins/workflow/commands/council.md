---
description: Convene a deliberation council to debate a decision, evaluate a spec, or explore trade-offs
argument-hint: "question or topic to deliberate (or a bead ID)"
---

# /council

Arguments: $ARGUMENTS

Follow the **dm-work:council** skill for the full protocol. This command is the entry point.

## Steps

1. **Parse input.** The argument is the question or topic. If it's a bead ID, `bd show <id>` for context.

2. **Check it's worth a council.** If you can predict the outcome, or the answer follows from a constraint already settled, say so and answer directly. A council that agrees immediately wasted five agents.

3. **Size it.**
   - Simple binary decision → 3 councilors
   - Complex multi-factor decision → 4-5
   - Spec or design evaluation → 3 (advocate, skeptic, pragmatist)

4. **Gather context.** Read the relevant files. Identify constraints and prior decisions that are settled and not up for debate — councilors will relitigate them otherwise.

5. **Assign frames.** Default: Advocate, Skeptic, Pragmatist. Add a Domain Expert only when the decision actually turns on specialized knowledge. Add a Devil's Advocate for high-stakes calls.

6. **Spawn councilors** — all in one message so they run concurrently. Give each a `name` and include in every spawn prompt:
   - The specific question
   - Their assigned frame and any role constraint ("find at least 2 concrete flaws")
   - The context from step 4 — they inherit none of this conversation
   - **"Message the lead your statement directly when finished"** (required: if Agent Teams is enabled, named spawns become teammates, and a teammate's idle notification carries no output)

7. **Run the challenge round.** Teams on → councilors message each other, 1-2 rounds. Teams off → second wave, re-spawning each with the others' statements included verbatim for rebuttal.

8. **Synthesize** into the output format from the skill: question, perspectives, key debates, recommendation, dissenting views, confidence.

9. **Persist** to `history/council-<topic-slug>-<YYYY-MM-DD>.md`. Mandatory — this is what makes the result survivable.

10. **Record.** If a bead was the input, update it with the recommendation.

11. **Suggest `/compact`** before implementation work begins. The synthesis is on disk; the 25-35k of debate in context is not needed to act on it.

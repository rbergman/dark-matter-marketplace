---
description: Spawn a deliberation council to debate a decision, evaluate a spec, or explore trade-offs
argument-hint: "question or topic to deliberate"
---

# /council

Arguments: $ARGUMENTS

## Steps

1. **Parse input**: The argument is the question or topic. If a bead ID is provided, read the bead for context.

2. **Assess scope**:
   - Simple binary decision → 3 teammates
   - Complex multi-factor decision → 4-5 teammates
   - Spec/design evaluation → 3 teammates (advocate, skeptic, pragmatist)

3. **Gather context**:
   - Read relevant files from conversation or bead
   - Identify constraints and prior decisions
   - Determine domain expertise needed

4. **Assign perspectives**: Choose roles based on the specific question. Default roles:
   - Advocate, Skeptic, Pragmatist
   - Add Domain Expert if specialized knowledge needed
   - Add Devil's Advocate for high-stakes decisions

5. **Create the team**: Ask Claude to spawn an Agent Team with the assigned perspectives. Include in each teammate's spawn prompt:
   - The specific question
   - Their assigned perspective and analytical frame
   - Relevant context (files, constraints)
   - Instructions to debate with other teammates

6. **Moderate**: Enable delegate mode. Monitor debate. Intervene if:
   - Discussion goes off-topic
   - Teammates are in violent agreement (reframe for tension)
   - Stalemate after 2 challenge rounds (force convergence)

7. **Synthesize**: After debate concludes, produce the council output format from the **council** skill.

8. **Record**: If a bead was the input, update it with the council's recommendation.

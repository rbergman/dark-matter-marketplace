---
name: council
description: Multi-perspective deliberation using Agent Teams. Spawn 3-5 teammates with different viewpoints and optionally different models to debate decisions, evaluate specs, or explore trade-offs. Inspired by karpathy/llm-council.
---

# Council Deliberation Pattern

When facing decisions where multiple valid perspectives exist, spawn a deliberation team rather than relying on a single viewpoint. Model diversity creates epistemic diversity — different models notice different things.

## When to Use

- Architecture decisions with trade-offs (e.g., WebSockets vs SSE vs polling)
- Evaluating a spec or design for completeness
- Choosing between implementation approaches
- Any "should we X or Y?" decision with non-obvious trade-offs
- Post-mortem analysis of what went wrong

## Council Structure

| Role | Purpose | Recommended model |
|------|---------|------------------|
| Advocate | Argues for the most promising approach | sonnet |
| Skeptic | Finds flaws, challenges assumptions | sonnet (or different sonnet version) |
| Pragmatist | Focuses on practical constraints (time, complexity, maintenance) | sonnet |
| Domain Expert | Brings specialized knowledge relevant to the topic | sonnet |
| Lead (you) | Frames the question, moderates, synthesizes | opus |

3 perspectives minimum, 5 maximum. Tailor roles to the specific decision.

## Debate Protocol

### Phase 1 — Framing (lead)

- State the question clearly
- Provide relevant context (files, constraints, prior decisions)
- Assign perspectives and initial positions to teammates

### Phase 2 — Opening Statements (teammates)

- Each teammate states their position with evidence
- 200-400 words per opening statement

### Phase 3 — Challenge Round (teammates message each other)

- Teammates directly challenge each other's positions
- Key mechanism: teammates should address specific claims, not general disagreement
- Lead monitors for convergence or stalemate
- 1-2 rounds of challenges typically sufficient

### Phase 4 — Synthesis (lead)

- Summarize points of agreement and disagreement
- Identify the strongest arguments from each perspective
- Make a recommendation with reasoning
- Note dissenting views that have merit

## Model Diversity Strategy

The core insight from llm-council: using different models (not just different prompts) produces genuinely different perspectives. Where possible:

- Use different model versions or families for different perspectives
- At minimum, use different system prompts that enforce different analytical frames
- The lead should always use the most capable model available (opus) for synthesis

## Output Format

```markdown
## Council Deliberation: [Topic]

### Question
[The specific question debated]

### Perspectives
- **[Role A]** ([model]): [1-2 sentence position summary]
- **[Role B]** ([model]): [1-2 sentence position summary]
- **[Role C]** ([model]): [1-2 sentence position summary]

### Key Debates
1. [Debate point] — [who argued what, resolution or ongoing disagreement]
2. [Debate point] — [...]

### Recommendation
[Lead's synthesized recommendation with reasoning]

### Dissenting Views
[Positions that lost but have merit — record for future reference]

### Confidence
[High/Medium/Low] — [why]
```

## Anti-patterns

- Spawning a council for trivial decisions (use tiered-delegation)
- All teammates agreeing immediately (reframe perspectives to create genuine tension)
- Council as delay tactic (set time/round limits)
- Ignoring dissent (always record minority positions)

## Related Skills

- **dm-team:compositions** — council team template
- **dm-team:tiered-delegation** — when to use council vs simpler delegation
- **dm-work:dialectical-refinement** — sequential alternative to parallel council debate

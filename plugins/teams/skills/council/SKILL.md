---
name: council
description: Multi-perspective deliberation using Agent Teams. Spawn 3-5 teammates with different viewpoints and optionally different models to debate decisions, evaluate specs, or explore trade-offs. Inspired by karpathy/llm-council.
---

# Council Deliberation Pattern

When facing decisions where multiple valid perspectives exist, spawn a deliberation team rather than relying on a single viewpoint. Council is a premium tool — use it rarely, for decisions that warrant deep thought from multiple angles.

## When to Use

- Architecture decisions with trade-offs (e.g., WebSockets vs SSE vs polling)
- Evaluating a spec or design for completeness
- Choosing between implementation approaches
- Any "should we X or Y?" decision with non-obvious trade-offs
- Post-mortem analysis of what went wrong

## Council Structure

| Role | Purpose | Model |
|------|---------|-------|
| Advocate | Argues for the most promising approach | opus |
| Skeptic | Finds flaws, challenges assumptions | opus |
| Pragmatist | Focuses on practical constraints (time, complexity, maintenance) | opus |
| Domain Expert | Brings specialized knowledge relevant to the topic | opus |
| Lead (you) | Frames the question, moderates, synthesizes | opus |

3 perspectives minimum, 5 maximum. Tailor roles to the specific decision.

All councilors use opus for maximum depth of reasoning. The council is designed for quality over speed — if you need fast iteration, use dialectical-refinement instead.

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

### Phase 5 — Persist (lead, mandatory)

Write the synthesis to `history/` so it survives context loss:

```bash
# Ensure history/ exists and is gitignored
mkdir -p history
grep -qx 'history/' .gitignore 2>/dev/null || echo 'history/' >> .gitignore
```

**File:** `history/council-<topic-slug>-<YYYY-MM-DD>.md`

**Contents:** The full output format (see below) — question, perspectives, key debates, recommendation, dissenting views, confidence.

**Why this is mandatory:** Council deliberations are expensive (3-5 opus subagents). If the session runs out of context or crashes, the recommendation is lost and must be re-run. Writing to `history/` makes recovery trivial — a fresh session reads the file and has the full council output.

**Recovery:** If a session finds `history/council-*.md` files, it can read them to recover prior deliberation results without re-running the council.

### Phase 6 — Rotate (lead, recommended)

Council deliberations consume ~25-35k tokens of conversation history (subagent prompts + responses). If the session needs to act on the council's recommendation (implementation work), **strongly recommend rotating first**:

1. Run `/rotate` to snapshot the session
2. Start fresh session — it auto-recovers from snapshot
3. Read `history/council-<topic>.md` for the full recommendation (~2k tokens vs 25-35k in conversation)

This prevents the #1 cause of council-related context overflow: running deliberation AND implementation in the same session.

**Exception:** If the council result is small and the follow-up work is trivial, skip the rotate.

## Model & Perspective Strategy

Epistemic diversity comes from **different analytical frames**, not different models. All councilors run on opus for maximum reasoning depth. Diversity is achieved through:

- Distinct system prompts that enforce different analytical lenses (e.g., advocate vs. skeptic)
- Role-specific constraints (e.g., "you must find at least 2 flaws" for the skeptic)
- Different information emphasis (same context, different focus areas)

Future option: cross-model councils (e.g., Codex, Gemini) via driver plugins could add genuine model diversity. Not yet implemented.

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

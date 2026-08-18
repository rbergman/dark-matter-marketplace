---
name: council
description: Use when facing a decision with genuine trade-offs and no obvious answer — architecture choices (WebSockets vs SSE vs polling), evaluating whether a spec is complete, picking between implementation approaches, any "should we X or Y?" where the answer is non-obvious, or post-mortem analysis of what went wrong. Spawns 3-5 agents with deliberately opposed analytical frames, has them challenge each other's positions, and synthesizes a recommendation that records dissent. Works whether or not Agent Teams is enabled. Council is expensive — reach for it when the decision is worth several agents' reasoning, not for questions a single subagent or a direct answer would settle.
---

# Council Deliberation

Multi-perspective deliberation for decisions where several valid positions exist. The mechanism is **structured disagreement**: agents assigned opposing frames, made to address each other's specific claims, then synthesized by the lead.

Council is a premium tool. A council that agrees immediately was a waste of five agents — if you can predict the outcome, decide directly.

## Two modes, one skill

Council spawns **named agents**. What they become depends on whether Agent Teams is enabled:

| Agent Teams | What happens | Cross-examination |
|-------------|--------------|-------------------|
| **Off** (default) | Named spawns run as ordinary subagents, each reporting its result back | Lead runs a second wave, handing each councilor the others' statements |
| **On** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | A named subagent launches as a **teammate** — they message each other directly | Live, in Phase 3 |

You do not need to detect which mode you're in for Phases 1, 2, 4 and 5 — they are identical. Only Phase 3 differs.

> **Teams-on trap:** a teammate's idle notification does **not** carry its output. If you spawn councilors as teammates and then wait for results, you will wait forever. Every spawn prompt must say: *"message the lead your statement directly when finished."*

## Council structure

| Role | Purpose |
|------|---------|
| Advocate | Argues for the most promising approach |
| Skeptic | Finds flaws, challenges assumptions — must produce at least 2 concrete objections |
| Pragmatist | Practical constraints: time, complexity, maintenance burden |
| Domain Expert | Specialized knowledge the decision turns on (add only when it does) |
| Lead (you) | Frames the question, moderates, synthesizes |

3 perspectives minimum, 5 maximum. Tailor roles to the decision — the defaults above are a starting point, not a template to apply unread.

**Model:** councilors run on the lead's model unless you name one in the spawn prompt or `CLAUDE_CODE_SUBAGENT_MODEL` is set. For council, that default is usually right: depth of reasoning is the entire point. Don't cheapen councilors to save tokens — if the decision doesn't warrant the cost, don't convene a council.

Epistemic diversity comes from **different analytical frames**, not different models. Achieve it through distinct spawn prompts that enforce different lenses, role-specific constraints ("you must find at least 2 flaws"), and different emphasis on the same shared context.

## Protocol

### Phase 1 — Framing (lead)

State the question precisely. Provide the context every councilor needs: relevant files, constraints, prior decisions that are settled and not up for debate. Assign each role its frame.

Councilors do not inherit your conversation history. Everything they need goes in the spawn prompt.

### Phase 2 — Opening statements

Each councilor states its position with evidence, 200-400 words. Spawn all of them in one message so they run concurrently.

### Phase 3 — Challenge round

The mechanism that makes council worth its cost. Councilors must address **specific claims**, not register general disagreement.

- **Teams on:** instruct councilors to message each other directly. 1-2 rounds. Monitor for convergence or stalemate.
- **Teams off:** run a second wave. Re-spawn each councilor with the other statements included verbatim, asking for rebuttals to the specific claims they find weakest. One wave is usually enough; a second rarely changes the outcome.

Intervene if the councilors are in violent agreement — reframe to create genuine tension, or accept that the decision was easier than it looked and stop early.

### Phase 4 — Synthesis (lead)

Summarize agreement and disagreement. Identify the strongest argument from each frame. Make a recommendation with reasoning. **Record dissenting views that have merit** — the minority position is often what you need six months later when the recommendation ages badly.

### Phase 5 — Persist (mandatory)

Council output is expensive and easy to lose to a context reset. Write it to disk:

```bash
mkdir -p history
grep -qx 'history/' .gitignore 2>/dev/null || echo 'history/' >> .gitignore
```

**File:** `history/council-<topic-slug>-<YYYY-MM-DD>.md`, containing the full output format below.

A later session that finds `history/council-*.md` can recover the deliberation by reading it (~2k tokens) instead of re-running it (~25-35k).

### Phase 6 — Compact before implementing

A council leaves 25-35k tokens of statements and rebuttals in the conversation. If the session now has to *act* on the recommendation, that history is dead weight and the leading cause of council-related context pressure.

Run `/compact` — the synthesis is already on disk from Phase 5, so nothing is at risk. Skip this only when the result is small and the follow-up trivial.

## Output format

```markdown
## Council Deliberation: [Topic]

### Question
[The specific question debated]

### Perspectives
- **[Role A]**: [1-2 sentence position summary]
- **[Role B]**: [1-2 sentence position summary]
- **[Role C]**: [1-2 sentence position summary]

### Key Debates
1. [Debate point] — [who argued what, resolution or ongoing disagreement]
2. [Debate point] — [...]

### Recommendation
[Synthesized recommendation with reasoning]

### Dissenting Views
[Positions that lost but have merit — recorded for future reference]

### Confidence
[High/Medium/Low] — [why]
```

## Anti-patterns

| Don't | Why |
|-------|-----|
| Convene a council for a decision you've already made | It produces expensive justification, not deliberation |
| Let councilors agree immediately | No tension means no information; reframe or stop |
| Use council as a delay tactic | Set round limits up front |
| Drop the dissent from the synthesis | The minority view is the part that ages well |
| Wait on teammate results without asking them to message you | Idle notifications carry no output — you will hang |

## Related

- **dm-team:lead** — team coordination protocol, when running councilors as teammates
- **dm-work:evaluator** — grading finished work against criteria, rather than deciding what to do

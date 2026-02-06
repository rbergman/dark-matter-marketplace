---
name: brainstorm
description: Multi-perspective brainstorming using Agent Teams. Spawn 2-3 teammates with different analytical angles who explore a design space simultaneously while the human observes and steers via the lead. Falls back to dm-work:brainstorming for simpler design work.
---

# Team Brainstorm

Multi-perspective brainstorming using Agent Teams.

## When to use team brainstorming

- Complex design decisions with multiple valid approaches
- When you want perspectives you wouldn't naturally consider
- Architecture that spans multiple domains (frontend + backend + infra)
- When 1:1 brainstorming would take too long to explore all angles

## When to use dm-work:brainstorming instead

- Simple feature design
- When human wants direct interactive dialogue
- When the design space is small (2-3 obvious approaches)
- Token budget is a concern

## Default perspectives

| Role | Analytical frame | Model |
|------|-----------------|-------|
| User Advocate | Focuses on UX, simplicity, user goals | sonnet |
| Technical Skeptic | Finds complexity, maintenance burden, failure modes | sonnet |
| Creative Explorer | Proposes unconventional approaches, challenges assumptions | sonnet |

Lead adds/replaces perspectives based on the specific domain.

## Protocol

### Phase 1 — Context (lead)

- Review project context (files, docs, commits)
- Frame the design question for teammates
- Assign perspectives

### Phase 2 — Parallel exploration (teammates, simultaneous)

- Each teammate explores the design space from their angle
- They share early findings with each other
- Cross-pollination encouraged — build on each other's ideas

### Phase 3 — Convergence (lead + human)

- Lead summarizes perspectives for the human
- Human steers: "I like the skeptic's point about X, but the explorer's idea about Y"
- Iterate until design crystallizes

### Phase 4 — Design document (lead)

- Write validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Include which perspectives informed which decisions

## Comparison with dm-work:brainstorming

| Aspect | dm-work:brainstorming | dm-team:brainstorm |
|--------|----------------------|------------------------|
| Interaction | 1:1 dialogue | Multi-perspective team |
| Speed | Faster for simple designs | Faster for complex designs |
| Token cost | Lower | Higher |
| Perspectives | Sequential (one at a time) | Simultaneous |
| Best for | Simple features, quick decisions | Complex architecture, trade-off heavy |

## Related

- **dm-work:brainstorming** — 1:1 alternative
- **dm-team:council** — for decisions, not designs
- **dm-team:compositions** — brainstorm team template

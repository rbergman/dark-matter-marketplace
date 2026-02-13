---
name: tiered-delegation
description: Decision framework for when to use Agent Teams vs Task() subagents vs single-session work. Use when facing delegation decisions to choose the right coordination mechanism.
---

# Tiered Delegation

Choose the right coordination mechanism for every task. Not everything needs a team, and not everything should stay in a single session.

## Three Tiers

| Tier | Mechanism | When | Token cost |
|------|-----------|------|------------|
| Single session | Direct work | Simple tasks, <30 lines, <3 files | Lowest |
| Subagents (Task()) | Fire-and-forget | Focused result-only tasks, research, lint/test, no inter-agent coordination needed | Low-Medium |
| Agent Teams | Persistent teammates | Complex multi-perspective work, adversarial refinement, cross-layer coordination, debate | High |

## Subagent Sweet Spots

Use `Task()` subagents when:

- **Research and exploration** — Explore agent gathers information, returns findings
- **Code review** that doesn't need cross-reviewer discussion
- **Running quality gates** — lint, typecheck, test in parallel
- **Single-file implementations** — contained scope, no coordination needed
- **Any task where only the result matters** — no need for workers to interact

Subagents are fire-and-forget. The orchestrator dispatches, waits for the result, and moves on. There is no inter-agent communication.

## Agent Teams Sweet Spots

Use Agent Teams when:

- **Research with competing hypotheses** — investigators challenge each other's findings
- **Collaborative code review** — reviewers debate findings, surface deeper issues together
- **Adversarial spec refinement** — live debate produces better specs than sequential pipeline
- **Multi-module implementation needing coordination** — shared interfaces, dependency ordering
- **Architecture decisions needing multiple perspectives** — trade-offs require deliberation
- **Any task requiring inter-agent discussion** — the conversation between agents is the value

Teams are persistent. Teammates see each other's messages, react, challenge, and build on each other's work.

## Decision Questions

Work through these in order:

1. **Do workers need to talk to each other?** → Teams
2. **Is it result-only work?** → Subagents
3. **Multiple perspectives needed?** → Teams
4. **Sequential dependencies between workers?** → Usually subagents (serial)
5. **Would the work benefit from adversarial tension?** → Teams

If you answer "subagents" to most but "teams" to even one, consider whether the team-worthy aspect can be isolated. Sometimes you run subagents for the bulk and a small team for the contentious part.

## Cost Awareness

- Each teammate is a separate Claude instance with full context
- Teams use significantly more tokens than subagents
- Don't use teams for routine tasks — overhead exceeds benefit
- A 3-person team costs roughly 3-4x a single subagent for the same work
- Reference **dm-work:orchestrator** delegation thresholds as the subagent baseline

## Escalation Path

**Start with subagents. Escalate to teams only when needed.**

1. Attempt the work with `Task()` subagents
2. If subagent results need discussion or synthesis beyond what the orchestrator can do alone, escalate to a team
3. If team results need broader input, expand the team or run a council

The cheapest correct answer wins. Don't reach for teams out of habit — reach for them when the problem demands collaboration.

## Related Skills

- **dm-work:orchestrator** — Delegation thresholds and subagent launch templates
- **dm-team:compositions** — Reusable team templates for common workflows

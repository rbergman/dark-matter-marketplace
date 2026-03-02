---
name: pm-script
description: Architecture and protocols for a Level 7.5 project manager — a Python script that coordinates multiple Claude Code worker sessions. Use when designing, building, or operating a PM that sits between a human director and a swarm of CC workers. Covers escalation engine, worker lifecycle, feedback translation, coherence monitoring, and demo generation.
---

# PM Script — Level 7.5 Project Management

A Python script (not a CC session) that sits between a human director and a swarm of Claude Code worker sessions. Uses the Claude Agent SDK for targeted LLM calls at decision points while handling bookkeeping deterministically.

## When to Use

- Designing or building a PM script that coordinates CC workers
- Operating an existing PM — understanding escalation tiers, worker lifecycle, feedback loops
- Choosing between coordination tiers (L5 orchestrator → L7 Agent Teams → L7.5 PM Script → L10 Gastown)
- Implementing specific PM subsystems: escalation engine, coherence monitoring, spinning detection

## Architecture Summary

```
Human Director → NL Frontend → PM Script → Worker Sessions (in worktrees)
```

- **Deterministic**: Worker spawn/rotate/kill, gate execution, token counting, worktree management, merge coordination
- **NL (LLM calls)**: Escalation classification, feedback translation, contradiction detection, coherence checking, demo narrative

The PM uses beads for work tracking and git worktrees for worker isolation.

## Key Subsystems

| Subsystem | Purpose | Reference section |
|-----------|---------|-------------------|
| Escalation engine | 3-tier (Log/Notify/Block) decisions across 12 domains | `references/pm-script-architecture.md` §2 |
| Worker lifecycle | Spawn → claim → checkpoint → rotate → complete | §3 |
| Feedback translation | Human intent → worker-scoped instructions | §4 |
| Demo/coherence | Progress summaries, architectural drift detection | §5, §6 |
| Spinning detection | Identify stuck workers (3+ attempts, no progress) | §3 |

## Reference Documents

Before implementing any PM subsystem, read the relevant reference:

- **`references/pm-script-architecture.md`** — Full architecture: escalation taxonomy, worker state machines, feedback protocols, coherence monitoring, demo generation. (~800 lines)
- **`references/piloting-guide.md`** — Phased adoption: single worker MVP → parallel workers → NL frontend → coherence monitoring. Start here for first-time setup.

### Reading strategy for large references

The architecture doc is large. Use targeted reads:

```
grep -n "^## " references/pm-script-architecture.md    # Section index
grep -n "<topic>" references/pm-script-architecture.md  # Find specific content
```

## Coordination Tier Selection

| Need | Tier | Tool |
|------|------|------|
| Focused single-task delegation | L5 | `dm-work:orchestrator` with `Task()` subagents |
| Multi-agent discussion/debate | L7 | `dm-team:lead` with Agent Teams |
| Multi-session worker coordination | **L7.5** | PM Script (this skill) |
| Full platform orchestration | L10 | Gastown |

Choose L7.5 when you need workers with independent context windows, session rotation, and deterministic coordination — but don't need a full platform.

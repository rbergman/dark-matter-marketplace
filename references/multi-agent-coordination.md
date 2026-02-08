# Multi-Agent Coordination: Three Tiers

A comparison of the three coordination models available for AI-assisted development, from lightweight single-session delegation to persistent multi-agent infrastructure.

---

## Tier 1: Orchestrator + Subagents (dm-work)

One Claude session delegates focused tasks to ephemeral workers via `Task()`. Workers report back and disappear. The orchestrator manages all state, commits, and coordination.

### Sweet spots

- Implementing a set of independent beads in parallel
- Code review with isolated reviewers (arch, code, security)
- Sequential spec refinement (dialectical refinement pipeline)
- Research and exploration (Explore agents)
- Any work where you only need the result, not a conversation
- Running quality gates, linting, test suites

### Characteristics

- **Hub-and-spoke**: all communication goes through the orchestrator
- **Ephemeral**: subagents are fire-and-forget, no persistence
- **Token-efficient**: subagents return terse summaries, details go to files
- **Single context window** manages the entire workflow
- **File ownership** enforced via prompt convention
- **Beads** provides cross-session persistence that subagents lack

### Limits

- Workers can't talk to each other
- Orchestrator is the bottleneck for all decisions
- No genuine adversarial tension (same model, sequential passes)
- Context window is the ceiling — one compaction max before quality degrades

### Relevant skills

- `dm-work:orchestrator` — lead role
- `dm-work:subagent` — worker role
- `/dm-work:subagent`, `/dm-work:subagents` — delegation commands
- `/dm-work:review` — parallel isolated reviewers
- `/dm-work:refine` — sequential adversarial refinement

---

## Tier 2: Agent Teams (dm-team)

One Claude session (the lead) spawns persistent teammate sessions that communicate with each other directly, share a task list, and self-coordinate. Each teammate has its own full context window. Built on Anthropic's [Agent Teams](https://code.claude.com/docs/en/agent-teams) feature.

### Sweet spots

- Adversarial spec refinement as live debate (Proposer and Advocate argue in real time)
- LLM Council deliberation (3-5 perspectives debating a decision with model diversity)
- Collaborative code review (reviewers challenge each other's findings)
- Multi-perspective brainstorming (simultaneous exploration from different angles)
- Debugging with competing hypotheses (investigators try to disprove each other)
- Architecture decisions where trade-offs need genuine argument

### Characteristics

- **Mesh communication**: teammates message each other directly
- **Persistent within session**: teammates survive across multiple tasks
- **Higher token cost**: each teammate is a full Claude instance
- **Shared task list** with self-claiming
- **Delegate mode** restricts lead to coordination only (Shift+Tab)
- **Model diversity**: different models per teammate enables epistemic diversity

### Limits

- One session only — teammates don't survive `/resume` or crashes
- One team per session, no nested teams
- Claude only — can't mix runtimes
- 3-5 teammates practical, not 20+
- No persistent state — when the session ends, the team is gone
- Beads still needed for cross-session continuity

### Relevant skills

- `dm-team:lead` — team lead role
- `dm-team:teammate` — teammate role
- `dm-team:tiered-delegation` — when to use teams vs subagents
- `dm-team:compositions` — reusable team templates
- `/dm-team:council`, `/dm-team:refine`, `/dm-team:review` — team commands

### Setup

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Tier 3: Gastown

A workspace manager ([github.com/steveyegge/gastown](https://github.com/steveyegge/gastown)) that coordinates multiple AI agents across projects, sessions, and runtimes. Work state persists in git-backed infrastructure. Agents can crash, restart, and pick up exactly where they left off.

### Sweet spots

- Long-running multi-epic development across days/weeks
- 10-30+ parallel agents working across multiple repositories
- Mixed-runtime orchestration (Claude, Codex, Gemini, Cursor)
- Work that must survive crashes, restarts, and session boundaries
- Complex dependency graphs across dozens of work items
- Teams of humans and agents collaborating on the same project

### Characteristics

- **Mayor** (orchestrator) coordinates **Polecats** (ephemeral workers) across **Rigs** (project containers)
- **Git worktree-based persistence** — agent work survives crashes in hooks
- **Convoys** bundle beads into assignable work packages
- **Built-in mailboxes** for async agent communication
- **Formula workflows** for repeatable processes
- **Runtime-agnostic**: any AI coding tool that can read/write files
- **Beads is the native state layer** — same `bd` CLI, same issue tracking

### Limits

- Infrastructure setup required (town directory, rigs, mayor config)
- More moving parts to understand and maintain
- Designed for scale — overkill for "implement these 3 beads"

---

## Side-by-Side Comparison

|  | Subagents | Agent Teams | Gastown |
|---|-----------|-------------|---------|
| **Core mechanism** | Fire-and-forget tasks | Persistent peer sessions | Git-backed agent infrastructure |
| **Communication** | Report to orchestrator only | Teammates message each other | Mailboxes + beads + hooks |
| **Persistence** | None (beads adds it externally) | None (session-scoped) | Native (git worktrees + hooks) |
| **Scale** | 1-6 parallel workers | 3-5 teammates | 10-30+ agents |
| **Session boundary** | Beads carries state forward | Team dies, beads carries state | Everything survives |
| **Runtimes** | Claude only | Claude only | Any |
| **Setup cost** | Zero | One env var | Town + rigs + mayor |
| **Token cost** | Low | High | Distributed across agents |

---

## The Relationship

These are not a progression — they don't build on each other as stepping stones. They're different tools for different scales of coordination.

**Agent Teams is not a stepping stone to Gastown** because it doesn't solve the same problem. Subagents and Agent Teams both operate *within a single Claude session* — they're ways to parallelize work inside one sitting. Gastown operates *across sessions, agents, and time* — it's infrastructure for persistent multi-agent development.

The actual stepping stone to Gastown is **beads itself**. Once you're tracking work in beads, you already have the persistent state layer that Gastown builds on. The jump from "beads + orchestrator in one session" to "Gastown managing agents across sessions" is about adding infrastructure for agent persistence and communication — not about how agents coordinate within a session.

**They are complementary.** A Gastown Polecat could internally use Agent Teams to spawn a review team or run a council, then report results back through Gastown's hooks. Teams is a session-level tactic. Gastown is a project-level strategy.

### The typical workflow uses all three

```
Council/Refine (teams)  →  Breakdown (beads)  →  Implement (subagents)  →  Review (teams)
       ↑                                                                        ↓
       └────────────────── Gastown persists everything across sessions ──────────┘
```

- **Teams** for decisions and quality (pre/post-implementation)
- **Subagents** for execution (implementation)
- **Gastown** for persistence and scale (the outer loop)

---

## Choosing the Right Tier

| Situation | Use |
|-----------|-----|
| Implement 5 independent beads | Subagents |
| "Should we use X or Y?" | Agent Teams (council) |
| Refine a complex spec | Agent Teams (refinement) |
| Review a PR thoroughly | Agent Teams (review) or Subagents (simpler PRs) |
| Multi-epic work across weeks | Gastown |
| 20 agents across 5 repos | Gastown |
| Quick research task | Subagents (Explore agent) |
| Single file fix | Direct (no delegation needed) |

See `dm-team:tiered-delegation` for the full decision framework between subagents and teams.

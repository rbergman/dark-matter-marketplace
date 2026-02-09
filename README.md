# Dark Matter Marketplace

A personal Claude Code plugin marketplace for workflows, skills, and agents that I use daily.

## Disclaimer

**This is my personal repo.** It reflects my workflows, preferences, and experiments. YMMV.

- Changes frequently, often without notice
- Often in an experimental state
- May contain half-baked ideas alongside polished tools
- Not designed for general consumption, but you're welcome to browse

If something here is useful to you, great. If not, no worries.

---

## Quick Start

```bash
# Add the marketplace
claude plugin marketplace add rbergman/dark-matter-marketplace

# Install plugins
claude plugin install dm-work@dark-matter-marketplace
claude plugin install dm-lang@dark-matter-marketplace
# ... or any other dm-* plugin

# Update after changes
claude plugin marketplace update dark-matter-marketplace
```

---

## Naming Convention

All components use the `dm-*` plugin prefix with semantic groupings:

| Plugin | Prefix | Example |
|--------|--------|---------|
| dm-arch | Architecture patterns | `dm-arch:solid-architecture` |
| dm-drvr | External AI drivers | `dm-drvr:codex-driver` |
| dm-team | Agent Teams patterns | `dm-team:lead` |
| dm-game | Game development | `dm-game:game-design` |
| dm-lang | Language expertise | `dm-lang:typescript-pro` |
| dm-tool | Tool design patterns | `dm-tool:agent-dx-cli` |
| dm-work | Workflow tools | `dm-work:orchestrator` |

Commands use `/dm-work:command` format (e.g., `/dm-work:rotate`).

---

## Repository Structure

```
dark-matter-marketplace/
├── plugins/           # Installable Claude Code plugins
│   ├── architecture/  # dm-arch: SOLID, data-oriented patterns
│   ├── drivers/       # dm-drvr: Codex, Gemini delegation
│   ├── game-dev/      # dm-game: design methodology, perf optimization
│   ├── language-pro/  # dm-lang: Go, Rust, TypeScript, Python, just
│   ├── teams/       # dm-team: Agent Teams orchestration and collaboration
│   ├── tooling/       # dm-tool: CLI/MCP/API design for agents
│   └── workflow/      # dm-work: orchestration, specs, subagents
├── references/        # Non-installable reference materials
│   ├── CLAUDE.md      # Global Claude instructions
│   ├── workflow.md    # Human guide to the dev loop
│   ├── official-plugins.md  # Official Anthropic plugins guide
│   ├── lsp-setup.md   # LSP configuration and troubleshooting
│   ├── autonomous-runs.md   # Sandboxing Claude (srt for CLI/autonomous runs)
│   └── lang-skill-adaptation.md  # Adapting skills + DX testing
└── README.md
```

---

## Plugins

### dm-arch (architecture/)

SOLID principles and data-oriented design patterns.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-arch:solid-architecture` | Skill | SOLID principles, composition patterns, module organization, side-effect boundaries |
| `dm-arch:data-oriented-architecture` | Skill | Registry-based dispatch, capability composition, infrastructure-first development |

### dm-work (workflow/)

Workflow tools for spec refinement, context management, and subagent delegation.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-work:orchestrator` | Skill | Activate at session start — delegation protocols, subagent templates, token efficiency |
| `dm-work:subagent` | Skill | Activate when delegated — terse returns, file boundaries, escalation rules |
| `dm-work:dialectical-refinement` | Skill | Transform ambiguous specs into implementable work items through adversarial refinement |
| `dm-work:worktrees` | Skill | Git worktrees for isolated workspaces — bd worktree commands with beads integration |
| `dm-work:brainstorming` | Skill | Collaborative design dialogue — questions, approaches, incremental validation |
| `dm-work:debugging` | Skill | Systematic debugging — root cause before fixes, no random patching |
| `dm-work:tdd` | Skill | Test-driven development — write failing test first, then minimal code to pass |
| `dm-work:mise` | Skill | Modern dev tool version management — replaces nvm/pyenv/goenv, direnv integration |
| `dm-work:repo-init` | Skill | Initialize new repos with standard scaffolding — git, CLAUDE.md, justfile, mise, beads |
| `dm-work:cli-tools` | Skill | Power CLI tools (fd, rg, jq, yq, sd, bat, delta) for when built-ins are insufficient |
| `dm-work:srt` | Skill | Sandboxing Claude — `/sandbox` for interactive, srt for CLI/autonomous runs |
| `/dm-work:breakdown` | Command | Decompose specs into granular tasks |
| `/dm-work:refine` | Command | Sharpen individual work items |
| `/dm-work:compress` | Command | Compress documents for token-efficient agent consumption |
| `/dm-work:rotate` | Command | Session rotation — snapshot + save + /copy + /clear + paste to resume |
| `/dm-work:review` | Command | Parallel arch/code/security review — local (beads) or PR (GH comments) |
| `/dm-work:triage` | Command | Triage PR review comments — accept to beads, reject with reply |
| `/dm-work:advice` | Command | Get architectural guidance |
| `/dm-work:subagent` | Command | Delegate work to a single subagent |
| `/dm-work:subagents` | Command | Orchestrate multiple subagents with dependency awareness |

### dm-drvr (drivers/)

Agents for delegating work to external AI systems.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-drvr:codex-driver` | Agent | Delegate bead implementation to Codex CLI with quality gates |
| `dm-drvr:gemini-driver` | Agent | Leverage Gemini's 1M context for planning, research, and deep analysis |

### dm-game (game-dev/)

Game design methodology, performance optimization, and project bootstrapping.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-game:game-design` | Skill | 5-Component Framework (Clarity, Motivation, Response, Satisfaction, Fit) for evaluating mechanics |
| `dm-game:game-perf` | Skill | Zero-allocation patterns for JS/TS game loops and hot paths |
| `dm-game:pixi-vector-arcade` | Skill | Bootstrap PixiJS 8 games with retro vector aesthetics, ECS-lite, pooling, spatial hashing |

### dm-lang (language-pro/)

Language-specific expertise with strict, opinionated standards.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-lang:go-pro` | Skill | Idiomatic Go: error handling, concurrency, slog, generics, table-driven tests |
| `dm-lang:python-pro` | Skill | Modern Python: uv, ruff, pyright, type safety, clean module design |
| `dm-lang:rust-pro` | Skill | "Boring Rust" philosophy: clone freely, for loops over iterators, strict lints |
| `dm-lang:typescript-pro` | Skill | Strict TypeScript: zero-any tolerance, no-unsafe-*, floating promise prevention |
| `dm-lang:rescript-pro` | Skill | Type-safe ReScript: exhaustive matching, typed FFI, React integration, pipe-first style |
| `dm-lang:just-pro` | Skill | `just` command runner patterns for single projects and monorepos |

### dm-team (teams/)

Agent Teams patterns for multi-agent coordination, deliberation, and collaborative workflows. Built on Anthropic's [Agent Teams](https://code.claude.com/docs/en/agent-teams) feature.

**Experimental** — Agent Teams is in preview and disabled by default. Enable it:

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**When to use dm-team vs dm-work:** dm-work uses `Task()` subagents — fire-and-forget workers that report back to the orchestrator. dm-team uses Agent Teams — persistent teammates with their own context windows that message each other directly, self-claim tasks, and collaborate. Use dm-work for focused result-only delegation. Use dm-team when agents need to discuss, challenge each other, or coordinate. See `dm-team:tiered-delegation` for the full decision framework.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-team:lead` | Skill | Team lead protocol — delegation, teammate spawning, model selection, beads integration |
| `dm-team:teammate` | Skill | Teammate protocol — file ownership, self-claiming, inter-agent communication |
| `dm-team:council` | Skill | Multi-perspective deliberation (LLM Council pattern) for decisions and trade-offs |
| `dm-team:refinement` | Skill | Live adversarial spec refinement through teammate debate |
| `dm-team:review` | Skill | Collaborative code review where reviewers discuss and challenge findings |
| `dm-team:brainstorm` | Skill | Multi-perspective brainstorming with simultaneous exploration |
| `dm-team:tiered-delegation` | Skill | Decision framework: when to use Agent Teams vs subagents vs single session |
| `dm-team:compositions` | Skill | Reusable team templates and beads-teams bridge patterns |
| `/dm-team:council` | Command | Spawn a deliberation council for a decision or topic |
| `/dm-team:refine` | Command | Team-based adversarial spec refinement |
| `/dm-team:review` | Command | Collaborative team code review |

### dm-tool (tooling/)

Patterns for designing tools that agents can use effectively.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-tool:agent-dx-cli` | Skill | CLI design patterns: minimal ceremony, JSON output, context injection, batch ops, error handling |

---

## References

Non-installable materials for reference and sharing.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Global instructions — prime directive, role selection (orchestrator or team lead), beads guidance |
| `workflow.md` | Human guide to the development loop (80k rule, snapshot workflow, beads) |
| `official-plugins.md` | Guide to official Anthropic plugins (code-simplifier, feature-dev, etc.) |
| `lsp-setup.md` | LSP configuration, verification, and troubleshooting for all languages |
| `autonomous-runs.md` | Sandboxing Claude — `/sandbox` for interactive, srt for CLI/autonomous |
| `lang-skill-adaptation.md` | Workflow for adapting skills to new languages and DX testing them |
| `multi-agent-coordination.md` | Three tiers: subagents vs Agent Teams vs Gastown |
| `testing-agent-teams.md` | Testing guide for the dm-team plugin |

---

## Installation

```bash
# Add the marketplace
claude plugin marketplace add rbergman/dark-matter-marketplace

# Update marketplace index
claude plugin marketplace update dark-matter-marketplace

# Install plugins
claude plugin install dm-arch@dark-matter-marketplace
claude plugin install dm-drvr@dark-matter-marketplace
claude plugin install dm-game@dark-matter-marketplace
claude plugin install dm-lang@dark-matter-marketplace
claude plugin install dm-team@dark-matter-marketplace
claude plugin install dm-tool@dark-matter-marketplace
claude plugin install dm-work@dark-matter-marketplace
```

---

## Philosophy

See `references/workflow.md` for the full workflow, but the core ideas:

1. **Orchestrator model** — You strategize, Claude orchestrates, agents implement (subagents for focused tasks, Agent Teams for collaborative work)
2. **Context is precious** — Delegate to preserve it; checkpoint to manage it
3. **External state** — Use beads to track work outside the conversation
4. **One compaction max** — Multiple compactions compound information loss

### Developer Experience (DX)

The plugins include opinionated DX tooling that works together:

| Tool | Skill | Purpose |
|------|-------|---------|
| [mise](https://mise.jdx.dev) | `dm-work:mise` | Version management for all languages/tools — replaces nvm, pyenv, goenv |
| [just](https://just.systems) | `dm-lang:just-pro` | Command runner — consistent `just check`, `just setup` across projects |
| CLI tools | `dm-work:cli-tools` | fd, rg, jq, yq, sd, bat, delta — power tools when built-ins aren't enough |
| [srt](https://github.com/anthropic-experimental/sandbox-runtime) | `dm-work:srt` | Sandbox Runtime — OS-level isolation for CLI/autonomous runs (use `/sandbox` for interactive) |

**The pattern**: Projects have a `.mise.toml` (pinned versions) and `justfile` (commands). Setup is always `just setup` → runs `mise trust && mise install` + language deps. This ensures reproducible environments without requiring devs to configure their shells.

### Beads

[Beads](https://github.com/steveyegge/beads) is the issue tracking CLI I use, and it appears throughout these plugins. It's a critical part of my workflow — providing external state that survives session boundaries, enabling orchestrators to track progress across compactions, and giving subagents clear work items to implement.

References to `bd` CLI, bead IDs (like `whiteout-4eed`), and bead states (`ready`, `claimed`, `done`) appear in many skills and agents. If you're not using beads, you can substitute your own issue tracking system or ignore those references.

---

## License

Do whatever you want. No warranties, no support, no guarantees.

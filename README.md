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

## Naming Convention

All skills, agents, and commands use the `dm:` prefix (for "dark matter"):

- Skills: `dm:typescript-pro`, `dm:orchestrator`, `dm:game-design`
- Agents: `dm:codex-driver`, `dm:gemini-driver`
- Commands: `/dm:breakdown`, `/dm:precompact`, `/dm:subagents`

Plugins retain semantic directory names for organization.

---

## Repository Structure

```
dark-matter-marketplace/
├── plugins/           # Installable Claude Code plugins
│   ├── architecture/  # SOLID principles, data-oriented patterns
│   ├── dm/            # Workflow tools (spec refinement, subagents, precompact)
│   ├── drivers/       # External AI delegation (Codex, Gemini)
│   ├── game-dev/      # Game design methodology, performance optimization
│   └── language-pro/  # Language-specific expertise (Go, Rust, TS, just)
├── references/        # Non-installable reference materials
│   ├── CLAUDE.md      # My global Claude instructions
│   └── workflow.md    # Context-preserving development workflow
└── README.md
```

---

## Plugins

### architecture

SOLID principles and data-oriented design patterns.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm:solid-architecture` | Skill | SOLID principles, composition patterns, module organization, side-effect boundaries |
| `dm:data-oriented-architecture` | Skill | Registry-based dispatch, capability composition, infrastructure-first development |

### dm

Workflow tools for spec refinement, context management, and subagent delegation.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm:orchestrator` | Skill | Activate at session start — delegation protocols, subagent templates, token efficiency |
| `dm:subagent` | Skill | Activate when delegated — terse returns, file boundaries, escalation rules |
| `dm:dialectical-refinement` | Skill | Transform ambiguous specs into implementable work items through adversarial refinement |
| `/dm:breakdown` | Command | Decompose specs into granular tasks |
| `/dm:refine` | Command | Sharpen individual work items |
| `/dm:compress` | Command | Compress documents for token-efficient agent consumption |
| `/dm:precompact` | Command | Lightweight context summary before session pause (see workflow.md) |
| `/dm:review` | Command | Parallel architecture + code review via subagents |
| `/dm:advice` | Command | Get architectural guidance |
| `/dm:subagent` | Command | Delegate work to a single subagent |
| `/dm:subagents` | Command | Orchestrate multiple subagents with dependency awareness |

### drivers

Agents for delegating work to external AI systems.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm:codex-driver` | Agent | Delegate bead implementation to Codex CLI with quality gates |
| `dm:gemini-driver` | Agent | Leverage Gemini's 1M context for planning, research, and deep analysis |

### game-dev

Game design methodology and performance optimization.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm:game-design` | Skill | 5-Component Framework (Clarity, Motivation, Response, Satisfaction, Fit) for evaluating mechanics |
| `dm:game-perf` | Skill | Zero-allocation patterns for JS/TS game loops and hot paths |

### language-pro

Language-specific expertise with strict, opinionated standards.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm:go-pro` | Skill | Idiomatic Go: error handling, concurrency, slog, generics, table-driven tests |
| `dm:rust-pro` | Skill | "Boring Rust" philosophy: clone freely, for loops over iterators, strict lints |
| `dm:typescript-pro` | Skill | Strict TypeScript: zero-any tolerance, no-unsafe-*, floating promise prevention |
| `dm:just-pro` | Skill | `just` command runner patterns for single projects and monorepos |

---

## References

Non-installable materials for reference and sharing.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Minimal global instructions — prime directive + pointer to `dm:orchestrator` skill |
| `workflow.md` | Human guide to the development loop (80k rule, precompact workflow, beads) |

---

## Installation

```bash
# Add the marketplace
claude plugin marketplace add dark-matter-marketplace https://github.com/rbergman/dark-matter-marketplace

# Update marketplace index
claude plugin marketplace update dark-matter-marketplace

# Install a plugin
claude plugin install language-pro@dark-matter-marketplace
claude plugin install dm@dark-matter-marketplace
# etc.
```

---

## Philosophy

See `references/workflow.md` for the full workflow, but the core ideas:

1. **Orchestrator model** — You strategize, Claude orchestrates, subagents implement
2. **Context is precious** — Delegate to preserve it; precompact to manage it
3. **External state** — Use beads to track work outside the conversation
4. **One compaction max** — Multiple compactions compound information loss

### Beads

[Beads](https://github.com/steveyegge/beads) is the issue tracking CLI I use, and it appears throughout these plugins. It's a critical part of my workflow — providing external state that survives session boundaries, enabling orchestrators to track progress across compactions, and giving subagents clear work items to implement.

References to `bd` CLI, bead IDs (like `whiteout-4eed`), and bead states (`ready`, `claimed`, `done`) appear in many skills and agents. If you're not using beads, you can substitute your own issue tracking system or ignore those references.

---

## License

Do whatever you want. No warranties, no support, no guarantees.

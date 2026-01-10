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
| `solid-architecture` | Skill | SOLID principles, composition patterns, module organization, side-effect boundaries |
| `data-oriented-architecture` | Skill | Registry-based dispatch, capability composition, infrastructure-first development |

### dm

Workflow tools for spec refinement, context management, and subagent delegation.

| Component | Type | Purpose |
|-----------|------|---------|
| `dialectical-refinement` | Skill | Transform ambiguous specs into implementable work items through adversarial refinement |
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
| `codex-driver` | Agent | Delegate bead implementation to Codex CLI with quality gates |
| `gemini-driver` | Agent | Leverage Gemini's 1M context for planning, research, and deep analysis |

### game-dev

Game design methodology and performance optimization.

| Component | Type | Purpose |
|-----------|------|---------|
| `game-design` | Skill | 5-Component Framework (Clarity, Motivation, Response, Satisfaction, Fit) for evaluating mechanics |
| `game-perf` | Skill | Zero-allocation patterns for JS/TS game loops and hot paths |

### language-pro

Language-specific expertise with strict, opinionated standards.

| Component | Type | Purpose |
|-----------|------|---------|
| `go-pro` | Skill | Idiomatic Go: error handling, concurrency, slog, generics, table-driven tests |
| `rust-pro` | Skill | "Boring Rust" philosophy: clone freely, for loops over iterators, strict lints |
| `typescript-pro` | Skill | Strict TypeScript: zero-any tolerance, no-unsafe-*, floating promise prevention |
| `just-pro` | Skill | `just` command runner patterns for single projects and monorepos |

---

## References

Non-installable materials for reference and sharing.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | My global Claude instructions (orchestrator model, prime directive) |
| `workflow.md` | Context-preserving development workflow (the 80k rule, precompact loop) |

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
3. **External state** — Use beads/issues to track work outside the conversation
4. **One compaction max** — Multiple compactions compound information loss

---

## License

Do whatever you want. No warranties, no support, no guarantees.

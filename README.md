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
claude plugin marketplace add dark-matter-marketplace https://github.com/rbergman/dark-matter-marketplace

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
| dm-lang | Language expertise | `dm-lang:typescript-pro` |
| dm-work | Workflow tools | `dm-work:orchestrator` |
| dm-game | Game development | `dm-game:game-design` |
| dm-drvr | External AI drivers | `dm-drvr:codex-driver` |
| dm-arch | Architecture patterns | `dm-arch:solid-architecture` |

Commands use `/dm-work:command` format (e.g., `/dm-work:precompact`).

---

## Repository Structure

```
dark-matter-marketplace/
├── plugins/           # Installable Claude Code plugins
│   ├── architecture/  # dm-arch: SOLID, data-oriented patterns
│   ├── drivers/       # dm-drvr: Codex, Gemini delegation
│   ├── game-dev/      # dm-game: design methodology, perf optimization
│   ├── language-pro/  # dm-lang: Go, Rust, TypeScript, just
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
| `dm-work:cli-tools` | Skill | Power CLI tools (fd, rg, jq, yq, sd, bat, delta) for when built-ins are insufficient |
| `dm-work:srt` | Skill | Sandboxing Claude — `/sandbox` for interactive, srt for CLI/autonomous runs |
| `/dm-work:breakdown` | Command | Decompose specs into granular tasks |
| `/dm-work:refine` | Command | Sharpen individual work items |
| `/dm-work:compress` | Command | Compress documents for token-efficient agent consumption |
| `/dm-work:precompact` | Command | Lightweight context summary before session pause (see workflow.md) |
| `/dm-work:review` | Command | Parallel architecture + code review via subagents |
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

Game design methodology and performance optimization.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-game:game-design` | Skill | 5-Component Framework (Clarity, Motivation, Response, Satisfaction, Fit) for evaluating mechanics |
| `dm-game:game-perf` | Skill | Zero-allocation patterns for JS/TS game loops and hot paths |

### dm-lang (language-pro/)

Language-specific expertise with strict, opinionated standards.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-lang:go-pro` | Skill | Idiomatic Go: error handling, concurrency, slog, generics, table-driven tests |
| `dm-lang:rust-pro` | Skill | "Boring Rust" philosophy: clone freely, for loops over iterators, strict lints |
| `dm-lang:typescript-pro` | Skill | Strict TypeScript: zero-any tolerance, no-unsafe-*, floating promise prevention |
| `dm-lang:just-pro` | Skill | `just` command runner patterns for single projects and monorepos |

---

## References

Non-installable materials for reference and sharing.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Minimal global instructions — prime directive + pointer to `dm-work:orchestrator` skill |
| `workflow.md` | Human guide to the development loop (80k rule, precompact workflow, beads) |
| `official-plugins.md` | Guide to official Anthropic plugins (code-simplifier, feature-dev, etc.) |
| `lsp-setup.md` | LSP configuration, verification, and troubleshooting for all languages |
| `autonomous-runs.md` | Sandboxing Claude — `/sandbox` for interactive, srt for CLI/autonomous |
| `lang-skill-adaptation.md` | Workflow for adapting skills to new languages and DX testing them |

---

## Installation

```bash
# Add the marketplace
claude plugin marketplace add dark-matter-marketplace https://github.com/rbergman/dark-matter-marketplace

# Update marketplace index
claude plugin marketplace update dark-matter-marketplace

# Install plugins
claude plugin install dm-lang@dark-matter-marketplace
claude plugin install dm-work@dark-matter-marketplace
claude plugin install dm-arch@dark-matter-marketplace
claude plugin install dm-game@dark-matter-marketplace
claude plugin install dm-drvr@dark-matter-marketplace
```

---

## Philosophy

See `references/workflow.md` for the full workflow, but the core ideas:

1. **Orchestrator model** — You strategize, Claude orchestrates, subagents implement
2. **Context is precious** — Delegate to preserve it; precompact to manage it
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

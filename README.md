# Dark Matter Marketplace

A Claude Code plugin marketplace for development skills and productivity tools.

## Installation

```bash
claude plugin marketplace add https://github.com/YOUR_USERNAME/dark-matter-marketplace
```

Then install individual plugins:

```bash
claude plugin install go-pro@dark-matter-marketplace
claude plugin install justfile@dark-matter-marketplace
claude plugin install typescript-pro@dark-matter-marketplace
# ... etc
```

## Plugins

| Plugin | Description |
|--------|-------------|
| **go-pro** | Expert Go development with idiomatic patterns, concurrency, error handling, and golangci-lint v2 |
| **justfile** | Patterns for just (command runner) - simple repos and monorepos with hierarchical modules |
| **typescript-pro** | Expert TypeScript with advanced types, full-stack development, and build optimization |
| **rust-pro** | Expert Rust with ownership semantics, zero-cost abstractions, and idiomatic patterns |
| **solid-architecture** | SOLID principles, composition patterns, module organization, and side-effect boundaries |
| **data-oriented-architecture** | Registry-based dispatch, capability composition, and infrastructure-first patterns |
| **dialectical-refinement** | Transform ambiguous specs into implementable work items via adversarial refinement |
| **game-perf** | Optimize game code for per-frame performance and GC pressure |

## Adding Plugins

Each plugin lives in its own directory:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── skill-name/
        ├── SKILL.md
        └── references/
```

## License

MIT

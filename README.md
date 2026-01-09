# Dark Matter Marketplace

A Claude Code plugin marketplace for skills, agents, and tools.

## Installation

```bash
claude plugin marketplace add https://github.com/YOUR_USERNAME/dark-matter-marketplace
claude plugin install go-pro@dark-matter-marketplace
```

## Plugins

| Plugin | Description |
|--------|-------------|
| **go-pro** | Expert Go development with idiomatic patterns, concurrency, error handling, and golangci-lint v2 config |

## Adding Plugins

Each plugin lives in its own directory with this structure:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json
├── skills/
├── agents/
├── commands/
└── hooks/
```

## License

MIT

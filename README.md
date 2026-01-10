# Dark Matter Marketplace

Claude Code plugins for development skills, agents, and productivity.

## Installation

```bash
claude plugin marketplace add https://github.com/YOUR_USERNAME/dark-matter-marketplace
claude plugin install language-pro@dark-matter-marketplace
claude plugin install workflow@dark-matter-marketplace
```

## Plugins (5)

| Plugin | Contents |
|--------|----------|
| **language-pro** | Skills: go-pro, rust-pro, typescript-pro |
| **architecture** | Skills: solid-architecture, data-oriented-architecture |
| **game-dev** | Agents: game-designer, game-developer · Skill: game-perf |
| **workflow** | Skills: dialectical-refinement, justfile · Commands: /dm:breakdown, /dm:refine, /dm:compress, /dm:precompact, /dm:review, /dm:advice, /dm:subagent, /dm:subagents |
| **drivers** | Agents: codex-driver, gemini-driver |

## Structure

```
plugins/
├── language-pro/
│   └── skills/{go-pro,rust-pro,typescript-pro}/
├── architecture/
│   └── skills/{solid-architecture,data-oriented-architecture}/
├── game-dev/
│   ├── agents/{game-designer,game-developer}.md
│   └── skills/game-perf/
├── workflow/
│   ├── skills/{dialectical-refinement,justfile}/
│   └── commands/dm:*.md
└── drivers/
    └── agents/{codex-driver,gemini-driver}.md
```

## License

MIT

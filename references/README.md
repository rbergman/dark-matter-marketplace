# References (Repo-Level)

These are human-facing docs about how the marketplace, plugins, and workflow fit together. They are **not** shipped with installed plugins — Claude Code does not see them when a plugin is loaded.

Audience: contributors reading the repo, evaluating the workflow, or onboarding to dark-matter conventions.

## What goes here

- Repo-wide explanations (workflow loops, multi-agent coordination, official-plugin landscape)
- Setup guides that span multiple plugins (LSP, language skill adaptation)
- Background context that would clutter top-level README.md

## What does NOT go here

Plugin-shipped reference material. If a skill or command needs to *load* a reference file at runtime, it lives under that skill:

```
plugins/<plugin>/skills/<skill>/references/<file>.md
```

These ship with the plugin and are accessible to the skill via the relative path `references/<file>.md` or via `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/references/<file>.md`. Examples: `plugins/game-dev/skills/pixi-vector-arcade/references/`, `plugins/language-pro/skills/typescript-pro/references/`.

If you find yourself wanting to link from a SKILL.md or command.md into this top-level directory, stop — the content needs to live inside the plugin instead.

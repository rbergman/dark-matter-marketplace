# Dark Matter Marketplace - Claude Instructions

## Plugin Version Bumps

**Always bump plugin versions when making changes.**

When modifying any plugin content (skills, commands, agents, references):

1. Find the plugin's `plugin.json`:
   ```
   plugins/<plugin-name>/.claude-plugin/plugin.json
   ```

2. Bump the version using semver:
   - **Patch** (0.1.0 → 0.1.1): Bug fixes, typo corrections, minor clarifications
   - **Minor** (0.1.0 → 0.2.0): New skills/commands, significant content changes
   - **Major** (0.1.0 → 1.0.0): Breaking changes, major restructuring

3. After committing, update the marketplace:
   ```bash
   claude plugin marketplace update dark-matter-marketplace
   ```

## Plugin Structure

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json      # Name, version, description
├── skills/              # SKILL.md files (auto-invoked)
├── commands/            # Slash commands
├── agents/              # Subagent definitions
└── hooks/               # Event hooks
```

## Cross-References

When skills reference each other, use the format:
- **skill-name** - Brief description

Example: "See the **mise** skill for version management setup."

## Conventions

- Skills use SKILL.md with YAML frontmatter (`name`, `description`)
- Commands use markdown with YAML frontmatter (`description`, `argument-hint`)
- Keep skills focused - one concept per skill
- Include "Related skills" section when appropriate

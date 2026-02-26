---
description: Commit, push, update marketplace, and reinstall plugin
argument-hint: "<plugin-name>"
---

# Ship Plugin Changes

Execute the full release workflow for a plugin change.

## Arguments

Plugin name: $ARGUMENTS

If no plugin name provided, infer from `git status` by looking at which `plugins/<name>/` directory has changes.

## Steps

1. **Commit** - Stage all changes and commit with an appropriate message
2. **Push** - Push to origin
3. **Update marketplace** - Run `claude plugin marketplace update dark-matter-marketplace`
4. **Reinstall plugin (primary account)** - Run `claude plugin uninstall <plugin> && claude plugin install <plugin>`
5. **Reinstall plugin (secondary account)** - If `CLAUDE_SECONDARY_CONFIG_DIR` is set, run:
   ```bash
   CLAUDE_CONFIG_DIR=$CLAUDE_SECONDARY_CONFIG_DIR claude plugin marketplace update dark-matter-marketplace
   CLAUDE_CONFIG_DIR=$CLAUDE_SECONDARY_CONFIG_DIR claude plugin uninstall <plugin> && CLAUDE_CONFIG_DIR=$CLAUDE_SECONDARY_CONFIG_DIR claude plugin install <plugin>
   ```
   Note: The secondary account may not have all plugins installed. If uninstall fails with "not found", just run the install. Skip this step entirely if no secondary account is configured.

## Notes

- Bump the plugin version in `plugin.json` before running this command if not already done
- The commit message should summarize what changed
- Steps 4 and 5 can run in parallel (independent accounts)

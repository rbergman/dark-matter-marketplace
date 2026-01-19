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
4. **Reinstall plugin** - Run `claude plugin uninstall <plugin> && claude plugin install <plugin>`

## Notes

- Bump the plugin version in `plugin.json` before running this command if not already done
- The commit message should summarize what changed

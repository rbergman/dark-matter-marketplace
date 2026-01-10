---
name: cli-tools
description: Power CLI tools (fd, rg, jq) for when built-in tools are insufficient. Use when you need complex file finding, advanced grep features, or JSON manipulation.
---

# CLI Power Tools

Use built-in tools first (Read, Grep, Glob, Write, Edit). Fall back to these when built-ins hit limits.

---

## fd (find replacement)

**When to use:** Complex exclusions, type filters, exec actions, or when Glob patterns get unwieldy.

```bash
# Find by extension with exclusions
fd -e ts -E node_modules -E dist

# Find and execute
fd -e test.ts -x npm test {}

# Find directories only
fd -t d components

# Find with size filter
fd -e log -S +10M

# Find modified in last hour
fd -e ts --changed-within 1h
```

**Glob equivalent that fd improves:**
```bash
# Instead of multiple Glob calls with exclusions
fd -e ts -E __tests__ -E __mocks__ -E node_modules
```

---

## rg (ripgrep)

**When to use:** Multiline patterns, PCRE2 regex, replace mode, or complex context needs.

```bash
# Multiline search (built-in Grep doesn't span lines well)
rg -U 'struct \{[\s\S]*?impl'

# PCRE2 lookahead/lookbehind
rg -P '(?<=fn\s)\w+(?=\()'

# Search and replace (preview)
rg 'oldName' -r 'newName'

# Search with file type
rg -t rust 'async fn'

# Inverse match (lines NOT matching)
rg -v 'TODO|FIXME'

# JSON output for parsing
rg --json 'pattern' | jq '.data.lines.text'
```

**Grep equivalent that rg improves:**
```bash
# Complex multiline with context
rg -U -A5 -B5 'impl.*for.*\{[\s\S]*?\}'
```

---

## jq (JSON processor)

**When to use:** Extracting, transforming, or filtering JSON beyond simple access.

```bash
# Extract nested field
cat data.json | jq '.config.database.host'

# Filter array
jq '.items[] | select(.status == "active")' data.json

# Transform structure
jq '{name: .title, id: .uuid}' item.json

# Merge files
jq -s '.[0] * .[1]' base.json override.json

# Pretty print with sorting
jq -S '.' messy.json

# Raw output (no quotes)
jq -r '.version' package.json

# Update in place (with sponge or temp file)
jq '.version = "2.0.0"' package.json > tmp && mv tmp package.json
```

**Common patterns:**
```bash
# Get all keys
jq 'keys' object.json

# Length of array
jq '.items | length' data.json

# Unique values
jq '[.items[].category] | unique' data.json
```

---

## Decision Guide

| Need | Tool |
|------|------|
| Find files by name/pattern | Glob first, fd if complex |
| Search file contents | Grep first, rg if multiline/pcre2 |
| Read/edit files | Read/Edit/Write always |
| Parse JSON config | jq |
| Transform JSON data | jq |
| Find + action | fd -x |
| Search + replace preview | rg -r |

---

## Installation

```bash
# macOS
brew install fd ripgrep jq

# Ubuntu/Debian
apt install fd-find ripgrep jq
# Note: fd is 'fdfind' on Debian, alias it: alias fd=fdfind

# With mise
mise use -g fd ripgrep jq
```

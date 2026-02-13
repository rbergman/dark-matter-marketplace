---
name: cli-tools
description: Power CLI tools (fd, rg, jq, yq, sd, xargs, bat, delta) for when built-in tools are insufficient. Use for complex file ops, data manipulation, or parallel execution.
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

## yq (YAML processor)

**When to use:** YAML manipulation - CI configs, k8s manifests, docker-compose, GitHub Actions.

```bash
# Extract field
yq '.services.web.image' docker-compose.yml

# Update value
yq -i '.version = "2.0.0"' config.yml

# Add to array
yq -i '.steps += [{"name": "test", "run": "npm test"}]' .github/workflows/ci.yml

# Convert YAML to JSON
yq -o json config.yml

# Convert JSON to YAML
yq -P config.json

# Merge files
yq '. * load("override.yml")' base.yml

# Query multiple docs (---)
yq 'select(.kind == "Deployment")' k8s-manifests.yml
```

**Common CI/k8s patterns:**
```bash
# Get all image references in k8s
yq '.spec.containers[].image' deployment.yml

# Update image tag
yq -i '.spec.containers[0].image = "app:v2"' deployment.yml

# Add env var to GitHub Action
yq -i '.env.NODE_ENV = "test"' .github/workflows/ci.yml
```

---

## sd (sed replacement)

**When to use:** Find/replace in files. Much simpler syntax than sed.

```bash
# Simple replace (stdout)
sd 'oldName' 'newName' file.ts

# In-place replace
sd -i 'oldName' 'newName' file.ts

# Regex with capture groups
sd 'fn (\w+)\(' 'function $1(' file.js

# Replace across multiple files
fd -e ts | xargs sd -i 'oldImport' 'newImport'

# Multiline (use -s for string mode)
sd -s 'line1\nline2' 'replacement' file.txt

# Preview changes (no -i flag)
sd 'pattern' 'replacement' file.ts
```

**vs sed:**
```bash
# sed (arcane)
sed -i 's/old/new/g' file.txt
sed -i 's/\(capture\)/\1_suffix/g' file.txt

# sd (readable)
sd -i 'old' 'new' file.txt
sd -i '(capture)' '${1}_suffix' file.txt
```

---

## xargs (parallel execution)

**When to use:** Run commands on multiple inputs, especially in parallel.

```bash
# Basic usage
fd -e ts | xargs eslint

# Parallel execution (-P = processes)
fd -e ts | xargs -P4 -I{} eslint {}

# With placeholder
fd -e test.ts | xargs -I{} npm test -- {}

# Null-delimited (handles spaces in names)
fd -0 -e ts | xargs -0 wc -l

# Limit batch size (-n)
fd -e ts | xargs -n10 eslint

# Prompt before each (interactive)
fd -e log | xargs -p rm
```

**Common patterns:**
```bash
# Parallel type check
fd -e ts | xargs -P$(nproc) -I{} tsc --noEmit {}

# Batch git add
fd -e ts --changed-within 1h | xargs git add

# Parallel image optimization
fd -e png | xargs -P4 -I{} optipng {}
```

---

## bat / delta

- `bat` — Syntax-highlighted file preview with line numbers (`bat -r 50:100 file.ts`)
- `delta` — Readable git diffs with side-by-side view (`git diff | delta -s`)

Configure delta as git pager in `~/.gitconfig`: `[core] pager = delta`

---

## Decision Guide

| Need | Tool |
|------|------|
| Find files by name/pattern | Glob first, fd if complex |
| Search file contents | Grep first, rg if multiline/pcre2 |
| Read/edit files | Read/Edit/Write always |
| JSON manipulation | jq |
| YAML manipulation | yq |
| Find/replace in files | Edit first, sd for bulk/regex |
| Find + action | fd -x |
| Parallel execution | xargs -P |
| Search + replace preview | rg -r or sd (no -i) |
| File preview with highlighting | bat |
| Readable git diffs | delta |

---

## Installation

```bash
# macOS
brew install fd ripgrep jq yq sd bat git-delta

# Ubuntu/Debian
apt install fd-find ripgrep jq bat
# yq, sd, delta: install via cargo, npm, or download binaries
# Note: fd is 'fdfind' on Debian, alias it: alias fd=fdfind

# With mise/cargo
mise use -g fd ripgrep jq yq
cargo install sd
```

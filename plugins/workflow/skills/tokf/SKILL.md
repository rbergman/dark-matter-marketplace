---
name: tokf
description: CLI output compression for LLM context efficiency. Use when setting up repos, optimizing token usage, or when users ask about reducing noise from build/test/git output in Claude Code sessions.
---

# tokf: CLI Output Compression for LLMs

[tokf](https://tokf.net) is a config-driven CLI that compresses command output before it reaches your LLM context. It intercepts commands like `cargo test`, `git push`, and `docker build`, applies TOML-based filters, and emits only the signal — reducing noise by 60-99%.

**Related skills:**
- **mise** - Install tokf via mise (`mise use tokf`)
- **repo-init** - New repo scaffolding includes optional tokf setup
- **cli-tools** - Power CLI tools that complement tokf
- **just-pro** - Build system integration with tokf

## Why tokf?

| Command | Before | After | Reduction |
|---------|--------|-------|-----------|
| `cargo test` (61 lines) | 1.7 KB | 35 B | 98% |
| `git push` (8 lines) | 389 B | 8 B | 98% |
| `docker build` | 1.8 KB | ~320 B | 82% |
| `gradle test` | ~47 KB | 35 B | 99.9% |

Every token saved on command output is a token available for reasoning. In a typical session, build/test/git output can consume 20-40% of context — tokf reclaims most of it.

---

## Quick Start

### 1. Install

```bash
# Homebrew (macOS/Linux)
brew install mpecan/tokf/tokf

# Cargo (from source)
cargo install tokf

# Mise (if already using mise)
mise use -g tokf
```

### 2. Claude Code Hook Setup

Install the PreToolUse hook so tokf automatically filters Bash command output:

```bash
tokf hook install
```

This adds a hook to your Claude Code settings that rewrites commands through tokf transparently — zero friction, no manual `tokf run` prefixing needed.

### 3. Filter Authoring Skill (Optional)

Enable Claude Code to author and manage custom filters:

```bash
tokf skill install
```

This gives the agent knowledge of filter TOML syntax and the ability to create project-specific filters on the fly.

### 4. Verify

```bash
tokf run git status       # Should produce compressed output
tokf which "cargo test"   # Show which filter matches
tokf ls                   # List all available filters
```

---

## Configuration

### Filter Resolution Hierarchy

Filters resolve in priority order (first match wins):

```
.tokf/filters/              # Project-local (committed with repo)
  └── ~/.config/tokf/filters/   # User-level (personal overrides)
        └── <built-in stdlib>        # 47 filters embedded in binary
```

### Filter TOML Structure

```toml
command = "cargo test"           # Pattern to match (supports arrays)
strip_ansi = true                # Remove ANSI escape codes
trim_lines = true                # Trim whitespace per line
strip_empty_lines = true
dedup = true                     # Collapse consecutive identical lines

skip = ["^Compiling", "^Downloading", "^Fresh"]   # Drop matching lines
keep = ["^error", "^test result"]                  # Keep only matching

[[replace]]
pattern = '^(\S+)\s+\S+\s+(\S+)\s+(\S+)'
output = "{1}: {2} -> {3}"

[on_success]
output = "ok"

[on_failure]
tail = 10                        # Keep last N lines on failure
```

**Key fields:**

| Field | Purpose |
|-------|---------|
| `command` | Match pattern — string or array, supports wildcards and basename matching |
| `skip` / `keep` | Regex-powered line filtering (mutually exclusive) |
| `replace` | Pattern-based line transformations with capture groups |
| `dedup` | Collapse consecutive identical lines |
| `on_success` / `on_failure` | Conditional output based on exit code |
| `strip_ansi` | Remove color/formatting escape codes |

### Customization via Eject

Override any built-in filter without recompilation:

```bash
# Project-local override (committed to repo)
tokf eject cargo/build

# User-level override (personal preference)
tokf eject cargo/build --global
```

Ejected filters land in `.tokf/filters/` or `~/.config/tokf/filters/` for editing.

### Variants

Commands that invoke different underlying tools use variants for context-aware filtering:

```toml
command = ["npm test", "pnpm test", "yarn test"]
strip_ansi = true

[[variant]]
name = "vitest"
detect.files = ["vitest.config.ts", "vitest.config.js"]
filter = "npm/test-vitest"

[[variant]]
name = "jest"
detect.files = ["jest.config.js", "jest.config.ts"]
filter = "npm/test-jest"
```

Detection is two-phase: file-based (before execution) wins first; output pattern matching is fallback.

### Lua Scripting

For logic beyond TOML capabilities, embed Luau scripts:

```toml
[lua_script]
lang = "luau"
source = '''
if exit_code == 0 then
  return "passed"
else
  return "FAILED: " .. output
end
'''
```

Template pipes also support filter chains:
```
{output | lines | keep: "^error" | join: "\n"}
{output | truncate: 50}
```

---

## Integration

### Just Recipes

Add tokf-aware recipes to your justfile:

```just
# Run tests with compressed output (for CI/agent use)
test-quiet:
    tokf run just test

# Show token savings
tokf-stats:
    tokf gain

# Verify all project filters pass their test suites
tokf-verify:
    tokf verify
```

### Stats Tracking

tokf records byte counts per run in a local SQLite database:

```bash
tokf gain              # Total savings summary
tokf gain --daily      # Day-by-day breakdown
tokf gain --by-filter  # Per-filter breakdown
```

### Testing Filters

Test suites live in `<filter>_test/` directories adjacent to filter TOML files:

```toml
# .tokf/filters/cargo/test_test/success.toml
name = "passing tests show ok"
fixture = "tests/fixtures/cargo_test_pass.txt"
exit_code = 0

[[expect]]
equals = "ok"
```

```bash
tokf verify                # Run all test suites
tokf verify cargo/test     # Run specific suite
tokf verify --require-all  # Fail if any filter lacks tests
```

---

## Existing Project Prompt

Copy and paste this prompt to have an agent integrate tokf into an already-running project:

> **Install and configure tokf for this project.**
>
> 1. Install tokf: `brew install mpecan/tokf/tokf` (or `cargo install tokf`)
> 2. Set up the Claude Code hook: `tokf hook install`
> 3. Install the filter authoring skill: `tokf skill install`
> 4. Check which built-in filters already cover our toolchain: `tokf ls`
> 5. For any commands we run frequently that lack filters (check `just --list` for candidates), eject and customize the closest built-in: `tokf eject <filter> && $EDITOR .tokf/filters/<filter>.toml`
> 6. If no close match exists, create a new filter in `.tokf/filters/` following the TOML format above
> 7. Test filters: `tokf verify`
> 8. Add `.tokf/` to the repo so the team shares filters: `git add .tokf/`
> 9. Verify savings: `tokf gain`

---

## Troubleshooting

### Filter not matching

```bash
tokf which "your command here"  # See which filter would match
tokf run --verbose your command # Show matched filter name
tokf run --no-filter command    # Bypass filtering entirely
```

### Exit codes masked

By default tokf masks exit codes to 0. To preserve original exit codes:

```bash
tokf run --no-mask-exit-code cargo test
```

Or set in the filter TOML:
```toml
no_mask_exit_code = true
```

### ANSI colors stripped

If you need colors preserved (e.g., for human-readable output):

```bash
tokf run --preserve-color cargo test
# or
TOKF_PRESERVE_COLOR=1 tokf run cargo test
```

### Checking timing

```bash
tokf run --timing cargo test  # Shows filtering duration
```

---

## Quick Reference

```bash
# Run commands through filters
tokf run cargo test            # Filtered execution
tokf run git push origin main  # Works with any command

# Discover and manage filters
tokf ls                        # List all available filters
tokf which "npm test"          # Show matching filter
tokf show git/push             # Display filter TOML source
tokf eject cargo/build         # Override locally
tokf eject cargo/build --global  # Override at user level

# Test and verify
tokf verify                    # Run all filter test suites
tokf verify --require-all      # Strict mode
tokf test filter.toml fixture.txt --exit-code 0  # Test single filter

# Stats
tokf gain                      # Total token savings
tokf gain --daily              # Daily breakdown
tokf gain --by-filter          # Per-filter breakdown

# Claude Code integration
tokf hook install              # Install PreToolUse hook
tokf skill install             # Enable agent filter authoring
```

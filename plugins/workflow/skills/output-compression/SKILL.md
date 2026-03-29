---
name: output-compression
description: Reduce CLI output noise before it reaches LLM context. Use when setting up repos, troubleshooting context overflow from build/test/git output, or when Bash tool output exceeds limits. Covers RTK (zero-config baseline) and tokf (per-project customization). Either or both may be installed — the skill adapts gracefully when one is absent.
---

# CLI Output Compression for LLMs

Build, test, and git output can consume 20-40% of context in a typical session. Output compression tools intercept CLI commands and emit only the signal, reducing noise by 60-99%.

Two tools serve this purpose with different trade-offs:

| | RTK | tokf |
|--|-----|------|
| **Philosophy** | Zero-config, batteries-included | Config-driven, per-project customization |
| **Install** | `brew install rtk` | `brew install mpecan/tokf/tokf` |
| **Setup** | `rtk init --global` | `tokf hook install` |
| **Custom filters** | Built-in only (30+ commands) | TOML per-project + Lua scripting (61+ built-in) |
| **Per-repo config** | No | `.tokf/filters/` committed with repo |
| **Multi-tool support** | Claude Code, Cursor, Gemini, Codex, Copilot, etc. | Claude Code focused |
| **Best for** | Global baseline across all repos | Surgical filtering when defaults aren't enough |

**Use RTK as the global baseline.** Add tokf when RTK's defaults don't handle a specific output pattern (e.g., test coverage tables overflowing Bash limits).

**Related skills:**
- **repo-init** — scaffolding includes output compression setup
- **cli-tools** — power CLI tools that complement compression
- **just-pro** — build system integration

---

## Detection and Graceful Fallback

Before recommending or using either tool, check what's available:

```bash
command -v rtk &>/dev/null && echo "rtk: installed" || echo "rtk: not installed"
command -v tokf &>/dev/null && echo "tokf: installed" || echo "tokf: not installed"
```

| RTK | tokf | Recommendation |
|-----|------|----------------|
| Installed | Installed | Both active. RTK handles baseline, tokf handles project-specific overrides. No conflict. |
| Installed | Not installed | RTK handles everything. Suggest tokf only if a specific output isn't handled. |
| Not installed | Installed | tokf handles everything. |
| Neither | Neither | Suggest `brew install rtk` as the quick win. |

**Never fail or error if a tool is missing.** Suggest installation, don't require it.

---

## RTK (Global Baseline)

### Setup

```bash
brew install rtk
rtk init --global      # installs PreToolUse hook, restart CC
```

That's it. RTK silently compresses output for git, test runners, linters, package managers, docker, kubectl, and more. No per-project config needed.

### How it works

RTK installs a PreToolUse hook that rewrites Bash commands transparently. Four compression strategies: smart filtering, grouping, truncation, deduplication.

### Typical savings

| Command | Reduction |
|---------|-----------|
| `git status` (large repo) | ~90% |
| `npm test` (100 tests) | ~94% |
| `cargo test` | ~98% |

### Limitations

- No custom filters — built-in only
- Built-in CC tools (Read, Grep, Glob) bypass the hook
- If a specific output pattern isn't handled well, no per-project override — use tokf

---

## tokf (Per-Project Customization)

Use when RTK's built-in filters don't handle a specific output, or when you need per-project filters shared across the team.

### Setup

```bash
brew install mpecan/tokf/tokf    # or: cargo install tokf, mise use -g tokf
tokf hook install                 # PreToolUse hook
tokf skill install                # optional: agent filter authoring
```

### Custom filter example

For the specific problem of test coverage output exceeding Bash limits:

```toml
# .tokf/filters/npm/coverage.toml
command = ["npm run test:coverage", "npx vitest --coverage"]
strip_ansi = true
strip_empty_lines = true

# Drop the per-file coverage table, keep only the summary
skip = ["^\\s*[│|]", "^-{3,}", "^={3,}", "^File\\s"]
keep = ["^(All files|Statements|Branches|Functions|Lines)", "^(PASS|FAIL|Tests:)", "^Test Suites:"]

[on_success]
output = "Coverage: PASS (see full report in coverage/)"

[on_failure]
tail = 20
```

### Filter resolution

```
.tokf/filters/              # Project-local (committed)
  └── ~/.config/tokf/filters/   # User-level (personal)
        └── <built-in stdlib>        # 61+ embedded filters
```

### TOML filter reference

| Field | Purpose |
|-------|---------|
| `command` | Match pattern — string or array, supports wildcards |
| `skip` / `keep` | Regex line filtering (mutually exclusive) |
| `replace` | Pattern transformations with capture groups |
| `dedup` | Collapse consecutive identical lines |
| `on_success` / `on_failure` | Conditional output based on exit code |
| `strip_ansi` | Remove color escape codes |
| `[lua_script]` | Luau scripting for complex logic |

### Key commands

```bash
tokf ls                        # List available filters
tokf which "npm test"          # Show matching filter
tokf eject cargo/build         # Override a built-in locally
tokf verify                    # Test all project filters
tokf gain                      # Token savings stats
```

---

## Solving Common Problems

### Test coverage exceeds Bash output limit

**Symptoms:** Commit fails because `test:coverage` output exceeds the Bash tool's output limit. Gates pass when run separately.

**RTK:** May handle automatically. Check: `rtk --list | grep test`

**tokf:** Create a project-local filter (see coverage example above) that keeps only the summary.

**Quick workaround (no tools):** `npm run test:coverage > /tmp/coverage.txt 2>&1 && tail -5 /tmp/coverage.txt`

### Build output floods context

**RTK:** Handles by default for most build tools.

**tokf:** `tokf eject <build-tool>` and customize the `skip` patterns.

### Git push/pull noise

Both tools handle this out of the box.

---

## Existing Project Setup Prompt

> **Set up CLI output compression for this project.**
>
> 1. Check what's installed: `command -v rtk` and `command -v tokf`
> 2. If RTK installed: verify it's working (`rtk init --global` if not yet initialized)
> 3. If specific commands still produce excessive output, install tokf and create a filter in `.tokf/filters/`
> 4. Commit `.tokf/` so the team shares custom filters

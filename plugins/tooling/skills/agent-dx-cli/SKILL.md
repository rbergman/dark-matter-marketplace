---
name: agent-dx-cli
description: "This skill provides patterns for designing command-line tools that agents can use effectively. Use when designing new CLIs, reviewing existing CLIs for agent compatibility, or adding agent-friendly features. Covers minimal ceremony, JSON output, context injection, batch operations, and error handling."
---

# Agent DX Guide for CLI Projects

A pattern language for designing command-line tools that agents can use effectively.

## Core Principles

### Minimal Ceremony

**One command for the common case.**

Bad:
```bash
mytool init --config ./config.yaml
mytool create entry --type log
mytool entry set-field --field title --value "Fixed bug"
mytool entry commit
```

Good:
```bash
mytool log "Fixed bug" --body "Details..."
```

Guidelines:
- Collapse multi-step workflows into single commands
- Use positional arguments for the most common parameter
- Provide sensible defaults for everything else
- Reserve subcommand trees for genuinely distinct operations

### Clear Next Action

**Tell agents what to do next.**

Bad:
```bash
$ mytool status
Repository initialized.
3 items tracked.
```

Good:
```bash
$ mytool status
Repository initialized.
3 items tracked.

Run: mytool pending    # See what needs attention
Run: mytool process    # Handle pending items
```

Patterns:
- `pending` / `ready` commands that surface work
- Include suggested next commands in output
- JSON output includes `next_action` or `suggested_commands` fields

### Context Injection

**Provide a `prime` command that outputs workflow state AND guidance for session bootstrapping.**

Prime = State + Workflow Guidance, not just State.

```bash
$ mytool prime
MyTool workflow context
=======================
Repo: my-project
Branch: main

Pending: 5 items need attention

## Session Protocol
- At session end: run `mytool pending` to check for undocumented work
- Never skip: always log completed work before ending

## Core Rules
- Use CLI commands, not internal files
- Trust --json output over manual parsing

## Quick Commands
  mytool pending     # See pending items
  mytool show --last # View last action
```

Patterns:
- `--export` flag to dump default prime content for customization
- Override file support (e.g., `.mytool/PRIME.md` replaces default)
- Include session close protocol, not just current state
- Essential rules and quick reference for agent context

Why this matters:
- Agents lose context on session boundaries
- `/clear` and compaction wipe working memory
- `prime` restores workflow state AND behavioral guidance in one call

### JSON Everywhere

**Every command supports `--json` for structured output.**

```json
{
  "status": "created",
  "id": "tb_2026-01-15_abc123",
  "anchor": "abc1234def5678...",
  "commits": 3
}
```

Guidelines:
- `--json` flag on every command, no exceptions
- Errors also return JSON: `{"error": "message", "code": 1}`
- Include machine-readable fields (full SHAs, IDs, counts)

### Sensible Defaults

**Commands work without flags for the common case.**

```bash
mytool log "Message"
# Anchor defaults to HEAD
# Range defaults to since-last-entry
# Format defaults to human-readable
```

- Defaults should match 80% of use cases
- Never require configuration before first use

## Token Efficiency

### Batch Operations

Instead of:
```bash
mytool process item1
mytool process item2
mytool process item3
# 3 tool calls, 3 permission prompts
```

Provide:
```bash
mytool process --batch
# 1 tool call, processes all pending
```

Patterns:
- `--batch` flag for processing multiple items
- Accept multiple positional arguments
- Batch JSON input via stdin

### Compact Output Modes

```bash
mytool query --last 5 --oneline   # Compact for scanning
mytool query --last 5 --ids-only  # IDs only for scripting
```

### Allowlist-Friendly Commands

Design commands that can be pre-approved:
- Prefer declarative over imperative commands
- Avoid eval/exec patterns
- Make destructive operations explicit: `mytool delete --confirm`
- Support `--dry-run` for write operations

### Time-based Filtering

**Consistent temporal queries across commands.**

```bash
mytool query --since 7d        # Human-readable duration
mytool export --since 24h      # Hours
mytool query --since 2w        # Weeks
mytool export --since 2026-01-15  # Date string
mytool query --range main..HEAD   # Commit range
```

Patterns:
- `--since` for duration-based filtering (24h, 7d, 2w)
- `--range` for commit ranges
- Accept ISO dates as well as relative durations
- Consistent across query/export/prompt commands

## LLM Piping

**Provide a `prompt` command for rendering templates to pipe to LLMs.**

Enable `mytool <data> | llm "<task>"` workflows:

```bash
mytool prompt changelog --since 7d | claude
mytool prompt pr-description --range main..HEAD | llm
mytool prompt devblog --last 10 --append "Focus on physics" | claude
```

Discovery and customization:
```bash
mytool prompt --list              # Discover available templates
mytool prompt changelog --show    # Preview template without rendering
```

Patterns:
- `--list` to discover available templates
- `--show` to preview template content without rendering
- `--append` to add extra instructions dynamically
- Template resolution order: project-local → user global → built-in
- Built-in templates for common use cases (changelog, pr-description, exec-summary)

This complements `prime` (session state) with reusable prompts for common agent tasks.

## Error Handling

### Structured Errors

```json
{
  "error": "Missing required flag: --why",
  "code": 1,
  "hint": "Use --minor for trivial changes"
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | User error (bad args, not found) |
| 2 | System error (git failed, network) |
| 3 | Conflict (already exists) |

### Recoverable Failures

Bad:
```
Error: Entry already exists.
```

Good:
```
Error: Entry already exists for anchor abc1234.
Use --replace to overwrite, or --anchor <sha> to target another commit.
```

## Self-Documentation

### Help Text with Command Grouping

**Group commands by purpose in help output.**

```bash
$ mytool --help
A development ledger for capturing what/why/how.

Core Commands:
  log       Record work with what/why/how
  pending   Show items needing attention
  status    Show repository state

Query Commands:
  export    Export entries in various formats
  query     Search and filter entries
  show      Display entry details

Agent Commands:
  prime     Output workflow context for agents
  prompt    Render templates for LLM piping
  skill     Output skill documentation

Admin Commands:
  clean     Remove artifacts from scope
  init      Initialize repository

All commands support --json for structured output.
```

Patterns:
- Group by purpose: Core, Query, Agent, Admin
- Helps agents understand command purposes at a glance
- Consistent ordering across related CLIs

### Skill Generation

Provide a command that outputs content for agent skills:

```bash
mytool skill
mytool skill --format json
```

## Agent Execution Contract

Include in CLI documentation:

1. **Use CLI, not internals** - Call commands, consume JSON output
2. **Trust the tool** - Don't parse config files directly
3. **Use --dry-run** - Validate before writing
4. **Check pending** - Know what needs attention before starting
5. **Prime on session start** - Restore context after /clear

## Integration Patterns

Provide workflow snippets for CLAUDE.md:

```markdown
## Workflow

At session start:
  mytool prime

After completing work:
  mytool log "what" --why "why" --how "how"

At session end:
  mytool pending    # Check for undocumented work
```

## Artifact Cleanup

**Provide a `clean` command to remove tool artifacts from a given scope.**

```bash
mytool clean                  # Remove artifacts from current project
mytool clean --global         # Remove user-level artifacts
mytool clean --dry-run        # Preview what would be removed
mytool clean --force          # Skip confirmation
```

Patterns:
- Scope-based cleanup: project, user global, or both
- `--dry-run` to preview what would be removed
- `--force` to skip confirmation prompts
- List exactly what will be deleted before proceeding
- Focus on tool-generated artifacts (caches, state files), not user data

This helps agents understand cleanup options and manage tool state across projects.

## Anti-Patterns to Avoid

| Anti-Pattern | Problem |
|--------------|---------|
| Configuration-First | Agents struggle with multi-step setup |
| Interactive-Only | Agents can't use TUI/curses interfaces |
| Implicit State | Agents need to query state |
| Verbose-Only Output | Token budgets matter |
| Undocumented Errors | Agents need structured feedback |
| Broad Permissions | Allowlist-friendly commands can be pre-approved |

## Checklist

See `references/checklist.md` for the full design checklist.

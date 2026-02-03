# Agent DX CLI Design Checklist

Use this checklist when designing or reviewing agent-oriented CLIs.

## Essential

- [ ] `--json` flag on every command
- [ ] Structured error output with codes
- [ ] `prime` or equivalent context injection command
- [ ] `pending` or equivalent "what needs attention" command
- [ ] Sensible defaults—works without config
- [ ] `--dry-run` on write operations

## Recommended

- [ ] `--batch` mode for multi-item operations
- [ ] `--oneline` / `--ids-only` for compact output
- [ ] `skill` command for self-documentation
- [ ] Suggested next commands in output
- [ ] Recoverable error messages with hints
- [ ] Command grouping in `--help` (Core, Query, Agent, Admin)
- [ ] Consistent `--since` / `--range` for temporal filtering

## Bonus

- [ ] Stdin support for batch input
- [ ] Exit code conventions documented
- [ ] Integration hooks documented
- [ ] CLAUDE.md workflow snippet provided
- [ ] `prime --export` for customization
- [ ] Override file support (e.g., `.mytool/PRIME.md`)
- [ ] `clean` command for artifact removal
- [ ] `--out` flag for file output (separate from stdout)

## Examples in the Wild

### Beads (Issue Tracking)

- `bd prime` — Context injection
- `bd ready` — Clear next action
- `bd close <id>` — Minimal ceremony
- `--json` on all commands

### Timbers (Development Ledger)

- `timbers prime` — Context injection with workflow guidance
- `timbers prime --export` — Dump default for customization
- `timbers pending` — Clear next action
- `timbers log "what" --why "why" --how "how"` — Single command capture
- `timbers export --json | claude "..."` — Unix composability
- `timbers export --since 7d` — Time-based filtering
- `timbers skill` — Self-documentation
- `--batch` mode for efficiency
- Command grouping in help (Core, Query, Agent, Admin)

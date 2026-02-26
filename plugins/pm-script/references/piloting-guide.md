# PM Script — Piloting Guide

> How to start using the PM Script architecture, phase by phase.

---

## Prerequisites

- Python 3.11+
- [Claude Agent SDK](https://github.com/anthropics/agent-sdk) (`pip install claude-agent-sdk`)
- Git (for worktree management)
- A project with a `just check` gate (or configure a custom gate command)
- Beads CLI (`bd`) for issue tracking

## Phase 1: Single Worker MVP

Start here. One worker, one bead, CLI frontend. The goal is to replace "human manually directs a CC session" with "script directs a CC session while human reviews escalations."

### 1. Initialize PM state

```bash
mkdir -p .pm/workers
```

Create `.pm/config.toml`:

```toml
[project]
name = "my-project"
archetype = "greenfield"    # or "mature" / "maintenance"
phase = "feature"

[workers]
max_concurrent = 1
session_token_limit = 150000
bead_token_limit = 500000

[gates]
check_command = "just check"
timeout_seconds = 300
```

### 2. Create your first escalation profile

Copy the defaults — don't customize yet. The whole point of Phase 1 is to let the archetype defaults work and learn from your responses.

```bash
cp escalation-profile-template.toml .pm/escalation-profile.toml
```

### 3. Pick a bead and run

```bash
bd ready                          # Find a bead to work on
python pm.py run <bead-id>        # PM spawns worker, you review escalations
```

### 4. What to watch for

- **Escalation accuracy**: Is the PM blocking on the right things? Use `approve+relax` and `approve+tighten` to calibrate
- **Worker autonomy**: Is the worker staying within file boundaries? Committing at checkpoints?
- **Rotation**: Does the PM rotate smoothly when context gets large?
- **Gate reliability**: Does `just check` catch real problems?

### 5. When to move to Phase 2

You're ready when:
- You've completed 3+ beads through the PM without manual intervention
- Escalation tiers feel calibrated (not too many blocks, not missing important decisions)
- Worker rotation works without losing state

## Phase 2: Parallel Workers

Add a second worker. The main new challenge is merge coordination.

### Changes to config

```toml
[workers]
max_concurrent = 2     # Start with 2, not 5

[coherence]
shared_types = [
    # Add your shared type files here
]
```

### What to watch for

- **Merge conflicts**: How often do workers conflict? Are the file ownership boundaries right?
- **Integration gates**: Do gates catch cross-worker breakage?
- **Escalation volume**: With 2 workers, does the block rate stay manageable?

## Quick Reference

| I want to... | Command |
|--------------|---------|
| Start the PM | `python pm.py run <bead-id>` |
| See pending escalations | `python pm.py escalations` |
| Respond to an escalation | `python pm.py respond <id> approve-only` |
| Check worker status | `python pm.py workers` |
| View decision ledger | `python pm.py ledger` |
| Shut down gracefully | `python pm.py shutdown` |
| View PM config | `cat .pm/config.toml` |

## Troubleshooting

**Worker stuck / spinning**: PM should detect this automatically (3+ identical gate failures). If not, `python pm.py interrupt <worker-id>` to pause and review.

**Escalation fatigue**: If you're getting >3 blocks/hour consistently, either relax specific domains with `approve+relax` or adjust the archetype (switch from `maintenance` to `mature`).

**Context explosion**: Check `python pm.py workers` for token counts. If a bead is burning through its budget, the work item may need decomposition.

**Integration gate failures after merge**: The PM identifies which worker's changes caused the failure. Fix in that worker's worktree, then re-merge.

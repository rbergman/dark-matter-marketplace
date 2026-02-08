---
description: Rotate the session — generate snapshot, save for auto-recovery, and prepare for /clear
argument-hint: "[special instructions for next session]"
---

Session rotation in one step. Generates a snapshot, saves it for automatic recovery after `/clear`, and outputs it to terminal for `/copy` as backup.

Arguments: $ARGUMENTS

## Steps

### 1. Generate the snapshot

Run the full `/dm-work:snapshot` logic with $ARGUMENTS. Capture the complete snapshot output.

### 2. Save for auto-recovery

Write the snapshot to `.claude/snapshot.md` in the project root:

```bash
mkdir -p .claude
```

Then use the Write tool to save the snapshot content to `.claude/snapshot.md`.

**Important:** Write the raw snapshot markdown, not wrapped in code fences. The next session will read this file directly.

### 3. Sync beads

```bash
bd sync 2>/dev/null
```

### 4. Output to terminal

Output the full snapshot to the terminal (so the user can `/copy` it as a backup).

Then append this footer:

```
---

**Session rotation ready.**

Snapshot saved to `.claude/snapshot.md` for auto-recovery.

**Next:** Run `/copy` (backup to clipboard), then `/clear`.

The new session will detect the snapshot file and recover automatically.
If auto-recovery doesn't trigger, paste from clipboard.
```

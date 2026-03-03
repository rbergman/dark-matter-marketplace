#!/usr/bin/env bash
# PostToolUse hook (Bash): After any command, check for pending PM escalations.
# Injects a systemMessage nudge if Block escalations are waiting for response.
# Non-blocking — purely informational.

set -euo pipefail

# Only activate in PM control plane (has config.toml), not in worker worktrees
if [ ! -f .pm/config.toml ]; then
  exit 0
fi

# Only nudge if the decision ledger has pending Block escalations
LEDGER=".pm/decision-ledger.jsonl"
if [ ! -f "$LEDGER" ]; then
  exit 0
fi

# Count pending Blocks (tier=Block, human_response=null)
# Use jq for reliable JSON matching regardless of whitespace
PENDING=$(jq -c 'select(.tier == "Block" and .human_response == null)' "$LEDGER" 2>/dev/null | wc -l | tr -d ' ')

if [ "$PENDING" -gt 0 ]; then
  # Dedup: don't nudge if we already nudged on this same count.
  # Store last-nudge count in a temp file to avoid spamming every turn.
  NUDGE_FILE=".pm/.last-nudge-count"
  LAST_NUDGE=$(cat "$NUDGE_FILE" 2>/dev/null || echo "0")

  if [ "$PENDING" != "$LAST_NUDGE" ]; then
    echo "$PENDING" > "$NUDGE_FILE"
    if [ "$PENDING" -eq 1 ]; then
      echo "{\"systemMessage\":\"PM: 1 pending Block escalation. Run 'python pm.py escalations' to review and 'python pm.py respond <id> <action>' to unblock the worker.\"}"
    else
      echo "{\"systemMessage\":\"PM: ${PENDING} pending Block escalations. Run 'python pm.py escalations' to review.\"}"
    fi
  fi
fi

exit 0

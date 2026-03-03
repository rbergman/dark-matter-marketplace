#!/usr/bin/env bash
# PreCompact hook: Inject PM state summary before context compaction.
# When .pm/ exists, outputs a systemMessage with worker status so the
# post-compaction context knows to resume PM operations.
# Exit 0 always — never block compaction.

set -euo pipefail

if [ ! -d .pm ]; then
  exit 0
fi

# Build a brief status summary for context recovery
STATUS=""

# Check for active/blocked workers
for STATE_FILE in .pm/workers/*/state.json; do
  [ -f "$STATE_FILE" ] || continue
  WORKER_ID=$(jq -r '.id // "?"' "$STATE_FILE" 2>/dev/null)
  WORKER_STATUS=$(jq -r '.status // "?"' "$STATE_FILE" 2>/dev/null)
  BEAD_ID=$(jq -r '.bead_id // "?"' "$STATE_FILE" 2>/dev/null)

  case "$WORKER_STATUS" in
    active|blocked|spawning|rotating)
      STATUS="${STATUS}Worker ${WORKER_ID}: ${WORKER_STATUS} (bead: ${BEAD_ID}). "
      ;;
  esac
done

# Check for pending escalations
PENDING=0
if [ -f .pm/decision-ledger.jsonl ]; then
  PENDING=$(jq -c 'select(.tier == "Block" and .human_response == null)' .pm/decision-ledger.jsonl 2>/dev/null | wc -l | tr -d ' ')
fi

if [ -n "$STATUS" ] || [ "$PENDING" -gt 0 ]; then
  MSG="PM session active. ${STATUS}"
  if [ "$PENDING" -gt 0 ]; then
    MSG="${MSG}${PENDING} pending escalation(s). "
  fi
  MSG="${MSG}Run 'python pm.py status' and 'python pm.py escalations' to resume."
  echo "{\"systemMessage\":\"${MSG}\"}"
fi

exit 0

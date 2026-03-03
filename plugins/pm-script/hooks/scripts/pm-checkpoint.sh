#!/usr/bin/env bash
# Stop hook: Warn if there are active/blocked PM workers before session ends.
# Does NOT block the stop — the PM script manages worker lifecycle, not the hook.
# Outputs a warning so the human knows to check on workers.

set -euo pipefail

if [ ! -d .pm ]; then
  exit 0
fi

WARNINGS=""

# Check for active or blocked workers
for STATE_FILE in .pm/workers/*/state.json; do
  [ -f "$STATE_FILE" ] || continue
  WORKER_STATUS=$(jq -r '.status // "?"' "$STATE_FILE" 2>/dev/null)
  WORKER_ID=$(jq -r '.id // "?"' "$STATE_FILE" 2>/dev/null)
  BEAD_ID=$(jq -r '.bead_id // "?"' "$STATE_FILE" 2>/dev/null)

  case "$WORKER_STATUS" in
    active)
      WARNINGS="${WARNINGS}Worker ${WORKER_ID} is still active on bead ${BEAD_ID}. Run 'python pm.py shutdown' to checkpoint. "
      ;;
    blocked)
      WARNINGS="${WARNINGS}Worker ${WORKER_ID} is blocked on an escalation (bead ${BEAD_ID}). Run 'python pm.py escalations' to review. "
      ;;
    spawning|rotating)
      WARNINGS="${WARNINGS}Worker ${WORKER_ID} is ${WORKER_STATUS} (bead ${BEAD_ID}). "
      ;;
  esac
done

# Check for pending escalations
if [ -f .pm/decision-ledger.jsonl ]; then
  PENDING=$(jq -c 'select(.tier == "Block" and .human_response == null)' .pm/decision-ledger.jsonl 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PENDING" -gt 0 ]; then
    WARNINGS="${WARNINGS}${PENDING} unresolved Block escalation(s) in the decision ledger. "
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo "PM warning: ${WARNINGS}" >&2
fi

# Always allow stop — PM state is persisted in .pm/ and survives session boundaries
exit 0

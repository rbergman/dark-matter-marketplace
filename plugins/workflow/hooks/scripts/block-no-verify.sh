#!/usr/bin/env bash
# PreToolUse hook: block git commit/push/merge with --no-verify (or commit -n).
# This is a never-do tier guardrail — hooks bypass quality gates, and bypassing
# gates is never the agent's call. The operator can run it themselves if they mean it.
# Block channel: exit 2 with reason on stderr (documented, reaches the model).
# Exit 0 = allow.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match within one pipeline segment: git ... (commit|push|merge) ... --no-verify.
# Tolerates global flags between git and the subcommand (git -C /path commit ...).
# ponytail: quoted "-n"/"--no-verify" inside a -m message string also blocks —
# conservative by design; reword the message to proceed.
if echo "$COMMAND" | grep -qE 'git\b[^|;&]*\b(commit|push|merge)\b[^|;&]*--no-verify' \
   || echo "$COMMAND" | grep -qE 'git\b[^|;&]*\bcommit\b[^|;&]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)'; then
  echo "⛔ --no-verify (or commit -n) bypasses quality gates and is never-do for agents. Fix the failing gate instead. If the gate itself is broken, say so and let the operator decide." >&2
  exit 2
fi

exit 0

#!/usr/bin/env bash
# PreToolUse hook: Block --no-verify and --no-gpg-sign in Bash commands.
# Reads tool input JSON from stdin, checks command field.
# Exit 2 = block the action.

set -euo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qE -- '--no-verify|--no-gpg-sign'; then
  echo '{"decision":"block","reason":"🚫 Blocked: --no-verify and --no-gpg-sign bypass quality gates. Remove the flag and let hooks run."}'
  exit 2
fi

exit 0

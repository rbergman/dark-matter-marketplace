#!/usr/bin/env bash
# PreToolUse hook: warn (never block) when a Bash command looks like
# git commit/push/merge with --no-verify (or commit -n).
# It used to block. Agents mostly use the flag with judgment now (message-only
# amends, WIP commits, bookkeeping), and the text match also fires on commands
# that merely mention the flag, so a block cost more than it caught.
# The note reaches the model through additionalContext; systemMessage shows it
# to the user. Always exit 0.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match within one pipeline segment: git ... (commit|push|merge) ... --no-verify.
# Tolerates global flags between git and the subcommand (git -C /path commit ...).
# shortcut: text match, so a heredoc or message that mentions the flag also warns;
# harmless for a warning, parse the command properly if this ever blocks again.
if echo "$COMMAND" | grep -qE 'git\b[^|;&]*\b(commit|push|merge)\b[^|;&]*--no-verify' \
   || echo "$COMMAND" | grep -qE 'git\b[^|;&]*\bcommit\b[^|;&]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)'; then
  NOTE="This command appears to skip git hooks (--no-verify or commit -n). If it does, say why in your reply. Never use it to get past a failing gate: fix the gate, or tell the operator it is broken."
  jq -n --arg m "$NOTE" '{systemMessage: $m, hookSpecificOutput: {hookEventName: "PreToolUse", additionalContext: $m}}'
fi

exit 0

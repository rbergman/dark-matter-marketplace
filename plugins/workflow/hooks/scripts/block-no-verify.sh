#!/usr/bin/env bash
# PreToolUse hook: Block --no-verify and --no-gpg-sign in Bash commands.
# Context-aware: allows bypass during merges, docs-only commits, or explicit opt-out.
# Reads tool input JSON from stdin, checks command field.
# Exit 2 = block the action.

set -euo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Only check commands that actually contain the flags
if ! echo "$COMMAND" | grep -qE -- '--no-verify|--no-gpg-sign'; then
  exit 0
fi

# Allow: explicit opt-out via environment variable
if [ "${DM_SKIP_VERIFY:-}" = "1" ]; then
  exit 0
fi

# Allow: active merge in progress (conflict resolution needs flexibility)
# Use git rev-parse --git-path to handle both main repos and worktrees
MERGE_HEAD_PATH=$(git rev-parse --git-path MERGE_HEAD 2>/dev/null || true)
if [ -n "$MERGE_HEAD_PATH" ] && [ -f "$MERGE_HEAD_PATH" ]; then
  exit 0
fi

# Allow: only non-code files staged (docs, config, markdown)
# If git is available and there are staged files, check if ALL are non-code
if command -v git &>/dev/null; then
  STAGED=$(git diff --cached --name-only 2>/dev/null || true)
  if [ -n "$STAGED" ]; then
    CODE_FILES=$(echo "$STAGED" | grep -vE '\.(md|json|ya?ml|toml|txt|cfg|ini|conf|lock|gitignore|claudeignore|envrc)$' || true)
    if [ -z "$CODE_FILES" ]; then
      exit 0
    fi
  fi
fi

echo '{"decision":"block","reason":"Blocked: --no-verify and --no-gpg-sign bypass quality gates. Remove the flag and let hooks run. (Override: set DM_SKIP_VERIFY=1 or resolve an active merge)"}'
exit 2

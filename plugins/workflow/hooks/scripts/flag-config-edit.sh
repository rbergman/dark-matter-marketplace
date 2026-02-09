#!/usr/bin/env bash
# PostToolUse hook: Warn when editing linter/build config files.
# Does NOT block — config changes are sometimes legitimate.
# Outputs a systemMessage warning via stdout JSON.

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# Check against gate config patterns
case "$BASENAME" in
  eslint.config.*|.eslintrc.*|tsconfig*.json|biome.json|.prettierrc*|jest.config.*|.golangci.*)
    echo "{\"systemMessage\":\"⚠️ Config file modified: ${BASENAME}. If this weakens quality gates (disabling rules, relaxing checks), revert the change. Config edits that weaken gates are a top friction source.\"}"
    ;;
esac

exit 0

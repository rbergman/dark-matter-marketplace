#!/usr/bin/env bash
# Stop hook: Auto-detect project type and run quality gates before session ends.
# Exit 2 = block the stop (gates failed).
# Exit 0 = gates pass or no gate detected.

set -euo pipefail

# Find project root by looking for common markers
find_project_root() {
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/justfile" ] || [ -f "$dir/package.json" ] || [ -f "$dir/Cargo.toml" ] || [ -f "$dir/go.mod" ]; then
      echo "$dir"
      return
    fi
    dir=$(dirname "$dir")
  done
  echo ""
}

PROJECT_ROOT=$(find_project_root)

if [ -z "$PROJECT_ROOT" ]; then
  # No project detected — nothing to gate
  exit 0
fi

cd "$PROJECT_ROOT"

GATE_CMD=""
GATE_DESC=""

if [ -f "justfile" ]; then
  # Check if justfile has a 'check' recipe
  if just --summary 2>/dev/null | tr ' ' '\n' | grep -qx 'check'; then
    GATE_CMD="just check"
    GATE_DESC="just check"
  fi
elif [ -f "package.json" ]; then
  # Check if package.json has a 'check' script
  if jq -e '.scripts.check' package.json >/dev/null 2>&1; then
    GATE_CMD="npm run check"
    GATE_DESC="npm run check"
  fi
elif [ -f "Cargo.toml" ]; then
  GATE_CMD="cargo test"
  GATE_DESC="cargo test"
elif [ -f "go.mod" ]; then
  if [ -f "justfile" ] && just --summary 2>/dev/null | tr ' ' '\n' | grep -qx 'check'; then
    GATE_CMD="just check"
    GATE_DESC="just check"
  else
    GATE_CMD="go test ./..."
    GATE_DESC="go test ./..."
  fi
fi

if [ -z "$GATE_CMD" ]; then
  # No recognized gate — allow stop
  exit 0
fi

# Capture output to temp file — only show on failure.
# CRITICAL: Do NOT let gate output reach stdout/stderr.
# Claude Code hooks capture all output and inject it into conversation context.
# A typical test suite produces 500KB+ of output — instant context overflow.
GATE_OUTPUT=$(mktemp)
trap 'rm -f "$GATE_OUTPUT"' EXIT

if eval "$GATE_CMD" >"$GATE_OUTPUT" 2>&1; then
  # Gates passed — suppress all output, exit clean
  exit 0
else
  # Gates failed — show only the last 50 lines as context for fixing
  TAIL=$(tail -50 "$GATE_OUTPUT")
  echo "{\"decision\":\"block\",\"reason\":\"🚫 Quality gates failed ($GATE_DESC). Last 50 lines:\\n${TAIL}\"}"
  exit 2
fi

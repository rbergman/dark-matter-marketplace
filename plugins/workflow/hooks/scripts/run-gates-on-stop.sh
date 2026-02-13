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

# Skip gates if no source code changes.
# Ignore docs, config, and non-code files that can't break a build.
CHANGED=$(git status --porcelain 2>/dev/null | awk '{print $NF}' \
  | grep -Ev '\.(md|txt|log|json|yaml|yml|toml|csv|svg|png|jpg|gif|ico)$' \
  | grep -Ev '^(LICENSE|CHANGELOG|AGENTS|CLAUDE|README|\.gitignore|\.beads/|history/)' \
  || true)

if [ -z "$CHANGED" ]; then
  exit 0
fi

# Dedup: skip gates if working tree unchanged since last successful run.
# Without this, the Stop hook (which fires every turn) creates a feedback loop:
# turn ends → gates run → pass → Claude Code shows feedback → agent responds → repeat.
STATE_HASH=$( (git diff HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null) | cksum | cut -d' ' -f1 )
mkdir -p "$PROJECT_ROOT/history"
HASH_FILE="$PROJECT_ROOT/history/.gates-last-pass"

if [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE" 2>/dev/null)" = "$STATE_HASH" ]; then
  # Same state as last successful run — skip
  exit 0
fi

# Loop breaker: after 3 consecutive failures on the same state, stop blocking.
# Without this, a lint violation creates an infinite stop→fail→feedback→respond loop.
FAIL_FILE="$PROJECT_ROOT/history/.gates-fail-state"

# Capture output to temp file — only show on failure.
# CRITICAL: Do NOT let gate output reach stdout/stderr.
# Claude Code hooks capture all output and inject it into conversation context.
# A typical test suite produces 500KB+ of output — instant context overflow.
GATE_OUTPUT=$(mktemp)
trap 'rm -f "$GATE_OUTPUT"' EXIT

if eval "$GATE_CMD" >"$GATE_OUTPUT" 2>&1; then
  # Gates passed — record state hash so subsequent turns skip
  echo "$STATE_HASH" > "$HASH_FILE"
  rm -f "$FAIL_FILE"
  exit 0
else
  # Gates failed — clear pass hash so they re-run after fix attempts
  rm -f "$HASH_FILE"

  # Track consecutive failures on the same working tree state.
  PREV_FAIL_STATE=$(cat "$FAIL_FILE" 2>/dev/null || echo "")
  if [ "$PREV_FAIL_STATE" = "$STATE_HASH" ]; then
    # Same state failed before — agent hasn't changed anything. Break the loop.
    echo "Quality gates still failing ($GATE_DESC) — same state as last attempt, allowing stop." >&2
    rm -f "$FAIL_FILE"
    exit 0
  fi

  # First failure on this state — record it and block
  echo "$STATE_HASH" > "$FAIL_FILE"
  # Show last 50 lines on stderr — Claude Code reads stderr (not stdout) on exit 2
  echo "Quality gates failed ($GATE_DESC). Last 50 lines:" >&2
  tail -50 "$GATE_OUTPUT" >&2
  exit 2
fi

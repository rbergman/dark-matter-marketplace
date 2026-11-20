#!/usr/bin/env bash
# Stop hook: Run an explicit lightweight project tripwire before a turn ends.
# Exit 2 = block the stop (gates failed).
# Exit 0 = gates pass or no gate detected.

set -euo pipefail

# Find project root anchored to git toplevel (not nearest ancestor with a marker).
# This prevents misdetection when $PWD is inside a vendored submodule or nested
# package that has its own package.json/Cargo.toml but isn't the real project.
find_project_root() {
  # Prefer superproject root when inside a submodule; fall back to toplevel
  local git_root
  git_root=$(git -C "$PWD" rev-parse --show-superproject-working-tree 2>/dev/null || true)
  if [ -z "$git_root" ]; then
    git_root=$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || true)
  fi

  if [ -z "$git_root" ]; then
    echo ""
    return
  fi

  # A fast recipe is the project’s opt-in; never infer a full gate at turn end.
  if [ -f "$git_root/justfile" ]; then
    echo "$git_root"
  else
    echo ""
  fi
}

PROJECT_ROOT=$(find_project_root)

if [ -z "$PROJECT_ROOT" ]; then
  # No project detected — nothing to gate
  exit 0
fi

cd "$PROJECT_ROOT"

if ! just --summary 2>/dev/null | tr ' ' '\n' | grep -qx 'check-fast'; then
  exit 0
fi
GATE_DESC="just check-fast"
GATE=(just check-fast)

# Run under the repo's pinned toolchain. Plain `mise exec` inserts its tools where
# the shims sit in PATH, which can be behind Homebrew; aggressive mode puts them first.
# Never download a toolchain inside a timed hook: a missing version only warns.
if command -v mise >/dev/null 2>&1; then
  for mise_config in mise.toml .mise.toml mise.local.toml .mise.local.toml \
      .config/mise.toml .config/mise/config.toml mise/config.toml .mise/config.toml \
      .tool-versions; do
    if [ -f "$mise_config" ]; then
      GATE=(env MISE_ACTIVATE_AGGRESSIVE=1 MISE_EXEC_AUTO_INSTALL=0 mise exec -- just check-fast)
      break
    fi
  done
fi

# Skip documentation/media-only changes. Configuration can affect behavior.
CHANGED=$(git status --porcelain 2>/dev/null | awk '{print $NF}' \
  | grep -Ev '\.(md|txt|log|csv|svg|png|jpg|gif|ico)$' \
  | grep -Ev '^(LICENSE|CHANGELOG|AGENTS|CLAUDE|README|\.gitignore|\.beads/|history/)' \
  || true)

if [ -z "$CHANGED" ]; then
  exit 0
fi

# Dedup: skip gates if working tree unchanged since last successful run.
# Without this, the Stop hook (which fires every turn) creates a feedback loop:
# turn ends → gates run → pass → Claude Code shows feedback → agent responds → repeat.
STATE_HASH=$( {
  git rev-parse HEAD 2>/dev/null
  git diff HEAD -- . ':!history/.gates-*' 2>/dev/null
  git ls-files --others --exclude-standard -z -- . ':!history/.gates-*' 2>/dev/null | while IFS= read -r -d '' file; do
    case "$file" in
      (*.md|*.txt|*.log|*.csv|*.svg|*.png|*.jpg|*.gif|*.ico|.beads/*|history/*) continue ;;
    esac
    printf '%s\0' "$file"
    if [ -L "$file" ]; then
      # Hash the link itself; never read an external target's private contents.
      readlink "$file"
    elif [ -f "$file" ] && [ -r "$file" ]; then
      cksum < "$file"
    else
      # Nested repositories and unreadable entries have no bytes to hash.
      printf 'nonregular-or-unreadable\0'
    fi
  done
} | cksum | cut -d' ' -f1 )
mkdir -p "$PROJECT_ROOT/history"
HASH_FILE="$PROJECT_ROOT/history/.gates-last-pass"

if [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE" 2>/dev/null)" = "$STATE_HASH" ]; then
  # Same state as last successful run — skip
  exit 0
fi

# Loop breaker: after a repeated failure on the same state, stop blocking.
# Without this, a lint violation creates an infinite stop→fail→feedback→respond loop.
FAIL_FILE="$PROJECT_ROOT/history/.gates-fail-state"

# Capture output to temp file — only show on failure.
# CRITICAL: Do NOT let gate output reach stdout/stderr.
# Claude Code hooks capture all output and inject it into conversation context.
# A typical test suite produces 500KB+ of output — instant context overflow.
GATE_OUTPUT=$(mktemp)
trap 'rm -f "$GATE_OUTPUT"' EXIT

run_gate() {
  "${GATE[@]}" >"$GATE_OUTPUT" 2>&1 && return 0
  # An untrusted mise config (every fresh worktree) is the operator's call, not a gate
  # failure: run the plain gate instead and never tell the agent to `mise trust`.
  if [ "${GATE[0]}" = env ] && grep -q 'are not trusted' "$GATE_OUTPUT"; then
    just check-fast >"$GATE_OUTPUT" 2>&1
  else
    return 1
  fi
}

if run_gate; then
  # Gates passed — record state hash so subsequent turns skip
  echo "$STATE_HASH" > "$HASH_FILE"
  rm -f "$FAIL_FILE"
  exit 0
else
  # Another session's golangci-lint holds its lock: this tree didn't fail, so skip
  # without recording anything and let the next stop run the gate again.
  if grep -q 'parallel golangci-lint is running' "$GATE_OUTPUT"; then
    echo "Quality gates skipped ($GATE_DESC): another golangci-lint run holds its lock." >&2
    exit 0
  fi

  # Gates failed — clear pass hash so they re-run after fix attempts
  rm -f "$HASH_FILE"

  # Track consecutive failures on the same working tree state.
  PREV_FAIL_STATE=$(cat "$FAIL_FILE" 2>/dev/null || echo "")
  if [ "$PREV_FAIL_STATE" = "$STATE_HASH" ]; then
    # Same state failed before — agent hasn't changed anything. Break the loop, and
    # keep the marker so every later stop on this state is allowed too.
    echo "Quality gates still failing ($GATE_DESC) — same state as last attempt, allowing stop." >&2
    exit 0
  fi

  # First failure on this state — record it and block
  echo "$STATE_HASH" > "$FAIL_FILE"
  # Show last 50 lines on stderr — Claude Code reads stderr (not stdout) on exit 2
  echo "Quality gates failed ($GATE_DESC). Last 50 lines:" >&2
  tail -50 "$GATE_OUTPUT" >&2
  exit 2
fi

#!/usr/bin/env bash
# PreToolUse hook: Run a lightweight sanity review on staged changes before commit.
# Intercepts git commit commands. Uses Codex CLI (cross-model, reads AGENTS.md natively)
# or claude -p with Sonnet (reads CLAUDE.md/AGENTS.md as system context) as reviewer.
#
# Configuration (env vars):
#   DM_SANITY_REVIEWER=codex|sonnet|off   (default: auto-detect)
#   DM_SKIP_SANITY=1                       (skip this commit — set by orchestrator for already-reviewed work)
#   DM_SANITY_MAX_LOC=500                  (skip if diff exceeds this LOC — use /review instead)
#
# Override mechanism:
#   If the agent disagrees with findings, it sets DM_SKIP_SANITY=1 before the next commit.
#   The orchestrator sets this when committing work that already passed intent review + evaluator.
#
# Circuit breaker:
#   Tracks review count in /tmp/dm-sanity-count-<repo-hash>.
#   After 2 blocked reviews in the same session, becomes advisory (warns, doesn't block).
#
# Exit 2 = block the commit (findings need attention).
# Exit 0 = no issues or review skipped.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit\b'; then
  exit 0
fi

# --- Skip conditions ---

# Explicit skip (orchestrator already reviewed, or agent overriding)
if [ "${DM_SKIP_SANITY:-}" = "1" ]; then
  exit 0
fi

# Reviewer disabled
if [ "${DM_SANITY_REVIEWER:-}" = "off" ]; then
  exit 0
fi

# Merge commit
MERGE_HEAD_PATH=$(git rev-parse --git-path MERGE_HEAD 2>/dev/null || true)
if [ -n "$MERGE_HEAD_PATH" ] && [ -f "$MERGE_HEAD_PATH" ]; then
  exit 0
fi

# Beads-backup branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ "$BRANCH" = "beads-backup" ]; then
  exit 0
fi

# No staged changes
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

# Only non-code files staged (docs, config, markdown)
CODE_FILES=$(echo "$STAGED" | grep -vE '\.(md|json|ya?ml|toml|txt|cfg|ini|conf|lock|gitignore|claudeignore|envrc|prettierignore|prettierrc)$' || true)
if [ -z "$CODE_FILES" ]; then
  exit 0
fi

# Diff too large for sanity check — suggest /review instead
MAX_LOC=${DM_SANITY_MAX_LOC:-500}
LOC=$(git diff --cached --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
if [ "$LOC" -gt "$MAX_LOC" ]; then
  echo '{"decision":"allow","reason":"Sanity review skipped: diff exceeds '"$MAX_LOC"' LOC. Consider running /dm-work:review for a full review."}'
  exit 0
fi

# --- Circuit breaker ---
REPO_HASH=$(echo "$PWD" | md5 2>/dev/null | cut -c1-8 || echo "$PWD" | md5sum 2>/dev/null | cut -c1-8 || echo "default")
COUNTER_FILE="/tmp/dm-sanity-count-${REPO_HASH}"
COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
fi

# After 2 blocked reviews, become advisory only
ADVISORY_MODE=false
if [ "$COUNT" -ge 2 ]; then
  ADVISORY_MODE=true
fi

# --- Select reviewer ---
REVIEWER=${DM_SANITY_REVIEWER:-auto}

if [ "$REVIEWER" = "auto" ]; then
  if command -v codex &>/dev/null; then
    REVIEWER="codex"
  else
    REVIEWER="sonnet"
  fi
fi

# --- Run review ---
DIFF=$(git diff --cached 2>/dev/null || true)
REVIEW_OUTPUT=""
REVIEW_STATUS=0

# Sonnet prompt — references CLAUDE.md/AGENTS.md which claude -p loads automatically
SONNET_PROMPT="You are a sanity reviewer. The project's CLAUDE.md (loaded as system context) contains coding standards and conventions — apply them.

Review the staged diff below for OBVIOUS issues only:
- Bugs and logic errors
- Forgotten debug/console.log code
- Half-finished changes (TODOs that shouldn't ship)
- Missing error handling on new code paths
- Violations of project conventions from CLAUDE.md (file length limits, naming, architecture rules)

If everything looks fine, respond with exactly 'LGTM'.
If you find issues, list 1-3 specific concerns with file:line references. Be terse.

Staged diff:
$DIFF"

case "$REVIEWER" in
  codex)
    # Codex CLI review — reads AGENTS.md natively, cross-model sanity check
    REVIEW_OUTPUT=$(timeout 60 codex review --uncommitted 2>&1) || REVIEW_STATUS=$?
    # If Codex fails (not installed, usage exhausted, timeout), fall back to sonnet
    if [ $REVIEW_STATUS -ne 0 ] || [ -z "$REVIEW_OUTPUT" ]; then
      if command -v claude &>/dev/null; then
        REVIEWER="sonnet"
        REVIEW_OUTPUT=$(timeout 60 claude -p --model claude-sonnet-4-6 "$SONNET_PROMPT" 2>&1) || REVIEW_STATUS=$?
      else
        # No reviewer available — allow commit
        exit 0
      fi
    fi
    ;;
  sonnet)
    if ! command -v claude &>/dev/null; then
      exit 0
    fi
    REVIEW_OUTPUT=$(timeout 60 claude -p --model claude-sonnet-4-6 "$SONNET_PROMPT" 2>&1) || REVIEW_STATUS=$?
    ;;
  *)
    exit 0
    ;;
esac

# --- Process results ---

# Check if LGTM (passes)
if echo "$REVIEW_OUTPUT" | grep -qi 'LGTM\|no issues\|looks good\|no obvious'; then
  # Reset circuit breaker on clean pass
  rm -f "$COUNTER_FILE"
  exit 0
fi

# Issues found
if [ -z "$REVIEW_OUTPUT" ]; then
  # Empty output = reviewer failed silently, allow commit
  exit 0
fi

# Increment circuit breaker
echo $((COUNT + 1)) > "$COUNTER_FILE"

if [ "$ADVISORY_MODE" = "true" ]; then
  # Advisory only — warn but don't block
  echo '{"decision":"allow","reason":"⚠️ Sanity review (advisory, circuit breaker active):\n'"$(echo "$REVIEW_OUTPUT" | head -20 | sed 's/"/\\"/g' | tr '\n' ' ')"'\n\nCircuit breaker: 2+ review rounds. Findings are advisory. Set DM_SKIP_SANITY=1 or run /dm-work:review for a full review."}'
  exit 0
fi

# Block with findings — agent reads these and decides
echo '{"decision":"block","reason":"🔍 Sanity review found concerns:\n\n'"$(echo "$REVIEW_OUTPUT" | head -20 | sed 's/"/\\"/g' | tr '\n' ' ')"'\n\nTo proceed: fix the issues and commit again, OR set DM_SKIP_SANITY=1 if you disagree with the findings."}'
exit 2

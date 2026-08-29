#!/usr/bin/env bash
# PreToolUse hook: Run a lightweight sanity review on staged changes before commit.
# Intercepts git commit commands. Uses Codex CLI (cross-model, reads AGENTS.md natively)
# or claude -p with Opus (reads CLAUDE.md/AGENTS.md as system context) as reviewer.
# Opus is the model floor for review work — never a sub-Opus model.
#
# Configuration (env vars):
#   DM_SANITY_REVIEWER=codex|claude|off   (default: auto-detect; "sonnet" accepted as legacy alias for claude)
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

# --no-verify commits are block-no-verify.sh's job (hooks in a matcher group run
# in parallel) — don't spend a model call reviewing a commit that's being blocked
if echo "$COMMAND" | grep -qE '\--no-verify' \
   || echo "$COMMAND" | grep -qE 'git\b[^|;&]*\bcommit\b[^|;&]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)'; then
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
  jq -n --arg m "Sanity review skipped: diff exceeds ${MAX_LOC} LOC. Consider running /dm-work:review for a full review." '{systemMessage: $m}'
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

# Legacy alias
if [ "$REVIEWER" = "sonnet" ]; then
  REVIEWER="claude"
fi

FALLBACK_NOTE=""
if [ "$REVIEWER" = "auto" ]; then
  if command -v codex &>/dev/null; then
    REVIEWER="codex"
  else
    REVIEWER="claude"
    FALLBACK_NOTE="[cross-model review unavailable: codex not installed — claude reviewing] "
  fi
fi

# --- Run review ---
DIFF=$(git diff --cached 2>/dev/null || true)
REVIEW_OUTPUT=""
REVIEW_STATUS=0

# Claude prompt — references CLAUDE.md/AGENTS.md which claude -p loads automatically
CLAUDE_PROMPT="You are a sanity reviewer. The project's CLAUDE.md (loaded as system context) contains coding standards and conventions — apply them.

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
    # If Codex fails (usage exhausted, timeout), fall back to claude — noted, not silent
    if [ $REVIEW_STATUS -ne 0 ] || [ -z "$REVIEW_OUTPUT" ]; then
      if command -v claude &>/dev/null; then
        REVIEWER="claude"
        FALLBACK_NOTE="[cross-model review unavailable: codex failed — claude fallback] "
        REVIEW_STATUS=0
        REVIEW_OUTPUT=$(timeout 60 claude -p --model claude-opus-5 "$CLAUDE_PROMPT" 2>&1) || REVIEW_STATUS=$?
      else
        # No reviewer available — allow commit, but say so
        jq -n '{systemMessage: "Sanity review skipped: no reviewer available (neither codex nor claude CLI on PATH)."}'
        exit 0
      fi
    fi
    ;;
  claude)
    if ! command -v claude &>/dev/null; then
      jq -n '{systemMessage: "Sanity review skipped: claude CLI not on PATH."}'
      exit 0
    fi
    REVIEW_OUTPUT=$(timeout 60 claude -p --model claude-opus-5 "$CLAUDE_PROMPT" 2>&1) || REVIEW_STATUS=$?
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

FINDINGS=$(echo "$REVIEW_OUTPUT" | head -20)

if [ "$ADVISORY_MODE" = "true" ]; then
  # Advisory only — warn but don't block (jq handles all string escaping)
  jq -n --arg m "⚠️ ${FALLBACK_NOTE}Sanity review (advisory, circuit breaker active):
${FINDINGS}

Circuit breaker: 2+ review rounds. Findings are advisory. Set DM_SKIP_SANITY=1 or run /dm-work:review for a full review." '{systemMessage: $m}'
  exit 0
fi

# Block with findings — stderr + exit 2 is the documented block channel and reaches the model
{
  echo "🔍 ${FALLBACK_NOTE}Sanity review found concerns:"
  echo
  echo "$FINDINGS"
  echo
  echo "To proceed: fix the issues and commit again, OR set DM_SKIP_SANITY=1 if you disagree with the findings."
} >&2
exit 2

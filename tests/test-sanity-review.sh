#!/usr/bin/env bash
set -euo pipefail

HOOK=$(cd "$(dirname "$0")/.." && pwd)/plugins/workflow/hooks/scripts/sanity-review.sh
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
BIN="$TEST_DIR/bin"
REPO="$TEST_DIR/repo"
mkdir -p "$BIN" "$REPO"

cat > "$BIN/timeout" <<'EOF'
#!/usr/bin/env bash
shift
exec "$@"
EOF

cat > "$BIN/codex" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$@" > "$CAPTURE_ARGS"
cat > "$CAPTURE_PROMPT"
output=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    output=$2
    shift 2
  else
    shift
  fi
done
printf '%s' "${MOCK_CODEX_RESPONSE:-LGTM}" > "$output"
echo "tool log: no issues found"
exit "${MOCK_CODEX_STATUS:-0}"
EOF

cat > "$BIN/claude" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$@" > "$CAPTURE_CLAUDE_ARGS"
cat > "$CAPTURE_CLAUDE_PROMPT"
printf '%s' "${MOCK_CLAUDE_RESPONSE:-LGTM}"
exit "${MOCK_CLAUDE_STATUS:-0}"
EOF
chmod +x "$BIN/timeout" "$BIN/codex" "$BIN/claude"

cd "$REPO"
git init -q
git config user.email test@example.com
git config user.name Test
printf 'base\n' > app.py
git add app.py
git commit -qm base
printf 'staged version\n' > app.py
git add app.py
STAGED_TREE=$(git write-tree)
printf 'unstaged version\n' > app.py

run_hook() {
  local reviewer=$1 codex_response=$2 codex_status=$3 claude_response=${4:-LGTM}
  set +e
  printf '%s\n' '{"tool_input":{"command":"git commit -m test"}}' | env \
    PATH="$BIN:$PATH" \
    DM_SANITY_REVIEWER="$reviewer" \
    CAPTURE_ARGS="$TEST_DIR/codex.args" \
    CAPTURE_PROMPT="$TEST_DIR/codex.prompt" \
    CAPTURE_CLAUDE_ARGS="$TEST_DIR/claude.args" \
    CAPTURE_CLAUDE_PROMPT="$TEST_DIR/claude.prompt" \
    MOCK_CODEX_RESPONSE="$codex_response" \
    MOCK_CODEX_STATUS="$codex_status" \
    MOCK_CLAUDE_RESPONSE="$claude_response" \
    "$HOOK" > "$TEST_DIR/stdout" 2> "$TEST_DIR/stderr"
  STATUS=$?
  set -e
}

fail() { echo "FAIL: $*" >&2; exit 1; }
contains() { grep -Fq -- "$2" "$1" || fail "$1 does not contain: $2"; }
omits() { ! grep -Fq -- "$2" "$1" || fail "$1 unexpectedly contains: $2"; }

# Exact success reviews only the pinned staged bytes with Sol Medium.
run_hook codex LGTM 0
[ "$STATUS" -eq 0 ] || fail "exact LGTM should pass"
contains "$TEST_DIR/codex.args" exec
contains "$TEST_DIR/codex.args" gpt-5.6-sol
contains "$TEST_DIR/codex.args" 'model_reasoning_effort="medium"'
contains "$TEST_DIR/codex.args" read-only
omits "$TEST_DIR/codex.args" review
omits "$TEST_DIR/codex.args" --uncommitted
contains "$TEST_DIR/codex.prompt" "Pinned staged tree: $STAGED_TREE"
contains "$TEST_DIR/codex.prompt" "git show $STAGED_TREE:app.py"
contains "$TEST_DIR/codex.prompt" "staged version"
omits "$TEST_DIR/codex.prompt" "unstaged version"

# Friendly prose and tool logs are not a verified pass.
run_hook codex "No issues found" 0
[ "$STATUS" -eq 2 ] || fail "non-exact success text should block"
contains "$TEST_DIR/stderr" "No issues found"

# An explicitly selected provider fails closed and never falls back.
rm -f "$TEST_DIR/claude.args"
run_hook codex LGTM 9
[ "$STATUS" -eq 2 ] || fail "failed explicit Codex review should block"
contains "$TEST_DIR/stderr" "UNVERIFIED: codex sanity review failed with status 9"
contains "$TEST_DIR/stderr" "Reviewer log:"
[ ! -e "$TEST_DIR/claude.args" ] || fail "explicit Codex selection fell back to Claude"

# Circuit-breaker output is advisory but explicitly remains unverified.
run_hook codex "app.py:1: still concerning" 0
[ "$STATUS" -eq 0 ] || fail "third review should be advisory"
contains "$TEST_DIR/stdout" "Sanity review UNVERIFIED"
contains "$TEST_DIR/stdout" "does not mean the change was verified"

# Auto mode may fall back, and Claude remains pinned to Opus.
run_hook auto LGTM 9 LGTM
[ "$STATUS" -eq 0 ] || fail "successful auto fallback should pass"
contains "$TEST_DIR/claude.args" --model
contains "$TEST_DIR/claude.args" claude-opus-5

echo "sanity-review tests passed"

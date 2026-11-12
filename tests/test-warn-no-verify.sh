#!/usr/bin/env bash
# The --no-verify hook warns and never blocks.
set -euo pipefail
HOOK="$(cd "$(dirname "$0")/.." && pwd)/plugins/workflow/hooks/scripts/warn-no-verify.sh"
run() { jq -n --arg c "$1" '{tool_input:{command:$c}}' | "$HOOK"; }
fail() { echo "FAIL: $1" >&2; exit 1; }

for cmd in 'git commit --no-verify -m x' 'git -C /r commit -qn -m x' 'git push --no-verify' 'cd r && git commit --amend --no-edit --no-verify'; do
  out=$(run "$cmd") || fail "exit non-zero for: $cmd"
  [ "$(echo "$out" | jq -r '.hookSpecificOutput.hookEventName')" = "PreToolUse" ] || fail "no PreToolUse output for: $cmd"
  echo "$out" | jq -e '.hookSpecificOutput.additionalContext | test("say why")' >/dev/null || fail "no reason request for: $cmd"
  echo "$out" | jq -e '.hookSpecificOutput | has("permissionDecision") | not' >/dev/null || fail "must not decide permission: $cmd"
done

for cmd in 'git commit -m "plain"' 'git status' 'npm test -- --no-verify' 'echo done'; do
  out=$(run "$cmd") || fail "exit non-zero for: $cmd"
  [ -z "$out" ] || fail "unexpected output for: $cmd"
done
echo "warn-no-verify: ok"

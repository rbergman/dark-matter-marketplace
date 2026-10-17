#!/usr/bin/env bash
set -euo pipefail

# Hooks may invoke this test with Git's parent-index/worktree environment set.
for git_var in "${!GIT_@}"; do unset "$git_var"; done

HOOK=$(cd "$(dirname "$0")/.." && pwd)/plugins/workflow/hooks/scripts/run-gates-on-stop.sh
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
mkdir -p "$TEST_DIR/bin" "$TEST_DIR/repo"
cat > "$TEST_DIR/bin/just" <<'MOCK'
#!/usr/bin/env bash
if [ "$1" = --summary ]; then
  printf '%s\n' "$RECIPES"
else
  printf '%s\n' "$*" >> "$CALLS"
  exit "${GATE_STATUS:-0}"
fi
MOCK
for tool in npm cargo go; do
  cat > "$TEST_DIR/bin/$tool" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "unexpected full gate" >> "$CALLS"
exit 9
MOCK
done
chmod +x "$TEST_DIR/bin/"*
cd "$TEST_DIR/repo"
git init -q
[ "$(git rev-parse --absolute-git-dir)" = "$(pwd -P)/.git" ] || {
  echo 'FAIL: fixture Git directory escaped its isolated repository' >&2
  exit 1
}
git config user.email test@example.com
git config user.name Test
printf 'base\n' > app.ts
printf 'check:\n' > justfile
git add .
git -c core.hooksPath=/dev/null commit -qm base
printf 'changed\n' > app.ts
export CALLS="$TEST_DIR/calls"
export RECIPES='check check-fast'
export PATH="$TEST_DIR/bin:$PATH"

fail() { echo "FAIL: $*" >&2; cat "$TEST_DIR/stderr" >&2; exit 1; }
run_hook() {
  set +e
  "$HOOK" > "$TEST_DIR/stdout" 2> "$TEST_DIR/stderr"
  STATUS=$?
  set -e
}
reset_state() { rm -rf history; rm -f "$CALLS"; }
assert_calls() {
  [ "$(wc -l < "$CALLS" | tr -d ' ')" = "$1" ] || fail "expected $1 gate invocations"
  ! grep -vq '^check-fast$' "$CALLS" || fail 'ran a full gate'
}

# Full recipes never run implicitly; explicit fast recipe is used and deduplicated.
RECIPES=check
run_hook
[ "$STATUS" -eq 0 ] && [ ! -e "$CALLS" ] || fail 'fell back to full just check'
RECIPES='check check-fast'
run_hook
[ "$STATUS" -eq 0 ] || fail 'fast gate should pass'
assert_calls 1
run_hook
assert_calls 1

# Config-only changes still require the fast gate.
reset_state
git restore app.ts
printf '{}\n' > package.json
run_hook
assert_calls 1

# Changing an untracked file's bytes invalidates the previous pass.
printf '{"changed":true}\n' > package.json
run_hook
assert_calls 2

# Nested repositories and broken links are inventory entries, not readable files.
mkdir nested
git -C nested init -q
ln -s missing-target broken-link
run_hook
[ "$STATUS" -eq 0 ] || fail 'nonregular untracked entry crashed hashing'
assert_calls 3
rm -rf nested broken-link

# Symlinks hash literal targets, never bytes from outside the fixture repo.
reset_state
printf 'private fixture bytes\n' > "$TEST_DIR/external-one"
printf 'private fixture bytes\n' > "$TEST_DIR/external-two"
ln -s "$TEST_DIR/external-one" external-link
run_hook
[ "$STATUS" -eq 0 ] || fail 'readable untracked link should be supported'
assert_calls 1
printf 'changed private fixture bytes\n' > "$TEST_DIR/external-one"
run_hook
assert_calls 1
rm -f external-link
ln -s "$TEST_DIR/external-two" external-link
run_hook
assert_calls 2
rm -f external-link

# Failure blocks once and remains visibly failing when the loop breaker allows stop.
reset_state
export GATE_STATUS=1
run_hook
[ "$STATUS" -eq 2 ] || fail 'first failure must block'
grep -q 'Quality gates failed' "$TEST_DIR/stderr" || fail 'failure missing'
run_hook
[ "$STATUS" -eq 0 ] || fail 'repeated unchanged failure must break loop'
grep -q 'still failing' "$TEST_DIR/stderr" || fail 'loop breaker hid failure'
assert_calls 2
unset GATE_STATUS

# No fast recipe means no inferred npm/Cargo/Go suite in marker-only projects.
reset_state
rm -f justfile
printf '[package]\n' > Cargo.toml
printf 'module example.test\n' > go.mod
run_hook
[ "$STATUS" -eq 0 ] && [ ! -e "$CALLS" ] || fail 'inferred a full language gate'

# Documentation-only edits do not invoke the tripwire.
reset_state
rm -f package.json Cargo.toml go.mod
git restore justfile
printf 'docs\n' > README.md
run_hook
[ "$STATUS" -eq 0 ] && [ ! -e "$CALLS" ] || fail 'docs invoked a tripwire'
echo 'run-gates-on-stop tests passed'

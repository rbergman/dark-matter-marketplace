---
description: Spawn N agents on the same spec in isolated worktrees, compare by objective metrics, pick winner
argument-hint: "--spec <text>, --bead <id>, --n <count>, --approaches \"h1\" \"h2\" ..., --auto, --gate <command>"
---

# Competitive Generation Command

Spawn N agents implementing the same spec in isolated worktrees. Compare results by objective metrics (gate pass, diff size, lint violations, files changed). Pick the winner and merge.

Use competitive generation when the implementation approach matters more than speed — when you want to explore multiple solutions and pick the best one rather than committing to the first approach that works.

## Arguments

```
$ARGUMENTS
```

| Flag | Description | Default |
|------|-------------|---------|
| `--spec <text>` | Specification text to implement | from context |
| `--bead <id>` | Pull spec from a bead issue | none |
| `--n <count>` | Number of competing agents to spawn | 3 |
| `--approaches "h1" "h2" ...` | Hint each agent toward a specific approach | agents choose freely |
| `--auto` | Skip interactive selection, merge highest scorer | interactive |
| `--gate <command>` | Quality gate command to run | auto-detect |

---

## Phase 1: Parse Spec

Resolve the specification from (in priority order):

1. `--spec <text>` — use directly
2. `--bead <id>` — fetch via `bd show <id>`, use title + description
3. `$ARGUMENTS` — treat remaining arguments as spec text
4. **None found** — use AskUserQuestion to prompt for a spec

The spec should have testable acceptance criteria. If it's vague or purely aspirational, warn the user and suggest running `/dm-work:refine` first to sharpen it into something measurable.

---

## Phase 2: Setup

### Auto-detect quality gate

Check for a gate command in this order (use first match):

```bash
# justfile (preferred)
just --list 2>/dev/null | grep -qE '^(check|ci|test)\b' && echo "just check"

# package.json
[ -f package.json ] && node -e "const p=require('./package.json'); const s=p.scripts||{}; console.log(s.check||s.ci||s.test||'')" 2>/dev/null

# Cargo.toml
[ -f Cargo.toml ] && echo "cargo test"

# go.mod
[ -f go.mod ] && echo "go test ./..."
```

Override with `--gate <command>` if provided.

### Validate prerequisites

- Confirm `git worktree` is available
- Ensure working tree is clean (no uncommitted changes) — abort if dirty
- Record current HEAD as the base commit

### Generate competitor IDs

Create IDs: `compete-1`, `compete-2`, ..., `compete-N`

---

## Phase 3: Spawn Competitors

Launch all N agents in a SINGLE message (parallel execution) using `isolation: "worktree"`.

Each agent gets identical instructions with an optional approach hint:

````
Agent(subagent_type="general-purpose", model="opus", isolation="worktree", description="Competitor <ID>", prompt="
You are a competitor in a competitive generation exercise. Your goal is to produce the BEST implementation of the spec below, optimized for correctness, simplicity, and minimal diff.

SPEC:
<spec text>

APPROACH HINT: <approach hint if --approaches provided, otherwise 'Choose your own approach'>

RULES:
- Implement the spec completely
- Run the quality gate: <gate command>
- Do NOT communicate with other agents
- Optimize for: passing gates, small diff, clean code, few files changed

After implementation, output your results in this EXACT format:

STATUS: PASS or FAIL
APPROACH: <1-2 sentence description of your approach>
TESTS: <number of tests passing> / <total tests>
DIFF_STATS: <lines added> added, <lines deleted> deleted
FILES_CHANGED: <count>
LINT_VIOLATIONS: <count, 0 if none>
GATE_OUTPUT: <final line of gate command output>
SUMMARY: <2-3 sentence summary of what you did and why>
")
````

---

## Phase 4: Score

### Disqualification

Any competitor whose gate command failed (STATUS: FAIL) is disqualified. If all competitors fail, report the failures and abort — don't merge broken code.

### Scoring (among passing competitors)

| Metric | Weight | Better = |
|--------|--------|----------|
| Diff size (lines added + deleted) | 40% | Smaller |
| Lint violations | 30% | Fewer |
| Files changed | 30% | Fewer |

**Normalization:** For each metric, normalize against the maximum value across competitors. A competitor with the smallest diff gets score 1.0 for that metric; the largest gets score 0.0. Formula: `score = 1 - (value / max_value)` (handle max=0 as all tied at 1.0).

**Final score** = weighted sum of normalized metrics.

---

## Phase 5: Present Comparison

Display a side-by-side comparison table:

```markdown
## Competitive Generation Results

| Metric | compete-1 | compete-2 | compete-3 |
|--------|-----------|-----------|-----------|
| Status | PASS | PASS | FAIL |
| Approach | <approach> | <approach> | <approach> |
| Tests | 47/47 | 47/47 | 42/47 |
| Diff (lines) | +32 -8 | +85 -12 | +64 -20 |
| Files changed | 2 | 5 | 4 |
| Lint violations | 0 | 2 | 3 |
| **Score** | **0.92** | **0.54** | DQ |

**Recommendation:** compete-1 (smallest diff, zero lint violations)
```

---

## Phase 6: Select + Merge

### Interactive mode (default)

Use AskUserQuestion:

- **"Merge compete-X (recommended)"** — merge the highest scorer
- **"Merge alternate"** — prompt for which competitor to merge
- **"Review diffs"** — show diffs for each passing competitor, then re-prompt
- **"Cancel"** — discard all worktrees, merge nothing

### Auto mode (`--auto`)

Merge the highest-scoring competitor automatically without prompting.

### Merge

```bash
# Merge winner's branch
git merge compete/<winner-branch> --no-ff -m "feat: competitive generation winner (compete-<ID>)

Spec: <first line of spec>
Approach: <winner's approach summary>
Score: <winner's score>
Competitors: <N> spawned, <passing> passed gates"
```

### Bead integration

If `--bead <id>` was used:
```bash
bd close <id> --reason="Implemented via competitive generation (compete-<ID>, score <score>)"
```

---

## Phase 7: Cleanup

The Agent tool's `isolation: "worktree"` handles automatic worktree cleanup. After merge:

```bash
# Clean up any straggler branches
git branch -d compete-1 compete-2 compete-3 2>/dev/null
```

---

## Quick Reference

```bash
# Basic: 3 competitors, auto-detect gate
/dm-work:compete --spec "Add pagination to /api/users endpoint"

# From a bead
/dm-work:compete --bead whiteout-4eed

# 5 competitors with approach hints
/dm-work:compete --n 5 --approaches "iterator" "cursor" "offset" "keyset" "hybrid" --spec "Add pagination"

# Auto-merge winner, no prompts
/dm-work:compete --auto --spec "Refactor auth middleware to use JWT"

# Custom gate
/dm-work:compete --gate "just ci" --spec "Add rate limiting"
```

## Related

- **dm-work:worktrees** — worktree management that competitors use for isolation
- **dm-work:tdd** — test-driven approach that competitors can follow
- **dm-work:orchestrator** — delegation patterns for managing parallel agents
- `/dm-work:refine` — sharpen vague specs before competing on them

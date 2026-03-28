---
description: Run autonomous review and evaluation after a merge. Surfaces findings as beads for triage in the next session.
argument-hint: "--commits <range>, --min-severity <level>, --skip-eval, --only <acsd>"
---

# Post-Merge Review

Autonomous review after code lands. Findings become beads, surfaced by `bd ready` in the next session. The human triages before work begins — this is the HITL gate between "review identified issues" and "fix issues."

## Arguments

```
$ARGUMENTS
```

| Flag | Description | Default |
|------|-------------|---------|
| `--commits <range>` | Explicit commit range to review | auto-detect merge |
| `--min-severity <level>` | Filter: low\|medium\|high\|critical | `medium` |
| `--skip-eval` | Skip evaluator (review only) | run evaluator |
| `--only <letters>` | Filter reviewers: a=arch, c=code, s=security, d=design | `acs` |

## Workflow

### Step 1: Detect Merge Scope

```bash
# Auto-detect: find the most recent merge commit
MERGE_COMMIT=$(git log --merges -1 --format="%H")
MERGE_BASE=$(git merge-base HEAD~1 HEAD)

# Or use explicit range
# --commits HEAD~5..HEAD
```

If no merge commit found and no `--commits` provided, report "No merge detected" and exit.

### Step 2: Identify Closed Beads

Find beads that were closed as part of this merge:

```bash
# Check recent bead closures
bd list --status=closed | head -20
```

Cross-reference with the merge commit message or branch name to identify which beads were completed. These are the beads whose acceptance criteria will be evaluated.

### Step 3: Run Code Review (Scoped)

Run `/dm-work:review` on the merge diff with narrowed scope:

```
/dm-work:review --commits <merge-range> --min-severity <level> --only <reviewers> --skip-beads --no-interactive --format json
```

**Scoping rules** (don't re-review what was reviewed pre-merge):
- Use `--min-severity medium` by default (skip low-severity noise)
- Focus on net-new concerns: integration issues, merge artifacts, missed conflicts
- If a pre-merge review tag exists for the branch, the review command will auto-detect and focus on changes since the last review

### Step 4: Run Evaluator on Closed Beads

For each closed bead that has acceptance criteria:

1. Check if CDT MCP is connected and app is running
2. If yes: run evaluator with browser-qa against each criterion
3. If no: run code-only evaluation (or skip if all criteria are runtime-dependent)

```
Task(... evaluator prompt from dm-work:evaluator ...
  BEAD: <closed-bead-id>
  ACCEPTANCE CRITERIA: <from bead --design>
  CODE DIFF: <merge diff relevant to this bead>
)
```

**Skip evaluator** if:
- `--skip-eval` flag provided
- No closed beads found with acceptance criteria
- All criteria are UNTESTABLE (no CDT, no code-verifiable criteria)

### Step 5: File Findings as Beads

For review findings and evaluator failures, create beads:

```bash
# Review finding → bug bead
bd create --title="Post-merge: <finding summary>" \
  --description="Found during post-merge review of <merge-commit>. <finding detail>" \
  --type=bug --priority=<from-severity>

# Evaluator failure → task bead
bd create --title="Eval: <criterion text>" \
  --description="Acceptance criterion failed post-merge for <bead-id>. <failure detail>" \
  --type=task --priority=2
bd dep add <new-bead> discovered-from:<original-bead>
```

**Severity → Priority mapping:**
| Review severity | Bead priority |
|----------------|---------------|
| critical | 0 |
| high | 1 |
| medium | 2 |

Use a title prefix ("Post-merge:" or "Eval:") so post-merge findings are recognizable during triage.

### Step 6: Report Summary

```markdown
## Post-Merge Review: <merge-commit-short>

**Merge:** <branch> → <target> (<N> files, <LOC> lines)
**Beads evaluated:** <N> (<N> with acceptance criteria)

### Review Findings
- <N> findings (filtered at <min-severity>+)
- <list key findings by severity>

### Evaluator Results
- <bead-id>: <N>/<total> criteria PASS, <N> FAIL, <N> UNTESTABLE
- <list failures>

### Beads Created
- <bead-id>: <title> (priority <P>)
- ...

### Next Steps
Run `bd ready` to see these findings in your work queue.
```

## Usage

```bash
# After a merge (auto-detect)
/dm-work:post-merge

# With explicit range
/dm-work:post-merge --commits HEAD~3..HEAD

# Review only, no evaluation
/dm-work:post-merge --skip-eval

# Include design review for UI-heavy merge
/dm-work:post-merge --only acsd

# High-severity only (faster, less noise)
/dm-work:post-merge --min-severity high
```

## Integration with Merge Command

The `/dm-work:merge` command can suggest running post-merge after a successful merge:

```
Merge complete. Run `/dm-work:post-merge` to review the merged code?
```

This is advisory, not automatic. The user decides whether to run it.

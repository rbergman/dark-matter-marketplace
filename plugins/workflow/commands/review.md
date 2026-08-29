---
description: Run native /code-review over a scoped range, then convert findings to beads and checkpoint the review tag
argument-hint: "[--pr N] [--commits <range>] [--effort low|medium|high] [--min-severity <level>] [--skip-beads] [--format json] [--output-file <path>]"
---

# /review

Arguments: $ARGUMENTS

Claude Code's native `/code-review` does the reviewing. This command wraps it with the things it doesn't do: **scope resolution from a review tag, beads creation, severity filtering, and a review checkpoint** so the next run starts where this one stopped.

Do not re-implement review logic here. Native `/code-review` finds the bugs.

## Flags

| Flag | Effect | Default |
|------|--------|---------|
| `--pr <N>` | Review a GitHub PR instead of local commits | local mode |
| `--commits <range>` | Explicit git range | resolved from review tag |
| `--effort <level>` | Passed to `/code-review`. `low`/`medium` = fewer, high-confidence findings; `high`+ trades precision for recall | `medium` |
| `--min-severity <level>` | Drop findings below `low\|medium\|high\|critical` | keep all |
| `--skip-beads` | Report only, create nothing | create beads |
| `--format json` | Machine-readable output for callers like `/dm-work:post-merge` | markdown |
| `--output-file <path>` | Write the report to a file instead of inline | inline |

## 1. Resolve scope

Priority order:

1. **`--pr N`** → PR mode; hand the PR number to `/code-review`.
2. **`--commits <range>`** → use it verbatim.
3. **Review tag** → scope is the tag to HEAD:
   ```bash
   BRANCH=$(git branch --show-current)
   TAG="review/${BRANCH}/latest"
   git rev-parse "$TAG" >/dev/null 2>&1 && RANGE="${TAG}..HEAD"
   ```
   If the tag is already at HEAD, report "No changes since last review at `<sha>`" and stop. Reviewing nothing wastes a run.
4. **No tag** → merge-base with the default branch, or `HEAD~5..HEAD` if there's no meaningful base.

Report the resolved scope before reviewing: commits, files, LOC.

## 2. Review

Invoke native `/code-review` against the resolved target at `--effort` (default `medium`). It reports findings with file, line, severity, summary and failure scenario.

For an automated caller, `low` or `medium` is right — `high` and above deliberately surface uncertain findings, which is noise when nothing downstream reads carefully.

### Cross-model leg (recommended, optional)

When the diff is foundational (architecture, security, money, concurrency, a spec later work builds on) or a second opinion is otherwise warranted, add a Codex pass — different weights fail differently, and it runs on a separate quota:

```bash
command -v codex && codex review --uncommitted   # or point it at the resolved range
```

Merge its findings into step 3 like any other finding source. **If `codex` is not installed:** proceed single-model and add one line to the report — "cross-model review unavailable: codex not installed" — never block, never nag beyond that line. Install via the `openai-codex` marketplace; `/codex:setup` configures it.

## 3. Filter

Apply `--min-severity`. Drop any finding with no concrete failure mode regardless of its claimed severity — a finding that can't state what breaks is speculation, and leaving it in the report as a silent caveat is worse than dropping it.

## 4. Act — fix or track, never ignore

LLM execution is cheap. Pre-LLM, "everything → bead → defer" was rational; now it leaves easy wins on the floor. **Every surviving finding gets one of two outcomes in this session: fixed, or tracked.** "Non-blocking" means "not required for this commit to be correct," not "safe to ignore."

Unless `--skip-beads`, file the tracked ones:

```bash
bd create --title="[<severity>] <short description>" --type=bug --priority=<0-2>
```

Severity → priority: critical→P0, high→P1, medium→P2, low→P3.

## 5. Report

Markdown (default):

```markdown
## Review: <scope> (<N> commits, <LOC> across <M> files)

### Verdict: <emoji> <summary>

**Critical** (<count>)
1. `file:line` — <description> → bead <id>

**High** (<count>)
...
```

Verdicts: ✅ PASS · ⚠️ ISSUES FOUND · 🚨 CRITICAL ISSUES

`--format json` emits `{scope, findings: [{file, line, severity, description, bead_id?}], verdict}` — `bead_id` omitted under `--skip-beads`. `--output-file` writes to disk instead of inline; confirm the write and print the path.

## 6. Checkpoint

```bash
git tag -f "review/$(git branch --show-current)/latest" HEAD
```

The next `/review` starts from here. Skip in PR mode.

## Related

- **`/code-review`** (native) — does the actual reviewing; use it directly when you don't need beads or checkpointing
- **`/dm-work:triage`** — the inverse: pulls review comments *from* a PR and turns them into beads
- **`/dm-work:post-merge`** — calls this with `--format json` after a merge
- **dm-work:browser-qa** — runtime verification; complements code-level review

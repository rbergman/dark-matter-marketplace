---
name: output-compression
description: Keep noisy CLI output (build, test, coverage, git) from flooding LLM context. Use when a specific command's output overflows the Bash tool limit, when gate output drowns the signal, or when someone proposes installing a blanket output compressor. Teaches fixing the noisy command at its source instead of installing a compressor or filter hook.
---

# Keeping CLI Output Small

Fix the specific command that is noisy. Don't install a blanket compressor or an output-filter hook.

## Why not a global compressor

Paired benchmarks of RTK, the best-known transparent Bash-output compressor, found no saving in Claude Code:

- **JetBrains** (July 2026; Claude Code 2.1.201, Sonnet 5, 86 SkillsBench tasks, about 425 billed trials): **+7.6% cost** per task at low effort (p=0.004), no difference at high effort. Quality didn't change. Sessions took 13.8% more turns, and every extra turn re-reads the whole history.
- **Quesma** (September 2026; Claude Code 2.1.220, Fable 5.0, Terminal-Bench 2.1, 1,740 attempts): **+1% cost** per task (95% CI −3% to +5%). Cached input was 94% of input tokens but only 30% of the bill.

**Why it doesn't pay:**
- Claude Code's built-in Read, Grep and Glob tools bypass a Bash hook.
- About half of agent shell commands have no filter rule.
- Cached re-reads dominate the bill.

JetBrains worked out the best possible saving before running anything: about 3%. A compressor's own "tokens saved" counter (often bytes ÷ 4) doesn't measure the bill. Hook-based per-project filters such as tokf have the same structural limits and no independent measurement. Don't install either unless new paired measurements say otherwise.

## Fix it at the source

Most floods come from a handful of commands, so fix those directly:

- **Quiet flags and reporters:** `vitest run --reporter=dot`, `cargo test -q`, `git push -q`. Don't use flags that hide warnings a gate depends on.
- **Redirect, then read the tail:** `npm run test:coverage > /tmp/coverage.txt 2>&1 && tail -5 /tmp/coverage.txt || { tail -40 /tmp/coverage.txt; false; }`. A failure still exits non-zero, and the full log stays on disk.
- **Bake it into the recipe.** A `just` gate that prints a short pass summary and the failures only on failure helps every agent and every human. See **just-pro**.

**Related skills:** **just-pro** (quiet gate recipes), **repo-init** (scaffolding).

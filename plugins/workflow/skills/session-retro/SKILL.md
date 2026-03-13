---
name: session-retro
description: Use at end of session before committing, when landing the plane, or
  when user says "retro", "what did we learn", "session review". Lightweight
  self-improvement pass that turns session friction into persistent rules and
  memories. Runs inline — no separate documents, no approval prompts.
---

# Session Retro

Quick end-of-session review that converts friction, mistakes, and discoveries
into durable improvements. This is the self-improvement loop — each session
leaves your setup slightly smarter than before.

The value compounds over weeks. Individual findings are small; the aggregate
effect of catching 2-3 improvements per session across dozens of sessions is
significant.

**Related skills:**
- **orchestrator** — Runs retro as part of session landing
- **repo-health** — Checks that retro is wired into your landing workflow

---

## When to Run

- End of any non-trivial session (before commit/push)
- After a particularly frustrating debugging session
- When the user asks for a retro or review

Skip if the session was trivial (single quick fix, pure Q&A).

---

## Step 1: Scan for Findings

Review the conversation for patterns in these categories:

| Category | What to look for | Example |
|----------|-----------------|---------|
| **Friction** | Repeated manual steps, things user had to ask for that should have been automatic | "User asked me to run tests 3 times — should be in quality gates" |
| **Mistakes** | Things that took multiple attempts, wrong assumptions, wasted effort | "Assumed API was REST, spent 20 min before realizing it's gRPC" |
| **Knowledge** | Facts about the project, tools, or user preferences that weren't documented | "This repo uses bun, not npm — no AGENTS.md mention" |
| **Patterns** | Recurring solutions that could become rules or skills | "Keep having to look up the deploy command — should be in justfile" |
| **Factual learnings** | Library gotchas, API quirks, env-specific behaviors, architectural discoveries — anything a future session would benefit from knowing | "stripe webhook verification requires raw body, not parsed JSON" |

Actively look for factual learnings. These are the most commonly missed category
because they feel obvious in the moment but are invisible to future sessions.
Ask yourself: "What did I learn today that I'd have to rediscover from scratch
next time?" Each one becomes a `bd remember` call.

If the session was routine with nothing notable, say "Nothing to improve from
this session" and stop. Don't manufacture findings.

---

## Step 2: Decide Where Each Finding Goes

Use this decision tree for placement:

```
Is it a permanent project convention?
  └─ Yes → AGENTS.md or .claude/rules/
Is it scoped to specific file types?
  └─ Yes → .claude/rules/ with paths: frontmatter
Is it personal/ephemeral context?
  └─ Yes → CLAUDE.local.md
Everything else (cross-project insights, library gotchas, API quirks,
  env behaviors, tool discoveries, architectural learnings)?
  └─ bd remember "..." (beads memory)
```

`bd remember` is the default catch-all for factual learnings. When in doubt,
remember it — the cost of a redundant memory is near zero, the cost of
rediscovering something from scratch is a chunk of a future session.

Prefer the most specific location for rules. A rule scoped to `tests/**/*.ts`
is better than a general AGENTS.md entry that applies everywhere. But for facts
and discoveries, `bd remember` is almost always the right home.

---

## Step 3: Apply Findings

Auto-apply all findings without asking for per-item approval. The value of
retro comes from low friction — if it requires decisions on each finding,
people skip it.

For each finding:
1. Make the change (edit the rule file, run `bd remember`, update AGENTS.md)
2. Record what you did

If a finding requires a code change or new skill (not just a rule/memory),
file a bead instead of implementing it now: `bd create --title="..." --type=task`

---

## Step 4: Report

Present a compact summary:

```
## Session Retro

Applied:
1. [rules/testing.md] Added: always run `just check` before pushing (friction — asked 3x)
2. [AGENTS.md] Added bun as package manager (knowledge — defaulted to npm twice)

Remembered:
3. [bd remember] "This repo's API uses gRPC, not REST — don't assume HTTP/JSON"
4. [bd remember] "stripe webhook handler needs raw body; express.json() middleware breaks signature verification"
5. [bd remember] "context7 coverage for library X is poor — check official docs directly"

Filed:
6. [beads-xxx] Add post-deploy health check to justfile (pattern — too big for retro)

Nothing actionable:
7. Debugging the auth flow was slow, but root cause was external API outage — no rule would help
```

Keep it concise. The report is for awareness, not discussion. Move on to the
rest of the landing sequence.

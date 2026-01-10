# Claude Code Workflow Guide

A practical guide for humans working with Claude Code. This documents my personal development loop — how I structure sessions, manage context, and get reliable results.

---

## Prerequisites

### Disable Auto-Compaction

In Claude Code settings, disable automatic compaction. This gives you control over when and how context is managed. Without this, Claude will compact automatically and you lose the ability to use the precompact workflow.

### Install Beads

[Beads](https://github.com/steveyegge/beads) provides external state that survives session boundaries. It's optional but highly recommended — it enables reliable handoffs between sessions.

```bash
# Install beads
cargo install beads

# Initialize in your project
bd init
```

### MCPs: Stay Lean

I keep MCP usage minimal to preserve context. My always-on MCPs:

| MCP | Purpose |
|-----|---------|
| **Context7** | Up-to-date library documentation. Invaluable when working with frameworks — Claude queries current docs instead of relying on training data that may be outdated. |
| **Bright Data** | Web scraping and search. Unlocks any webpage even with bot detection/CAPTCHA. Useful for research, fetching current information, and accessing paywalled docs. |

**On-demand MCPs:**

| MCP | Purpose | Why not always-on |
|-----|---------|-------------------|
| **Chrome DevTools** | Browser automation, debugging, DOM inspection | Heavy context usage — enable only when actively debugging frontend issues |

There's currently no way to enable an MCP only for a subagent or skill, so context-heavy MCPs need manual enable/disable.

---

## The Development Loop

### Phase 1: Convergence

Start with an idea, spec, or task. Talk with Claude until you're aligned on what to build.

1. **Discuss until clear** — Don't rush to implementation. Make sure you and Claude agree on the goal.
2. **Point to skills** — If the work involves specific domains (TypeScript, game design, etc.), tell Claude to activate relevant skills.
3. **Refine if needed** — For complex or ambiguous specs, use `/dm:breakdown` or `/dm:refine` to sharpen the requirements.

### Phase 2: Task Breakdown

Convert the spec into trackable work items.

1. **Create beads** — Break work into atomic tasks. Each bead should be completable by a single subagent.
2. **Set dependencies** — If bead B requires bead A, mark it. Beads handles this with `blocked_by`.
3. **Identify parallelism** — Independent beads can be worked concurrently.

### Phase 3: Execution

Let Claude orchestrate while subagents implement.

1. **Use `/subagents`** — This handles multiple beads with dependency awareness. It degrades to single-subagent mode when appropriate.
2. **Review results** — Check what subagents produced before committing.
3. **Commit incrementally** — One commit per completed unit. Don't batch.

---

## Context Management

Context is your most valuable resource. Protect it.

### The 80k Rule

When context reaches **80-150k tokens** (out of ~200k limit), start looking for a pause point. Don't wait until you're nearly out.

Good pause points:
- Bead completed
- Phase transition (convergence → breakdown, breakdown → execution)
- Natural stopping point in discussion

### The Precompact Workflow

When you're ready to pause:

```
1. Run /dm:precompact
2. Copy the output
3. Run /clear
4. Paste the precompaction as your first message
5. Add any additional context about next steps
6. Continue with fresh context
```

`/dm:precompact` produces an explicit summary: work completed, roadmap, next steps, where to find bead state. This is more reliable than depending on built-in compaction.

### Emergency Recovery

If you run out of context before you can precompact:

1. **If `/compact` still works:** Run it, then run `/dm:precompact` — it usually still works. Then `/clear` and paste to recover.

2. **If you can't even `/compact`:** Start fresh. Read bead state with `bd ready` and `bd show` to recover context. This is rare if you follow the 80k rule.

### The Cardinal Rule

**Never let a session exceed one built-in compaction.**

Multiple compactions compound information loss. Each is lossy; stacking them degrades quality fast. The precompact workflow ensures you never need more than one.

---

## Why This Works

| Problem | Solution |
|---------|----------|
| Context exhaustion mid-task | Proactive precompact at 80k |
| Lost context after compaction | Explicit summaries you control |
| Claude doing implementation directly | Subagent delegation |
| Unclear next steps after pause | Beads track state externally |
| Compaction information loss | Never exceed 1 compaction |

The key insight: **external state (beads) + explicit summaries (precompact) + delegation (subagents) = sessions that pause and resume reliably.**

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| New idea or vague spec | Conversation to convergence |
| Low confidence in spec | `/dm:breakdown` or `/dm:refine` |
| Ready to implement | Create beads, then `/subagents` |
| Context at 80-150k | Start looking for pause point |
| Ready to pause | `/dm:precompact` → copy → `/clear` → paste |
| Context critical | Emergency: compact then precompact |
| Task complete | Review, commit, close bead |
| Starting new session | Paste last precompact + `bd ready` |

---

## Related

- **`orchestrator` skill** — Claude's instructions for being an orchestrator
- **`subagent` skill** — Claude's instructions for being a subagent
- **`CLAUDE.md`** — Minimal global instructions pointing to these skills

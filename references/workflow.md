# Claude Code Workflow Guide

A practical workflow for maintaining productive, context-aware sessions with Claude Code.

---

## Core Philosophy

**Grow complexity from a simple system that already works.**

- Prefer minimal working slices over grand designs
- Avoid speculative architecture and premature abstraction
- Make only small, verifiable changes
- Begin → Learn → Succeed → *then* add complexity

---

## The Orchestrator Model

You are the strategist. Claude is the orchestrator. Subagents are implementers.

**Orchestrator responsibilities:**
- Understand tasks and break them into delegatable units
- Launch subagents with clear prompts, skills, and tool awareness
- Review subagent output and commit when satisfied
- Track big-picture progress across beads/issues
- *Preserve context for orchestration, not implementation*

**Delegation threshold:** If a task involves more than 2 file edits, more than 30 lines of new code, or creating new modules — delegate to a subagent.

**What orchestrators do directly:**
- Read files to understand scope
- Use Explore agent for codebase research
- Claim/update/close beads
- Review and commit subagent work
- Ask clarifying questions

**What orchestrators delegate:**
- Writing new code/tests
- Editing existing code
- Implementing features/fixes
- Debugging complex issues

---

## The Development Loop

### Phase 1: Convergence

Start with an idea, spec, or well-defined task. Iterate with the agent until you have clarity.

1. **Conversation to convergence** — Discuss the idea or spec until aligned
2. **Activate skills** — Instruct the agent to use specific skills if appropriate (e.g., `typescript-pro`, `game-design`, `solid-architecture`)
3. **Dialectical refinement** (optional) — Use `/dm:breakdown` or `/dm:refine` if confidence in the spec is low

### Phase 2: Task Breakdown

Convert the converged spec into trackable work items.

1. **Create beads** — Use bead epics or tasks depending on scope
2. **Verify dependencies** — Ensure beads are ordered correctly
3. **Identify parallelism** — Mark beads that can be worked concurrently

### Phase 3: Execution

Delegate implementation to subagents to preserve orchestrator context.

1. **Launch subagents** — Use `/dm:subagents` (preferred) or `/dm:subagent`
   - `/dm:subagents` handles multiple beads with dependency awareness
   - It degrades gracefully to single-subagent mode when appropriate
2. **Review results** — Verify subagent work before committing
3. **Commit incrementally** — Don't batch; commit after each completed unit

---

## Context Preservation

Context is your most valuable resource. Protect it aggressively.

### One-Time Setup

**Disable auto-compaction in Claude settings.** This gives you control over when and how context is managed.

### The 80k Rule

When context reaches 80-150k tokens (out of ~200k limit), start looking for a natural pause point.

### Precompact Before Crisis

**Target:** Run `/dm:precompact` before reaching 10% remaining context.
**Acceptable:** As late as 50% remaining, but don't push it.

`/dm:precompact` is a lightweight alternative to `/compact` that:
- Explicitly summarizes work completed
- Documents the roadmap and next steps
- Points to beads for task tracking
- Produces portable output you control

### The Precompact Workflow

```
1. Recognize context is growing (80-100k+)
2. Find a natural pause point (bead complete, phase transition)
3. Run /dm:precompact
4. Copy the output
5. Run /clear
6. Paste the precompaction
7. Add any additional context on next steps
8. Continue with fresh context
```

### Emergency Recovery

If context runs out before you can precompact:

1. **If you can still `/compact`:** Do so, then run `/dm:precompact` afterward — it usually still works. Then `/clear` and paste to recover.

2. **If you can't even `/compact`:** Take desperate measures (manual session notes, start fresh with bead state). This is rare if you follow the 80% rule.

### The Cardinal Rule

**Never let a session exceed 1 built-in compaction.**

Multiple compactions compound information loss. Each compaction is lossy; stacking them is the highway to hell. The precompact workflow ensures you never need more than one.

---

## Why This Works

| Problem | Solution |
|---------|----------|
| Context exhaustion mid-task | Proactive precompact at 80k |
| Lost context after compaction | Explicit summaries you control |
| Orchestrator doing implementation | Subagent delegation |
| Unclear next steps after pause | Beads track state externally |
| Compaction information loss | Never exceed 1 compaction |

The key insight: **external state (beads) + explicit summaries (precompact) + delegation (subagents) = sessions that can pause and resume reliably.**

---

## Quick Reference

| Trigger | Action |
|---------|--------|
| New idea or vague spec | Conversation to convergence |
| Low confidence in spec | `/dm:breakdown` or `/dm:refine` |
| Ready to implement | Create beads, then `/dm:subagents` |
| Context at 80-150k | Start looking for pause point |
| Natural pause point | `/dm:precompact` → copy → `/clear` → paste |
| Context critical (<10%) | Emergency precompact or compact+precompact |
| Task complete | Review, commit, close bead |

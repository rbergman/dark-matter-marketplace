# Claude Code Workflow Guide

A practical guide for humans working with Claude Code. This documents my personal development loop — how I structure sessions, manage context, and get reliable results.

---

## Prerequisites

### Enable Context in Status Line

In Claude Code settings, enable showing context usage in the status line. This makes it easy to see when you're approaching the 80k threshold without having to ask Claude or run commands.

### Install Beads

[Beads](https://github.com/gastownhall/beads) provides external state that survives session boundaries. It's optional but highly recommended — it enables reliable handoffs between sessions.

Beads 0.58+ requires **Dolt** as its storage backend:

```bash
# Install dolt (prerequisite)
brew install dolt

# Install beads (pick one)
brew install beads
# or: curl -fsSL https://raw.githubusercontent.com/gastownhall/beads/main/scripts/install.sh | bash
# or: npm install -g @beads/bd
# or: go install github.com/steveyegge/beads/cmd/bd@latest   # module path stayed at steveyegge after the org move

# Verify both
dolt version
bd --version   # should be 0.58+

# Initialize in your project
bd init

# Tell your agent
echo "Use 'bd' for task tracking" >> AGENTS.md

# Symlink so Claude Code picks it up too
ln -s AGENTS.md CLAUDE.md
```

### MCPs: Stay Lean

I keep MCP usage minimal to preserve context. My always-on MCPs:

| MCP | Purpose |
|-----|---------|
| **Context7** | Up-to-date library documentation. Invaluable when working with frameworks — Claude queries current docs instead of relying on training data that may be outdated. |

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
3. **Sharpen if needed** — For complex or ambiguous specs, use `/dm-work:breakdown` to decompose into beads, and run a generic subagent review to surface gaps before committing to an approach.

### Phase 2: Task Breakdown

Convert the spec into trackable work items.

1. **Create beads** — Break work into atomic tasks. Each bead should be completable by a single subagent.
2. **Set dependencies** — If bead B requires bead A, mark it. Beads handles this with `blocked_by`.
3. **Identify parallelism** — Independent beads can be worked concurrently.

### Phase 3: Execution

Let Claude orchestrate while subagents implement.

1. **Use `/subagents`** — This handles multiple beads with dependency awareness. It degrades to single-subagent mode when appropriate.
2. **Review results** — Check what subagents produced before committing.
3. **Commit incrementally** — One logical change per commit, Conventional Commits format (`type(scope): subject`), reference beads in the body. Roughly one bead = one commit for XS/S; M+ may produce a few related commits. Quality gates run via pre-commit hooks where installed; otherwise run `just check` before committing.
4. **Pause after each M+ feature lands** — Run `/dm-work:review` (or a scope-bound subagent review of the diff, optionally with a Codex second opinion) before starting the next M+ chunk. Catches drift before it compounds.
5. **For worktree work** — Use `/merge` when ready to integrate. It enforces a pre-flight checklist (quality gates, review, beads closed).

### Agent Teams Alternative (Experimental)

For complex work requiring inter-agent coordination — collaborative review, adversarial refinement, multi-perspective analysis — consider [Agent Teams](https://code.claude.com/docs/en/agent-teams) instead of subagents.

Agent Teams spawns persistent teammates (each a full Claude Code session) that message each other directly, self-claim tasks from a shared list, and collaborate. Unlike `Task()` subagents which report back to the orchestrator only, teammates can discuss, challenge, and coordinate autonomously.

**Enable it:**
```json
// ~/.claude/settings.json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

**dm-team commands:**

1. **Activate `dm-team:lead`** — instead of `dm-work:orchestrator`
2. **Use `/dm-team:review`** — reviewers discuss and challenge findings
3. **Use `/dm-team:council`** — multi-perspective deliberation on decisions

See the "Teams vs Subagents vs Direct" table inside `dm-team:lead` for the decision framework. Agent Teams uses significantly more tokens than subagents — each teammate is a separate Claude instance.

**Review commands:** Both `/dm-work:review` (isolated parallel subagents) and `/dm-team:review` (team with cross-examination) exist. Use dm-work for routine reviews; use dm-team when cross-examination adds value (large features, risky changes). Same flags and output format. See `multi-agent-coordination.md` for the full comparison.

---

## Context Management

Context is your most valuable resource. Protect it.

### The 80k Rule

When context reaches **80-150k tokens** (out of ~200k limit), start looking for a pause point. Don't wait until you're nearly out.

Good pause points:
- Bead completed
- Phase transition (convergence → breakdown, breakdown → execution)
- Natural stopping point in discussion

### Session Pause and Recovery

Claude Code now has native checkpointing. When you're ready to pause or branch:

- `/rewind` — open the rewind menu to restore conversation, code, or both to a prior checkpoint, or summarize from a chosen message
- `/clear` — reset context between unrelated tasks
- `/compact <focus>` — focused compaction when you want to continue the same task with less history

Beads carries persistent state across sessions, so a clean `bd close` + commit + `git push` is usually sufficient to walk away. On resume, `bd ready` and `bd show <id>` recover the relevant context.

### Compaction

Compaction summarizes the conversation so older detail can be dropped. Prefer `/clear` between unrelated tasks; reach for `/compact <focus>` only when you need to continue the same thread with less history.

**Avoid multiple compactions.** Each is lossy; stacking them degrades quality fast. If a session has already compacted once and context is climbing again, rotate immediately rather than risking a second compaction.

---

## Why This Works

| Problem | Solution |
|---------|----------|
| Context exhaustion mid-task | Proactive rotation at 80k |
| Lost context after compaction | Explicit summaries you control |
| Claude doing implementation directly | Subagent delegation |
| Unclear next steps after pause | Beads track state externally |
| Compaction information loss | Rotate before compaction; one compaction OK if needed |
| Multiple perspectives needed | Agent Teams with dm-team skills |

The key insight: **external state (beads) + explicit summaries (rotation) + delegation (subagents) = sessions that pause and resume reliably.**

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| New idea or vague spec | Conversation to convergence |
| Low confidence in spec | `/dm-work:breakdown` plus a generic subagent review pass |
| Ready to implement | Create beads, then `/subagents` |
| Context at 80-150k | Start looking for pause point |
| Ready to pause | Native `/rewind` for branching, or `/clear` between tasks |
| Context critical | Native `/compact <focus>` |
| Worktree ready to merge | `/dm-work:merge` — pre-flight checklist |
| Task complete | Review, commit, close bead |
| Starting new session | `bd ready` for available work |
| Interactive sandboxing | Run `/sandbox` to enable native sandbox |
| Complex multi-agent work | Activate `dm-team:lead`, use Agent Teams |
| Decision needs debate | `/dm-team:council` |
| Spec sharpening | Generic subagent review pass + Codex second-opinion as needed |

---

## Quality Enforcement Hooks

The dm-work plugin includes two Claude Code hooks that enforce quality automatically:

| Hook | Event | What it does |
|------|-------|--------------|
| **flag-config-edit** | PostToolUse (Edit/Write) | Flags edits to settings.json, .claude files, and other config |
| **run-gates-on-stop** | Stop | Auto-detects project type and runs quality gates before session ends |

The Stop hook is smart about when to run:
- Skips if no source code changes (docs-only or clean tree)
- Auto-detects `just check`, `npm run check`, `cargo test`, or `go test`
- Captures output to temp file — only shows last 50 lines on failure (prevents context overflow)
- Blocks the stop (exit 2) if gates fail, allowing you to fix before ending

These hooks are installed automatically with dm-work. No configuration needed.

---

## Sandboxing Claude

Claude Code has built-in sandboxing for safer execution. Choose the right approach based on your use case.

### Interactive: `/sandbox`

For human-in-the-loop sessions, use Claude Code's native sandbox:

```
/sandbox
```

This opens a menu to enable sandboxing. Once enabled:
- **Filesystem**: Write access limited to current working directory
- **Network**: Domain allowlist with prompts for new domains
- **Prompts**: Auto-allow mode reduces permission prompts by 84%

**What `/sandbox` protects against:**
- Accidental writes outside your project
- Unauthorized network access
- Prompt injection attacks that try to exfiltrate data

**Limitations:**
- No CLI flag (only available interactively or via Docker)
- Has escape hatch — commands can use `dangerouslyDisableSandbox` to break out
- Global config (`settings.json`), not per-project

### CLI/Autonomous

For unattended execution use Claude Code's headless `claude -p` with `--permission-mode auto`. Auto mode runs a classifier in front of every action, blocking scope escalation and unknown-infrastructure operations while letting routine work proceed without prompts. For non-interactive runs auto mode aborts after repeated blocks rather than prompting, which matches CI semantics. Combine with `--allowedTools` to scope a batch run.

---

## Related

- **`/sandbox`** — Claude Code's built-in sandbox for interactive sessions
- **Auto mode** (`--permission-mode auto`) — classifier-gated autonomous execution
- **`dm-work:orchestrator` skill** — Claude's instructions for being an orchestrator
- **`dm-work:subagent` skill** — Claude's instructions for being a subagent
- **`CLAUDE.md`** — Minimal global instructions pointing to these skills
- **`dm-team:lead` skill** — Claude's instructions for being an Agent Teams lead

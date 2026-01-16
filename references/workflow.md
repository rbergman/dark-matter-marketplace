# Claude Code Workflow Guide

A practical guide for humans working with Claude Code. This documents my personal development loop — how I structure sessions, manage context, and get reliable results.

---

## Prerequisites

### Disable Auto-Compaction

In Claude Code settings, disable automatic compaction. This gives you control over when and how context is managed. Auto-compaction doesn't prevent checkpointing, but it complicates things from a transparency perspective and encourages lossier sessions overall.

### Enable Context in Status Line

In Claude Code settings, enable showing context usage in the status line. This makes it easy to see when you're approaching the 80k threshold without having to ask Claude or run commands.

### Install Beads

[Beads](https://github.com/steveyegge/beads) provides external state that survives session boundaries. It's optional but highly recommended — it enables reliable handoffs between sessions.

```bash
# Install beads (pick one)
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
# or: npm install -g @beads/bd
# or: brew install steveyegge/beads/bd
# or: go install github.com/steveyegge/beads/cmd/bd@latest

# Initialize in your project
bd init
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
3. **Refine if needed** — For complex or ambiguous specs, use `/dm-work:breakdown` or `/dm-work:refine` to sharpen the requirements.

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

### The Snapshot Workflow

When you're ready to pause:

```
1. Run /dm-work:snapshot
2. Copy the output
3. Run /clear
4. Paste the snapshot as your first message
5. Add any additional context about next steps
6. Continue with fresh context
```

`/dm-work:snapshot` produces an explicit summary: work completed, roadmap, next steps, where to find bead state. This is more reliable than depending on built-in compaction. You can also use it post-`/compact` to recover a clean view of the session from the obscured internals.

### Emergency Recovery

If you run out of context before you can take a snapshot:

1. **If `/compact` still works:** Run it, then run `/dm-work:snapshot` — it usually still works. Then `/clear` and paste to recover.

2. **If you can't even `/compact`:** Start fresh. Read bead state with `bd ready` and `bd show` to recover context. This is rare if you follow the 80k rule.

### The Cardinal Rule

**Never let a session exceed one built-in compaction.**

Multiple compactions compound information loss. Each is lossy; stacking them degrades quality fast. The snapshot workflow ensures you never need more than one.

---

## Why This Works

| Problem | Solution |
|---------|----------|
| Context exhaustion mid-task | Proactive snapshot at 80k |
| Lost context after compaction | Explicit summaries you control |
| Claude doing implementation directly | Subagent delegation |
| Unclear next steps after pause | Beads track state externally |
| Compaction information loss | Never exceed 1 compaction |

The key insight: **external state (beads) + explicit summaries (snapshot) + delegation (subagents) = sessions that pause and resume reliably.**

---

## Quick Reference

| Situation | Action |
|-----------|--------|
| New idea or vague spec | Conversation to convergence |
| Low confidence in spec | `/dm-work:breakdown` or `/dm-work:refine` |
| Ready to implement | Create beads, then `/subagents` |
| Context at 80-150k | Start looking for pause point |
| Ready to pause | `/dm-work:snapshot` → copy → `/clear` → paste |
| Context critical | Emergency: compact then snapshot |
| Task complete | Review, commit, close bead |
| Starting new session | Paste last snapshot + `bd ready` |
| Interactive sandboxing | Run `/sandbox` to enable native sandbox |
| CLI/autonomous runs | Configure `.srt.json`, run with srt |

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

### CLI/Autonomous: srt

For unattended execution — CI/CD, batch processing, or `-p` prompts — use [srt](https://github.com/anthropic-experimental/sandbox-runtime):

| Feature | `/sandbox` | srt |
|---------|------------|-----|
| Mode | Interactive only | CLI/autonomous |
| Escape hatch | Yes | No (stricter) |
| Config | Global settings.json | Per-project .srt.json |
| Install | Built-in | `npm install -g @anthropic-ai/sandbox-runtime` |

Both use the same OS primitives (macOS seatbelt, Linux bubblewrap), so security guarantees are equivalent when escape hatch isn't used.

---

## Autonomous Runs with srt

For unattended execution — CI/CD, batch processing, or DX testing — use srt to run Claude with `--dangerously-skip-permissions` safely.

### When to Use Autonomous Mode

| Scenario | Why autonomous |
|----------|----------------|
| CI/CD code review | No human to click "allow" |
| Batch repo updates | Process N repos without N interactions |
| DX stress testing | Test skills in isolated `/tmp` environments |
| Long-running tasks | Let Claude work overnight unattended |

### Quick Setup

```bash
# Install srt
npm install -g @anthropic-ai/sandbox-runtime

# Create project config
cat > .srt.json << 'EOF'
{
  "network": {
    "allowedDomains": ["api.anthropic.com", "github.com", "*.github.com"]
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.gnupg", "~/.aws/credentials"],
    "allowWrite": [".", "/tmp"]
  }
}
EOF

# Run sandboxed
srt -s .srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "Build and test the project"'
```

### Combining with the Workflow

Autonomous runs complement the interactive workflow:

1. **Interactive**: Convergence, spec refinement, architecture decisions
2. **Autonomous**: Execution of well-defined tasks via srt
3. **Interactive**: Review results, commit, close beads

For complex tasks, you might alternate — converge interactively, let Claude execute autonomously, review and refine interactively.

See **autonomous-runs.md** for full configuration and the **`dm-work:srt` skill** for ecosystem-specific allowlists.

---

## Related

- **`/sandbox`** — Claude Code's built-in sandbox for interactive sessions
- **`dm-work:orchestrator` skill** — Claude's instructions for being an orchestrator
- **`dm-work:subagent` skill** — Claude's instructions for being a subagent
- **`dm-work:srt` skill** — Sandbox Runtime configuration for CLI/autonomous runs
- **`CLAUDE.md`** — Minimal global instructions pointing to these skills
- **`autonomous-runs.md`** — Full guide to sandboxed autonomous Claude

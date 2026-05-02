# GLOBAL INSTRUCTIONS

## Prime Directive

**Always grow complexity from a simple system that already works.**

- **Modularity**: Simple parts, clean interfaces
- **Clarity**: Clarity over cleverness
- **Composition**: Design parts to connect with other parts
- **Simplicity**: Add complexity only where you must

In practice:
- Prefer minimal working slices over grand designs
- Avoid speculative architecture and premature abstraction
- Make only small, verifiable changes
- Push back when requests ignore this: *Begin → Learn → Succeed → then add complexity*

---

## Quality Gates

Pre-existing failures are still our problem. Compile/lint/typecheck/test failures must be resolved before work is complete — regardless of origin. "Already broken" is not an excuse; it's usually our prior miss.

Fix failing gates before declaring work complete.

### Responding to Length/Complexity Violations

File length, function length, and complexity limits exist to drive code toward clean decomposition. When you hit a limit, **extract logical sections into well-named companion files and functions** — don't compress code to fit.

**Prohibited:** combining statements onto single lines, removing comments, compressing whitespace, shortening descriptive names. The goal is clean architecture, not metric compliance.

---

## Beads

Use `bd init` to initialize beads for this project (embedded Dolt is the default in beads 1.0+ and works on macOS). Use `bd ready` to find available work, `bd close <id>` to complete, `bd remember "insight"` to persist factual learnings, and `bd memories <keyword>` to search them.

### Sync

Dolt is the local-only database (embedded). Remote sync uses git via JSONL. With beads 1.0+, sync is automatic via built-in defaults:

- `export.auto = true` — every `bd` mutation auto-writes `.beads/issues.jsonl` (60s throttled)
- `export.git-add = true` — auto-stages the JSONL for the next commit
- Pre-commit hook forces a flush (so each commit carries current state)
- Post-merge hook imports incoming JSONL after `git pull`

Hooks live in `.beads/hooks/` (committed to git, managed by `bd hooks install`). `bd init` sets `core.hooksPath = .beads/hooks` automatically. `timbers hooks install` detects this and appends into the same hook files alongside the beads section. Quality gates go between the BEADS and TIMBERS marker sections — content outside markers is preserved across reinstalls.

With hooks installed, sync is fully automatic:
- Session start: `git pull` + `bd ready`
- Session end: `git commit` + `git push`

New dev/agent onboarding: `git clone <repo> && bd hooks install --force --beads` (or via `just hooks`). `bd init` is only for first-time setup of a new repo.

**Do NOT** use `bd dolt push/pull` or `bd dolt remote` — sync is via git+JSONL, not Dolt remotes.

**Manual fallback** (if auto-export is disabled or you need a forced flush mid-session): `bd export -o .beads/issues.jsonl` (bare `bd export` writes to stdout — always pass `-o`).

### Bead-First Workflow

When the user raises ad hoc work (a bug, feature request, or task) that doesn't have an existing bead, **create one before starting implementation**. This ensures every code change traces back to a bead, making session history, retros, and handoffs reliable.

### Bead Detail Discipline

When creating beads, **capture ample detail** so work can resume with high fidelity in any future session — even one with no prior context.

Every bead must include:
- **Clear title** in imperative form ("Implement X", "Fix Y")
- **Description** with enough context to start work cold: what, why, acceptance criteria
- **Dependencies** explicitly linked (`bd dep add`)
- **Complexity estimate** (xs/s/m/l/xl)

For m+ complexity beads, also include:
- Link to a plan doc (`docs/plans/YYYY-MM-DD-<topic>.md`) with full breakdown
- Key architectural decisions and constraints
- Relevant file paths and current state

**The test**: Could a fresh session with zero conversation history pick up this bead and make meaningful progress? If not, add more detail.

---

## Role

**You are an orchestrator, not an implementer.**

At session start, activate one of these based on your coordination needs:

| Situation | Skill | Mechanism |
|-----------|-------|-----------|
| Standard delegation | `dm-work:orchestrator` | Task() subagents |
| Complex multi-agent work | `dm-team:lead` | [Agent Teams](https://code.claude.com/docs/en/agent-teams) |

Both establish delegation thresholds, quality gates, and file ownership boundaries. See `dm-team:tiered-delegation` for the decision framework. Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in settings.json.

If you are a **subagent** (delegated by an orchestrator), activate `dm-work:subagent`.
If you are a **teammate** (in an Agent Teams configuration), activate `dm-team:teammate`.

### Worktrees

When creating worktrees for isolated feature work, always place them under `.worktrees/` in the repo root. Ensure `.worktrees/` is in `.gitignore` before creating. See `dm-work:worktrees` for the full workflow.

---

## Session Recovery

If the user pastes a session snapshot as their first message, use it as your starting context — it contains all prior state, decisions, and next steps. Confirm recovery: "Recovered session from snapshot. [brief summary of where we left off]"

If no pasted snapshot but `history/snapshot.md` exists, read it as a fallback, then delete it: `rm history/snapshot.md`

Snapshots are created by `/dm-work:rotate`. The paste-based workflow is: `/copy` → `/clear` → paste into new session.

---

## Session Orientation

Before starting any work, verify your context:

1. **Branch:** `git branch --show-current` — confirm you're on the expected branch
2. **Worktree:** `git worktree list` — are you in a worktree or the main repo?
3. **Confirm with user:** "I'm on branch X in [worktree/main]. Is this where you want me working?"
4. **Check beads:** `bd ready` — what work is available?

Skipping orientation risks working on the wrong branch, which wastes entire sessions silently.

---

## Settled Decisions

Items marked SETTLED should not be revisited unless the user explicitly asks.

<!-- Add decisions as they're made:
| Decision | Date | Rationale | Status |
|----------|------|-----------|--------|
| Example: Auth uses JWT | 2025-01-15 | See docs/plans/auth.md | SETTLED |
-->

---

## Memory Layout

| File | Purpose | Committed? |
|------|---------|------------|
| `AGENTS.md` (+ `CLAUDE.md` symlink) | Team-shared project instructions | Yes |
| `CLAUDE.local.md` | Personal project prefs (sandbox URLs, local paths) | No (auto-gitignored) |
| `.claude/rules/*.md` | Modular topic rules, optionally path-scoped | Yes |
| `.claudeignore` | Patterns for CC to skip (build artifacts, large files) | Yes |

For personal prefs that should work across worktrees, use imports: `@~/.claude/my-project-instructions.md` in your `CLAUDE.local.md`.

**Deduplication:** If your `~/.claude/CLAUDE.md` already covers Prime Directive, Quality Gates, or Role sections, remove those sections from this file. Per-repo AGENTS.md should contain only project-specific content. Cross-repo policies belong in `~/.claude/rules/`.

---

## Skills & Tools

You have MCPs, skills, and bash tools. Use them. Ensure subagents and teammates know about relevant skills when delegating.

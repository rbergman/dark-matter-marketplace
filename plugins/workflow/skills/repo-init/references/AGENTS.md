# PROJECT INSTRUCTIONS

## Prime Directive — Gall's Law

> *"A complex system that works is invariably found to have evolved from a simple system that worked. A complex system designed from scratch never works and cannot be patched up to make it work. You have to start over with a working simple system."* — John Gall

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

This applies to features, refactors, infrastructure, and the codebase as a whole. When tempted to design a "proper" version up front, build the smallest working slice first and let it grow.

---

## Software Engineering Practices

### Commit hygiene and cadence

- **One logical change per commit.** A commit should compile, pass gates, and be revertable in isolation. If the diff spans unrelated concerns, split it.
- **Right-sized commits.** Roughly one bead = one commit for XS/S work; M+ work may produce a few related commits. Don't batch hours of work into one mega-commit; don't fragment a single coherent change across five.
- **Conventional Commits.** Use `type(scope): subject` — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`, `build:`, `ci:`. Imperative subject, ≤72 chars. Body explains *why* when the diff doesn't make it obvious.
- **Reference beads in the body**, not the subject (`Closes bd-abc-123` / `Refs bd-abc-124`).

### Quality gates per commit

If pre-commit hooks already run lint/typecheck/test, trust them and don't re-run manually. If hooks are missing, partial, or skipped (e.g. WIP commits behind a flag), run `just check` (or the project's equivalent) yourself before committing. **Pre-existing failures are still our problem** — "already broken" is not an excuse, and is usually our prior miss.

When file/function/complexity limits trigger, **extract logical sections into well-named companion files** rather than compressing code to fit. Don't combine statements onto one line, strip comments, or shorten names to satisfy a metric.

### just as the primary DX interface

`just` is the canonical command runner for both humans and agents in this repo. Treat the justfile as the contract:

- All common workflows belong as `just` recipes — `just check`, `just build`, `just test`, `just fmt`, `just lint`, `just hooks`, project-specific tasks
- New repeatable commands → add a recipe rather than documenting raw shell
- Keep recipes short and self-explanatory; agents will read them
- When a recipe changes, the change is the documentation

If a workflow only exists as a shell snippet in a doc, it's not really a workflow yet — promote it to `just`.

### Output compression: rtk and tokf

When available, use `rtk` (Rust Token Killer) and `tokf` (per-project filter) to compress noisy command output before it reaches the agent's context. Both are transparent: agents call commands normally and the wrappers handle compression.

- **rtk** is the global baseline (npm/git/build output → 60-90% token reduction)
- **tokf** is per-project for repo-specific noise patterns
- Available? Use them. Not installed? Don't block on it; the work still proceeds.

See `dm-work:output-compression` for setup.

### Pause-for-review cadence

After every **M or larger** feature lands (M+ bead closed, code merged), pause and run a review pass before starting the next M+ chunk. Either:

- `/dm-work:review` for parallel arch/code/security reviewers, or
- A generic subagent review of the recent diff with explicit scope ("read ONLY the diff and the OWN files"), plus an optional Codex second-opinion via the codex plugin for cross-model coverage

The goal is to catch drift, accumulated debt, and integration gaps before they compound. XS/S work doesn't need this; M+ does.

---

## Beads & Timbers

This repo uses **beads** (`bd`) for task tracking and **timbers** for commit-reasoning logs. Both tools inject their own usage instructions during init:

- `bd init` runs `bd setup claude` which adds a beads usage section to your steering files and configures `.claude/settings.json`
- `timbers init --git-hooks` installs hooks; `timbers onboard --target agents >> AGENTS.md` appends usage guidance

**Follow the instructions those tools inject** — they own their respective domains. Don't duplicate that content here; let `bd setup claude` and `timbers onboard` be the source of truth so they stay current as the tools evolve.

**Fresh clone onboarding.** A new clone of this repo has `.beads/issues.jsonl` committed but no local database (the embedded Dolt directory is gitignored, so it doesn't travel through git). Running `bd ready` on a first clone will fail with "no beads database found". The fix is one command:

```bash
bd bootstrap                          # auto-detects .beads/issues.jsonl, recreates the embedded DB
bd config set beads.role maintainer   # or "contributor" if you're an outside contributor who shouldn't commit beads changes
```

`bd bootstrap` is non-destructive and the right tool here — `bd init` would mint a new identity, and `bd import` requires the DB to already exist. Set the role once after bootstrap to silence the role-config warning permanently.

Repo-wide conventions worth stating once (not covered by injections):

- **Bead-first workflow:** when ad hoc work appears (bug, feature, task) without an existing bead, create one before implementing. Every code change should trace back to a bead.
- **Bead detail discipline:** every bead has an imperative title, a description that lets a cold session start work, explicit dependencies, and a complexity estimate (xs/s/m/l/xl). M+ beads link to a plan doc and call out architectural decisions.
- **Sync model:** beads supports two sync configurations on the same set of commands. The defaults in 1.0+ use embedded Dolt + git+JSONL transport — `.beads/issues.jsonl` is the source of truth (committed); `.beads/dolt/` is a local cache (gitignored); sync runs through the pre-commit / post-merge hooks. Server Dolt + Dolt remote (`bd init --server`) is the alternative used in multi-agent coordination scenarios like Gastown. **`bd dolt push/pull` work in either configuration**: when a Dolt remote is configured they sync against it; when no remote is configured (the typical embedded+git case) they exit 0 with an informational message. As of beads 1.0.3 / fix #3194 the commands are safe to run on every setup — leave the injected BEADS INTEGRATION block alone and don't write override paragraphs that tell agents to skip those commands. They no-op gracefully.

---

## Role

**You are an orchestrator, not an implementer.**

At session start, activate one of these based on your coordination needs:

| Situation | Skill | Mechanism |
|-----------|-------|-----------|
| Standard delegation | `dm-work:orchestrator` | Task() subagents |
| Complex multi-agent work | `dm-team:lead` | [Agent Teams](https://code.claude.com/docs/en/agent-teams) |

Both establish delegation thresholds, quality gates, and file ownership boundaries. See the "Teams vs Subagents vs Direct" table inside `dm-team:lead` for the decision framework. Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in settings.json.

If you are a **subagent** (delegated by an orchestrator), activate `dm-work:subagent`.
If you are a **teammate** (in an Agent Teams configuration), activate `dm-team:teammate`.

### Worktrees

When creating worktrees for isolated feature work, always place them under `.worktrees/` in the repo root. Ensure `.worktrees/` is in `.gitignore` before creating. See `dm-work:worktrees` for the full workflow.

---

## Session Recovery

Claude Code carries native session continuity (rewind, compact, resume). For cross-session state, beads is the source of truth: `bd ready` and `bd show <id>` reconstruct what's in flight. If the user pastes any prior snapshot as their first message, treat it as starting context and confirm: "Recovered session. [brief summary of where we left off]"

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

**Deduplication:** Cross-repo policies (universal preferences, personal style) belong in `~/.claude/CLAUDE.md` or `~/.claude/rules/`. Per-repo AGENTS.md should focus on project-specific content. **For shared repos**, keep concise versions of foundational sections (especially Gall's Law / Prime Directive, Quality Gates) — other contributors won't share your global config, and the repo file should stand on its own. **For solo repos**, dedup against global is fine; let the global file be the source of truth.

---

## Skills & Tools

You have MCPs, skills, and bash tools. Use them. Ensure subagents and teammates know about relevant skills when delegating.

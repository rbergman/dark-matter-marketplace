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

### Independent review is non-negotiable

All substantive implementation work — yours or a subagent's — gets an independent review pass before close. Gates and review catch different problems; green gates don't substitute for review. The implementer owns the fixes (review identifies; the author who shipped the change remediates).

Choose the review mechanism by scope:

- `/dm-work:review` for parallel arch/code/security/design reviewers on a meaningful diff
- A scope-bound subagent review ("read ONLY the diff and the OWN files") for narrower changes, optionally paired with a Codex second-opinion for cross-model coverage
- For loop-driven queue work, `/dm-work:devloop --review-mode diff|full` runs the review as part of each item's Definition of Done

The goal is to catch drift, accumulated debt, and integration gaps before they compound. Trivial fixes (typo, comment-only) skip review; anything changing runtime behavior, contracts, or shipped surfaces does not.

---

## Beads & Timbers

This repo uses **beads** (`bd`) for task tracking and **timbers** for commit-reasoning logs. Both tools inject their own usage instructions during init:

- `bd init` runs `bd setup claude` which adds a beads usage section to your steering files and configures `.claude/settings.json`
- `timbers init --git-hooks` installs hooks; `timbers onboard --target agents >> AGENTS.md` appends usage guidance

**Follow the instructions those tools inject** — they own their respective domains. Don't duplicate that content here; let `bd setup claude` and `timbers onboard` be the source of truth so they stay current as the tools evolve.

**Fresh clone onboarding.** A new clone needs to hydrate its local Dolt DB before `bd ready` works. The universal command is:

```bash
bd bootstrap                          # auto-detects the right source (refs/dolt/data, JSONL, or backup)
bd config set beads.role maintainer   # or "contributor" for outside contributors
```

`bd bootstrap` is non-destructive and works for both sync modes (described below). `bd init` would mint a new identity and `bd import` requires the DB to already exist — use `bootstrap`. Set the role once to silence the role-config warning permanently.

Repo-wide conventions worth stating once (not covered by injections):

- **Bead-first workflow:** when ad hoc work appears (bug, feature, task) without an existing bead, create one before implementing. Every code change should trace back to a bead.
- **Bead detail discipline:** every bead has an imperative title, a description that lets a cold session start work, explicit dependencies, and a complexity estimate (xs/s/m/l/xl). M+ beads link to a plan doc and call out architectural decisions.
- **Beads baseline: 1.0.4+.** Pin via `brew upgrade beads` etc. 1.0.4 removes the embedded-mode flock (concurrent bd processes are now safe), adds `bd -C <path>` for cross-cwd invocations, and hardens hook auto-import after pull/checkout. `bd init --force` is deprecated in 1.0.4 — use `--reinit-local` (and `--discard-remote` if you mean it).
- **Sync model:** beads has two operating modes per upstream's [`SYNC_CONCEPTS.md`](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md). Both can be active across repos you work in — check per-repo before assuming a mode.
  - **Canonical (`refs/dolt/data` sync).** Dolt state lives in the `refs/dolt/data` git ref namespace on the same git remote as the code — invisible to branch trees, never appears in PR diffs. `.beads/issues.jsonl` is a **passive export** (viewer / interchange / backup), gitignored when this mode is active. Sync: `bd dolt push` (after meaningful bead work) and `bd dolt pull` (after `git pull` or as needed). `sync.remote` is set in `.beads/config.yaml`. Fresh clones onboard via `bd bootstrap`, which auto-detects `refs/dolt/data` on origin and hydrates Dolt directly. **`bd dolt push` is load-bearing under this mode — it's the sync, not a no-op.**
  - **Legacy (JSONL-in-git transport).** `.beads/issues.jsonl` is committed and serves as cross-clone transport. `export.auto = true` + `export.git-add = true` auto-flush and stage the JSONL on every `bd` mutation. Pre-commit hook handles staging; post-merge hook runs `bd import` to load incoming changes. This is what older repos (and pre-canonical `dm-work:repo-init` defaults) produce.
  - **Detection** (figure out which mode this repo is in — `bd dolt remote list` is the authoritative check):
    ```bash
    bd dolt remote list                # has a remote → canonical mode
    git ls-files .beads/issues.jsonl   # tracked → legacy mode
    ```
- **Memory sync model (1.0.4+): local only.** `bd remember` writes to the embedded Dolt DB (gitignored). `bd export` excludes memories by default (security: they may contain sensitive agent context); the pre-commit hook flush and 60-second auto-export both follow that default, so memories do **not** propagate via `.beads/issues.jsonl`. There is an `export.include-memories` config key but as of 1.0.4 it's accepted-but-not-wired. Treat `bd remember` as a per-clone learning store, not a team-shared one. For knowledge that should propagate, use AGENTS.md, `.claude/rules/`, or commit it as code/docs. The `--include-memories` flag on a manual `bd export` works if you genuinely need to ship memories across clones (review for sensitive content first).

---

## Workflow

Follow the **Disciplined Development Loop** from your global AGENTS.md / CLAUDE.md: intake → orient → plan → implement → validate → gate → review → maintain context → re-align → handoff. Each substantial change moves through those steps; trivial fixes skip the heavyweight ones but keep their intent.

Delegate to subagents via `Task()` when work is parallelizable, benefits from a fresh context window, or naturally splits along file-ownership lines. Otherwise work directly. Don't perform skill-activation rituals at session start — invoke skills only when they match the task at hand.

For Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), see `dm-team:lead` and `dm-team:teammate`. Teams fit when agents need to discuss, challenge, or coordinate across turns; subagents fit fire-and-forget delegation.

### Worktrees

When creating worktrees for isolated feature work, always place them under `.worktrees/` in the repo root. Ensure `.worktrees/` is in `.gitignore` before creating. Use `bd worktree create <name>` for beads-integrated workflow (auto-claims a bead, links the worktree, and tracks merge readiness), or `git worktree add` for raw git.

---

## Session Recovery

Claude Code carries native session continuity (rewind, compact, resume). For cross-session state, beads is the source of truth: `bd ready` and `bd show <id>` reconstruct what's in flight. If the user pastes any prior snapshot as their first message, treat it as starting context and confirm: "Recovered session. [brief summary of where we left off]"

---

## Session Orientation

Before starting any work, run the **Orient** step from the Disciplined Development Loop:

1. **Branch:** `git branch --show-current` — confirm you're on the expected branch
2. **Worktree:** `git worktree list` — are you in a worktree or the main repo?
3. **Working tree state:** `git status` — clean? any leftover state from a prior session?
4. **Confirm with user:** "I'm on branch X in [worktree/main]. Is this where you want me working?"
5. **Check beads:** `bd ready` — what work is available?
6. **Read project context:** `AGENTS.md` (or `CLAUDE.md` if that's the project's convention)

Skipping orientation risks working on the wrong branch — or on top of stale uncommitted state from another session — which wastes entire sessions silently.

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

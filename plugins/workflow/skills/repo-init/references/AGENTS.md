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

**Gall's Law sets the build order, not the target.** Within the requested scope, pick the target by the product's goal and the resources you actually have (compute, data, access, budget), not by how long a human would take to build it. When the strongest solution is well mapped, that is the target, and the first slice is the smallest working piece of it. Rule a solution out only for missing resources or open-ended discovery, and say which.

**Simplicity is not line count.** When choosing between a dependency and writing it yourself, ask what you would unknowingly be taking responsibility for — a library's value is often accumulated edge-case knowledge (encodings, specs, security, platform quirks), and "it's only ~30 lines" or your own confidence is not evidence that cost is low.

---

## Software Engineering Practices

### Commit hygiene and cadence

- **One logical change per commit.** A commit should compile, pass gates, and be revertable in isolation. If the diff spans unrelated concerns, split it.
- **Right-sized commits.** Roughly one bead = one commit for XS/S work; M+ work may produce a few related commits. Don't batch hours of work into one mega-commit; don't fragment a single coherent change across five.
- **Conventional Commits.** Use `type(scope): subject` — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`, `build:`, `ci:`. Imperative subject, ≤72 chars. Body explains *why* when the diff doesn't make it obvious.
- **Reference beads in the body**, not the subject (`Closes bd-abc-123` / `Refs bd-abc-124`).

### Quality gates and checkpoints

Follow this repository’s explicit policy. Use focused behavior tests and changed-scope lint/format during iteration; choose a small meaningful `just check-fast` tripwire when useful. Run affected package and downstream checks at subsystem checkpoints and the full integration gate once on the combined final application candidate before integration. Preserve native, security and release gates. Full suites are not automatically due each turn, commit or development push; do not bypass an explicit stricter hook. For Tauri/mixed Rust+frontend work, use **tauri-dev** to separate browser iteration from native acceptance.

If pre-commit hooks run the required checks for the exact changed state, reuse their results. Otherwise run the missing checks. Fix failures introduced by this change and in-scope defects. Establish and track pre-existing failures; a required failing gate prevents a clean-completion claim but does not authorize unrelated remediation. Ask for a scope decision only when necessary remediation is not already authorized. Record any permitted operator-approved exception as an exception, never a pass.

When file/function/complexity limits trigger, **extract logical sections into well-named companion files** rather than compressing code to fit. Don't combine statements onto one line, strip comments, or shorten names to satisfy a metric.

### just as the primary DX interface

`just` is the canonical command runner for both humans and agents in this repo. Treat the justfile as the contract:

- All common workflows belong as `just` recipes — `just check`, `just build`, `just test`, `just fmt`, `just lint`, `just hooks`, project-specific tasks
- New repeatable commands → add a recipe rather than documenting raw shell
- Keep recipes short and self-explanatory; agents will read them
- When a recipe changes, the change is the documentation

If a workflow only exists as a shell snippet in a doc, it's not really a workflow yet — promote it to `just`.

### Independent review is non-negotiable

All substantive implementation work — yours or a subagent's — gets an independent review pass before close. Gates and review catch different problems; green gates don't substitute for review. The implementer owns the fixes (review identifies; the author who shipped the change remediates).

Choose the review mechanism by scope:

- `/code-review` (native) for a meaningful diff — `low`/`medium` effort for high-confidence findings, `high`+ when you want breadth over precision
- One fresh-context subagent for narrower changes, reading the diff and directly relevant callers/contracts. Pin the reviewed commit/tree or immutable snapshot, including new files; fail explicitly if those bytes cannot be read. Re-review remediation and affected seams, not unchanged scope.

**Cross-model leg (recommended, optional):** when a second reviewer is warranted, Codex is the recommended instrument — different weights fail differently, and it runs on a separate subscription quota. Detect with `command -v codex`. Absent → proceed single-model and note it once in the review report ("cross-model review unavailable: codex not installed"); never block on its absence. Install via the `openai-codex` marketplace; `/codex:setup` configures it.

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
- **Bead detail discipline:** every bead has an imperative title, a description that lets a cold session start work, explicit dependencies, and a complexity estimate (xs/s/m/l/xl). M+ beads link to a plan doc, call out architectural decisions, state acceptance criteria (split runtime vs code-verifiable, each checkable by an independent judge), and name a verification plan (which gates, which external signal proves it). **The plan doc is the spec** — shape it with `dm-work:spec-shaping` (interview to the goal, explicit decision checkpoint) rather than improvising structure.
- **Beads baseline: 1.0.4+.** Pin via `brew upgrade beads` etc. 1.0.4 removes the embedded-mode flock (concurrent bd processes are now safe), adds `bd -C <path>` for cross-cwd invocations, and hardens hook auto-import after pull/checkout. `bd init --force` is deprecated in 1.0.4 — use `--reinit-local` (and `--discard-remote` if you mean it).
- **Sync model:** beads has two operating modes per upstream's [`SYNC_CONCEPTS.md`](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md). Both can be active across repos you work in — check per-repo before assuming a mode.
  - **Canonical (`refs/dolt/data` sync).** Dolt state lives in the `refs/dolt/data` git ref namespace on the same git remote as the code — invisible to branch trees, never appears in PR diffs. `.beads/issues.jsonl` is a **passive export** (viewer / interchange / backup), gitignored when this mode is active. Sync: `bd dolt push` (after meaningful bead work) and `bd dolt pull` (after `git pull` or as needed). `sync.remote` is set in `.beads/config.yaml`. Fresh clones onboard via `bd bootstrap`, which auto-detects `refs/dolt/data` on origin and hydrates Dolt directly. **`bd dolt push` is load-bearing under this mode — it's the sync, not a no-op.**
  - **Legacy (JSONL-in-git transport).** `.beads/issues.jsonl` is committed and serves as cross-clone transport. `export.auto = true` + `export.git-add = true` auto-flush and stage the JSONL on every `bd` mutation. Pre-commit hook handles staging; post-merge hook runs `bd import` to load incoming changes. This is what older repos (and pre-canonical `dm-work:repo-init` defaults) produce.
  - **Detection** (figure out which mode this repo is in — the tracked JSONL decides):
    ```bash
    git ls-files .beads/issues.jsonl   # tracked → legacy mode, whatever else is configured
    grep -E "^sync(\.remote)?:" .beads/config.yaml   # sync.remote set and the JSONL untracked → canonical
    ```
    A Dolt remote alone (`bd dolt remote list`) is not evidence of canonical mode. Never `bd dolt push` from a legacy repo: a fresh clone's `bd bootstrap` restores `refs/dolt/data` ahead of the tracked JSONL, then overwrites the JSONL with it.
- **Memories go wherever the beads database goes.** `bd remember` writes to the gitignored Dolt DB, so memories never appear in a commit or PR diff. **Canonical mode:** `bd dolt push` sends the whole database, memories included, to `refs/dolt/data`, so memories are private exactly when the beads remote is private; on a public origin they are public. **Legacy mode:** JSONL export leaves memories out, so they stay per-clone. `bd prime` injects every memory into every session, so keep the store small: repo-scoped technical gotchas only, a few hundred characters each, a couple of dozen per repo. Session state (checkpoints, handoffs, release notes in progress) belongs in bead comments or the spec; knowledge every contributor needs belongs in this file, `.claude/rules/`, or code/docs.

---

## Workflow

Follow the **Disciplined Development Loop** from your global AGENTS.md / CLAUDE.md: intake → orient → plan → implement → validate → gate → review → maintain context → re-align → handoff. Each substantial change moves through those steps; trivial fixes skip the heavyweight ones but keep their intent.

**Spec-first for M+ or fuzzy work.** Before implementing, the goal, key decisions, acceptance criteria, and verification plan live in a durable spec (the bead's plan doc — see `dm-work:spec-shaping`), and any multi-step build states its verification plan before code is written: which gates run, which external signal proves the behavior (browser-qa, state dump, seed replay, API response). XS/S well-understood work is exempt — a good bead description is its spec; don't ceremonialize small work.

Delegate to subagents via `Task()` when work is parallelizable, benefits from a fresh context window, or naturally splits along file-ownership lines. Otherwise work directly. Don't perform skill-activation rituals at session start — invoke skills only when they match the task at hand.

Agent Teams are off by default. When enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), any subagent you give a `name` launches as a teammate instead. Teams fit when agents need to discuss, challenge, or coordinate across turns; subagents fit fire-and-forget delegation.

### Worktrees

Put worktrees outside the repo, at `<parent>/<repo>.wt/<branch>`, with the folder named for its branch. From the repo root: `git worktree add ../<repo>.wt/<branch> -b <branch>` (drop `-b` if the branch already exists), or `bd worktree create ../<repo>.wt/<branch> --branch <branch>` for the beads-integrated workflow. Never nest them inside the repo: test runners, bundlers and file watchers crawl nested copies, and `.gitignore` does not stop them. Whoever creates a worktree removes it once its work has landed. If the repo still has an old in-repo `.worktrees/` folder, move those worktrees out first (`git worktree move`).

### Operator alignment

This workflow aligns the operator as much as the agent — apply it in both directions, gently:

- **Brain dumps are welcome.** A multi-thread message is intake, not a violation. Capture every distinct thread, list them back, propose a priority and a scope for this turn, and park the rest as beads — say where each thread went. No thread silently dropped.
- **Gentle nudges when practice slips.** If a request skips a step this file establishes (spec for M+ fuzzy work, review before merge, verification plan before a multi-step build), give one brief plain-language reminder naming the step and offering the aligned path. One or two sentences, not a lecture. If the operator says proceed anyway, proceed without re-arguing.

### Guardrail tiers

Bucket agent-relevant actions into three tiers, and be honest about which tier each item is actually in:

- **always-do** — autopilot, no ask: orientation, repository-required gates, bead tracking, targeted validation.
- **ask-first when not already authorized** — human checkpoint: merges, pushes to shared branches, destructive or irreversible operations, material schema/contract choices, and anything the operator scoped as theirs. Honor existing authorization for the same concrete action; it does not extend to a materially different target or effect.
- **never-do** — enforced by **hooks**, not prose. A prose "never" in this file is a request the model can drift past; a PreToolUse hook is a rule. **A never-do without an enforcing hook is an ask-first — either wire the hook or reclassify it honestly.** dm-work's `--no-verify` hook only warns and asks for a reason, so it is not a never-do; add a path-protection PreToolUse hook for repo-specific protected paths (see `dm-work:repo-init`).

List this repo's never-do items here, each with the hook that enforces it:

<!-- | Never-do | Enforcing hook | -->

### Model routing

Honor the operator's current model policy and available harness. With Astra/Fable as lead:

- **Lead judgment:** planning, task definition, architecture (full-stack and game engine), UI/creative design, acceptance criteria/DoD, verification design, research synthesis, difficult diagnosis, and cohesion stay with Astra/Fable. The lead can implement directly when judgment or valuable context makes that efficient.
- **Bounded implementation:** Sol Medium in Codex or Opus in Claude implements settled contracts and tests. Give compact briefs with scope, invariants, decisions, and checks; return consequential ambiguity to the lead. Reuse workers for coherent follow-ups; do not recursively delegate by default.
- **Evidence gathering:** Terra/Luna in Codex or Sonnet/Haiku in Claude may search, inventory, extract, or run mechanical tools. They do not own design, creative conclusions, or review acceptance.
- **Independent review:** Astra/Fable assesses architecture, consequential security/state risks, design, and verification adequacy; Sol/Opus may review bounded implementation correctness.
- Delegate when a meaningful execution loop can be moved with less handoff/review/repair work than staying local. Avoid full-history forks that inherit the costly model. Use actual tool model-selection semantics, not assumed cache hits or cross-provider equivalence. Do not silently switch providers or the selected lead.

---

## Session Recovery

Claude Code carries native session continuity (rewind, compact, resume). For cross-session state, beads is the source of truth: `bd ready` and `bd show <id>` reconstruct what's in flight. If the user pastes any prior snapshot as their first message, treat it as starting context and confirm: "Recovered session. [brief summary of where we left off]"

---

## Session Orientation

Before starting any work, run the **Orient** step from the Disciplined Development Loop:

1. **Branch:** `git branch --show-current` — confirm you're on the expected branch
2. **Worktree:** `git worktree list` — are you in a worktree or the main repo?
3. **Working tree state:** `git status` — clean? any leftover state from a prior session?
4. **Resolve the target:** compare the branch/worktree with the request and existing work. Proceed when they agree; ask only if a real conflict or missing target cannot be resolved from context.
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

## Knowledge Architecture

Where compiled knowledge lives in this repo — so agents know where to look and where to deposit synthesis, instead of leaving discoveries in chat logs:

| Store | Holds | Propagates? |
|-------|-------|-------------|
| `docs/` + bead-linked plan docs (specs) | Durable design intent, decisions, acceptance criteria | Yes (git) |
| `AGENTS.md` + `.claude/rules/` | Team-shared working rules | Yes (git) |
| timbers | Commit-level reasoning ledger | Yes (git) |
| `bd remember` | Repo-scoped factual learnings (library gotchas, env quirks) | **Canonical: yes, via `bd dolt push` (private only if the beads remote is). Legacy: no, per-clone** |

**Graduation path:** a lesson that recurs graduates upward — `bd remember` → this AGENTS.md → (when it proves cross-project) a dm-* skill or `~/.claude/rules/`. `/session-retro` harvests; periodic `align-agents` sweeps should ask "which of this repo's local rules have earned cross-project status?" Knowledge that only exists where it was learned is knowledge the next session rediscovers from scratch.

---

## Skills & Tools

You have MCPs, skills, and bash tools. Use them. Ensure subagents know about relevant skills when delegating — a subagent does not inherit your conversation, and a teammate spawned from a subagent definition does not pick up that definition's `skills` frontmatter either.

# Dark Matter Roadmap — March 2026

> **Status:** Active planning document
> **Last updated:** 2026-03-28
> **Sources:** CC toolchain survey (2026-03-27), Anthropic harness design blog, gstack analysis, dm-review-skill-improvements analysis, field friction reports from iOS app repo, redshifted (timbers/eslint), and ongoing orchestrator observation.

## Vision

DM plugins are the **deterministic SDLC backbone** for all repos. Every project — Constructured, Inklands, the iOS app, redshifted, mapgen, and future ones — runs on the same orchestrator, the same quality gates, the same review pipeline. The plugins encode *how work gets done*, not just *what tools exist*.

The gap today: DM is a toolkit (explicit activation, compose-your-own-workflow). The goal: DM becomes an **opinionated pipeline** with deterministic stages, HITL gates at key decision points, and autonomous evaluation after code lands. The toolkit stays — it feeds the pipeline.

### North Star Pipeline

```
SPEC → CONTRACT → IMPLEMENT → QA → REVIEW → EVALUATE → MERGE → POST-MERGE REVIEW
 │         │           │        │       │          │         │            │
 │    acceptance    subagent   gates  parallel   separate   /merge    autonomous
 │    criteria in   w/worktree  +CDT   review    judge     checklist  evaluator
 │    bead before   isolation   browser          grades               files issues
 │    claiming                  QA               against              in beads
 │                                               contract
 HITL                                   HITL                HITL
```

HITL gates: (1) approve spec/contract, (2) triage review findings, (3) approve merge. Everything between gates is autonomous.

---

## Phase 0: Clean Slate

**Goal:** Reduce surface area. Delete dead code. One commit.

| Item | Action | Notes |
|------|--------|-------|
| `plugins/drivers/` (dm-drvr) | Delete directory | Already archived, not in marketplace |
| `plugins/pm-script/` (dm-pmgr) | Delete directory | Already deferred. Philosophy lives on in Phase 3. pm-script hooks will be removed with the directory. |
| `dm-lang:rescript-pro` | Delete skill directory | Not used |
| `dm-work:srt` | Delete skill directory | `/sandbox` covers interactive; autonomous sandboxing is niche enough to not need a 478-line skill |
| `references/autonomous-runs.md` | Delete | Covered by srt skill being deleted; `/sandbox` is built-in |
| `references/beads-dolt-upgrade.md` | Evaluate | May be stale post-0.61 migration |
| Stale references in README | Clean up | Remove dm-drvr, dm-pmgr sections; remove srt from DX table |
| marketplace.json | Already clean | dm-drvr and dm-pmgr already removed |
| Plugin versions | Bump dm-work (minor), dm-lang (minor) | For srt and rescript removals |

**Not deleting:** dm-arch, dm-team, rust-pro, python-pro, brainstorming (evaluated later).

---

## Phase 1: Fix the Foundation

**Goal:** The orchestrator, subagent protocol, and quality gates must work reliably across all repos before adding new capabilities. This is the force multiplier — everything downstream depends on it.

### 1.1 Orchestrator Drift Diagnosis

**Problem:** Orchestrator directives and skills not executing consistently. May be skill description drift, CLAUDE.md conflicts across projects, or plugin load order issues.

**Investigation:**
- Diff orchestrator SKILL.md against known-good behavior (what changed since it was "rock solid"?)
- Check skill description trigger language — is it still "pushy" enough per skill-authoring conventions?
- Check for conflicting instructions in project-level CLAUDE.md files across repos
- Check if the orchestrator's delegation thresholds (2+ files, 30+ LOC) still match how work actually flows
- Test: start a fresh session, does the orchestrator activate? Does it delegate when it should?

**Deliverable:** Fix identified issues. If the root cause is unclear, add explicit session-start logging ("orchestrator activated, N skills loaded") to make drift visible.

### 1.2 Quality Gate Reform

**Problem:** Hooks cause friction during merges, rebases, and docs-only commits. Field reports from redshifted and timbers:
- `block-no-verify.sh` blocks `--no-verify` even for docs-only commits where lint-staged has no matching patterns
- Merge commits run prettier on 60+ files, creating lint errors in previously-clean files
- timbers PreToolUse:Bash blocks ALL bash commands when pending commits exist (including during rebase, where phantom "pending" commits appear from rewritten SHAs)
- The Stop hook alone is sufficient for session-end enforcement without mid-work friction

**Approach — progressive relaxation with safety nets:**

1. **block-no-verify.sh — context-aware gating:**
   - Allow `--no-verify` when ONLY non-code files are staged (`.md`, `.json`, `.yml`, `.toml`, config files)
   - Allow `--no-verify` when `MERGE_HEAD` exists (active merge resolution)
   - Allow `--no-verify` when an env var `DM_SKIP_VERIFY=1` is set (explicit opt-out for known situations)
   - Continue blocking for all other cases (code commits bypassing hooks)

2. **Merge-aware lint-staged:**
   - Document in orchestrator/merge skill: detect `MERGE_HEAD` and skip formatting-only lint-staged runs
   - This is a per-repo config recommendation, not a plugin change — but the merge skill should advise it

3. **Stop hook is primary enforcement:**
   - `run-gates-on-stop.sh` is already well-designed (dedup, loop breaker, code-only detection)
   - The PreToolUse blocker for `--no-verify` is the *secondary* enforcement — it prevents bypass, but the Stop hook catches everything at session end regardless
   - With today's models being more steerable, the PreToolUse blocker can be context-aware without losing the safety net

4. **Timbers feedback (separate from DM, but related):**
   - Recommend Stop-only as default, PreToolUse as opt-in
   - Recommend stale anchor detection after rebase
   - These are timbers issues, not DM issues, but the friction affects DM-orchestrated workflows

**Deliverable:** Updated `block-no-verify.sh` with context-aware gating. Updated merge command with lint-staged guidance. No wholesale removal of hooks — progressive relaxation.

### 1.3 Subagent Protocol Hardening

**Problem:** Field reports from iOS app repo reveal gaps in the subagent protocol.

| Gap | Fix | Where |
|-----|-----|-------|
| No branch verification | Add "verify branch with `git branch --show-current` before writing code" to subagent skill | `dm-work:subagent` |
| No codebase-specific lint context | Orchestrator injects lint rules/gotchas as part of spec. `bd remember` is the persistence layer for accumulating these per-repo. Add to subagent launch template. | `dm-work:orchestrator` |
| Worktree isolation not default | Make worktree isolation the DEFAULT for all subagent work, not optional. Orchestrator launch template should use `isolation: "worktree"` unless explicitly overridden. | `dm-work:orchestrator` |
| No worktree cleanup on merge | `/merge` should delete worktree and branch after successful merge | `dm-work:merge` (commands/merge.md) |
| No gate fixer agent profile | Add a lightweight "gate fixer" role — reads error output, applies targeted fixes, no full context needed. Cheaper than spawning general-purpose subagent. | New addition to `dm-work:orchestrator` |
| No spec-compliance review mode | `/review` has arch/code/security reviewers but no "does this match the spec?" mode. Add Phase 3.5 (adversarial verification against spec) as a first-class mode, not optional. | `dm-work:review` — already has Phase 3.5 structure, make it more prominent |
| Subagent prompt checklist incomplete | iOS app formalized an 8-item mandatory checklist. Generalize and add to orchestrator's launch template. | `dm-work:orchestrator` |

**Deliverable:** Updated orchestrator, subagent, merge, and review skills/commands.

---

## Phase 2: Evaluation & QA Layer

**Goal:** Add the missing capabilities that let DM *judge* work, not just *produce* it.

### 2.1 Browser QA Skill (CDT MCP)

**The single highest-value addition.** Both gstack and Anthropic's harness test running apps by clicking through them. DM has nothing here.

**Build on CDT MCP** (already connected). CDT is more surgical than Playwright — you control what you inspect, lower context footprint. Playwright's full DOM dumps per action were the reason for the switch.

**Skill design:**
- Read bead acceptance criteria (or explicit QA spec)
- Navigate to the running app
- Exercise key user flows (click, fill, navigate, screenshot)
- Assert expected behavior (visible text, element presence, console errors, network responses)
- Report pass/fail against each acceptance criterion
- Generate regression test stubs for failures (optional)
- Output: structured QA report compatible with beads (can be attached as notes)

**CDT MCP capabilities available:**
- Navigation, clicking, filling forms, typing, screenshots
- Console message inspection, network request monitoring
- Lighthouse audits, performance traces, memory snapshots
- Script evaluation for custom assertions

**Scope:** Start with a dm-work skill. Not a separate plugin. The skill teaches the orchestrator/evaluator how to use CDT MCP for QA, not a full test framework.

### 2.2 AI Slop Detection & Design Scoring

**From gstack's design review and Anthropic's evaluator criteria.** Two related capabilities:

**AI Slop Detection** (add to review pipeline):
- Generic gradient backgrounds (purple → blue over white cards)
- Template-default spacing, typography, color choices
- Identical component styling across unrelated sections
- Stock placeholder content that survived to production
- Over-reliance on rounded corners, drop shadows, and blur effects
- Generic hero sections with centered text over stock imagery
- "AI smell" — looks polished but has no distinct identity

**Design Scoring Criteria** (from Anthropic harness, adapted):
1. **Design quality** — coherent whole vs collection of parts. Distinct mood and identity.
2. **Originality** — evidence of custom decisions vs template defaults. AI slop score.
3. **Craft** — typography hierarchy, spacing consistency, color harmony, contrast ratios.
4. **Functionality** — usability independent of aesthetics.

**Implementation:** Add as evaluation dimensions to the review skill (new reviewer role: "Design Quality"). Can also be used standalone by the evaluator protocol (Phase 3.1). The CDT MCP + screenshots make this testable, not just theoretical.

### 2.3 Sprint Contract Protocol

**Nearly free — formalizes what's implicit in beads.**

Before claiming a bead, the agent writes specific acceptance criteria into the bead:
```bash
bd update <id> --design="
Acceptance criteria:
1. User can navigate to /settings and see their profile
2. Form validates email format client-side
3. Save button disabled while submitting
4. Success toast appears after save
5. No console errors during the flow
"
```

The evaluator (Phase 3.1) grades against these criteria. The browser QA skill (2.1) tests them.

**Where this lives:** A paragraph in the orchestrator's subagent launch template and in the dialectical-refinement skill's Phase 5 (synthesize). Not a separate skill.

### 2.4 Gate Fixer Agent Profile

**From iOS app retro.** When a subagent delivers code that fails quality gates, spawning a full general-purpose agent to fix lint errors is overkill.

**Gate fixer profile:**
- Reads ONLY error output (not full codebase)
- Applies targeted fixes (lint rule violations, formatting, type errors)
- No architectural decisions, no feature work
- Uses haiku model (fast, cheap, sufficient for mechanical fixes)
- Returns: fixed files + gate results

**Where this lives:** A new agent profile in the orchestrator's delegation options, alongside the existing subagent and reviewer profiles. Triggered automatically when subagent work fails gates.

---

## Phase 3: SDLC Pipeline — DONE (2026-03-28)

**Goal:** Connect the pieces into a deterministic pipeline with autonomous evaluation.

**Council review (2026-03-28):** Three-perspective council (advocate, skeptic, pragmatist) reviewed the design. Key adjustments:
- Evaluator only runs when browser-qa available OR criteria require runtime testing (avoids duplicating intent review)
- Post-merge review scoped narrowly (not full re-review)
- Phase 3.3 (review improvements) deferred to Phase 4 (wait for real review data)
- Two-stage subagent review documented as clarification, not expansion

### 3.1 Evaluator Protocol — SHIPPED

New skill: `dm-work:evaluator`. Separate judge agent grading work against bead acceptance criteria.

- **Scope separation from intent review:** Intent review checks CODE COVERAGE (does the diff contain the right changes?). Evaluator checks BEHAVIORAL CORRECTNESS (does the running app satisfy each criterion?).
- **Skip conditions:** No acceptance criteria, XS/S tasks, clean intent review + no CDT, no bead.
- **Integration:** Orchestrator Step 1.5 (between intent review and mechanical gates).
- **Circuit breaker:** 2 failures on same criterion → escalate to user.

### 3.2 Post-Merge Review — SHIPPED

New command: `/dm-work:post-merge`. Autonomous review after code lands.

- Detects merge, runs scoped review (medium+ severity), runs evaluator on closed beads
- Files findings as beads for next-session triage (HITL gate)
- Merge command suggests running post-merge after successful merge (advisory)
- Not a full re-review — focuses on net-new concerns, integration issues, criteria failures

### 3.3 Review Pipeline Improvements — DEFERRED to Phase 4

Per council recommendation: wait for real review data across multiple sessions before investing in Scout optimizations. Items deferred:
- Hard exclusion pre-filter (need data on which categories are noisy)
- Adaptive reviewer count (need 20+ reviews to calibrate thresholds)
- `.review-filter.md` per-repo customization (CLAUDE.md sufficient for now)
- FP verification as default (current adversarial verification is heavyweight test-writing, not lightweight FP filtering)
- Cost tracking / `--budget` flag
- Incremental review memory

### 3.4 Two-Stage Subagent Review — DOCUMENTED

Clarified in orchestrator as explicit scope separation between intent review (spec coverage), evaluator (behavioral correctness), and code quality review (advisory). No pipeline expansion — existing flow with clearer documentation.

---

## Phase 4: Harness + Review Optimization (Future)

**Goal:** For ambitious, multi-hour autonomous builds. Builds ON the Phase 1-3 infrastructure. Also: optimize the review pipeline with real usage data.

### 4.0 Review Pipeline Optimization (deferred from Phase 3)

After running 20+ reviews across multiple projects, revisit:
- **Hard exclusion pre-filter** — identify which finding categories are consistently noisy
- **Adaptive reviewer count** — calibrate LOC thresholds for light/standard/deep/thorough
- **Lightweight FP verification** — Sonnet pass to filter false positives (different from adversarial spec testing)
- **`.review-filter.md`** — per-repo customization when CLAUDE.md proves insufficient
- **Cost tracking** — `--budget` flag, per-review token stats in JSON output
- **Incremental review memory** — store prior findings alongside review tags, don't re-report known issues

### 4.1 Planner Agent

Takes a brief prompt → expands to full spec → creates beads with dependency graph. Prompted to be ambitious on scope, vague on implementation (per Anthropic finding: granular spec errors cascade).

Uses dialectical-refinement to harden the spec before work begins.

### 4.2 Deterministic Orchestration

The dm-pmgr philosophy, not the dm-pmgr code: deterministic orchestration with LLM only at the worker layer. The pipeline (spec → contract → implement → QA → review → evaluate → merge) is deterministic. Each stage has clear entry/exit criteria. HITL gates at defined points.

Could be implemented as:
- A dm-work skill that drives the pipeline (simplest)
- A shell script that invokes CC in `--print` mode per stage (more control)
- Claude Agent SDK (most capable, most complex)

Start with the skill. Graduate to script/SDK if the skill hits limits.

### 4.3 Beads as Sprint Plan

The dependency graph IS the sprint plan. `bd ready` returns the next unblocked work. Acceptance criteria in beads ARE the sprint contracts. Evaluator grades against those criteria. This is already almost true — Phase 3 formalizes it.

**GitHub integration:** Beads issues can map to GitHub issues/PRs. `bd` already has the infrastructure. Formalize the bridge: bead created → GH issue created, bead closed → GH issue closed, review findings → GH PR comments.

---

## Ongoing / Cross-Cutting

### dm-arch Evaluation

**Current state:** dm-arch teaches SOLID and data-oriented patterns. Opus 4.6 knows these but doesn't *apply* them reliably — still builds god objects and monster functions under pressure.

**The real problem:** Not missing knowledge, but missing *discipline*. The fix is enforcement (complexity limits, decomposition triggers in quality gates), not more teaching.

**Action:** Keep dm-arch for now. The real investment is in file/function/cognitive/cyclomatic complexity limits enforced via ESLint rules + quality gates + the evaluator. dm-arch is the reference; the gates are the enforcement. If complexity enforcement via gates proves sufficient, dm-arch can be archived later.

**Per-repo enforcement:** ESLint `max-lines`, `max-lines-per-function`, `sonarjs/cognitive-complexity`. These should be in every TypeScript project's ESLint config. The repo-health skill should check for them.

### Brainstorming Consolidation

Three brainstorming paths is too many:
- `dm-work:brainstorming` — collaborative dialogue (150 lines)
- `dm-work:dialectical-refinement` — adversarial spec hardening (280 lines)
- `dm-team:brainstorm` — multi-agent simultaneous exploration (Agent Teams)

**Action:** Keep dialectical-refinement as primary for spec work. Keep dm-team:brainstorm (different mechanism, Agent Teams). Evaluate whether brainstorming adds unique value beyond dialectical-refinement — the "one question at a time, explore approaches" style is lighter weight. May merge the unique bits into dialectical-refinement's early-exit path (xs/s tasks skip adversarial phases and just do collaborative dialogue). Defer until after Phase 1.

### dm-team: Keep Council, Evaluate Rest

Council is used regularly — keep. Tiered-delegation is the decision framework — keep. The rest (lead, teammate, refinement, review, brainstorm, compositions) stays installed but gets evaluated over the next few sessions. Agent Teams maturity from Anthropic will inform this.

### tokf Testing

Deliberately test in a build-heavy session. If it helps, promote in documentation. If not, archive.

### Cross-Project Retro

session-retro + `bd remember` already captures per-session and cross-session learnings. A formal cross-project retro (gstack's `/retro global` pattern) is desirable but lower priority. Could be a periodic manual exercise rather than a skill.

---

## Dependency Graph

```
Phase 0 (clean slate) ─── no dependencies, do any time
    │
Phase 1.1 (orchestrator drift) ─── blocks everything else
    │
Phase 1.2 (gate reform) ──┐
Phase 1.3 (subagent protocol) ──┤── can run in parallel
    │                            │
Phase 2.1 (browser QA) ─────────┘── depends on 1.1 (orchestrator must work)
Phase 2.2 (slop detection) ─── independent
Phase 2.3 (sprint contracts) ─── independent
Phase 2.4 (gate fixer) ─── depends on 1.3 (part of subagent protocol)
    │
Phase 3.1 (evaluator) ─── DONE
Phase 3.2 (post-merge review) ─── DONE
Phase 3.3 (review improvements) ─── DEFERRED to Phase 4 (need review data)
Phase 3.4 (two-stage review) ─── DONE (docs clarification)
    │
Phase 4 (harness + review optimization) ─── depends on Phase 3 pipeline working (DONE)
```

## Session Planning Guide

Use this to decide what to work on in a given session:

| Available time | What to do |
|----------------|------------|
| 30 min | Phase 0 (quick deletes) |
| 1-2 hours | Phase 1.1 (orchestrator diagnosis) or Phase 1.2 (gate reform) |
| Half day | Phase 1 complete (all three tracks) |
| Full day | Phase 1 + Phase 2.1 (browser QA skill) |
| Multi-session | Phase 1 → Phase 2 → Phase 3 in order |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Keep dm-team council | Actively used by user |
| 2026-03-28 | Keep rust-pro, python-pro | Light but needed across projects |
| 2026-03-28 | Build browser QA on CDT, not Playwright | Playwright MCP context footprint too heavy; CDT already connected; CDT is more surgical |
| 2026-03-28 | Progressive hook relaxation, not removal | Models are more steerable but still need guardrails; context-aware gating preserves safety net |
| 2026-03-28 | Sprint contracts in beads, not separate system | Beads already has description/notes/design fields; the protocol is a paragraph, not a tool |
| 2026-03-28 | Evaluator as single QA pass, not GAN loop | GAN loops are Phase 4 territory; single pass with teeth is the right starting point |
| 2026-03-28 | Keep dm-arch pending gate enforcement | Problem is discipline not knowledge; complexity limits via ESLint + gates are the real fix |
| 2026-03-28 | Token budget is not a constraint | 2x OAuth Max plans with room; optimize for time-to-complete, not cost |

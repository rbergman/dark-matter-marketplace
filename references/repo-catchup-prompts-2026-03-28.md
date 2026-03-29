# Repo Catchup Prompts — 2026-03-28

DM plugins updated through Phase 4 (dm-work 0.34.0). These prompts align each repo with the current orchestration pipeline.

---

## Downriver (gorewood/downriver)

**Current state:** Young TypeScript/PixiJS project. Has beads, timbers, AGENTS.md. Missing: DM skill references, orchestrator context in AGENTS.md, settings hooks only cover timbers.

**Prompt:**

> This session is a steering alignment. DM plugins were updated to dm-work 0.34.0 with a formalized SDLC pipeline. This repo needs minimal catchup since it's young and well-structured.
>
> **1. Update .claude/settings.local.json hooks**
>
> The current hooks only have timbers prime/stop. Add beads context recovery:
>
> In the SessionStart hook array, add a beads prime command:
> ```json
> { "type": "command", "command": "if [ -d .beads ]; then bd prime; fi", "timeout": 10 }
> ```
>
> **2. Add orchestration context to AGENTS.md**
>
> Add a brief section after the Settled Decisions:
>
> ```markdown
> ## Orchestration
>
> This project uses the DM plugin pipeline for M+ tasks:
> SPEC → CONTRACT → IMPLEMENT → GATES → EVALUATE → MERGE → POST-MERGE
>
> - Use `/breakdown` for decomposing features into beads with acceptance criteria
> - Subagents use worktree isolation by default
> - Quality gate: `just check` (typecheck + lint + test + build)
> - Evaluator runs when CDT MCP available and acceptance criteria exist
> ```
>
> **3. Run `dm-work:repo-health`**
>
> After changes, run repo-health for a full audit. Address CRITICAL and IMPORTANT findings.

---

## Mapgen / Inklands (gorewood/mapgen)

**Current state:** Mature TypeScript+Go monorepo. Has beads, timbers, AGENTS.md with orchestrator refs, multi-role steering (AGENTS-PM.md, AGENTS-CC.md). Settings has rich hooks and permissions. In good shape — just needs minor alignment.

**Prompt:**

> This session is a steering alignment. DM plugins were updated to dm-work 0.34.0. This repo is already well-set-up. Minor updates only.
>
> **1. Update DM skill references in AGENTS.md**
>
> The current skill refs use `/dm-work:` prefix (command syntax). Update to skill syntax (no slash):
> - `/dm-work:review` → `dm-work:review` (this one is a command, so keep the `/`)
> - `/dm-work:orchestrator` → `dm-work:orchestrator`
> - `/dm-work:subagent` → `dm-work:subagent`
> - `/dm-work:worktrees` → `dm-work:worktrees`
>
> Check: are these used as skills (auto-invoked by description) or commands (manually typed with `/`)? Skills don't need the slash. Commands do.
>
> **2. Add pipeline context**
>
> Add to AGENTS.md or AGENTS-CC.md:
> ```markdown
> ## Pipeline (M+ tasks)
> SPEC → CONTRACT → IMPLEMENT → GATES → EVALUATE → MERGE → POST-MERGE
> - `/breakdown` for decomposing epics
> - Subagents use worktree isolation by default
> - Quality gate: `just check`
> - This is a WebGL/Canvas game — browser-qa CDT MCP cannot inspect canvas internals. Runtime criteria require manual verification via screenshots and playtesting.
> ```
>
> **3. Add beads prime to SessionStart**
>
> Check if `bd prime` is in the SessionStart hooks. If not, add it alongside timbers prime.
>
> **4. Run `dm-work:repo-health`**
>
> After changes, run repo-health. Address CRITICAL and IMPORTANT findings.

---

## Whitewater Journeys iOS (gorewood/whitewater-journeys-ios)

**Current state:** iOS app with the most mature AGENTS.md in the fleet (8-item orchestration checklist, Liquid Glass design system, 11 custom skills, Maestro QA). But missing `.claude/settings.local.json` entirely — no hooks, no session management. Beads and timbers exist but aren't wired into Claude Code hooks.

**Prompt:**

> This session is a steering alignment. DM plugins were updated to dm-work 0.34.0 with a formalized SDLC pipeline. This repo has excellent AGENTS.md but is missing Claude Code project settings.
>
> **1. Create `.claude/settings.local.json`**
>
> ```bash
> mkdir -p .claude
> ```
>
> Write to `.claude/settings.local.json`:
> ```json
> {
>   "hooks": {
>     "SessionStart": [
>       {
>         "matcher": "",
>         "hooks": [
>           {
>             "type": "command",
>             "command": "if [ -d .beads ]; then bd prime; fi && if command -v timbers &>/dev/null && [ -d .timbers ]; then timbers prime; fi",
>             "timeout": 15
>           }
>         ]
>       }
>     ],
>     "PreCompact": [
>       {
>         "matcher": "",
>         "hooks": [
>           {
>             "type": "command",
>             "command": "if [ -d .beads ]; then bd prime; fi",
>             "timeout": 10
>           }
>         ]
>       }
>     ],
>     "Stop": [
>       {
>         "matcher": "",
>         "hooks": [
>           {
>             "type": "command",
>             "command": "if command -v timbers &>/dev/null && [ -d .timbers ]; then timbers hook run claude-stop; fi",
>             "timeout": 30
>           }
>         ]
>       }
>     ]
>   }
> }
> ```
>
> **2. Add pipeline context to AGENTS.md**
>
> The AGENTS.md already has an excellent 8-item orchestration checklist. Add a brief pipeline section that connects it to the DM pipeline:
>
> ```markdown
> ## DM Pipeline Integration
>
> This project follows the DM SDLC pipeline for M+ tasks:
> SPEC → CONTRACT → IMPLEMENT → GATES → EVALUATE → MERGE → POST-MERGE
>
> - `/breakdown` for decomposing epics into beads with acceptance criteria
> - Subagents use worktree isolation by default
> - Quality gate: `just check` (lint + format-check + build + test)
> - **QA verification uses Maestro, not browser-qa CDT** — this is a native iOS app. Runtime acceptance criteria should reference Maestro flows (`just smoke`, `just ui-test`). The evaluator marks browser-dependent criteria as UNTESTABLE and recommends Maestro verification.
> - Design review uses screenshots from Maestro runs or Simulator, not CDT screenshots.
> ```
>
> **3. Verify Maestro integration for evaluator compatibility**
>
> The evaluator skill now supports non-browser platforms. For this repo, ensure AGENTS.md documents:
> - How to take screenshots for design review (Maestro or Simulator)
> - Which acceptance criteria patterns are testable by Maestro vs need manual verification
> - The `just smoke` / `just ui-test` commands as the QA verification equivalents of browser-qa
>
> **4. Run `dm-work:repo-health`**
>
> After changes, run repo-health. This will flag the new DM orchestration wiring checks (Step 5.5). Address CRITICAL and IMPORTANT findings.

---

## Redshifted (gorewood/redshifted)

See the earlier prompt in this session (already provided). Key items:
1. Delete duplicated beads integration block from AGENTS.md
2. Fix skill reference prefixes (`dm-work:` → correct plugin prefixes)
3. Remove PreToolUse:Bash timbers hook (after timbers release)
4. Create ESLint tech debt beads
5. Add lint-staged MERGE_HEAD detection
6. Note: This is a WebGL game — browser-qa can take screenshots but can't assert on canvas content. Manual verification for gameplay criteria.

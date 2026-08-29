# Dark Matter Marketplace

A personal Claude Code plugin marketplace for workflows, skills, and agents that I use daily.

## Disclaimer

**This is my personal repo.** It reflects my workflows, preferences, and experiments. YMMV.

- Changes frequently, often without notice
- Often in an experimental state
- May contain half-baked ideas alongside polished tools
- Not designed for general consumption, but you're welcome to browse

If something here is useful to you, great. If not, no worries.

---

## Quick Start

```bash
# Add the marketplace
claude plugin marketplace add rbergman/dark-matter-marketplace

# Install plugins
claude plugin install dm-work@dark-matter-marketplace
claude plugin install dm-lang@dark-matter-marketplace
# ... or any other dm-* plugin

# Update after changes
claude plugin marketplace update dark-matter-marketplace
```

---

## Naming Convention

All components use the `dm-*` plugin prefix with semantic groupings:

| Plugin | Prefix | Example |
|--------|--------|---------|
| dm-arch | Architecture patterns | `dm-arch:solid-architecture` |
| dm-team | Agent Teams roles (opt-in) | `dm-team:lead` |
| dm-game | Game development | `dm-game:game-design` |
| dm-pixi | PixiJS browser games | `dm-pixi:pixi-vector-arcade` |
| dm-lang | Language expertise | `dm-lang:typescript-pro` |
| dm-work | Workflow tools | `dm-work:browser-qa` |

Commands use `/dm-work:command` format (e.g., `/dm-work:merge`).

---

## Repository Structure

```
dark-matter-marketplace/
├── plugins/           # Installable Claude Code plugins
│   ├── architecture/  # dm-arch: SOLID, data-oriented patterns
│   ├── game-dev/      # dm-game: design methodology, narrative craft, sim-first, perf
│   ├── pixi-arcade/   # dm-pixi: PixiJS 8 browser-game bootstrapping
│   ├── language-pro/  # dm-lang: Go, Rust, TypeScript, Python, just
│   ├── teams/         # dm-team: lead + teammate roles for Agent Teams sessions
│   └── workflow/      # dm-work: review, council, merge, alignment, ELI5 output style
├── references/        # Non-installable reference materials
│   ├── official-plugins.md  # Official Anthropic plugins guide
│   └── lang-skill-adaptation.md  # Adapting skills + DX testing
└── README.md
```

> **Removed in May 2026 spring cleaning:** `dm-tool` plugin (single skill `agent-dx-cli`) was deleted. If the CLI-design-for-agents content is needed again, recover it from git history (last commit before deletion).

---

## Plugins

### dm-arch (architecture/)

SOLID principles and data-oriented design patterns.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-arch:solid-architecture` | Skill | SOLID principles, composition patterns, module organization, side-effect boundaries |
| `dm-arch:data-oriented-architecture` | Skill | Registry-based dispatch, capability composition, infrastructure-first development |

### dm-work (workflow/)

Workflow tools for spec refinement, context management, and subagent delegation.

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-work:mise` | Skill | Dev tool version management — replaces nvm/pyenv/goenv, direnv integration |
| `dm-work:repo-init` | Skill | Initialize new repos with standard scaffolding — git, CLAUDE.md, justfile, mise, beads |
| `dm-work:output-compression` | Skill | CLI output compression via RTK (baseline) and tokf (per-project) — reduce build/test/git noise by 60-99% |
| `dm-work:browser-qa` | Skill | QA web apps via Chrome DevTools MCP — navigate, click, assert, screenshot, console/network checks |
| `dm-work:evaluator` | Skill | Grade work against bead acceptance criteria — separate judge from builder, with browser-qa integration |
| `dm-work:spec-shaping` | Skill | Shape a durable spec before implementing — interview to the goal, decision checkpoint, slice into beads |
| `/dm-work:spec` | Command | Run the spec-shaping protocol on a work item or bead |
| `/dm-work:handoff` | Command | Write a high-fidelity session handoff for a new session to continue the workstream |
| `/dm-work:merge` | Command | Pre-merge checklist for worktree branches — quality gates, review, beads |
| `/dm-work:post-merge` | Command | Autonomous post-merge review and evaluation — findings become beads for next-session triage |
| `/dm-work:review` | Command | Wraps native `/code-review` with beads creation, severity filtering, and a review-tag checkpoint |
| `/dm-work:triage` | Command | Triage PR review comments — accept to beads, reject with reply |
| `/dm-work:council` | Command | Convene 3-5 opposed perspectives on a decision, cross-examine, synthesize with dissent recorded |
| `dm-work:council` | Skill | The deliberation protocol — runs on subagents by default, on teammates when Agent Teams is enabled |
| `dm-work:eli5` | Output style | "Talk to me like I'm 5" — small words, short paragraphs, 2 options max ([source](https://x.com/lydiahallie/status/2080378470111256907)) |
| `/dm-work:align-steering` | Command | Modernize CLAUDE.md / AGENTS.md / SKILL.md against Claude Opus 5 prompting guidance |
| `/dm-work:align-agents` | Command | Align a repo's AGENTS.md with the dm-work reference template — diff/merge, never replace |

> Session pause/recovery uses Claude Code's native `/rewind`, `/compact`, and `/clear`. Set `autoCompactWindow` (100k–1M tokens) to make auto-compaction fire with headroom instead of at the context cliff, and `/compact <focus>` to steer what survives.

> **Removed August 2026:** `/dm-work:advice`, `/dm-work:devloop` and `/dm-work:beads-migrate`. Native `/goal`, `/loop` and the Disciplined Development Loop in global steering cover what devloop did; beads-migrate was interim and its repos are migrated. Recover from git history if needed.

### dm-game (game-dev/)

Game development skills across 27 domains. Every skill names its sources — and
says explicitly where it has none. All numeric values declare a posture under
the plugin-wide **Numbers Policy** (`skills/game-design/references/numbers-policy.md`):
source-backed, starting-value-with-test-plan, or measured-here-with-sample-and-date.

Routing lives in one place: `skills/game-design/references/routing-map.md`. Each
skill carries at most three tight links; everything else routes through the map.

**Upstream (vision → structure):**

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-game:game-vision` | Skill | Vision Stack: core fantasy, experience pillars, core loop crystallization, MVG definition |
| `dm-game:systems-design` | Skill | System interaction matrices, emergence analysis, coupling, possibility space, cursed problems (Jaffe, GDC 2019) |
| `dm-game:north-star-check` | Skill | 60-second glance and full audit of the build against the written brief |

**Design systems (structural architecture):**

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-game:economy-design` | Skill | Resource flow graphs, currency architecture, sink quality, inflation/deflation |
| `dm-game:incremental-design` | Skill | Idle/incremental math: cost curves, the wall, prestige layers, offline progress |
| `dm-game:encounter-design` | Skill | Space/adversaries/resources, translated across genres; telegraph floors; Hayashida's four beats |
| `dm-game:motivation-design` | Skill | SDT, reinforcement schedules, pity systems, loss aversion, ethical guardrails |
| `dm-game:narrative-design` | Skill | Quest structure, branching architecture, narrative as system |
| `dm-game:game-narrative-craft` | Skill | Passage-level prose: the compression rule, information-state ledger, word-count bands, AI tells |
| `dm-game:cosmic-horror-register` | Skill | Tone and diction for cosmic horror, plus the six-slot template for any register |
| `dm-game:deadpan-institutional-register` | Skill | Corporate/bureaucratic horror-comedy; worked second instance of the register template |
| `dm-game:generated-content-quality` | Skill | Saturation ledgers, quotas, underused-cell seeding — stopping content corpora from converging |
| `dm-game:simulation-first-design` | Skill | Self-playing and AI-vs-AI games: determinism, spectator readability, bot policy as instrument |
| `dm-game:async-and-social` | Skill | Ghosts, leaderboards, offline vulnerability, anti-snowball — all at a population of one |
| `dm-game:audio-design` | Skill | Audio as information system, adaptive music, spatial audio, the mute test |
| `dm-game:accessibility-design` | Skill | Four pillars, two shippable tiers, colourblind and input accessibility |
| `dm-game:data-driven-design` | Skill | Telemetry, funnels, cohorts, and the pitfalls (Goodhart, Simpson, survivorship) |

**Evaluation & tuning (mechanics → feel):**

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-game:game-design` | Skill | The hub. 5-Component Filter, Numbers Policy, debugging protocol, routing map |
| `dm-game:mechanic-ablation` | Skill | Four-stage proof that a mechanic affects outcomes at all |
| `dm-game:game-balance` | Skill | Cost curves, transitive/intransitive systems, dominant strategy detection |
| `dm-game:experience-design` | Skill | Engagement loops, the experience triangle, pacing, the dissonance test |
| `dm-game:player-ux` | Skill | Perception/attention/memory (Hodent), Gestalt UI, onboarding, developer blindness |
| `dm-game:progression-systems` | Skill | Power curves, flow channel, XP math, difficulty sandwich, unlock pacing |
| `dm-game:game-feel` | Skill | Juice checklists, feedback layers, timing reference, feel diagnostics (Swink, Nijman) |
| `dm-game:playtest-design` | Skill | Question generation, observation protocols, confirmation-bias avoidance |
| `dm-game:moment-capture` | Skill | Capture felt reactions to play verbatim, at the time |
| `dm-game:game-perf` | Skill | Zero-allocation hot paths, pooling, deferred destruction, viewport culling |

### dm-pixi (pixi-arcade/)

| Component | Type | Purpose |
|-----------|------|---------|
| `dm-pixi:pixi-vector-arcade` | Skill | PixiJS 8 bootstrapping: scaffolding, ECS-lite, fixed timestep, spatial hashing, vector/neon visual system |


## References

Non-installable materials for reference and sharing.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Global instructions — personality, prime directive, quality gates, disciplined development loop, beads guidance |
| `official-plugins.md` | Guide to official Anthropic plugins (code-simplifier, feature-dev, etc.) |
| `lang-skill-adaptation.md` | Workflow for adapting skills to new languages and DX testing them |

---

## Installation

```bash
# Add the marketplace
claude plugin marketplace add rbergman/dark-matter-marketplace

# Update marketplace index
claude plugin marketplace update dark-matter-marketplace

# Install plugins
claude plugin install dm-arch@dark-matter-marketplace
claude plugin install dm-game@dark-matter-marketplace
claude plugin install dm-lang@dark-matter-marketplace
claude plugin install dm-team@dark-matter-marketplace
claude plugin install dm-work@dark-matter-marketplace
```

---

## Philosophy

Core ideas (see `~/.claude/CLAUDE.md` for the full Disciplined Development Loop):

1. **Gall's Law** — Always grow complexity from a simple system that already works. Minimal slices first; speculative architecture last.
2. **Quality gates are sacred** — Pre-existing failures are still our problem. "Already broken" is not an excuse.
3. **Delegate when useful** — Spawn subagents for parallel work or fresh context. With Agent Teams enabled, a *named* subagent launches as a teammate that can talk to its peers — worth it only when cross-examination is the point (`dm-team`). Otherwise work directly; 1M context handles most tasks.
4. **External state via beads** — `bd` survives session boundaries; conversation context doesn't.
5. **Review is non-negotiable** — Any substantive implementation gets an independent review pass before close; the implementer owns the fixes.

### Developer Experience (DX)

The plugins include opinionated DX tooling that works together:

| Tool | Skill | Purpose |
|------|-------|---------|
| [mise](https://mise.jdx.dev) | `dm-work:mise` | Version management for all languages/tools — replaces nvm, pyenv, goenv |
| [just](https://just.systems) | `dm-lang:just-pro` | Command runner — consistent `just check`, `just setup` across projects |
| [RTK](https://rtk-ai.app) + [tokf](https://tokf.net) | `dm-work:output-compression` | CLI output compression — RTK for global baseline, tokf for per-project customization |

**The pattern**: Projects have a `.mise.toml` (pinned versions) and `justfile` (commands). Setup is always `just setup` → runs `mise trust && mise install` + language deps. This ensures reproducible environments without requiring devs to configure their shells.

### Beads

[Beads](https://github.com/gastownhall/beads) is the issue tracking CLI I use, and it appears throughout these plugins. It's a critical part of my workflow — providing external state that survives session boundaries, enabling orchestrators to track progress across compactions, and giving subagents clear work items to implement.

References to `bd` CLI, bead IDs (like `whiteout-4eed`), and bead states (`ready`, `claimed`, `done`) appear in many skills and agents. If you're not using beads, you can substitute your own issue tracking system or ignore those references.

---

## License

Do whatever you want. No warranties, no support, no guarantees.

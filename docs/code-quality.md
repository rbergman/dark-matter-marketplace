# Code Quality, the way I run it

This is the writeup people ask me for. The short version: **I don't write the
standards down as prose and hope code follows them — I encode them as gates a
machine enforces, and the agent (Claude or whatever) literally cannot declare a
task done until it's green.** This doc is a guided index into that machinery.
The skills and configs it links are the source of truth; if they ever disagree
with this page, they win.

## The idea in one paragraph

Reproducible toolchain (`mise`) → one control plane (`just`) → strict
type/lint/complexity/coverage gates → git hooks that block the commit if
anything's red → a structured dev loop with a mandatory review phase. Nothing
here is novel on its own. What's deliberate is the **strictness level** (higher
than any enterprise dev env I've worked in) and the fact that it's
**deterministic**: the same `just check` runs on my laptop, a teammate's, an
agent's subprocess, and CI, and they all pass or fail identically. Quality stops
being a matter of taste or vigilance and becomes a thing that's either green or
it isn't.

Think of it as an **immediate, local CI run** the agent hits on every commit —
it forces Claude to reach the quality bar before moving on, instead of
accumulating tech debt that compounds. Drift is one of the top enemies of
productivity in high-speed agentic engineering; this is the brake.

## Why most setups don't ship this

Default `claude init` scaffolds and public starter templates almost never
include gates this strict, and that's a rational choice **for humans** — every
gate adds friction at human typing speed and can dent productivity. But Claude
operates fast enough that the friction is nearly free, and the payoff is
long-horizon: the codebase stays clean and maintenance-ready, which keeps *every
future* change cheap. At agent speed, strict-by-default produces better results
at a pace human operators still find entirely acceptable.

## What "quality gate" actually means here

Point this config at an existing codebase and you get a number — for one
mid-size TypeScript/React repo it was **699 lint findings** cold. That number
isn't nagging; every finding is one of a handful of classes, ranked by how much
real bug-signal it carries:

| Family | What it catches | Signal |
|--------|-----------------|--------|
| Type safety (`no-explicit-any`, `no-unsafe-*`, `no-non-null-assertion`) | `any`/cast drift, runtime values trusted without a guard | High |
| Nullable/boolean correctness (`strict-boolean-expressions`, `no-unnecessary-condition`) | the classic `{count && <X/>}` renders-a-literal-`0` bug; guards the types say can never fire (dead code, or the type is lying) | **Highest** |
| Promises (`no-floating-promises`, `no-misused-promises`) | fire-and-forget async, unhandled rejections | High |
| Complexity / size (below) | functions and files that have outgrown a single responsibility | Architectural |
| Boundary types (`explicit-module-boundary-types`) | unstated public contracts | Policy call |

Type and lint aren't the whole gate. Every language template wires a **coverage
floor** (70%) straight into the `check` recipe alongside the test run — so
"done" means typed, linted, tested, *and* covered. Bump the threshold per
project; 70% is the floor, not the ceiling.

The complexity family is the part most enterprise setups don't push as hard on:

| Limit | Value | Why |
|-------|-------|-----|
| `max-len` | 120 | hard line-length cap (Prettier formats to 100; this also blocks line-combining) |
| `max-lines` | 400 | no god modules (comments excluded) |
| `max-lines-per-function` | 60 | single responsibility |
| `complexity` | 10 | cyclomatic — branching paths |
| `sonarjs/cognitive-complexity` | 15 | cognitive — perceived difficulty |
| `max-depth` | 4 | no arrow code |
| `max-params` | 4 | use an options object |

Two things make these limits a design tool rather than a straitjacket:

- **They're extraction signals, not compression targets.** A function over 60
  lines means *decompose by responsibility* — extract named functions, split
  into a companion module. It does **not** mean shorten the variable names or
  jam statements onto one line — `max-len` (120) errors on the over-long line,
  and Prettier (`printWidth: 100`) reformats combined lines straight back, so
  that dodge buys nothing. And the critical rules can't be silenced with an
  ad-hoc `eslint-disable` (the disable itself is linted).
- **Tests get a relaxed profile**, and there's a deliberate exceptions path for
  the rest. The point is to make the easy thing correct, not to make every file
  pass at any cost.

The complexity limits do quiet long-horizon work too: they keep the agent from
building stovepipe and blob structures that block concurrent development, bloat
the tokens needed to load a file into context, and pile up the dev-time friction
that otherwise slows a project as it grows.

## The dev loop and the review phase

The gates catch what's mechanically checkable. The other half is process: every
substantial change moves through a structured loop — intake → orient → plan →
implement → validate → **gate** → **review** → maintain context → re-align →
handoff. The
review phase is non-negotiable and independent of the author, because gates and
review catch different classes of problem; a green build is not a reviewed one.
It's the step that most reliably catches significant issues and forces Claude to
converge on correctness before closing a line of work.

- [repo-init AGENTS.md](../plugins/workflow/skills/repo-init/references/AGENTS.md) — the loop and the "independent review is non-negotiable" rule, as scaffolded into every repo
- [`/dm-work:review`](../plugins/workflow/commands/review.md) — parallel architecture/code/security/design reviewers on a diff
- [`/dm-work:devloop`](../plugins/workflow/commands/devloop.md) — runs the loop (review included) as the Definition of Done for each queue item
- [`/dm-work:merge`](../plugins/workflow/commands/merge.md) — pre-merge checklist that confirms gates + review + tracking are all complete
- [evaluator](../plugins/workflow/skills/evaluator/SKILL.md) — grades finished work against acceptance criteria with a separate judge agent

## Where the real thing lives

**Language standards** (`plugins/language-pro/`) — the per-language version of
all of the above:

- [typescript-pro](../plugins/language-pro/skills/typescript-pro/SKILL.md) — strict TS, zero-`any`, the lint families and limits in this doc. The canonical config it copies: [`eslint.config.js`](../plugins/language-pro/skills/typescript-pro/references/eslint.config.js), [`tsconfig.strict.json`](../plugins/language-pro/skills/typescript-pro/references/tsconfig.strict.json)
- [python-pro](../plugins/language-pro/skills/python-pro/SKILL.md) — uv, ruff, pyright, strict typing
- [go-pro](../plugins/language-pro/skills/go-pro/SKILL.md) · [rust-pro](../plugins/language-pro/skills/rust-pro/SKILL.md)
- [just-pro](../plugins/language-pro/skills/just-pro/SKILL.md) — the `just` control plane (discoverable to agents and humans alike: one `just` lists every gate); [recipe templates](../plugins/language-pro/skills/just-pro/references/) per language and for monorepos

**Setup & control plane** (`plugins/workflow/`) — how a repo gets this wired in:

- [repo-init](../plugins/workflow/skills/repo-init/SKILL.md) — one pass to scaffold git, `.gitignore`, AGENTS.md, justfile, mise, beads, timbers
- [mise](../plugins/workflow/skills/mise/SKILL.md) — reproducible tool/runtime pinning without the weight of Docker for local dev
- [output-compression](../plugins/workflow/skills/output-compression/SKILL.md) — keep gate output from drowning the agent's context

**Architecture** (`plugins/architecture/`) — what "extract by responsibility"
should extract *toward*:

- [solid-architecture](../plugins/architecture/skills/solid-architecture/SKILL.md) · [data-oriented-architecture](../plugins/architecture/skills/data-oriented-architecture/SKILL.md)

## Is all of this necessary?

For a foreign codebase you're just contributing to, some of it is negotiable —
the boundary-types call alone swings that 699 by ~170, and the models and
harnesses got good enough that a few of these gates earn less than they used to.
But the high-signal families (nullable correctness, the `as`-cast holes,
floating promises) catch real latent bugs, not taste. And the complexity limits
keep paying out regardless — they're what stops Claude from quietly building the
stovepipe and blob structures that throttle a project later. So as a guest in
someone else's repo I'd relax some of the ceremony; on my own projects I keep
the whole thing.

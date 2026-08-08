---
name: simulation-first-design
description: "Design for games whose primary loop runs without a human input: self-playing simulations, AI-versus-AI matches, autonomous world sims, spectator games, and any game balanced by a bot rather than a playtester. Use when the game plays itself or has zero human seats, when balancing via simulation runs instead of playtests, when deciding what a spectator needs to see, when a sim's output is unreproducible, or when a bot's clear rate is being treated as evidence about human play. Covers determinism and seeding as design requirements, spectator readability as the real UX surface, bot policy as the balance instrument and its blind spots, legibility of autonomous decisions, and what replaces playtesting when nobody plays."
---

# Simulation-First Design

**Purpose:** Design and balance games where the loop runs without a human in it —
and know what that costs you in evidence.

**Sources:** No canonical design text covers this; the practice is scattered.
Determinism and lockstep replay are standard RTS engineering (see any Age of
Empires or StarCraft networking postmortem). Self-play as a balance instrument
is established in reinforcement learning (Silver et al. on AlphaGo/AlphaZero;
OpenAI Five; DeepMind's AlphaStar league) and the *league* structure there —
deliberately diverse opponent policies to prevent overfitting to one strategy —
is the transferable idea. Everything else below is generalised from working
implementations rather than cited, and its thresholds are posture B under the
Numbers Policy. Treat this skill as a practice being written down, not as
received wisdom.

---

## The evidence problem, first

A simulation is an instrument, and every instrument has a blind spot. State it
in the same breath as the result — always, without being asked.

> Clear rate 24/24.

is not a result. This is:

> Clear rate 24/24, from a bot that never retreats, never repositions, and never
> conserves a resource for later.

**A metric that did not move is not evidence of no effect** until the instrument
has been shown capable of detecting that class of effect. When a change produces
no movement in the sim, the first hypothesis is that the bot cannot express the
behaviour the change affects — not that the change was inert. See
**mechanic-ablation** for the four-stage procedure that tests this properly.

### What a bot cannot see

Enumerate this list for your own bot and keep it beside the results:

| The bot cannot detect | Because |
|---|---|
| Whether anything is **legible** | It reads state directly; it never parses the screen |
| Whether anything is **satisfying** | It has no affect |
| **Pacing** and fatigue | It does not get tired, bored, or tilted |
| **Learning curve** | It arrives fully competent, or fully incompetent, and never moves |
| Whether a choice was **interesting** | It evaluates; it does not deliberate |
| **Surprise** | It has no expectations to violate |

Every one of those is a design property. A sim-tuned game can be numerically
excellent and unplayable, and the sim will never say so.

---

## Determinism is a design requirement, not an implementation detail

If the same seed does not produce the same run, you do not have an instrument.
You have an anecdote generator. Everything else in this skill depends on this,
so build it first — retrofitting determinism into a running sim is one of the
most expensive things you can do.

**The contract:**

- One explicit RNG, seeded, threaded through the sim. Never a global.
- No wall-clock time, no ambient randomness, no iteration over unordered
  collections whose order can vary between runs.
- Fixed timestep. Variable delta makes physics and AI decisions
  frame-rate-dependent, which makes runs unreproducible on different hardware.
- Float determinism if runs must reproduce across platforms — or integer/fixed
  point, which is why lockstep RTS engines historically used it.
- The seed is recorded with every result, and a result without its seed is
  discarded.

**Test:** run the same seed twice and diff the full event log, not the outcome.
Two runs that reach the same result by different paths are non-deterministic and
will diverge on the run that matters.

### What determinism buys beyond reproducibility

- **Replay as a first-class artifact** — store a seed and an input list instead
  of a video.
- **Bisecting a balance regression** — same seed before and after the change
  isolates the change.
- **Daily-seed social features** for free — see **async-and-social**.
- **Bug reports that reproduce**, which for an autonomous sim is the difference
  between debuggable and not.

---

## Spectator readability is the real UX surface

In a self-playing game the player is a spectator, and spectating is the entire
experience. This inverts the usual UX priority: **legibility of what the system
just decided outranks everything, because it is the only thing the player gets.**

Four questions, in order:

1. **State** — can a viewer tell who is ahead, at a glance, without a tooltip?
2. **Change** — when the situation shifts, is the shift visible at the moment it
   happens? A swing the viewer learns about from a number that was already
   different is not a swing, it is a fact.
3. **Cause** — can the viewer attribute the change to a decision? "Red collapsed"
   is an event. "Red collapsed because it committed reserves to the south" is a
   story.
4. **Stakes** — does the viewer know what would have to happen for this to matter?

**Test:** show a viewer thirty seconds of the sim with no explanation and ask who
is winning and why. If they cannot answer both, the sim is running correctly and
communicating nothing. This is the sim equivalent of the five-second test in
**player-ux**, and it fails far more often, because the developer reads the state
directly and cannot see what the screen omits.

### Making autonomous decisions legible

An agent's decision is invisible unless the design makes it visible. Options, in
increasing cost:

- **Announce the decision, not just the outcome.** A one-line log with the agent,
  the choice, and the reason is the cheapest large win available.
- **Show the road not taken.** The alternative that scored second tells the
  viewer there was a decision at all.
- **Telegraph before committing.** A visible windup on an autonomous action gives
  the viewer time to form an expectation — which is a precondition for surprise.
- **Persist the trace.** A history the viewer can scrub converts a stream of
  events into a narrative they can reconstruct.

---

## Bot policy is the balance instrument

The bot is not a stand-in for a player. It is a measuring device, and its policy
determines what the measurement means. A single bot policy measures one thing:
how the game behaves against that policy.

**Rule: never balance against one policy.** A single-policy sim overfits — the
design becomes tuned to defeat exactly that bot, and the tuning does not transfer.
This is the league idea from self-play RL, and it is the transferable part.

Build a small deliberately-diverse set:

| Policy | Purpose |
|---|---|
| **Greedy** | Takes the locally best action always. Finds dominant strategies fastest. |
| **Random-legal** | Establishes the floor. Anything a random policy clears is not a challenge. |
| **Specialist** | Commits hard to one strategy. Reveals whether counters actually counter. |
| **Conservative** | Never takes risk. Exposes whether risk is ever correctly rewarded. |
| **Adversarial** | Written specifically to break the current tuning. The most valuable and the one usually skipped. |

**Diagnostic:** if all policies produce similar outcomes, either the game has no
strategic depth or the policies are not actually diverse. Check the second before
concluding the first — writing five bots that are secretly the same bot is easy.

**Test:** the spread between best and worst policy is your depth signal. If greedy
and random-legal clear at similar rates, the decisions in between do not matter,
and **mechanic-ablation** will tell you which of them to cut.

---

## What replaces playtesting

Playtesting is not optional here; it changes target. You still need humans, but
you are asking them different questions.

| Traditional playtest asks | Sim-first asks a human |
|---|---|
| Is this fun to play? | Is this **interesting to watch**? |
| Was that fair? | Was that **comprehensible**? |
| Could you do it? | Could you **predict** it, even loosely? |
| Would you play again? | Would you **leave it running**? |

The last one is the retention question for a self-playing game, and it has no
analogue in conventional playtesting.

**Run these with a real human and no explanation from you.** The developer-blindness
problem in **player-ux** is worse for sims, not better: you know the state model,
so you literally cannot see the screen as an uninformed viewer does.

For felt reactions, capture them verbatim as they happen — see **moment-capture**.
"I stopped watching around minute four" is the single most valuable datum a
self-playing game can collect, and it evaporates if not written down at the time.

---

## Sim-as-instrument vs. sim-as-product

These pull in opposite directions and it is worth knowing which you are building,
because the same code cannot serve both without a decision.

| | Sim as instrument | Sim as product |
|---|---|---|
| Optimised for | Runs per second, statistical power | Legibility, pacing, drama |
| Wants | Headless, no rendering, no delays | Rendering, deliberate pacing, telegraphs |
| Correct bot | Whatever isolates the variable | Whatever produces interesting play |
| Success | The number moves and you know why | Someone leaves it running |

**Rule: keep the headless core pure and put presentation strictly outside it.**
A single deterministic reducer with no rendering, no timers and no I/O serves both
— the instrument runs it at speed, the product renders it. The moment presentation
concerns leak into the core, the instrument stops being trustworthy and the
product stops being tunable.

---

## Cross-references

- **mechanic-ablation** — the four-stage procedure for proving a mechanic affects
  outcomes; this skill supplies the instrument, that skill supplies the method
- **game-balance** — cost curves and dominant-strategy detection, which a sim
  can search far faster than a playtest
- **async-and-social** — determinism is what makes daily seeds and replays possible

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **mechanic-ablation** — The procedure you run on the instrument
- **game-balance** — What the sim is searching for
- **async-and-social** — Determinism buys seeds, replays and ghosts

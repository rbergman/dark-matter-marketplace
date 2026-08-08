---
name: async-and-social
description: "Social and competitive design that does not require players to be online together: ghost/replay data, leaderboards, asynchronous PvP, offline vulnerability, and anti-snowball mechanics. Use when adding leaderboards or high-score tables, designing ghost races or replay challenges, letting players attack or compete against absent opponents, deciding what social signal a single-player game should carry, or when matches and runs feel decided in the first minutes. Anti-snowball applies to single-player roguelikes and simulations too, not just PvP. For real-time multiplayer architecture, matchmaking, guilds, and moderation, this skill deliberately does not cover them — those are large specialities and belong in dedicated references."
---

# Async and Social

**Purpose:** Get the retention and meaning benefits of other players without the
cost of real-time multiplayer — and stop early leads from deciding outcomes.

**Scope note.** This skill was cut down from a broad multiplayer-design skill.
Skill-based matchmaking, guild systems, voice/text moderation, anti-toxicity
programmes and esports operations were removed rather than summarised: each is a
speciality where a paragraph of advice is worse than none, and none of them is
reachable without a live population. If you are building real-time multiplayer,
this skill will not be enough and should not be treated as a starting point.

---

## Asynchronous interaction

Async multiplayer solves the scheduling problem — your players are never online
at the same time — while keeping the social signal that drives retention. It is
almost always the right first social feature for a small team, because it has no
population floor: it works with one player and a database.

| Form | What it is | Works when |
|---|---|---|
| **Ghost / replay** | A recording of another run, raced against live | The game is time- or score-scored and deterministic enough to replay |
| **Async PvP** | AI plays another player's loadout, team, or build while they are away | Loadout choice is a meaningful part of play |
| **Challenge sharing** | Players author a seed, a constraint, or a layout for others | The game has a seedable generator |
| **Passive presence** | Other players' names, marks, or traces appear in your world | Even a small population; the illusion is cheap and durable |

**Design rule: ghost data should read as a person, not a recording.** Carry the
name, the cosmetic, the moment they failed. A ghost that is just a fast line is
a benchmark; a ghost that stumbles where you stumbled is an opponent.

*Heuristic, not sourced.* Test it: show players two ghosts, one with identity
signals and one without, and ask which they wanted to beat.

---

## Leaderboards

The default global all-time leaderboard is the worst option and the one everyone
ships first. It is aspirational for the top 0.1% and demoralising for everyone
else, and it stagnates — the top entries stop changing and the board stops being
a reason to return.

| Type | Strength | Failure mode |
|---|---|---|
| Global all-time | Clear hierarchy | Stagnates; irrelevant to almost everyone |
| Time-limited (daily / weekly / seasonal) | Fresh competition, a reason to return | Rewards grind over skill unless the window is short |
| Segmented (friends, region, skill band) | Achievable, relevant | Prestige fragments across boards |
| Relative (top X%) | Every player can move their number | Less legible than a rank |

**Rule: layer them, and put the most local one first.** Friends, then
percentile, then global. Most players are motivated by beating someone they
know, not by being first in the world.

**Rule: a leaderboard needs a reset horizon.** If the board can never change at
the top, it has stopped being a system and become a monument. Pick the window
before you ship the board.

### The seed-sharing shortcut

If the game has a seedable generator, a shared daily seed gives you the whole
social layer for almost nothing: everyone plays the same run, scores are
comparable without matchmaking, and the board resets itself every day. This is
the highest ratio of social value to engineering cost available to a solo
developer, and it requires determinism — see **simulation-first-design**.

---

## Offline vulnerability

If a player's assets can be attacked while they are away, the design owes them
guardrails. Without them, the mechanic is a churn generator: the loss lands
without the player present to contest it, which is the worst possible ratio of
felt punishment to agency.

- **Shield window** after login or logout
- **Automatic defence** — structures or AI that act on the player's behalf
- **Attack rate limits** per target, not just per attacker
- **Recoverable losses** — never below a floor the player can climb back from
- **Notification** so the player learns about it from you, not from the wreckage

**Rule: a player who sleeps should not wake up to nothing.**

---

## Anti-snowball

Snowballing is when an early advantage compounds into an unrecoverable lead.
**This is not a multiplayer-only problem** — it appears in roguelike runs, in
4X games, in economic sims, and in any system with a positive feedback loop on
resources. It is included here because competitive play surfaces it first and
most brutally.

Some snowball is necessary: if an early advantage does not matter, the early
game does not matter. The failure is *unchecked* snowball, where the outcome is
determined long before the match or run ends.

**Diagnostic:** if more than ~30% of matches or runs feel decided in the first
quarter, you have a snowball problem. Track surrender rate, early quit rate, and
the point in the timeline at which the eventual winner takes a lead they never
lose. *This 30% figure is a working threshold, not a sourced benchmark — replace
it with a number measured on your own game as soon as you can.*

| Lever | Mechanism | Cost |
|---|---|---|
| **Comeback bonus** | Trailing side gets more resources, faster respawn, objective value | Can feel unearned if visible |
| **Rubber-banding** | Advantage scales inversely with lead | Feels like cheating the moment players notice it |
| **Phase reset** | New stage partially neutralises positional advantage | Can erase earned advantage wholesale |
| **Resource cap** | Ceiling on accumulated advantage | Blunt; punishes the skilled as well as the lucky |
| **Risk escalation** | Closing out requires the leader to take risk | Best of the five — preserves earned advantage while re-opening the outcome |

**Prefer risk escalation.** The other four take the lead away from the player who
earned it; risk escalation makes them spend it. This is the same principle as
`economy-design`'s *positive feedback for skill, negative feedback for time*.

**Test:** plot the eventual winner's advantage over match time across many
matches. If the curves diverge and never cross after the first quarter, no
comeback path exists regardless of what the design document claims.

---

## What a single-player game should take from this

Most games in a small portfolio have no multiplayer and still want the social
signal. In rough order of value per unit of work:

1. **A daily seed and a score board.** Determinism plus a date. No accounts
   required if scores are local.
2. **Ghosts of the player's own past runs.** All the tension of competition,
   zero population requirement, and it makes improvement legible — which is the
   Competence need in **motivation-design**.
3. **Shareable run summaries.** A seed, a score, and a one-line result the
   player can paste. Distribution for free.
4. **Passive presence.** Names, marks, traces. Cheapest illusion of company
   in games, and durable.

Everything above works at a population of one. Anything requiring simultaneous
players does not, and a social feature that needs a crowd you do not have is a
dead feature that still costs maintenance.

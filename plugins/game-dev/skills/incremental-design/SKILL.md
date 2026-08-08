---
name: incremental-design
description: "Idle, incremental, and clicker game design: exponential cost curves, growth-rate ratios, prestige and reset layers, offline progress, unlock cadence, and the wall. Use when building an idle or incremental game, adding an idle or offline layer to another genre, designing a prestige or ascension reset, tuning how fast numbers grow, when progress stalls into grind, or when a satirical or spoof idle game still needs to actually work as one. Also covers the incremental layer inside non-idle games — upgrade ladders, passive income, and any system where the player's job is to make a number go up."
---

# Incremental Design

**Purpose:** Make a number go up in a way that holds attention for weeks, and
know which of the three or four levers is actually doing the work.

**Sources:** Anthony Pecorella's GDC talks on idle games ("Idle Games: The
Mechanics and Monetization of Self-Playing Games," 2016, and subsequent years)
remain the only substantial public data on the genre — retention curves,
progression pacing, and the economics. Cost-growth conventions below are genre
practice observable in shipped games (*Cookie Clicker*, *Adventure Capitalist*,
*Universal Paperclips*, *Kittens Game*) rather than published findings. Specific
ratios are posture B under the Numbers Policy: starting values with tests, not
benchmarks.

---

## The core identity

An incremental game is two exponentials in tension.

```
production(n)  grows with the number of things you own
cost(n)        grows with the number of things you own
```

Everything the player experiences — momentum, stall, the satisfying click of a
new tier — is the relationship between those two curves. If you can only tune one
thing, tune this.

**The convention:** cost grows geometrically per unit purchased.

```
cost(n) = base × r^n        with r typically 1.07 – 1.15
```

At `r = 1.15`, each purchase is 15% more expensive than the last, and the tenth
costs roughly four times the first. Lower `r` means faster accumulation and a
shorter game; higher `r` means the wall arrives sooner.

**Test:** compute time-to-next-purchase across the first fifty purchases of each
generator. If the curve is flat, the game has no shape. If it grows monotonically,
the player is decelerating and will stop. What you want is a **sawtooth** —
deceleration within a tier, reset by unlocking the next one.

That sawtooth is the whole game. Everything below is a way of producing it.

---

## The wall, and why it is the design

Every incremental game reaches a point where the next purchase costs more time
than the player will spend. This is not a bug to be tuned away — it is the
mechanism that makes the reset feel like relief rather than punishment.

**Design the wall deliberately:**

- Know roughly when it arrives. Model it; do not discover it in the wild.
- Make it **visible before it is felt** — the player should see the number
  getting slower, not just experience waiting.
- Have the escape ready *at* the wall, not past it. A player who hits the wall
  with no visible next move quits; a player who hits it with a glowing prestige
  button resets.

**Failure mode:** a wall with no escape reads as the game ending. A wall with an
escape reads as a new chapter. Same numbers, opposite outcome.

---

## Prestige and reset layers

The reset is what turns a curve into a genre. The player surrenders progress for
a permanent multiplier and does the same curve again, faster.

| Property | Guidance |
|---|---|
| **What resets** | Almost everything. A reset that keeps too much has no stakes. |
| **What persists** | The prestige currency, unlocks that gate content, and any "you learned this" knowledge. |
| **Reward shape** | Sub-linear in progress — commonly `prestige_gain ∝ sqrt(total_earned)`. Linear rewards make late resets strictly dominant and collapse the decision. |
| **First reset timing** | Early. Hours, not days. The first prestige teaches the core loop of the whole game; burying it means most players never see what the game is. |
| **Speed after reset** | The replay should be dramatically faster — a large multiple, not a small percentage. The feeling being sold is "I am tearing through what took me all day." |

**The decision the reset must create:** reset now for a smaller bonus, or push
for a larger one? If the answer is always obvious, the layer is a timer rather
than a choice. A sub-linear reward curve is what keeps it genuinely uncertain.

**Layer count.** Most successful incrementals add a second reset layer above the
first, and some a third. Each new layer buys renewed engagement at the cost of
comprehensibility. **Test:** can a player explain what the new currency is for in
one sentence? If not, the layer is complexity, not depth — see the complexity
budget in **player-ux**.

---

## Offline progress

The genre's defining contract: the game runs while you are gone.

| Decision | Options | Consequence |
|---|---|---|
| **Rate** | Full, or a fraction of active rate | Full offline removes any reason to have the tab open; a fraction makes active play meaningful |
| **Cap** | Hours of accumulation before it stops | Uncapped rewards absence over play; too short punishes sleep |
| **Presentation** | A summary on return, or silent credit | The welcome-back summary is a genuine retention moment and is usually under-designed |

**Rule: offline progress must never exceed active progress per unit time.** The
moment it does, the optimal play pattern is to close the game, and the player
who works that out stops being a player.

**The return moment matters more than the rate.** A player coming back after
eight hours should get a legible summary of what happened, what changed, and what
is newly affordable. This is the single highest-leverage screen in an idle game
and it is routinely a number appearing silently in a counter.

---

## Unlock cadence

Number-going-up alone sustains attention for well under an hour. What sustains it
for weeks is the arrival of **new mechanics**, not bigger numbers.

- Something new — generator, mechanic, currency, tab — should arrive well before
  the current one is exhausted. *Starting value: while the player still has 20-30%
  of the current tier's content ahead of them. Test: instrument the gap between
  the last new-thing and the session end; if quits cluster in that gap, the
  cadence is too slow.*
- **New tabs beat new tiers.** A tenth generator is a bigger number. A new tab is
  a new game.
- Front-load hard. The first session must show the player at least two "oh, there's
  a whole other thing here" moments, or there is no second session.

**Test:** plot unlocks against time. If the gaps grow faster than the player's
investment, that is the wall arriving without a reset ready.

---

## Satire still has to work

An incremental game that spoofs the genre is not exempt from the genre's
mechanics. If the curves are bad, the joke has nothing to sit on: the player
leaves before the punchline lands, and the satire is experienced as the flaw it
was parodying.

**Rule: the joke is the theme, never the tuning.** Build the sawtooth, the wall,
the reset and the unlock cadence exactly as if you were sincere. Then write the
flavour text deadpan. *Universal Paperclips* is the reference case — a genuinely
excellent incremental game whose subject happens to be the horror of optimisation.

The corollary: **never explain the joke in the numbers.** A deliberately bad
curve as a gag is indistinguishable from a bad curve.

---

## Diagnostics

| Symptom | Likely cause | Check |
|---|---|---|
| "It's boring after ten minutes" | No unlock cadence; only numbers grow | Plot unlocks against time |
| "I hit a wall and quit" | Wall arrived before the reset was available or visible | Model time-to-next-purchase; find where it crosses the patience threshold |
| "The reset felt bad" | Reward too small, or too much was kept | Compare post-reset speed to pre-reset; it should be a large multiple |
| "I don't know what to buy" | Generators are not differentiated | If the optimum is always "the newest one", the earlier ones are decoration |
| "Optimal play is to not play" | Offline rate ≥ active rate | Compare the two directly |
| Numbers are meaningless | Growth outran notation before it outran content | Introduce scientific notation *before* the player needs it, not after |

---

## Cross-references

- **economy-design** — sources, sinks, and the flow graph; an incremental game is
  an economy with the combat removed
- **progression-systems** — power curves and the flow channel; this skill is that
  skill's math applied where progression *is* the game
- **motivation-design** — the Zeigarnik effect and variable-ratio schedules are
  doing most of the psychological work here, and its ethical guardrails apply
  with particular force to a genre built on compulsion

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **economy-design** — Sources, sinks, and the flow graph
- **progression-systems** — Power curves and the flow channel
- **motivation-design** — Ethical guardrails apply with force here

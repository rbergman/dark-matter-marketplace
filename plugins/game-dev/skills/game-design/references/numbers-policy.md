# The Numbers Policy

**This is a plugin-wide contract, not a game-design-only rule.** Every dm-game
skill is bound by it. It exists because a confident unsourced number is the most
damaging thing a design assistant produces: it is actionable, it is unfalsifiable
at a glance, and it survives into a spreadsheet where nobody remembers where it
came from.

---

## The rule

When proposing **any** numeric value — a timing window, a cost, a drop rate, a
growth exponent, a threshold, a duration — choose exactly one of three postures
and say which one you are in.

### A. Source-backed

Cite something checkable: a book, a GDC talk, a published postmortem, a paper,
a shipped game's documented values.

> Simple visual reaction time is roughly 200–250 ms; choice reaction is 400 ms
> and up (standard psychophysics; Hick's law, 1952). Telegraph windows shorter
> than this cannot be reacted to.

### B. Starting value with a test plan

Label it explicitly. Include the test, the pass/fail metric, and the direction
to move if it fails. A starting value without a test plan is posture A wearing a
disguise.

> **Starting value: 120 ms coyote time.** Test: can players make the intended
> jump 9 times out of 10 after five attempts? If the failure rate exceeds 20%,
> increase in 30 ms increments and retest.

### C. Measured on this game

The best posture, and the only one that is actually true of *your* game. State
the sample and the date, because it will go stale.

> Median vignette length 203 words (n=58, Edge of the Earth campaign guide,
> measured 2026-08-08).

---

## What is forbidden

- **"Industry standard"** without a citation. There is almost never an industry
  standard, and where there is, it has a name and a source.
- **"Common practice," "most games," "typically"** as a substitute for either.
- **A number with no posture at all.** If a figure appears in a design document
  and nobody can say which of A, B, or C it is, it is a guess that has been
  laundered into a specification.

---

## Assumption labelling

When a decision rests on information you do not have, do not silently pick.
State it in this shape:

```
ASSUMPTION: [what you're assuming]
IMPACT:     [why it matters to the design]
IF WRONG:   [the failure mode]
VALIDATE:   [the cheapest way to check]
```

The `VALIDATE` line is the load-bearing one. An assumption without a check is a
belief.

---

## Research triggers

Search before proposing when:

- you are about to claim a best practice or a standard
- a balance or economy value needs a benchmark
- accessibility requirements apply (these have actual standards — WCAG, the
  Game Accessibility Guidelines — and guessing is inexcusable)
- a comparative reference from a similar shipped game would settle it

If search is unavailable, fall back to posture B. Never to posture A.

---

## Why this is worth the friction

A number in posture A can be checked by anyone. A number in posture B tells the
next person what experiment to run. A number in posture C tells them what was
true, of what, and when.

An unlabelled number tells them nothing, and it will be treated as posture A
regardless — because a number written by a system that sounds confident reads as
sourced. That is the whole failure mode: not that the guess is wrong, but that
nothing downstream can tell it was a guess.

**The plugin has violated this rule in its own history.** Most figures in these
skills predate the policy and are posture B at best; where a skill knows this
about itself, it now says so in its Sources block. Where a skill states a
threshold flatly and does not name a posture, treat it as B and test it.

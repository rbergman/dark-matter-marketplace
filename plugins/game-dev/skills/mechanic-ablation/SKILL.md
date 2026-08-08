---
name: mechanic-ablation
description: Determine whether a game mechanic, displayed value, or currency actually affects outcomes, via a four-stage ablation: exercise, sensitivity, ablate, verdict. Use when asked whether a mechanic matters or earns its place, when a change produces no measurable effect on the balance board or sim, when considering cutting a system, or as a routine pass before a milestone. Requires a headless sim of the real loop, seeded determinism, and a bot/policy set. Guards against the common wrong conclusion that an unchanged metric proves a mechanic is inert.
---

# mechanic-ablation

**Fires when** asked whether a mechanic matters, when a change produces no measurable effect on the board, or as a routine pass before a milestone.

**Requires** a headless sim of the real loop, seeded determinism, and a policy/bot set. All four surveyed projects already have these.

**Sources:** Ablation as a method is borrowed from experimental science and from
machine learning, where removing a component to measure its contribution is
standard. Its application to game mechanics here is this plugin's own framing,
developed against working simulations. Every threshold is posture B under the
Numbers Policy in **game-design**.

---

## Why

Ablation found a dead mechanic in all four projects: flasks (removing the entire system changed 1 seed in 24), the lantern (`lanternWard: 1` silently zeroed a whole upgrade line), `tribe.goal` (displayed to the player as intelligence, read by nothing that decides movement), radar countermeasures (present in no shipped archetype). Highest-yield technique available, ad-hoc in every project.

It is also the technique most likely to produce a confident wrong answer, because **"no change" has four causes and only one of them is "the mechanic is inert."** One project nearly misread it three times in a single session.

## Procedure

Run in order. Stop at the first stop condition. Do not skip to stage 3.

### Stage 1 -- Exercise

Does any policy actually use this mechanic? Report usage per policy, as a number, not a yes/no.

> **STOP: UNEXERCISED.** If usage is zero across all policies, this is a finding about the test suite, not the mechanic. Do not proceed. Do not report the mechanic as inert or as a removal candidate. Write a policy that uses it, then start over from stage 1.

TIMBERWOLF's Nightflesh line read 0.00 across all 11 policies. It was not dead. Nobody bought it. Those are opposite findings with opposite remedies.

### Stage 2 -- Sensitivity

Before removing anything, prove the instrument can see this class of effect. Apply a deliberately absurd mutation -- 10x the magnitude, invert the sign, make it free, make it instant -- and run the standard seed set.

> **STOP: INVISIBLE.** If the board does not move under an absurd mutation, the instrument is blind to this effect class. Report an instrument gap and what would need to change to close it. Do not proceed, and do not report anything about the mechanic itself.

This stage is the one every project was missing. It is what separates "this mechanic does nothing" from "I cannot see this mechanic."

### Stage 3 -- Ablate

Disable the mechanic. Not tuned to zero -- disabled, so downstream systems that read it are exercised as absent. Run the same seeds, the same policies, the same metrics as the unmutated baseline.

Report per-metric deltas and per-seed deltas. Seed-level matters: a mechanic that changes 1 seed in 24 dramatically and 23 not at all is a different animal from one that shifts everything slightly.

**Back up, mutate, restore, verify.** Stages 2 and 3 both edit real source — most projects have no feature-flag layer to ablate through, so ablation means changing code and putting it back. Copy the file first, restore it after, and re-run to confirm the baseline returns *before* reporting any verdict. A mutation left in place will be committed. Not hypothetical: one session left a `//MUT` marker in a staged file and caught it by chance. An unrestored stage-2 mutation also invalidates stage 3, because the "baseline" it compares against is no longer the baseline.

### Stage 4 -- Verdict

Exactly one, stated plainly:

| Verdict | Meaning | Action |
|---|---|---|
| **LIVE** | Removal moves outcomes measurably | Report the magnitude. No action needed. |
| **DEAD** | Removal changes nothing, and stage 2 passed | Real finding. The mechanic is decoration. Cut it, or give it teeth. |
| **UNEXERCISED** | No policy uses it | Test-suite gap. Write the policy. |
| **INVISIBLE** | Instrument insensitive under absurd mutation | Instrument gap. Say what would close it. |

**DEAD is the only verdict that licenses a claim about the mechanic.** The other two failure verdicts are claims about the apparatus.

## The rule that matters

An unchanged metric is not evidence of no effect until stage 2 has passed. Before stage 2, "the board didn't move" and "the instrument is blind" are the same observation, and treating them as different is how three separate projects nearly shipped a wrong conclusion.

## Also worth ablating

Not just mechanics. Run the same four stages against:

- **A displayed value.** Is it read by anything? `tribe.goal` was shown to the player as intelligence and consumed by nothing. The game was lying.
- **A currency with no sink.** GRAVELIGHT's gold. If nothing consumes it, it is a number, not a mechanic.
- **A shared variable serving multiple masters.** TIMBERWOLF's `wardAt` fed spawn suppression, fire damage, and regen. Nobody reasoned about all three together, and that is exactly how the regen line shipped inert.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **simulation-first-design** — Building the instrument this procedure needs
- **game-balance** — What to do once a mechanic is confirmed to matter
- **north-star-check** — Whether the mechanic was ever meant to be there

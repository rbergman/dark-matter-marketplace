---
name: progression-legibility
description: "Making a game's growth math readable on screen: additive versus multiplicative versus diminishing upgrade stacking, which to use per stat, and how to show it; multiplier and score caps the player can see; threat as a learnable function of distance or time; a procedure for choosing curve parameters from a felt target instead of tuning blind; and what an upgrade or draft card must say. Use when designing upgrade drafts, roguelite builds, score multipliers, combo systems or difficulty that ramps by distance or time; and when players say 'I can't tell what this upgrade does', 'does +20% stack?', 'my build got ridiculous', 'it suddenly got hard', 'the multiplier doesn't seem to do anything', or 'I don't know why I'm losing'. progression-systems owns curve shapes and XP math; this skill owns whether the player can read them."
---

# Progression Legibility

**Purpose:** The player can predict what the next upgrade will do, see where the
ceiling is, and feel the difficulty arriving for a reason. The numbers are chosen
from a feel target the designer can state, not nudged until they stop complaining.

**Sources:**
- **Stacking arithmetic** is posture A: it is arithmetic, shown with worked numbers.
- **Curve families, the flow channel and the difficulty sandwich** are
  **progression-systems**'s. Cost curves and dominant-strategy detection are
  **game-balance**'s. Bot sweeps and their blind spots are
  **simulation-first-design**'s.
- **Corpus:**
  - threat as distance from spawn: Hard Deck's `threatAt` ("missions march outward;
    that is the difficulty curve")
  - a combo multiplier capped at ×3.0: abduction-run
  - hotkeyed choices with a 300 ms double-submit gate: royal-inbox
  - a pad hold-off after the draft opens: Hard Deck
  - headless pacing-envelope tests: logarithmic
- **The felt-target procedure** is this plugin's own construction, from the Numbers
  Policy and the verified/felt/assumed distinction. It is posture B throughout.

Typed sketch: `references/stacking.ts`. It covers the stacking rules, card text from
effective values, and solving a growth rate from a target ratio.

---

## The problem

| Failure | Root cause |
|---|---|
| "+20% damage" means 1.2×, 1.44× or 1.6× depending on what's already owned, and the card doesn't say | The stacking rule isn't stated, or differs between stats |
| A build becomes invulnerable | Damage reduction stacked additively: 5 × 20% = 100% |
| A multiplier pick visibly does nothing | It is past a cap the HUD never showed |
| "It suddenly got hard" | Threat rises smoothly but invisibly, so the player has no cue that it rose |
| Tuning drifts session to session | Numbers moved against a complaint, not against a stated target with a test |

---

## The player-facing idiom

- **An upgrade card shows the effect in the player's terms, before and after:**
  "Fire rate 4.0 → 4.8 shots/s", not just "+20% fire rate". It shows "2/5" when it
  stacks, and how it stacks when that isn't obvious.
- **Caps are visible.** "×3.0 MAX" on the multiplier. A maxed upgrade is no longer
  offered, or is shown greyed with "Maxed".
- **The difficulty rises in steps the player can see:**
  - a new zone, a new band colour, a named sector
  - a threat number on the HUD or the map
  - a compass distance

  The player can then say "it got hard because I went further".
- **A draft:** three cards, keys 1–3, click, or pad. It never picks itself from a
  held fire button. Reroll is an explicit, labelled verb.

---

## The rules

### 1. One stacking rule per stat, chosen on purpose

| Rule | Formula for n picks of p | 3 × 20% gives | Use for | Never for |
|---|---|---|---|---|
| **Additive** | `1 + n·p` | 1.60× | Most offence; easy to read and to show | Reductions or chances; it reaches 100% |
| **Multiplicative** | `(1 + p)ⁿ` | 1.728× | Stats you want to snowball late, deliberately | Anything the player must estimate mentally |
| **Diminishing** (for reductions and chances) | `1 − (1 − p)ⁿ` | 48.8% reduction | Damage reduction, dodge, crit or proc chance: approaches 100%, never reaches it | Offence; it feels like a nerf |

- **Same stat, same rule, everywhere:** cards, the HUD and the tooltip. Mixing
  rules in one stat is the "does +20% stack?" complaint.
- **Additive reductions need a hard cap,** or a build becomes invulnerable. Prefer
  the diminishing rule and skip the cap.
- **Multiplicative growth on both sides** (player and threat) diverges quickly. If
  both are exponential, the *ratio* is what the player feels; see rule 4.

### 2. Cards and readouts show effective numbers

- **Compute the card from the real stat pipeline:**
  `effective(stat, owned + this) − effective(stat, owned)`. Never compute it from
  the card's own `p`; a card computed separately drifts from the game.
- **Show the unit the player perceives:** shots per second, not "cooldown −16.7%".
  Seconds of shield, not "+20 shield". Use percentages only for chances.
- **Show the stacking rule once, where it bites:** "stacks with diminishing returns"
  on a reduction card. Additive offence needs no note, because before → after says
  it.
- **Caps:**
  - the HUD shows the cap the moment it's reached ("×3.0 MAX")
  - a capped upgrade leaves the draft pool, or is shown greyed with the reason
  - offering a dead pick is a lie in the UI (see **game-feel**, Feedback lies)

### 3. Score multipliers and combos

- **Cap the multiplier.** Abduction-run caps at ×3.0 (corpus value, `combo.ts`). An uncapped
  combo makes the score a function of one skill, not of play.
  - Soft caps (diminishing approach) keep each step meaningful.
  - Hard caps are easier to read.
- **Show the multiplier, its decay timer, and the cap** together, as one readout
  (see **hud-readouts**). The decay window is the combo's real rule; make it
  visible as a draining bar.
- **A combo break is feedback,** not silence: a red pulse, a sound. Abduction-run
  shakes the badge on collapse. The reduced-motion setting turns the shake into a
  colour change.

### 4. Threat is a learnable function

- **Threat as a function of one variable the player controls or sees:**
  - distance from spawn (Hard Deck's `threatAt`)
  - time survived
  - the wave index

  One variable is learnable. A hidden blend of five isn't.
- **Monotonic, in visible bands.** The underlying curve can be smooth (shape from
  **progression-systems**), but the player perceives bands. Change the palette,
  enemy roster or music at band edges, so a rise in threat has a cue.
- **Show it.** A HUD number, zone tint, or map shading. In a distance-based game the
  compass distance *is* the threat readout, which is why Hard Deck's missions march
  outward.
- **The difficulty the player feels is `threat / power`.** Plot both curves against
  the same axis (distance or time) for a typical build. The ratio should follow the
  shape you chose, such as progression-systems' difficulty sandwich. If power
  outgrows threat, the late game is a victory lap. If threat outgrows power, it's a
  wall.

### 5. Parameters from a felt target, not blind tuning

The procedure, all posture B:

1. **State the felt target in the player's words.** "Mission 3 should feel like
   the first boss fight, not like mission 1 with more enemies." "A full build
   should feel twice as strong as a fresh one, not ten times."
   - **If no felt target exists, stop and ask for one.** An absent target gets
     filled by whatever proxy is handy, which is the failure the design-verification
     rule warns about.
2. **Translate it into a measurable proxy with a tolerance.** "Time-to-kill of a
   standard enemy at mission 3 is within ±25% of the mission-1 boss's." "Full-build
   DPS / fresh DPS is 1.8–2.2."
3. **Pick the curve family** (progression-systems) and **solve for its
   parameters** rather than guessing. An exponential threat `T(x) = T₀·e^(r·x)`
   that should be k times harder between x₁ and x₂ has `r = ln(k) / (x₂ − x₁)`.
4. **Sweep with the bot** across seeds and distances or times, and check the proxy
   holds (**simulation-first-design**). State the bot's blind spot with the number:
   "within tolerance on 20 seeds, from a bot that never retreats". The seed
   count is posture B: raise it until the result stops moving between runs.
5. **Playtest the feel.** Did mission 3 *feel* like a boss fight? Only a person can
   say; record it verbatim (**moment-capture**). If the proxy passes and the feel
   fails, the proxy was wrong. Change the proxy, not the player.

### 6. The draft card

- **Contents, in order:** name; effect as before → after; stacks (n/max); stacking
  note if needed; tags or synergies.
- **Three choices** is the common shape and enough to need a decision (posture B).
  Test: do players read all three before picking? If most pick in under a second,
  the cards are too samey, so differentiate them. If they stall, there are too many
  words. More choices means more reading.
- **Input:**
  - keys 1–3, click, pad direction plus A
  - focus starts on no card, or on the first; never preselect the "best"
  - the **fresh-press guard** belongs to game-shell (rule 4): a fire button held
    when the draft opens must be released first, so it can't pick a card.
    Royal-inbox gates double-submits at 300 ms (corpus value, `input-gate.ts`).
    Hard Deck's draft relies on pad press *edges* alone.
- **Pause by shape:** a centred card modal pauses the sim (game-shell rule 1).
  Redshifted eases time to a freeze rather than cutting it; that's a feel choice.
  Either way, the sim isn't running at full speed behind an unread card.
- **Reroll and skip** are labelled verbs, with their cost shown.

---

## Edge cases that bite

- **Order-dependent pipelines.** If additive and multiplicative modifiers apply to
  one stat, the order (add, then multiply) is part of the rule. Fix it in one
  function and test it, or two cards read differently depending on pick order.
- **Rounding on cards.** "4.0 → 4.0" when the true change is +0.04. Round for
  display, and choose the precision so every card shows a visible change. If one
  can't, the upgrade is too small to offer.
- **Hidden scaling.** Enemy HP that scales with player level makes a damage card
  read "+20%" while play feels flat. If you scale threat with power, say so: it's
  the one thing players resent finding out.
- **Score overflow.** Large scores need grouping (`toLocaleString`) and tabular
  figures (hud-readouts).

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, stacking:** each rule's formula, for n = 0..5, matches the table. No
      reduction reaches 100%. Card text equals the pipeline's before → after.
      Mutation-check: swap the rule on one stat and the card test fails. *Blind to:
      whether players understand the card.*
- [ ] **Bot sweep:** threat/power ratio against distance or time, on 20+ seeds,
      inside the stated tolerance. *Blind to: everything a bot can't feel; see
      simulation-first-design's table.*
- [ ] **Card read test:** show a first-time player a card for 5 s and ask what it
      will do (player-ux's 5-second test). *Blind to: long-term build
      understanding.*
- [ ] **Cap test:** reach every cap; the HUD shows it and the card leaves the pool.
- [ ] **Held-fire draft:** hold fire while a draft opens; no card is picked.
- [ ] **Felt target:** a recorded human reaction against the stated target
      (moment-capture). This is the only check that can say "done".

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **progression-systems** — The curve families, XP math and difficulty sandwich this skill makes readable
- **game-balance** — Cost curves and dominant strategies, which caps exist to prevent
- **simulation-first-design** — The bot sweep in step 4, and what it cannot see

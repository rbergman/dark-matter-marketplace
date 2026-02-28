---
name: progression-systems
description: "Difficulty curves, flow channel targeting, power curve math, unlock pacing, reward scheduling, and XP/level formulas. Use when designing level-up systems, tuning difficulty ramps, pacing content unlocks, implementing adaptive difficulty, or when players report 'too easy', 'too hard', or 'grindy'."
---

# Progression Systems

**Purpose:** Tools for designing how players grow in power, skill, and access over time. Good progression makes every session feel rewarding. Bad progression creates grind, frustration, or trivialized content.

**Influences:** Frameworks here draw on work by Ian Schreiber and Brenda Romero (power curves, pacing math), Tynan Sylvester (accessibility/depth model), and Celia Hodent (flow channel, cognitive pacing), with roots in Csikszentmihalyi's flow theory.

---

## When to Activate

Use this skill when:
- Designing XP curves, level-up formulas, or unlock schedules
- Tuning difficulty ramps for a campaign or level sequence
- Players report the game is "too easy," "too hard," or "grindy"
- Implementing adaptive difficulty or dynamic scaling
- Planning content pacing for a long-form game
- Deciding what to gate behind progression vs. make available from the start

---

## Core Model: Accessibility and Depth

Two independent axes that progression systems must serve:

```
Depth (high ceiling)
    |
    |   +-----------+
    |   | The Goal  |   ← Easy to start, deep to master
    |   +-----------+
    |
    +-------------------→ Accessibility (low floor)
```

- **Accessibility** (low floor) — Can a novice play and have a good time?
- **Depth** (high ceiling) — Is there room for an expert to keep improving?

These are NOT opposites. The best systems score high on both. Techniques:

| Technique | How It Works | Example |
|-----------|-------------|---------|
| **Layered complexity** | Simple surface, deep internals | Chess: easy rules, infinite strategy |
| **Optional complexity** | Advanced systems exist but aren't required | Type matchups you can ignore if you over-level |
| **Skill-based progression** | The *player* improves, not just the character | Combo execution, map knowledge, timing |

---

## Power Curves

How player power grows over time. The curve shape determines how the game *feels*.

### Curve Types

```
Power
  |          Exponential        S-Curve (often ideal)
  |         /                  _____
  |        /                  /
  |       /                  /
  |      /                  /
  |     /                  /
  |    /              ____/
  |   /              /
  |  /              /
  | /           ___/
  |/___________/
  +----------------------------------→ Time

  Linear                    Logarithmic
  /                         ___________
  /                        /
  /                       /
  /                      /
  /                     /
  +-------------------→  +-------------------→
```

| Curve | Feel | When to Use | Risk |
|-------|------|-------------|------|
| **Linear** | Consistent, predictable | Tutorial sections, first hour | Boring over long spans |
| **Exponential** | Dramatic, accelerating | Short games, power fantasies | Unmanageable late game |
| **Logarithmic** | Diminishing returns | Realistic simulations | Feels unrewarding as ceiling approaches |
| **S-Curve** | Slow start → rapid middle → plateau | Most progression systems | Requires careful inflection point placement |

### Felt vs. Actual Power

Players need to *feel* stronger even when mathematical power growth slows.

**Techniques for maintaining felt power at diminishing actual power:**
- New abilities that *look* dramatic even if numerically modest
- Visual upgrades (armor appearance, particle effects, screen presence)
- New *types* of interaction rather than bigger numbers
- Areas of the world that were previously inaccessible
- AI enemies that react more dramatically to the player's attacks

**Template: Power Curve Spreadsheet**

```
| Level | XP Required | Cumulative XP | Power Rating | Felt Power | New Content |
|-------|-------------|---------------|--------------|------------|-------------|
| 1     | 0           | 0             | 10           | Low        | Tutorial    |
| 2     | 100         | 100           | 15           | Growing    | Ability A   |
| 3     | 150         | 250           | 19           | Growing    |             |
| 4     | 225         | 475           | 22           | Moderate   | Area B      |
| 5     | 340         | 815           | 25           | Moderate   | Ability B   |
```

---

## XP and Level Math

### Common XP Formulas

**Linear scaling:** `xp_for_level(n) = base * n`
- Simple, predictable, gets grindy fast

**Polynomial:** `xp_for_level(n) = base * n^exponent`
- Exponent 1.5-2.0 is common
- Gradually increasing time between levels

**Exponential:** `xp_for_level(n) = base * growth_rate^n`
- Dramatic acceleration, use sparingly
- Works when matched with exponential reward scaling

**Practical approach:**
1. Decide how long each level should *feel* in play time
2. Estimate XP gain per minute of intended play
3. Back-calculate the required XP per level
4. Plot and smooth the curve
5. Playtest and adjust — the math is a starting point, not the answer

### Level Count Rule of Thumb

Target a level-up every 10-30 minutes of play in the early game, stretching to 30-60 minutes in mid/late game. Work backward from intended game length to determine level count. Short games (2-5 hours) need fewer levels (10-15); long games (50+ hours) need more (50-100) but risk grind at scale.

---

## The Flow Channel

Challenge should approximate skill level — the "flow channel" from psychology:

```
Challenge
    |     Anxiety
    |    /
    |   /  FLOW CHANNEL
    |  /  /
    | /  /
    |/  /
    | /  Boredom
    |/
    +------------------→ Skill
```

- **Above the channel** → anxiety, frustration, quitting
- **Below the channel** → boredom, disengagement
- **In the channel** → engagement, "just one more try"

### Targeting the Channel

- [ ] Does difficulty scale with demonstrated player skill (not just time played)?
- [ ] Are there multiple difficulty signals? (Speed, accuracy, strategy quality, not just "did they die?")
- [ ] Does the channel widen as skill increases? (Experts tolerate more variance)
- [ ] Can players self-select difficulty? (Options, optional challenges, difficulty modes)

### Adaptive Difficulty

If implementing dynamic difficulty adjustment (DDA):

**Do:**
- Adjust invisibly (enemy spawn rate, AI aggression, resource availability)
- Base adjustments on multiple signals (death rate + time-to-complete + resource usage)
- Apply gradually — sudden shifts feel unfair

**Don't:**
- Make it visible — players who notice rubber-banding feel cheated
- Adjust core challenge identity (if the game is about precision, don't make hitboxes bigger)
- Scale only HP/damage (lazy, breaks balance, doesn't change the *experience*)

---

## The Difficulty Sandwich

Good progression peels three layers of challenge:

```
Layer 1 (bottom):  Mechanical skill     (can I physically do this?)
Layer 2 (middle):  Cognitive challenge   (do I understand what to do?)
Layer 3 (top):     Strategic depth       (can I optimize my approach?)
```

**Progression phases:**
- **Early game:** Layer 1 only — learn controls, build muscle memory
- **Mid game:** Layer 1 + 2 — learn systems, understand interactions
- **Late game:** All three — master strategy, optimize builds, find efficiencies

**Anti-pattern:** Introducing Layer 3 challenges before Layer 1 is comfortable. Don't ask for strategic thinking while the player is still fumbling with controls.

---

## Content Pacing

New content (mechanics, enemies, zones, abilities) should arrive at inflection points on the power curve.

**Rules of thumb:**
- Introduce new content when the player has *just* mastered the previous content
- Each new element should change *how* the player plays, not just *what* they fight
- Space unlocks so there's always something recent to explore and something to anticipate
- The longest stretch without new content should be shorter than the player's patience — and that's shorter than you think

### Unlock Pacing Checklist

- [ ] Is there a meaningful unlock or new mechanic every 15-30 minutes? (Adjustable per genre)
- [ ] Do unlocks change player behavior? (New ability that opens new tactics > +5% damage)
- [ ] Is there always a visible "next milestone" to work toward?
- [ ] Does the pacing slow down as the player's investment deepens? (Acceptable late-game)
- [ ] Are early unlocks front-loaded to hook new players?

---

## Common Pitfalls

- **Flat difficulty** that doesn't respond to player growth (level 50 feels like level 5)
- **Rubber-banding** that's visible and feels unfair ("the game cheated")
- **Difficulty modes as HP/damage scaling** (lazy, breaks balance, doesn't change experience)
- **Punishing experimentation** in the learning phase (deaths should teach, not just frustrate)
- **Power creep** in sequential content releases (each new thing must be "better" to sell)
- **Grind without purpose** — repetition is acceptable when each cycle teaches something; it's toxic when it's just time-gating

---

## Cross-References

- **game-balance** — Power curves must align with cost curves; balance changes affect progression feel
- **experience-design** — Pacing and engagement loops at the macro level
- **player-ux** — Onboarding is the first phase of the progression curve; cognitive load constrains pacing
- **game-feel** — Felt power is heavily influenced by feedback quality
- **playtest-design** — Testing whether difficulty is in the flow channel for your target audience

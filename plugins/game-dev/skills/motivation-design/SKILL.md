---
name: motivation-design
description: "Player motivation psychology, reward scheduling, intrinsic vs. extrinsic drives, Self-Determination Theory, loss aversion, collection drives, social motivation, and ethical guardrails. Use when designing reward systems, diagnosing why players aren't returning, building achievement or social features, evaluating retention mechanics, or when players say 'I don't know why I'd keep playing.' Bridges the gap between progression math (see progression-systems) and the psychology of why players stay."
---

# Motivation Design

**Purpose:** Tools for understanding and designing around *why players play*. Progression-systems handles the math of growth curves. This skill handles the psychology underneath — what makes players choose to come back, what makes them stop, and where the ethical lines are.

**Influences:** Frameworks here draw on Self-Determination Theory (autonomy, competence, relatedness), operant conditioning research (reinforcement schedules), prospect theory (loss aversion, endowment), and the Zeigarnik effect (incomplete task tension). Player motivation profiles adapted from modern survey-based taxonomies that extend the classic explorer/achiever/socializer/killer model.

---

## When to Activate

Use this skill when:
- Designing reward systems, loot tables, or achievement structures
- Players aren't returning between sessions (retention failure)
- Designing social features (guilds, leaderboards, co-op, competition)
- Evaluating whether retention mechanics cross ethical lines
- Players say "I don't know why I'd keep playing" or "there's nothing to do"
- Choosing between intrinsic and extrinsic reward strategies
- Designing daily login rewards, battle passes, or seasonal content
- Diagnosing why engagement drops after the first few hours

---

## Core Framework: Self-Determination Theory (SDT)

Three innate psychological needs predict sustained motivation. Mechanics that satisfy all three produce lasting intrinsic engagement. Undermining *any one* produces disengagement — even if the other two are strong.

| Need | Definition | Game Mechanics | Undermined By |
|------|-----------|----------------|---------------|
| **Autonomy** | Sense of choice and voluntary engagement | Meaningful choices, character builds, open-world exploration, multiple viable strategies | Forced linear paths, "do this or fail," punitive daily requirements |
| **Competence** | Sense of mastery and effectiveness | Skill progression, difficulty curves, mastery feedback, clear improvement signals | Unclear feedback, impossible challenges, pay-to-win (skill doesn't matter) |
| **Relatedness** | Sense of connection and belonging | Co-op play, guilds, shared challenges, leaderboards, community events | Isolation by design, toxic competition, anonymous interactions |

### SDT Diagnostic

When engagement drops, check each need:

- [ ] **Autonomy:** Does the player feel they *choose* to play, or that the system *requires* them to?
- [ ] **Competence:** Does the player feel they're getting better? Can they see evidence of mastery?
- [ ] **Relatedness:** Does the player feel connected to other players or to the game world?

If even one fails, adding more content or rewards won't fix retention. Fix the unmet need first.

---

## Player Motivation Profiles

Modern survey-based frameworks identify six clusters of player motivation. Most players are driven by 2-3 primary profiles. Design for primary profiles; accommodate secondary ones.

| Profile | Core Drive | Example Mechanics | Design Pitfall |
|---------|-----------|-------------------|----------------|
| **Action** | Excitement, destruction, fast pace | Combat, explosions, time pressure, speed runs | Burnout without recovery pacing |
| **Social** | Cooperation, competition, community | Guilds, co-op missions, PvP, chat, trading | Toxic players driving others out |
| **Mastery** | Strategy, challenge, completion | Puzzles, hard modes, leaderboards, ranked play | Alienating casual players |
| **Achievement** | Collection, power, progression | Unlock trees, gear treadmills, badges, 100% completion | Grind for grind's sake |
| **Immersion** | Fantasy, story, discovery | Lore, exploration, atmospheric design, role-playing | Story that contradicts mechanics |
| **Creativity** | Customization, expression, building | Base building, character editors, mod support, level editors | Tools too complex to use |

### Application

1. **Identify your target profiles.** Which 2-3 profiles does your game serve best?
2. **Audit core loops against those profiles.** Does every session serve the primary profiles?
3. **Add accommodation for adjacent profiles.** Cosmetics for Creativity players in an Action game, optional lore for Immersion players in a Mastery game.
4. **Don't try to serve all six equally.** A game for everyone is a game for no one.

---

## Reinforcement Schedules

How reward timing affects player behavior. These are the fundamental patterns underlying every reward system in games.

| Schedule | Pattern | Engagement Effect | Example |
|----------|---------|-------------------|---------|
| **Fixed Ratio** | Reward every N actions | Predictable, steady engagement; brief pause after reward | Quest rewards, crafting recipes (combine 5 items → 1 output) |
| **Variable Ratio** | Reward after random N actions | Highest engagement, hardest to stop | Loot drops, critical hits, fishing, gacha pulls |
| **Fixed Interval** | Reward every N minutes/hours | Creates session pacing, "appointment" behavior | Daily login bonuses, cooldown timers, energy refills |
| **Variable Interval** | Reward at random times | Creates checking behavior, anticipation | World boss spawns, random events, merchant restocks |

### Design Rules

- **Variable ratio is the most powerful schedule** — and the most ethically fraught. Use it for discovery and exploration (finding rare loot in the wild), not for monetization pressure (spend $5 for another pull).
- **Fixed ratio provides the clearest player agency.** Players can plan and strategize. Use for core progression.
- **Fixed interval creates habits** but also resentment if missing the interval is punished (see Autonomy above).
- **Layer schedules.** A single schedule grows predictable. Combine: fixed ratio for quest rewards + variable ratio for bonus loot + fixed interval for daily challenges.

### Schedule Selection Guide

| Design Goal | Best Schedule | Why |
|-------------|---------------|-----|
| Reliable progression feel | Fixed Ratio | Players see direct effort-to-reward connection |
| Exploration excitement | Variable Ratio | Anticipation on every attempt |
| Session regularity | Fixed Interval | Players return at predictable times |
| World feeling alive | Variable Interval | Surprise creates stories |
| Long-term retention | Layered (all four) | No single schedule sustains indefinitely |

---

## Intrinsic vs. Extrinsic Motivation

The most important tension in motivation design.

- **Intrinsic:** Playing because the activity itself is rewarding — mastery, curiosity, creativity, flow
- **Extrinsic:** Playing for external rewards — points, items, achievements, social status, unlocks

### The Overjustification Effect

Adding extrinsic rewards to an intrinsically motivated activity can *reduce* total motivation when the rewards are removed. A player who explores because exploration is fun may stop exploring when the achievement badges stop appearing — the badges replaced the internal drive.

### Design Principles

1. **Use extrinsic rewards to GUIDE, not REPLACE.** The reward should say "look over here, this is fun" — not "do this boring thing for a cookie."
2. **Autonomy-supportive rewards preserve intrinsic motivation.** Let players choose what to pursue. "Here are 5 interesting challenges; pick any 3" > "Complete these 3 daily quests."
3. **Controlling rewards undermine intrinsic motivation.** "You MUST do this to progress" transforms play into work.
4. **Unexpected rewards are safer than expected ones.** A surprise bonus for creative play reinforces intrinsic motivation. A predictable reward for the same behavior can erode it.
5. **Informational feedback > controlling feedback.** "You've mastered this technique!" (competence signal) > "Achievement unlocked: do this 100 more times" (behavioral control).

### Reward Type Spectrum

```
More Intrinsic ←————————————————————————→ More Extrinsic

Flow state    Mastery     Narrative    Cosmetics    Currency    Power
enjoyment     feedback    payoffs      & badges     & XP        upgrades
```

Design systems that pull players leftward on this spectrum over time. Early extrinsic rewards teach players where the intrinsic rewards live.

---

## Loss Aversion & Endowment

Prospect theory finding: losses are felt roughly 2x as strongly as equivalent gains. This has pervasive design implications.

### Loss Aversion

| Mechanic | Implication |
|----------|-------------|
| **Item loss on death** | Feels twice as punishing as gaining the same item feels rewarding. Must be core to the fantasy (roguelikes, survival) — not just punishment. |
| **Item degradation** | Feels like theft unless the fiction supports it (weapon wear in survival, but not in a power fantasy). |
| **Rank decay** | Losing a rank feels worse than gaining it felt good. Consider floors/tiers that can't be lost. |
| **Missed daily rewards** | "You missed your streak!" is a punishment, not a motivation. |

### Endowment Effect

Once players own something, they overvalue it relative to market value. This is powerful for:
- **Character attachment:** Players who build a character invest identity into it
- **Base building:** A base the player constructed feels like *theirs*, not just pixels
- **Inventory hoarding:** Players keep items "just in case" long past usefulness

### Sunk Cost

Players continue investing in losing strategies because they've already invested time/resources. This is:
- **Engagement** when it creates commitment to a meaningful journey
- **Frustration** when it traps players in dead-end builds or punishes respeccing

**Design rule:** Make sunk costs recoverable. Respec options, item refund systems, and build resets reduce frustration without reducing attachment.

---

## Collection & Completion Drives

### The Zeigarnik Effect

Incomplete tasks occupy mental space more than completed ones. Showing a player "87% complete" creates cognitive tension that pulls toward 100%.

### Collection Design Rules

1. **Discoverable:** Players must be able to find items through gameplay, not just guides
2. **Trackable:** A clear UI showing what's found and what's missing
3. **Completable:** Broken collections (missing items, impossible drops) are worse than no collections at all
4. **Appropriately scoped:** 20 meaningful collectibles > 500 filler ones

### Achievement Design

Achievements should mark genuine accomplishment, not just time spent.

| Good Achievement | Bad Achievement |
|-----------------|-----------------|
| "Defeat the boss without taking damage" (skill) | "Kill 10,000 enemies" (time) |
| "Find all hidden areas" (exploration) | "Play for 100 hours" (attendance) |
| "Win using only the starting weapon" (creativity) | "Buy 50 items from the store" (spending) |

### Completion Fatigue

Too many collectibles dilute the drive. When the completion bar barely moves per find, the Zeigarnik effect reverses — the task feels impossible rather than magnetic. Quality over quantity. If the map is covered in meaningless markers, players stop caring about all of them.

---

## Social Motivation

Other players are the most powerful — and most volatile — motivational force in games.

| Driver | Mechanic | Retention Effect |
|--------|----------|------------------|
| **Cooperation** | Shared goals, complementary roles, mutual dependency | Strong — "my team needs me" |
| **Competition** | Leaderboards, rankings, PvP, skill comparison | Strong but polarizing — motivates top players, can demoralize bottom |
| **Exhibition** | Cosmetics, player housing, build sharing, creative showcases | Moderate — requires audience |
| **Social proof** | "1,000 players online," "your friend found a rare item," trending content | Moderate — creates FOMO, can backfire if numbers are low |
| **Social obligation** | Guild duties, team expectations, scheduled raids | Very strong but can turn toxic — "I can't miss raid night" |

### Design Rules for Social Features

- Social features are **force multipliers** for retention — a mediocre game with great social systems retains better than a great game played alone
- Social features **must be opt-in** for non-social players. Gating progression behind group content alienates solo players.
- **Cooperation > competition** for broad retention. Competition retains the winners and drives away the losers.
- **Visibility creates motivation.** Players who can see each other's progress, creations, and achievements are more engaged than players in isolation.
- **Moderate social obligation.** "Your guild benefits when you play" is fine. "Your guild suffers when you don't play" is coercive.

---

## The "One More Turn" Formula

Why players don't stop playing. These elements, layered together, create sessions that extend naturally.

| Element | Mechanism | Example |
|---------|-----------|---------|
| **Micro-closure** | Frequent small completions | Killed an enemy, cleared a room, finished a side quest |
| **Visible next milestone** | The next goal is always visible and feels achievable | XP bar at 80%, next unlock previewed |
| **Sunk cost momentum** | "I'm already halfway through" | Mid-level, mid-quest, mid-crafting-batch |
| **Variable reward anticipation** | "Maybe the next one is great" | Unopened chest, unidentified loot, next random encounter |
| **Cliffhanger state** | Session ends at a decision point or before resolution | Story choice pending, boss door reached, new area discovered |

### Session Pacing

Design these elements to create **natural play sessions**, not to trap players in unhealthy loops.

- [ ] Does the game have natural stopping points? (Save opportunities, chapter breaks, match endings)
- [ ] Can a satisfying play session fit in 20-30 minutes?
- [ ] Does the "one more turn" pull come from genuine anticipation or from fear of loss?
- [ ] Are session-end rewards front-loaded? (Don't punish players for stopping)

---

## Motivation Diagnostics

When players aren't coming back, match the symptom to the underlying failure.

| Symptom | Root Cause | Fix Direction |
|---------|-----------|---------------|
| "I finished everything" | Content exhaustion | Add procedural variety, social features, mastery depth |
| "There's nothing to work toward" | Missing goals | Add visible progression, collections, achievements |
| "It's the same every time" | No variety | Add variable rewards, procedural generation, build diversity |
| "I don't feel like I'm getting better" | Competence failure (SDT) | Add skill-based challenges, visible mastery metrics |
| "Nobody else plays" | Relatedness failure (SDT) | Add social features, community events, shared goals |
| "I have to play every day or I fall behind" | Autonomy violation (SDT) | Remove punitive daily requirements, add catch-up mechanics |
| "I keep dying and losing my stuff" | Loss aversion overload | Reduce loss severity, add insurance mechanics, soften permadeath |
| "The rewards feel pointless" | Extrinsic-only motivation | Guide toward intrinsically rewarding activities, add autonomy-supportive rewards |

---

## Ethical Guardrails

Motivation design has the power to create genuine engagement or to exploit psychological vulnerabilities. The line matters.

### Dark Patterns

These mechanics prioritize revenue extraction over player experience:
- **Limited-time pressure on purchases** — "Buy now or lose it forever" exploits loss aversion for money
- **Pay-to-skip frustration** — Deliberately designing frustration to sell the cure
- **Artificial scarcity of free progression** — Energy systems that exist to sell refills, not to pace gameplay
- **Loot boxes with real-money purchase** — Variable ratio schedules applied to spending are gambling mechanics regardless of legal classification

### Three Rules

1. **The removal test:** If removing the monetization would make the game *more fun*, the monetization is parasitic. Ethical monetization adds value (cosmetics, content, convenience) rather than removing artificial pain.

2. **The gambling test:** Variable ratio schedules applied to real-money purchases are gambling mechanics. Period. Legal classification varies by jurisdiction, but the psychology is identical.

3. **The obligation test:** Social obligation mechanics ("miss a day and your guild suffers") should never be the *primary* retention driver. If the game isn't worth playing without the guilt, the guilt is a crutch.

### The Transparency Principle

If the player understood exactly how the system works — every drop rate, every algorithm, every engagement hook — would they still want to play? If the answer is no, the system is manipulative. If the answer is yes, the system is honest motivation design.

---

## Cross-References

- **progression-systems** — The math underneath motivation; power curves, XP formulas, and flow channel targeting that implement the psychology described here
- **experience-design** — Engagement loops and pacing at the macro level; motivation design explains *why* those loops work
- **game-balance** — Cost curves and economy tuning that make reward schedules feel fair
- **game-feel** — Feedback quality that makes competence legible; juice that makes rewards feel rewarding
- **player-ux** — Cognitive load constraints on how many motivational systems players can track simultaneously
- **playtest-design** — Testing whether motivational systems produce intended behavior and emotions
- **game-design** — 5-Component Filter's Motivation component; this skill provides the deep framework behind that quick check
- **economy-design** — Sink/source balance that sustains long-term reward value; currency systems that connect to motivation
- **narrative-design** — Story motivation (what happens next?) layered with mechanical motivation (what do I earn next?)

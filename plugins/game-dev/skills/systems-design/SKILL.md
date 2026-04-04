---
name: systems-design
description: "System interaction architecture, emergence analysis, coupling evaluation, and possibility space design. Use when designing a new game's system architecture, adding a system to an existing game, evaluating system health, diagnosing 'why doesn't this feel deep?', or when a game has many features but no emergent depth. The central structural skill — bridges individual mechanic evaluation (game-design) with architectural questions about how systems interact to create depth."
---

# Systems Design

**Purpose:** Tools for designing, evaluating, and diagnosing the structural architecture of game systems — how they interact, what they produce together, and why depth comes from interaction rather than accumulation.

**Core philosophy:** Games are not built from features. They are built from interacting systems. Depth comes from how systems interact, not how complex they are alone. A game with four tightly interacting systems is deeper than a game with twelve isolated ones.

---

## When to Activate

Use this skill when:
- Designing the system architecture of a new game
- Adding a new system to an existing game and need to evaluate fit
- A game has many features but feels shallow — "lots to do, nothing matters"
- Evaluating whether systems are producing emergent depth or just mechanical complexity
- Deciding which systems to build, cut, or defer
- Diagnosing dominant strategies that collapse possibility space
- Planning system build order for a prototype or MVP
- Reviewing whether a game's systems serve its experience pillars

---

## Core Framework: The System Interaction Matrix

The interaction matrix is the primary diagnostic tool. It maps every game system against every other system and classifies the interaction.

### Interaction Types

| Type | Symbol | Definition | Example |
|------|--------|------------|---------|
| **Feeds** | `→` | A generates input for B | Combat → Loot (kills produce drops) |
| **Constrains** | `⊣` | A limits B's option space | Stamina ⊣ Combat (fatigue restricts combos) |
| **Enables** | `⊕` | A creates conditions for B to function | Exploration ⊕ Crafting (discovery unlocks recipes) |
| **Conflicts** | `⊗` | A and B compete for the same resource or player attention | Building ⊗ Combat (same time budget) |
| **Emergent** | `✦` | Interaction produces behaviors neither system creates alone | Stealth ✦ AI (guards create patrol puzzles) |
| **Independent** | `·` | No meaningful interaction | Weather · Inventory |

### Template

Build this matrix early. Update it as systems evolve.

```
             | Combat | Craft | Explore | Stealth | Economy |
-------------|--------|-------|---------|---------|---------|
Combat       |   —    |       |         |         |         |
Craft        |        |   —   |         |         |         |
Explore      |        |       |    —    |         |         |
Stealth      |        |       |         |    —    |         |
Economy      |        |       |         |         |    —    |
```

### Worked Example: Action-Survival Game

```
             | Combat | Craft  | Explore | Stealth | Economy |
-------------|--------|--------|---------|---------|---------|
Combat       |   —    | →Feed  | ⊗Attn   | ✦Emrg   | →Feed   |
Craft        | ⊕Enabl |   —    | ⊕Enabl  | ⊕Enabl  | ⊣Constr |
Explore      | →Feed  | →Feed  |    —    | ⊕Enabl  | →Feed   |
Stealth      | ✦Emrg  | ·Indep | →Feed   |    —    | ·Indep  |
Economy      | ⊣Constr| →Feed  | ⊕Enabl  | ·Indep  |    —    |
```

**Reading the matrix:**
- Row = source system, Column = target system
- Combat → Craft (Feed): combat produces materials for crafting
- Stealth ✦ Combat (Emergent): combining stealth with combat creates ambush tactics neither system produces alone
- Stealth · Economy (Independent): no meaningful connection — potential missed opportunity or acceptable isolation

### Matrix Health Indicators

- **Any row or column that is all `·` (Independent):** Vestigial system. Cut it or connect it.
- **Many `✦` (Emergent) cells:** Strong sign of depth. Protect these interactions.
- **No `⊣` (Constrains) cells:** Systems may lack tension. Players can engage everything without trade-offs.
- **Dense `⊗` (Conflicts) cells:** Players may feel pulled in too many directions. Reduce competing demands.

---

## System Selection

Not every game needs every possible system. Start from intent, not from a feature list.

### Derivation Method

1. **Start from experience pillars** (from **game-vision**) — what does this game want players to feel?
2. **Derive core loop verbs** — what does the player *do* repeatedly?
3. **Identify required systems** — which systems do those verbs demand?
4. **Add supporting systems** — only if they strengthen the core loop
5. **Stop** — resist the urge to add more

### The Three-Gate Filter

Before adding any system, it must pass all three gates:

| Gate | Question | If "No" |
|------|----------|---------|
| **Pillar** | Does this system serve an experience pillar? | Cut it — no pillar means no purpose |
| **Decision** | Does it create meaningful player decisions? | Redesign it — systems without decisions are content, not systems |
| **Interaction** | Does it interact with at least 2 other systems? | Defer it — isolated systems add complexity without depth |

A system that fails any gate is a candidate for cutting or deferral, not implementation.

---

## Coupling Analysis

How tightly systems depend on each other determines the architecture's flexibility and depth.

### Coupling Spectrum

| Level | Description | Example | Properties |
|-------|-------------|---------|------------|
| **Tight** | Systems are inseparable; changing one requires changing the other | Combat ↔ Health | High cohesion, brittle if poorly designed, essential for core loop |
| **Loose** | Systems enrich each other but function independently | Trading ↔ Exploration | Flexible, composable, good for supporting systems |
| **None** | No interaction whatsoever | Weather ↔ Inventory (if weather has no gameplay effect) | Waste — the system exists but contributes nothing to the whole |

### Coupling Guidelines

- **Core loop systems should be tightly coupled.** The actions at the heart of your game must be inseparable. If you can remove one without affecting the others, it's not truly core.
- **Supporting systems should be loosely coupled.** They add depth and variety, but the game must function (at reduced quality) without them.
- **No system should be completely uncoupled.** An isolated system is dead weight. If it doesn't interact with anything, it's consuming development budget and player attention for zero depth.
- **No system should couple to everything.** A system that touches every other system is a god-system — brittle, hard to tune, impossible to test in isolation. If you find one, decompose it.

### Coupling Diagnostic

- [ ] Every core loop system is tightly coupled to at least one other core system
- [ ] Supporting systems have 2-3 loose couplings, not 0 or 7+
- [ ] No system is completely isolated
- [ ] No single system is coupled to more than 60% of all other systems
- [ ] Removing any supporting system degrades but doesn't break the core loop

---

## Emergence Analysis

Emergence is when interacting systems produce behaviors that no individual system was designed to create. It is the source of depth, replayability, and "I can't believe that worked" moments.

### Emergence Categories

| Category | Description | Response |
|----------|-------------|----------|
| **Beneficial** | Player creativity, unexpected strategies, emergent narratives | Protect. Do not patch out. Highlight in tutorials or community. |
| **Neutral** | Surprising but harmless behaviors | Monitor. May become beneficial or degenerate over time. |
| **Degenerate** | Exploits, content trivialization, infinite loops, economy breaks | Fix. But understand the root interaction before patching — a naive fix often creates new degenerate emergence. |

### Predicting Emergence

You cannot predict all emergent behaviors. The combinatorial space of system interactions grows factorially. But you can be systematic about the ones you check:

**Step 1: Two-system interactions.** For each pair of systems, ask: "What happens when a player uses A and B together in ways I didn't explicitly design?" Trace the most obvious combinations.

**Step 2: Three-system chains.** For each triple, trace: "If A feeds B and B enables C, what does A indirectly produce in C?" Three-system chains are where most non-obvious emergence lives.

**Step 3: Accept the unknown.** Beyond three systems, the combinatorial explosion means you will encounter emergence in playtesting that you did not predict. This is not a failure — it is the nature of systems.

### Designing for Graceful Emergence

Since you can't predict everything, design systems that handle unexpected interactions gracefully:

- **Cap extreme outputs.** If any value can grow unbounded through system interactions, cap it.
- **Preserve invariants.** Define rules that must never be violated (e.g., "health never exceeds max," "economy never goes negative") and enforce them at the system boundary, not inside individual systems.
- **Playtest early with system combinations.** Don't test systems in isolation and then combine them. Combine them immediately and let emergence reveal itself while you can still adjust.

---

## Possibility Space

The possibility space is the combinatorial space of all meaningful player choices across all systems.

### Size vs. Meaning

A large possibility space creates replayability and unique sessions. But size alone is not enough — the space must be **meaningfully large**.

| Property | Meaningfully Large | Merely Combinatorial |
|----------|--------------------|----------------------|
| **Player experience** | Different choices produce qualitatively different play sessions | Different choices produce different numbers but the same experience |
| **Strategy diversity** | Multiple viable approaches coexist | One approach dominates regardless of choices |
| **Replayability** | "I want to try a different build" | "I already know what happens" |
| **Observation** | Watching two players reveals different styles | Watching two players reveals the same patterns with different stats |

### Measuring Possibility Space Quality

The clearest signal that your possibility space is working: **predictable player archetypes emerge from behavioral diversity.**

When systems interact well, players self-sort into recognizable play styles (builder, fighter, explorer, optimizer) — but within each archetype, individual sessions differ. This is a measurable quality signal:

- **If no archetypes emerge:** systems aren't interacting enough to create distinct strategies
- **If archetypes emerge but sessions within an archetype are identical:** the possibility space is wide but shallow
- **If archetypes emerge AND sessions within them differ:** the possibility space is working

### Expanding Possibility Space

The fastest way to expand meaningful possibility space is not to add more systems — it is to deepen interactions between existing ones. Each new interaction between existing systems multiplies the possibility space. Each new isolated system only adds to it.

---

## Cursed Problems

Some design tensions are fundamental. They cannot be resolved through clever implementation — they require a choice at the vision level and acceptance of the trade-off cost.

### Common Cursed Problems

| Tension | Side A | Side B | Why It's Cursed |
|---------|--------|--------|-----------------|
| **Physics vs. Controls** | Realistic physics simulation | Responsive, predictable player controls | Realistic physics introduces latency and unpredictability that undermines player agency |
| **Exploration vs. Narrative** | Open-ended exploration | Tight narrative pacing | Free exploration breaks pacing; tight pacing restricts exploration |
| **Customization vs. Balance** | Deep player customization | Competitive balance | More build options = more edge cases = more balance failures |
| **Complexity vs. Accessibility** | Deep interacting systems | Low barrier to entry | Every system a new player must learn is a potential quit point |
| **Emergence vs. Authorship** | Emergent systemic outcomes | Hand-crafted narrative moments | Emergence disrupts scripted events; scripted events constrain emergence |
| **Persistence vs. Freshness** | Permanent player progress | Sessions that feel new and challenging | Accumulated power trivializes content that was once meaningful |

### Resolution Framework

1. **Identify the tension** — name both sides explicitly
2. **Choose a side** — one must be primary. "Both equally" is a non-decision that produces a mediocre compromise on both axes
3. **Mitigate the sacrifice** — once you've chosen, invest design effort in reducing the cost of the side you didn't pick
4. **Document the decision** — cursed problems resurface repeatedly during development. Without documentation, the team will relitigate the same trade-off in every feature discussion

Cursed problems resolved at the vision level stay resolved. Cursed problems deferred to implementation resurface as bugs, "feels wrong" feedback, and scope creep.

---

## System Health Metrics

How to measure whether the system architecture is producing depth.

### Telemetry-Based Metrics

| Metric | What to Measure | Healthy Signal |
|--------|-----------------|----------------|
| **Behavioral diversity** | Session-to-session variance in player actions | Different players (and same player across sessions) take meaningfully different paths |
| **Archetype formation** | Cluster analysis on player behavior data | 3-6 distinct play style clusters emerge naturally |
| **System utilization** | % of systems each player engages with per session | >70% of systems see meaningful engagement (not just incidental contact) |
| **Depth gradient** | Qualitative difference between novice and expert play | Expert play looks qualitatively different, not just faster or more efficient |

### Qualitative Metrics

| Metric | Source | Healthy Signal |
|--------|--------|----------------|
| **Session uniqueness** | Playtest reports, community discussion | Players report "I didn't know that was possible" or "something unexpected happened" |
| **Strategy sharing** | Community forums, social media | Players share different approaches that all work |
| **Vestigial detection** | Playtest observation | No system is consistently ignored by players |
| **Combo discovery** | Playtest observation, analytics | Players find system combinations you didn't explicitly design |

---

## System Prioritization

What to build first when you can't build everything.

### Build Order Principles

1. **Core loop systems first, always.** Nothing else matters if the 10-second loop isn't working. Every prototype session should exercise the core loop.

2. **Progression is the most critical system for retention.** A game with excellent core mechanics and no progression loses players. Progression converts "fun for 20 minutes" into "fun for 20 hours." Build it second.

3. **Economy and AI behavior are foundational.** Most other systems are downstream of resource flow and entity behavior. Get these right early — retrofitting them is expensive.

4. **Social systems are force multipliers.** In multiplayer or community-facing games, social systems (trading, cooperation, competition, communication) amplify every other system. But they require all other systems to function first.

5. **Team size determines system count.** The number of systems you can build to equal depth is proportional to your team. Solo and small teams must ruthlessly cut systems until every remaining system is excellent. A game with three polished, interacting systems is better than a game with eight half-built ones.

### Prioritization Checklist

- [ ] Core loop systems identified and built first
- [ ] Each system in the build plan passes the Three-Gate Filter
- [ ] System count is appropriate for team size and timeline
- [ ] Interaction matrix shows sufficient coupling at each development milestone
- [ ] No system is planned that doesn't interact with a system already built or planned for the same milestone

---

## The Systems Thinker's Diagnostic

When told "the game has lots of features but doesn't feel deep," run this diagnostic in order:

### Step 1: Check System Interactions

Build or review the interaction matrix. Count the `·` (Independent) cells.

- **If >40% of cells are Independent:** Systems are parallel silos. Depth requires interaction. Add connections before adding systems.
- **If most cells are `→` (Feeds) only:** The architecture is linear (pipeline), not interconnected. Look for opportunities to add feedback loops, constraints, and emergent interactions.

### Step 2: Check Possibility Space

Are system interactions producing meaningfully different outcomes?

- **Test:** Have 5 players play the same content. Do their sessions look different? Not just different numbers — different *strategies, sequences, and stories*.
- **If sessions look the same:** Interactions exist but don't create divergent outcomes. Deepen the interactions or add constrain/conflict relationships.

### Step 3: Check for Dominant Strategies

If one path through the systems is always best, the possibility space collapses to a single point regardless of how large it theoretically is.

- **Test:** Is community consensus converging on "the best build"?
- **If yes:** See **game-balance** for dominant strategy detection and remediation.

### Step 4: Check System Utilization

Are players engaging with all systems, or ignoring some?

- **If systems are being ignored:** They may be vestigial (not connected), underpowered (not rewarding), or too costly to engage with (attention budget exceeded).
- **Each ignored system is complexity without depth.** Cut it, connect it, or buff it.

### Step 5: Check Depth Gradient

Does expert play look qualitatively different from novice play?

- **If expert play is just "faster novice play":** The systems don't have enough interaction depth to reward mastery. Add layers that only reveal themselves through system mastery.
- **If expert play looks different:** The architecture is working. Focus on other symptoms.

---

## Anti-Patterns

### Feature-First Thinking

**Symptom:** Design discussions center on "what feature do we add next?" instead of "what happens when systems collide?"

**Consequence:** Each feature is a silo. The game accumulates breadth without depth. Players say "there's a lot to do but it all feels the same."

**Fix:** Redirect every feature discussion through the interaction matrix. "Where does this system connect?"

### System Isolation

**Symptom:** Each system is self-contained with clean inputs and outputs but no interaction with other systems.

**Consequence:** Technically excellent engineering that produces a shallow game. The systems are modular in the wrong way — modular for code maintainability instead of modular for play depth.

**Fix:** Loose coupling for code, tight coupling for play. Systems should be independently deployable but not independently experienced.

### Complexity Hoarding

**Symptom:** Adding systems because "more systems = more depth."

**Consequence:** Each system is shallow because development budget is spread thin. Players are overwhelmed by breadth and never discover the depth of any single system.

**Fix:** Subtract a system. Invest the freed budget in deepening interactions between the remaining ones. Repeat until every system is excellent.

### The 15-System Trap

**Symptom:** The design document lists every system the game could possibly have. Combat, crafting, building, farming, fishing, cooking, trading, taming, sailing, diplomacy, research, religion, weather, seasons, breeding...

**Consequence:** None of them ship at quality. The game is a mile wide and an inch deep.

**Fix:** Pick the 3-5 systems your experience pillars require. Build those. Ship. Add more only if the core is already deep.

### Content Over Systems

**Symptom:** When the game feels shallow, the response is "add more content" (more levels, more items, more quests) instead of "deepen interactions."

**Consequence:** Temporary engagement bump followed by the same shallowness. Content is consumed; systems are played.

**Fix:** Before adding content, check the interaction matrix. If interactions are weak, no amount of content will create depth. Deepen systems first, then fill them with content.

---

## Cross-References

| Area | Skill | When to Go There |
|------|-------|-------------------|
| Individual mechanic evaluation | **game-design** | Evaluating a single mechanic with the 5-Component Filter before it enters the system architecture |
| Vision and pillars | **game-vision** | Defining experience pillars that drive system selection — do this before building the interaction matrix |
| Engagement loops | **experience-design** | Designing the core loop that systems serve — systems exist to make the loop deep |
| Numeric balance between systems | **game-balance** | Tuning the numbers at system boundaries — cost curves, economy flow, dominant strategies |
| Reward and motivation systems | **motivation-design** | Designing reinforcement schedules and reward structures that operate across systems |
| Resource flow and currencies | **economy-design** | Deep dive on sink/source balance, inflation control, and currency design within the economic system |
| Encounter and enemy behavior | **encounter-design** | Designing spatial and AI behavior systems that interact with combat, stealth, and exploration |
| Narrative as a system | **narrative-design** | When narrative isn't just wrapper but a system with its own interactions (quest structures, branching) |
| Difficulty and progression | **progression-systems** | Power curves and flow channel — progression is typically the highest-priority supporting system |
| Feedback and juice | **game-feel** | Making system interactions feel good at the moment-to-moment level |
| Player cognitive load | **player-ux** | When system count or interaction complexity exceeds player attention budget |
| Validation | **playtest-design** | Testing whether the system architecture produces the depth you designed for |

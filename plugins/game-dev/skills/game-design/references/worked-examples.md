# Worked Examples: The Full Pipeline

These examples show how the skill stack works together on concrete design problems. Each traces the flow from vision through systems to evaluation.

---

## Example 1: Designing an Arcade Shooter (Vision → Systems → Mechanics)

### Step 1: Game Vision

**Core Fantasy:** "You're a lone ship holding the line against impossible odds, surviving through skill and split-second decisions."

**Experience Pillars:**
1. Moment-to-moment intensity (never a dull second)
2. Mastery progression (the player gets better, not just the ship)
3. "One more run" pull (short sessions, high replayability)

**Core Loop:** `Dodge → Shoot → Collect → Upgrade → Dodge ...` (5-second cycle)

**Target Experience Statement:** "In *Void Breach*, players experience escalating tension and mastery satisfaction by dodging, shooting, and making split-second upgrade decisions in a procedurally intensifying arena."

### Step 2: System Derivation (from game-vision)

Pillar 1 (intensity) requires: **Combat**, **Spawning**
Pillar 2 (mastery) requires: **Progression** (within-run), **Combat** (depth)
Pillar 3 (replayability) requires: **Progression** (meta), **Spawning** (variety)

**Derived systems:** Combat, Spawning, In-Run Progression, Meta Progression
**Cut:** Economy (no shop needed), Narrative (not a pillar), Social (solo game), Crafting (too complex for arcade)

### Step 3: Interaction Matrix (from systems-design)

```
              | Combat | Spawning | In-Run Prog | Meta Prog |
--------------|--------|----------|-------------|-----------|
Combat        |   —    | →Feed    | →Feed       | →Feed     |
Spawning      | ⊕Enabl |    —     | ⊣Constr     | ·Indep    |
In-Run Prog   | ⊕Enabl | ✦Emrg    |      —      | ·Indep    |
Meta Prog     | ⊕Enabl | ·Indep   | ⊕Enabl      |    —      |
```

**Reading:** Combat feeds everything (kills generate XP, drops, and meta-currency). Spawning enables combat (provides targets) and constrains in-run progression (harder waves limit growth). In-run progression creates **emergence** with spawning: upgrade choices interact with wave composition to create unique strategies per run.

**Health check:** No isolated systems. One emergence cell. Sufficient tension (spawning constrains progression). 4 systems is appropriate for a solo developer.

### Step 4: Mechanic Evaluation (from game-design)

Evaluating the core shooting mechanic with the 5-Component Filter:

| Component | Rating | Notes |
|-----------|--------|-------|
| Clarity | Strong | Projectiles are visible, enemies telegraph attacks |
| Motivation | Strong | Every kill drops XP, enemies threaten survival |
| Response | Critical | Must be < 50ms input-to-fire. No animation lockouts. |
| Satisfaction | Needs work | Need hit stop on kills, screen shake on explosions |
| Fit | Strong | Fast, snappy shooting matches the "lone ship" fantasy |

**Action:** Focus game-feel work on Satisfaction — add juice (hit stop, particles, screen shake).

### Step 5: Encounter Design

**Wave 1-3:** Swarm enemies only (teach basic movement + shooting)
**Wave 4-5:** Add Artillery enemies (teach positioning)
**Wave 6-8:** Add Defenders (teach target prioritization)
**Wave 9-10:** Mix all types (test full skill set)
**Boss every 10 waves:** Multi-phase, tests specific skills per phase

**Space:** Single arena, no cover (arcade purity). Increasing spawn density IS the difficulty curve.

---

## Example 2: Diagnosing "It Feels Shallow" (Diagnostic Flow)

A game has combat, crafting, exploration, and a quest system — but playtesters say "there's a lot to do but nothing matters."

### Step 1: Systems Diagnostic (from systems-design)

Build the interaction matrix:

```
              | Combat | Craft | Explore | Quests |
--------------|--------|-------|---------|--------|
Combat        |   —    | ·Indep| ·Indep  | →Feed  |
Craft         | ·Indep |   —   | ·Indep  | ·Indep |
Explore       | ·Indep | ·Indep|    —    | →Feed  |
Quests        | ⊕Enabl | ·Indep| ⊕Enabl  |   —    |
```

**Diagnosis:** 8 of 12 cells are Independent. Systems are parallel silos. Combat and crafting don't interact at all. Exploration feeds quests but nothing else. There's zero emergence.

### Step 2: Add Interactions

**Combat → Craft:** Combat drops materials for crafting (Feed)
**Craft → Combat:** Crafted weapons change combat capabilities (Enable)
**Explore → Craft:** Exploration discovers recipes and rare materials (Feed)
**Quests → Craft:** Quest rewards include unique crafting blueprints (Feed)

Updated matrix:
```
              | Combat | Craft  | Explore | Quests |
--------------|--------|--------|---------|--------|
Combat        |   —    | →Feed  | ·Indep  | →Feed  |
Craft         | ⊕Enabl |   —    | ·Indep  | ·Indep |
Explore       | ·Indep | →Feed  |    —    | →Feed  |
Quests        | ⊕Enabl | →Feed  | ⊕Enabl  |   —    |
```

Now 8 of 12 cells are active. Combat and crafting form a feedback loop. Exploration feeds crafting. The possibility space just expanded dramatically — players can now pursue "explorer-crafter" or "combat-looter" or "quest-completionist" strategies.

### Step 3: Check for Emergence

**Combat ✦ Craft ✦ Explore:** A player explores a dangerous area, finds rare materials, crafts a specialized weapon, then uses that weapon to access even more dangerous areas. This is an emergent progression loop that no single system creates alone.

**Result:** Depth without adding any new systems — just connecting existing ones.

---

## Example 3: "The Economy Is Broken" (Economy Diagnostic)

Players report that gold is worthless after 5 hours of play.

### Step 1: Draw the Flow Model (from economy-design)

```
Sources:           Sinks:
  Enemy drops ——→ [Player Gold] ——→ Potion purchases
  Quest rewards ——→             ——→ Weapon upgrades
  Chest loot ——→                ——→ Fast travel fees
```

### Step 2: Estimate Rates

| Source | Gold/Hour | | Sink | Gold/Hour |
|--------|----------|---|------|----------|
| Enemy drops | 500 | | Potions | 100 |
| Quests | 300 | | Upgrades | 200 (one-time) |
| Chests | 200 | | Fast travel | 50 |
| **Total in** | **1000** | | **Total out** | **350** |

**Diagnosis:** Net inflow of 650 gold/hour. After 5 hours, the player has accumulated 3250+ gold with nothing to spend it on. Upgrades are one-time sinks that stop consuming once purchased. The economy is inflationary by design.

### Step 3: Fix (from economy-design)

**Option A: Add sinks** — Weapon durability (recurring sink), crafting costs (connects to another system), cosmetic shop (voluntary sink)

**Option B: Reduce sources** — Diminishing returns on enemy drops per area (encourages exploration), quest rewards scale with level but prices scale faster

**Option C: Add a converter** — Crafting transforms gold + materials into items (creates cross-system interaction, gives gold a purpose beyond shopping)

**Chosen:** Option C — it fixes the economy AND deepens the system interaction matrix. The gold → crafting → better gear → harder areas → more gold loop creates meaningful circulation instead of accumulation.

---

## Example 4: Council Debate Format

Topic: "Should we add a trading system to our co-op survival game?"

### Systems Architect (using systems-design)
"Trading adds 3 new interactions to our matrix — it connects economy, crafting, and social systems. The Interaction Matrix shows our social system is currently isolated (2 Independent cells). Trading would change both to Feed/Enable. I recommend it for systemic depth."

### Economy Skeptic (using economy-design + game-balance)
"Trading between players creates a SECOND economy layer. We need to model: What prevents veterans from gifting overpowered items to new players? What prevents real-money trading? Our current economy simulation doesn't account for player-to-player flow. I need to see the flow diagram with trading before I approve."

### Player Advocate (using player-ux + motivation-design)
"Trading adds a new system players must learn. Our complexity budget (player-ux) is already tight with 5 systems. However, trading satisfies the Relatedness need in SDT — our weakest motivation pillar. If we can keep the UX simple (no auction house, just direct trade), the cognitive cost is manageable."

### Experience Advocate (using experience-design)
"Check the Experience Triangle. Trading is a mechanic (vertex 1), and it connects to fiction (bartering for survival makes narrative sense, vertex 2). But what's the feedback (vertex 3)? Players need to FEEL the trade was meaningful. If it's just moving numbers around, it fails the Satisfaction component."

**Resolution:** Add direct trading (simple UX), with flow model showing player-to-player connections, a level-gate on tradeable items (prevents veteran→newbie economy breaking), and a trade confirmation screen with clear value comparison (feedback vertex).

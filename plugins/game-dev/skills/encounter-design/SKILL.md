---
name: encounter-design
description: "Spatial design, enemy behavior, encounter composition, and environmental flow. Use when designing combat encounters, enemy AI, level layouts, boss fights, environmental puzzles, placing enemies or items in space, designing world structure, or when encounters feel repetitive, unfair, or tactically flat. Covers the Encounter Triangle (space, adversaries, resources), combat space vocabulary, enemy archetypes, AI behavior patterns, encounter pacing, environmental guidance, world structure, and environmental storytelling."
---

# Encounter Design

**Purpose:** Tools for designing how players experience space and adversaries. An encounter is not a stat block dropped into a room — it is the intersection of spatial geometry, enemy behavior, and player resources that produces a tactical experience. This skill covers the full chain from world structure down to individual enemy placement.

**Core insight:** The same enemies in a different space feel completely different. The same space with different resources creates different strategies. Encounter design is combinatorial — small changes to any axis reshape the entire experience.

---

## When to Activate

Use this skill when:
- Designing combat encounters, arenas, or enemy placement
- Building enemy AI or defining enemy behavior patterns
- Planning level layouts, room flow, or world structure
- Designing boss fights or multi-phase encounters
- Creating environmental puzzles or hazard-based challenges
- Encounters feel repetitive, samey, or tactically flat
- Players report encounters feel unfair or unreadable
- Deciding how to guide players through space without explicit markers
- Designing the macro structure of a game world (linear, hub, open)

---

## Core Framework: The Encounter Triangle

Every encounter is shaped by three forces. The experience emerges from their intersection, not from any single axis.

```
           Space
       (WHERE it happens)
          /        \
         /          \
        /   encounter \
       /   experience  \
      /                 \
Adversaries ———————— Resources
(WHO they face)      (WHAT they have)
```

| Axis | What It Controls | Design Levers |
|------|-----------------|---------------|
| **Space** | Geometry, cover, elevation, sight lines, movement options | Room shape, verticality, choke points, flanking routes, hazards |
| **Adversaries** | Enemy types, behaviors, group composition, timing | Archetypes, AI complexity, wave structure, spawn placement |
| **Resources** | Health, ammo, abilities, environmental tools, information | Scarcity, placement, risk/reward of acquisition |

**The combination is the design.** Changing one axis changes the experience:

| Same Enemies, Different Space | Same Space, Different Resources |
|------------------------------|--------------------------------|
| Open arena → skill-based dodging | Full ammo → aggressive push |
| Tight corridor → claustrophobic pressure | Scarce ammo → cautious resource management |
| Elevated platforms → vertical tactics | New ability just unlocked → mastery testing |
| Multiple entrances → flanking anxiety | Environmental tools available → creative solutions |

**Diagnostic:** When an encounter feels wrong, identify which axis is underdesigned. Most "boring" encounters have interesting enemies in uninteresting space, or interesting space with no resource tension.

---

## Combat Space Composition

Space is not a container for combat — it is a participant. Every spatial element shapes player behavior.

### Space Elements

| Element | Behavior It Creates | Design Consideration |
|---------|--------------------|--------------------|
| **Cover** | Approach decisions, safety management | Must be destructible or flanakable to prevent camping |
| **Sight lines** | Long = ranged advantage; short = close-quarters tension | Mix lengths to reward weapon/ability switching |
| **Elevation** | High ground advantage, verticality adds decision layers | Ensure both high and low positions have trade-offs |
| **Choke points** | Force commitment, create risk/reward | Powerful but can feel unfair if enemies use them without counter |
| **Flanking routes** | Reward spatial awareness, punish tunnel vision | Must be readable — players need to know routes exist |
| **Environmental hazards** | Add urgency, create area denial | Should be readable before they activate; punish carelessness, not ignorance |
| **Interactables** | Creative problem-solving, environmental mastery | Explosive barrels, bridges, switches — reward observation |

### Space Vocabulary

Different room shapes produce fundamentally different encounters:

| Space Type | Geometry | Behavior It Encourages | Best For |
|-----------|----------|----------------------|----------|
| **Arena** | Open, symmetric, few obstacles | Skill-based movement, dodging, spacing | Boss fights, duels, skill tests |
| **Corridor** | Long and narrow, limited lateral movement | Funneled intensity, resource attrition | Building tension, gauntlets |
| **Hub** | Central area with multiple exits/entrances | Multi-directional awareness, choice of engagement | Exploration pivots, ambush setups |
| **Gauntlet** | Linear with sequential challenges | Sustained pressure, endurance testing | Climactic sequences, escape scenes |
| **Balcony** | Split-level with overlook positions | Ranged/melee asymmetry, vertical tactics | Mixed-range encounters |
| **Labyrinth** | Interconnected paths, limited visibility | Paranoia, ambush potential, navigation challenge | Horror, stealth, cat-and-mouse |
| **Killzone** | Inescapable area with escalating threat | Survival pressure, crowd management | Wave defense, holdout scenarios |

**Design rule:** Vary space types across a level. Three arenas in a row feel repetitive regardless of enemy variation. Alternate space vocabulary to keep encounters feeling fresh.

---

## Enemy Design as System

Enemies are behavior systems, not stat blocks. A slow enemy that blocks a doorway is more interesting than a fast enemy with more HP, because the first one changes what the player *does*.

### Enemy Archetypes

| Archetype | Role | Player Response It Forces |
|-----------|------|--------------------------|
| **Aggressor** | Closes distance, applies pressure | Reactive play, retreat decisions, priority targeting |
| **Defender** | Holds position, blocks progress | Approach planning, finding weak points, patience |
| **Supporter** | Buffs or heals other enemies | Target prioritization, "kill the healer" decisions |
| **Disruptor** | Breaks player patterns, denies abilities | Adaptation under pressure, fallback strategies |
| **Artillery** | Ranged area denial, long-range threat | Positioning awareness, closing distance under fire |
| **Swarm** | Overwhelms with individually-weak numbers | Crowd management, area-of-effect decisions |
| **Elite/Boss** | Multi-phase, tests multiple skills | Full mastery demonstration, pattern recognition |

### Composition Rules

Encounters become interesting through archetype *combinations*, not individual enemies:

- **Aggressor + Artillery** = the player is forced to close distance (artillery threat) while managing melee pressure (aggressor). Classic push-pull.
- **Defender + Supporter** = the player must find a way past the defender to reach the supporter, or the encounter becomes attrition.
- **Swarm + Disruptor** = the player's crowd-clearing tools get disrupted, forcing improvisation.

**Minimum viable encounter:** Two archetypes that create a tension the player must resolve. A single archetype is a puzzle with one answer; two archetypes create a dilemma.

### Enemy Readability

Players must identify enemy type and predict behavior from visual design alone.

- [ ] Silhouette is distinct from other enemy types at gameplay distance
- [ ] Color/material signals threat level or behavior type
- [ ] Animations telegraph attacks before they resolve
- [ ] Audio cues differentiate enemy types (especially off-screen)
- [ ] New enemy types are introduced in low-pressure situations before appearing in difficult encounters

**Design rule:** If the player dies to an enemy they couldn't read, that is a design failure, not a skill failure.

---

## Behavior Design Patterns

Enemy AI architecture determines what behaviors are possible. Choose the simplest architecture that supports the design intent.

| Architecture | Behavior Quality | Design Control | Best For |
|-------------|-----------------|----------------|----------|
| **State Machine** | Predictable, readable | High — every transition is explicit | Basic enemies, tutorial enemies, bosses with clear phases |
| **Behavior Tree** | Flexible, modular | Medium — composable but designable | Mid-complexity enemies, group behaviors, enemies that adapt to context |
| **Utility AI** | Context-sensitive, emergent | Lower — harder to predict exact behavior | Complex enemies, allies, sandbox/simulation behaviors |
| **GOAP** | Plans multi-step actions, strategic | Lowest — emergent plans can surprise designers | Strategic enemies, simulation games, enemies that use the environment |

**Complexity rule:** Start with state machines. Only add architectural complexity when the design *requires* behaviors that simpler systems cannot express. A state machine with 5 states is easier to tune, debug, and balance than a behavior tree with 30 nodes that produces the same behavior.

### Difficulty Through Behavior

Good difficulty scaling changes what enemies *do*, not just their stats.

| Lazy Difficulty (avoid) | Behavioral Difficulty (prefer) |
|------------------------|-------------------------------|
| More HP | More aggressive — shorter hesitation before attacking |
| More damage | Better coordination — enemies flank, cover each other |
| Faster movement | Smarter target selection — prioritize vulnerable player states |
| More enemies (only) | More varied tactics — use cover, retreat when low, call reinforcements |
| Reduced player resources (only) | Faster adaptation — enemies change strategy when their approach fails |

Stat scaling is sometimes necessary, but it should never be the *only* difficulty lever. When the player's experience of an encounter doesn't change between easy and hard mode, difficulty is being faked.

---

## Encounter Pacing

An encounter is not a single moment — it has internal rhythm.

### Wave Structure

How enemies arrive shapes the encounter's emotional arc:

```
Intensity
    |        ___
    |       /   \     ___
    |      /     \   /   \
    |  ___/       \_/     \___
    | /                       \___
    +--------------------------------→ Time
     Intro  Escalate  Climax  Breathe
```

1. **Introduction** — Low-threat enemies establish the space and rules. Players orient.
2. **Escalation** — New archetypes arrive, combinations emerge, pressure builds.
3. **Climax** — Maximum challenge. The combination that tests everything introduced so far.
4. **Breathing room** — Threat subsides. Resource collection, exploration, narrative beats.

**Design rule:** Every encounter needs a readable beginning and end. If the player cannot tell when an encounter starts or when it is over, the pacing is broken.

### Rest Between Encounters

Rest is not absence of content. Rest is a different *type* of content:
- Exploration and discovery
- Narrative and environmental storytelling
- Resource management and planning
- Skill/loadout customization
- Anticipation of what comes next

**Cognitive recovery is real.** After high-intensity encounters, players need time to encode what they learned. Skip this and they feel exhausted without feeling accomplished. The relationship between encounter pacing and session pacing is covered in **experience-design**.

### Boss Design

Bosses are multi-phase encounters that test accumulated mastery:

- [ ] Each phase tests a different skill the player has been building
- [ ] Phases escalate in challenge and intensity
- [ ] Phase transitions are readable — clear visual/audio signals
- [ ] Early phases include learning moments (safe opportunities to observe new patterns)
- [ ] At least one phase rewards spatial awareness, not just reaction time
- [ ] The boss can be "read" — attack patterns are learnable, not random
- [ ] Victory feels like mastery demonstration, not attrition survival

---

## Environmental Flow

How players move through space without explicit markers. The environment itself should communicate where to go and what matters.

### Guidance Tools

| Tool | How It Works | When to Use |
|------|-------------|-------------|
| **Light** | Players move toward light, especially in dark environments | Guiding through caves, corridors, ambiguous paths |
| **Color contrast** | Warm colors attract, cool colors recede; high contrast draws the eye | Highlighting interactables, goals, important paths |
| **Geometry** | Wide paths invite, narrow paths signal danger or importance | Controlling pace, signaling transitions |
| **Motion** | Anything moving draws attention over static elements | Drawing the eye to important elements in busy scenes |
| **Audio** | Sound sources guide exploration; volume implies proximity | Guiding when visuals are obscured or ambiguous |
| **Vista/reward** | Visible goals in the distance pull players forward | Motivating traversal, communicating progress |

### Landmark Theory

Players build mental maps using distinctive landmarks. Effective landmarks:
- Are visually unique within their surroundings
- Are visible from multiple locations and angles
- Have a stable position (don't move or disappear)
- Help players orient without a minimap
- Create a sense of place — "the area near the broken tower," not "zone 3"

**Design rule:** If players need a minimap to navigate, the environment is not communicating well enough. Minimaps are a crutch for spaces that fail to self-document. Sometimes that crutch is necessary (open worlds, complex interiors), but the goal is environments that are navigable on their own.

---

## World Structure Patterns

How the overall game world is organized affects encounter pacing, player agency, and narrative delivery.

| Pattern | Structure | Pacing Implication | Best For |
|---------|-----------|--------------------|----------|
| **Linear** | A to B to C, one path forward | Tight authorial control, curated experience | Story-driven games, cinematic set pieces |
| **Hub-and-spoke** | Central area with branching paths | Player-directed pacing, return-to-safety rhythm | Adventure games, RPGs with a home base |
| **Metroidvania** | Interconnected, gated by abilities | Mastery-gated exploration, revisitation rewards | Progression-focused, ability-unlock games |
| **Open world** | Free traversal, distributed content | Player-paced, risk of aimlessness and content drought | Sandbox, exploration-driven experiences |
| **Roguelike/procedural** | Generated layouts per run | High variety, low per-room handcraft | Replayability-focused, emergent narrative |

### Hybrid Structures

Most shipped games combine patterns:
- Linear corridors connecting hub areas (action-adventure)
- Open world with linear mission interiors (open-world action)
- Hub-and-spoke with Metroidvania gating (Zelda-style progression)

**Design rule:** Choose the structure that serves your encounter pacing. If encounters need careful tuning, linear gives you control. If encounters need variety, procedural gives you breadth. The structure is not the game — it is the *delivery mechanism* for encounters.

---

## Environmental Storytelling

Space tells story without dialogue. The environment is a narrative medium.

### Techniques

| Technique | How It Works | Example |
|-----------|-------------|---------|
| **Found objects** | Items in context tell a story | A campsite with scattered belongings suggests hasty departure |
| **Environmental details** | Wear, damage, decoration reveal history | Claw marks on walls, faded posters, overgrown paths |
| **Spatial narrative** | The journey through a space IS the story | Ascending a tower shows civilization giving way to decay |
| **Contrast** | Juxtaposition creates meaning | A child's toy in a battlefield; a garden in a fortress |
| **Absence** | What's missing tells a story | Empty shelves, missing portraits, abandoned defenses |

### Integration Principles

- **Show, don't tell.** The environment should make the player curious. If a narrator has to explain what happened, the environment failed.
- **Reinforce mechanics.** Environmental storytelling should support, not contradict, what the game systems are saying. If the story says "this place is dangerous" but enemies are trivial, the fiction undermines itself.
- **Reward observation.** Players who look carefully should find more story, more resources, or more tactical information than players who rush through.
- **Layer, don't gate.** Environmental narrative should enrich the experience for those who notice it without blocking those who don't.

For deeper narrative structure (quest design, branching dialogue, story arcs), see **narrative-design**.

---

## Encounter Health Check

Evaluate every encounter before shipping:

- [ ] Does the space offer meaningful tactical choices? (Not just "run forward and shoot")
- [ ] Can the player read enemy types and predict behavior before engagement?
- [ ] Is there at least one approach that rewards spatial awareness?
- [ ] Does the encounter test a skill the player has been building?
- [ ] Is there breathing room before and after?
- [ ] Can the encounter be experienced differently on replay? (Multiple valid approaches)
- [ ] Does difficulty come from behavior and spatial challenge, not stat inflation?
- [ ] Is the encounter readable to a spectator? (Important for streaming and sharing)
- [ ] Are resources available in the space that reward exploration or risk-taking?
- [ ] Does the encounter composition use at least two enemy archetypes in tension?

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix Direction |
|-------------|-------------|---------------|
| **Stat-sponge enemies** | HP as difficulty doesn't change player behavior — same fight, longer | Difficulty through behavior changes, not stat scaling |
| **Empty arenas** | Open space with no tactical features reduces combat to stat checks | Add cover, elevation, hazards, interactables |
| **Spawn closets** | Enemies appearing from nowhere breaks spatial reasoning | Enemies should be visible or their arrival should be telegraphed |
| **Kill box repetition** | Same rectangular room every fight creates encounter fatigue | Vary space vocabulary — alternate arenas, corridors, hubs, balconies |
| **Behavior-less enemies** | Enemies that just walk toward the player are mobile health bars | Give every enemy at least one behavior that changes what the player does |
| **Unfair ambushes** | Player punished for information they cannot have | Ambushes must be survivable on first encounter; telegraph before lethal |
| **Difficulty cliff** | Sudden spike with no ramp or new tools to match | Introduce the challenge element in a safe context before the hard version |
| **Single-solution encounters** | Only one valid approach kills replayability and expression | Ensure space and enemy composition support at least two viable strategies |

---

## Cross-References

| Area | Skill | When to Use |
|------|-------|-------------|
| Mechanic evaluation | **game-design** | 5-Component Filter before encounter ships — is it clear, motivated, responsive? |
| Engagement and session pacing | **experience-design** | Encounter pacing within the larger session and campaign arc |
| Enemy stat balance | **game-balance** | Cost curves for enemy stats, dominant strategy detection in player loadouts |
| Combat feedback | **game-feel** | Hit impact, telegraph timing, juice — does combat *feel* right? |
| Cognitive load | **player-ux** | Is the encounter readable? Are enemy types distinguishable? Is the UI helping? |
| Difficulty and progression | **progression-systems** | Flow channel targeting, power curves, adaptive difficulty |
| Observation and testing | **playtest-design** | Testing whether encounters play as designed, what to observe |
| System interactions | **systems-design** | When enemies interact with game systems in emergent ways |
| Reward psychology | **motivation-design** | Loot placement, risk/reward in encounter resource design |
| Quest and story structure | **narrative-design** | When encounters serve narrative purpose, environmental storytelling integration |
| Economy integration | **economy-design** | When encounters are resource sources/sinks in the game economy |

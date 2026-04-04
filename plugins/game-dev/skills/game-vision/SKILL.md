---
name: game-vision
description: "Use when starting a new game project, pivoting a concept, evaluating whether an idea is worth building, or when prototyping has stalled without clarity. Provides a layered Vision Stack for going from raw concept to validated, structured design. Use BEFORE other game design skills — this is the upstream skill that establishes core fantasy, experience pillars, and core loop so that downstream skills (game-design, experience-design, systems-design, game-balance) have a clear target to work toward. Also use when a team cannot agree on what the game IS, or when scope keeps expanding without a north star."
---

# Game Vision

**Purpose:** Bridge the gap between creative intuition and structural rigor. A game concept that lives only in your head is untestable. This skill turns "I have an idea" into a validated, layered design that can be handed to specialized skills for detailed work.

**Position in workflow:** This is the UPSTREAM skill. Define vision here first, then fan out to **game-design** (mechanic evaluation), **experience-design** (engagement loops), **systems-design** (system interactions), and others. If you skip this step, downstream skills lack a target to evaluate against.

---

## When to Activate

Use this skill when:
- Starting a new game project from scratch
- Pivoting or rethinking a game concept that isn't working
- Evaluating whether an idea is worth building at all
- Prototyping has gone on too long without a clear hypothesis to test
- The team (or your own thinking) can't agree on what the game IS
- Scope keeps expanding and there's no north star for cutting decisions
- You need to communicate a game concept to collaborators or stakeholders
- Returning to a shelved concept and need to re-evaluate it

---

## Core Framework: The Vision Stack

A game vision is a stack of dependent layers. Each layer constrains and informs the layers below it. If you change a layer, everything below may need to change.

```
Layer 1: Core Fantasy          ← One sentence. The emotional promise.
Layer 2: Experience Pillars    ← 3-5 pillars that define the target experience
Layer 3: Core Loop             ← The irreducible verb sequence
Layer 4: Supporting Systems    ← Derived from pillars, each must serve one
Layer 5: Content Strategy      ← What fills the systems (levels, items, enemies)
```

### Layer 1: Core Fantasy

The answer to: **"What does the player FEEL like they're doing?"**

One sentence. Not what the game IS, but what the player FEELS. This is the emotional promise that every other design decision must serve.

| Weak Core Fantasy | Strong Core Fantasy |
|-------------------|---------------------|
| "A platformer with combat" | "You're a scrappy underdog who outsmarts enemies three times your size" |
| "An open-world RPG" | "You're a wanderer piecing together a forgotten civilization's final days" |
| "A city builder" | "You're a mayor making impossible trade-offs to keep a fragile city alive" |

**Test:** If two different games could share your core fantasy statement, it's too generic. If it doesn't imply an emotion, it's a genre label, not a fantasy.

### Layer 2: Experience Pillars

3-5 pillars that define the target experience. These are the qualities the game MUST deliver. Everything else is negotiable.

See [Experience Pillars Method](#experience-pillars-method) below for how to derive these.

### Layer 3: Core Loop

The irreducible verb sequence that IS the game. The smallest cycle of player action that produces engagement.

See [Core Loop Crystallization](#core-loop-crystallization) below.

### Layer 4: Supporting Systems

Systems derived from the pillars. Each system must serve at least one pillar, and each pillar must be served by at least one system.

See [System Derivation](#system-derivation) below.

### Layer 5: Content Strategy

What fills the systems: levels, enemies, items, dialogue, environments. Content is the fuel; systems are the engine. Once you reach this layer, fan out to specialized skills (**game-balance** for stats, **progression-systems** for pacing, **narrative-design** for story, **encounter-design** for level population).

---

## Experience Pillars Method

Pillars are the experience qualities the game must deliver. Deriving them is a five-step process.

### Step 1: Brainstorm

List everything exciting about the concept. No filtering, no judgment. Include feelings, verbs, moments, aesthetics, references to other games, half-formed ideas. Quantity over quality.

### Step 2: Cluster

Group related ideas. Look for themes. "Tense combat," "split-second decisions," and "barely surviving" might cluster into one group. "Building a base," "watching your creation grow," and "expressing yourself through design" might form another.

### Step 3: Prioritize

Force-rank clusters to exactly 3-5 pillars. This is the hard part. The discipline of cutting is the entire point.

**The pillar rule:** If it's not a pillar, it's a feature. Features can be cut. Pillars cannot. If everything is a pillar, nothing is.

### Step 4: Validate

Each pillar must pass two tests:
- **Testable:** Can you build a prototype that specifically tests this pillar?
- **Actionable:** Does this pillar imply concrete design decisions? ("Fun" is not actionable. "Tense survival under resource pressure" is.)

### Step 5: Conflict-Check

Do any pillars tension against each other? This is not necessarily bad — creative tension can define a game's identity — but the tension must be intentional, not accidental.

| Pillar A | Pillar B | Tension | Resolution |
|----------|----------|---------|------------|
| Strategic depth | Fast-paced action | Thinking vs. reacting | Alternate between planning phases and execution phases |
| Creative expression | Competitive balance | Freedom vs. fairness | Cosmetic creativity is free; mechanical creativity is constrained |
| Narrative immersion | Player agency | Authored story vs. player choice | Branching narrative with authored branches |

If pillars conflict, establish priority. When a design decision must favor one pillar over another, which one wins?

---

## Target Experience Statement

A single statement that serves as the north star for every design decision.

**Template:**

> In **[game title]**, players experience **[primary emotion sequence]** by **[core verbs]** in a world where **[fiction/setting premise]**.

Every design decision should be testable against this statement: "Does this serve the target experience?"

### Worked Examples

**Action-survival:**
> In *Ashfall*, players experience desperate resourcefulness by scavenging, crafting, and fortifying in a world where the volcanic winter is closing in and every supply run could be your last.

**Puzzle-exploration:**
> In *Hollow Light*, players experience wonder and dawning comprehension by navigating, observing, and experimenting in a world where ancient machines still run but nobody remembers what they were for.

**Strategy:**
> In *Tidelock*, players experience the weight of impossible trade-offs by allocating, negotiating, and sacrificing in a world where three island nations share one shrinking freshwater source.

**Roguelike:**
> In *Thornwild*, players experience improvisational mastery by combining, adapting, and risking in a world where every run through the overgrown ruins deals you a different hand of abilities.

---

## Core Loop Crystallization

The core loop is the smallest cycle of player action that is independently satisfying. Finding it requires distillation, not invention.

### Process

1. **List all player actions** the concept suggests. Everything the player might do.

2. **Draw dependency chains.** What must happen before what? What feeds into what?

3. **Find the smallest loop.** The tightest cycle: `Action → Feedback → Evaluation → Decision → Action ...`

4. **Test for independence.** Does this loop produce the target emotions WITHOUT supporting systems (progression, economy, narrative)? If the loop only becomes interesting with progression bolted on, the loop isn't strong enough.

5. **Test on paper.** The core loop should be compelling as a description before it's compelling as code. If you can't make someone excited about it in conversation, implementation won't save it.

### Core Loop Examples

| Game Type | Core Loop |
|-----------|-----------|
| Action-platformer | Move → Encounter obstacle → Execute skill → Survive/fail → Adapt approach |
| Deckbuilder | Draw hand → Evaluate options → Play cards → See outcome → Adjust strategy |
| City builder | Observe needs → Zone/build → Simulate → See consequences → Rebalance |
| Stealth | Scout → Plan route → Execute → Adapt when surprised → Reach objective |

### Red Flag

If your "core loop" has more than 5-6 verbs, it's not crystallized yet. You're describing a session, not a loop. Keep distilling.

---

## System Derivation

Given pillars, what systems does the game need? Systems should be derived from pillars, not invented independently.

### Process

For each pillar, ask: **What systems MUST exist to deliver this experience?**

| Pillar | Required Systems | Justification |
|--------|-----------------|---------------|
| "Tense survival" | Resource management, threat system, health/damage | Can't feel survival tension without scarcity and danger |
| "Creative expression" | Building/crafting, cosmetic system | Can't express creativity without tools to create |
| "Strategic mastery" | Unit composition, tech tree, counter system | Can't feel strategic without meaningful choices between approaches |

### The Two-System Minimum

Every system must interact meaningfully with at least two other systems. A system that operates in isolation is a candidate for cutting — it adds complexity without creating the emergent interactions that make games interesting.

**Test:** For each system, name two other systems it interacts with and describe how. If you can't, the system is either isolated (cut it) or the interactions haven't been designed yet (design them before building).

Cross-reference with **systems-design** for detailed system interaction architecture and emergence patterns.

### Build Order

1. **Core loop systems first.** The systems that make the core loop work.
2. **One supporting system at a time.** Add, test, validate. Does it make the core loop better?
3. **Resist parallel system development.** Two half-built systems interacting produce bugs and false signals. One complete system tells you something real.

---

## Minimum Viable Game (MVG)

The MVG is the smallest playable thing that tests your core hypothesis: **"Is the core loop inherently interesting?"**

### What to Include

- Core loop systems only
- Enough content to run the loop 10-20 times (not just once)
- Programmer art / placeholder content (visual fidelity is irrelevant)
- Game feel fundamentals (input responsiveness, feedback timing, camera behavior)

**Defer:** Progression, economy, narrative, menus, settings, save/load, polish, final art, audio beyond placeholder.

**Do NOT defer:** Game feel. A prototype with sluggish controls or missing feedback tests the wrong thing. You'll get false negatives — the loop might be good but you can't tell because interacting with it feels bad. See **game-feel** for the minimum viable juice checklist.

### The MVG Test

Put the MVG in front of someone who isn't you. Watch them play. Don't explain anything unless they're stuck. The question it answers: **"Is there something here?"** Not "is this game good?" — just: is the core loop producing engagement, curiosity, or "one more try"?

If no after honest testing, the loop needs rework or the concept needs a pivot. Do not add systems on top of a core loop that doesn't work.

---

## Genre Expectations

Players arrive with assumptions from genre. These assumptions are a design resource — use them intentionally.

### Framework

| Action | Definition | Example |
|--------|-----------|---------|
| **Identify** | What does your target audience expect from this genre? | Roguelike players expect permadeath, procedural generation, and build diversity |
| **Conform** | Which expectations to honor (reduces learning cost) | Keep permadeath — it's load-bearing for the tension loop |
| **Subvert** | Which expectations to break (creates identity) | Replace procedural levels with hand-crafted ones that remix |
| **Signal** | How to tell the player which expectations are subverted | Early game tutorial explicitly shows that levels are hand-crafted and replayable |

**The ratio:** Most games conform to 70-80% of genre expectations and subvert 20-30%. Subverting too much makes the game unrecognizable. Conforming to everything makes it forgettable. Failing to signal subversions creates frustration — players feel the game is broken rather than different.

---

## Concept Validation Checklist

Before committing significant time to a concept, run this checklist. Failing items don't necessarily kill the concept, but they identify where more work is needed.

- [ ] Can I describe the core fantasy in one sentence that implies an emotion?
- [ ] Do the experience pillars (3-5) create a coherent, non-contradictory vision?
- [ ] Is the core loop independently satisfying without progression or economy?
- [ ] Does the concept suggest natural system interactions (not forced)?
- [ ] Can I build an MVG in a realistic timeframe for my resources?
- [ ] Is there a target audience? Can I describe who they are and what they play?
- [ ] Does the concept differ meaningfully from existing games in the genre?
- [ ] Can I articulate the genre expectations I'm conforming to and subverting?
- [ ] Does the target experience statement make someone curious or excited?
- [ ] Are there open questions I can answer with a prototype (not just more thinking)?

---

## Vision Document Template

Keep it to 1-2 pages. The vision document is a communication tool, not a design bible. If it's longer than 2 pages, you're designing systems (go to specialized skills for that) instead of defining vision.

```markdown
## [Game Title]

### Core Fantasy
[One sentence. What does the player FEEL like they're doing?]

### Experience Pillars
1. [Pillar] — [One-line description of what this means in practice]
2. [Pillar] — [One-line description]
3. [Pillar] — [One-line description]
(4-5 optional)

### Target Experience Statement
In [title], players experience [emotion sequence] by [core verbs]
in a world where [fiction/setting premise].

### Core Loop
[Verb] → [Verb] → [Verb] → [Verb] → (repeat)
[2-3 sentences explaining why this loop is satisfying]

### Key Systems (derived from pillars)
| System | Serves Pillar | Interacts With |
|--------|--------------|----------------|
| [System A] | [Pillar 1] | [System B, System C] |
| [System B] | [Pillar 2] | [System A, System D] |

### MVG Scope
[What the first playable prototype includes and excludes]
[The hypothesis it tests]

### Genre Context
**Conforming to:** [List genre expectations you're honoring]
**Subverting:** [List genre expectations you're breaking, and why]

### Open Questions
- [Questions that can only be answered by prototyping]
- [Questions that need research or reference]
- [Questions that need playtesting]
```

---

## Anti-Patterns

| Anti-Pattern | What Goes Wrong |
|--------------|-----------------|
| **The 50-Page GDD** | Writing a massive design document as a substitute for building and testing. A 2-page vision plus a playable prototype beats a 50-page spec. Documents are communication tools, not validation tools. |
| **Feature-First Design** | Listing features before defining the target experience. Without a vision target, features have no evaluation criteria. |
| **Pillar Inflation** | More than 5 pillars. If everything is a priority, nothing is. Six pillars means you haven't made the hard choices yet. |
| **The Infinite Prototype** | Prototyping without a hypothesis. If weeks pass without a specific question being tested, the prototype is procrastination. |
| **Genre Clone** | Conforming to every genre expectation. If players describe your game as "exactly like X," they'll just play X. |
| **Vision Drift** | Changing Layer 1 without propagating through the stack. When you change a layer, walk down and verify everything below still aligns. |

---

## Cross-References

| Skill | When to Go There |
|-------|-------------------|
| **game-design** | After vision is set, use the 5-Component Filter to evaluate individual mechanics |
| **experience-design** | Flesh out the engagement loop, pacing, and emotion layering implied by your pillars |
| **systems-design** | Detailed system interaction architecture once you've derived systems from pillars |
| **game-balance** | When systems need numeric values — cost curves, stat spreads, economy tuning |
| **game-feel** | When building the MVG — minimum viable juice to make the prototype testable |
| **player-ux** | Cognitive load and onboarding design once the core loop is crystallized |
| **progression-systems** | Power curves, difficulty ramps, and unlock pacing after the core loop validates |
| **playtest-design** | Designing observation protocols for MVG testing |
| **motivation-design** | Reward psychology and intrinsic/extrinsic motivation once systems are derived |
| **encounter-design** | Spatial and enemy behavior design for content that fills your systems |
| **economy-design** | Sink/source architecture when your vision includes currency or trade |
| **narrative-design** | Quest structure and branching when your pillars include narrative elements |
| **pixi-vector-arcade** | When ready to build — PixiJS 8 project bootstrapping for browser-based games |

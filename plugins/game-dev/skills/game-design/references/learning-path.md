# Game Design Skills: Learning Path

Start here. Don't try to absorb all 19 skills at once. Follow this path from foundation to specialization.

---

## Tier 1: Foundation (Start Here)

Learn these first. They provide the structural vocabulary everything else builds on.

| Order | Skill | What You'll Learn | Time Investment |
|-------|-------|-------------------|-----------------|
| 1 | **game-vision** | How to go from "I have an idea" to a structured design with pillars, core loop, and MVG | One read-through + apply to your current project |
| 2 | **game-design** | The 5-Component Filter — the universal evaluation tool for any mechanic | Learn the filter, apply it to 3 features |
| 3 | **systems-design** | How systems connect, the Interaction Matrix, emergence analysis | Build one matrix for your current project |

**After Tier 1 you can:** Articulate what your game IS, evaluate any mechanic structurally, and design system architectures that create depth.

---

## Tier 2: Core Design (Learn as Needed)

These skills provide deep frameworks for specific design domains. Learn them when you encounter the problem they solve.

| Skill | Learn When... |
|-------|--------------|
| **experience-design** | Your game "works" but doesn't engage. The loop feels flat. |
| **game-feel** | Things feel "off" — laggy, weak, floaty, clunky. You need the juice toolkit. |
| **progression-systems** | You're designing levels, XP, difficulty curves, or unlock pacing. |
| **game-balance** | Items, weapons, or strategies need numeric tuning. Something is "OP." |
| **encounter-design** | You're placing enemies, designing combat spaces, or building levels. |
| **economy-design** | Your game has currencies, crafting, or any resource flow. |

**After Tier 2 you can:** Diagnose and fix specific design problems with structured frameworks instead of intuition alone.

---

## Tier 3: Specialization (Deepen When Ready)

These skills address specific aspects of game design. Learn them when your project demands them.

| Skill | Learn When... |
|-------|--------------|
| **motivation-design** | Players aren't coming back. Retention is low. Rewards feel hollow. |
| **narrative-design** | You're adding quests, story, or dialogue. Narrative feels disconnected. |
| **player-ux** | Players are confused by your UI/HUD. Onboarding isn't working. |
| **playtest-design** | You're ready to test with real players and want useful data, not noise. |
| **multiplayer-design** | Your game involves other players in any capacity. |
| **accessibility-design** | You want your game to be playable by everyone. (Ideally: learn early.) |
| **audio-design** | You're adding sound/music and want it to function as a design system. |
| **data-driven-design** | You're shipping updates and need analytics to inform decisions. |

---

## Tier 4: Implementation

| Skill | Learn When... |
|-------|--------------|
| **game-perf** | Writing per-frame code. Performance budgets constrain design. |
| **pixi-vector-arcade** | Starting a browser-based game with PixiJS 8. |

---

## The Arcade Game Quick Start

If you're building a browser-based arcade game (the most common use case for this stack), follow this pipeline:

```
1. game-vision        → Define core fantasy, pillars, core loop
2. systems-design     → Pick 3-5 systems, build interaction matrix
3. pixi-vector-arcade → Scaffold the project
4. game-design        → Evaluate your first mechanic with 5-Component Filter
5. game-feel          → Add juice to make the prototype feel good
6. encounter-design   → Design your first encounters
7. playtest-design    → Test with 3 people (or use solo validation techniques)
8. game-balance       → Tune numbers based on feedback
9. progression-systems → Add progression once core loop validates
```

---

## Using Skills with Councils

Each skill provides evaluation rubrics that map naturally to council roles:

| Council Role | Primary Skill | Evaluates |
|-------------|--------------|-----------|
| Systems Architect | **systems-design** | Do the systems interact? Is there emergence? |
| Experience Advocate | **experience-design** | Is it fun? Does the loop engage? |
| Economy Skeptic | **economy-design** + **game-balance** | Will the numbers hold up? Any degenerate states? |
| Player Advocate | **player-ux** + **accessibility-design** | Can players actually use this? |
| Feel Advocate | **game-feel** | Does it feel responsive and satisfying? |
| Motivation Analyst | **motivation-design** | Will players come back? |

A design council session typically spawns 3-4 of these roles debating a specific design decision. Each role uses their skill's frameworks as analytical tools.

---

## The Intuition Bridge

You already know when something feels wrong. These skills help you articulate WHY:

| Your Intuition Says | The Skill Says |
|---------------------|---------------|
| "This feels shallow" | systems-design: Check the Interaction Matrix — are systems connected? |
| "This feels flat" | experience-design: Check the Experience Triangle — which vertex is weak? |
| "This feels wrong" | game-design: Run the 5-Component Filter — which component fails? |
| "This feels laggy" | game-feel: Check the Perception-Action Cycle — which gate is failing? |
| "Players don't care" | motivation-design: Check SDT — which need is unmet? |
| "The economy is broken" | economy-design: Draw the Flow Model — where's the leak? |
| "I don't know what to build next" | game-vision: Check your pillars — what serves them? |

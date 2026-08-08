---
name: player-ux
description: "Cognitive load for players: perception, attention and memory limits, Gestalt principles for HUD and UI, signal-noise discipline, onboarding ramps, tooltips and affordances, and developer blindness. Use when designing or reviewing a HUD or UI layout, writing a tutorial or first-time-user flow, or when players say 'I didn't see that', 'I didn't know I could do that', 'I missed that it happened', or blame themselves for what is actually a readability failure. Usability problems reliably masquerade as difficulty problems — test readability before tuning difficulty. For access needs specifically (colourblindness, motor, hearing, cognitive) use accessibility-design."
---

# Player UX

**Purpose:** Apply cognitive science to game interface and interaction design. The player's brain has hard constraints — limited attention, lossy perception, fragile memory. Design with those constraints, not against them.

**Sources:** This skill is substantially Celia Hodent, *The Gamer's Brain: How Neuroscience and UX Can Impact Video Game Design* (CRC Press, 2017) — the three cognitive pillars, the green-ball anti-pattern, usability-versus-engageability, and developer blindness are all hers. Working memory at ~4 chunks is Cowan (2001), which revised Miller's 1956 "7±2." Gestalt grouping principles are Wertheimer (1923). The 4.5:1 contrast minimum is WCAG 2.1 AA.

---

## Core Framework: Three Cognitive Pillars

Every interaction between player and game passes through three systems, in order:

```
Perception → Attention → Memory
(Did they see it?) → (Did they focus on it?) → (Will they remember it?)
```

If any pillar fails, everything downstream fails too.

### Pillar 1: Perception

The brain doesn't passively receive information — it actively constructs a model based on expectations, context, and sensory input. Perception is top-down: what you *know* influences what you *see*.

**Gestalt Principles for Game UI:**

| Principle | Rule | Game Application |
|-----------|------|------------------|
| **Proximity** | Near objects are perceived as grouped | Group related HUD elements spatially (health + shield together) |
| **Similarity** | Similar appearance = perceived as related | Use consistent color/shape for same-category items |
| **Figure-Ground** | Salient elements pop out from background | Critical info needs contrast against the game world |
| **Continuity** | The eye follows smooth paths | Guide attention with visual flow (menu layouts, tutorials) |
| **Closure** | The brain completes incomplete shapes | Progress bars, partially-revealed maps work because of this |

**Perception Checklist:**
- [ ] Can the player distinguish foreground from background at a glance?
- [ ] Do related elements look related? (Same color family, proximate, similar style)
- [ ] Do unrelated elements look distinct?
- [ ] Is critical info visible in peripheral vision? (Health bars, ammo counts)
- [ ] Does the design work at target viewing distance? (TV from couch vs. phone vs. monitor)

### Pillar 2: Attention

Attention is a finite resource. The brain consumes ~20% of body energy at ~2% of body weight. Every UI element, tutorial popup, and status indicator competes for this budget.

**The Core Pillars Method:**
1. Define 3-5 **experience pillars** for your game (e.g., "exploration," "combat mastery," "base building")
2. For every design decision: does the cognitive demand serve a pillar?
3. If attention cost doesn't serve a pillar, it's waste — simplify or cut

**The Green Ball Anti-Pattern:**
"Playing golf with a green ball on a green course" — when the challenge is *finding* the thing rather than *doing* the thing, you've put the difficulty in the wrong place. The challenge should *be* the experience, not a barrier to reaching it.

**Attention Audit:**
- [ ] Does every on-screen element serve a declared experience pillar?
- [ ] Is the player spending attention on the *intended* challenge? (Not menus, not navigation, not parsing icons)
- [ ] Can the player ignore non-critical info without penalty?
- [ ] Are alerts/notifications graduated by importance? (Critical ≠ informational)
- [ ] During high-intensity moments, is non-essential UI minimized?

### Pillar 3: Memory

Working memory holds ~4 chunks simultaneously. Long-term encoding requires emotional significance, repetition, or active processing. Tutorials that dump information before the player has context to encode it are wasted.

**Memory-Friendly Design:**
- **Teach through doing**, not reading — active processing encodes better than passive
- **One concept at a time** — introduce, let the player practice, then introduce the next
- **Emotional context first** — explain *why* before *how* (motivation aids encoding)
- **Recognition over recall** — show options rather than making players remember them
- **Spaced repetition** — reintroduce concepts at increasing intervals

**Memory Audit:**
- [ ] Does any single decision point require tracking > 4 pieces of info?
- [ ] Can the player access reference info without leaving the action? (Tooltips, overlays)
- [ ] Are tutorials contextualized (taught when relevant, not all at start)?
- [ ] Is critical information available for recognition, not just recall?
- [ ] After a session break, can the player resume without re-learning?

---

## Usability vs. Engage-ability

Two distinct UX goals that are often confused:

| Dimension | Question | When It Fails |
|-----------|----------|---------------|
| **Usability** | Can the player do what they intend? | Player blames themselves: "I'm bad at this" |
| **Engage-ability** | Does the player want to keep playing? | Player blames the game: "This is boring" |

**Critical insight:** Usability problems masquerade as difficulty problems. Players blame their own skill when the real issue is bad UI. Test usability *before* tuning difficulty.

---

## Onboarding Design

### Flow Structure

```
Phase 1: Safe exploration (no failure possible)
  → Introduce movement and core interaction
  → Let the player touch things without consequence

Phase 2: Guided challenge (gentle failure)
  → Introduce the core mechanic with clear success/failure
  → Immediate feedback on what went wrong

Phase 3: Supported mastery (real challenge, safety nets)
  → Full mechanics, but with hints available
  → Coyote time, generous hit windows, undo options

Phase 4: Release (full game)
  → Remove scaffolding gradually
  → Player should feel competent, not coddled
```

### Onboarding Checklist

- [ ] Can the player do something meaningful in the first 30 seconds?
- [ ] Are tutorials delivered through play, not text screens?
- [ ] Is each concept practiced before the next one is introduced?
- [ ] Does failure teach? (Clear feedback, not just "try again")
- [ ] Is there no front-loaded info dump?
- [ ] Can experienced players skip/accelerate the tutorial?
- [ ] Are controls taught through muscle memory, not reading?

---

## Developer Blindness

You have played your game for hundreds of hours. Your players have played for zero. This asymmetry is the single biggest UX risk in game development.

**Counter-measures:**
- Watch first-time players without helping — your instinct to explain is the signal that UX is failing
- Use the "5-second test" — show a screen for 5 seconds, ask what they noticed. If they missed critical info, it's a perception failure
- Playtest with people outside your team and friend group
- Record playtests — your memory of what happened will be biased
- Revisit your own game after a 2-week break for the closest approximation of fresh eyes

---

## Accessibility Quick Reference

| Category | Minimum Standard |
|----------|-----------------|
| **Vision** | No info conveyed by color alone; support colorblind modes (~10% of players) |
| **Contrast** | Critical UI elements meet 4.5:1 contrast ratio against background |
| **Motor** | Rebindable controls; no rapid-press requirements without alternatives |
| **Cognitive** | Difficulty options; pausable gameplay; adjustable text speed |
| **Redundancy** | Critical feedback uses 2+ channels (visual + audio minimum) |

---

## Complexity Budget

Complexity is finite. Spend it on your core experience.

```
Total complexity budget
├── Core loop complexity      (SPEND HERE — this IS the game)
├── Secondary systems          (keep lean — inventory, menus, settings)
├── Onboarding complexity      (minimize — teach through play)
└── Meta-game complexity       (justify every layer)
```

**Rule of thumb:** If a system isn't part of the core loop, it should require less than 1 minute of learning. If it requires more, either it should be a core pillar or it needs simplification.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **accessibility-design** — Where cognitive load becomes an access question
- **game-feel** — Feedback design that respects perception limits
- **playtest-design** — Observation protocols — self-report will not find these

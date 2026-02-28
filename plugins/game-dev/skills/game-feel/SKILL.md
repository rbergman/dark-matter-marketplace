---
name: game-feel
description: "Juice checklists, feedback loop tightening, screen shake/particles/sound timing, the perception-action cycle, and 'why does this feel bad?' diagnostics. Use PROACTIVELY when implementing player actions, combat hits, collectibles, UI transitions, or any moment where the player should *feel* something."
---

# Game Feel

**Purpose:** Make every player action feel responsive, satisfying, and communicative. Game feel is the difference between "it works" and "it feels great." These are the tools to close that gap.

**Influences:** Frameworks here draw on work by Tynan Sylvester (feedback layering, emotional feedback), Celia Hodent (perception-action cycle, timing constraints), and cross-referenced game design literature on "juice" and responsive design.

---

## When to Activate

Use this skill **proactively** when:
- Implementing any player action (attack, jump, dash, interact)
- Adding combat hits, impacts, or collisions
- Designing collectible/pickup feedback
- Building UI transitions and state changes
- Something is mechanically correct but feels "flat" or "floaty"
- A player or tester says "it feels wrong" but can't articulate why

---

## Core Framework: Three Feedback Layers

Every player action should produce feedback on three layers, and all three must align:

| Layer | What Changes | Example |
|-------|-------------|---------|
| **Mechanical** | Game state updates | HP decreases, score increases, position changes |
| **Audiovisual** | Sensory response | Screen shake, particles, sound effect, animation |
| **Emotional** | Player feeling | Satisfaction, tension, surprise, power |

**When layers misalign,** something feels "off" even if the player can't explain it:
- Mechanical hit + weak audiovisual = "it didn't feel like I hit them"
- Big audiovisual + no mechanical change = "all flash, no substance"
- Mechanical + audiovisual aligned but wrong emotion = "it feels weird"

---

## The Perception-Action Cycle

For feedback to register, it must pass three gates:

```
Action → [Perceivable?] → [Interpretable?] → [Timely?] → Registered
             ↓                  ↓                  ↓
          "I didn't see it"  "What happened?"  "It feels laggy"
```

### Gate 1: Perceivable

Can the player actually detect the feedback?

- [ ] Does it have sufficient visual contrast against the current scene?
- [ ] Is it large enough / loud enough for the context?
- [ ] Does it use a channel the player is monitoring? (Don't put critical info in a corner during action)
- [ ] Does it work for players with visual/auditory limitations?

### Gate 2: Interpretable

Does the player understand what the feedback means?

- [ ] Does the feedback match the player's mental model? (Hit = damage, collect = got it)
- [ ] Is there a consistent language? (Red = damage, green = heal, across the whole game)
- [ ] Can a new player understand it without explanation?
- [ ] Does it distinguish between similar events? (Light hit vs. heavy hit, near miss vs. clean dodge)

### Gate 3: Timely

Is the feedback close enough in time to the action?

| Threshold | Feel |
|-----------|------|
| < 50ms | Instant — player perceives cause and effect as simultaneous |
| 50-100ms | Responsive — feels connected but has presence |
| 100-200ms | Noticeable — acceptable for weighty/heavy actions |
| > 200ms | Laggy — feels disconnected; only acceptable for explicitly slow/telegraphed actions |

**Rule:** Immediate visual feedback within 1-2 frames (16-33ms), even if the full animation plays out over longer. The *onset* must be instant.

---

## The Juice Checklist

"Juice" is small feedback amplification with outsized impact on feel. These techniques don't change game state — they change *experience*.

### Impact / Hit Juice

- [ ] **Screen shake** — intensity proportional to hit magnitude (2-5px for light hits, 8-15px for heavy)
- [ ] **Hit stop / freeze frame** — 2-5 frame pause on impact (30-80ms) sells the weight
- [ ] **Particle burst** — directional, from impact point
- [ ] **Sound effect** — layered (impact + reaction + environmental response)
- [ ] **Knockback / recoil** — both target and attacker react physically
- [ ] **Camera punch** — brief zoom or push toward impact point
- [ ] **Flash / color shift** — 1-2 frame white flash on the hit target

### Collection / Pickup Juice

- [ ] **Magnetism** — items drift toward player in the last few pixels
- [ ] **Pop animation** — item scales up briefly before disappearing
- [ ] **Sound** — pitch variation on rapid sequential pickups (ascending pitch = satisfying)
- [ ] **Number popup** — value floats up and fades
- [ ] **UI pulse** — the relevant counter/bar flashes or bounces

### Movement Juice

- [ ] **Squash and stretch** — character compresses on land, stretches on jump
- [ ] **Dust/particles** — on landing, on dash, on direction change
- [ ] **Trail effects** — afterimages, motion blur, speed lines
- [ ] **Camera lead** — camera slightly ahead of movement direction
- [ ] **Sound** — footsteps with surface-appropriate variation

### UI Transition Juice

- [ ] **Easing curves** — never linear; ease-out for appearing, ease-in for disappearing
- [ ] **Overshoot** — slight bounce past target position
- [ ] **Stagger** — sequential items animate with slight delay between each
- [ ] **Sound** — subtle confirmation sounds on state changes

---

## "Why Does This Feel Bad?" Diagnostic

When something feels wrong, diagnose systematically:

### Step 1: Identify the Symptom

| Player Says | Likely Layer | Start Here |
|-------------|-------------|------------|
| "It's laggy" | Timing | Check input-to-visual-response latency |
| "It feels weak" | Audiovisual | Add juice (hit stop, shake, sound) |
| "It didn't register" | Perception | Increase feedback visibility/contrast |
| "It's confusing" | Interpretation | Clarify feedback language, reduce noise |
| "It's floaty" | Timing + AV | Add gravity, weight, impact frames |
| "It's clunky" | Timing | Check cancel windows, input buffering |
| "It's boring" | Emotional | Layer isn't producing the intended feeling |

### Step 2: Check Timing

- Measure actual input-to-response latency (not estimated — use frame-by-frame analysis)
- Compare against the threshold table above
- Check if input buffering is working (player presses attack during recovery — does it queue?)
- Check cancel windows (can the player interrupt one action with another when expected?)

### Step 3: Check Proportionality

- Is feedback intensity proportional to action significance?
- Are trivial actions quiet and major actions loud?
- Is there dynamic range? (If everything shakes, nothing shakes)

### Step 4: Check Redundancy

Critical feedback should use 2+ channels:
```
Visual + Audio     (minimum for any significant action)
Visual + Audio + Haptic    (ideal for core loop actions)
Visual + Audio + Camera    (for high-impact moments)
```

Relying on a single channel means some players will miss it.

### Step 5: Check for Feedback Lies

Does the feedback match what actually happened?

- Animation says "hit" but damage didn't register → trust gap
- Sound plays but no visual confirmation → feels ghostly
- Big particle effect on a weak attack → expectation violation
- Hit stop on a miss → false positive

**Feedback lies erode trust faster than missing feedback.**

---

## Timing Reference Card

All values below are **starting points** — tune through playtesting per the Numbers Policy in **game-design**.

| Action Type | Visual Onset | Full Duration | Sound Onset | Notes |
|-------------|-------------|---------------|-------------|-------|
| Light attack | 1-2 frames | 200-400ms | On contact frame | Quick, snappy |
| Heavy attack | 3-5 frame windup | 400-800ms | On contact + windup sound | Telegraphed weight |
| Jump | 1 frame | Duration of jump | On launch | Squash on takeoff, stretch at apex |
| Land | 1-2 frames | 100-200ms | On contact | Squash, particles, camera dip |
| Collect | Instant | 200-400ms fade | On contact | Magnet + pop + counter pulse |
| Damage taken | 1 frame flash | 200-500ms | On contact | Screen edge vignette, sound, shake |
| Death | 3-5 frame slow | 500ms-2s | Dramatic sting | Time slow, camera pull, fade |

---

## Anti-Patterns

- **Silent actions** — any player action with no perceivable response
- **Uniform intensity** — same screen shake for a poke and a meteor strike
- **Over-juicing** — so many particles and shakes that the game is unreadable
- **Feedback without meaning** — visual noise that doesn't communicate game state
- **Animation priority over responsiveness** — finishing a pretty animation at the cost of input responsiveness
- **Same sound on repeat** — rapid repeated actions need pitch/timing variation or they become grating

---

## Cross-References

- **game-design** — 5-Component Framework (Satisfaction and Clarity components are pure game feel)
- **experience-design** — Feedback is one vertex of the Experience Triangle
- **player-ux** — Perception constraints determine what feedback players can actually detect
- **game-perf** — Juice effects (particles, shakes) must respect per-frame performance budgets
- **playtest-design** — "Does this feel good?" requires observation, not self-report

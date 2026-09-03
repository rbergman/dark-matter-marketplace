---
name: game-feel
description: "Juice, feedback layering, screen shake/particles/sound timing, the perception-action cycle, and 'why does this feel bad?' diagnostics. Use when implementing player actions, combat hits, collectibles, UI transitions, weapon impacts, jumps, dashes, or any moment where the player should *feel* something; when a mechanic functionally works but feels mushy, slow, or unsatisfying; or when playtesters say 'it's missing something.' Covers timing reference numbers (frames per response phase), feedback channels (visual/audio/haptic/screen), and the diagnostic ladder for feel problems."
---

# Game Feel

**Purpose:** Make every player action feel responsive, satisfying, and communicative. Game feel is the difference between "it works" and "it feels great." These are the tools to close that gap.

**Sources:** Steve Swink, *Game Feel: A Game Designer's Guide to Virtual Sensation* (Morgan Kaufmann, 2008) — the foundational text, and the origin of the term. Juice technique follows Martin Jonasson & Petri Purho, "Juice it or lose it" (Nordic Game Jam 2012) and Jan Willem Nijman, "The Art of Screenshake" (INDIGO 2013). Perception and feedback-legibility claims draw on Celia Hodent, *The Gamer's Brain* (2017). Specific timing values are starting points, not measurements — see the Numbers Policy in **game-design**.

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

**Act on press.** Fixed controls, verb keys and world clicks do the thing on the press event; release only modifies or ends what the press started, and the modification must be compatible with the original action (reload / hurried reload / careful reload — never a different verb). Even a ballistic tap has tens of ms between press and release; act-on-release adds that to every interaction and lets focus leave the hit box between the two events. Source: John Carmack, 7 May 2024, reporting a Meta user study on the VR keyboard — fewer typos, expressed preference, "crisper". Exceptions are FORM, not friction: drag surfaces (scrolling views, drag-and-drop, long-press menus) where a press must be provisional. A control that acts on release needs its reason written next to it.

Timeliness has two layers, and a game can pass one and fail the other. The **input layer** is the press initiating the action the same frame. The **feedback layer** is something on screen acknowledging the press within 1-2 frames even when the payload is deliberately late. A wind-up is fine when the wind-up *is* the acknowledgement; a ranged cast whose only feedback is the projectile has none until the projectile.

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
- Which layer is the lag in? Trace the press event: does it initiate the action the same frame (input layer), and does anything on screen acknowledge it within 1-2 frames (feedback layer)? A ranged attack loosed at a melee swing's impact frame has correct input and no acknowledgement for 300+ ms.
- Is anything acting on release? `grep` for pointerup / keyup / mouseup handlers that *start* an action rather than modify or end one.

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
| Ranged attack / cast | 1-2 frames (acknowledge the press) | 150-400ms to release | On release | The projectile is the payload, not the acknowledgement; something must move on the press |

---

## Anti-Patterns

- **Silent actions** — any player action with no perceivable response
- **Uniform intensity** — same screen shake for a poke and a meteor strike
- **Over-juicing** — so many particles and shakes that the game is unreadable
- **Feedback without meaning** — visual noise that doesn't communicate game state
- **Animation priority over responsiveness** — finishing a pretty animation at the cost of input responsiveness
- **Same sound on repeat** — rapid repeated actions need pitch/timing variation or they become grating
- **Act on release** — doing the thing when the button comes up instead of when it goes down. See Gate 3.
- **Confirm instead of undo** — a modal "are you sure" or an act-on-release safety net where a reversible action would do. Carmack: "Just do it, but allow it to be un-done."

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **player-ux** — Perception limits decide what feedback can register at all
- **game-design** — Satisfaction and Clarity in the 5-Component Filter
- **game-perf** — Juice costs frames; the budget is real

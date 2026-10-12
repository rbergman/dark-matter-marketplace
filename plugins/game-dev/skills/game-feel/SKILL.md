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

**Scope: game-world verbs** (decided 2026-10-11, D3 in the game-ui-patterns spec).
- **DOM menu controls keep native activation:** `click`, the browser's Enter on
  keydown and Space on keyup.
  - XAG 107 asks pointer activation to complete on the up event, with a way to
    cancel.
  - WCAG 2.5.2 allows down-event completion only where it is *essential*. Undo
    qualifies only an up-event completion.
  - Highlight on pointer-enter still gives the two-stage feel.
- **Pad buttons act on their press edge.** Pointer-cancellation rules are about
  pointers.
- **Destructive menu items with no undo** (Restart, Quit, New Run over a save) take
  a second activation. That is the stated exception to "confirm instead of undo"
  below, which applies only where undo exists.

See **game-shell** and **menu-navigation**.

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

## Shake and Flash Budgets

The juice checklist sizes individual effects. This section keeps them from
compounding into a screen that is unreadable, irreproducible or unsafe. The FX
gate that scales them is **settings-and-persistence**'s.

### One trauma accumulator per camera

- **Every source calls one `addTrauma(amount)`.** It clamps the *total* to 1.
  - Capping at each write site isn't a budget: timberwolf writes `Math.min(8, …)`
    in several places.
  - Summing per-hit impulses beats the per-hit cap under burst damage
    (abduction-run, read from code).
- **Choose the combine rule on purpose:**
  - **Capped sum:** busy fights feel busy. Downwash uses `MAX_TRAUMA = 1`.
  - **Max:** gravelight's `max(shake, hit | kill)`. One heavy hit isn't diluted.
  - **Latest qualifying event wins:** volatile-state-redux. Never stacks.
- **Offset = `maxOffset × trauma² × noise(t)`.**
  - The squared trauma makes small hits subtle and big ones violent.
  - The trauma-with-decay model is credited to Squirrel Eiserloh's GDC 2016 talk
    "Juicing Your Cameras With Math" via Bevy's example. The slides weren't read,
    so treat the exponent as a choice.
  - `maxOffset` uses the checklist's 2–15 px range.
- **Decay per second, not per frame.** Logarithmic multiplies by `0.001 ** dt`.
  *Starting value:* full trauma gone in about 1 s (posture B). Test: does a heavy
  hit still read as heavy, without shake still running when the next hit lands?
  - Gravelight decays ×0.86 *per tick*. That is fine in a fixed-step sim, wrong
    in a variable-rate render loop.
- **Seeded noise, never `Math.random`.** Gravelight's shake is deterministic from
  the tick, so capture frames are byte-stable. Timberwolf and abduction-run jitter
  with `Math.random`, and a seed can't replay them.
- **The settings gate scales the offset at render,** and trauma keeps decaying while
  scaled to 0. Toggling mid-shake then leaves no stuck offset (logarithmic).
- **Rate-limit hit-stop.** Downwash allows one every 0.35 s (posture C). Stacked
  hit-stops read as the game freezing.

### Flash

- **Hard limits, setting or not:** no more than 3 flashes in any 1 s.
  - WCAG 2.2 SC 2.3.1 (Level A) defines a general flash as a 10% luminance change
    with the darker state below 0.8.
  - Red flashes (saturated red) are stricter.
  - Area: XAG 118 says about 20% of the screen; WCAG and GAG say about 25%. **Use
    20%.**
  - Eliminate triggers rather than rely on a warning screen (XAG 118).
  - Don't label a setting "epilepsy safe" (GAG); name it by what it does.
- **With reduce-flash on:**
  - full-screen flashes become an edge vignette or a border pulse
  - effect alpha is capped (volatile-state-redux uses 0.45, posture C)
  - white-outs become a dim
- **Low-health vignettes are steady, or pulse well under 3 Hz.** With reduced
  motion, they hold steady.
- **The hit flash on a target** (the checklist's 1–2 frame white flash) is small
  enough to stay. It is information, not decoration.

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

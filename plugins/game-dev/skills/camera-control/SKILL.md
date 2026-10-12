---
name: camera-control
description: "Controlling a 2D or top-down game camera, not juicing it: a pure 'where it wants to be' target kept separate from 'how it gets there'; exponential damping versus a critically damped spring, with halflife as the tuning unit; velocity look-ahead and an aim lead on its own slow clock; zoom as a product of named factors (player base zoom, wheel, screen size, speed); combat framing that zooms out to keep every threat on screen, with a floor; an optional rotate-with-ship (heading-follow) mode and what it does to the HUD; shake applied only at render and never to the aim; one pair of world/screen conversions; and the camera options players expect. Use when building or reviewing a follow camera, adding zoom or a camera options tab, or when players say 'the view jumped when my mouse came back', 'I got shot from off screen', 'I can't see far enough ahead', 'the zoom makes me sick', 'it's too floaty' or 'too stiff', or 'the arrow points the wrong way'. Shake, punch and the trauma budget are game-feel's."
---

# Camera Control

**Purpose:** The camera shows the player what they need to act on, moves without
yanking, and lets the player set how it behaves. Feel is a consequence of control
done right; **game-feel** owns punch, shake and the trauma budget.

**Sources:**
- **Corpus** (read 2026-10-12):
  - ice-pirates `src/view/camera.ts`, `src/app/focus.ts`, `camera.test.ts`: the pure
    target, combat framing, the screen factor, the aim lead. Bob called the auto
    zoom-out "a great touch" (felt, via the ice-pirates session).
  - redshifted (shipped as BLUESHIFTED; Bob's reference for camera control)
    `src/rendering/camera-math.ts`, `camera.ts`, `hud/settings/settings-types.ts`,
    `camera.test.ts`: the exact spring, the settings tab, shake only at render.
  - Numbers marked *corpus value* are posture A for the game that ships them and
    posture B for yours (Numbers Policy).
- **Itay Keren, "Scroll Back: The Theory and Practice of Cameras in Side-Scrollers"**
  (GDC 2015; Game Developer, 2015). Read for this skill. Its terms used here:
  lerp-smoothing and physics-smoothing, projected-focus and target-focus,
  multi-focal cameras with zoom-to-fit, and its point that a clash between what the
  eyes see and what the inner ear feels causes discomfort, so camera speed and
  direction shouldn't change suddenly. It gives no advice on rotation.
- **Daniel Holden, "Spring-It-On"**, cited by redshifted's code for the exact
  critically damped spring. Not read for this skill. The sketch reproduces
  redshifted's formula with `Math.exp` in place of its `fastNegExp` approximation.
- **XAG 117** (visual distractions and motion settings): camera motion is a setting.
- **Heading-follow is UNSOURCED.** Neither corpus game has it; the rules are posture B.

Typed sketch: `references/camera.ts`. It covers the spring, the camera with
framing, heading mode, `view()` and the conversions, and the aim lead.

---

## The problem

| Failure | Root cause | Rule |
|---|---|---|
| The view jumps when the mouse re-enters the window | The aim lead uses the raw pointer, on the follow's clock | 3 |
| Shot by something never on screen | No framing, or framing only the nearest threat | 5 |
| "Too floaty" from one player, "too stiff" from the next | One hard-coded follow rate | 2, 8 |
| A phone sees a third of what a monitor sees | Zoom in pixels, not in world area | 4 |
| The aim drifts during shake | Shake inside the screen→world conversion | 7 |
| An arrow points the wrong way after a zoom | A HUD element doing its own world→screen maths | 7 |
| The camera keeps moving behind the pause menu | The camera runs on raw time | 9 |

---

## The player-facing idiom

- **The view leads where the player is going** and shows a little more toward where
  they're aiming. It never snaps, except on a new run, a respawn or a teleport.
- **Everything that can shoot the player is on screen.** The camera backs out to
  frame it during a fight and returns when it ends.
- **The mouse wheel zooms** inside a clamp. Options hold base zoom, follow lag and
  the motion toggles, and they apply live, behind the pause screen.
- **North stays up by default.** Rotate-with-ship, where offered, is an option.
- **Pause freezes the camera.**

---

## The rules

### 1. Split where it wants to be from how it gets there

- **The target is a pure function of sim state:** `cameraTarget(sim, player, lead)`
  returns `{ x, y, zoom, frame[], heading }`. It never reads the camera.
  - ice-pirates: position plus 1.6 s of velocity plus the aim lead. Base zoom 4.6 for
    a small hull, 3.3 for a big one, shrinking up to 15% with speed. A towed berg
    pulls the focus 30% toward it. All corpus values.
- **The mover eases toward it:** `camera.follow(target, dt)`.
- **Why the split:** the target can be unit-tested from a sim state, and swapping the
  mover (damp or spring, a settings change) doesn't touch what the camera shows.

### 2. The mover: damp or spring, tuned in halflife

| Mover | Formula | Carries velocity | Use when |
|---|---|---|---|
| **Damp** (Keren: lerp-smoothing) | `x += (goal − x) · (1 − e^(−rate·dt))` | No | Simple follow; zoom |
| **Critically damped spring** (Keren: physics-smoothing) | redshifted's `springDamperExact` | Yes | Kicks and zoom pulses as impulses; a smoother start |

- **Both are frame-rate independent** written this way. `x += (goal − x) · 0.1` per
  frame is not: it follows twice as tightly at 120 Hz as at 60.
- **Tune in halflife,** but know which one. For damp, it's the time to close half
  the gap: rate `r` has halflife `ln 2 / r`, so ice-pirates' 4/s is ~0.17 s. For
  redshifted's spring, `halflife` is a parameter (`y = 2 ln 2 / h`), not the time to
  close half the gap. From rest the spring closes ~40% of the gap in one `h` and
  half at ~1.2 h, so its 0.25 s default takes ~0.3 s to close half (arithmetic on
  the formula). Swapping damp for a spring "at the same halflife" gives a camera ~20%
  looser.
- **Zoom eases slower than position:** ice-pirates 1.6/s against 4/s; redshifted a
  0.4 s against 0.25 s spring halflife. Zoom changes are the most disorienting
  motion.
- **Keren's warnings:** a lerp can let a fast character reach the screen edge before
  the camera catches up. A spring starts more slowly and can overshoot. Critically
  damped, from rest, it doesn't overshoot a fixed goal; after a kick it can, once.

### 3. Look-ahead: velocity lead and aim lead, on separate clocks

- **Velocity lead** (Keren: projected-focus). Two different jobs:
  - *Show more ahead:* ice-pirates adds `velocity × 1.6 s` to the goal.
  - *Cancel the spring's lag:* redshifted adds `velocity × halflife / ln 2`, so at
    steady speed the player sits at the centre. Its test proves the zero offset.
  - Pick one on purpose and say which in the code.
- **Aim lead** (Keren: target-focus): `clamp((aim − player) × 0.15, ±110)` world
  units, eased by its **own** damp of 1.6/s (corpus values).
  - **Frozen while paused,** and while the pointer is outside the window
    (`pointerleave` on `document.documentElement`), **unless the last-used device is
    a pad**.
  - **The bug this fixed** (Bob, ice-pirates playtest): the mouse left the window,
    re-entered elsewhere, and the background jumped. A review then caught that
    freezing on pointer-leave alone also froze the pad's look-ahead.
  - Under pointer lock (**pointer-lock**), the aim is the virtual cursor and never
    teleports.

### 4. Zoom is a product of named factors

```
zoom = target.zoom × baseZoom (setting) × userZoom (wheel) × screen, then capped by framing (rule 5)
```

- **Screen factor:** `clamp(min(w, h × 1.6) / 1440, 0.6, 1.4)` (ice-pirates, corpus
  value). A phone, a laptop and an ultrawide then show a comparable world area.
  Redshifted doesn't adjust zoom for screen size.
- **Base zoom is a setting.** Redshifted's slider spans 0.5625–1.25 with a default of
  0.75, piecewise-linear about the centre. Its comment says the first, wider
  zoom-out range "felt excessive in playtest", and that is why the range stops at
  0.5625.
- **Wheel zoom** is multiplicative: `userZoom × e^(−deltaY × 0.0012)`, clamped
  0.45–1.8 (ice-pirates, corpus value). Redshifted has none.
- **Speed zoom:** redshifted backs out to `1 + (zoomMin − 1) × speed/maxSpeed`, with
  `zoomMin` 0.6 from a "zoom amount" slider. ice-pirates trims 15%.
  - The combined minimum is low: 0.75 × 0.6 = 0.45 at full warp. Test it on the
    smallest window.
- **Name each factor in code.** A single `zoom *= …` scattered through the frame
  can't be reasoned about, or turned into a setting.

### 5. Combat framing: everything that can hit you is on screen

A fairness rule first, a feel bonus second. Keren calls it zoom-to-fit, a
multi-focal camera.

- **Frame points:** every hostile that has the player within 1.15× its weapon range
  (ice-pirates' `threatsTo`, corpus value).
- **Per point:** `fit = min((w/2 − 120) / (|dx| + 40), (h/2 − 150) / (|dy| + 40))`.
  The margins keep the point clear of the HUD edges; size them to your HUD.
- **`zoom = min(desired, max(floor, fit))` over all points.** The floor bounds the
  fit, not the player: a player zoomed out past it stays there. The focus leans 30%
  toward the nearest threat (corpus value).
- **Pitfalls the ice-pirates reviews caught:**
  - **Framing only the nearest threat** let a second gun sit off screen. Frame all of
    them.
  - **The floor is sized from the LONGEST weapon range on the SMALLEST supported
    window.** 0.8 failed a 480-range gun at 1280×720; 0.4 holds.
  - **Fit only caps zoom from above,** so a player who has zoomed in still gets every
    threat framed. A player who has zoomed out keeps their zoom.
- **Averaging positions** instead (Keren: position-averaging) can trap a player at
  the screen edge. Lean, don't average.
- **Framing has a sim partner.** An AI may open fire only on a ship whose player has
  seen it; see **encounter-design**, "Nothing shoots you that you haven't seen".
  Framing without the rule lets off-screen fire through. The rule without framing
  makes enemies hold fire until point-blank.

### 6. Heading-follow (rotate with the ship): an option, never the default

UNSOURCED; posture B throughout. Neither corpus game has it, and Bob has asked for
it in ice-pirates.

- **Offer it as a setting, default off.** Rotation is motion the player didn't
  command. Keren's inner-ear point applies, and XAG 117 makes camera motion a
  setting. Hide it entirely under reduced motion, or rotate in steps there.
- **Ease the angle on the shortest arc,** slower than position. *Starting value:*
  damp 2/s (posture B). Test: a full turn reads as the world turning, not the screen
  spinning. If testers report discomfort, slow it down.
- **The heading goes up:** `angle = −heading − π/2` in y-down screen space.
- **Every HUD element goes through the camera's `toScreen`**, which now rotates. The
  compass, edge arrows and markers then rotate correctly without their own maths
  (rule 7 covers which of them take the shake).
  Anything drawn in screen space with world meaning (a "north" tick, a minimap
  heading) needs rotating too.
- **Fair fire tests points in screen axes.** `view()` carries the angle, and
  `inView(view, p, grow)` rotates the point before comparing. Never use the axis-
  aligned box around the rotated screen (`bounds()` in the sketch) for fair fire: it
  covers off-screen corners, so ships the player never saw would count as seen. The
  box is for culling only. In a sim, send `angle` in the player's view input.
- **Framing fits the distance in both screen axes** while rotated, because either
  axis can carry it.

### 7. Shake and conversions: one pair, shake at render only

- **Shake never touches the target.** It is a screen-space offset added at render,
  and `toWorld` **excludes** it, so shake never moves the aim point (redshifted's
  `screenToWorld`, deliberately). Kicks are velocity impulses into the spring, not
  target moves.
- **Which HUD takes the shake:** a marker drawn *on* a world object takes it, or it
  slides off its shaking target, and panels never do (both hud-readouts rule 2).
  Edge arrows and the compass are pinned to the screen edge, so this skill treats
  them as panels; that call is this skill's (posture B), and hud-readouts' own
  example helper does shake them. The sketch's `toScreen(p)` is unshaken,
  and `toScreen(p, true)` is for on-object markers. Redshifted's `worldToHudScreen`
  shakes everything, including its edge arrows.
- **Shake sizing, the trauma accumulator, noise and the settings gate** are
  **game-feel**'s ("Shake and Flash Budgets"). Redshifted caps the offset at 15 px
  and decays trauma 1.8/s linearly; ice-pirates caps it at 14 px with damp 9/s
  (corpus values).
- **Every conversion derives from one `x, y, zoom, angle`.** HUD elements and aim
  call `toScreen` and `toWorld`; fair fire calls `inView`; culling uses `bounds()`.
  No HUD element does its own maths: the checklist's `inView`-agrees-with-`toScreen`
  test catches drift.
  - **Redshifted's objective markers** do their own on-screen test with no zoom term
    (`objective-markers.ts`), unlike its edge arrows. That is a likely bug, inferred
    from reading the code.
- **`view()` returns what's on screen in world units** (`{x, y, hw, hh, angle}`) for
  fair fire; `bounds()` returns the axis-aligned box for culling.

### 8. Camera options

The options tab, with rows from redshifted's camera tab (corpus) and the gaps noted:

| Option | Redshifted | Note |
|---|---|---|
| Base zoom | Slider 0–1 → 0.5625–1.25 | |
| Follow lag | Slider 0–1 → halflife 0.02–0.25 s | Default 0.25 s (loosest) |
| Spring on/off | Toggle | Off = rigid lock |
| Speed zoom amount, on/off | Slider and toggle | |
| Shake, kick, zoom pulse, hit-stop | Four toggles | No intensity slider |
| Reduced motion | **None** | Gap: follow **settings-and-persistence**'s tri-state, defaulting to the OS |
| Orientation | n/a | North-up / heading-follow (rule 6) |

- **Store camera options in the one versioned settings record**
  (**settings-and-persistence**). Redshifted keeps its own key,
  `redshifted-camera-settings`, and clamps each slider on load.
- **Apply live,** so the player sees the change behind the pause screen.

### 9. Time: the camera runs on the game's clock

- **Paused: give follow, zoom, shake and the aim lead `dt = 0`.** Shake then freezes
  mid-offset behind the pause menu, still, because the sketch's noise clock advances
  by `shakeDt` too (redshifted's `shakeTime` does the same). Redshifted does all this. ice-pirates
  freezes only the aim lead and passes the real `dt` to `follow`; with the sim
  frozen the target is still, so the camera just finishes settling and shake keeps
  decaying. That's harmless there, but it's the gap a moving target would expose.
- **Hit-stop:** follow freezes, and trauma keeps decaying (redshifted passes the
  un-hit-stopped `dt` to the shake; the sketch's `shakeDt`).
- **Time dilation** (a draft easing time to a freeze): follow *and* trauma use the
  scaled `dt`, so both slow and freeze with it (redshifted).
- **Clamp `dt`** (redshifted: 0.1 s), so a tab coming back doesn't fling the spring.
- **Death:** stop following, so the camera isn't dragged by the wreck (redshifted).
- **New run, respawn, teleport: `snap()`** and zero the velocity. Redshifted has no
  snap on restart (inferred, not verified), so its camera presumably springs from
  the last position.

---

## Edge cases that bite

- **Toroidal or wrapping worlds:** ease toward the shortest wrapped delta, or the
  camera takes the long way round (redshifted's `wrappedDelta`).
- **Resize:** recompute the screen factor and fit on resize. The margins are pixels,
  so a tiny window can make `w/2 − 120` negative; the floor catches it, but check the
  smallest supported window by hand.
- **Zoom pulses need an integrator.** Redshifted's pulses are velocity into the zoom
  spring; with speed zoom off, zoom is forced to 1 and nothing integrates the
  velocity, so pulses silently do nothing (inferred from the code, untested).
- **Phones break the floor rule.** Sizing the floor from the longest gun on the
  smallest window can be unreadable on a landscape phone. Hard Deck (via its
  session): a 720 px flak gun on an 852×393 screen needs ~0.27 zoom to fit, against
  a readability floor of 0.62. The two ways out both have a cost:
  - **Feed the device's real view to the fair-fire rule.** Phones then engage
    closer and play easier, so difficulty depends on the device. That's a problem
    for shared leaderboards and PvP, beyond the `hw: 0` clamp.
  - **Use a canonical view for the sim rule**, the same world size on every device,
    and frame to it. Phone players then see threats smaller, or behind edge arrows
    (**hud-readouts**).

  Pick one per game and write the choice down.
- **Fit against a moving centre.** Fit uses the target centre, not the current
  camera position, so the framing is right once the camera arrives. While moving,
  a point near the margin can briefly be off screen; the 40 px pad covers it.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Framing, headless:** drive `follow()` for 600 frames with two threats on
      different axes; both end on screen. Mutation: frame only the first; the test
      fails (ice-pirates' `camera.test.ts`). *Blind to: HUD elements covering the
      framed point.*
- [ ] **Floor:** the longest-range threat at max range, on the smallest window, is
      on screen. *Blind to: ranges added later; re-run when a weapon changes.*
- [ ] **Frame-rate independence:** 60 frames at 60 Hz and 240 at 240 Hz end at the
      same position. Redshifted's own test is looser (one 0.1 s step against two
      0.05 s steps, to one decimal), because `fastNegExp` isn't exact; a port that
      keeps it needs a tolerance.
- [ ] **Conversions:** `toWorld(toScreen(p)) = p` with zoom, rotation and shake on
      (unshaken `toScreen`); `toScreen(p, true)` moves with the shake; `toWorld` doesn't.
- [ ] **Heading mode:** the heading points screen-up; `inView` agrees with
      `toScreen` for points scattered across the box around the screen (and the box
      alone would have accepted some off-screen ones); the compass and edge arrows
      point at their targets.
- [ ] **Pointer leave:** move the mouse out, back in elsewhere; the view drifts, not
      jumps. With a pad last-used, look-ahead still works with the mouse outside.
- [ ] **Pause, hit-stop, death, restart:** the camera freezes, freezes, stops, and
      snaps.
- [ ] **Felt:** a playtester sets base zoom and lag to taste and doesn't touch them
      again; nobody reports discomfort from heading mode (moment-capture). The only
      check that can say "done".

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-feel** — Shake and flash budgets, punch and the trauma accumulator this camera applies
- **encounter-design** — The fair-fire rule that combat framing is half of
- **settings-and-persistence** — The versioned record and motion gate the camera options live in

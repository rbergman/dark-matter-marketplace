---
name: touch-controls
description: "Touch controls for browser action games on phones and tablets: switching to touch on the first touch rather than by sniffing the device; pointer events with one pointerId per control, released on every way a touch can end; the CSS that stops scroll, zoom, callouts and pull-to-refresh; floating versus fixed virtual sticks, dead zones without a jump; the 'third input' problem of firing on a phone (stick threshold, hold button, auto-fire, tap-on-target) and what each costs; button size, spacing and thumb reach; rotate cards, missing fullscreen and missing vibration on iPhone; and what emulated touch can and cannot verify. Use when adding touch play to a game, reviewing a mobile build, or when players say 'it scrolls instead of moving', 'my thumb slid off the stick', 'the stick stays stuck after a call', 'I can't aim and shoot at once', 'the buttons are too small', 'it zoomed in when I tapped twice' or 'it doesn't fill the screen on my iPhone'. Keyboard and pad input are input-bindings'."
---

# Touch Controls

**Purpose:** A thumb on glass gets the same game a pad gets: it can move and aim
at once, it can't drift or stick, and nothing on the page scrolls, zooms or pops
up a menu under it. Touch is a third device for **input-bindings**' actions, not
a second game.

**Sources:**
- **Corpus** (survey of the Gorewood games, 2026-10-12). Four have real touch play:
  - **Hard Deck** `src/view/touch.ts`: floating twin sticks on pointer events, a
    stick-threshold fire, DOM buttons, a rotate card, safe-area insets, and
    `scripts/touch-check.mjs` (CDP multi-touch emulation at four phone and tablet
    sizes). Its real-phone feel test is still open.
  - **redshifted** `touch-adapter.ts`: fixed canvas-drawn sticks and hold buttons on
    legacy touch events, with 47 tests including "releases touches on cancel (like
    incoming phone call)".
  - **free-horses**: fixed DOM pedal buttons, swipe-to-look, two-finger pinch zoom.
  - **wreckline**: fixed sticks with `setPointerCapture`, a "HOLD TO FIRE" aim stick,
    and separate phone and tablet layouts.

  Only **sightline** vibrates. Numbers marked *corpus value* are posture A for the
  game that ships them and posture B for yours (Numbers Policy).
- **Feral Interactive, "Dev Dive": Lara Croft and the Guardian of Light, mobile**
  (feralinteractive.com, read 2026-10-12): the three-stage fire stick and the three
  schemes they rejected. It gives no numeric thresholds.
- **Game Accessibility Guidelines** (Basic): interactive elements and virtual
  controls large and well spaced, especially on small or touch screens. It cites
  ~0.96 cm as the phone minimum (2.4 cm ideal but impractical), to be treated as a
  floor. Intermediate: keep accuracy-dependent controls in fixed positions.
- **WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA:** 24×24 CSS px, or 24 px spacing.
  That is a floor for web UI, far below a game control.
- **iPhone platform gaps,** from WebKit bug reports, developer forums and MDN's
  compatibility notes (2026), and confirmed by Hard Deck's notes: no element
  Fullscreen API on iPhone (iPad has it, prefixed); `navigator.vibrate` exists on
  iOS but does nothing; the web-manifest `orientation` is ignored.

Typed sketch: `references/touch.ts`. It covers the dead-zone mapping, the floating
twin stick with per-pointer ownership, and release on cancel, blur and hide.

---

## The problem

| Failure | Root cause | Rule |
|---|---|---|
| Swiping the stick scrolls or zooms the page | No `touch-action: none` on the play surface | 3 |
| A tap also fires the mouse cannon or requests pointer lock | Compatibility mouse events after the touch | 2 |
| A stick stays held after a call or a notification | `pointercancel` and page-hide not handled | 2 |
| A touch laptop shows sticks over mouse play | Detecting the device instead of the input | 1 |
| The thumb slides off a fixed stick | Fixed base, no follow | 4 |
| The ship creeps with a resting thumb, or jumps out of the dead zone | No dead zone, or one that clips instead of rescaling | 4 |
| "I can't aim and shoot at once" | A separate fire button takes the aiming thumb | 5 |
| Buttons mis-hit | Too small, too close, or out of thumb reach | 6 |
| A portrait phone shows a letterboxed sliver | No rotate card; the manifest's orientation is ignored on iOS | 7 |

---

## The player-facing idiom

- **The first touch switches the game to touch;** a real mouse move switches it
  back. Nothing shows until then.
- **Left thumb moves, right thumb aims** (and fires), wherever each lands on its
  half of the screen.
- **A few large buttons** in the right thumb's reach for the verbs a stick can't
  carry (bomb, boost), plus an on-screen pause, because there is no Esc.
- **Landscape, with a rotate card** that pauses the game when a phone is held
  upright.
- **Options include** handedness, stick size and opacity, and the fire mode
  (rule 5).

---

## The rules

### 1. Switch on the input, not the device

- **Any `pointerdown` with `pointerType === 'touch'` turns touch play on; a
  `pointermove` with `pointerType === 'mouse'` turns it off** (Hard Deck). This is
  **input-bindings**' last-device rule with a third device.
- **Don't sniff.** redshifted enables its adapter on
  `'ontouchstart' in window || navigator.maxTouchPoints > 0`, so a touch-screen
  laptop gets sticks while it's played with a mouse. `(pointer: coarse)` is fine for
  *layout* (bigger menu targets), not for choosing the input.
- **A pen is a mouse** for an aiming game (Hard Deck): it points a cursor precisely
  and wants no sticks.
- **Harness trap:** a real mouse move clears touch mode, so a test that `click()`s
  after tapping has left touch mode. Tap in the harness (Hard Deck's notes).

### 2. Pointer events, one pointerId per control, released every way

- **Use pointer events.** They give one model for touch, pen and mouse, and a
  `pointerId` per finger. redshifted's legacy touch events work too, but cost a
  second code path.
- **Each control owns one `pointerId`.** A stick claims the first touch on its half
  and ignores the rest until it is released, so a third finger can't steal it
  (Hard Deck, wreckline). Track moves and ups on `window`, not the element, so a
  thumb that leaves the stick's area keeps driving it. Alternatively call
  `setPointerCapture` (wreckline, free-horses) and then also handle
  `lostpointercapture`.
- **Release on `pointerup`, `pointercancel`, page hide and window blur.** A call, a
  notification or a system gesture cancels the touch, and a hidden page may never
  see the up. redshifted tests the cancel. The sketch adds hide and blur (ADDED).
  Match the `pointerId` on release: wreckline's notes record a fix for releasing
  the wrong stick.
- **`preventDefault()` on the touch `pointerdown`** over the play surface, so no
  compatibility mouse events follow. Otherwise one tap is also a left click: a
  cannon shot, a pointer-lock request (Hard Deck).
- **Never request pointer lock for touch** (wreckline skips it for
  `pointerType === 'touch'`; **pointer-lock** owns the rest).

### 3. The CSS that keeps the page still

| Property | On | Why |
|---|---|---|
| `touch-action: none` | Canvas, play surface, every control | No scroll, pan or double-tap zoom under a thumb (all four touch games) |
| `user-select: none`, `-webkit-touch-callout: none` | Play surface and controls | No text selection or iOS callout on a long press (Hard Deck) |
| `overscroll-behavior: none` | `html`, `body` | No pull-to-refresh or rubber-band (wreckline) |
| `viewport-fit=cover` plus `env(safe-area-inset-*)` | Viewport meta; control positions | Use the full screen, keep controls out of the notch and home bar (Hard Deck, free-horses, wreckline) |
| `touch-action: manipulation` | Menu and tap-only UIs | Kills the double-tap-zoom delay but keeps pinch zoom (timberwolf, royal-inbox) |

- **Don't use `user-scalable=no` on the whole page** (redshifted does).
  `touch-action: none` on the play surface already stops zoom there, and menus and
  text stay zoomable for players who need it. UNSOURCED as a corpus finding; it
  follows from the accessibility goal of keeping text resizable.
- **Safe areas in emulation read as zero** unless you set them (Chrome's
  `Emulation.setSafeAreaInsetsOverride`, per Hard Deck's notes). A notch test needs
  the override or a real phone.

### 4. Sticks: floating or fixed, and a dead zone that doesn't jump

| Shape | How it works | Corpus | Use when |
|---|---|---|---|
| **Floating** | The base spawns where the thumb lands, on its half of the screen; it follows a thumb dragged past the rim | Hard Deck | Action games; thumbs never miss it, and it can't run out |
| **Fixed** | A drawn base at a set position; it activates within a radius | redshifted (activation 2× radius), wreckline | The stick's position is part of the HUD, or the screen is crowded |

- **The dead zone rescales.** Inside it the output is zero; outside, the length is
  remapped so it starts at 0 just past the edge and reaches 1 at the rim (Hard
  Deck's `stickVector`). A dead zone that just clips makes the ship lurch to 12%
  speed the moment it moves.
- **Corpus values:** radius 60 CSS px with dead zone 0.12 (Hard Deck); radius 75
  canvas px with dead zone 0.15 (redshifted); 43 px travel with a 0.12 threshold
  (wreckline).
- **Aim keeps its last value on release** (Hard Deck), so letting go doesn't snap
  the turret to zero.
- **The gamepad's radial, rescaled dead zone** is **input-bindings**' rule 7. A
  touch stick is the same signal from a different source, so share the maths.

### 5. Firing: the third input

A phone has two thumbs and a twin-stick game wants three inputs: move, aim, fire.
Every scheme gives something up:

| Scheme | Corpus or precedent | Cost |
|---|---|---|
| **Aim stick fires past a threshold** (below it, aim only) | Hard Deck (`FIRE_AT` 0.5); Feral's shipped "three-stage" stick: faint at rest, a slight push aims, further fires, with a haptic pulse at the switch | Players must find the threshold; the cue that marks it must be felt or seen |
| **Separate hold-to-fire button** | redshifted, free-horses | Feral rejected it: players had to stop aiming to shoot |
| **Auto-fire while aiming at a target in range** | Feral tried it; Hard Deck has proposed it for touch, awaiting Bob's decision | Feral's testers kept running out of ammo; it removes the decision to shoot |
| **Tap-and-hold on an enemy** | Feral tried it | Comfortable, ammo-safe, but lost the twin-stick feel |

- **Default for a twin-stick game: the threshold stick,** because it's the only
  scheme that keeps aiming and firing on one thumb without removing the choice to
  fire. It is posture B: Hard Deck's 0.5 is a first value, and Feral gives no
  number.
- **Mark the threshold.** Feral used a haptic pulse. On iPhone there is no
  vibration (rule 8), so the cue must also be visual: a ring at the threshold, and
  the knob changing colour while it fires.
- **Offer the others as an option** where ammo or fairness allows it. Feral lets
  players add ordinary buttons for its gesture verbs.

### 6. Buttons: big, few, in reach, acting on press

- **Size.** GAG's phone floor is ~0.96 cm, and it's a floor. CSS px don't map to
  physical size across phones, so check on a real one. Corpus values: 66×66 px
  (Hard Deck), 62 px (free-horses), 44–55 px (wreckline, by layout), radius 40
  canvas px (redshifted).
- **Spacing.** Close buttons need to be larger still (GAG).
- **Few buttons.** Feral's aim was the fewest buttons in ergonomic places, with
  context-sensitive ones appearing only when needed. Gestures anywhere on the
  screen (swipe to roll, tap to jump) save buttons, but only when they can't
  collide with a stick.
- **Thumb reach.** Put verbs where the right thumb rests (Hard Deck: bomb and boost
  near the bottom right, inside the safe area). Keep the top corners for pause and
  rarely used actions.
- **Game verbs act on `pointerdown`** (game-feel's act-on-press), with
  `preventDefault`. DOM menu buttons keep the native click.
- **On-screen pause** is required: there is no Esc. Hard Deck's is 48×48 px at
  top right. It routes through **game-shell** like any other pause input.
- **Controls stay put** (GAG Intermediate): don't move buttons between screens or
  states.

### 7. Orientation and fullscreen

- **Rotate card, not orientation lock.** iOS ignores the manifest's `orientation`,
  and no corpus game calls `screen.orientation.lock`. Hard Deck shows a card when
  `(orientation: portrait) and (max-width: 600px) and (pointer: coarse)` matches. It
  pauses the run, carries a Quit button for players with a rotation lock, and is
  skipped with a URL flag. Through **game-shell**, it's one more auto-pause source.
- **Fullscreen** is requested from inside a tap handler (activation), with the
  `webkit` prefix as a fallback. **iPhone Safari has no element fullscreen,** so
  hide the button there rather than offering one that fails. "Add to Home Screen"
  with `display: standalone` is the iPhone's way to lose the browser chrome.
- **Portrait support is a separate layout,** not a squeezed landscape one.
  wreckline designs both; free-horses' spec requires portrait to work or to say
  "rotate".
- **The camera on a phone:** see **camera-control**, "Phones break the floor rule".
  wreckline also picks a different default camera when the pointer is coarse.

### 8. Audio, haptics and the shell

- **Audio unlock** on the first `pointerdown`, once (Hard Deck). Safari resumes an
  audio context only inside a gesture. **game-shell** owns the unlock.
- **Haptics never carry information alone.** `navigator.vibrate` silently does
  nothing on iOS. Gate it behind a setting and feature detection (sightline:
  `haptics && 'vibrate' in navigator`, on by default), and always pair it with a
  visual or audio cue.
- **Auto-pause on hide** works as on desktop (**game-shell**). Rule 2's release on
  hide stops a stick from coming back held.

---

## Edge cases that bite

- **Two thumbs on one half:** the second is ignored (Hard Deck), so a left-handed
  player who moves with both thumbs on the left gets nothing from the second. Offer
  a handedness swap rather than per-touch guessing.
- **A tap on a button inside the stick half** must not also spawn a stick. Buttons
  stop propagation, or the stick surface excludes them.
- **System gestures** (iPadOS three-finger screenshot or undo, an edge swipe)
  should arrive as `pointercancel`, which rule 2 handles. That's unverified;
  check on a real iPad.
- **Emulated touch has no inertia, palm or edge-swipe.** Chrome's CDP touch is
  clean input on a desktop GPU.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, stick maths:** dead zone zero, no jump just past it, unit at the rim,
      direction kept. *Blind to: feel.*
- [ ] **Unit, ownership (fake DOM, as the sketch's test):** left and right thumbs
      claim their sticks; a third finger is ignored; cancel releases only its own
      stick; hide and blur release all; a mouse move leaves touch mode; a mouse
      `pointerdown` spawns nothing. Mutation-check each. *Blind to: real event
      order on devices.*
- [ ] **CDP multi-touch emulation** at phone and tablet sizes in both orientations
      (Hard Deck's `touch-check.mjs`: 844×390, 390×844, 1180×820, 820×1180). Hard
      Deck states its own blind spots: emulated touch on a desktop GPU, not a phone;
      no thumb ergonomics or feel; one seed. Set safe-area insets explicitly.
- [ ] **Page stays still:** swipe, pinch and double-tap on the play surface; no
      scroll, zoom, selection or callout. Menus still zoom.
- [ ] **Interrupt:** hold both sticks, trigger a notification or switch apps, come
      back: nothing held, and the game paused.
- [ ] **Real phone, iPhone and Android** (Bob's): reach, size, the fire threshold,
      the rotate card, audio on first tap. Only this check can say "done"; Hard
      Deck's mobile epic stays open for exactly this.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **input-bindings** — The actions touch feeds, the last-device rule, and the gamepad stick maths
- **game-shell** — On-screen pause, auto-pause from the rotate card and page hide, and the audio unlock
- **camera-control** — Framing and the zoom floor on a phone-sized screen

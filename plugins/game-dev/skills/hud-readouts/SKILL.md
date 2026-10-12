---
name: hud-readouts
description: "Building HUD elements for a browser game that read correctly and move smoothly: choosing DOM overlay, canvas or diegetic for each element, reading interpolated render state for anything anchored to the world, writing the DOM only on change, time-based (not per-frame) HUD timers that freeze under pause, objective compasses and off-screen edge arrows, minimap and radar, score and combo readouts, and a toast and notification queue with tiers, caps, dedupe and adjustable duration. Use when adding or reviewing a HUD element, a waypoint or objective marker, a damage-direction indicator, a minimap, a score counter or an achievement popup; and when players say 'the marker jitters', 'the arrow points the wrong way', 'I missed the message', 'notifications pile up', 'the HUD shakes with the camera', or 'it's smooth at 60 Hz but stutters on my 144 Hz screen'. player-ux owns what the HUD should show; this skill owns how a readout is fed and drawn."
---

# HUD Readouts

**Purpose:** Every readout shows the right value, at the right time, moving
smoothly, without costing the frame. The skill covers the plumbing behind a HUD
that player-ux has already decided the content of.

**Sources:**
- **HUD taxonomy:** Fagerholt & Lorentzon, *Beyond the HUD* (Chalmers MSc thesis,
  2009). It has two axes, diegesis (is it in the fiction?) and spatiality (is it in
  the game space?). Its categories are non-diegetic, diegetic, meta-perception,
  meta-representation, geometric and signifiers. The popular four-way split is a
  later simplification.
- **XAG 116 (Time limits):** toast and notification durations adjustable, or
  dismissed on input.
- **GAG (Intermediate):** "Avoid placing essential temporary information outside the
  player's eye-line"; resizable interfaces.
- **XAG 102:** contrast, and not colour alone.
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - interpolated rendering and a throttled DOM publish: volatile-state-redux
  - shape-and-colour edge arrows that exclude the HUD dock: timberwolf
  - breadth of arrow kinds: redshifted
  - a compact shortest-arc compass: Downwash
  - the tiered toast queue (`radio-queue.ts`): timberwolf
  - a threat rim instead of a widget: gravelight
- **UNSOURCED**, chosen by the corpus and named where it applies: north-up maps
  versus rotating radar, and toast placement at the top right. Corpus timings are
  corpus values (Numbers Policy): posture A for the game that ships them, B for
  yours.

Typed sketch: `references/hud.ts`. It covers interpolation, the pausable view
clock, write-on-change text, edge-arrow placement, shortest-arc easing and the
toast queue.

---

## The problem

| Failure | Seen in | Root cause |
|---|---|---|
| Markers judder on 120/144 Hz displays | timberwolf, gravelight, free-horses (read from code, not reproduced) | HUD and world read raw 60 Hz sim state; no interpolation |
| Hit flash lasts half as long at 120 Hz | Downwash (`flashT -= 1/60` per frame) | Timer counted in frames, not seconds |
| HUD labels shake with the camera | free-horses' ui-plan warns against it | Screen-space HUD drawn inside the shaken camera container |
| Arrow shown for a target hidden behind the HUD dock | timberwolf (fixed, `hudInset`) | On-screen test used the full viewport |
| Toasts pile up and cover play | Downwash (uncapped timeouts), logarithmic (unbounded queue, no dedupe) | No queue, cap or tier |
| About 20 fix commits in one compass (survey count) | redshifted | Arrow kinds added one at a time, with no shared placement rule |

---

## The player-facing idiom

- **Critical state sits in the eye-line:** health, ammo, threat. The rest is at the
  edges. HUD panels stay still when the camera shakes; world markers move with the
  world.
- **A target on screen gets a marker on it. A target off screen gets an arrow at
  the screen edge,** pointing at it, with optional distance. Arrows fade in and out
  rather than pop, and swing smoothly rather than snap.
- **Arrow kinds differ by shape as well as colour** (objective, ally, threat,
  pickup), so colour is never the only cue (XAG 102).
- **Score ticks up and pulses when it changes,** more for big gains. A multiplier
  shows its cap when it reaches it ("×3.0 MAX").
- **Toasts appear briefly at an edge,** one at a time or stacked at most a few deep.
  Urgent ones cut in; chatter waits or is dropped. They pause with the game, and
  can be read at the player's pace (XAG 116).

---

## The rules

### 1. Choose the layer per element

| Layer | Use for | Cost |
|---|---|---|
| **DOM overlay** | Text readouts, panels, toasts, anything a screen reader or `aria-live` should hear | Layout per write: write only on change (rule 3) |
| **Canvas** (the renderer's own UI layer) | Many items, or per-frame motion: edge arrows, world markers, minimap blips, damage numbers | No accessibility tree: mirror critical facts into DOM text, as volatile-state-redux does |
| **Diegetic** (in the fiction: a dashboard dial, a light on the ship) | Non-urgent state, when immersion is a declared pillar | Easy to miss. Pair it with a non-diegetic fallback the player can switch on |

Fagerholt & Lorentzon add **meta-perception**: effects on the player's view itself,
like red screen edges. Gravelight's threat rim is one. It is often the cheapest
legible option for "danger level". Its intensity follows the flash setting (see
**game-feel**).

### 2. Read the right state

- **Anything anchored to the world reads interpolated render state:**
  `pos = lerp(prev, curr, alpha)` with `alpha = accumulator / STEP`.
  - Use the same `alpha` the world renderer used this frame, or markers slide off
    their targets.
  - Volatile-state-redux interpolates; Downwash interpolates the camera and player.
- **World markers use the world's camera transform, shake included.** Redshifted's
  `worldToHudScreen` adds shake and zoom. A marker that ignores shake slides off a
  shaking target.
- **Screen-space panels never take the shake.** Draw them outside the shaken
  container.
- **Text readouts can read sim state directly,** because they change rarely. Publish
  them throttled:
  - volatile-state-redux publishes to React at 5 Hz
  - logarithmic's HUD runs at 4 Hz

  Both are corpus values. *Starting value elsewhere:* 5–10 Hz (posture B). Test:
  does any value the player acts on lag visibly? If so, raise that one readout's
  rate, not all of them.

### 3. Write the DOM only on change

Keep the last string per element, and compare before writing `textContent`. That is
Downwash's HUD and logarithmic's `setText` cache. Never `innerHTML` a readout per
frame, and never rebuild a list that holds focus (menu-navigation rule 7).

### 4. HUD time is seconds on a pausable view clock

- **Every HUD timer advances by `dt` seconds:** flash, pulse, toast hold, arrow
  fade. Never by "one frame". Downwash's `flashT -= 1/60` halves the flash at
  120 Hz.
- **The view clock stops when game-shell's stack pauses the sim.** Toasts, pulses
  and fades freeze with it. A toast that expires behind the pause menu was never
  read.
- **Clamp `dt`** after a hidden tab, so one frame can't skip every timer to the end.

### 5. Off-screen edge arrows

- **Off-screen test:** project the target. It is "on screen" only inside the
  viewport *minus the HUD insets*, plus a margin.
  - Timberwolf excludes the HUD dock with `hudInset`.
  - Downwash uses a 40 px margin (corpus value, `compass.ts`).
  - On screen, draw a marker on the target. Off screen, draw an arrow.
- **Placement:** cast a ray from the screen centre (or the player) towards the
  target, and put the arrow where it meets the inset rectangle. Point it along the
  ray. Use one pure function for every arrow kind. Redshifted's compass took about
  20 fix commits as kinds were added one at a time (survey count).
- **Motion:**
  - Ease the angle along the *shortest arc*, or arrows spin the long way when a
    target crosses behind (Downwash).
  - Fade in and out (redshifted: 0.3 and 0.4 s; Downwash eases alpha), all
    corpus values.
- **Kinds:** a distinct shape per kind as well as colour (timberwolf). Cap the
  count: timberwolf shows the 5 nearest minor marks (corpus value). Urgency (a neglect
  pulse, an expiry blink) is a brightness change. With reduced motion it becomes a
  steady colour or outline, not a scale pulse.
- **Damage direction** uses the same placement towards the attacker, with a shorter
  life. It is the visual channel for a directional audio cue (XAG 103;
  accessibility-design's directional-indicator row).

### 6. Minimap and radar

- **Repaint the static layer** (terrain) on a timer, or when the view moves a tile,
  never per frame (Downwash). Draw blips per frame.
- **North-up for maps the player plans with; rotating for a radar the player
  reacts with.** UNSOURCED convention; pick one per game and say which in Options
  if both make sense.
- **Blips differ by shape per kind** (the same table as the arrows). The player's
  own marker shows heading.
- **Skip the minimap** when the compass already answers "where" and the space is
  only a few screens wide (game-ui-patterns tier 2).

### 7. Score and combo readouts

- **A tabular-figure font** (`font-variant-numeric: tabular-nums`), so the number
  doesn't jitter as digits change width.
- **Pulse on change,** scaled to the gain: redshifted glows on gains of 1000 or
  more (corpus value, `score-animator.ts`).
  - Replay a CSS animation by toggling the class with a forced reflow, or with the
    Web Animations API. A React key remount also works (abduction-run `c1ef2293`).
  - With reduced motion, use a colour flash rather than a scale pulse.
- **Multipliers show their cap,** and stacking reads in effective terms. See
  **progression-legibility**.

### 8. Toasts and the notification queue

- **Tiers:**
  - `now`: alerts. They cut in on the current toast, unless that is also `now`.
  - `next`: lessons, warnings. They never wait behind chatter.
  - `chatter`: flavour, achievements.

  Within a tier, first in, first out. This is timberwolf's `radio-queue.ts`, a
  pure, tested module.
- **Cap the chatter tier and shed the oldest.** Timberwolf caps it at 6 (corpus value, `CHATTER_MAX`).
  `now` and `next` are never dropped.
- **De-duplicate** an identical line already queued or on screen. Logarithmic's
  queue doesn't, so repeats stack.
- **Hold time.** *Starting value:* 2 s plus 60 ms per character (posture B). Test: a
  first-time player reads every lesson toast without pausing. If they miss lines,
  lengthen the hold.
  - The hold is scaled by a setting up to at least 10× (or off), or dismissed by an
    input (XAG 116).
  - It runs on the pausable view clock (rule 4).
- **Accessibility:** a `role="status"` region (`aria-live="polite"`) for the toast
  text. Switch to `assertive` only for `now` alerts (timberwolf). Several
  achievements at once collapse into one toast: "3 achievements".
- **Placement:** at an edge, away from the play-critical centre. A toast that must be
  read in combat goes near the eye-line instead (GAG intermediate), and then it
  belongs in the `now` tier.

---

## Edge cases that bite

- **Interpolating across a teleport or respawn** draws a streak. Snap `prev = curr`
  on discontinuities.
- **Targets behind the camera** in 3-D project to the wrong side. Flip the
  direction when `w < 0` before placing the arrow.
- **DPR and resize.** Edge placement uses CSS pixels. Recompute insets on `resize`,
  and when the UI scale setting changes (settings-and-persistence).
- **A toast anchored over a dialog.** The modal's top layer covers it. If a `now`
  alert must show over a menu, put it in the top layer too (a `popover`), or hold it
  until the menu closes.
- **`aria-live` floods.** Throttle what a screen reader hears to the same tiers, or
  the chatter drowns the alerts.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, pure functions:**
      - edge placement: a target in each octant, and a target behind
      - shortest-arc easing across ±π
      - toast queue order, cut-in, cap, dedupe

      Mutation-check the cut-in rule. *Blind to: legibility.*
- [ ] **High-refresh display (120 Hz or more):** markers stay locked to targets
      while the camera pans. *Blind to: 60 Hz, where the bug is invisible.*
- [ ] **Throttle the page to 30 fps** (DevTools): the flash and toast durations, in
      seconds, are unchanged. *Blind to: timers added outside the view clock.*
- [ ] **Pause with a toast showing:** it is still there, with the same time left,
      after resume.
- [ ] **Hide a target behind the HUD dock:** an arrow shows, not a marker under the
      dock. *Blind to: HUD layouts at other aspect ratios, so repeat at 4:3 and
      21:9.*
- [ ] **Colourblind simulation** (OS filter): every arrow and blip kind is still
      distinguishable. *Blind to: real colour-vision deficiency, which is close but
      not identical.*
- [ ] **Screen reader on:** alerts are announced, and chatter doesn't flood.
      *Blind to: other screen readers.*

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **player-ux** — What belongs on the HUD at all, and the attention budget
- **game-feel** — Hit flash, vignette and shake budgets; this skill draws the HUD around them
- **progression-legibility** — What a score, multiplier or upgrade readout must say

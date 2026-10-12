---
name: situational-ui
description: "UI patterns only some browser games need, each with when to build it and when not to: radial menus (stick angle to sector, select on release, centre cancels, toggle option), inventory grids (spatial navigation, pick-up/put-down as the keyboard alternative to drag, live side panel versus pausing screen), dialogue boxes (press to reveal then advance, player-paced, backlog, adjustable timing) and photo mode (frozen sim, free camera, hidden HUD, canvas capture). Use when a game needs one of these and it isn't yet built, when reviewing one, or when deciding whether it's worth building; and when players say 'I picked the wrong slice', 'I can't move items without a mouse', 'the text skipped before I read it', 'I pressed once and lost the whole line', or 'the screenshot is black'. For diegetic HUDs see hud-readouts; for tutorial hints see player-ux; for accessibility presets see accessibility-design."
---

# Situational UI

**Purpose:** Build the pattern only when the game needs it, and then build it the
way players already expect. Each section opens with *when not to*, because each of
these costs a session and most games don't need most of them.

**Sources:**
- **XAG 116:** dialogue and notification durations adjustable, or dismissed on
  input.
- **XAG 107:** avoid long holds, or offer an alternative.
- **GAG (Basic):** "Allow players to progress through text prompts at their own
  pace".
- **WCAG 2.2 SC 2.5.7 (Dragging Movements, AA):** any drag has a single-pointer
  alternative.
- **game-feel's act-on-press rule** and its stated exception for provisional
  surfaces such as long-press menus.
- **Corpus** (survey of nine Gorewood games, 2026-10-11):
  - a live, side-docked inventory: gravelight
  - a blocking consequence dialog, with advisor "tells": royal-inbox
  - a typewriter comm ticker: redshifted
  - an onboarding dialog: volatile-state-redux
- **No corpus game has a radial menu or a player-facing photo mode.** Those
  sections follow common console practice, labelled UNSOURCED where it applies,
  and their numbers are posture B.

---

## Radial menu

**Build it when:** pad-first play, a handful of choices (weapons, emotes, pings),
picked mid-action without looking away.

**Don't, when:** mouse-first play (a hotbar with number keys is faster), more
choices than fit one ring, or choices with long names.

**Idiom** (UNSOURCED console convention):
- hold a button to open the ring
- the stick points at a slice
- release to select
- release with the stick centred cancels
- the sim slows or pauses while it's open, by shape (game-shell rule 1)

**The one place release-to-act is correct.** The radial is a provisional surface,
the exception game-feel names for act-on-press. Holding is the browse; releasing
is the commit.

**Hold is an access barrier** (XAG 107). Offer **Toggle**: press opens, the stick
points, a second press selects, and B cancels.

```ts
/** Stick angle -> slice index, or -1 inside the deadzone (centre = cancel). Slice 0 is up, clockwise. */
function sliceAt(x: number, y: number, slices: number, deadzone = 0.5): number {
  if (Math.hypot(x, y) < deadzone) return -1;
  const a = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI); // 0 = up, clockwise
  return Math.floor((a + Math.PI / slices) / ((2 * Math.PI) / slices)) % slices;
}
```

- **Slice count.** *Starting value:* at most 8 (posture B). Test: players pick the
  slice they intended 9 times in 10 without looking down. If not, use fewer slices.
- **Deadzone.** *Starting value:* 0.5 (posture B). The stick must clearly leave
  centre, or the cancel position is unreachable. Test: release from centre cancels
  10 times in 10, and a deliberate flick never cancels. Adjust in 0.1 steps.
- **Keyboard and mouse:**
  - keyboard: number keys select directly
  - mouse: direction from the point where the button went down, not from screen
    centre

**Checklist:**
- [ ] Pick each slice blind; centred release cancels.
- [ ] Toggle mode works without any hold.
- [ ] The ring's highlight follows reduced motion: no spin-in, a fade instead.

*Blind to: real pad drift, which needs the real controller.*

---

## Inventory grid

**Build it when:** items have spatial size, or arranging them *is* a decision
(Tetris-style bags, gear loadouts).

**Don't, when:** a list would do. A sortable list with filters beats a grid for
anything without shape.

**Idiom:**
- arrows, D-pad or stick move a cursor cell by cell
- A or Enter picks up, and A again puts down
- a pick on an occupied cell swaps
- B or Esc cancels a carry, then closes the panel
- the mouse drags

- **Single-pointer alternative to drag** (WCAG 2.5.7): click to pick up, click to
  place. It is the same state machine as the keyboard path. Build that state
  machine once and drive it from all three inputs.
- **Navigation is spatial** (menu-navigation rule 3) and doesn't wrap. The carried
  item is drawn at the cursor with a valid/invalid tint *and* an outline shape, so
  colour isn't the only cue.
- **Live panel or pausing screen:**
  - gravelight docks the inventory at the side and keeps the sim live, which is
    its "shape decides" rule
  - a centred inventory pauses
  - a live panel never takes gameplay input (game-shell rule 1)
  - Esc with an item carried cancels the carry first (gravelight's bag-before-menu
    order)
- **The tooltip** shows effective numbers, before → after, against what's equipped
  (progression-legibility rule 2).

**Checklist:**
- [ ] Keyboard-only and pad-only rearrange works.
- [ ] Click-click works with no drag.
- [ ] Esc order: carry → panel → pause.
- [ ] A live panel doesn't block the auto-pause latch.

*Blind to: touch drag, which needs a device.*

---

## Dialogue box

**Build it when:** lines are spoken or read, and a story beat depends on them.

**Don't, when:** for ambient barks; those are toasts (hud-readouts rule 8).

**Idiom:**
- text reveals; the **first press completes the reveal**, the **next press
  advances**
- the press acts on press (game-feel), and a held button doesn't skip lines: it's
  game-shell's fresh-press guard again
- a **backlog** of recent lines on one key
- a **skip** that asks once, because a skipped scene can't be undone

- **Player-paced by default** (GAG Basic). Auto-advance is an option whose timing is
  adjustable up to at least 10× (or off), or dismissed on input (XAG 116).
  - *Starting hold for auto-advance:* 2 s plus 60 ms per character, the same as
    toasts (posture B).
  - Test: a first-time player reads every line.
- **Reveal speed is a setting,** and *Instant* is one of its values. The reveal is
  motion: with reduced motion, it defaults to instant.
- **Speaker names, subtitles and captions** follow accessibility-design and XAG 104:
  a name label, at most 2 lines, an adjustable background.
- **Blocking versus live:**
  - royal-inbox's consequence dialog blocks until read, which is right for a
    decision's outcome
  - redshifted's comm ticker runs live and pauses with the game, which is right for
    radio chatter
  - choose by whether the line needs a response

**Checklist:**
- [ ] A held button never skips a line.
- [ ] Press-complete-then-advance works on keyboard, pad and click.
- [ ] Backlog shows the last lines.
- [ ] Instant reveal under reduced motion.

*Blind to: reading speed for the real audience; watch a playtest.*

---

## Photo mode

**Build it when:** the game is beautiful, players share it, and the shell, HUD and
settings are already done. It is the last thing to add.

**Don't, when:** the game is at prototype stage. A dev-only capture harness, like
redshifted's `?capture=`, serves the team without a player-facing UI.

**Idiom:**
- open from pause; the sim is frozen
- a free camera with bounds (it can't leave the play space or clip through cover
  that hides spoilers)
- toggle the HUD; filters and depth of field are optional
- a "Capture" button saves a PNG
- Esc or B returns to pause

- **Canvas capture.** `canvas.toBlob()` returns a blank image for WebGL unless the
  context has `preserveDrawingBuffer: true`, or the capture runs in the same frame
  right after a render. Render once with the HUD hidden, call `toBlob` in the same
  task, then restore.
- **Camera input** goes through input-bindings' actions, not raw keys, so remaps
  apply. Pointer lock may be wanted here for mouse-look: it's an unlock reason
  being cleared (pointer-lock rule 1).
- **Filename** includes the game and a timestamp. Offer the download; never upload.

**Checklist:**
- [ ] The capture isn't black.
- [ ] The HUD is hidden in the capture but restored afterwards.
- [ ] The camera stays in bounds.
- [ ] Esc returns to pause with the run intact.

*Blind to: GPU-specific capture bugs; test on the target machines.*

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-shell** — Pausing by shape, Esc order and the fresh-press guard every pattern here relies on
- **menu-navigation** — Spatial grid navigation and the one-highlight rule
- **accessibility-design** — Subtitles, hold/toggle and presets

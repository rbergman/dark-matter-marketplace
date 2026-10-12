---
name: menu-navigation
description: "Focus and navigation inside game menus for keyboard, mouse and gamepad: which item is focused when a screen opens, arrow/D-pad/stick movement with wrap rules, grid spatial navigation, one shared highlight across mouse and keys, a visible focus ring for pad users, focus trapped in the top screen and restored to the opener, and hotkeys that keep working beside focused buttons. Use when building or reviewing any menu, options screen, shop, card grid or dialog; when adding gamepad support to menus; when choosing DOM or canvas-drawn menus; or when players say 'I can't get back to the button with the keyboard', 'the controller does nothing in the menu', 'focus vanished', 'there are two highlights', 'the hotkeys stopped working after I clicked', or 'the shop loses my place'. game-shell decides which screen is on top; this skill moves focus inside it."
---

# Menu Navigation

**Purpose:** Any menu works by keyboard alone, by pad alone, by mouse alone, and when
the player switches between them mid-menu. Focus is never lost, never in two places,
and never behind the screen the player is looking at.

**Sources:**
- **Xbox Accessibility Guidelines:**
  - XAG 107 (Input): UI fully operable with digital input and by keyboard alone,
    using single non-simultaneous presses; sliders don't need a held button.
  - XAG 112 (UI Navigation):
    - logical, consistent focus order
    - linear menus wrap, 2-D grids don't
    - a persistent way back from every screen
    - the input that moves focus onto an element must move it off, or a prompt says
      how
- **Game Accessibility Guidelines:** "Ensure that all areas of the user interface can
  be accessed using the same input method as the gameplay" (Basic).
- **Platform:** MDN on `inert` and `<dialog>.showModal()` (both Baseline). The modal
  makes the rest of the page inert and puts the dialog in the top layer.
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - restore to the opener and inert covered panes: free-horses `PlayMenu`
  - the Tab trap and spatial shop navigation: timberwolf
  - per-frame pad edges and slider nudge: Downwash
- **Assumptions, labelled where they occur:**
  - the stick repeat timings
  - the spatial-navigation weighting
  - "one highlight, last device wins", which is UNSOURCED convention and observed
    in shipped games

Typed sketch: `references/nav.ts`.

---

## The problem

| Failure | Seen in | Root cause |
|---|---|---|
| Settings screen unreachable by keyboard or pad | redshifted | Canvas-drawn panel with no focusables; a navigation helper existed and was never wired |
| Every hotkey dead after one click on a HUD button | volatile-state-redux | "Block hotkeys while a button has focus", applied to all keys |
| Shop loses keyboard focus every second | logarithmic | `innerHTML` re-render at 1 Hz while open |
| Focus lands on the first item, not where the player came from | Downwash | Pop focuses "first item of the new top" |
| Gameplay Tab fights menu Tab | free-horses (inference) | Default binding on Tab, with HUD buttons in the tab order |
| A highlight outlives the cursor | gravelight (fixed) | Hover and keyboard tracked as two highlights |

---

## The player-facing idiom

- **A screen opens with focus on its safe default.** Pause focuses Resume. A
  destructive confirm focuses the non-destructive choice: royal-inbox's restart
  dialog autofocuses "Continue current reign". A results screen focuses the next
  action.
- **Up/down (arrows, D-pad, left stick) moves through a list, and it wraps.**
  Tab and Shift-Tab do the same. In a 2-D grid, direction moves spatially and stops
  at the edges (XAG 112).
- **Enter, Space or A activates.** Esc or B backs out; game-shell owns that.
- **Left/right on a focused slider adjusts it by one step.** Holding repeats. The
  pad does the same.
- **One highlight.** If the mouse moves over an item, the highlight follows the
  mouse. If a key or pad direction is pressed next, navigation continues from that
  item. Never show a hover highlight and a focus highlight at once.
- **The highlight is always visible** in a game menu, including for pad users, who
  generate no keyboard modality.
- **Closing a screen puts focus back** on the control that opened it.

---

## The rules

### 1. DOM menus by default

Build menus as DOM over the canvas: `<dialog>`, real `<button>` and
`<input type="range">`, and `inert` for anything covered. That gives you, for
free:
- the browser's focus order and the trap
- Enter and Space activation
- slider arrow keys
- the accessibility tree

**A canvas-drawn menu must rebuild all of that:**
- focus state
- hit testing
- keyboard order
- text that tests can observe
- screen-reader output, for which there is no replacement

Gravelight and redshifted both paid that. Draw a menu in canvas only when it must
live in world space (diegetic UI; see **hud-readouts**). Even then, mirror its
state into hidden DOM controls so focus and assistive tech have something real.
Volatile-state-redux keeps DOM counterparts for critical canvas facts for exactly
this reason.

### 2. Focus on open, trap while open, restore on close

- **On open,** focus the screen's declared default, not "the first focusable". Put
  a `data-default` attribute on it.
- **While open,** `showModal()` makes everything outside the dialog inert, so Tab
  can't escape. For panes that aren't dialogs, set `inert` on what they cover
  (free-horses).
- **Don't rely on the browser to wrap Tab.** The modal keeps focus out of the page
  behind it, but it isn't a game-style loop.
  - ASSUMPTION: in Chrome, Tab past the last item reaches the browser's own UI
    before cycling back.
  - IMPACT: a keyboard player's focus "disappears" for a press.
  - VALIDATE: Tab past the end of a modal and watch where the ring goes.
  - For game-like wrap, intercept Tab and Shift-Tab inside the dialog and move
    focus yourself (rule 3).
- **On close,** focus the opener if it is still connected. game-shell's stack
  records it. If the opener is gone (the screen that opened it was rebuilt), focus
  the parent screen's default.

### 3. Move focus with one function

All directional input goes through `move(direction)`: arrows, Tab, D-pad, stick.
- **Lists:** `next = (i + dir + n) % n`, wrapping. Skip disabled and hidden items
  (`getClientRects().length === 0`).
- **Grids:** spatial. Take items whose centre lies in the pressed direction, and
  pick the lowest `primary + 2 × orthogonal` distance. *Starting value:* weight 2.
  Test: across the whole grid, does every pair of adjacent cells reach each other
  in one press? If diagonal neighbours win over straight ones, raise the weight.
  Don't wrap at grid edges (XAG 112).
- **Scroll into view** after moving: `el.scrollIntoView({ block: 'nearest' })`.
  Free-horses had to stabilise an Options pane that scrolled under focus.

### 4. One highlight, last device wins

- **The pointer moving over an item (`pointerover`, which bubbles) focuses it.** The
  highlight follows the mouse, and the next key press continues from there.
  Skip it while the pointer is locked: there is no visible cursor (see
  **pointer-lock**).
- **Draw the highlight from a class the navigation layer sets** (`.hl`) as well
  as `:focus-visible`.
  - The browser's focus-visible heuristic follows the *keyboard*.
  - A focus moved by pad code after a mouse click may not show a ring.
  - ASSUMPTION: Chrome hides the ring for script focus after pointer
    interaction.
  - IMPACT: pad players lose their place.
  - VALIDATE: click an item, then press D-pad down; the ring must show.

### 5. Hotkeys and focused controls share the keyboard

A focused control consumes **only the keys it uses**:
- a button takes Enter and Space
- a slider takes the arrow keys
- a text field takes everything printable

Every other key still reaches hotkeys and the shell. Never block all hotkeys
because a button has focus (volatile-state-redux).

During play, HUD buttons have `tabindex="-1"` and the canvas holds focus, so
Tab and Space belong to the game. Menus are where Tab navigates.

### 6. Pad in menus

- **Poll once per rendered frame,** with edges (pressed this frame, not last). Never
  poll inside the sim tick: Downwash's pad couldn't unpause until polling moved.
- **D-pad = arrows. A = activate** (`el.click()` on the focused element). **B and
  Start go to game-shell.**
- **The left stick navigates past a threshold, then repeats while held.**
  *Starting values:* threshold 0.5, first repeat after 400 ms, then every 100 ms.
  Test: can a player stop on the item they meant 9 times in 10 in a 12-item list?
  If they overshoot, lengthen the repeat interval.
- **Left/right on a focused range input** steps its value and dispatches `input`,
  as arrow keys do natively (Downwash's `nudgeSlider`).
- **Glyphs** in the menu's footer follow the last-used device: "Ⓐ Select Ⓑ Back"
  versus "Enter Select Esc Back". See **input-bindings**.

### 7. Never rebuild under focus

Re-rendering a menu with `innerHTML` or `replaceChildren` destroys the focused
element; focus falls to `<body>`. Update text and attributes in place. If a rebuild
is unavoidable, remember the focused item's `data-id` and refocus it afterwards.
That costs one line, and logarithmic's shop lost focus every second without it.

---

## Edge cases that bite

- **Focusing on open inside a key handler.** The key that opened the screen can
  also activate the newly focused button: Enter opened it, and the browser's click
  for Enter fires on the new focus. game-shell's fresh-press guard covers this. The
  same applies to Space, whose click comes on keyup.
- **Disabled items in a wrapped list.** Skip them, or the wrap appears to stall. If
  every item is disabled, focus the screen's back button.
- **Text fields.** Arrow keys belong to the caret, so don't intercept them while an
  `<input type="text">` has focus. Up/down can still leave the field (XAG 112's "the
  input that moved focus in moves it out").
- **Remap capture.** While capturing, the focused row is waiting for a key, and
  navigation must not move. Up or down would be captured as bindings. See
  **input-bindings**: the capture state is the router's first check.
- **Zoom and reflow.** At 200% browser zoom the menu must still fit or scroll, with
  focus visible (volatile-state-redux's 200%-zoom reflow; XAG 101 asks text to
  scale to 200%).

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Keyboard-only walk** through every screen (CDP `press_key`, not
      `dispatchEvent`). Every control is reachable and operable, and focus is always
      visible. *Blind to: screen-reader output.*
- [ ] **Pad-only walk:** same screens, D-pad and stick, A and B. *Blind to: pads
      other than the one tested, and non-standard mappings.*
- [ ] **Switch mid-menu:** hover an item with the mouse, then press down. Focus
      moves from the hovered item, and there is one highlight. *Blind to: touch.*
- [ ] **Open and close every screen:** focus returns to its opener, every time.
      Script it: record `document.activeElement` before open, compare after close.
      *Blind to: screens reachable only in states the script doesn't reach.*
- [ ] **Leave the shop or Options open for 10 s** with focus on an item. It keeps
      focus (catches re-render loss). *Blind to: re-renders triggered by events the
      wait didn't produce.*
- [ ] **Click a HUD button, then press a hotkey;** the hotkey works. *Blind to:
      other focus sources such as links and inputs. Repeat for each.*
- [ ] **Browser zoom 200%:** every screen fits or scrolls, with focus visible.

**Test:** a keyboard-only player and a pad-only player can each change a volume,
remap a key and start a run without touching the mouse. If either can't, nothing
else on this list matters yet.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-shell** — Which screen is on top, Esc and B, and the fresh-press guard
- **input-bindings** — Pad polling, glyphs, and the remap capture state
- **accessibility-design** — The access requirements this implements for menus

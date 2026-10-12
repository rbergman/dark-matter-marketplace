---
name: input-bindings
description: "The input layer of a browser game: an action map on KeyboardEvent.code, key remapping ('press a key…', Esc cancels, swap on conflict with a notice and undo, reset), reserved keys, merging newly added actions into an old save, gamepad polling with edge detection and deadzones, button prompts that follow remaps and the last-used device, and hold/toggle options. Use when adding controls, a remap screen or gamepad support; when on-screen key hints are hard-coded; when a new action ships and old saves must keep working; or when players say 'I can't rebind that', 'the hint says F but I changed it', 'WASD is wrong on my AZERTY keyboard', 'my controller doesn't work', 'two actions are on the same key', or 'the prompt shows keyboard keys while I'm on the pad'. Owns bindings and prompts; settings-and-persistence owns storing them."
---

# Input Bindings

**Purpose:** Every action is remappable, prompts always show the binding that
actually works, the game reads the pad as reliably as the keyboard, and an update
that adds an action never breaks a player's saved controls.

**Sources:**
- **Xbox Accessibility Guidelines, XAG 107 (Input):**
  - remap all controls in-game, regardless of platform remapping
  - hints and tutorials show the new binding after a remap
  - avoid holds and chords, or offer an alternative
  - analog sensitivity adjustable
- **Game Accessibility Guidelines** (Basic): "Allow controls to be remapped /
  reconfigured". The page notes console-level remapping is a backup, not a
  substitute.
- **Platform:**
  - MDN: `KeyboardEvent.code` is the physical key, layout-independent; never
    derive a label from it.
  - `navigator.keyboard.getLayoutMap()` gives labels, but it is experimental and
    Chromium only.
  - W3C Gamepad: poll `getGamepads()` each frame; the "standard" mapping indices;
    no pads are exposed until a pad gesture.
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - the capture service and conflict banner: abduction-run
  - capture-phase capture: logarithmic
  - merging new actions into an old save: timberwolf `mergeBindings`
  - live-binding hint chips: abduction-run `KeyTag`
- **No corpus game remaps the gamepad,** so the pad sections follow the W3C spec and
  are untested in shipped Gorewood code.
- **UNSOURCED:** prompts follow the last-used device, and mouse movement alone
  doesn't flip them. It is convention, and only secondary sources describe it.

Typed sketch: `references/bindings.ts`, with pure rebind, undo and merge functions.

---

## The problem

| Failure | Seen in | Root cause |
|---|---|---|
| Key hints wrong after a remap | logarithmic | `[F] BUY` hard-coded in HTML and HUD strings |
| Old save plus new action leaves the new action unbound, or sharing a key | timberwolf (fixed by `mergeBindings`) | Save loaded over defaults without re-checking collisions |
| Duplicate binding wipes every binding | logarithmic | Sanitiser resets the whole keymap on any duplicate |
| Bindings follow the label, not the key position | timberwolf | Stored `e.key`, so AZERTY players get WASD in the wrong places |
| No way back to defaults | timberwolf | No reset |
| Pad only in help text | redshifted | Pad bindings rendered as a static guide |
| Pad couldn't unpause | Downwash (fixed) | Polled inside the sim tick |

---

## The player-facing idiom

- **Controls screen:** one row per action, two keyboard slots and a pad slot,
  grouped (Movement, Combat, Menus). Sustained actions get **Hold / Toggle**.
- **Activate a slot and it shows "Press a key… (Esc to cancel)".** The prompt
  states how to leave (XAG 112). The next key binds; Esc cancels.
- **If the key belongs to another action, the two swap.** The screen says so in
  words: "Space moved from Fire to Jump. Fire is now on W." It offers **Undo** for
  one step. Nothing is left unbound.
- **A key the game can't take is refused with a reason:** "Esc is reserved for
  menus".
- **"Reset" per action, and "Reset all controls".** Both are undoable, so neither
  needs a confirm (game-feel: prefer undo to confirmation).
- **Changes apply immediately and persist.** There's no Apply button to forget.
- **Every prompt in the game shows the current binding for the device in use:**
  - "Press Ⓐ" on the pad, "Press Space" on the keyboard
  - the tutorial, the title, the HUD, and the pause menu's footer alike

---

## The rules

### 1. Actions, not keys

Gameplay asks `isDown('fire')` and `pressed('jump')`, never `e.code === 'Space'`.
An action has:
- a kind: `press` (edge) or `hold` (level, with an optional toggle mode)
- up to two keyboard `code`s
- one pad button or axis

This one indirection is what makes remapping, prompts, toggles and pad support
possible without touching gameplay.

**Presses reach the fixed-step sim through a latch.** Key and pad edges arrive per
rendered frame, and the sim ticks at 60 Hz. A press is latched until a tick
consumes it:
- a 120 Hz frame with no tick keeps it
- a 30 Hz frame with two ticks delivers it to the first only

Holds are sampled at each tick, not latched. The latch is cleared with held input
whenever game-shell opens a screen (`PressLatch` in the sketch).

**Scope of remapping.** Gameplay actions are fully remappable. Menu navigation
stays fixed and always available: arrows, Enter and Esc, plus the D-pad, A, B and
Start. A remap can never strand the player in a menu. Menu actions may take
*additional* keys. This is a deliberate, partial deviation from XAG 107's "remap
all controls"; say so on the Controls screen.

### 2. Store `code`, show the layout label

- **Bind and store `KeyboardEvent.code`** (`KeyW`), never `key` (`w`, which is
  `z` on AZERTY). Defaults are then positional, WASD on any layout, and
  case-insensitive for free.
- **Label with `navigator.keyboard.getLayoutMap()`** where it exists, so `KeyW`
  reads as "Z" for an AZERTY player.
  - Elsewhere, fall back to a code-derived label (`KeyW` → "W").
  - The fallback is wrong on non-QWERTY layouts, and the controls screen should
    say so once: "Labels assume a QWERTY layout".

### 3. Capture comes first, in the capture phase

While a slot is capturing, the key goes to capture **inside game-shell's
keyboard router**. That is the single capture-phase `keydown` on `window`, and
"capturing?" is its first check. It calls `preventDefault()` **and
`stopImmediatePropagation()`**, then resolves the capture.
- `preventDefault()` alone doesn't stop other listeners. Gameplay and menu
  listeners also ignore keys while `shell.ownsInput`.
- Logarithmic captures in the capture phase so the bound key doesn't also fire its
  action.
- **Esc cancels, and so does pad Start.** game-shell's router calls
  `cancelCapture()` for those, and hands every other key or button to capture.
  They are the only inputs capture can't bind.
- **The pad path checks capture first too** (game-shell's `pad()`). The A press
  that started a pad capture was consumed in that frame and can't bind itself.
- **Start capture from `click`, not `pointerdown`.** Otherwise the press that opened
  the slot is captured as a mouse binding.
- **Ignore `e.repeat`.** Holding a key as capture starts must not bind it by
  accident.
- A second capture request cancels the first (abduction-run).

### 4. Conflicts swap, with a notice and undo (D4)

Binding key K to action A, where B already holds K:
- **B takes A's old key in that slot.**
- **If that would leave B with no key at all** (A's slot was empty and K was B's
  only key), B takes a spare from the same free-key list the loader uses, and the
  notice says which.
- **Nothing is ever silently unbound.**
- **The screen names both actions and both keys,** and offers a one-step Undo that
  restores the previous map exactly.
- **Free-horses refuses instead, naming the owner.** It's defensible, but it
  strands a player who wants that key. The corpus majority swaps.
- Two actions *may* share a key only if they live in different contexts that are
  never active together: a menu action and a gameplay action, say. Declare the
  context on the action, and check conflicts within a context only.

### 5. Reserved keys

- **Esc:** game-shell's back and pause.
- **Browser and OS keys the page can't or shouldn't take:**
  - F5, F11, F12
  - Ctrl/Cmd combinations
- **Tab is not reserved.** Menus own input while they're open, so Tab is free for
  play. Keep HUD buttons out of the tab order with `tabindex="-1"` (menu-navigation
  rule 5).
- **The gameplay key handler calls `preventDefault()` on every bound key while the
  stack is empty.** Otherwise Tab's default moves focus out of the page, which
  blurs the window and pauses the game. Space would scroll; arrows would scroll
  too.
- **Pad Start:** it toggles pause and cancels a pad capture.

  Refuse them with the reason shown.
- **Debug keys** used in development builds, such as Backquote (abduction-run).

### 6. Loading a save merges, never replaces

- **Start from the defaults, then lay the saved map over them** action by action.
- **An action the save predates keeps its default key,** unless the save gave that
  key to something else. Then it takes a spare from a list of free keys.
  Timberwolf's review found a save with torch on R left the new bandage action
  with no working key.
- **A saved key that is now reserved, or unknown, falls back to that action's
  default.**
- **Duplicates in a hand-edited or corrupted save resolve per action** (the later
  action falls back), not by wiping the map.
- **Bindings are part of the versioned settings record.** Storing, versioning and
  migrating them is **settings-and-persistence**'s job.

### 7. The gamepad

- **Poll `navigator.getGamepads()` once per rendered frame.** Entries can be null.
  Keep the last frame's buttons to compute edges (pressed/released this frame).
  A pad gets no `repeat` flag, so edges are the only fresh-press signal.
- **`mapping === 'standard'`** means the W3C layout:
  - 0–3: face buttons (bottom, right, left, top)
  - 4/5: bumpers
  - 6/7: triggers
  - 8/9: select/start
  - 10/11: stick clicks
  - 12–15: d-pad
  - axes 0–3: the two sticks

  Anything else, show "Unrecognised controller: check the pad bindings" and let
  the player remap by raw index.
- **Deadzone:** radial, rescaled so output starts at 0 at the edge of the
  deadzone. *Starting value 0.15–0.2*, the default range accessibility-design
  quotes; adjustable in settings. Test: a resting pad reads exactly 0 on the
  player's controller; a slight push moves the cursor. If the character drifts at
  rest, raise it.
- **Triggers are analog buttons (`.value`).** Use press and release thresholds with
  hysteresis. *Starting values:* press at 0.5, release at 0.4 (posture B). Test:
  half-pulled triggers don't chatter.
- **Pad remapping** captures the next button that goes from up to down in a poll.
  **Start cancels**: it's reserved. Esc on the keyboard cancels too. Every other
  button, B included, binds on its press edge. The prompt says "Press a button…
  (Start to cancel)" (XAG 112).
- **Disconnect** is game-shell's: `gamepaddisconnected` feeds the auto-pause latch.
  Pads only appear after a pad button press, which is normal.

### 8. Prompts are generated, never typed

- **Every on-screen hint calls `prompt(action)`.** It returns the label for the
  **last-used device**: the key label, or the pad glyph.
- **No string in the game contains a literal key name.** `grep` the source for
  `[F]`, `"Space"` and `Press E` as a check (logarithmic's stale hints).
- **Last-used device:** a key press or mouse *click* switches prompts to keyboard
  and mouse. A pad button, or a stick past the deadzone, switches to pad.
  **Mouse movement alone doesn't switch,** or a bumped desk flips every prompt.
  UNSOURCED convention.
- **Glyph family** (Xbox ABXY versus PlayStation shapes) can't be read reliably
  from `pad.id`. Default to one family and offer a setting.

### 9. Hold or toggle

Every `hold` action offers Toggle (accessibility-design Tier 1; XAG 107 says avoid
long holds). In toggle mode, a press flips the state. Clear toggled state wherever
held keys are cleared: on game-shell opening a screen, and on window blur.

---

## Edge cases that bite

- **Held keys across blur.** The window loses focus with W down, and the keyup never
  arrives. Clear all held state on `blur` and on every screen open (abduction-run
  `daedb89c`; game-shell rule 1).
- **Modifiers as bindings.** Shift and Ctrl report `code` `ShiftLeft` and so on.
  They are bindable, but Ctrl+W closes the tab: don't make Ctrl part of a default.
  Free-horses whitelists keys and excludes Shift.
- **IME and dead keys** (`e.isComposing`, `key === 'Dead'`). Ignore them in
  capture.
- **Mouse buttons as bindings.** Support them only if the game uses the mouse in
  play. A captured left click inside the Controls screen is ambiguous; show "Mouse
  1" and require a second click to confirm that one binding only.
- **The prompt during capture** must show the *old* binding until the capture
  resolves. If it is cancelled, nothing changes.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, pure functions** (`rebind`, `undo`, `mergeSaved`):
      - swapping keeps every action bound
      - undo restores the previous map exactly
      - an old save plus a new action leaves no collision
      - a corrupt duplicate falls back per action

      Mutation-check: remove the swap and a test must fail. *Blind to: DOM event
      order.*
- [ ] **Real browser, real keys:** remap Jump to Space while Fire holds Space.
      The notice names both, and Undo restores. Rebind Jump's *empty* second slot to
      Fire's only key; Fire gets a spare, and the notice says so. Esc during capture
      cancels without
      opening pause. *Blind to: other keyboard layouts unless the OS layout is
      switched.*
- [ ] **AZERTY:** switch the OS layout. Movement stays positional, and labels read
      Z/Q/S/D where `getLayoutMap` exists. *Blind to: browsers without the
      Keyboard API, which show the QWERTY fallback.*
- [ ] **Prompt sweep:** grep for literal key names; then remap every action and read
      every screen with a prompt. *Blind to: prompts built in places the grep
      pattern doesn't match.*
- [ ] **Pad:** plug in and press a button; prompts switch. Wiggle the mouse; they
      don't switch back. Click; they do. *Blind to: non-standard pads, and other
      brands' glyphs.*
- [ ] **Hold/toggle:** toggle sprint on, open pause, resume. Sprint is off, not stuck
      on.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **settings-and-persistence** — Stores, versions and migrates the binding map
- **game-shell** — Owns Esc, clears held input on every screen open, and handles pad disconnects
- **accessibility-design** — Why every input is remappable and every hold has a toggle

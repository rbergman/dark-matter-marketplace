---
name: game-shell
description: "The screen stack of a browser game and every seam in it: the pause menu (Resume, Options, Restart, Quit), Esc/Start/B semantics, which screen owns input, auto-pause on tab hide, window blur, clock overload, lost pointer lock or a lost controller, guards so a held key never acts on the screen that just opened, unlocking audio on the first gesture, and the title, game-over and high-score flow. Use when adding or reviewing a pause menu, a modal or overlay, an Escape handler, a title or death screen, or anything that opens over play; and when players report 'Esc closed two menus', 'the pause menu has no restart', 'it unpaused itself', 'I died and it instantly started a new run', 'the controller can't unpause', 'no sound until I clicked twice', or 'I alt-tabbed and came back dead'. Owns the Escape mechanism, the auto-pause latch and fresh-press guards; menu-navigation owns focus inside a screen."
---

# Game Shell

**Purpose:** One owner for every screen that can open over play, and for the three
seams where browser games keep breaking:
- who handles Escape
- who decides the game should pause
- whether a key that was already down may act on the screen that just appeared

Everything else in a game's UI hangs off this.

**Sources:**
- **Browser behaviour:**
  - Escape on a modal `<dialog>` follows the HTML Living Standard's close requests
    and close watchers. The behaviour this skill depends on was **verified in
    Chrome 152 with real key presses** (2026-10-11).
  - Auto-pause triggers follow the MDN Page Visibility API.
  - Audio unlock follows Chrome's autoplay policy (developer.chrome.com/blog/autoplay).
- **Player-facing requirements:**
  - XAG 107: UI fully operable by keyboard alone.
  - XAG 112: a persistent way back from every screen.
  - XAG 115 (Error messages and destructive actions): a second step before an
    action that loses progress.
  - Microsoft's public Xbox console certification requirements:
    - XR-115: the player can continue after a controller drops, or is prompted
    - test case 001-02: resume after suspend without losing progress
- **UNSOURCED conventions, followed because players expect them:** Start opens
  pause; B or Esc backs out one level; the game pauses when the window loses focus.
  Console certification texts that might codify them are not public.
- **Mechanisms** are the strongest of nine Gorewood games (survey, 2026-10-11):
  - the modal stack and second-activation confirm: Hard Deck
  - the auto-pause latch: abduction-run
  - the fresh-press rules: timberwolf
  - "screen shape decides the pause": gravelight

The full TypeScript is in `references/shell.ts`. It is type-checked in strict mode,
and its pure `escDecision` is branch-tested. The first version was smoke-tested in
Chrome 152 with real keys: one pop per Esc, focus back to the opener, double-Esc
grace, and the Restart second activation; the log is in the spec's research digest.
The title-to-restart flow is in `references/run-flow.md`.

---

## The problem

Every corpus game built a shell, and most broke it in one of the same places:

| Failure | Seen in | Root cause |
|---|---|---|
| One Esc closes two screens, or closes the menu it just opened | gravelight (fixed), redshifted (masked by guards), abduction-run (read from code, not reproduced); Hard Deck safe only by listener order | More than one listener handles Esc: a global pause hotkey plus a per-screen close, or pointer lock's Esc plus the menu's |
| Held key acts on the new screen (death screen skipped, draft card picked mid-fire) | timberwolf (3 fix commits), redshifted, Hard Deck | The screen trusts the first keydown it sees |
| Pause with no Restart or Quit, or Restart with no confirm | timberwolf, abduction-run, volatile-state-redux (no menu); redshifted (no confirm) | Pause built as a toggle, not a screen |
| Game unpauses itself, or never pauses on alt-tab | redshifted, gravelight | Pause triggers scattered, with no single latch |
| Pad can't unpause | Hard Deck (fixed) | Pad polled inside the sim tick, which stops while paused |
| No sound after a pad-only start | every game (platform rule, not a bug) | Gamepad input is not a user-activation event |

---

## The player-facing idiom

What a player of 2020s games expects without being told:

- **Esc, Start/Menu or P opens pause during play.** Start and P *toggle*: pressed
  with pause anywhere on the stack, they close everything down to and including
  pause, and resume. Hard Deck binds P as a second key.
- **Esc or B backs out exactly one level.** Esc on pause means Resume. Every screen
  has a visible way back as well (XAG 112). A screen with its own exits, such as the
  death screen's Restart and Title, is marked not dismissable: Esc and B do nothing
  there.
- **Pause contents, in this order:** Resume (focused by default), Options, Restart,
  Quit to title. Optional items: Controls, Feedback.
- **Restart and Quit ask once more.** The button relabels itself ("Restart: are you
  sure?") and needs a second activation; moving focus away disarms it. No modal
  "are you sure" dialog.
- **The game pauses itself** when the player tabs away, switches windows, the
  machine stalls, pointer lock drops, or the controller disconnects. **It never
  unpauses itself.** "I pressed Tab and now I'm dead" (abduction-run's stated
  reason).
- **A death or result screen can't be skipped by the key you died holding.** It
  waits for a fresh press, and holds long enough to be read.
- **"Press any key"** on the title means any key except modifiers, browser
  shortcuts, and keys aimed at a focused link.
- **Sound starts with the first key or click.** If the player starts on a pad, the
  game says sound needs a key or click.

---

## The rules

### 1. One stack, one owner of input

Screens are `<dialog>` elements opened with `showModal()`. Each screen has an entry
on the shell's stack:

```ts
interface Screen { el: HTMLDialogElement; pausesSim: boolean; dismissable: boolean;
                   opener: Element | null; openedAt: number; heldPad: Set<number>; readHoldMs: number }
```

- **A screen's own first use of Back** (an inventory cancelling a carry, a
  sub-panel closing) goes through `consumeBack` on that screen's entry. The shell
  calls it before popping, for Esc and B alike. That is the only per-screen Back
  hook, and the reason no screen ever needs its own Esc listener.
- **A full-screen mode with no stack entry** (photo mode) uses the optional
  `modeBack` hook. The shell calls it on Esc or B while the stack is empty, before
  opening pause. If it returns true, the mode has handled Back. The mode must also
  end itself in `onStackChange` when any screen opens, because pause can arrive
  from P, Start or the auto-pause latch without Back ever being pressed.
- **Every push and pop calls one `onStackChange` hook.** That hook applies the pause
  duck, lifts it in Options, freezes view FX, and is where pointer-lock reads "a
  screen is open" as an unlock reason.

- **The top screen owns input.** Gameplay reads input only when the stack is empty.
- **Opening any screen clears held gameplay input**, so a key held into the menu
  can't ghost-hold after it closes.
- **The sim is paused while any open screen has `pausesSim`.** That is gravelight's
  rule: *the screen's shape decides.* Full-screen and centred screens pause. A
  docked side panel (inventory, a map peek) can run live; then it doesn't take
  gameplay input either, only its own keys.
- **The shape and the pause must agree.** A centred dialog over a live sim reads as
  a pause, and the player dies in it.
- **Pausing freezes everything time-based in the view too:** particle emitters, HUD
  timers, popups. Hard Deck's first review caught FX still emitting under pause.
  Wall-clock idle income is the deliberate exception (logarithmic).
- **On resume, drop the sim accumulator.** Time spent paused must never be replayed
  as catch-up ticks.

### 2. Escape has exactly one handler

The shell installs **one** `keydown` listener on `window` in the **capture
phase**. It is the router for shell keys, and it decides in this order:

```
remap capture active?            → preventDefault + stopImmediatePropagation; Esc cancels it,
                                   any other key goes to capture
target is a text field?          → skip the next two rows (P types "p", Space types spaces)
repeated Enter/Space in a screen → preventDefault (a held Enter must not re-activate a button)
the bound pause key (default P)? → toggle pause
Esc → preventDefault, then escDecision():
  e.repeat?                      → ignore
  stack empty, in play?          → open pause
  top opened < grace ago?        → ignore (rule 4)
  top not dismissable?           → ignore
  otherwise                      → back(): pop one level; popping pause resumes
```

The Esc decision is a pure function (`escDecision` in the sketch), so every branch
gets a unit test.

Why `keydown` and not the dialog's `cancel` event, which looks like the obvious
hook? **Verified in Chrome 152:**
- `preventDefault()` on `cancel` holds only the *first* Esc.
- A second Esc with no click in between fires a `cancel` that can't be cancelled.
  The close-watcher anti-abuse rule allows that, and Esc does not count as user
  activation.
- So the browser closes the dialog behind the shell's back.
- Cancelling the capture-phase `keydown` suppresses the browser's close request
  entirely, and the shell decides.

Each dialog still listens for:
- `cancel`: prevent it if cancelable, then route to `back()` if the screen is
  dismissable. This covers close requests that arrive with no keydown, such as an
  Android back gesture.
- `close`: resync the stack if the browser closed a dialog anyway. A
  non-dismissable screen (death) is shown again, because it holds the only way
  forward.

**Nothing else in the game may listen for Esc:**
- no gameplay "pause" binding
- no per-screen close handler
- no `UINavigation` singleton with its own copy

Redshifted had exactly that copy, masked by guards. Hard Deck survived only through
listener registration order. Input-bindings reserves Esc so it can't be remapped
onto an action.

**Pad parity:** B calls the same `back()`, and Start calls the same toggle as P.
- **A activates the focused control on its press edge,** inside the shell's
  `pad()`, where the fresh-press guard lives.
- **The pad path checks remap capture first,** exactly as the keyboard path does.
  Start cancels a capture; every other button binds. Otherwise B closes Options
  while the player is binding B.
- **Every pad button down when any screen opens is masked** until it is released.
- **Call `shell.pad()` first each frame,** before menu-navigation's D-pad handling
  and before gameplay. A press the shell consumed is never seen again that frame.

**P is input-bindings' remappable `pause` action.** `isPauseKey` reads that
binding, so binding Fire to P swaps like any other conflict. Poll the pad **every
rendered frame**, never inside the sim tick: a paused sim never ticks, so a pad
polled there can never unpause.

### 3. Auto-pause goes through one latch

```ts
requestAutoPause(reason: 'hidden' | 'blur' | 'overload' | 'lockLost' | 'padLost' | 'fullscreenExit')
```

The latch is a no-op unless the game is in play and **the sim is running**. A live
side panel (`pausesSim: false`) doesn't protect the run, so pause opens over it.
Every source calls the latch; none of them opens pause itself:

| Source | Event | Notes |
|---|---|---|
| Tab hidden | `visibilitychange` with `document.hidden` | Non-negotiable: hidden tabs stop rAF and throttle timers (MDN) |
| Window blur | `window` `blur` | UNSOURCED convention, corpus majority. Skip if focus moved into an iframe in the play view. Skip in bot and perf modes (`?bot`, `?perf`), or an operator's alt-tab stalls the measurement. |
| Clock overload | Accumulated sim debt past a threshold | Corpus value: free-horses pauses on debt over 250 ms with "The game fell behind and paused" (`game-clock.ts`). B for yours. Test: throttle the CPU 6× in DevTools; the game pauses rather than running in slow motion. Drop the debt rather than replay it. |
| Lost pointer lock | Reported by **pointer-lock** | The lock module reports; it doesn't pause |
| Lost controller | `gamepaddisconnected` while the pad was the last-used device | XR-115: the player must be able to continue, or be prompted. The pause screen says "Reconnect the controller or press a key". |
| Fullscreen exited | `fullscreenchange` while in play | In fullscreen, the browser consumes the first Esc to leave fullscreen. Chrome 154, Safari 26.5 and Firefox 150 all kept that keydown from the page (probe page, run by Bob 2026-10-12), so `fullscreenchange` is the only signal. Pausing here keeps one Esc meaning "stop". The game's own fullscreen toggle goes through `exitOwnFullscreen()`, so pressing it doesn't pause. If the exit fails, the flag clears. |

Turn-based games have nothing to protect, and live-orders sims where pause is a
toggle (volatile-state-redux) are exempt. They still want the hidden-tab catch-up
clamp.

### 4. Fresh presses only

A screen that opens while input is held must not let that input act on it.

| Input | Guard | Corpus value |
|---|---|---|
| Keyboard | Ignore `e.repeat` for every shell action. A held key only repeats, and a new press has `repeat === false`. | timberwolf: this alone fixed "it auto started a new game immediately" |
| Pad | Mask every button held at open until it is released, then accept edges. Pads have no repeat flag. | Hard Deck holds *game-over* pad restart for 400 ms (1500 ms while typing initials) |
| Mouse | A capture-phase `click` listener on each dialog drops a click whose `pointerdown` happened before `openedAt` | — |
| Held Enter / Space | The router `preventDefault()`s repeated Enter/Space keydowns while a screen is open. Enter activates a button on keydown, and preventing that keydown blocks it (verified Chrome 152). Each *repeated* Enter keydown clicks the focused button again, while a held Space clicks once on release (Playwright Chromium 156: 21 keydowns, 21 clicks; Space 1. by hand: Chrome 154 47 and 47, Safari 26.5.2 78 and 78, Firefox 150 48 and 48; Space 1 in all). Without the guard, a held Enter arms Restart, then confirms it. | — |
| Anything, on a screen meant to be read | A read-hold after `openedAt`: the same capture-phase `click` listener drops activations inside it | timberwolf: 1100 ms death hold (corpus value) |
| Esc on a pause the latch just opened | Grace after `openedAt` | logarithmic: 250 ms resume grace (corpus value). Hard Deck's 300 ms is its pointer-lock loss grace, a different guard (see **pointer-lock**). |

**This is the same guard everywhere**: the death screen, the draft picker, a
confirm, a pause opened by the latch. Native button activation goes through it too,
via the click listener. Use the shell's one `isFresh` helper and the per-dialog click
guard; don't write a bespoke timer per screen.

A Space held through a screen opening is safe. Its keyup lands on the newly focused
button, but no click fires, because Space activation needs the keydown on the same
button (verified Chrome 152).

### 5. The first gesture unlocks the platform

The title's "press any key / click to start" handler runs these **synchronously,
before any `await`**, because they need user activation:
- create or `resume()` the `AudioContext` (with Howler, `Howler.ctx.resume()`)
- request pointer lock if the game uses it, **before** any `requestFullscreen()`,
  which consumes the activation (see **pointer-lock**)

Then:
- **Re-resume on later gestures.** Keep a cheap "resume if not running" on every
  later key and pointer gesture until `ctx.state === 'running'`. Contexts suspend
  again on some platforms after backgrounding. Timberwolf and gravelight both
  retry.
- **Apply stored volumes only after the context exists.** Touching
  `Howler.volume` early creates a suspended context (timberwolf).
- **Pad-only start is allowed, but silent.** Gamepad input is not user activation,
  so audio may stay suspended. Start the run anyway and show one line: "Sound
  starts with any key or click."
  - Decide this synchronously, with `navigator.userActivation.isActive`.
  - A `resume()` without activation can stay pending forever, so waiting for
    `statechange` never shows the line.
- **Re-locking pointer lock after a resume** needs user activation, and so does the
  first lock request.
  - A click on Resume, or Enter or Space on it, counts as activation: request the
    lock inside that handler.
  - Esc, B and Start don't count. After those, show "Click to aim".
  - Chrome also refuses a lock request within 1250 ms of the player escaping one.
  - See **pointer-lock**.
- **Gamepads aren't listed until a pad gesture.** `navigator.getGamepads()` is
  empty until a button press; that's normal, not an error (W3C Gamepad).

### 6. Name verbs by what they do

- **Restart** starts a new run. If it reloads a save, call it "Load last save".
  Redshifted's Restart loads the save.
- **Quit to title** asks only when something unsaved would be lost. If the run is
  suspended and resumable, it doesn't ask, and the title shows **Continue**. That
  is gravelight's suspend-not-abandon model.

**Pause audio:** duck the master bus rather than silencing it (gravelight ducks to
70%; corpus value, `frame-loop.ts`), and **don't** duck inside Options, so levels can be judged. See
**settings-and-persistence**.

---

## Edge cases that bite

- **Two `showModal()` dialogs opened with no user activation between them** share
  one close-watcher group, so one close request can close both. This is spec-level,
  not probed. The keydown mechanism in rule 2 sidesteps it for Esc; the `close`
  resync covers the rest.
- **Esc in a focused text field** (initials entry, feedback form) still goes to the
  shell. The field blurs only if the screen closes. Logarithmic swallows Esc in a
  text field; pick one behaviour and keep it on every screen.
- **A screen opened from a key handler** must not see that same keydown on itself.
  Opening happens during dispatch, so the new screen's handlers can run on the same
  event. Gate on `openedAt`, set to the event's timestamp (rule 4).
- **Hotkeys versus focused buttons.** Never block all hotkeys whenever a button
  has focus. volatile-state-redux's `shortcutBlocked` does that, and reading the
  code says one click kills every hotkey (not reproduced).
  Let a focused control consume only the keys it uses (Enter, Space, arrows on
  sliders). See **menu-navigation**.
- **Catch-up after a hidden tab.** Clamp the accumulator, as gravelight does with
  `MAX_CATCHUP_STEPS`. Otherwise returning from a long hidden spell replays minutes
  of sim in one frame, and the auto-pause arrives too late.
- **Destructive confirm and the pad.** The second activation must come from a fresh
  A press, not the held one (rule 4). Disarm when focus moves, so a confirm doesn't
  wait armed on a button the player left.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit:** the shell's key decision is a pure function of `(stack, key, repeat,
      msSinceOpen, capturing)`, tested per branch. Mutation-check: delete the
      `repeat` guard and a test must fail. *Blind to: browser event order.*
- [ ] **Unit:** auto-pause latch. Each source calls it, it is a no-op while the sim
      is paused, it opens over a live side panel, and nothing resumes. *Blind to:
      whether the browser actually fires the event.*
- [ ] **Type "p" in the initials or feedback field:** it types, and pause doesn't
      toggle.
- [ ] **Real browser, real keys** (CDP `press_key`, not `dispatchEvent`):
      - open Pause → Options, press Esc ×2, spaced beyond the grace; the stack pops
        one level per press and play resumes. A third Esc opens pause again.
      - hold Enter on Restart; it arms once and does not confirm
      - hold a movement key through death; the death screen stays

      *Blind to: pads, and anything feel-related.*
- [ ] **Pause from every screen:** title, play, draft, death, Options-over-title.
      Esc on each does the expected single thing. *Blind to: screens that only
      appear in states the walk didn't reach.*
- [ ] **Tab away and back, then alt-tab:** the game is paused and stays paused.
      *Blind to: OS-level suspends (laptop lid), which need a manual check.*
- [ ] **Pad-only:** start, pause with Start, back with B, unpause, restart. *Blind
      to: other pad models' mappings; the check covers only the pad you own.*
- [ ] **Fresh profile, first gesture is a key:** sound plays. Then pad-only from a
      fresh profile: the "sound starts with any key" line shows. *Blind to: Safari
      and iOS context interruption, which needs that device.*

See **game-verification** for scripting these walks, and why a synthetic
`KeyboardEvent` proves nothing about default actions.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **menu-navigation** — Focus inside the top screen; this skill decides which screen is on top
- **pointer-lock** — Reports lost lock to the latch, and requests lock on the first gesture
- **game-ui-patterns** — The shell contract this skill implements

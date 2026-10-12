---
name: pointer-lock
description: "Pointer lock in a browser game: deriving whether the mouse should be captured every frame from named unlock reasons (a menu, a map, a debug pane, a player preference), requesting it from a user gesture or right after the game's own release, Chrome's 1250 ms refusal after the player escapes a lock, retrying while the click's activation is still live, reporting a lost lock to the pause latch, giving back a lock granted too late, falling back when raw input is unsupported, locking before fullscreen, virtual cursors, a fallback look mode when lock is denied, and where the reticle should read from. Use when adding mouse-look or mouse aiming, when menus open over a locked pointer, or when players report 'the mouse won't recapture after the menu', 'clicking does nothing for a second', 'I pressed Esc and the game kept running', 'the cursor is stuck in the window', or 'the reticle jitters'. game-shell owns pausing; this skill owns the lock."
---

# Pointer Lock

**Purpose:** The mouse is captured exactly when play wants it, and released for
every menu. It comes back on the next click, and a lost lock never leaves the game
running with an invisible cursor.

**Sources:**
- **W3C Pointer Lock spec, and MDN `Element.requestPointerLock()`:**
  - a request needs transient user activation
  - failure fires `pointerlockerror`
  - the user agent always offers an unlock gesture (Esc)
  - after a user exit, the next request fails even with activation; a programmatic
    `exitPointerLock()` exempts the next request
  - `unadjustedMovement` may reject with `NotSupportedError`
  - request lock *before* `requestFullscreen()`, because fullscreen consumes the
    activation
- **Chromium source:** `chrome/browser/ui/exclusive_access/pointer_lock_controller.cc`,
  `kEffectiveUserEscapeDuration = base::Milliseconds(1250)`, on main as of
  2026-10-11. Chrome refuses a lock request for 1250 ms after the player escapes
  one (posture A). Other browsers: unknown, so posture B.
- **HTML user activation:** transient activation, from a click or a non-Esc
  keydown, expires after an implementation-defined time.
  `navigator.userActivation.isActive` reports it.
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - a want derived each frame, a retry, a grace, and giving a late grant back:
    Hard Deck (after redshifted)
  - named unlock reasons and a virtual cursor: abduction-run
  - lost lock means pause, a backoff, and a fallback look mode: logarithmic
- **Corpus timings** (500 ms retry, 300 ms grace, 0.35–3 s backoff, 1.4 s fallback
  notice) are corpus values (Numbers Policy): posture A for the game that ships
  them, B for yours.

Typed sketch: `references/pointer-lock.ts`. Its state machine was tested
against a stubbed DOM covering:
- relock after a programmatic exit
- one request in flight
- asking for a click when there is no activation
- retrying while activation lasts
- the raw-input fallback only on `NotSupportedError`
- grace versus lost
- giving back a late grant

The tests were mutation-checked on the in-flight guard.

---

## The problem

| Failure | Seen in | Root cause |
|---|---|---|
| Lock never comes back after a modal | the reason this skill exists (operator brief) | A single request after closing a menu falls inside the cooldown, or has no activation, and is never retried |
| Our own release reported as a loss, so pause opens behind a closing menu | redshifted (fixed `0db70d39`) | `want` cleared *after* `exitPointerLock()` |
| Lock granted after the player opened a menu | redshifted (no give-back) | A late-resolving request is kept |
| Retry comment claims a timer that doesn't exist | abduction-run (read from code) | Lock returns only on a canvas click or a state change |
| Esc unlocks, and the sim keeps running | redshifted (no blur pause; lock loss was the only trigger) | Lock loss not wired to one pause latch |

---

## The player-facing idiom

- **Click the game to capture the mouse.** The title or the first click does it.
  While locked there is no OS cursor; a reticle or virtual cursor stands in.
- **Esc always releases.** The browser guarantees this. The game treats it as
  "stop": it pauses, and the real cursor appears over the pause menu.
- **Every menu releases the lock,** and the cursor is free to use it.
- **After a menu the game opened** (P, Start, a map key), the game released the
  lock itself. Blur doesn't count: the browser takes the lock away, so that resume
  needs a click. Resuming by any means, Esc included, recaptures
  at once.
- **After the player escaped the lock,** recapture needs a gesture:
  - Clicking Resume, or pressing Enter or Space on it, works (after Chrome's
    cooldown).
  - Resuming with Esc, B or Start can't, because those aren't user activation. The
    HUD says **"Click to aim"** until the next click.
  - That distinction comes from the Pointer Lock spec's exemption for programmatic
    exits. **Firefox 150 doesn't honour it:** a request with no activation after the
    page's own `exitPointerLock()` fails with `pointerlockerror` (probe page, Bob,
    2026-10-12). There, resuming from a key shows "Click to aim" too. **Chrome 154
    honours it:** the same request, 6 s after the release with activation expired,
    got the lock. Safari is unprobed (its run was spoiled by extra clicks).
- **If lock is unavailable or refused,** the game still plays in a fallback look
  mode and says so once.
- **Options has a "Capture mouse" toggle.** Abduction-run defaults it off in
  Firefox after several fix commits; the cause wasn't recorded.

---

## The rules

### 1. Derive `want` every frame, from named reasons

```ts
want = baseline && reasons.size === 0
// baseline: in play, the "Capture mouse" option on, input is mouse (not touch)
// reasons:  'screen' (shell.ownsInput), 'map', 'debug', 'preview', ...
```

Each owner adds and removes its own reason. Abduction-run's set includes overlay,
debugPane, worldMap, characterPreview, briefing and userPreference. Nothing calls
`requestPointerLock()` or `exitPointerLock()` directly except the lock module.
game-shell's `onStackChange` sets or clears `'screen'`.

### 2. Release first, then unlock

When `want` becomes false:
1. set `wanted = false`
2. then call `exitPointerLock()`

Then the `pointerlockchange` that follows is known to be ours and is never reported
as a loss (Hard Deck, redshifted `0db70d39`). Per the spec, a programmatic exit also
exempts the next request from the post-Esc rule, so menus the game opened can
relock instantly where the browser honours it (Chrome 154 does, Firefox 150
doesn't; rule 3).

### 3. Try once, then retry only while activation lasts

- **When `want` becomes true, request once, whatever the context.**
  - After the game's own `exitPointerLock()`, the spec exempts the next request
    from needing activation, so a menu the game opened can relock on resume with no
    click. Firefox 150 refuses that request; the try costs nothing, and its refusal
    falls through to the activation check and "Click to aim".
  - Only when that try is refused does activation matter.
  - **Firefox 150's `requestPointerLock()` returns no promise.** Failure arrives
    only as `pointerlockerror`, so listen for the event as well as the rejection
    (the sketch does both).
- **Every gesture handler that should recapture calls `onGesture()`
  synchronously:** a canvas click, a Resume click, Enter or Space on Resume. That
  call makes the request inside the activation.
- **One request in flight at a time.** A Resume click can reach the module twice in
  one dispatch: once by clearing the `'screen'` reason, once by `onGesture()`.
  Raw-input fallback follows rule 6.
- **The request can still fail.** The likely case: the click came within Chrome's
  1250 ms of the player escaping. **Retry while `navigator.userActivation.isActive`
  is true.**
  - **Measured** (Chrome 152 built-in browser, 2026-10-12, n = 1): the activation from one click
    stayed live for about 5.0 s. The retry loop ran until then, then asked for a
    click. That comfortably outlasts the 1250 ms cooldown.
  - **Not observed:** a relock succeeding after the cooldown. The test browser (an
    embedded Chromium) refuses pointer lock outright, so the checklist's "click
    Resume within 1 s" step still needs a desktop Chrome.
- **Once a request has been refused and activation has expired, stop retrying** and
  show "Click to aim". A further retry without activation can only fail.
- **Corpus alternatives:** Hard Deck and redshifted retry blindly every 500 ms.
  Logarithmic backs off from 0.35 s to 3 s. Both work because a click resets them;
  the activation check says *why* they work, and stops the pointless attempts.
- **Handle `pointerlockerror`** on its own: schedule the next retry or show the
  prompt. Hard Deck and abduction-run route it into the change handler.

### 4. Lost means pause, through the shell's latch

- **A loss** is a `pointerlockchange` to unlocked while `wanted`: Esc, focus
  leaving, or the OS taking the pointer.
- **Report it** with `shell.requestAutoPause('lockLost')` once the lock had been
  held for a grace period. A loss *inside* the grace doesn't pause, but it isn't
  ignored either: it shows "Click to aim".
  - It never auto-retries. A live activation would re-grab the mouse about 1.3 s
    after a quick, deliberate Esc.
  - Ignoring it would leave the game running with a free cursor. Corpus value: 300 ms (Hard Deck `LOCK_GRACE_MS`); B for yours. Test:
  acquire-then-immediately-lose on resume doesn't open a stray pause. If it does,
  lengthen the grace.
- **The lock module never opens pause itself.** Logarithmic's `suspended` latch has
  the same intent: a loss means pause, not a silent relock.
- **Whether the page also sees the Esc keydown** that unlocked depends on the
  browser. Safari 26.5 delivers it: the keydown arrives with the lock still held,
  then `pointerlockchange` in the same millisecond. Chrome 154 and Firefox 150 don't
  deliver it at all (probe page, run by Bob 2026-10-12). game-shell's Esc grace makes
  either ordering safe.
- **Safari also refuses an immediate relock** after the player's Esc: a request
  79 ms later was rejected with `NotAllowedError` even with activation live, and a
  click ~1.23 s later succeeded. Its refusal window between those two is
  unmeasured. Chrome's is the 1250 ms above.

### 5. Give back a late grant

A request that resolves after `want` went false (the player opened a menu
mid-request) arrives as a lock nobody wants. On a `pointerlockchange` to locked
with `!wanted`, call `exitPointerLock()` at once (Hard Deck).

### 6. Raw input, fullscreen, touch

- **Request `{ unadjustedMovement: true }` first.** It turns off OS mouse
  acceleration.
  - On `NotSupportedError`, drop it for the session.
  - On any other rejection except `NotAllowedError`, retry once without it, for that
    request only. That is Hard Deck's per-request fallback. An engine that rejects
    the option with an odd error still locks, and a transient error doesn't cost
    raw input for good.
  - Redshifted falls back only on `NotSupportedError`. Some older engines
  throw synchronously, so wrap the request in an `async` function.
- **Lock, then fullscreen,** in the same handler. Fullscreen consumes the
  activation.
- **Never lock for touch.** Check `pointerType` on the gesture (Hard Deck).

### 7. Virtual cursor and reticle

- **A virtual cursor** accumulates `movementX`/`movementY` and clamps to the
  viewport, scaled by the sensitivity setting (abduction-run `virtualCursor.ts`).
- **Clamp each event's delta.** ASSUMPTION: some platform and browser combinations
  report occasional huge spikes. IMPACT: the camera snaps. VALIDATE: log the
  largest per-event delta over a minute of play on each target OS.
- **Draw the cursor or reticle every rendered frame from the input-space cursor,**
  not from sim state. It responds at display rate.
- **World-anchored aim markers** (lead indicators, lock-on brackets) read
  **interpolated** render state; see **hud-readouts**. Reading raw sim state makes
  them step at 60 Hz on a 120 Hz screen and look jittery.
- **When unlocked in play** (the lock was denied), hide the virtual cursor and use
  the real one.

### 8. Fallback look mode

When lock is unavailable (the option is off, the request failed, or the platform
can't do it):
- play with the visible cursor
- look by cursor offset from centre, plus edge-turning
- tell the player once, after a short delay: logarithmic shows it after 1.4 s
  (corpus value, `main.ts`)

The game must remain playable.

---

## Edge cases that bite

- **Re-request inside the cooldown with no activation left.** For example, the
  player escapes, then quickly presses Enter on Resume. The first request fails;
  it is retried while activation lasts and succeeds after 1250 ms. That only works
  if the retry loop exists (rule 3).
- **Hover navigation while locked.** There's no visible pointer, so ignore
  `pointerover` while locked (menu-navigation). In practice an open screen has
  already released the lock.
- **Two lock owners.** A debug pane or devtools panel that calls `exitPointerLock`
  itself must instead add a reason, or it fights the derivation every frame.
- **Keyboard Lock API** (Chromium, fullscreen only) can capture Esc, turning the
  exit into "hold Esc" (WICG Keyboard Lock). Only use it with a visible hint;
  holding Esc still exits.
- **iframe embedding** (itch.io and similar): a sandboxed iframe needs the
  `allow-pointer-lock` sandbox token, or every request fails and the fallback mode
  is all the player gets. Check the live embed once, rather than assuming the host
  sets it.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, the want derivation:** for each reason, `want` is false while it's
      set, and returns when it clears. *Blind to: browser behaviour.*
- [ ] **Real browser, real input** (CDP, not synthetic events):
      - click to lock, press Esc: pause opens once, and the cursor is visible
      - click Resume within 1 s: lock returns once the cooldown passes, without a
        second click
      - after escaping the lock, resume with Esc: "Click to aim" shows, and a click
        relocks
      - open pause with P, then resume with Esc: the lock returns with no click
        (in Firefox 150, "Click to aim" instead)

      *Blind to: browsers other than the one tested. Run once in Firefox and
      Safari by hand.*
- [ ] **Open Options from a key during play:** the lock releases, the release isn't
      reported as a loss, and on close it relocks with no click (programmatic-exit
      exemption; Firefox 150 shows "Click to aim" instead).
- [ ] **Alt-tab while locked:** the game pauses, and the lock isn't restored on
      return until the player clicks. *Blind to: OS-specific focus behaviour.*
- [ ] **Deny lock** (option off, or an iframe without `allow-pointer-lock`): the
      fallback mode works and the notice shows once.
- [ ] **Reticle at 120 Hz or more:** it moves smoothly. A world-anchored marker
      doesn't step. *Blind to: 60 Hz screens, where stepping is invisible. Test on
      a high-refresh display.*

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-shell** — The auto-pause latch a lost lock reports to, and `onStackChange` for the `'screen'` reason
- **hud-readouts** — Interpolated render state for world-anchored aim markers
- **input-bindings** — Sensitivity, and the last-used device that decides whether lock applies

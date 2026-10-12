# game-ui-patterns — research digest

Evidence for [game-ui-patterns.md](game-ui-patterns.md), gathered 2026-10-11. Two
halves: what the Gorewood corpus does (read from source, file:line), and what
external sources say (cited). Organised by the skill each finding feeds.

**Corpus surveyed** (all `~/Projects/gorewood/<repo>`): bay-raid (Downwash, Pixi 8 +
DOM shell), timberwolf (Canvas2D + DOM), redshifted (Blueshifted, all-Pixi UI),
free-horses (three.js + DOM), gravelight (Pixi, canvas-drawn menus), royal-inbox (DOM
text game), abduction-run (R3F + DOM React), logarithmic (three.js + DOM),
volatile-state-redux (live volatile-state: Pixi + React DOM; identified from its
canonical URL, og.png and feedback wiring).

**Instrument blind spot:** the survey was read by agents, not run. Items marked
*(inf)* are inferences from reading code; none of the bugs below was reproduced in a
browser. File:line references are as of 2026-10-11 and will drift.

**Corpus-wide absences** (nothing to copy, so skills must lean on specs and say so):
gamepad remapping (no game), colourblind or text-size options (no game), UI/e2e tests
of shell flows (no game), reduced-motion applied to canvas effects (only
volatile-state-redux and logarithmic do it properly).

---

## game-shell (screens, modal stack, pause, input ownership, first gesture)

Strongest:
- **Modal stack:** bay-raid `src/view/shell.ts:19-129`. A real `stack[]`; the top
  owns input; Esc, pad B or the opener key pops one level; destructive Restart and
  Quit need a second activation (`shell.ts:158`).
- **Atomic overlay changes:** abduction-run `state/overlay.ts` and `input/eventShield.ts`.
  A capacity-1 request queue is drained once per tick, so phase and overlay change
  together.
- **Native `<dialog>` for DOM menus:** volatile-state-redux `ui/settings-dialog.tsx:19-25`.
  The browser owns the focus trap, the inert background and Esc.
- **Pause as suspend, not abandon:** gravelight `shell/menu-input.ts:206` and
  `frame-loop.ts:144` (master ducked to 70% on pause, not in Options, so levels can
  be judged).
- **Screen shape decides whether the sim pauses:** gravelight AGENTS.md:314-355. A
  side panel runs live; a full-screen or centred screen pauses.
- **Auto-pause:**
  - free-horses `play-bindings.ts:312-328` pauses on blur, visibility and clock
    overload (>250 ms debt), and says why.
  - abduction-run `systems/windowFocus.ts` and `gamePhase.ts:69-77` route every
    trigger through one `requestAutoPause` latch.
- **Fresh-press guard:**
  - timberwolf `app/src/ui/shell-keys.ts:53-89` ignores modifiers, `e.repeat` and an
    1100 ms post-death hold. It is a pure function and mutation-tested.
  - redshifted ignores a Space held at death until it is released.
  - logarithmic has a 250 ms resume grace, so the Esc that opened a menu can't
    close it.
- **Audio unlock:**
  - timberwolf `app/src/ui/sound.ts:52-61` and `audio.ts:397-415` unlock on first gesture,
    apply stored volumes only then, and resume-and-gate later.
  - gravelight `audio/music.ts:268-295` retries on Howler `playerror`.
- **Title / game over / high score:**
  - abduction-run `CrashScreen.tsx:60-77` and `highScore.ts`.
  - bay-raid `ui.ts:241-300`: initials entry, local top-10, attract mode behind the
    title.

Bugs and gaps that bit:
- **Escape handled twice:**
  - redshifted `UINavigation` plus the global pause dispatch, masked by guards
    (`game.ts:317-323`).
  - abduction-run review-mode Briefing *(inf)*.
  - bay-raid avoids it only through `defaultPrevented` and listener registration
    order (`app.ts:165`), which is fragile.
  - gravelight needed explicit topmost-first ordering (`input.ts:189-198`, commit
    923b13ec).
- **Held-key leakage across a closing pane:** timberwolf needed three fix commits
  (541c0af, 8dfd485, 168b524).
- **Pause without the standard menu:**
  - timberwolf has no Restart or Quit.
  - abduction-run has only Options.
  - volatile-state-redux has a chip toggle with no overlay.
- **Destructive actions with no confirm:** redshifted R, Q and Restart (and its
  "Restart" actually loads the save).
- **No blur auto-pause:** redshifted (pointer-lock loss only), gravelight.
- **Input polled only inside sim ticks, so the pad couldn't unpause:** bay-raid
  review #1, fixed in cd2f115 by per-frame edge polling.
- **A pad-only start can't unlock audio.** This is a platform rule, not a corpus
  bug: gamepad input is not a user-activation event. The title screen must ask for
  a key or click.
- **royal-inbox game-over** is a `div role=dialog` with no inert background and no
  focus trap. Its how-to dialog reopens on every load.

## menu-navigation (focus, keyboard, mouse, pad)

Strongest:
- **Stack with opener restore:** free-horses `play-menu.ts:8-98`. Covered panes are
  `inert`, `aria-hidden`; focus returns to the opener. It is browser-tested by
  `scripts/check-options-browser.cjs` (stack, repeat, trap, restore).
- **Tab trap and return focus:** timberwolf `app/src/ui/dom.ts:11-53`; spatial arrow
  navigation in `ui/shop-navigation.ts:10`.
- **Pad navigation:** bay-raid `shell.ts:188-204`. Per-frame pad edges and slider
  nudge.

Divergence: canvas-drawn menus (gravelight, redshifted) had to build their own focus
layer. Redshifted's settings panel never got focusables, and
`enablePauseNavigation` is dead code.

Bugs:
- **Hotkeys go dead after any HUD button click:** volatile-state-redux
  `shortcutBlocked` blocks all hotkeys while a button is focused
  (`battle-shortcuts.ts:55-57`) *(inf)*.
- **Shop focus lost every second:** logarithmic re-renders `innerHTML` at 1 Hz
  (`hud.ts:88-92`) *(inf)*.
- **Default Tab binding fights focus traversal:** free-horses `inspect` *(inf)*.
- **Focus goes to the first item of the new top, not back to the opener:** bay-raid
  `shell.ts:101-108`.

## input-bindings (action map, remap, gamepad, prompts)

Strongest:
- **Architecture:** abduction-run `bindings.ts` and `captureService.ts`.
  `KeyboardEvent.code`, a capture service, a swap-confirm banner (`ConflictBanner.tsx`),
  reserved Esc and Backquote.
- **Robust edges:**
  - logarithmic captures in the capture phase, so the bound key doesn't fire its
    action. Its duplicate-binding sanitiser resets the keymap (`core/settings.ts:93-105`).
  - timberwolf `mergeBindings` (`keys.ts:69`) merges an action added after the save
    and resolves collisions with a spare-key list.
- **Dynamic key hints that follow remaps:** abduction-run `KeyTag`, `TitleControlTips`;
  free-horses rebuilds help text from live bindings (`play-bindings.ts:60`).
- **Pad:**
  - bay-raid polls per rendered frame with edge detection.
  - redshifted `UINavigation` runs its own rAF poll.
  - No game remaps the pad. redshifted's pad bindings are a static help guide.

Divergence: conflict policy. Everyone swaps (bay-raid `settings.ts:143`, timberwolf,
redshifted with a dialog, abduction-run with a banner, logarithmic); free-horses
refuses and names the owner. Timberwolf stores `e.key` (layout-dependent); the others
store `code`.

Bugs:
- **Stale key hints after a remap:** logarithmic hard-codes them (`index.html:57`,
  `hud.ts:127`).
- **No reset-to-defaults:** timberwolf.

## settings-and-persistence (options screen, audio buses, a11y toggles, storage)

Strongest:
- **Accessibility toggles:** volatile-state-redux. Separate reduce-motion,
  reduce-flash and disable-shake, applied to canvas effects as well as CSS
  (`battle-view.ts:362-375`, `combat-effects.ts:101`).
- **Audio buses:** volatile-state-redux. Four gains, mute, 16-voice cap and per-slot
  throttle (`audio-system.ts:53-117`). bay-raid adds a UI bus and a shake slider.
- **Versioned record with migration:** redshifted
  `control-schemes/storage.ts:350-374` (`CONTROL_SETTINGS_VERSION=5`).
- **Field-by-field sanitise:** bay-raid `settings.ts:88-115`.
- **Strict validator against hand-edited imports:** logarithmic `core/save.ts`
  (`MAX_TIER` cap).
- **Cleanest small schema:** royal-inbox `engine/profile.ts:47`.

Bugs and gaps:
- **Reduced motion not reaching canvas effects:**
  - timberwolf CSS media query; canvas shake is unaffected.
  - gravelight shake ignores it.
  - free-horses particles built with the OS value only *(inf)*.
  - abduction-run has no setting at all.
- **Version only in the key name, or none:** timberwolf (six keys), abduction-run
  (four keys), volatile-state-redux.
- **A version mismatch wipes the save, no migration ladder:** bay-raid, logarithmic,
  gravelight.
- **Duplicate sources of truth:** redshifted `sfx-volume` vs
  `redshifted-audio-settings`.
- **Writing the OS reduced-motion default into storage freezes it:** free-horses
  *(inf)*; logarithmic seeds only on the first visit.
- **A shape-only version gate misses a changed unit or meaning:** gravelight
  receipts.

## pointer-lock (lock lifecycle, virtual cursor, reticle)

Strongest:
- **Want-derivation and unlock reasons:** abduction-run `input/pointerLock.ts:42-204`.
  Baseline want minus a set of named unlock reasons (overlay, debugPane, worldMap,
  briefing, userPreference); virtual cursor in `virtualCursor.ts:53-67`.
- **Retry, grace and give-back:**
  - bay-raid `pointer-lock.ts:11-83` derives `want` each frame, retries at 500 ms
    and uses a 300 ms grace.
  - It gives back a late-resolving grant and clears `wanted` before exit, so its own
    release isn't reported as loss.
  - It ports redshifted's model.
- **Lost lock means pause:** logarithmic `player.ts:33-45,421-431`.
  - A `suspended` latch pauses instead of silently relocking.
  - Relock backs off exponentially from 0.35 s to 3 s.
  - If lock is denied, it falls back to cursor-follow look plus edge turning, and
    tells the player.

Gaps:
- **No timer retry:** abduction-run's comment claims one *(inf)*.
- **`pointerlockerror` shares the `pointerlockchange` handler:** bay-raid,
  abduction-run.
- **No late-grant give-back:** redshifted.

## hud-readouts (layer choice, compass, radar, readouts, toasts)

Strongest:
- **Interpolated rendering:** volatile-state-redux `battle-runtime.ts:276-301`
  (`alpha = acc/STEP`, HUD published to React at 5 Hz). bay-raid interpolates camera
  and player (`app.ts:316-321`).
- **DOM write-on-change:** bay-raid `hud.ts:12`; logarithmic `setText` cache.
- **Compass and edge arrows:**
  - redshifted `compass-arrow-system.ts`: breadth, typed arrows, neglect pulse,
    expiry blink.
  - timberwolf `render.ts:1671-1770`: shape and colour per kind, so colour is never
    the only cue; the HUD dock is excluded from the "on screen" test (`hudInset`).
  - bay-raid `compass.ts`: compact, shortest-arc easing.
  - free-horses `combat-hud.ts:208-235`: edge-clamped DOM marker and lead reticle.
- **Threat without a widget:** gravelight `hud-rim.ts` bezel tint.
- **Toast queue:**
  - timberwolf `app/src/ui/radio-queue.ts`: now/next/chatter tiers, cut-in rules, chatter
    cap 6, tested, `aria-live` switched to assertive for alerts.
  - redshifted comm ticker with channel filters, which pauses with the game.
- **Score / combo:** abduction-run `systems/combo.ts` and `ScorePanel.tsx` (pulse
  replays need a key remount, commit c1ef2293).

Bugs:
- **Frame-rate-dependent HUD timers:**
  - bay-raid hit flash decrements by `1/60` per frame (`hud.ts:56`).
  - gravelight health-ease uses a per-frame fraction.
- **No interpolation at all:** timberwolf, gravelight, free-horses *(inf)*. This
  causes judder on 120/144 Hz.
- **No queue:** bay-raid achievement toasts are uncapped `setTimeout`s.
- **Unbounded queue:** logarithmic ticker has no cap and no dedupe.

## damage feedback (lands in game-feel)

Strongest:
- **Event-derived shake:** volatile-state-redux. The latest qualifying event wins,
  so it never stacks; it decays over ticks and is zeroed by the setting.
- **Set-not-sum shake:** logarithmic. It is capped, decays per second (`0.001^dt`),
  and under reduced motion still decays but is not applied, so toggling mid-shake
  leaves no stuck offset.
- **Capped, deterministic shake:** gravelight `combat.ts:266` uses
  `max(shake, hit|kill)` driven by the tick, so capture frames are byte-stable.
- **Trauma²:** bay-raid `camera.ts`. `MAX_TRAUMA=1`, a user scale, and a hit-stop
  rate-limited to 0.35 s.

Bugs:
- **Summed impulses beat the per-hit cap:** abduction-run `hitShake.ts:70-77`
  *(inf)*.
- **No central budget across sources:** timberwolf caps at each write site with
  `Math.min(8, …)`.
- **Shake jittered with `Math.random` in render:** timberwolf, abduction-run. It
  can't be reproduced from a seed.

## progression-legibility (curves, stacking, draft cards)

- **Draft cards:**
  - bay-raid `ui.ts:151-224`: keys 1-3, click, pad; a 400 ms pad hold-off after the
    picker opens.
  - redshifted crate modal: pointer lock released, time-freeze easing rather than a
    hard pause, Esc blocked.
  - royal-inbox: hotkeys 1-3 with a 300 ms `createInputGate` against double-submit.
- **Threat by distance:** bay-raid `threatAt` (CLAUDE.md: missions march outward;
  that is the difficulty curve).
- **Combo multiplier capped at ×3:** abduction-run.
- **Pacing envelopes tested headlessly:** logarithmic.

## game-verification

Strongest:
- **Browser smoke:** gravelight `tools/dev-smoke.mjs` (Playwright) reads
  `window.__DEV__` state and pixels; `just determinism` byte-compares frames.
- **Real-Chrome perf:**
  - free-horses `profile-production.cjs` against p95/p99/max budgets.
  - bay-raid `just perf` under `?stress`.
  - volatile-state-redux `?benchmark`/`?soak`.
- **Bot sweeps:**
  - royal-inbox `evaluate:loop --runs 1000 --compare`.
  - logarithmic pacing-envelope tests.
  - bay-raid seed determinism and autopilot.
- **UI geometry check:** timberwolf `tools/ui-check.mjs` stages state and checks
  geometry, and states its own blind spots. Its mutation checks are recorded in
  `docs/ui.md` (disabling `shellKey` made Enter resume play).
- **Determinism hashes:** volatile-state-redux shows them in the HUD.

Gap: no game has automated keyboard-only, pad-only, pointer-lock or pause-from-every-
screen tests. free-horses' Options browser check is the nearest.

---

## External sources

SOURCED means the page was read this session; *(summary)* means only a search
summary was seen. UNSOURCED means a convention with no source found.

**Xbox Accessibility Guidelines** (v3.2,
`learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/NNN`):
- **101 Text display:**
  - 26 px minimum at 1080p on console, 18 px on PC.
  - Scalable to 200%.
  - Mixed case.
- **102 Contrast:**
  - 4.5:1 standard; 3:1 for large text.
  - 7:1 in high-contrast mode.
  - Not colour alone.
- **104 Subtitles:**
  - On by default, or settable before any speech.
  - Speaker identified.
  - About 40 characters per line, 2 lines.
  - Background opacity 0–100%.
- **105 Audio:**
  - Separate volume *or* mute for music, VO, active SFX, ambient, narration and
    chat.
  - The skills offer both.
  - Mono option.
  - Audio events over 3 s are pausable.
- **107 Input:**
  - Remap everything in-game, including stick inversion and PC Esc.
  - Hints follow remaps.
  - UI fully operable with digital input and by keyboard alone.
  - Single non-simultaneous presses; sliders need no held button.
  - **Pointer activation on the up event, with cancel.**
  - Analog sensitivity ±50%.
- **112 UI navigation:**
  - Logical focus order.
  - Linear menus wrap; 2-D grids don't.
  - Persistent way back from every submenu.
  - The input that moves focus in must move it out, or a prompt says how
    ("Press [ESC] to exit remapping mode").
  - First launch offers accessibility settings.
- **116 Time limits:**
  - UI timers adjustable to 10× or off.
  - Toasts and dialogue adjustable, or dismissed on input.
- **117 Motion:**
  - Disable, pause or hide moving or blinking UI.
  - A switch for shake, bob, blur and sway (Halo Infinite has per-effect 0–100%
    sliders).
- **118 Photosensitivity:**
  - Eliminate triggers rather than warn.
  - General flash: a 10% luminance change with the darker state below 0.8, more
    than 3 per second, over roughly 20% of the screen.
  - Red flash: R/(R+G+B) ≥ 0.8.
  - Points to the Harding FPA test.
- **Title list for the D5 audit** (v3.2, from the version-history page; 113 is
  merged into 112):
  - 101 Text display
  - 102 Contrast
  - 103 Additional channels for visual and audio cues
  - 104 Subtitles and captions
  - 105 Audio accessibility
  - 106 Screen narration
  - 107 Input
  - 108 Game difficulty options
  - 109 Objective clarity
  - 110 Haptic feedback
  - 111 Audio descriptions
  - 112 UI navigation
  - 115 Error messages and destructive actions
  - 116 Time limits
  - 117 Visual distractions and motion settings
  - 118 Photosensitivity

  114 and 119+ are not confirmed. Review 1 implies 121 covers communication
  alternatives; fetch these during D5.

**Game Accessibility Guidelines** (gameaccessibilityguidelines.com/full-list):
- **Basic:**
  - Remappable controls.
  - UI reachable with the gameplay input method.
  - Start without navigating multiple menu levels.
  - Separate volume or mute for effects, speech and music.
  - **All settings saved and remembered.**
  - Avoid flicker: more than 3 flashes per second over at least 25% of the screen.
    Don't label a setting "epilepsy safe".
  - No essential information conveyed by colour alone.
  - Text prompts at the player's own pace.
- **Intermediate:**
  - Resizable and rearrangeable interfaces.
  - Essential temporary info kept within the eye-line.
  - Option to hide background movement.
- **Advanced:**
  - Avoid sudden unexpected movement.
  - Settings saved to profiles.
- No GAG item for screen shake or "pause anywhere" was found.

**Photosensitivity:**
- WCAG 2.2 SC 2.3.1 (Level A): no more than 3 general and 3 red flashes in any 1 s,
  or below threshold (0.006 sr ≈ 25% of a 10° field).
- Area figures disagree: XAG ~20%, GAG and WCAG 25%. Use the stricter.
- Ofcom: three conditions *(summary)*. ITU-R BT.1702-3: numbers not read.

**Console certification** (public Xbox requirements):
- XR-115: controller removal mid-game must let the player continue, or prompt for a
  new controller. It does not say "must pause".
- 001-02: resume after suspend without losing progress.
- XR-003: fully navigable by controller on console.
- **UNSOURCED** (NDA or none found): Start/Menu opens pause; B backs out; confirm
  and cancel placement; PlayStation and Switch pause on disconnect. XAG 112 shows
  A-select and B-back only as an example.

**Browser platform:**
- **Pointer Lock** (MDN; w3c.github.io/pointerlock):
  - The request needs transient activation; failure fires `pointerlockerror`.
  - The user agent must always offer an unlock gesture (Esc).
  - A request right after a user Esc exit fails even with activation. MDN states
    this; the mechanism is Chromium's cooldown, not spec text.
  - A programmatic `exitPointerLock()` exempts the next request.
  - `unadjustedMovement` can throw NotSupportedError; retry without it.
  - Request lock *before* `requestFullscreen()`, because fullscreen consumes the
    activation.
- **Chromium cooldown:** `kEffectiveUserEscapeDuration = base::Milliseconds(1250)`,
  not "~1 s". It lives in `chrome/browser/ui/exclusive_access/pointer_lock_controller.cc`
  (browser side). Re-fetched from googlesource main 2026-10-11. The Blink renderer
  file `third_party/blink/.../pointer_lock_controller.cc` has a different rate
  limit: 10 locks per 2 s.
  Unresolved: NW.js 0.112 notes claim removal in Chromium 149; not confirmed for
  Chrome.
- **Gamepad** (w3c.github.io/gamepad; MDN):
  - Poll `getGamepads()` each frame; entries may be null.
  - The list is empty until a pad gesture.
  - Standard mapping: buttons 0–3 face (bottom, right, left, top), 4/5 bumpers,
    6/7 triggers, 8/9 select/start, 10/11 stick clicks, 12–15 d-pad, 16 centre.
    Axes 0–3 are the two sticks.
- **Autoplay** (developer.chrome.com/blog/autoplay; MDN):
  - An AudioContext created before a gesture starts suspended; `resume()` it after
    a gesture.
  - Watch `statechange`.
  - `navigator.getAutoplayPolicy("audiocontext")` exists but is marked experimental on
    MDN; the compatibility table wasn't checked.
- **Page Visibility** (MDN):
  - `visibilitychange` fires on both transitions; check `document.visibilityState`.
  - `blur` means another window has focus, not hidden.
  - rAF stops and timers throttle in background tabs.
  - Pausing on blur is a design choice; UNSOURCED as a convention.
- **`prefers-reduced-motion`** (MDN): reduce means remove or replace *non-essential*
  motion. Large pans and scales are the triggers; fades are usually fine.
- **`inert` and `<dialog>.showModal()`** (MDN): both are Baseline, and a modal goes
  in the top layer with the rest of the page inert. The Esc `cancel` event is HTML
  spec behaviour, not verified this session.
- **`KeyboardEvent.code`** (MDN):
  - `code` is the physical position; don't derive labels from it.
  - `navigator.keyboard.getLayoutMap()` gives labels (experimental).
- **Keyboard Lock** (wicg): only in JS fullscreen; locking Esc becomes
  hold-Esc-about-2 s to exit.

**WCAG 2.5.2 Pointer Cancellation** (SOURCED,
w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html). Four options:
1. No down-event.
2. **Abort or undo**, where "completion of the function is on the up-event" and
   abort or undo exists.
3. Up reversal.
4. **Essential**, where down-event completion is essential; keyboard emulation
   counts.

Down-event completion is therefore allowed *only* when essential. Undo does not
license it. This is what D3 rests on.

**HUD theory:** Fagerholt & Lorentzon, "Beyond the HUD" (Chalmers MSc thesis, 2009,
odr.chalmers.se/handle/20.500.12380/111921).
- Two axes: diegesis (is it in the fiction) and spatiality (is it in the game space).
- Categories: non-diegetic, meta-perception, meta-representation, geometric,
  diegetic, signifiers.
- The popular four-way split is a later simplification; cite the thesis.

**Shake:** Squirrel Eiserloh, "Juicing Your Cameras With Math" (GDC 2016, video
only; slides not read). The trauma-with-decay model and the trauma² exponent come
via Bevy's example, which credits the talk. Treat the exponent as an implementation
choice.

**Exemplars** (mostly summaries):
- The Last of Us Part II: 60+ settings, hearing/vision/motor presets, every hold can
  be a toggle (Naughty Dog blog; Can I Play That).
- Celeste Assist Mode: game speed 50–100%, invincibility (Vice).
- Hades God Mode: 20% damage resistance plus 2% per death (Can I Play That).
- Forza Horizon 5 / 6 (Can I Play That reviews).
- **Input glyphs by last-used device:** UNSOURCED convention, secondary sources only.
  Don't flip glyphs on mouse movement alone.

**Not verified:** Ofcom and ITU numbers at source; PlayStation and Nintendo text; a
Valve source on glyph switching; Eiserloh slide content; Hodent on HUD and toasts.

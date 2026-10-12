---
name: game-verification
description: "The verification kit for a browser game, and what each instrument cannot see: headless sim sweeps across seeds and scenarios with an autopilot, determinism tests that diff the event log, mutation-checking a regression test, real-Chrome production perf harnesses with frame-time percentiles, and scripted UI walks (keyboard-only, pad-only, pointer-lock lose and regain, pause from every screen) driven by real CDP input and read from the app's own state. Use when deciding how to prove a change works, writing or reviewing tests for a game, adding a perf budget, testing menus and input flows, or reporting a result; and when someone says 'tests pass but it's broken', 'it works on my machine', 'the bot clears it so it's balanced', 'I can't reproduce it', or 'the test passed but I don't think it tests anything'. Every number reported comes with the instrument's blind spot."
---

# Game Verification

**Purpose:** Prove a game change with the cheapest instrument that can actually see
the failure, and say what that instrument cannot see in the same breath as its
result.

**Sources:**
- **Determinism, seeding and bot policy as instruments:**
  **simulation-first-design** (its own sources: lockstep RTS practice, self-play
  leagues). The four-stage procedure for proving a mechanic matters is
  **mechanic-ablation**'s.
- **Platform:**
  - Playwright's `page.keyboard` and `page.mouse` dispatch input through the Chrome
    DevTools Protocol (CDP), so the browser treats it as trusted, default actions
    included.
  - `element.dispatchEvent(new KeyboardEvent(…))` runs listeners and produces no
    default action: no focus move, no slider step, no button activation (DOM
    spec; the operator's driving-a-browser notes).
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - real keys, the app's own state, key repeat, editable fixtures and six
    viewports: free-horses `scripts/check-options-browser.cjs`
  - `window.__DEV__` state plus pixel reads, and frame byte-compare
    (`just determinism`): gravelight `tools/dev-smoke.mjs`
  - production perf with p95/p99/max budgets: free-horses
    `profile-production.cjs`
  - stress mode and per-seed determinism tests: Downwash `just perf`
  - staged-state geometry checks, with mutation checks recorded in `docs/ui.md`:
    timberwolf `tools/ui-check.mjs`
  - 1000-run bot comparisons against a baseline: royal-inbox `evaluate:loop`
  - pacing envelopes and an audio-source leak guard: logarithmic
  - state hashes in the HUD, and `?benchmark`/`?soak`: volatile-state-redux
- **The tags** (verified, felt, assumed) follow the plugin's design-verification
  practice.

The sketch `references/ui-walk.mjs` is a Playwright walk of the game-shell flows.
- **Run** 2026-10-12 against the game-shell reference sketch in headless Chromium:
  seven steps green.
- **Mutation-checked:** with the shell's repeat guard disabled, the walk fails at
  the "repeated Esc" assertion. That also confirms that two `keyboard.down` calls
  deliver a real key repeat.

---

## The instrument table

Pick by the failure you need to see. Report by the column on the right.

| Instrument | Sees | Cannot see |
|---|---|---|
| **Unit test of a pure function** (Esc decision, rebind, stacking, toast queue) | Logic branches, edge values | Event order, timing, the DOM, the browser |
| **Mutation check** (break the code, and the test must fail at the expected line) | Whether a test tests what it claims | Whether the test covers the *right* behaviour |
| **Determinism test** (same seed twice, diff the full event log) | Hidden nondeterminism: `Math.random`, wall clock, unordered iteration | Determinism across machines, unless run on them; float drift between engines |
| **Headless sim sweep** (seeds × scenarios × autopilot) | Balance envelopes, clear rates, pacing curves at scale | Everything a bot can't feel: legibility, satisfaction, fatigue, learning (simulation-first-design's table) |
| **Real-Chrome production perf harness** | Frame-time percentiles, GC spikes, stress at scale on *this* machine | Other GPUs, thermals, mobile, and the dev build's different code paths |
| **Scripted UI walk, real CDP input** | Focus, default actions, Esc order, key repeat, persistence across reload | Pads (unless shimmed), pointer lock (often refused under automation), screen readers, feel |
| **Synthetic `dispatchEvent`** | That a listener is wired | **Default actions.** A test that "presses" a key this way and asserts the slider moved proves nothing |
| **Pixel or screenshot compare** | Layout regressions, clipping, a missing element | Whether it's readable, and anything below the diff threshold |
| **Manual walk on real hardware** | Real pads, real pointer lock, real OS focus, high-refresh judder | Repeatability; record what you did |
| **A person playing** | Feel, comprehension, fun | Anything they don't mention; see **playtest-design** |

**Rule: a result is the number plus the right-hand column.** "Clear rate 24/24" is
not a result. "Clear rate 24/24, from a bot that never retreats" is. "UI walk green"
is not a result. "UI walk green on keyboard in Chromium; pads and pointer lock not
exercised" is.

---

## The rules

### 1. Read the app's own output, not a re-implementation

The walk asserts on state the game itself exposes:
- free-horses' `freeHorsesPerformance.play.ui.menu.screen`
- gravelight's `window.__DEV__`
- volatile-state-redux's state hash
- `document.activeElement`, and `localStorage` after a reload

A probe that recomputes the answer shares the bug it is meant to catch. Expose a
dev-only handle (`?dev=1`), strip it from production, and check it's stripped:
gravelight has a `dev-stripped` recipe that greps the bundle.

### 2. Real input, or say it isn't

- **Keyboard and mouse:** Playwright `page.keyboard.press`, `down`/`up` (two
  `down`s produce a key repeat), and `page.mouse`. All go through CDP and are
  trusted.
- **Gamepad:** CDP has no pad input. Shim `navigator.getGamepads` behind the dev
  flag with scripted button states, and run the shell and nav code against it.
  - *Blind to:* real hardware mappings, deadzone drift, disconnects.
  - One manual pass per pad family covers those.
- **Pointer lock:** automation and embedded browsers often refuse it. This
  plugin's own probe in an embedded Chromium got `pointerlockerror` on every
  request.
  - Unit-test the lock module's state machine against fake `pointerlockchange`
    events.
  - Do one manual desktop pass: lock, Esc, quick resume, alt-tab.
- **Blur and visibility:** `window.dispatchEvent(new Event('blur'))` is acceptable
  here, because blur has no default action to miss. It proves the latch is wired,
  not that the browser fires the event; the manual alt-tab check covers that.

### 3. The UI walks every game runs

Each one is a script, re-run before every release:

1. **Pause from every screen:** title, play, draft, death, Options-over-title,
   Options-over-pause. Esc, P and Start each do their single expected thing.
2. **Keyboard-only:** start, change a volume, remap a key, play, pause, resume,
   die, restart, quit. No mouse.
3. **Pad-only** (shimmed, then once for real): the same path.
4. **Key repeat and held keys:**
   - hold a movement key through death; the death screen stays
   - hold Enter on Restart; it arms but doesn't confirm
   - two `keyboard.down('Escape')` pop one level, not two
5. **Text fields:** type in every text field (initials, feedback). Every
   printable key types, including P and Space.
6. **Persistence:** change settings, reload, and they hold. Then corrupt the
   stored record by hand and reload: defaults per field, no crash.
7. **Viewports:** free-horses walks six, from 1440×900 down to 320×640 and
   landscape phone. No overflow, and focus is visible at each.
8. **Pointer lock:** the manual pass from rule 2.

### 4. Determinism before any sweep

A sweep over a nondeterministic sim measures noise. Before the first sweep:
- same seed, two runs, diff the **event log**, not the outcome
- then same seed on a second machine, if results will be compared across machines

Gravelight extends this to rendered frames: capture frames are byte-stable because
shake is driven by the tick, not by `Math.random`.

### 5. Every regression test is mutation-checked once

When a test is written after the fix, confirm it would have caught the bug.
1. Revert the fix, or break the line.
2. Watch the test fail *at the expected assertion*.
3. Restore.

A failure at the wrong line, a `TypeError` in setup or a timeout means the test
isn't testing what its name says. Record the mutation in the commit or a ledger;
timberwolf keeps them in `docs/ui.md`.

### 6. Perf in production, in real Chrome, as percentiles

- **Build production, serve it on a scratch port, and drive real Chrome** with a
  stress mode (Downwash `?stress`, volatile-state-redux `?soak`).
- **Report p50, p95, p99 and max frame time,** plus long tasks and GC pauses, over
  a fixed duration. A mean hides the hitch the player feels.
- **Budget the percentiles** (free-horses checks p95, p99 and max against a written
  budget) and fail the run on a breach.
  - *Starting budget:* p99 within one frame at the target refresh (16.7 ms at
    60 Hz), posture B. Test: does a player notice hitches at that budget on the
    lowest target machine? If they do, tighten it to p99.9; if no one can see a
    breach, it's fine to loosen p99.
- **Name the machine** in the report. The harness can't see any other.

### 7. Tag every claim

- **Verified:** an artifact exists (test, log, capture), with a stated way it could
  have failed.
- **Felt:** a person played it and reported a reaction: who, and when. See
  **moment-capture**.
- **Assumed:** reasoning only, and labelled as such.

"Done" for a feel goal needs *felt*. A green suite is *verified* about what it
tests and *assumed* about everything else.

---

## Edge cases that bite

- **A walk that passes because the step never ran.** Assert that the screen you
  expect is on top *before* pressing the key that tests it.
- **Timing-sensitive guards** (Esc grace, read-holds). Space the presses beyond the
  guard with `page.waitForTimeout`, or the walk tests the guard instead of the
  flow. Then add one step that deliberately presses *inside* it.
- **Headless WebGL.** Free-horses launches Chromium with `--use-angle=metal` on
  macOS and SwiftShader elsewhere. A software renderer changes perf completely, so
  never take perf numbers from it.
- **Dev handles in production.** The walk's state handle must not ship. Grep the
  production bundle for it.
- **Flaky waits.** Wait on the app's state (`waitForFunction(() => …ready)`), never
  on a fixed sleep, except where the sleep *is* the test (rule 3, guards).

---

## Verification checklist

- [ ] Every pure decision function the game's skills name has a unit test, and one
      mutation check on record.
- [ ] Determinism: two runs, same seed, same event log.
- [ ] The UI walks in rule 3 exist as scripts and pass, with each run's blind spots
      listed in its output.
- [ ] Perf: production build, real Chrome, percentiles against a budget, machine
      named.
- [ ] One manual pass on real pads and real pointer lock, recorded.
- [ ] Every reported number has its instrument's blind spot attached.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **simulation-first-design** — Determinism and bot policy as the sim-side instrument
- **mechanic-ablation** — The procedure for proving a mechanic affects outcomes
- **playtest-design** — The instrument for everything above that only a person can see

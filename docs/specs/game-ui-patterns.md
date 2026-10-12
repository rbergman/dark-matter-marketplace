# game-ui-patterns — spec

Bead: `dark-matter-marketplace-g1l` (epic). Evidence:
[game-ui-patterns-research.md](game-ui-patterns-research.md), a corpus survey of nine
Gorewood games plus cited external sources. Revised after independent review 1
(2026-10-11); the changes are listed at the end.

**Goal:** the next Gorewood browser game builds its shell from a recipe instead of
rediscovering it. A session asked for "a pause menu" or "options with remapping"
should produce the full idiomatic behaviour on the first pass. It should also avoid
the bugs the corpus already paid for:
- Escape handled twice
- held keys leaking across a closing pane
- a pause with no menu
- reduced motion that never reaches the canvas
- a settings save that wipes on a version bump

**Non-goals:**
- A shared runtime library. These are skills with reference sketches, not a package.
  Whether a `@gorewood/shell` package earns its keep is a later question, and the
  sketches are what would answer it.
- Engine-specific code beyond "TypeScript, DOM overlay over a canvas renderer such as
  PixiJS".
- Re-teaching what existing skills hold: cognitive load (player-ux), the four
  accessibility pillars (accessibility-design), audio mix design (audio-design),
  juice (game-feel), and curve *shapes* and XP math (progression-systems).
- Multiplayer and remote leaderboards (async-and-social keeps those).

## The skill list

Grouped by **coupled system**, not one skill per pattern; see decision D1. Every
pattern skill carries the same six sections:
- the problem
- the player-facing idiom
- a reference sketch (TS, DOM over canvas)
- the edge cases that bite
- a verification checklist that names each check's blind spot
- Sources

SKILL.md stays under ~400 lines. Full TS sketches live in the skill's `references/`.

| Skill | Tier | Holds |
|---|---|---|
| **game-ui-patterns** (new, the guide) | — | Decision table: every pattern, its tier, when to use it, when not to, and which skill holds the detail. The shell contract in one screen. |
| **game-shell** (new) | Always | Modal stack and input ownership. **The single Escape/Start/B owner**, with topmost-first order and the mechanism decided in the invariants below. Pause contents, with destructive actions handled per D3. **The auto-pause latch**: one `requestAutoPause` (abduction-run model) fed by hidden, blur (D6), clock overload and lost pointer lock; never auto-resume. Gravelight's rule that screen shape decides whether the sim pauses. **Fresh-press guards**, the one owner of "a held key must not act on the screen that just opened": death screen, resume grace, draft-picker arm delay. The first gesture: audio unlock (a keyboard or pointer gesture; pad input is not user activation), gamepad exposure, optional lock. `references/run-flow.md`: boot → title/attract → play → game over → local high-score entry → restart. |
| **menu-navigation** (new) | Always | Focus and navigation for keyboard, mouse and pad. `<dialog>`/`inert`, focus trap, restore to the opener, visible focus. Wrap rules (XAG 112). Spatial navigation for grids. Hotkeys versus focused controls (the volatile-state-redux dead-hotkey trap). The cost of canvas-drawn menus. |
| **input-bindings** (new) | Always | Action map on `KeyboardEvent.code`, with layout labels. Reserved keys. Remap capture ("press a key…", Esc cancels), conflict policy (D4) and reset. Merging new actions into an old save. Gamepad polling with edge detection per *rendered* frame, standard mapping and deadzones. Prompts that follow remaps and the last-used device. Toggle/hold. |
| **settings-and-persistence** (new) | Always | Options screen layout. Audio buses with per-bus volume and mute (XAG 105). Separate motion, flash and shake toggles that reach canvas effects, not just CSS. Seeding from `prefers-reduced-motion` without freezing the OS default. One versioned settings record with a migration ladder, a field-by-field sanitise, storage-failure tolerance, and one source of truth. |
| **pointer-lock** (new) | Common | Lock derived each frame from a want minus named unlock reasons. User activation and Chrome's 1250 ms post-Esc cooldown. A retry timer with backoff. A lost lock **reports to game-shell's auto-pause latch** and does not pause by itself. Give-back of a late grant. `unadjustedMovement` fallback. Lock before fullscreen. A virtual cursor and a fallback look mode. Where the reticle reads from. |
| **hud-readouts** (new) | Common | HUD layer choice: DOM, canvas or diegetic (Fagerholt & Lorentzon). World-anchored elements read *interpolated* render state. DOM writes on change. Time-based, not per-frame, HUD timers. Objective compass and edge arrows (shape plus colour, HUD inset). Minimap/radar. Score and combo readouts. Toasts and a notification queue (tiers, cap, dedupe, XAG 116 durations, `aria-live`). |
| **progression-legibility** (new) | Common | Scope item 3, from the angle of what the player can read. **Owns what no existing skill covers:** multiplicative versus additive upgrade stacking and how to display it; multiplier caps shown as caps; threat as a readable function of distance or time; and a procedure for picking curve parameters from a felt target (feel → number → test, Numbers Policy B). What a draft card must show: the effective number, not just "+20%". **Links, not duplicates:** curve shapes and XP math (progression-systems), cost curves (game-balance), sinks and faucets (economy-design), bot sweeps (simulation-first-design). The picker's input guard is game-shell's fresh-press guard, and this skill links to it. |
| **game-verification** (new) | Cross-cutting | An instrument table: each instrument and what it cannot see. Headless sim sweeps (seeds × scenarios × autopilot), determinism tests, mutation-checking a regression test, real-Chrome perf harnesses. UI-flow walkthroughs: keyboard-only, pad-only, pointer-lock lose/regain, pause from every screen. Driving them through CDP, and why synthetic `dispatchEvent` can't test default actions. Links simulation-first-design and mechanic-ablation for the sim side. |
| **situational-ui** (new) | Situational | Radial menus, inventory grids, dialogue boxes (pacing per XAG 116, backlog), photo mode. Short sections; each says when not to build it. |

**Patterns that land in existing skills** ("if a pattern belongs in one of those, put
it there"):

| Existing skill | Gains | Keeps (unchanged) |
|---|---|---|
| **game-feel** | A "Shake and flash budgets" section: one trauma accumulator, set-not-sum or capped, decayed per second, seeded and not `Math.random`. Each effect is gated separately by the motion/flash/shake settings, and decays even while gated. Photosensitivity thresholds (WCAG 2.3.1, XAG 118; use the stricter area figure). Also the D3 scope note on act-on-press. | Juice, the perception-action cycle, timing card |
| **player-ux** | Contextual hints as an implementation pattern: shown once, faded after N uses, hidden in danger, built from live bindings (timberwolf `app/src/ui/tasks.ts`, `learned.ts`). The D3 scope note on its "act on press" control-affordance line. | Cognitive pillars, onboarding ramp, developer blindness |
| **accessibility-design** | Accessibility presets as bundles over individual toggles (TLOU2). **An audit of every XAG citation** against the version-3.2 title list; see D5. | The four pillars, tiers, colourblind design, subtitles |
| **audio-design** | Nothing. The settings skill wires up the bus model audio-design describes; the routing map links them. | Everything |
| **simulation-first-design** | Nothing. game-verification links to it for determinism and bot policy. | Everything |
| **game-design** `references/routing-map.md` | A row per new skill, a "Shell and HUD" stage line, and layer pairs (player-ux ↔ hud-readouts, accessibility-design ↔ settings-and-persistence, game-feel ↔ hud-readouts, simulation-first-design ↔ game-verification). | Its role as the single index |

## Invariants

- **Bound by the Numbers Policy.**
  - Corpus timings are posture C: bay-raid's 500 ms lock retry and 300 ms grace were
    measured *there*, not proven general.
  - Chrome's 1250 ms post-Esc cooldown is posture A. It is
    `kEffectiveUserEscapeDuration` in
    `chrome/browser/ui/exclusive_access/pointer_lock_controller.cc` (browser side, not
    Blink), on main as of 2026-10-11. It is Chrome-only; other browsers are posture B.
  - Anything else is B with a test.
- **Sources.** Every skill has a Sources block. Conventions with no source found are
  labelled UNSOURCED, not dressed up: Start opens pause, B backs out, glyphs follow
  the last device, pause on blur.
- **Escape has one owner, game-shell, and one mechanism.** This was verified in
  Chrome 152 with real key presses, 2026-10-11.
  - The shell's single **capture-phase `keydown` listener** on `window` calls
    `preventDefault()` on Esc and pops its own stack. Cancelling the keydown
    suppresses the browser's close request: no `cancel` fires, and the shell
    decides.
  - Each `<dialog>` also handles `cancel` (prevent when cancelable, route to the
    shell's back), for close requests that arrive without a keydown, such as an
    Android back button.
  - Each `<dialog>` handles `close` to resync the stack if the browser closed it
    anyway.
  - **Rejected mechanism: relying on `cancel.preventDefault()`.** A second Esc with
    no click in between fires a non-cancelable `cancel`. That is the close-watcher
    anti-abuse rule, and Esc is not user activation. The browser then closes the
    dialog behind the shell's back. Probe log: `cancel cancelable=true`, then
    `cancel cancelable=false`, `close`.
  - Nothing else handles Esc: no global keydown pause, and no per-screen Esc
    listener.
  - Pointer lock's Esc is consumed by the browser and reaches the shell as lock loss,
    through the auto-pause latch. Whether the page *also* sees that keydown is
    unverified, so the pause that the latch opens ignores Esc during a fresh-press
    grace. Safe either way.
  - Input-bindings reserves Esc from remapping.
- **Cross-references.** At most three per skill; everything else routes through the
  map. A gate counts the cross-reference bullets per skill.
- **No unearned reference implementations.** None is claimed for gamepad remapping,
  colourblind or text-size options, because nothing in the corpus does them. The
  sketches follow the W3C/MDN specs and say so.
- **Corpus citations** name the game and file but not line numbers, which drift.

## Key decisions

| # | Decision | Proposal | Status |
|---|---|---|---|
| D1 | Granularity | 9 new skills grouped by coupled system, versus ~22 (one per pattern). The worst corpus bugs live in seams: modal stack ↔ pause ↔ pointer lock for Escape, and pane close ↔ held keys. Grouping gives each seam one owner, named in the table. Run flow goes to a reference file so game-shell stays bounded. | decided-by-operator 2026-10-11 |
| D2 | Damage feedback, contextual hints, a11y presets | Extend game-feel, player-ux and accessibility-design rather than writing new skills (table above). | decided-by-operator 2026-10-11 |
| D3 | Act-on-press versus native activation (see below) | Split the rule by surface: game-world verbs act on press; DOM menu controls keep native activation; destructive menu items take a second activation. | decided-by-operator 2026-10-11 |
| D4 | Remap conflict policy | Swap, and show a notice naming the displaced action with one-step undo. Every corpus game but free-horses swaps. That fits accessibility-design's "warn but allow" better than refusing does. | decided-by-operator 2026-10-11 |
| D5 | accessibility-design XAG citations | Audit every XAG number in the skill against the v3.2 title list (added to the digest), not just the five errors first noticed. Review 1 found at least eleven wrong. Also reconcile its 28 px text figure with XAG 101 (26 px console, 18 px PC). Separate commit, inside this epic, with its own review. | decided-by-operator 2026-10-11 |
| D6 | Auto-pause default | Real-time single-player pauses on `visibilitychange` (to hidden), `blur`, clock overload (free-horses: >250 ms debt) and lost lock, all through one latch. It never auto-resumes. See below for exemptions. Blur-pause is UNSOURCED convention, chosen because it is the corpus majority. | decided-by-operator 2026-10-11 |
| D7 | Menu rendering default | DOM overlay with `<dialog>`, `inert` and native focus. Canvas-drawn menus only with a stated reason, and the skill names the cost: gravelight and redshifted each had to build a focus layer, and redshifted's settings panel never got one. | decided-by-operator 2026-10-11 |
| D8 | Skill names | The functional names above, in the house style of `player-ux` and `game-feel`. They are internal skill identifiers, not shipped product names, so the creative-naming collision check is "no clash in this plugin" (checked: none). | decided-by-operator 2026-10-11 |

**D3 in full.** The conflict is between act-on-press (game-feel Gate 3, player-ux),
XAG 107 ("pointer activation on the up event, with cancel") and WCAG 2.5.2. In
WCAG 2.5.2, abort or undo qualifies only an *up-event* completion; down-event
completion is allowed only when it is essential. The split:
- **Game-world verbs** act on press. This is WCAG 2.5.2's *Essential* case, and
  Carmack's argument for it.
- **DOM menu controls** keep native activation: `click`, and the browser's Enter and
  Space semantics. That satisfies XAG 107 and WCAG 2.5.2 unmodified, and it keeps
  D7's native focus model. Highlight on pointer-enter stays.
- **Destructive menu items with no undo** (Restart, Quit, New Run over a save) take a
  second activation, which is bay-raid's `confirming()`. This is a stated exception
  to game-feel's "confirm instead of undo" anti-pattern: the anti-pattern applies
  where undo is possible, and here it isn't.

Without this split, act-on-press in DOM menus means custom `pointerdown` handlers,
swallowed `click` events, and keyboard semantics that differ from the browser's.

**D6 exemptions:**
- Turn-based games and live-orders sims (volatile-state-redux).
- `blur` caused by focus moving into an in-page iframe (the Turnstile widget in the
  gorewood-feedback panel): check `document.activeElement` before pausing.
- Automation modes (`?bot`, perf runs), so an operator alt-tabbing doesn't stall a
  measurement.

## Acceptance criteria

CODE:
1. The ten skills in the table exist under `plugins/game-dev/skills/<name>/SKILL.md`,
   with `name` and `description` frontmatter. The description carries trigger
   phrases in the house style ("Use when…", player complaints in quotes). Each
   SKILL.md is ≤ ~400 lines, with full sketches in `references/`.
2. Each pattern skill has the six sections. Each verification checklist names, per
   check, what it cannot see.
3. Every numeric value has a posture. Every skill has a Sources block. Every
   UNSOURCED convention is labelled.
4. **Single owner per topic.** `grep -l` for each of these terms across
   `plugins/game-dev/skills/*/SKILL.md` finds the detailed treatment in exactly the
   owner named above; other hits are links only:
   - `cancel` event / Escape order
   - `requestAutoPause` / auto-pause
   - fresh-press / arm delay
   - trauma
   - `KeyboardEvent.code`
   - schema version / migration
   - `unadjustedMovement`
   - stacking
5. The cross-reference count is ≤ 3 per skill, checked by a one-line script.
6. Routing map, README dm-game table and `plugin.json` are updated (2.2.0 → 2.3.0).
7. `python3 plugins/game-dev/scripts/score-skills.py` runs clean, and every new skill
   has a nonzero sources-block score. (Its blind spot: it counts citation shapes,
   not truth.) The plugin-validator agent passes over `plugins/game-dev`.

RUNTIME (agent behaviour, because a skill is only as good as what a session
produces from it):

8. **Scenario check.** A fresh-context agent loaded with only the new skills answers
   four prompts:
   - "add a pause menu to my Pixi game"
   - "add pointer-lock aiming"
   - "add options with key remapping and audio sliders"
   - a **seam prompt**: "Esc is pressed while Options is open over Pause with
     pointer lock held; what fires, in what order?"

   The **review subagent, not the author**, grades each answer against the
   checklists, and also says what the checklists missed. Blind spot: it grades the
   plan, not running code.
9. An independent review pass over the full diff, and its findings resolved.

FELT (Bob's, and not checkable this session): the next game's shell lands in one
session without re-deriving these patterns. It is measured when that game is built.

## Verification plan

- **Gates:** `score-skills.py`, the plugin-validator agent, the AC4 grep, and the AC5
  link count. The repo has no other skill tests; `tests/` covers workflow hooks.
- **Scenario check** (AC8) after the always tier, so a structural flaw is found
  before the common tier copies it.
- **Independent review**, a fresh-context Fable subagent:
  - pass 1 done on this spec
  - one after the always tier
  - one at close over the whole diff
  - the D5 audit gets its own pass

## Slices (one bead each, in order)

1. **game-ui-patterns** guide plus routing-map rows.
2. **game-shell**, plus `references/run-flow.md`. The Escape mechanism is verified
   (see Invariants).
3. **menu-navigation**
4. **input-bindings**
5. **settings-and-persistence**

   *Checkpoint:* scenario check, then review pass 2.
6. **pointer-lock**
7. **hud-readouts**
8. **game-feel** extension (shake and flash budgets), plus the D3 scope notes in
   game-feel and player-ux.
9. **progression-legibility**
10. **game-verification**
11. **situational-ui**, plus the player-ux hints and accessibility-design presets
    extensions.
12. **accessibility-design** XAG audit (D5).
13. README, version bump, gates, final review, close.

## Revisions after review 1

- **D3 rewritten.** The first draft claimed WCAG 2.5.2 permits down-event activation
  when undo exists. It doesn't: undo qualifies only up-event completion. Checked
  against the W3C Understanding page.
- **Escape mechanism pinned** to a capture-phase `keydown` owned by game-shell.
  The `cancel`-based first version was disproved in a browser probe.
- **Auto-pause latch and fresh-press guard** each given a single owner.
- **game-shell bounded:** run flow moved to a reference file, sketches to
  `references/`.
- **progression-legibility narrowed** to what no existing skill covers; the grep for
  stacking finds no current owner.
- **AC8 gains a seam prompt** and a non-author grader.
- **D5 widened** to a full audit.
- **D6 exemptions** added.
- **Pad-only audio unlock reframed** as a platform rule, not a corpus bug.
- **Reviewer finding 2 rejected.** It said the 1250 ms cooldown no longer exists on
  main. It does, in the browser-side file the digest cited; the reviewer read the
  Blink renderer file. Rechecked 2026-10-11.

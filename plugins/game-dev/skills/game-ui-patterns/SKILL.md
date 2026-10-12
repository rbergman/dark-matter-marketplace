---
name: game-ui-patterns
description: "The decision guide for a browser game's UI shell and HUD: which patterns every shipped game needs (pause menu, options with remapping and audio sliders, modal stack, keyboard/pad/mouse navigation, versioned settings, audio unlock, title and game-over flow), which are common (pointer lock, objective compass, minimap, toasts, damage feedback, camera control, score readouts, upgrade drafts) and which are situational (diegetic HUD, radial menus, inventory, dialogue, in-play comms, hints, photo mode, presets) — and which skill holds the detail for each. Use when starting a new game's shell, adding a menu or HUD element, reviewing a game before it ships, or when a session is about to hand-roll a pause menu, an Esc handler, a settings save or a pointer-lock request from scratch. Reach for this on 'the pause menu has no restart', 'Esc closed two things', 'pointer lock never comes back', 'my settings vanished after the update', or 'reduced motion does nothing'."
---

# Game UI Patterns

**Purpose:** Stop re-deriving the shell. Every browser game needs the same dozen
screens and behaviours. Each rebuild costs a session and reintroduces a bug the last
game already fixed. This skill says what to build, at which tier, and where the
recipe lives.

**Sources:** The tiering and the shell contract are this plugin's own construction.
They come from a survey of nine Gorewood games (2026-10-11): what recurs, what
broke, and what the strongest implementation did. They are checked against:
- the Xbox Accessibility Guidelines (XAG, v3.2)
- the Game Accessibility Guidelines (GAG)
- WCAG 2.2
- the W3C and MDN platform specs

Each pattern skill cites its own sources. Several "every gamer knows this"
conventions have **no public source**: Start opens pause, B backs out, pause on
blur, and prompts follow the last-used device. Console certification text is under
NDA, and the skills label these UNSOURCED rather than borrowing authority they
don't have.

---

## The shell contract

Ten behaviours a shipped real-time browser game satisfies. Each line names its
owner, so a failure has an address.

1. **Esc, Start or P opens pause; Esc or B backs out one level; Start and P toggle
   pause from anywhere in its stack.** One owner handles all of them, never two.
   → **game-shell**
2. **Pause has Resume, Options, Restart and Quit.** Restart and Quit take a second
   activation, because neither can be undone. → **game-shell**
3. **The game pauses itself** when the tab hides, the window blurs, the clock falls
   behind, or pointer lock is lost. It never resumes itself. → **game-shell**
4. **A held key never acts on the screen that just opened.** That covers the death
   screen, the menu Esc opened, and the draft picker that appeared mid-fire.
   → **game-shell**
5. **Every menu works by keyboard alone, by pad alone, and by mouse.** Focus is
   visible, trapped in the top screen, and restored to the opener. → **menu-navigation**
6. **Every input is remappable.** The remap screen says "press a key…", handles
   conflicts, and resets. Prompts show the current binding. → **input-bindings**
7. **Audio has per-bus volume and mute**, and is unlocked by the first key or click.
   → **settings-and-persistence**, **game-shell**
8. **Motion, flash and shake have separate settings, and they reach the canvas**,
   not just the CSS. → **settings-and-persistence**, **game-feel**
9. **Settings survive an update.** That means one versioned record, migrated rather
   than wiped, and sanitised field by field. → **settings-and-persistence**
10. **A run has an ending**: game over, a local score worth beating, and restart
    without reloading. → **game-shell** (`references/run-flow.md`)

**Test:** walk the game keyboard-only, then pad-only, then pause from every screen.
Any line above that fails is a ship blocker for a real-time game. See
**game-verification** for running that walk mechanically, and what it can't see.

---

## Decision table

### Tier 1 — always (any shipped game)

| Pattern | Use when | Skip when | Skill |
|---|---|---|---|
| Pause overlay | Real-time play | Turn-based with no clock (royal-inbox); live-orders sims where pausing is a toggle, not a screen (volatile-state-redux) | **game-shell** |
| Modal stack and input ownership | More than one screen can be open | Never skip; a single-screen game still has pause over play | **game-shell** |
| Auto-pause | Real-time single-player | Turn-based; multiplayer; bot and perf runs | **game-shell** |
| Fresh-press guards | Any screen that can open while a key is held | — | **game-shell** |
| Title / game over / scores | A run can end | Idle games with prestige instead of death (logarithmic) still need a title | **game-shell** |
| Audio unlock | The game has sound | No audio | **game-shell** |
| Focus and navigation | Any menu | — | **menu-navigation** |
| Key remapping | Any keyboard input | — | **input-bindings** |
| Gamepad support | Real-time action games | Text or pointer-only games, but say so on the title | **input-bindings** |
| Options screen, audio buses, a11y toggles | Any shipped game | — | **settings-and-persistence** |
| Versioned settings persistence | Anything is saved | — | **settings-and-persistence** |

### Tier 2 — common (most action games)

| Pattern | Use when | Skip when | Skill |
|---|---|---|---|
| Pointer lock and virtual cursor | Mouse-look, or aiming that must not hit the screen edge | Click-to-move, top-down with a visible cursor, any menu-heavy game | **pointer-lock** |
| Objective compass / edge arrows | Targets can be off screen | The whole play space fits on screen | **hud-readouts** |
| Minimap / radar | Navigation over a space larger than a few screens | The compass already answers "where" | **hud-readouts** |
| Toasts and achievement popups | Events the player should know about but not stop for | The event needs a decision; use a modal | **hud-readouts** |
| Score and combo readouts | There is a score | — | **hud-readouts** |
| Damage feedback and shake budgets | The player can be hurt | — | **game-feel** |
| Follow camera, zoom, combat framing, camera options | The world is bigger than the screen | A fixed single-screen arena | **camera-control** |
| Touch controls (sticks, touch fire, rotate card) | The game should play on a phone or tablet | Desktop-only by design, said on the title | **touch-controls** |
| Upgrade / draft card picker | Mid-run choices between numbers | The choice is spatial or narrative | **progression-legibility** |

### Tier 3 — situational

| Pattern | Use when | Skip when | Skill |
|---|---|---|---|
| Diegetic vs overlay HUD | Immersion is a declared pillar, and the info is non-urgent | Info the player needs within a second | **hud-readouts** |
| Radial menu | Pad-first, a few choices picked mid-action (starting value in **situational-ui**) | Mouse-first, or more choices than fit one ring | **situational-ui** |
| Inventory grid | Items have spatial size, or the bag *is* the puzzle | A list would do | **situational-ui** |
| Dialogue box | Spoken or read lines | Ambient barks; use toasts | **situational-ui** |
| Photo mode | The game is beautiful and players share it | Prototype stage | **situational-ui** |
| Tutorials and contextual hints | Any mechanic play alone doesn't teach | — | **player-ux** |
| Hold-to-complete key cap with progress | Any verb completed by holding a key | Tap verbs | **input-bindings** |
| In-play comms (crew radio, coaching during action) | Lines must be read while the game runs, and must stay true | Fire-and-forget news (toasts) or lines the game can wait on (dialogue) | **in-play-comms** |
| Accessibility presets | The a11y settings outgrow one screen | A handful of toggles; presets add a layer for nothing | **accessibility-design** |

---

## Where the corpus disagrees, and which way to go

| Question | Follow | Why |
|---|---|---|
| Canvas-drawn or DOM menus? | **DOM overlay** with `<dialog>`, `inert` and native focus | Canvas menus need a hand-built focus layer. Two corpus games built one, and one settings panel never got it. |
| Act on press or on release? | **Split by surface**: game-world verbs on press; DOM menu buttons use native click; destructive items take a second activation | WCAG 2.5.2 and XAG 107 want menu activation on the up event; down-event completion is allowed only where it is essential. See **game-feel**, Gate 3. |
| Remap conflict: refuse or swap? | **Swap, name the displaced action, offer undo** | Most corpus games swap; refusing strands a player who wants the key. |
| Where does the settings version live? | **In the payload** (`{ version: 3, … }`), with a migration ladder | A version in the key name orphans old data instead of migrating it. |
| Pause on blur, or only when hidden? | **Both**, through one latch, except when focus went into an in-page iframe | Blur-pause is UNSOURCED convention, chosen as the corpus majority. Hidden-pause is non-negotiable: background tabs stop rAF and throttle timers (MDN, Page Visibility API). |

---

## Build order for a new game

Gall's Law applies to shells too. Grow from a slice that works.

1. **Title → play → pause (Resume only) → back.** One modal stack, one Esc owner, and
   auto-pause on hidden. Walk it keyboard-only.
2. **Options with audio buses and mute**, persisted under a versioned record.
3. **Remapping**, then gamepad in menus, then gamepad in play.
4. **Game over and restart**, then local scores.
5. **Common-tier HUD**, as the game demands it: compass, toasts, pointer lock.
6. **The a11y toggles wired into every effect that moves or flashes.** Do this as
   each effect is added, not in a pass at the end.

**Rule:** do not start step *n+1* until step *n* survives the keyboard-only walk.
A shell grown in this order never has a pause with no menu, because the pause menu
existed before anything else could open over it.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-shell** — The owner of every seam: Escape, auto-pause, fresh presses
- **player-ux** — Why the HUD must be readable before it is pretty
- **game-verification** — Walking the shell contract mechanically, and what that misses

# Run flow: title → play → game over → scores → restart

The screens a run passes through, and the rules each one owes the player. Every
transition here uses the shell's stack and its fresh-press guard (SKILL.md rules 1
and 4). This file adds what each screen must *contain*.

```
boot ──► title ──first gesture──► play ◄──resume── pause ──quit──► title
          ▲  │                     │  ▲                │
          │  └──options (stack)    │  └──draft picker  └──restart──► play
          │                        ▼
          └────────title──── game over ──restart──► play
                               │
                               └── initials entry (if a top-10 score)
```

---

## Boot

- Show something on the first paint. A blank canvas while assets load reads as
  "broken". Show a progress bar or the title art, with the input prompt disabled
  until it can act.
- Read settings before building any screen, so the title already has the player's
  volume, bindings and motion preferences. See **settings-and-persistence**.

## Title / attract

- **One prompt: "Press any key or click to start."** It shows the current binding
  for the pad, too: "Start / A".
- "Any key" excludes:
  - modifiers
  - browser shortcuts (Ctrl or Cmd combinations)
  - `e.repeat`
  - Enter or Space aimed at a focused link, which must activate the link and not
    start a run behind it (timberwolf, `shellKeyDecision`)
- That first handler is **the first gesture** (SKILL.md rule 5). It unlocks audio
  and optionally requests pointer lock, synchronously.
- **Attract mode** is optional and cheap if the game has an autopilot: Hard Deck
  flies its bot in a live world behind the title. Rules for it:
  - attract input is never routed to gameplay
  - any key exits to a real run on a fresh seed
  - attract never writes a high score
- **Continue** appears only when a resumable run exists.
- **New Run over a save** takes a second activation, and only when something
  would be lost (gravelight asks twice only then).
- **Options** stacks over the title through the same shell.
- The title must reach a usable state by keyboard alone, pad alone and mouse alone
  (XAG 107).

## Play

- The modal stack is empty, gameplay owns input, and the sim ticks.
- Draft pickers and other mid-run screens open through the shell, with
  `pausesSim` matching their shape. They use the fresh-press guard because they
  appear while the player is firing. See **progression-legibility** for what the
  card shows.

## Game over

- **The read-hold.** The screen ignores confirm until it has been readable for a
  moment. These are corpus values (Numbers Policy):
  - timberwolf holds 1100 ms (`shell-keys.ts`)
  - Hard Deck holds pad restart 400 ms, or 1500 ms while typing initials
    (`ui.ts` `padRestartReady`)

  For your game they are posture B. Test: can a first-time player say what killed
  them before the next run starts? If not, lengthen the hold.
- **The key you died holding cannot skip it.** Guard on `e.repeat` and pad buttons
  held at open.
- **Contents, in priority order:**
  1. what ended the run (cause of death, or the result)
  2. score
  3. "New best", if it is one
  4. the two or three stats that explain the score (time, peak chain or tier,
     kills)
  5. Restart (focused)
  6. Title
- **Restart without a reload.** Reset the world from the seed. Don't rebuild the
  app: a reload re-pays the asset load and loses the unlocked audio context.

## Local high scores

- **A top-10 per mode, with three-letter initials.** That is Hard Deck's choice and an
  arcade convention, UNSOURCED. If
  the game has loadouts, keep one table per loadout and say which table the player
  is in.
  - Abduction-run falls back to the global best for a loadout with no bucket.
  - So a new build is measured against the all-builds best and never sees
    "New best".
- **Initials entry is a text field inside the game-over screen:**
  - letters only
  - Enter submits
  - Esc skips; it still goes to the shell (rule 2) and means "back" here
  - pad up/down cycles letters
- **Storage:** a versioned record, like settings (`{ version, tables }`), and a
  storage failure never blocks the game-over screen. See
  **settings-and-persistence**.
- **Remote leaderboards are out of scope here.** See **async-and-social** for
  ghosts, daily seeds and the population-of-one problem. Hard Deck keeps scores
  local; redshifted removed its remote board.

## Restart and quit

- **Restart** means a new run on a new seed. "Retry seed" is a separate, labelled
  verb when seeds matter (royal-inbox's `?seed=`).
- **Quit to title** suspends a resumable run, or abandons it after a second
  activation.
- Both close every screen (`shell.closeAll()`) before the world resets. A pause
  left on the stack over a fresh run reads as a frozen game.

## Checklist

- [ ] Boot shows something on the first paint. *Blind to: slow-network timings, so
      throttle the network once.*
- [ ] Title starts on a key, on a click, and on Start. A focused link's Enter opens
      the link and doesn't start a run. *Blind to: screen readers, which need an
      AT pass.*
- [ ] Dying while holding a movement key leaves the game-over screen up.
- [ ] Restart from game over, and from pause, both land in a fresh run with no
      screen left open and sound still playing.
- [ ] A new best score is kept after a reload. Storage blocked (private mode) still
      shows the game-over screen. *Blind to: quota edge cases on mobile Safari.*

---
name: in-play-comms
description: "A voice that talks to the player during action (crew radio, a co-pilot, a coach, an operator) and must be read while the game keeps running: lines keyed to a situation and withdrawn the moment it stops being true, lessons versus moments, a reading-time floor whose clock slows while the player is busy, entry gates by priority with caps so nothing starves, a short stack of cards, teaching on the event instead of the clock, teaching overlays drawn from the rules, and a line budget measured with a scripted pilot. Use when building or reviewing in-play tutorial lines, crew chatter, mission radio or contextual coaching, and when players say 'it told me to run after the enemy was dead', 'the tip vanished before I read it', 'I was busy and missed it', 'it talked over itself', 'the story never got told', or 'I couldn't dismiss it'. For fire-and-forget toasts see hud-readouts; for player-paced dialogue the game waits on, see situational-ui."
---

# In-Play Comms

**Purpose:** Lines the game can't wait for but the player must read. While they're
on screen they stay true, and they arrive when the player has eyes free. The
pattern sits between the two neighbours:

| Pattern | The game waits? | Must be read? | Must stay true? | Skill |
|---|---|---|---|---|
| Toast | No | Mostly no | No | **hud-readouts** rule 8 |
| Dialogue box | Yes | Yes | n/a (the world is frozen) | **situational-ui** |
| **In-play comms** | No | Yes | Yes | this skill |

If a line doesn't need all three "yes"es, use the neighbour. It is less machinery.

**Sources:**
- **Corpus:** ice-pirates (2026-10-12): `src/ui/comms-queue.ts` (pure rules, tested),
  `src/app/engagement.ts`, `src/ui/comms.ts`, `src/sim/story/beats.ts`,
  `src/view/teach-view.ts`. Built after Bob's first playtest, hardened through three
  independent reviews; each rule below names the failure it fixed. Numbers marked
  *corpus value* are posture A for ice-pirates and posture B for your game (Numbers
  Policy).
- **Speak to the current facts:** Elan Ruskin, "AI-driven Dynamic Dialog through
  Fuzzy Pattern Matching" (Valve, GDC 2012). Lines are chosen by matching rules
  against the facts true now. Withdrawing a line when its facts stop holding is
  ice-pirates' extension of that idea, not a claim from the talk.
- **Reading speed:** Netflix's per-language timed-text guides set adult limits from
  12 (Korean) to 22 (Hindi) characters a second, with Slovak at 17. The 15 used here
  is inside that band; the English figure (reported as 20) wasn't confirmed at the
  primary source.
- **XAG 116** (read 2026-10-12): a tutorial window or speaker dialogue has a
  duration adjustable "up to at least ten times the length of the default limit",
  or is dismissed or advanced on input. **XAG 104:** subtitle presentation.
  ice-pirates has no reading-time setting; the sketch adds one, marked ADDED.
- **What to teach:** Andersen et al., "The Impact of Tutorials on Games of Varying
  Complexity" (CHI 2012, 45,000+ players; pp. 1, 7–8 read). Tutorials
  raised play time by up to 29% and progress by up to 75% in Foldit, the most
  complex of three games, and had a negligible effect on play in the two simpler
  ones, which the authors describe as learnable through experimentation. In one of
  them, Hello Worlds, context-sensitive tutorials even lowered the return rate
  (17.96% against 21.60% with none, Table 3). In Foldit, in-context instructions
  beat an up-front manual (play time +16%, progress +40%).
- **Hard Deck** (its teaching spec session, 2026-10-12): Bob's choices of "repeat
  until acted on" with a Replay tips option, and no dismiss input by default. These
  are design choices, not yet playtested.
- **Teach in four beats** (Hayashida) and **telegraph floors** are
  **encounter-design**'s; this skill is the voice that rides on them.

Typed sketch: `references/comms-queue.ts`, the queue rules and the engagement meter
with no DOM.

---

## The problem

| Failure | Root cause | Rule |
|---|---|---|
| "We're taking water, get clear" stays up after the enemy is dead | The line didn't know what it was about | 1 |
| The steering tip is withdrawn before anyone reads it | A lesson was keyed to its story beat, and a player who steers early ends the beat in 0 s | 2 |
| A busy player misses a line | A fixed timer, read by nobody under fire | 3 |
| Lines talk over each other, or story never arrives | No entry rule, or one with no cap | 4 |
| A new line wipes the one being read | Replace instead of stack | 5 |
| "See that glow?" with no glow on screen | Teaching on the clock instead of on the event | 6 |
| The overlay contradicts the rule it teaches | The overlay is hand-drawn art | 7 |

---

## The player-facing idiom

- **Cards at an edge, with a portrait and a name.** Newest at the bottom, full size.
  Up to two older cards above it, smaller and dimmer, finishing their time.
- **Urgent lines look urgent** (a red rule, an `assertive` announcement) and cut in.
- **Lines know when they're wrong.** A warning about a fight disappears when the
  fight ends. A control tip stays until read.
- **The voice waits for a lull** to tell story, and talks less while the player is
  busy, but it never holds a line forever.
- **The text is the source of truth.** Voice-over, if any, follows the card; captions
  follow **accessibility-design** (XAG 104).

---

## The rules

### 1. Every line carries a priority and, optionally, a situation key

```ts
interface CommsLine { speaker: string; text: string; pri: 0 | 1 | 2; key?: string }
//                                                      story coaching urgent
```

- **The sim exposes `liveKeys()`:** the situations true this tick (`engineOut`,
  `underFire`, `beat:board`). The HUD withdraws any line, queued or on screen, whose
  key isn't live.
- **A withdrawn card still gets a moment** (`MIN_SHOWN` 1.2 s, corpus value) so it
  doesn't flicker on and off when a situation is true for a few frames.
- **`liveKeys` reads sim state.** It never reads the HUD, so a replay withdraws the
  same lines.

### 2. Lessons are unkeyed; moments are keyed

- **A lesson** stays true all game: a control, how a gun telegraphs, what a colour
  means. No key; never withdrawn.
- **A moment** is about now: "hold G alongside", "she's turning". Keyed to its
  situation or beat.
- **The bug this fixed:** keying every line to its story beat. A player who pressed
  W during the intro passed the "how to steer" beat in 0 s, and the steering lesson
  was withdrawn unread.
- **Test:** for each line, ask "would this sentence be false in a minute?" Yes → key
  it. No → it's a lesson.
- **A lesson card is not a persistent hint.** It retires after its reading time
  like any card. player-ux's "learned, then gone" governs hints that stay up while
  their trigger holds. To skip a *queued* lesson the player has already shown they
  know, call `drop(text)` (ADDED in the sketch; pending lines only). **Never key a
  lesson to "not learned yet":** a key also withdraws the card on screen, which
  brings back the unread steering lesson above. ice-pirates shows the steering
  lesson even to a player who steered early. Whether one early press counts as
  learned is a design call; decide it per lesson and write it down.

### 3. Reading time is a floor, and the clock bends to the player

- **`need = clamp(1 + chars / 15, 3, 9)` s** (corpus value): a second to find the
  card, then about 15 characters a second.
- **Engagement**, 0..1, from input. ice-pirates' weights (corpus value): firing 1,
  boarding 0.9, under fire 0.8, steering 0.45, lever moved 0.4. It rises fast (rate
  5/s) and settles slowly (0.5/s), so a lull has to be a real lull.
- **The card's clock runs at `1 − 0.35 × engagement`.** A busy player gets up to
  ~1.5× the time.
- **The clock is `dt`, and `dt` is 0 while paused** (game-shell's view clock).
- **The default needs no input:** the engagement-slowed clock, frozen while
  paused and behind modal screens such as an upgrade draft (both give `dt = 0`),
  times the player's reading-time multiplier, 1–10× (XAG 116; ADDED in the sketch).
  Bob's stated preference for Hard Deck is no dismiss input at all; he found one
  "too much hassle" (felt, not playtested).
- **"Until dismissed" is an option, not the default:** XAG 116's alternative to a
  long duration, for players who want it. It needs a dismiss input. Under it:
  - while *any* card is on screen, every non-urgent line waits, even past its cap,
    so rule 4's "nothing starves" holds only for finite settings
  - each card takes its own dismiss, newest first: if an urgent line cut in over a
    lesson, the first dismiss retires the urgent card
  - keyed cards are still withdrawn when their situation ends (after `MIN_SHOWN`),
    on screen or queued, exactly as at any speed
  - `dismiss()` reports through the same `CommsChange` as `update()`, so the view
    retires the card the same way
- **Test:** a first-time player under fire reads every lesson. *Blind to:* reading
  speed in your language and audience; watch a playtest.

### 4. Entry gates by priority, each with a cap

| pri | Enters when engagement is below | Waits at most |
|---|---|---|
| 2 urgent | always | 0 |
| 1 coaching | 0.65 | 2.5 s |
| 0 story | 0.3 | 9 s |

Corpus values. Then:

- **A line that has waited past its cap jumps the queue.** Nothing starves.
- **A non-urgent line enters once the newest card has shown 60% of its time.** The
  older card stays up until its own time ends: quick readers keep pace, slow ones can
  finish.
- **Dedupe by text, never by key** (pitfall 1).

### 5. Stack, don't replace

- **At most 3 cards** (corpus value). A fourth retires the oldest.
- **Older cards:** scale 0.86, opacity 0.62, smaller portrait (corpus values). The
  newest is the obvious one.
- **A new card grows in** (animate `max-height` from 0), so the cards above are
  pushed up instead of jumping. Reduced motion turns the animation off.
- **One live region** (`aria-live="polite"`, as ice-pirates' `#hud-comms`) holds the
  cards. Urgent lines go to an `assertive` region (**hud-readouts** rule 8). The
  stack sits clear of the play-critical centre and of the toast area.

### 6. Teach on the event, not the clock

- **ice-pirates' telegraph lesson** ("See that glow? Turn across it") fires the first
  time a hostile gun actually glows near the player, while the glow is on screen.
  As line 2 of a timed beat, players had passed it in 2.8 s.
- **Prefer one event-triggered line over a scripted sequence** wherever an event
  exists: first damage, first pickup, first time the player is in a weak spot's arc.
  The event *is* the introduce step of encounter-design's four beats.
- **Never key a line to the event itself when the event is short.** A keyed card is
  withdrawn once it has had `MIN_SHOWN` and its key is gone, so a lesson about a
  0.35–0.85 s gun charge (Hard Deck) would retire unread. For an event shorter
  than `MIN_SHOWN` plus the reading time, it is still a *lesson*, so it stays
  unkeyed (rule 2). Only its priority is a choice:
  - **coaching priority:** it may arrive after the event has ended, within the
    2.5 s cap. Fine when the sentence still makes sense with the event gone ("a
    glowing gun is about to fire").
  - **urgent,** as ice-pirates' telegraph lesson is, so it shows during the event.
    This is the corpus choice. `telegraphHint` is pri 2 and carries a key, but
    `live: () => true` keeps that key in `liveKeys()` forever, so it is unkeyed in
    effect: it cuts in while the glow shows and is never withdrawn. The costs:
    urgent skips the engagement gate and the 60% overlap, a fourth card retires the
    oldest unread, and it wears the alarm styling and `assertive` announcement.
    ice-pirates gets away with it because barks are spaced 6 s apart (`barkIn`).
    Use it for one or two lessons, and space urgent lines.
- **Never key a lesson to the event or to an enclosing situation.** Either can end
  before the card is read, and the lesson is withdrawn.
- **Fire it once.** `push()` only dedupes while a line is queued or showing, so a
  trigger that pushes on every gun glow repeats the lesson all run. The caller keeps
  a per-run fired flag (ice-pirates' `st.flags`). Set it when the card appears in
  `CommsChange.admitted`, so a lesson cleared by a death before it showed fires
  again; ice-pirates sets it at push (ADDED).
- **Teach only what play won't teach.** In Andersen et al.'s study, tutorials paid
  off only in Foldit, the most complex game, and in-context help beat a manual only
  there. The authors' conclusion is that tutorials may not be justified for games
  that can be learned through experimentation. Cut
  lessons for familiar idioms (WASD, click to shoot). Keep the rules a player can't
  discover by experimenting, and say them on their event. **player-ux** decides the
  list.

### 7. Teaching overlays come from the rules

- **The beat declares the overlay** (`teach: [{ kind: 'arcs', shipId }]`); the view
  draws it from the real defs: a weapon's range and arc, the hull's weak-spot
  fraction. An overlay can't drift from the rule it teaches.
- **Draw only what the line talks about.** Shading every gun turned the screen red;
  cannon-only made "stay off her bow" visible.
- **A weak-spot overlay shows the approach angles,** not just the spot. The first fan
  pointed dead astern, straight at the towed berg the line said to avoid.
- **Overlays end with their line or beat.** With many ships, put them behind a held
  key, boldest on the target.

### 8. Lesson persistence: repeat until acted on

Hard Deck's design (Bob's choice, 2026-10-12; posture B until playtested):

- **Each lesson fires once per run on its trigger (a per-run fired flag, rule 6),
  until the player performs the action it teaches.** Then a persisted learned-flag
  (in the settings or profile record, **settings-and-persistence**) retires it for
  good.
- **A lesson with nothing to act on** (an informational rank-up) is show-once.
- **"Replay tips"** in options clears the learned flags.
- **Acting drops only a queued copy** (`drop(text)`). A card already on screen
  finishes its reading time, and the lesson is never keyed to "not learned yet"
  (rule 2).
- **Define each lesson's acted-on signal up front,** detectable from what the view
  can see (an input, a sim event), and write it beside the line. A lesson without
  one either repeats forever or is show-once by accident.

---

## Edge cases that bite

1. **Dedupe by key eats lines.** Every line of a beat shares the beat's key, so
   deduping by key drops lines 2+. Dedupe by text; keys are for withdrawal only.
2. **Line budget.** ice-pirates' opening pushed 7–8 lines into ~35 s, more than the
   reading floor carries under load. Measure each beat's duration with a scripted
   pilot *before* writing its lines. Then cut lines, move them to events (rule 6), or
   slow the beat.
3. **Story starvation.** A steady stream of coaching kept outranking the intro hook,
   which arrived after the first fight. The hook isn't ambient story: give it
   coaching priority.
4. **Two copies of one situation:** the sim's bark and a scripted line. Same text →
   deduped. Different text for one situation → pick one owner.
5. **Death, restart and quit clear the queue,** or the old run's warnings play over
   the new one.
6. **A line about a hidden thing** ("she's behind you") is only fair if the thing is
   indicated (**hud-readouts**' edge arrows) while the line is up. UNSOURCED: this
   follows from rule 1 and fair fire, and no corpus game has hit it yet.

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Unit, queue rules (DOM-free):** shared-key lines all show; exact duplicates
      don't; the reading floor holds; busy slows the clock; urgent cuts in; a stale
      line is withdrawn after `MIN_SHOWN`; a lesson isn't; story is held while busy,
      but not past its cap; never more than 3 cards. Mutation-check each. *Blind to:
      layout and whether anyone read it.*
- [ ] **End to end, the scripted opening:** run the pilot through the opening, feed
      every line event through the real queue with the sim's `liveKeys` at a fixed
      engagement (0.5), and assert every lesson line, and the hook, reaches the
      screen. This test found pitfalls 2 and 3 in ice-pirates. *Blind to: a human
      who plays differently from the pilot, and to reading speed.*
- [ ] **Withdrawal walk:** start a fight, end it with a warning on screen; the
      warning goes once it has had `MIN_SHOWN` on the reading clock. That's ~1.2 s
      idle and up to ~1.9 s just after a fight, while engagement is still settling.
- [ ] **Reading-time setting:** at 3× every card stays up 3× as long, and stays
      frozen behind pause and a draft; under "until dismissed", dismiss works on
      keyboard and pad.
- [ ] **Persistence:** each lesson lists its acted-on signal; perform it and the
      lesson stops on the next run; "Replay tips" brings it back. *Blind to: a player
      who did the thing by accident and still doesn't know it.*
- [ ] **Short events:** every lesson about an event shorter than `MIN_SHOWN` plus
      its reading time is unkeyed (urgent, or coaching if it reads fine after the
      event), and its fired flag is set on admission.
- [ ] **Screen reader:** cards are announced once each; urgent ones interrupt.
      *Blind to: a real screen-reader user's load during action.*
- [ ] **Felt:** a first-time player, mid-fight, can say what the last lesson told
      them (moment-capture). The only check that can say "done".

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **hud-readouts** — The toast queue this extends, and the live-region and edge-arrow rules it reuses
- **encounter-design** — The four-beat teaching structure and the fair-fire rule the lines ride on
- **player-ux** — Onboarding and contextual hints: what to teach, before this skill decides when to say it

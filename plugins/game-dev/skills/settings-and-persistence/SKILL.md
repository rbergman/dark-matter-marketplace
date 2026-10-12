---
name: settings-and-persistence
description: "The options screen and the save record behind it: audio buses with per-bus volume and mute, separate motion, flash and shake settings that reach every canvas effect (not just CSS), following prefers-reduced-motion without freezing it, text and HUD scale, one versioned settings record with a migration ladder, field-by-field sanitising, storage that can fail, and one source of truth. Use when building an Options screen, adding a setting, changing what a saved field means, renaming a storage key, or shipping an update that touches saved data; and when players say 'my settings reset after the update', 'reduced motion does nothing', 'the screen still shakes', 'music is too loud and there's only one slider', or 'muting lost my volume'. input-bindings owns the binding map stored here; accessibility-design owns which options must exist."
---

# Settings and Persistence

**Purpose:** Every option the player sets takes effect everywhere at once and
survives every update. The options screen is the visible half; a versioned,
sanitised, single record is the half that decides whether players trust it.

**Sources:**
- **Xbox Accessibility Guidelines:**
  - XAG 105: separate volume or mute for music, voice, effects, ambience and
    narration.
  - XAG 117: a way to disable or reduce camera shake, motion blur, bob and moving
    UI. Halo Infinite gives per-effect 0–100% sliders.
  - XAG 118: eliminate flash triggers rather than warn.
  - XAG 101: text scalable to 200%.
  - XAG 112: offer accessibility settings at first launch.
- **Game Accessibility Guidelines:**
  - "Ensure that all settings are saved/remembered" (Basic)
  - "Provide separate volume controls or mutes for effects, speech and
    background/music" (Basic)
- **MDN `prefers-reduced-motion`:** *reduce* means remove or replace non-essential
  motion. Large pans and scales trigger vestibular symptoms; fades usually don't.
- **Corpus mechanisms** (survey of nine Gorewood games, 2026-10-11):
  - separate motion/flash/shake toggles applied to canvas effects:
    volatile-state-redux
  - a migration ladder: redshifted (`CONTROL_SETTINGS_VERSION`)
  - field-by-field sanitise and de-duplicated writes: Downwash
  - a strict import validator: logarithmic
  - the lesson that a version gate checking shape alone misses a unit change:
    gravelight receipts
- **Numbers below** are posture B unless marked C.

Typed sketch: `references/settings.ts`. It covers migrate, sanitise, load/save with
failing storage, the motion resolution and the bus gains.

---

## The problem

| Failure | Seen in | Root cause |
|---|---|---|
| Reduced motion reaches CSS, not the canvas shake | timberwolf, gravelight; free-horses particles (read from code, not reproduced) | Setting read in one place; effects built once with the OS value |
| Settings wiped by an update | Downwash, logarithmic, gravelight (save) | Version mismatch resets instead of migrating |
| Six keys, versions only in key names | timberwolf, abduction-run, volatile-state-redux | No single record; a "v1" in the key orphans data rather than migrating it |
| Two sources of truth for volume | redshifted | Audio modules write their own keys beside the panel's |
| OS reduced-motion preference frozen at first save | free-horses (read from code, not reproduced), logarithmic | OS default written into storage as if the player chose it |
| Only master volume, or no mute | gravelight (3 sliders, no mute), free-horses (no mute) | Bus model not exposed |

---

## The player-facing idiom

- **Options is reachable from the title and from pause,** through game-shell's
  stack.
- **Sections:**
  - **Audio**
  - **Controls** (input-bindings)
  - **Accessibility:** near the top, never buried, and offered at first launch
    (XAG 112)
  - **Display**
  - **Gameplay**, if there are difficulty or assist options
- **Changes apply live.** There's no Apply button and nothing is lost on Esc.
  Sliders play a sample on release, so the player hears the level they set.
- **Audio:** one slider per bus with its own mute, plus master. Mute keeps the
  slider's value; unmuting restores it.
- **Accessibility:** **Reduce motion**, **Reduce flashing** and **Screen shake**
  (a 0–100% slider) are separate controls. Motion offers *System / On / Off*;
  *System* follows the OS and is the default. Add text and HUD scale where the
  game has text.
- **"Reset to defaults"** per section, undoable.
- **The player never sees their settings vanish.** Not after an update, not after a
  crash, not in a private window. That last case gets one line: "Settings won't be
  saved in this browser mode."

---

## The rules

### 1. Audio buses

- **A `GainNode` per bus** (music, sfx, ui, voice, ambience: whichever the game
  has), each feeding a master `GainNode`. With Howler, which has no buses, multiply
  each sound's volume by its bus gain when it plays, and keep `Howler.volume()` as
  master.
- **Effective gain = curve(master) × curve(bus) × (muted ? 0 : 1).** Store the
  slider value and the mute flag separately.
- **Slider-to-gain curve.** *Starting value:* `gain = (v / 100) ** 2`. Test: do
  equal slider steps sound like equal loudness steps across the range? If the top
  half seems to do nothing, steepen the curve, or switch to a dB mapping
  (−40 dB to 0).
- **Pause ducks master** (game-shell); Options doesn't, so levels are judged at
  full scale. Gravelight ducks to 70% on pause only (posture C).
- **Mix design** (what each bus is for, ducking rules, priorities) is
  **audio-design**'s. This skill only wires the controls.

### 2. Motion, flash and shake reach every effect

The settings resolve into one runtime **FX gate** that every effect reads *when it
emits and when it renders*:

```ts
interface FxGate { reduceMotion: boolean; reduceFlash: boolean; shakeScale: number }
```

- **Shake:** the camera multiplies offset by `shakeScale`. At 0 it never offsets,
  but trauma still decays: logarithmic decays while gated, so toggling mid-shake
  leaves no stuck offset. The shake model is **game-feel**'s; the scale is this
  skill's.
- **Flash:**
  - with `reduceFlash`, full-screen flashes drop to a low-alpha tint or a border
    pulse
  - effect alpha is capped (volatile-state-redux uses 0.45)
  - XAG 118's thresholds still bind with the setting *off*

  See **game-feel**.
- **Motion:** with `reduceMotion`:
  - camera kick, screen bob, parallax and FOV pulses, large UI slides and zooms
    are removed or replaced with fades
  - particles keep running at lower speed and count, because they are information
- **Build effects to read the gate live, not to capture it at construction.**
  Free-horses built its particle system with the OS value once, so the in-game
  toggle never reached it.
- **CSS joins the same gate.** Set `html[data-reduced-motion]` from the gate, and
  let one CSS rule collapse transitions. Don't rely on the `@media` query alone:
  it ignores the in-game setting.

### 3. Follow the OS without freezing it

- **Store motion as a tri-state, `'system' | 'on' | 'off'`, defaulting to
  `'system'`.** Resolve at runtime:
  `matchMedia('(prefers-reduced-motion: reduce)').matches` when set to system.
- **Listen for `change` on that media query,** so an OS toggle mid-session applies.
- **Never write the resolved OS value into storage.** Writing it turns "the player
  never chose" into "the player chose this forever". Free-horses and logarithmic
  both freeze the first visit's value.
- Flash and shake may default from the same OS signal; volatile-state-redux seeds
  all three from it. Store them as "unset" (`'system'`, or `shake: null`) until the
  player touches them; only then is the value their choice.

### 4. One record, versioned in the payload

- **One key per kind of data:** `<game>.settings`, `<game>.scores` and
  `<game>.save` are separate. A save-format bump must never wipe settings;
  logarithmic's `SAVE_VERSION` check rejects the whole record.
- **Payload:** `{ version: 3, audio: {…}, fx: {…}, input: {…}, display: {…} }`.
  The version lives *in* the payload, so old data can be migrated. A version in
  the key name only orphans it.
- **One store object owns the record.** Every system reads from it and writes
  through it. No module writes its own key (redshifted's audio modules did).

### 5. Load = parse → migrate → sanitise

1. **Parse** inside `try`. Any failure means defaults, and a note in the console.
2. **Migrate** with a ladder: `migrations[v](data)` returns version `v+1`, applied
   until current.
   - **A migration is only needed when a field's name, unit or meaning changes.**
     A field merely added or removed is handled by the sanitiser.
   - **Bump the version whenever a meaning changes, even if the shape doesn't.**
     Volume 0–1 becoming 0–100 is a migration. Gravelight's receipts record a
     unit change that slipped past a shape-only gate.
3. **Sanitise field by field** against the defaults, every time, after migrating:
   - type-check
   - clamp numbers
   - drop unknown keys
   - fall back per field, never per record

   The binding map goes through input-bindings' `mergeSaved`. Downwash and
   volatile-state-redux both do this well.
4. **A version from the future** (the player downgraded, or another tab runs a
   newer build): sanitise what you can, use it in memory, and **never write over
   it**. Tell the player once: "Settings from a newer version: changes apply for
   this session only."
   - Every merge corrupts one side. Writing your own version wipes the newer
     build's fields. Keeping the future version mislabels your old-format values,
     so the newer build skips the migrations they need. Both were found in review.
   - Not writing is the only safe option.
5. **Legacy keys from a rename:**
   1. read them once
   2. write the new record
   3. remove them only after the write succeeds

   Downwash still reads `bay-raid.*` as a fallback after its rename.

### 6. Save = write-through, cheap, failure-tolerant

- **Write when a setting changes.** Skip it if the serialised record is unchanged:
  Downwash de-duplicates writes. Debounce slider drags, or write on `change`
  rather than `input`.
- **`setItem` can throw:**
  - quota exceeded
  - storage disabled
  - some private modes

  Catch it, keep running on the in-memory store, and tell the player once.
  Logarithmic and royal-inbox swallow it silently, which is half right.
- **Another tab** can change the record. Optionally listen for the `storage`
  event and reload, or at least don't overwrite a newer version (rule 5.4).

---

## Edge cases that bite

- **The record and the live systems disagree.** Apply settings by having systems
  *read* the store, not by pushing copies into them at load. A copy is exactly the
  free-horses particle bug.
- **Unit drift in the UI.** The slider shows 0–100 and the record stores 0–1. Pick
  one representation for the record and convert only at the slider. Changing your
  mind later is a migration.
- **Defaults that change between versions** apply only to players who never set the
  field. That needs "unset" to be representable, as with the tri-state above. A
  stored default is indistinguishable from a choice.
- **Mute and the unlock.** Setting volumes before the AudioContext exists creates a
  suspended one (timberwolf). Store the values, and apply them when game-shell's
  first gesture creates the context.
- **Text scale.** Drive a single CSS custom property (`--ui-scale`) that HUD and
  menus use. Test at 200%: nothing overlaps or clips (XAG 101).

---

## Verification checklist

Each line names what the check cannot see.

- [ ] **Migration fixtures:** keep one stored JSON blob per past version in the
      tests. Each must migrate to the expected current record. Mutation-check:
      delete a migration step and its fixture must fail. *Blind to: versions that
      shipped without a fixture, so add the fixture in the same commit as the
      bump.*
- [ ] **Sanitiser:** for garbage, `null`, wrong types, out-of-range numbers and
      unknown keys, each field falls back on its own and the rest survives. *Blind
      to: semantically wrong but well-typed values.*
- [ ] **Storage throws** (stub `setItem` to throw): the game runs, and the one-line
      notice appears once. *Blind to: real quota behaviour on mobile Safari.*
- [ ] **Reduced motion, end to end, in a real browser:**
      - set Screen shake to 0
      - take a hit
      - the camera offset stays 0 (read it from the render state, not a probe that
        recomputes it)
      - flip the OS setting with Motion on *System*; it applies without a reload

      *Blind to: whether the remaining motion still causes discomfort. Ask a
      motion-sensitive player.*
- [ ] **Every effect reads the gate:** grep for effect constructors and shake writes;
      each references the FX gate. *Blind to: effects that don't match the grep.*
- [ ] **Update path:** install the previous build, change every setting, update,
      reload. Every value survives. *Blind to: the build before that, so that is
      what the fixtures are for.*

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **accessibility-design** — Which options must exist, and the tiers they ship in
- **game-feel** — The shake and flash models this gate scales
- **input-bindings** — The binding map stored here, and its merge-on-load

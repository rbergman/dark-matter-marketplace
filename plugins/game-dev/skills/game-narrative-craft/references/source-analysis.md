# Source analysis

Measurements and provenance behind **game-narrative-craft**. Two corpora,
chosen for opposite registers so that shared technique separates from house
style. Load this when a rule in the skill needs its evidence, when adapting the
bands to a different delivery format, or when adding a third corpus.

---

## Corpus A — Arkham Horror LCG: *Edge of the Earth* campaign guide

Fantasy Flight Games, 2022. 64 pages. Cosmic horror, Antarctic expedition,
second-person-party, printed and read aloud between play sessions.

**Read in full:** campaign setup, Prologue (all four nodes), Interlude I
(Restful Night), Epilogue, designer's notes.
**Structurally sampled:** Scenarios I–IV, Interludes II–III.
**Not read:** Scenario ??? (Fatal Mirage), Interludes II and III in full.

*Blind spot:* Fatal Mirage is a memory-vignette scenario and is likely a
distinct passage form. No rule in the skill is derived from it, and none
should be until it is read. If a rule here fails on vignette-style content,
that is the first place to look.

### Passage length

Measured by splitting on conditional headers (`If <Name> is alive:`) and
choice-node headers, then word-counting the prose blocks.

| unit | n | p25 | median | p75 | range |
|---|---|---|---|---|---|
| conditional vignette | 58 | 165 | **203** | 329 | 87–802 |
| choice node (Prologue 1–4) | 4 | — | ~390 | — | 350–430 |
| epilogue beat | 5 | — | ~230 | — | 180–280 |

The 802-word outlier is a multi-part vignette that would be two passages under
the skill's own compression rule.

### Techniques observed

1. **Narration assigns sensation and doubt, never conviction.** *"The knowledge
   reflected in his dark eyes chills you to your core."* / *"You're still
   unsure what to make of all this."* Never *"you decide"* or *"you believe."*
2. **Choices are first-person dialogue in quotes.** *"I'm sorry, but this seems
   too wild to be true."*
3. **Branch the frame, not the plot.** Prologue 2 (believed the warning) and
   Prologue 3 (dismissed it) share three verbatim paragraphs and produce the
   identical mechanical outcome — one frost token, same destination.
4. **Clean prose/mechanics seam.** Narrative runs to its end, then a separated
   instruction block: *"In your Campaign Log, record …. Add 1 [frost] token."*
   Neither smuggles the other.
5. **State referenced, never recapped.** *"If William Dyer is crossed out:"*
   with no reminder of who he is or how he died.
6. **Failure branches are different content.** Dead Dyer yields his sketchbook —
   an archway, five glyphs, a drawing whose lines *"disintegrate into a tangle
   of light strokes and splotches of ink"* — plus a card the live branch does
   not grant.
7. **Callbacks unexplained across hours.** Danforth's Poe recitation (*Arthur
   Gordon Pym*) appears in the Prologue, Interlude I, and the Epilogue.
8. **Human-small payoff against cosmic-large threat.** Every epilogue beat is
   domestic — two scientists arranging dinner, two men planning a vacation, a
   mechanic and a pilot arguing about a cloth — and each is conditioned on who
   survived. The player's losses are what make the surviving pairs mean
   anything.
9. **Ineffability dramatized, never asserted.** The horror is a *drawing that
   falls apart*, not "an indescribable horror."
10. **Small state schema.** The campaign log holds who is alive, a handful of
    flags, and the contents of the chaos bag. That is the entire branching
    surface.

---

## Corpus B — *Fallen London* writer guidelines

Failbetter Games, published in three parts. Arch, comic, Victorian gothic; web
storylets read in short sittings. Opposite register to Corpus A, same atom.

- [Part I](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-i) — pitching and workflow
- [Part II](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-ii) — content design
- [Part III](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-iii) — prose craft

### Stated limits

| slot | limit |
|---|---|
| root description | ≤ 30 words |
| branch description | ≤ 20 words |
| result description | ≤ 100 words |

### Stated rules

- Results describe **one action or closely-related actions and their
  consequences**; avoid strings of sequential actions.
- Branches must make clear **what the character will do**.
- Focus on **evocative images and incident**; be wary of "putting words in the
  player's mouth, thoughts in their head, or feelings in their heart."
- Favour active voice; passive "drains energy from prose" and signals a writer
  who has got distant from the text.
- Dialogue over exposition; dialogue must pass the **say-this-shit test**.
- Don't use a single-sentence paragraph solely to control pace — it "comes
  across as precious."
- Period style is **"seasoning, not an ingredient."**
- Don't assume player gender, clothing type, or skin colour.
- Named clichés to avoid: *diaphanous gowns*, *brief lives burning brightly*,
  *black as pitch*, *"it was quiet. Too quiet."*, and overuse of *"All across
  London"* as a tell for telling-not-showing.
- **Quality parsimony** — as few unique state variables as possible. Two is the
  magic minimum for content with an engaging interactive structure; excess
  qualities complicate the economy, cause bugs, and clutter the UI.
- Plan for **episodic players**: reorient via quality-linked descriptions,
  reminder branches, and `[advisory text in square brackets]`.

---

## Cross-corpus findings

### Confirmed in both — treated as craft

| finding | Corpus A | Corpus B |
|---|---|---|
| Narration must not assign the player decisions | observed throughout | stated explicitly |
| Hard per-slot length ceiling | 150–350 measured | 30/20/100 stated |
| Narrow the aperture, keep the detail | one moment per vignette | "one action or closely-related actions" |
| Reorientation is structural, not prose | campaign log | QLDs, reminder branches, bracketed text |
| Small state schema enables rich branching | campaign log holds ~3 kinds of thing | quality parsimony, two-quality minimum |
| Choices must be legible as actions | first-person dialogue | branch must state what the character does |

Six independent confirmations across a cold earnest printed campaign and an
arch comic web serial. These are the load-bearing rules in the skill.

### Divergent — treated as a dial or as style

| question | Corpus A | Corpus B | skill's treatment |
|---|---|---|---|
| May narration assign interiority? | yes — sensation and doubt | no — images and incident only | **dial**: pick "sensory" or "strict" per project |
| Passage length | 150–350 | ≤ 100 | **delivery-dependent**: pick the row, or measure |
| Period diction | heavy, sustained | "seasoning, not an ingredient" | belongs to the **register skill**, not craft |
| Tone toward the player | earnest | wry | register |

The interiority divergence is the most useful finding in this document. Both
studios forbid assigning *decisions*; they disagree on *feelings*. That is the
seam between a craft rule and a style choice, and it is why the skill states
the prohibition flatly and the permission as a dial.

---

## Not yet sampled

Candidates for a third corpus, in rough order of expected value:

- **Slay the Spire / Inscryption event text** — the extreme short end (30–60
  words). Would test whether the compression rule holds below the bands here.
- **Citizen Sleeper** — short-form, contemporary register, no period diction.
  Would separate "period style" from "literary style."
- **Darkest Dungeon narrator barks** — sub-20-word units carrying enormous
  tonal load. Would inform the register template rather than the craft skill.
- **80 Days** — branching at scale with a light touch; strong on the
  branch-the-frame technique.

Adding a corpus means re-running the cross-corpus table above. A rule that
appears in one new source and neither existing one is not yet craft.

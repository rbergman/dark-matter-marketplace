---
name: game-narrative-craft
description: "Sentence- and passage-level prose craft for short-form game narrative: choice text, interstitials, vignettes, event text, quest copy, epilogues, story bibles, and any in-game writing the player actually reads. Use when writing or reviewing narrative prose for a game, when AI-drafted game text reads flat or generic, when a passage told to be 'brief' came back as a summary instead of a scene, when narrative doesn't land because the player lacks context the writer had, or when branch content is doubling without the story feeling more responsive. Covers the compression rule, the information-state ledger, word-count bands per structural slot, choice-as-dialogue, branch-the-frame, failure-as-different-content, callback discipline, entropy seeding, perspective, and an AI-tell blacklist. Genre-neutral — pair with a register skill such as cosmic-horror-register for tone. Sits below narrative-design, which covers architecture and branch budget rather than prose."
---

# Game Narrative Craft

**Purpose:** Make short-form game prose land on a human player who has partial
context, limited attention, and no interest in your design document.

**Scope:** The passage, the paragraph, the sentence. For quest architecture,
branch budgets, and the agency spectrum, see **narrative-design**. For tone and
diction, see a register skill such as **cosmic-horror-register**.

**Sources:** Rules here are derived from two measured corpora, deliberately
chosen for opposite registers so that shared technique separates from house
style. See `references/source-analysis.md` for the measurements and the
divergences.

- *Arkham Horror LCG: Edge of the Earth* campaign guide (FFG, 2022) — cold,
  earnest, second-person-party, printed and read aloud between sessions.
- *Fallen London* writer guidelines (Failbetter Games, published) — arch,
  comic, Victorian, web storylets read in 90-second sittings.

A rule appearing in both is craft. A rule appearing in one is style, and is
marked as such.

---

## The compression rule

This is the spine. Most bad AI game prose fails here and nowhere else.

**Told to be brief, a model compresses by abstraction.** It writes the summary
of a scene instead of a short scene. The word count drops, the effect goes
to zero, and the instruction that caused it was "keep it brief."

Given a beat where the player finds a dead scholar's sketchbook, the published
text (≈200 words) does this: a physical action, a fruitless search, a
discovery, one image rendered in real detail, an emotional beat, a hook. The
AI version does this:

> You examine Dyer's sketches and find disturbing images of an archway and
> something terrible beneath it.

Same information. One sentence. Nothing happens to the reader.

**Rule: compress by scope reduction, never by abstraction. One moment, one
room, one exchange — rendered fully. Never summarize three moments.**

**Test (falsifiable):** if the passage could be a bullet in a design document
without losing anything, it is a summary, not a scene. Rewrite it by picking
the single most concrete thing in it and staying there.

Failbetter states the positive form: results should describe *one action or
closely-related actions and their consequences*, not strings of sequential
actions. Both corpora converge on the same move — narrow the aperture, keep
the detail.

### The rendered-detail floor

A scene that survives compression contains at least one thing a camera could
photograph. Not an atmosphere, not a realization — an object, a gesture, a
sound, a specific line of dialogue. If you cut the passage down and no
photographable thing survives, you cut the wrong things.

---

## Word-count bands

Both corpora impose hard limits per structural slot. The numbers differ
because the delivery differs; the *practice* of a per-slot ceiling is the
craft. Pick the row matching your delivery, or measure your own corpus.

| slot | printed / read-aloud (AHLCG, measured n=58) | web storylet (Failbetter, published) |
|---|---|---|
| choice / branch label | one line of spoken dialogue | ≤ 20 words |
| situation / root text | 350–430 words | ≤ 30 words |
| outcome / vignette | **150–350 words** (p25 165, median 203, p75 329) | ≤ 100 words |
| closing beat | 180–280 words | — |

**Working default when you have no corpus: 150–350 words for a vignette, and a
hard ceiling you write down before drafting.** The ceiling is the instrument.
Without one, "keep it tight" is a weak ask and will be complied with by
abstraction — see the compression rule.

Ranges are targets, not laws. A passage 40% over the band is a signal to look
for two moments that should be one, not an automatic cut.

---

## The information-state ledger

**The crux of AI-written game narrative.** The model holds the whole design
document; the player holds forty fragmented minutes from three days ago. Every
recap-bloat and every unearned reveal traces to that asymmetry.

Before writing any passage, fill four columns. Two minutes, in a scratch file
or in your head, but actually fill them:

| column | question |
|---|---|
| **Certain** | What has the player been shown directly and unambiguously? |
| **Seen, not understood** | What have they observed without an explanation? |
| **Told, unreliably** | What has an NPC, document, or rumor asserted? |
| **Assumed by this passage** | What does the draft require the reader to already hold? |

**Anything in column 4 that is not in columns 1–3 is the miss.** Either seed
it earlier, move it to column 3 by having someone say it, or cut the sentence
that depends on it.

### Reorientation is a structural slot, not a prose duty

Both corpora refuse to recap in prose, and both solve re-entry structurally
instead:

- AHLCG references state by name and trusts the player to hold it — *"If
  William Dyer is crossed out:"* — because the campaign log carries continuity
  as a physical artifact the player maintains.
- Failbetter builds re-entry surfaces on purpose: quality-linked descriptions,
  dedicated reminder branches, and explicit `[advisory text in square
  brackets]` for players who engage sporadically.

**Rule: never write "as you recall" or "having previously discovered." If the
player needs reorientation, give it a slot of its own — a log line, a journal
entry, a bracketed note, a reminder branch — and keep the prose clean.**

This is also what makes the reference-by-name style possible. The prose can
say "If Dyer is crossed out" with no explanation precisely because the log is
doing the remembering.

---

## Player agency in the sentence

Both corpora forbid the same thing and draw the line in different places. The
prohibition is craft; the line is a dial.

**Shared rule: never assign the player a decision, a conviction, or an opinion
in narration.** Choice is exposed as choice. "You realize you have to stop
him" is the single most common failure in AI game prose.

**The dial — how much interiority may narration assign?**

| position | permits | corpus |
|---|---|---|
| **Strict** | Nothing internal. Only images and incident. "Wary of putting words in the player's mouth, thoughts in their head, or feelings in their heart." | Failbetter |
| **Sensory** | Physical reaction and uncertainty. *"chills you to your core"*, *"You're still unsure what to make of all this."* Never conviction. | AHLCG |

Pick one per project and write it down. Strict suits games where the player
authors a character; sensory suits games with a defined protagonist or a party.
Mixing them mid-project is what makes a script feel like several people wrote
it, because it means several people did.

Failbetter's corollary, worth adopting in either position: don't assume player
gender, clothing, or skin colour.

### Choices are dialogue, not menu items

Write the option as a first-person line the character says, in quotes:

> "I believe you… but if what you say is true, should we not investigate
> these findings further?"

Not `Option A: Investigate further.` The choice becomes an act of
characterization instead of a selection. Costs nothing, changes the entire
texture.

Where the choice is an action rather than speech, Failbetter's rule applies:
the branch must make unambiguously clear what the character will *do*. A
mysterious branch label is not intrigue, it is a broken control.

---

## Branch the frame, not the plot

Divergent paths that reconverge should share their content and differ in
framing. In the AHLCG prologue, the two paths — the player believed the
warning, or dismissed it — share three verbatim-identical paragraphs, reach the
same destination, and apply the identical mechanical outcome. Only the frame
around them differs.

AI writing will not do this unprompted. It writes two genuinely divergent
branches, doubles the content debt, and buys no additional felt agency.

**Rule: when paths reconverge, write the shared middle once and vary only the
frame. Budget divergence for the moments the player will remember.**

See **narrative-design** for the architecture this serves (hub/diamond,
branch budget, reactive narrative).

### Failure branches are different content, not lesser content

The highest-value technique in either corpus, and the one AI most reliably
inverts.

When the scholar is alive, you get a conversation with him. When he is dead,
you do not get a diminished version of that conversation — you get his
sketchbook, an archway with five glyphs, and a drawing whose lines "disintegrate
into a tangle of light strokes and splotches of ink." The dead branch is
*better material* than the live branch, and it grants a card the live branch
does not.

**Rule: draft the worst outcome first.** Draft the success path first and every
other branch becomes a degradation of it — which is exactly how you get this
backwards. Start with the branch where the character died, the mission failed,
the resource ran out. Ask what that state makes *available* that success does
not.

**Test:** if every failure branch is the success branch minus something, no
failure branch has been designed.

---

## Callbacks

Plant a specific, unexplained detail; return to it hours later without
explanation; return once more at the end. In the AHLCG corpus a student's
half-remembered Poe recitation appears in the prologue, again in a mid-campaign
interlude, and again in the epilogue. It is never glossed.

**Rule: three appearances, hours apart, zero explanation.** Explaining the
callback on its second appearance destroys it. If you are worried the player
missed it, that worry is what the log line is for.

---

## The state schema is the narrative's API

Both corpora make the same structural claim from opposite directions.

- Failbetter calls it **quality parsimony**: use as few unique state variables
  as possible; two is the magic minimum for content with an engaging
  interactive structure; excess qualities complicate the economy, cause bugs,
  and clutter the UI.
- AHLCG achieves rich branching on a campaign log holding almost nothing: who
  is alive, a handful of flags, the contents of a bag.

Rich prose over a small typed state. If the state sprawls, the branching
becomes unwritable and the writer will paper over it with recap — which
reintroduces the information-state failure above.

**Rule: design the log before the prose. Write down every state variable the
narrative may branch on. If the list exceeds what you can hold in your head,
cut it before you write a word.**

---

## Entropy

Model output for creative content converges hard. Two seeding moves, both
cheap:

1. **Seed from real entropy, not imagined randomness.** "Pick something random"
   has a basin of its own. Take entropy from the environment — a commit SHA,
   `openssl rand -hex 6`, a die rolled in the analysis tool, the low bits of a
   file hash — and spend it on a constraint: which of five registers, which
   sense leads, which object is present, which branch gets drafted first.
   Never ship the seed as output.
2. **Roll the draft order.** Combined with the failure-first rule above: rolling
   which branch you write first is the difference between designed branches and
   degraded ones.

For character, faction, and place names specifically, this is a deeper problem
with its own procedure — models converge on the same names across unrelated
projects. Name the two or three candidates you would have defaulted to and rule
them out before generating, and apply the portability test: *if the name would
work equally well for a different project in a different genre, it is a mood,
not a name.*

---

## Perspective

Three questions before any passage. They take fifteen seconds and they are the
difference between a scene and a report.

1. **Whose eyes?** Not "third person limited" — *which person*, in this room,
   right now.
2. **What do they not know?** A perspective is defined by its gaps.
3. **What does the player know that they don't — or the reverse?**

Question 3 is where the content usually is. The scene of a broken man reciting
Poe to himself works because the player recognizes the quotation's weight and
he is past recognizing anything. That gap *is* the scene. Without it there is
a man muttering.

---

## AI tells

Fix these before anything else; they are what makes drafted prose read as
drafted.

**Structural**

- The summary-instead-of-scene (see the compression rule) — the big one.
- Recap of what the player already did.
- Every paragraph ending on a portentous short sentence. *And then it moved.*
- Perfectly symmetrical branch outcomes.
- Explaining the mystery, the callback, or the joke.
- Every NPC speaking in the same register.

**Sentence-level**

- Asserting the effect instead of causing it: *the weight of the moment settled
  over you*, *a chill ran down your spine*, *you can't shake the feeling that…*
- Adjective stacks doing the work of an image: *strange, unsettling, eerie*.
- Tricolon on every beat: *the cold, the dark, the silence*.
- Passive voice as a retreat. Failbetter: passive "drains energy from prose"
  and signals a writer who has got distant from the text. Treat it as a
  reminder to get back down there.
- Single-sentence paragraphs used only to control pace. Failbetter calls this
  "precious," and it is.
- Em-dashes at AI density. They are the clearest tell in published prose.

**Dialogue**

Failbetter's test, adopted verbatim because nothing else is as fast: dialogue
must **pass the say-this-shit test**. Read the line aloud. If no human would
say it in that situation, it is exposition wearing quotation marks.

---

## Story bible vs. in-game text

One source, two products, and the compression between them is a deliberate
step, not a hope.

- **The bible** may be long. It holds the state schema, the voice sheet, the
  callback plants, the frame for each branch, and everything the player will
  never read.
- **The in-game text** is the band. Draft in the bible, then compress by scope
  reduction into the band, with the word ceiling written down before you start.

Do not draft in-game text directly from the bible in one pass. That is the
step where abstraction gets in.

### The voice sheet

Three lines per speaking character, written once, kept beside the draft:

1. **What they want** in this scene, in six words.
2. **How they talk** — sentence length, formality, one verbal habit.
3. **What they never say** — the subject they route around.

Line 3 does the most work and is the one AI omits. It is also where phonetic
dialect belongs, if at all: one character rendered phonetically is
characterization, three is noise.

---

## Review checklist

Run against any drafted passage.

- [ ] Could this be a design-doc bullet without loss? → summary, not a scene.
- [ ] Is there one photographable thing in it?
- [ ] Word count inside the declared band?
- [ ] Does it assume anything not in the ledger's first three columns?
- [ ] Does narration assign the player a decision, conviction, or opinion?
- [ ] Is interiority consistent with the project's declared dial position?
- [ ] Are choices written as dialogue or as actions the player can predict?
- [ ] For reconverging paths: is shared content written once?
- [ ] Is the failure branch *different* content, or the success branch minus?
- [ ] Any callback explained on this appearance? Unexplain it.
- [ ] Any recap that belongs in a log line, journal entry, or reminder branch?
- [ ] Read all dialogue aloud — does it pass the say-this-shit test?
- [ ] Scan the AI-tell list.

---

## Cross-references

- **narrative-design** — quest architecture, branch budget, agency spectrum,
  pacing. The layer above this one.
- **cosmic-horror-register** — tone, diction, and sensory palette for cosmic
  horror. Instance one of the register template; the same six slots build
  folk-horror, noir, or comic registers.
- **experience-design** — session-level pacing and emotional arc.
- **player-ux** — where information lives on screen, which is the delivery half
  of the information-state problem.

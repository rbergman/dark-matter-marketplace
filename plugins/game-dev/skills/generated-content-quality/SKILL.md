---
name: generated-content-quality
description: "Keep large bodies of authored-at-volume content from converging: events, quests, items, barks, enemy variants, flavour text, procedural encounters, LLM-written narrative. Use when producing a content pack, when the tenth generated item feels like the third, when per-item review keeps passing everything but the corpus reads samey, when adding to an existing content set, or when deciding what the next batch should contain. Covers the saturation ledger, dimension selection, quota setting, underused-cell seeding, near-duplicate review, and why per-item quality review structurally cannot detect corpus convergence. Applies to human-authored content at volume as much as to generated content."
---

# Generated Content Quality

**Purpose:** Stop a content corpus from collapsing into three shapes wearing
forty costumes.

**Sources:** The saturation-ledger method here is generalised from a working
implementation in the *Royal Inbox* project (`docs/CONTENT_NOVELTY_LEDGER.md`),
which measures structural saturation across a 47-event corpus and sets explicit
quotas for the next pack. The underlying convergence problem is documented in
the LLM-diversity literature (mode collapse under RLHF; Kirk et al., "Understanding
the Effects of RLHF on LLM Generalisation and Diversity," 2024). No published
game-industry standard exists for this — the method below is a practice, not a
citation, and its thresholds are posture B under the Numbers Policy.

---

## The structural problem

**Per-item quality review cannot detect corpus convergence.** This is not a
diligence failure; it is a category error. Each item is reviewed against "is
this good?" — and each item *is* good. The defect exists only in the
relationship between items, which no per-item pass ever looks at.

The result is a corpus where every entry passes review and the whole reads as
one entry repeated. Players experience it as "samey" and cannot say why, because
the sameness is structural rather than superficial: the surface details all
differ.

Two forces drive it, and both are worse with generated content:

1. **The attractor.** A model asked for a fantasy petition writes a guild, a
   council, or a commission — because those are the highest-probability answers,
   and they are the highest-probability answer *every time you ask*.
2. **Context contamination.** Generating item N with items 1..N-1 in context
   makes the model *more* likely to match their shape, not less. "Make it
   different from the others" reliably produces a surface variation on the same
   structure.

**Test:** take twenty items from the corpus. Strip the proper nouns and the
surface flavour. Can you tell them apart? If not, the corpus has converged
regardless of how each one scored on its own.

---

## The saturation ledger

The method: pick the dimensions that actually vary, count the corpus along each,
and set quotas for the next batch from the counts.

### Step 1 — Choose dimensions

Between five and nine. Each must be something a reader would notice varying, and
each must be classifiable in one or two words per item without a judgement call.

The dimensions are game-specific. Some that work:

| Content type | Dimensions worth counting |
|---|---|
| **Narrative events** | Who initiates · what mechanism drives it · setting · the comic or tonal engine · the shape of the choice · what escalates · how it resolves |
| **Items / gear** | Slot · the fantasy it serves · acquisition path · the trade-off it imposes · visual family · which build it belongs to |
| **Enemies** | Archetype · what player behaviour it forces · introduction context · counter · silhouette family |
| **Quests** | Giver class · verb chain · systems touched · reward type · failure state · who is changed by it |
| **Barks / flavour** | Trigger · register · length · who speaks · whether it references state |

**The dimension that matters most is the one you did not think to count.** If
every entry in your corpus differs on all five of your dimensions and still reads
samey, you picked the wrong five. Look for the dimension along which everything
is identical — it is usually structural: the shape of the choice, or how things
resolve.

### Step 2 — Count what exists

A table, one row per item, one column per dimension. Then the saturation
snapshot, which is the actual output:

> 35 of 47 senders are named offices, councils, guilds, boards, or commissions.
> Governance, bureaucracy and labour account for 24 of 47 themes. Common choice
> triangles are accommodate/fund, regulate/tax, and reject/exploit.

That paragraph is worth more than any amount of per-item review, and it takes
twenty minutes to produce.

### Step 3 — Set quotas, not aspirations

Convert the counts into hard constraints on the *next* batch. Quotas, both
directions:

> At least eight of sixteen openings come from households, neighbours, farmers,
> cooks, healers, teachers, ferrymen, traders, or travelling workers. No more
> than four opening senders are named institutions. No more than three are
> personified nonhumans. At most one callback may use an audit, hearing, council
> or commission as its mechanism.

**Ceilings do more work than floors.** A floor ("include some domestic senders")
gets satisfied by two tokens. A ceiling ("no more than four institutions") forces
the other twelve somewhere genuinely new, and it is checkable by counting.

**Rule: every quota is a number, and someone can count it.** "More variety" is
not a quota. It is the wish the quota exists to make real.

---

## Underused-cell seeding

The strongest anti-convergence move available, and it costs nothing:

**Seed the next item from a cell of the ledger that is empty or thin.**

Not from raw entropy — raw entropy moves you somewhere random, which is often
somewhere already crowded. An underused cell moves you somewhere random *and
known-underserved*. The ledger has already done the work of identifying where
the corpus is thin; drawing from it converts a diversity problem into a lookup.

Combine with real environment entropy to pick which thin cell:

```
thin_cells = [c for c in ledger.cells if c.count <= 1]
pick       = thin_cells[int(os.urandom(1)[0]) % len(thin_cells)]
```

The seed is a starting constraint, never the output. A drawn cell still needs an
authored premise, a real choice, and a review pass — it just starts somewhere the
corpus has not been.

**Test:** after a batch generated this way, recount. If the thin cells are still
thin, the seeding did not survive contact with drafting — which usually means
the generation prompt reasserted the attractor downstream of the seed.

---

## Near-duplicate review

Separate from the ledger and still necessary. The ledger catches structural
convergence; this catches two items that are the same item.

For each new item, ask against the existing corpus:

- Is there an item with the **same premise** under different flavour?
- Is there an item whose **choice set** is functionally identical?
- Does it **resolve** the way something else already resolves?
- Would a player who saw both feel the second one was new?

The last question is the real one, and it is the only one that catches the case
where all the structural dimensions differ and the item is still a repeat.

---

## The referent ledger — the same instrument, run backwards

The saturation ledger catches **convergence**: too many items sharing a shape.
Its mirror image catches **unmanaged divergence**: too many words for one thing.

Both are corpus-level defects invisible to per-item review, and the second is
more common in games than the first — because every individual synonym is good
writing. Register rewards variety; comprehension punishes it.

### The failure

A logging game's teaching channel refers to the resource the player carries as
**wood**, **timber**, **tonnage**, **load**, **haul**, and *"the load you
logged"*. Its delivery point is **the truck** and **the landing**. Its shop is an
**outpost**, a **camp**, a **company outpost**, a **counter**, and a **site**.

Every one of those is a defensible choice in isolation, and a per-line review
passes all of them. Together they mean a player, seven seconds after the last
notice, resolving a new noun for a thing they already had a name for — while
something is chasing them.

### The ledger

One row per game noun. One column: every word the corpus uses for it, and where.

| Referent | Words used | Where | Canon |
|---|---|---|---|
| the resource carried | wood, timber, tonnage, load, haul | notices, shop, ticker | **wood** |
| the delivery point | truck, landing | notices, shop | **truck** |
| purchasing power | allowance | shop, notices | **allowance** |
| a purchasable upgrade | rank, line, shelf item | notices, shop | **rank** |
| the secondary shop | outpost, camp, counter, site | notices, shop | **outpost** |

**The rule: one canonical word per referent in any channel that teaches. The
synonyms are not deleted — they are reassigned to the flavour channel**, where
variety is the point and comprehension is not load-bearing. This is how you keep
the register without paying for it in confusion.

**Test:** build the table. Any referent with more than one word in a teaching
channel is a bug, and the count is the severity. This takes fifteen minutes on a
corpus of fifty lines and I have never run it without finding something.

### Where the line falls

Not every synonym is a defect. The question is whether the reader must *resolve*
the word to act.

- **Flavour, ambient, prose** — vary freely. A ticker line calling wood "tonnage"
  is characterisation of the company that logs it.
- **Anything the player must act on** — UI labels, tips, objectives, tutorial
  copy, error states — one word, always the same one.
- **Proper nouns are exempt but expensive.** A named thing can have one name and
  one epithet; a third is a second thing.

## Where this sits relative to per-item quality

Both are required and they catch different things. Run them in this order:

1. **Ledger + quotas** — before generating. Decides *what* the batch contains.
   Run the referent ledger here too, once, and fix the canon before drafting.
2. **Underused-cell seeding** — during. Decides where each item starts.
3. **Per-item quality review** — after. Voice, correctness, does it work.
4. **Near-duplicate review** — after. Is it actually new.
5. **Recount** — after. Did the saturation snapshot move?

Skipping step 5 is the most common failure. Without it there is no evidence the
process did anything, and the ledger silently becomes documentation of a corpus
nobody is steering.

---

## Applies to human-authored content too

Nothing here is specific to generated text. A single author writing forty events
over three months converges the same way and for a related reason — the attractor
is their own habit rather than a model's prior, and it is equally invisible from
inside. The ledger is the instrument in both cases.

The difference is rate. A human writes forty events in three months and notices
the drift somewhere around item twenty-five. A model writes forty in an afternoon,
and nobody notices until the corpus ships.

---


## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-narrative-craft** — Per-item craft for narrative content
- **playtest-design** — Turning a "samey" report into a countable finding
- **data-driven-design** — Engagement variance per item, at scale

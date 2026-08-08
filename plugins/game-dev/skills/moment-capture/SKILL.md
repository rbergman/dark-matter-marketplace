---
name: moment-capture
description: "Capture the player's felt reactions to play verbatim into an append-only docs/moments.md, at the time they happen. Use whenever someone reports an aesthetic, emotional, or semantic reaction to playing — 'feels chunky', 'that's satisfying', 'this doesn't read right', 'I stopped watching', 'attack timing is unclear'. Positive reactions matter as much as negative ones. Felt reactions decay fast and get rationalised on recall, so the verbatim record beats a reconstruction. Not for bug reports, feature requests, or performance complaints — those belong in the tracker. For designing a structured session around these reactions use playtest-design."
---

# moment-capture

**Fires when** Bob reports a felt reaction to play. Anything aesthetic, emotional, or semantic: "feels chunky", "not easy to time attacks", "there's going to be fighting to achieve a world without fighting?", "that's satisfying", "the swing follows the wrong thing", "this doesn't read right".

**Does not fire on** bug reports, feature requests, or performance complaints. Those go to the tracker.

**Sources:** No external source. The practice rests on one well-supported
observation: felt reactions decay fast and get rationalised on recall, so a
verbatim record made at the time beats a reconstructed one later. Related to the
"observe, don't ask" discipline in **playtest-design**, which draws on Celia
Hodent, *The Gamer's Brain* (2017).

---

## Why

Across four projects, every agent independently reported the same two things: Bob's felt reactions are the one signal no instrument can produce, and he catches them in seconds where the apparatus is blind entirely. Every project acted on those reactions and then discarded them. They survive only as chat scrollback.

Second finding: all four projects retained felt reactions only as defect lists. **Positive reactions were captured nowhere.** The moments a game is actually for have no record in any repo.

## Procedure

1. **Capture verbatim.** Exact phrasing, in quotes, unedited. Do not paraphrase, tidy, or convert to a requirement. His wording is the data -- "feels chunky" and "attack timing is unclear" are different observations and only one of them is his.
2. **Do not interrupt.** Capture happens alongside the normal response. Do not announce it, do not ask permission, do not ask follow-up questions you would not otherwise have asked. If capture adds friction, it will stop happening.
3. **Record valence.** Positive, negative, or ambivalent. Positive entries are the more valuable half and the easier half to skip.
4. **Record context.** Build state, what he was doing, what changed since he last played.
5. **Record the mechanical cause, or record that you don't know.** If unknown at capture time, write `unknown` and return to fill it in when it is found. **Never guess.** A journal of confident wrong diagnoses is worse than an empty one.
6. **Append only.** Never edit a prior entry except to resolve a `cause: unknown`.

## Artifact

`docs/moments.md` in the project repo. Append-only, newest last.

```
## 2026-07-30 -- after poise retune, M2 build
**Verbatim:** "feels chunky, not easy to time attacks"
**Valence:** negative
**Cause:** unknown at capture. Resolved 2026-07-30: no target indicator and no
enemy health bars, so there was no anticipation cue to time against. The timing
window itself was never the problem.
**Generalizable:** (leave blank -- filled at postmortem only)
```

Leave `Generalizable` empty at capture. It gets filled during a postmortem pass, never during play. Deciding what generalizes is a separate job done with hindsight, and doing it inline slows capture to the point of abandonment.

## Refusal conditions

- **If you cannot quote him, do not write the entry.** A remembered gist is not a moment. An approximation with quote marks around it is worse than nothing, because it will later be treated as his words.
- **If you are tempted to record your own reaction as his, stop.** Your reactions are not data. You are the instrument that is blind to this, which is the entire reason the file exists.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **playtest-design** — Structured observation around the captured moment
- **north-star-check** — Reactions are the earliest drift signal

---
name: north-star-check
description: Check the build against the project's written north star, pillars, or design brief. Two tiers: a 60-second GLANCE at the start of any session touching game systems, and a full AUDIT at milestone boundaries, before multi-session tuning or optimization passes, or on demand. Use when starting game-systems work, before a tuning pass, at a milestone, or when asked whether the game has drifted from its intent. Catches drift that agents reliably miss by not re-reading the document.
---

# north-star-check

Two tiers. The cheap one runs constantly; the thorough one runs at boundaries. Both exist because the expensive version alone will not get run, and the cheap version alone will not catch drift.

**Sources:** No external source. This is a working practice — a lightweight
recurring check against a document the project already wrote. Its value depends
entirely on the north star existing and being specific; see **game-vision** for
producing one worth checking against.

---

## Why

In four projects, three had a written north star and none of the three had been re-read during the sessions that drifted away from it.

- GRAVELIGHT spent six review cycles optimizing a subagent's 7/10 score. Spec §1 states that any score implying "how close are we to Diablo" measures the wrong thing. The agent did the explicitly prohibited thing while the file sat unopened.
- TIMBERWOLF made ~15 substantive changes in one session without opening the pillars. Pillar 4 is now inverted in the shipped build.
- O.M.E.N. ran ten measurement passes optimizing whether a decision exists, while the stated bet was emotional attachment.

**In every case drift was caught by Bob or an external reviewer, never by the agent's own process.** The failure was never disagreement with the document. It was non-reading.

---

## Tier 1 -- GLANCE

**Fires** at the start of any session that will touch game systems, before the first change. Target: 60 seconds.

1. **Open the north star document.** Actually open it. Do not answer from memory of it.
2. Quote the pillars into the session.
3. State what this session intends to do, and which pillar it serves.
4. If it serves none, say so out loud before starting. Sessions that serve no pillar are allowed. Unnoticed ones are not.

That is the whole tier. Its only job is to make the document a thing that gets read.

---

## Tier 2 -- AUDIT

**Fires** at milestone boundaries, before any multi-session tuning or optimization pass, and on demand.

1. **Quote the north star verbatim.** All of it, not a summary.

2. **List what shipped since the last audit.** What is in the build, not what was planned, not what was ticketed.

3. **Name the number that received the most attention since the last audit.** The metric that was watched, tuned toward, or reported most often.

   Then ask: **is that number named in the brief?**

   If it is not, that number is the project's actual objective function, and it was selected by accident rather than by design. This is the single highest-yield question in the audit. It catches the failure mode all three drifted projects shared: an unstated goal does not leave a blank, it leaves a vacuum, and the vacuum fills with whatever proxy is nearest to hand and then gets optimized hard.

4. **For each pillar: is it true of the current build?** Quote evidence -- a measurement, a moment from `docs/moments.md`, a code path. "Yes" without evidence is not an answer.

5. **Verdict. Exactly one:**

   - **ON TRACK** -- the build serves the brief. Continue.
   - **DRIFTED** -- the build has moved away from the brief. State when it started and whether anyone noticed at the time.
   - **BRIEF IS WRONG** -- the build is better than the brief, or the brief encoded a bet that measurement has since refuted. State what the brief should now say.

6. **If DRIFTED or BRIEF IS WRONG, stop and surface to Bob before continuing.** Do not resolve it yourself. Which of the two it is, and what to do about it, is his call.

---

## BRIEF IS WRONG is a legal verdict

It is blameless and it carries no implication of failure. Games discover what they are; briefs written before the discovery are frequently wrong, and a brief that is never allowed to be wrong becomes a document people learn to rubber-stamp.

Drift is not the failure. **Unnoticed drift is the failure.** A deliberate pivot recorded at the time is a healthy outcome; one project in four did exactly this and it was the only one that reread its spec on a cadence.

## Refusal conditions

- **If no written north star exists, do not synthesize one from chat history and proceed.** Say it is missing and stop. O.M.E.N. has no written pillars and drifted through ten measurement passes; a reconstructed brief would have ratified the drift rather than caught it.
- **Do not answer from memory of the document.** Non-reading is the failure this skill exists to prevent, and recalling the gist is a form of non-reading.

---

## Cross-References

Three tight links. Everything else routes through the map, so adding a skill
touches one file rather than twenty: `references/routing-map.md` (in
**game-design**).

- **game-vision** — The document being checked against
- **moment-capture** — Felt evidence of drift, captured at the time

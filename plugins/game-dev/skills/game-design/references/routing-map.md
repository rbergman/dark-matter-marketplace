# dm-game routing map

The single index of which skill answers which question. Individual skills carry
at most three tight links; everything else routes through here, so adding a skill
touches one file instead of twenty.

---

## By question

| You are asking | Skill |
|---|---|
| What game is this, and is it worth building? | **game-vision** |
| Which systems does it need, and how do they interact? | **systems-design** |
| Is this specific mechanic any good? | **game-design** (5-Component Filter) |
| Does this mechanic actually affect outcomes? | **mechanic-ablation** |
| Has the build drifted from the brief? | **north-star-check** |
| Why isn't the session engaging? | **experience-design** |
| Why does this action feel bad? | **game-feel** |
| Are these numbers fair? | **game-balance** |
| How do resources flow, and will the economy hold? | **economy-design** |
| How fast should the player get stronger? | **progression-systems** |
| It's an idle/incremental — how fast should the number go up? | **incremental-design** |
| Why do players stop coming back? | **motivation-design** |
| Can players read the screen? | **player-ux** |
| Can players with disabilities play at all? | **accessibility-design** |
| What should this sound like, and what should audio tell the player? | **audio-design** |
| How do I lay out this fight, level, or world? | **encounter-design** |
| How is the story structured as a system? | **narrative-design** |
| How do I write the actual passage? | **game-narrative-craft** |
| What should the prose sound like? | **cosmic-horror-register** (and its six-slot register template) |
| The joke is the institution, not the monster | **deadpan-institutional-register** |
| The generated content all feels the same | **generated-content-quality** |
| The game plays itself / I'm balancing with a bot | **simulation-first-design** |
| Leaderboards, ghosts, or social features without real-time multiplayer | **async-and-social** |
| How do I test this with humans? | **playtest-design** |
| Someone just reacted to playing it | **moment-capture** |
| What should I measure once it ships? | **data-driven-design** |
| It's dropping frames | **game-perf** |
| Setting up a new PixiJS browser game | **dm-pixi:pixi-vector-arcade** |

---

## By stage

**Before building** — game-vision → systems-design → game-design

**While building** — game-feel, encounter-design, narrative-design +
game-narrative-craft, audio-design, player-ux, game-perf

**Tuning** — game-balance, progression-systems, economy-design,
incremental-design, mechanic-ablation, simulation-first-design

**Validating** — playtest-design, moment-capture, north-star-check,
data-driven-design, accessibility-design

**Content at volume** — generated-content-quality, game-narrative-craft,
register skills

---

## Layer pairs

Where two skills cover the same territory at different altitudes, the split is
deliberate. Going to the wrong one wastes a pass.

| Higher | Lower | The seam |
|---|---|---|
| narrative-design | game-narrative-craft | Architecture and branch budget vs. the sentence and the passage |
| game-narrative-craft | *register skills* | Genre-neutral structure vs. tone and diction (cosmic-horror, deadpan-institutional) |
| progression-systems | motivation-design | The math of growth vs. the psychology of why it works |
| game-balance | economy-design | Tuning within an economy vs. designing one from scratch |
| economy-design | incremental-design | General resource flow vs. the case where the flow is the game |
| player-ux | accessibility-design | Cognitive load for everyone vs. access for players who need it |
| playtest-design | moment-capture | Structured observation vs. capturing a felt reaction verbatim |
| simulation-first-design | mechanic-ablation | Building the instrument vs. the procedure you run on it |

---

## Binding on every skill

- **The Numbers Policy** (`references/numbers-policy.md`) — every numeric value
  declares a posture: source-backed, starting-value-with-test, or measured-here.
- **Sources block** — every skill names its sources, and says explicitly where it
  has none. Several frameworks here are this plugin's own construction; those say
  so rather than borrowing authority.

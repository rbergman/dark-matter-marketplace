---
name: data-driven-design
description: >
  Use when setting up game analytics, designing telemetry events, interpreting player behavior
  data, running A/B tests, building dashboards, or making design decisions informed by metrics.
  Activate for any work involving retention analysis, funnel optimization, cohort comparison,
  economy health monitoring, or live ops data pipelines. Covers the full data lifecycle from
  instrumentation through interpretation. Essential for live-service games but valuable for
  any game that ships updates. Bridges structured playtesting (qualitative observation) with
  ongoing quantitative measurement. Emphasizes data-informed design over purely data-driven
  optimization — metrics reveal what is happening, but design judgment determines why and
  what to do about it.
---

# Data-Driven Design

## When to Activate

Use this skill when:

- Setting up analytics infrastructure or telemetry pipelines
- Designing event taxonomies and instrumentation schemas
- Interpreting player behavior data or building hypotheses from metrics
- Running or evaluating A/B tests
- Building dashboards for design, executive, or live ops audiences
- Evaluating feature impact post-launch
- Making design decisions where quantitative evidence should inform the choice
- Diagnosing retention drops, progression bottlenecks, or economy imbalances
- Transitioning from playtest-phase observation to live data collection

---

## Core Principle: Data-Informed, Not Data-Driven

Data tells you **what** is happening. Design judgment tells you **why** and **what to do** about it.

The distinction matters. "Data-driven" implies the data decides. "Data-informed" means the data
contributes evidence to a decision that also weighs design intent, player experience goals, and
creative vision. Numbers without context are noise.

**Correlation ≠ causation** is the most violated principle in game analytics. Players who buy
the battle pass also play more — but forcing battle pass prompts on casual players won't make
them play more. The causation runs the other direction: engaged players buy, not the reverse.

Guidelines for healthy data use:

- Always ask "what would change our decision?" before collecting data
- Treat metrics as symptoms, not diagnoses — investigate before acting
- Preserve design intent; use data to refine execution, not replace vision
- When data and intuition conflict, dig deeper rather than defaulting to either
- Quantitative data says what happened; qualitative data (playtests, feedback) says why

---

## Telemetry Design

Good analytics start with good instrumentation. What you track and how you structure it
determines what questions you can answer later.

### Event Taxonomy

Organize events into three categories:

| Category | Description | Examples |
|---|---|---|
| **Player actions** | What the player chose to do | Equipped item, started quest, used ability, opened menu |
| **Game state events** | What the system did | Enemy spawned, loot dropped, difficulty adjusted, match started |
| **Session events** | Lifecycle markers | Session start, session end, app backgrounded, crash |

### Event Schema

Every event needs a minimum set of context fields:

| Field | Purpose | Notes |
|---|---|---|
| `timestamp` | When it happened | UTC, millisecond precision |
| `player_id` | Who did it | Persistent across sessions |
| `session_id` | Which play session | Links events within a session |
| `event_type` | What happened | From your taxonomy |
| `context` | Where in the game | Level, menu, match phase |
| `platform` | Device/OS | Segments behavior by hardware |
| `build_version` | Which version | Essential for before/after comparisons |

### Instrumentation Principles

1. **Track decision points, not just outcomes.** Knowing a player failed a level is less useful
   than knowing they attempted it 4 times, tried 2 different loadouts, and quit after the third
   attempt without the fourth completing.

2. **Track absence.** What players *don't* do is often more revealing than what they do. If a
   feature exists and nobody uses it, that's a signal. Instrument feature surfaces so you can
   measure both engagement and non-engagement.

3. **Track sequences, not just counts.** "Players used the shop 3 times" is less useful than
   "players opened the shop, browsed weapons, closed without buying, returned 10 minutes later,
   and purchased." Order and timing reveal intent.

4. **Include enough context to segment later.** You will always want to slice data by dimensions
   you didn't anticipate. Err toward including context fields rather than minimizing schema width.

### Data Volume Management

Not everything is worth tracking at full fidelity:

| Event Frequency | Strategy | Example |
|---|---|---|
| Per-frame (60/sec) | Sample at intervals or aggregate | Player position, camera angle |
| Per-second | Aggregate into summary events | DPS output, resource generation |
| Per-action (variable) | Full capture with context | Ability use, item purchase |
| Per-decision (rare) | Full capture with rich context | Build choice, quest selection |
| Per-session (1-2x) | Full capture | Session start/end, matchmaking |

The cost of storing high-frequency events rarely justifies the analytical value. Aggregate
per-frame data into periodic snapshots (every 5-10 seconds) unless you have a specific
analytical need for higher resolution.

---

## Key Metrics Framework

Organize metrics by what question they answer. Every metric listed here includes healthy
ranges as general baselines — actual targets vary by genre, platform, and business model.

### Engagement Metrics

| Metric | What It Measures | Healthy Range | Warning Signal |
|---|---|---|---|
| DAU/MAU ratio | Stickiness — how often monthly users return daily | 0.15–0.30 (casual), 0.30–0.50 (core) | Declining ratio with stable MAU = engagement erosion |
| Session length (median) | How long players stay per visit | 8–25 min (mobile), 30–90 min (PC/console) | Bimodal distribution (very short + very long) suggests onboarding issues |
| Session frequency | How often players return per week | 3–5x/week (healthy), <2x/week (at risk) | Declining frequency precedes churn by 1–2 weeks |
| D1/D7/D30 retention | Percentage returning after N days | D1: 35–50%, D7: 15–25%, D30: 5–12% | D1 < 30% = critical onboarding problem |

### Progression Metrics

| Metric | What It Measures | Healthy Range | Warning Signal |
|---|---|---|---|
| Time-to-milestone | How long to reach key progression points | Varies by design | Large variance = inconsistent difficulty |
| Completion rate by content | What percentage finish each piece of content | 60–85% for main path | Below 50% = content is too hard or unengaging |
| Funnel drop-off | Where players stop progressing | Gradual taper is expected | Sharp cliff at a single point = specific blocker |
| Skill distribution | Bell curve of player performance | Normal distribution | Heavy left skew = too hard; heavy right skew = too easy |

### Economy Metrics

| Metric | What It Measures | Healthy Range | Warning Signal |
|---|---|---|---|
| Currency velocity | How fast currency circulates (earned → spent) | Spend within 1–3 sessions of earning | Hoarding (>5 sessions) = nothing worth buying |
| Inflation index | Currency supply growth vs. sink absorption | Net supply growth < 5%/week | Accelerating growth = sinks are failing |
| Wealth Gini coefficient | Inequality of currency distribution | 0.3–0.5 | >0.7 = extreme inequality, economy is stratified |
| Sink engagement | Percentage of players using each currency sink | Top sinks > 40% participation | No sink above 20% = economy has no compelling drains |

### Balance Metrics

| Metric | What It Measures | Healthy Range | Warning Signal |
|---|---|---|---|
| Pick rate | How often each option is selected | Roughly uniform ± genre expectations | Any option below 2% or above 40% in a pool of 10+ |
| Win rate | How often each option wins when picked | 45–55% in symmetric games | Consistent >55% across skill levels = overpowered |
| Match duration | How long competitive matches last | Within ±30% of target duration | High variance = snowball/stall problem |
| Build diversity | Number of viable builds/strategies | Increases with player skill | If diversity decreases with skill = false choice problem |

### UX Metrics

| Metric | What It Measures | Healthy Range | Warning Signal |
|---|---|---|---|
| Time-to-first-action | How long before the player does something meaningful | < 30 seconds | > 60 seconds = too many gates before play |
| Tutorial completion | Percentage finishing the tutorial flow | > 80% | < 60% = tutorial is too long or unclear |
| Help/hint usage | How often players seek assistance | Decreasing over sessions | Increasing or flat = systems aren't teaching well |
| Error rate | UI misclicks, failed interactions, dead ends | < 5% of interactions | Concentrated errors on specific UI = design flaw |

---

## Funnel Analysis

Funnel analysis is the single most useful analytical tool for game design. It reveals exactly
where your design is failing to carry players forward.

### How It Works

1. Define the sequence of steps you expect players to take
2. Count how many players reach each step
3. Calculate the drop-off percentage at each transition
4. The step with the largest drop-off is your biggest problem

### Funnel Template

| Step | Count | Cumulative % | Step Drop-off % | Diagnosis |
|---|---|---|---|---|
| App opened | 10,000 | 100% | — | — |
| Tutorial started | 8,500 | 85% | 15% | Acceptable first-session loss |
| Tutorial completed | 5,100 | 51% | 40% | **Biggest drop — tutorial too long or unclear** |
| First core loop | 4,800 | 48% | 6% | Good transition |
| Second session | 3,200 | 32% | 33% | Normal D1 retention range |
| Reached midgame | 1,400 | 14% | 56% | Content gap or difficulty spike |

### Where to Apply Funnels

- **Onboarding**: Download → open → tutorial → first session → second session
- **Progression**: Each chapter, world, or tier boundary
- **Monetization**: Store view → browse → cart → purchase → repeat purchase
- **Feature adoption**: Feature unlocked → first use → second use → regular use
- **Social**: Invited → accepted → played together → added friend

### Reading Funnels

- A gradual taper across many steps is normal and expected
- A sharp cliff at one step means that specific step has a problem
- Compare funnels across cohorts to see if changes helped
- Separate funnels by acquisition source — organic vs. paid users have different shapes

---

## A/B Testing

A/B testing provides causal evidence where observational data can only show correlation.
Use it deliberately and with discipline.

### When to A/B Test

- Uncertain design choices where both options are defensible
- Changes with clearly measurable outcomes (retention, completion, spending)
- Optimizations to existing systems (not greenfield features)
- When the cost of being wrong is high enough to justify the testing overhead

### When NOT to A/B Test

- **Core identity decisions** — Your game's creative vision is not a hypothesis to validate
- **Small populations** — Below ~1,000 per variant, statistical noise dominates signal
- **Features requiring learning curves** — Players need time to understand new systems;
  early measurement captures confusion, not preference
- **Obvious wins** — If every designer on the team agrees, just ship it
- **Ethical concerns** — Never A/B test manipulative patterns to find "what players tolerate"

### Running a Valid Test

| Element | Requirement | Why |
|---|---|---|
| Sample size | Use a statistical power calculator | Gut-feel sample sizes produce gut-feel results |
| Duration | Minimum 2 full play cycles | Daily players need ≥2 weeks; weekly players need ≥1 month |
| Randomization | True random assignment, not alternating | Alternating creates systematic bias |
| Single variable | Change one thing per test | Multi-variable tests require factorial design |
| Novelty buffer | Ignore the first 3–5 days of data | New features get inflated engagement that decays |

### Guardrail Metrics

While testing your primary metric, monitor guardrail metrics — other important measurements
that should not degrade. A variant that improves retention but tanks spending is not a win
unless you decided in advance that the tradeoff was acceptable.

Define guardrails before the test starts. If any guardrail crosses a predefined threshold,
stop the test and investigate.

---

## Cohort Analysis

Cohort analysis compares groups of players to understand how behavior varies across segments.
It reveals patterns that aggregate metrics obscure.

### Time-Based Cohorts

Group players by when they started (week 1, week 2, etc.). Compare the same metrics across
cohorts to answer: "Did our changes improve the experience for new players?"

| Use Case | What to Compare |
|---|---|
| Onboarding changes | D1/D7 retention across weekly cohorts |
| Content updates | Progression speed for pre-update vs. post-update joiners |
| Economy tuning | Spending curves across monthly cohorts |
| Seasonal effects | Same cohort window across different years |

### Behavior-Based Cohorts

Group players by what they did rather than when they joined:

| Cohort | Compared To | Reveals |
|---|---|---|
| Tutorial completers | Tutorial skippers | Whether tutorial predicts retention |
| Social players | Solo players | Value of social features |
| First-week spenders | Non-spenders | Whether early spending correlates with LTV |
| Feature X users | Non-users | Whether Feature X drives engagement |

### Spending Cohorts

Segment by spending behavior to understand your economic audience:

| Segment | Definition | Key Questions |
|---|---|---|
| Non-spenders | $0 lifetime | What keeps them playing? Can they convert? |
| Minnows | Bottom 50% of spenders | What triggered their first purchase? |
| Dolphins | Middle 40% of spenders | Are they trending toward whale or minnow? |
| Whales | Top 10% of spenders | Are they satisfied or compulsive? Is this healthy? |

### Skill Cohorts

Segment by player skill level to validate your difficulty curve:

- **Novice** (bottom quartile) — Is the game accessible? Where do they get stuck?
- **Intermediate** (middle 50%) — Is the core loop satisfying? Is progression paced well?
- **Expert** (top quartile) — Is there enough depth? Are they finding emergent strategies?

---

## Dashboard Design

A dashboard is not a data dump. It is a decision-support tool. Every metric on a dashboard
must have a defined response: "If this metric changes, we would do X." If no action would
result, remove the metric.

### Executive Dashboard

**Audience**: Leadership, producers, stakeholders
**Update frequency**: Daily

| Metric | Purpose |
|---|---|
| DAU / MAU / DAU÷MAU | Population health and stickiness |
| Revenue (daily, trailing 7d, trailing 30d) | Business health |
| D1/D7/D30 retention (by cohort) | Are we keeping players? |
| New installs / organic vs. paid | Growth trajectory |
| Top-line conversion rate | Monetization efficiency |

### Design Dashboard

**Audience**: Game designers, systems designers
**Update frequency**: Daily or on-demand

| Metric | Purpose |
|---|---|
| Progression funnels (per content segment) | Where are players getting stuck? |
| Balance metrics (pick/win rates) | Is the meta healthy? |
| Economy health (velocity, Gini, inflation) | Is the economy functioning? |
| Session length distribution | Is engagement depth changing? |
| Feature adoption rates | Are new features landing? |

### Live Ops Dashboard

**Audience**: Live ops team, community managers
**Update frequency**: Real-time or hourly

| Metric | Purpose |
|---|---|
| Event participation rate | Is the live event working? |
| Currency injection vs. sink rates | Is the event distorting the economy? |
| Error/crash rates | Is something broken? |
| Anomaly alerts | Unusual patterns that need investigation |
| Player reports / support tickets | Qualitative signal at scale |

---

## Data Pitfalls

These are the most common mistakes in game analytics. Awareness of them is necessary but
not sufficient — you must actively design your analysis to avoid them.

### Survivorship Bias

You can only analyze players who are still playing. The players who left — and the reasons
they left — are invisible in your engagement data. This creates a systematic blind spot:
your "average player" metrics describe only the players your game retained, not the ones
it failed.

**Mitigation**: Track churn events explicitly. Analyze the last session before a player
leaves. Compare churned players to retained players at the same progression point.

### Simpson's Paradox

A trend that appears in aggregate data can reverse when you segment by group. Example:
overall win rate for a character looks balanced at 50%, but it's 60% for experts and 40%
for novices — the character is overpowered but masked by a large novice population
dragging the average down.

**Mitigation**: Always segment by skill, tenure, platform, and spending tier before
drawing conclusions from aggregate metrics.

### Goodhart's Law

When a metric becomes a target, it ceases to be a good metric. If you incentivize your
team to improve D7 retention, they may optimize for D7 at the expense of D30. If you
target session length, you may get idle-time inflation rather than genuine engagement.

**Mitigation**: Use balanced scorecards. Never optimize a single metric in isolation.
Define guardrail metrics that must not degrade.

### Over-Optimization

Optimizing for engagement metrics can produce a game that is compulsive rather than
enjoyable. High session length and frequent returns are not inherently positive if they
come from anxiety-based mechanics (FOMO, loss aversion, streaks that punish absence).

**Mitigation**: Pair quantitative engagement metrics with qualitative satisfaction
measurement. Player surveys, sentiment analysis, and review monitoring provide the
counterbalance that telemetry cannot.

### Privacy

Collect the minimum data necessary for your analytical needs. Anonymize player data.
Comply with applicable regulations (GDPR, COPPA, CCPA). Disclose what you collect.
Never track data that could identify a player outside the game context unless there
is an explicit, justified need with informed consent.

---

## The Data-Design Loop

Data is most valuable as part of a continuous feedback loop:

```
Observe (data) → Hypothesize (design) → Test (A/B or playtest) → Measure (data) → Iterate
```

### How to Use This Loop

1. **Observe**: Identify a pattern in your data. "Players are dropping off at level 5."
2. **Hypothesize**: Form a design hypothesis. "The difficulty spike at level 5 is too steep
   because we introduce two new mechanics simultaneously."
3. **Test**: Change the design and measure. Split-test the revised level 5 against the
   original, or run a focused playtest on the transition.
4. **Measure**: Compare the metrics. Did drop-off decrease? Did downstream metrics improve?
5. **Iterate**: Refine based on results. Ship, adjust, or revert.

### Principles

- Data should generate **questions**, not answers
- The most valuable data point is always **"where do players quit?"**
- A single data point is an anecdote; a trend is a signal; a replicated trend is evidence
- Design changes motivated by data still require design judgment to execute well
- Fast iteration beats perfect measurement — a rough answer today is worth more than a
  precise answer next month

---

## Anti-Patterns

| Anti-Pattern | Description | Remedy |
|---|---|---|
| **Metric worship** | Optimizing numbers instead of experiences | Pair every metric with a qualitative check |
| **Vanity metrics** | Impressive but unactionable (total downloads, total playtime) | Replace with rate metrics (DAU, session frequency) |
| **Data without context** | "Retention dropped 3%" — from what? Since when? For whom? | Always include baseline, timeframe, and segment |
| **Retroactive hypotheses** | Finding a pattern and pretending you predicted it | Pre-register hypotheses before looking at data |
| **Ignoring qualitative data** | Trusting telemetry over player feedback | Treat surveys and playtests as first-class data sources |
| **Premature optimization** | A/B testing before the core experience is solid | Get the fundamentals right through playtesting first |
| **Metric overload** | Tracking everything, analyzing nothing | Start with 5–10 core metrics; add only when a question demands it |

---

## Cross-References

| Skill | Relationship |
|---|---|
| **playtest-design** | Structured qualitative observation — use before and alongside quantitative telemetry |
| **game-balance** | Pick rates, win rates, and match duration metrics feed directly into balance tuning |
| **economy-design** | Economy metrics (velocity, Gini, inflation) are a core domain of data-driven analysis |
| **progression-systems** | Funnel analysis is the primary tool for diagnosing progression bottlenecks |
| **motivation-design** | Retention metrics measure whether motivational structures are working |
| **multiplayer-design** | Matchmaking quality, queue times, and fairness metrics require dedicated telemetry |

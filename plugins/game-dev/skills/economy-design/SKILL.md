---
name: economy-design
description: "Resource flow architecture, currency system design, inflation/deflation diagnosis, sink/source balancing, crafting economies, LiveOps event budgeting, and economy simulation modeling. Use when designing resource systems from scratch, adding currencies or stores, setting crafting costs or reward magnitudes, diagnosing inflation or wealth stratification, planning monetization, designing LiveOps events, or when veteran players stockpile while new players feel locked out. Goes deeper than game-balance's economy health check — this is the architectural skill for building and sustaining entire economic systems."
---

# Economy Design

**Purpose:** Systematic tools for designing, simulating, and sustaining game economies — the architecture of resource flows, currency systems, and long-term economic health. Economy is a foundational system; most other systems are downstream of resource flow.

**Core philosophy:** An economy is a directed graph. Every resource has sources, sinks, converters, and pools. If you cannot draw the graph, you do not understand the economy. Draw first, implement second.

---

## When to Activate

Use this skill when:
- Designing resource systems, currencies, stores, or crafting costs from scratch
- Setting reward magnitudes or drop rates
- Diagnosing inflation (prices spiraling, early items worthless) or deflation (hoarding, new players locked out)
- Adding monetization layers (premium currency, battle passes, cosmetic stores)
- Designing LiveOps events that inject or drain resources
- Veteran players stockpile resources while new players feel unable to participate
- Using resource scarcity as a difficulty lever instead of stat scaling
- Planning a crafting system that intersects with the broader economy
- Building a simulation model to project economic health before implementation

**Relationship to game-balance:** The **game-balance** skill covers balancing *within* an economy — cost curves, dominant strategy detection, tuning existing numbers. This skill covers designing economies *from scratch* — the architecture of flows, the choice of currencies, and the long-term health of the system.

---

## Core Framework: The Flow Model

Every economy is a directed graph of resources. Before writing any code, draw the graph.

### Five Components

| Component | Role | Examples |
|-----------|------|----------|
| **Sources** | Where resources enter the system | Enemy drops, quest rewards, crafting yields, purchases, passive generation, event rewards |
| **Sinks** | Where resources leave the system | Crafting costs, repair fees, consumable use, transaction taxes, upgrade costs, cosmetic purchases |
| **Converters** | Transform one resource into another | Crafting (materials → items), trading (gold → gear), upgrading (item + currency → better item) |
| **Pools** | Where resources accumulate | Player inventory, bank, stash, guild vault, escrow |
| **Connections** | Flow between players or systems | Trade, gifting, marketplace, looting, auction house |

### Flow Diagram Construction

1. **List every resource type** in the game (currencies, materials, items, tokens)
2. **For each resource, identify all sources** — where does it come from?
3. **For each resource, identify all sinks** — where does it go?
4. **Draw the directed graph** — nodes are pools, edges are flows with rates
5. **Label each edge** with its flow rate (units per session, per hour, per player)
6. **Check balance** — every source must have a corresponding sink, or the economy will inflate

### The Fundamental Law

```
If total_source_rate > total_sink_rate → inflation (guaranteed)
If total_sink_rate > total_source_rate → deflation (guaranteed)
```

This is not a risk. It is arithmetic. An imbalance does not *risk* inflation — it *causes* it. The only question is how fast.

### Sink Quality Principle

Every sink must feel meaningful to the player. "Taxes" are a terrible sink — they feel like punishment. "Crafting the weapon I want" is a great sink — it feels like progress. If players resent a sink, they will avoid it or quit. If players desire a sink, it regulates the economy while creating engagement.

**Good sinks:** Crafting, upgrading, cosmetic purchases, consumables that feel powerful, meaningful repairs, prestige resets (New Game+ currencies)

**Bad sinks:** Arbitrary fees, death penalties that feel unfair, durability loss on non-combat items, mandatory maintenance costs with no player agency

---

## Currency Architecture

The number and structure of currencies is an architectural decision that shapes every downstream system.

### Currency Types

| Type | Structure | Pros | Cons | Best For |
|------|-----------|------|------|----------|
| **Single** | One resource for everything | Simple, easy to understand | Hard to balance across systems | Simple games, prototypes, jam games |
| **Dual (soft/hard)** | Earned currency + premium currency | Separates progression from monetization | Premium currency creates pay-to-win perception if mishandled | F2P with ethical monetization |
| **Multi-currency** | 3+ resources with different functions | Rich decision-making, deep crafting | Complexity overhead, inventory management burden | RPGs, survival games, deep crafting systems |
| **Hybrid** | Mix of above with conversion paths | Flexible, supports multiple progression tracks | Conversion rates are extremely hard to balance | Complex games with multiple progression paths |

### Design Rules

1. **Start with the minimum number of currencies that creates meaningful decisions.** Add more only when a genuinely new decision type requires it.
2. **Each currency should have a clear identity.** Players should immediately understand what a currency is for and how to earn it. If you need a tutorial to explain a currency, you have too many.
3. **Conversion between currencies must be lossy.** If players can convert A → B → A without loss, they will find arbitrage loops. Every conversion should destroy value.
4. **Premium currencies must never buy power directly.** The moment premium currency buys statistical advantage, the economy becomes pay-to-win. Premium currency should buy time savings, cosmetics, or convenience — never combat power or progression skips that affect other players.
5. **Name currencies to signal their source and purpose.** "Gold" (earned from play), "Gems" (purchased or rare), "Iron" (gathered from mining) — names should be self-documenting.

### Currency Decision Framework

```
Q: Does my game need more than one currency?
├─ Are there distinct resource acquisition loops? (combat vs. exploration vs. crafting)
│  └─ Yes → Consider multi-currency, one per loop
├─ Is there a monetization layer?
│  └─ Yes → Add a premium currency, strictly separated from power
├─ Are there time-gated and skill-gated progressions?
│  └─ Yes → Consider separate currencies for each gate
└─ None of the above → Single currency is probably sufficient
```

---

## Inflation & Deflation

The core economic health problem. Every live economy trends toward one or the other unless actively managed.

### Inflation

Resources enter faster than they leave. Consequences cascade:
1. Prices rise as currency loses value
2. Early-game items become worthless
3. New players face impossible prices in player-to-player markets
4. Content trivializes as currency becomes abundant
5. Only the newest, most expensive content has any meaning

### Deflation

Resources leave faster than they enter. Consequences cascade:
1. Players hoard resources defensively
2. New players cannot accumulate enough to participate
3. Economic activity stagnates — nobody trades
4. Content gates become impassable walls
5. Player base stratifies into haves and have-nots

### Detection Signals

| Signal | Indicates | Severity |
|--------|-----------|----------|
| Median player holdings doubling faster than designed | Inflation | High — exponential growth is hard to reverse |
| NPC shop prices feeling trivial by mid-game | Inflation | Medium — may be intentional progression |
| Player-to-player trade prices spiraling upward | Inflation | High — emergent market reflects real currency devaluation |
| Players hoarding instead of spending | Deflation | Medium — could also indicate poor sink quality |
| New players unable to afford baseline items in first session | Deflation | Critical — directly causes churn |
| Wealth Gini coefficient rising over time | Stratification | High — rich-poor gap compounds |

### Correction Tools

**Anti-inflation:** Scaling sinks (costs increase with item level), progressive transaction taxes, limited-time cosmetic sinks (voluntary and desirable), currency caps, diminishing returns on sources, prestige resets. Each carries risk — scaling sinks can feel punitive, caps feel restrictive, diminishing returns must be transparent.

**Anti-deflation:** Increased drop rates, catch-up mechanics (bonus earning for players behind median), guaranteed minimum rewards, resource sharing between players, price floors. Each carries risk — increased drops can overshoot into inflation, catch-up mechanics can feel patronizing.

**Key insight:** Equilibrium is dynamic, not static. Sources and sinks must scale with player population, average playtime, and progression stage. A fixed faucet-drain ratio that works at launch will break within months. Budget for ongoing tuning, not a one-time balance pass.

---

## Economy Simulation

Model the economy in a spreadsheet before implementing it in code. Spreadsheets are cheap to iterate; code is expensive.

### Per-Session Model

For each resource, calculate:

```
session_net = (all sources per session) - (all sinks per session)
```

If session_net is positive, the player accumulates. If negative, the player depletes. Both are fine — what matters is whether the rate matches your design intent.

### Player Archetype Projection

Model at least three archetypes and project their accumulation curves:

| Archetype | Play Pattern | What to Check |
|-----------|-------------|---------------|
| **Casual** | 30 min/day, 3-4 days/week | Can they afford baseline items within the first week? |
| **Regular** | 1-2 hours/day, 5-6 days/week | Does their progression feel steady and rewarding? |
| **Hardcore** | 4+ hours/day, daily | At what point do they break the economy? |

### Critical Checkpoints

- **Inflation ceiling:** The point where the hardcore player's accumulation rate makes content trivial. This is your upper bound — design sinks to engage at this level.
- **Deflation floor:** The point where the casual player's earning rate makes progression feel impossible. This is your lower bound — design sources to sustain at this level.
- **Crossover point:** The session count where a new player can participate meaningfully in the economy (afford first meaningful purchase, engage in trading, complete first craft). This should be within the first 1-3 sessions.

### Simulation Checklist

- [ ] Per-session income/expense modeled for each resource
- [ ] Three player archetypes projected over 1 week, 1 month, 3 months
- [ ] Inflation ceiling identified and sinks designed to engage it
- [ ] Deflation floor identified and sources designed to sustain it
- [ ] Crossover point is within first 1-3 sessions
- [ ] Model accounts for multiplayer interactions (trading, gifting) if applicable
- [ ] Model stress-tested with 2x and 0.5x the assumed player population

---

## Feedback Loops

Economic systems self-reinforce through feedback loops. Understanding which loops exist in your economy is essential for predicting long-term behavior.

**Positive feedback (rich get richer):** Player earns gold → buys better gear → earns gold faster. Creates dramatic progression but also stratification. Every positive feedback loop needs a ceiling or a counterbalancing negative loop.

**Negative feedback (rubber-banding):** Player falls behind → gets bonus rewards → catches up. Prevents stratification but can feel patronizing if too visible.

### Design Principle

**Positive feedback for SKILL. Negative feedback for TIME.** Better players should earn more (skill respects mastery). Players who miss sessions should be able to catch up (time respects life). Never pure positive feedback — it creates runaway inequality. Never pure negative feedback — it removes the reward for investment.

### Identifying Feedback Loops

For each resource flow in your graph, trace the cycle: does earning resource A enable earning more of A? If yes, classify the amplification as skill-based, time-based, or both. Time-based amplification needs negative feedback (catch-up, diminishing returns). Skill-based needs a ceiling. Both: ensure the skill component dominates at high levels.

---

## Economy as Difficulty Lever

Resource scarcity creates challenge without stat scaling. This is often more interesting than making enemies harder, because it changes *player decisions* rather than requiring faster reflexes.

### Scarcity-Driven Design

| Scarce Resource | Decision It Creates | Example |
|-----------------|---------------------|---------|
| **Ammo** | Shot selection, target prioritization | Survival horror: every bullet matters |
| **Health items** | Risk assessment, retreat timing | Soulslike: when to use the last estus |
| **Crafting materials** | Build commitment, specialization | Survival: invest in weapons or shelter? |
| **Currency** | Purchasing priorities, opportunity cost | RPG: buy the armor or save for the sword? |
| **Time (as currency)** | Activity prioritization | Farming sim: water crops or explore the mine? |
| **Inventory space** | Carry decisions, value assessment | Roguelike: which items to keep? |

### Guidelines

- Scarcity works only when the player understands the trade-off. Hidden scarcity feels like a bug; visible scarcity feels like a puzzle.
- Create decisions at the *planning* level ("use now or save?"), not just execution ("click fast enough?").
- Total deprivation is frustration, not scarcity. The player must always have *something* to work with.
- Scarcity is most effective when resources serve multiple purposes (ammo that is also a crafting ingredient).

---

## LiveOps Economy

Time-limited events stress the base economy. This is where real products break most often — the base economy is fine until events start stacking.

### Event Currency Design

- **Self-contained events** are safest: earn during event, spend during event, currency expires after event. Minimal impact on the base economy.
- **Events that inject into the main economy** must be budget-tested. Calculate: if every active player earns the maximum event reward, what is the total injection into the base economy? Compare against your inflation ceiling.
- **Events that drain from the main economy** (spend base currency for event items) are powerful sinks but punish players who were saving for non-event goals.

### Event Stacking

Overlapping events multiply economic stress. Each event is designed in isolation, but players experience them simultaneously.

- Maintain an event calendar that tracks cumulative source/sink impact
- Never run two high-injection events simultaneously
- Budget for the compound effect: Event A injects X, Event B injects Y, compound injection is often > X + Y because players optimize across events

### FOMO and Calendar

FOMO is a powerful motivator but easily becomes toxic. Provide paths to earn event items later at higher cost. Never make gameplay-affecting items permanently exclusive. Communicate return schedules clearly.

Budget for real-world calendar effects: holidays create spending peaks, end-of-season events drive engagement spikes, anniversary giveaways inject resources. Model cumulative impact before committing.

---

## Crafting Economy

Crafting is an economy subsystem — a converter (materials → items) and a sink (materials consumed). It deserves dedicated design attention because it sits at the intersection of economy, progression, and player expression.

### Crafting Design Principles

1. **Crafting decisions should be meaningful.** Which item to craft, what to sacrifice, which path to specialize in. "Collect enough, press button" is content, not a system.

2. **No acquisition path should dominate.** Crafting (time + materials → guaranteed item), buying (currency → immediate, limited), finding (luck → free, unpredictable), trading (social → specific, market-priced) should each have trade-offs.

3. **Recipes should pull players through multiple systems.** Ingredients from combat drops + exploration finds + economy purchases create cross-system engagement.

4. **Crafting must function as a real sink.** If materials are trivially abundant, crafting is not regulating the economy.

5. **Failed crafting must feel fair.** Return partial value or provide meaningful feedback. Pure loss drives players away from the system.

---

## Economy Health Monitoring

What to track in a live economy. These metrics should be on a dashboard, reviewed regularly.

### Quantitative Metrics

| Metric | What It Measures | Warning Signal |
|--------|-----------------|----------------|
| **Median currency holdings by player age** | Accumulation rate | Exponential growth after first week |
| **Price index (basket of key items)** | Inflation/deflation | >10% change per month in player markets |
| **Time-to-purchase key items** | Accessibility | New players cannot afford baseline items within first session |
| **Sink engagement rate** | Sink quality | <50% of players using a designed sink |
| **Currency velocity** | Economic activity | Low velocity = hoarding; high velocity = spending faster than earning |
| **Gini coefficient** | Wealth distribution | Rising Gini over time = rich-poor gap widening |
| **Source/sink ratio by player segment** | Segment-specific health | Ratio diverging between casual and hardcore |
| **Conversion rate usage** | Currency architecture health | One currency being converted to another at >80% rate = currencies are functionally one |

### Qualitative Signals

Listen for: "Everything is too expensive" (deflation), "Gold is meaningless" (inflation), "I can't catch up" (stratification), "Why does repair cost so much?" (punitive sink), "The market is dead" (deflation or supply drought).

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **Meaningless sinks** | Players resent fees, avoid sinks | Connect every sink to something players want — crafting is desirable, taxes are not |
| **Uncapped generation** | Hardcore players inflate the economy | Diminishing returns, daily/weekly caps, scaling sink costs |
| **Currency bloat** | Players confused by too many currencies | Audit: "Does this currency create a unique decision?" If no, merge |
| **Price anchoring failure** | Second item feels absurdly expensive | First purchase must anchor expectations for the full price range; earning rate must visibly increase alongside prices |
| **Spiral of power** | Better gear → more gold → better gear → trivializes content | Decouple gear from earning rate; add scaling sinks; introduce horizontal progression. See **progression-systems** |
| **Event economy neglect** | Base economy unrecognizable after months of events | Every event gets an economy impact budget; maintain running ledger of cumulative injections |

---

## Economy Design Checklist

Use this when designing a new economy or auditing an existing one.

### Architecture
- [ ] Flow diagram drawn with all sources, sinks, converters, pools, and connections
- [ ] Every source has at least one corresponding sink
- [ ] Every sink feels meaningful to the player (not punitive)
- [ ] Currency count is the minimum that creates meaningful decisions
- [ ] Each currency has a clear identity, source, and purpose
- [ ] Conversion between currencies is lossy (no arbitrage loops)

### Health
- [ ] Per-session simulation modeled for casual, regular, and hardcore archetypes
- [ ] Inflation ceiling identified and sinks designed to engage it
- [ ] Deflation floor identified and sources designed to sustain it
- [ ] New player crossover point is within first 1-3 sessions
- [ ] Feedback loops identified and classified (skill-based vs. time-based)
- [ ] No uncapped positive feedback loops

### Monitoring
- [ ] Key metrics identified and dashboarded
- [ ] Warning thresholds defined for each metric
- [ ] Review cadence established (weekly for live games, per-milestone for development)

### LiveOps (if applicable)
- [ ] Event economy impact budgeted before launch
- [ ] Event calendar tracks cumulative source/sink impact
- [ ] No overlapping high-injection events
- [ ] FOMO items have delayed re-acquisition paths

---

## Cross-References

| Area | Skill | When to Go There |
|------|-------|-------------------|
| Balancing within an economy | **game-balance** | Tuning specific prices, cost curves, dominant strategy detection — operates on an economy this skill designed |
| Economy as a system | **systems-design** | Evaluating how the economy interacts with other game systems — economy is typically a foundational system |
| Reward psychology | **motivation-design** | Understanding why players engage with economic systems — reinforcement schedules, intrinsic vs. extrinsic motivation |
| Progression pacing | **progression-systems** | Aligning economy pacing with power curves and unlock schedules — the two systems must be synchronized |
| Core loop engagement | **experience-design** | Ensuring economic decisions contribute to the engagement loop, not just numerical accumulation |
| Playtest validation | **playtest-design** | Testing whether the economy produces the intended player experience — metrics to track, questions to ask |
| Player cognitive load | **player-ux** | When currency count or economic complexity exceeds player attention budget |

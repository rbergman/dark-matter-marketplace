---
name: game-balance
description: "Economy tuning, progression math, transitive/intransitive systems, cost curves, and dominant strategy detection. Use when designing item stats, pricing systems, combat numbers, upgrade trees, or any system where game objects have numeric attributes that must relate fairly to each other."
---

# Game Balance

**Purpose:** Systematic tools for tuning numeric systems — items, economies, combat, progression — so that player choices remain meaningful and no single strategy dominates.

**Influences:** Frameworks here draw on work by Ian Schreiber, Brenda Romero, and Tynan Sylvester in game balance and experience design.

---

## When to Activate

Use this skill when:
- Designing item/weapon/unit stats and pricing
- Building or tuning an in-game economy
- Players report "X is overpowered" or "Y is useless"
- Adding new content to an existing system (power creep risk)
- Designing rock-paper-scissors or counter relationships
- Setting up resource generation/consumption loops

---

## Core Tool: The Cost Curve

The cost curve is the fundamental balance instrument. Every game object in a transitive system should sit on a consistent curve of cost vs. total value.

### Construction Steps

1. **List every object** in the system (weapons, units, items, spells)
2. **Choose a baseline** — the simplest, cheapest object
3. **Identify all attributes** that contribute to value (damage, speed, range, utility, special effects)
4. **Assign relative weights** to each attribute (this is the art — requires playtesting)
5. **Calculate total value** for each object: `total_value = sum(attribute * weight)`
6. **Plot cost vs. total_value** on a scatter chart
7. **Fit a curve** — linear, polynomial, or exponential depending on the system
8. **Identify outliers** — objects above the curve are overtuned; below are undertuned

### Key Principles

- **A negative benefit is a cost.** Keep all numbers positive and add. Don't subtract. Easier math, same result.
- **Intentional outliers create interesting choices.** A cheap item that's situationally excellent is a feature, not a bug — but document it.
- **The curve shape matters.** Linear curves feel predictable. Exponential curves make high-end items feel dramatic but risk making low-end irrelevant.

### Template: Balance Spreadsheet

```
| Object  | Cost | Attr_A | Attr_B | Attr_C | Weighted_Value | Delta |
|---------|------|--------|--------|--------|----------------|-------|
| Dagger  | 10   | 5      | 8      | 0      | 13.0 (baseline)| 0     |
| Sword   | 25   | 12     | 5      | 2      | 26.5           | +1.5  |
| Axe     | 30   | 18     | 3      | 1      | 28.0           | -2.0  |
| Staff   | 20   | 3      | 4      | 15     | 31.0           | +11.0 |
```

- **Delta** = difference from expected value at that cost point on the fitted curve
- Large positive delta = overtuned (too much value for cost)
- Large negative delta = undertuned (not enough value for cost)
- Flag any delta > 15% of expected value for review

---

## Transitive vs. Intransitive Systems

Most games combine both. Know which you're building.

### Transitive (Power Hierarchy)

Objects are strictly ordered by power, balanced by cost.

- A $500 sword is better than a $100 sword — that's intentional
- Balance question: "Is the power increase proportional to the cost increase?"
- Tool: Cost Curve (above)
- Risk: If cost is easy to acquire, the hierarchy collapses and only the top item matters

### Intransitive (Counter Relationships)

No single option is best — effectiveness depends on what the opponent chooses.

- Rock-Paper-Scissors is the canonical example
- Balance question: "Is every option in a cycle? Does anything dominate?"
- Tool: Payoff Matrix (below)
- Risk: If one option beats 2/3 of the field, the cycle breaks

### Payoff Matrix

For intransitive systems, build a matrix of every option vs. every other option:

```
         | Rock | Paper | Scissors |
---------|------|-------|----------|
Rock     |  0   |  -1   |   +1     |
Paper    | +1   |   0   |   -1     |
Scissors | -1   |  +1   |    0     |
```

**Checks:**
- [ ] No row sums to positive (no dominant strategy)
- [ ] No row sums to negative (no dominated strategy)
- [ ] Cycles are truly circular — trace every chain
- [ ] With more than 3 options, verify no subset forms a dominant cluster

**At scale:** Simulate 1000+ matchups per pair. Statistical win rates should converge near 50% for balanced intransitive systems.

---

## Economy Design

Economies are third-order design: you build a system → players create emergent behaviors → the combination is the actual experience.

### Four Mechanisms

| Mechanism | Example | Balance Lever |
|-----------|---------|---------------|
| **Generation** (sources) | Mining, quest rewards, loot drops | Rate, caps, diminishing returns |
| **Destruction** (sinks) | Crafting costs, repair fees, consumables | Cost scaling, durability |
| **Trading** | Auction house, direct trade | Transaction fees, trade restrictions |
| **Zero-sum** | PvP loot, contested resources | Risk/reward ratio |

### Health Check

```
generation_rate > destruction_rate → inflation (prices rise, currency devalues)
destruction_rate > generation_rate → deflation (hoarding, new players locked out)
```

- [ ] Every source has a corresponding sink
- [ ] Sinks feel meaningful (not just taxes)
- [ ] New player earning rate enables meaningful participation
- [ ] Veteran stockpiling can't break the economy for newcomers
- [ ] Rewards encourage intended play (not degenerate optimization)
- [ ] Extrinsic rewards don't displace intrinsic satisfaction (mastery, discovery)

---

## Dominant Strategy Detection

A dominant strategy is any approach that's optimal regardless of context. It kills meaningful choice.

### Warning Signs

- [ ] One option has the highest pick rate across all skill levels
- [ ] Community consensus on a "best build" with no viable alternatives
- [ ] Win rate for one strategy/character exceeds others by >5% at comparable skill
- [ ] Players feel punished for experimenting

### Diagnostic Steps

1. **Check the cost curve** — is the dominant option above the curve?
2. **Check for hidden synergies** — does it combo with common elements disproportionately?
3. **Check the meta context** — is it dominant because alternatives are weak, or because it's inherently too strong?
4. **Check skill floors** — is it dominant because it's easy to execute, not because it's powerful? (This might be acceptable)

### Fixes (in preference order)

1. **Buff alternatives** before nerfing the dominant option (preserves player investment)
2. **Add a cost** the dominant option doesn't currently pay
3. **Introduce a counter** in the intransitive web
4. **Nerf directly** as last resort (communicate why)

---

## Tuning Workflow

When balance needs adjustment mid-development:

1. **Identify the symptom** — what feels wrong from the player's perspective?
2. **Gather data** — pick rates, win rates, churn points, player feedback
3. **Locate on the cost curve** — is the problem object an outlier?
4. **Hypothesize a cause** — overtuned stats? Missing counter? Economic inflation?
5. **Make ONE change** — isolate variables
6. **Playtest at both novice and expert levels** — balance is skill-dependent
7. **Measure again** — did the symptom improve without creating new ones?
8. **Iterate** — balance is never "done"

**Common mistakes:**
- Balancing for the "average" player (bimodal skill distributions mean the average doesn't exist)
- Changing multiple variables at once (impossible to attribute results)
- Ignoring emergent player-driven strategies
- Sequential content releases without power creep checks

---

## Cross-References

- **game-design** — 5-Component Framework for evaluating if balance changes serve the player experience
- **progression-systems** — Power curves interact directly with balance; changes in one affect the other
- **experience-design** — Balance exists to serve engagement, not mathematical purity
- **playtest-design** — Methods for gathering the data that informs balance decisions

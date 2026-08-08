---
name: game-design
description: "The hub and first pass on any single mechanic: the 5-Component Filter (Clarity, Motivation, Response, Satisfaction, Fit), the plugin-wide Numbers Policy, the state-machine checklist, and a symptom-to-skill debugging table. Use when designing or critiquing one player-facing feature, comparing two implementations of the same mechanic, proposing any numeric value, or when told something 'feels wrong' and you need to find which layer is at fault before tuning anything. Also holds the routing map for every other dm-game skill — start here when unsure which skill applies."
---

# Game Design Framework

**Purpose:** Central evaluation framework for game mechanics. Use this as the **first pass** on any feature — the 5-Component Filter identifies what's weak, then specialized skills provide deep guidance.

**Core principle:** Mechanics are code. Gameplay is the player's *experience* of that code. The goal is not to implement features, but to implement **Relevance**.

**Sources:** The 5-Component Filter is this plugin's own synthesis and has no external citation — treat it as a working framework, not received wisdom. Its inputs: Clarity and Satisfaction draw on Celia Hodent, *The Gamer's Brain* (2017); Response draws on Steve Swink, *Game Feel* (Morgan Kaufmann, 2008); Fit draws on the MDA framework (Hunicke, LeBlanc & Zubek, 2004).

---

## Quick Reference: The 5-Component Filter

Before implementing or critiquing ANY game feature, evaluate against:

| Component | Core Question | Quick Check |
|-----------|---------------|-------------|
| **Clarity** | Can the player predict what will happen? | Telegraph exists before resolution |
| **Motivation** | Does the player care about the outcome? | Outcome affects persistent state |
| **Response** | Do player inputs matter? | Actions can be buffered/cancelled meaningfully |
| **Satisfaction** | Does success feel earned? | Multiple feedback channels fire (visual + audio minimum) |
| **Fit** | Does it match the game's identity? | Weight, timing, audio match entity type |

**Conflict priority:** Response > Clarity > Satisfaction > Fit > Motivation

For detailed evaluation rubrics, consult `references/5-component-rubric.md`.

---

## Operating Protocol

### 1. Before Implementation

1. **Check system context** — Which system does this feature participate in? What other systems does it interact with? (See **systems-design** for interaction analysis)
2. Identify active domain(s) from `references/domain-guide.md`
3. Evaluate against the 5-Component Filter
4. Complete the State Machine Checklist if the feature involves player state changes
5. Check the Numbers Policy before proposing any values

### 2. Numbers Policy (Mandatory, plugin-wide)

Every numeric value — timing window, cost, drop rate, growth exponent, threshold —
must declare one of three postures:

| | Posture | Requires |
|---|---|---|
| **A** | Source-backed | A checkable citation: book, GDC talk, published postmortem, paper |
| **B** | Starting value | An explicit label, a test, a pass/fail metric, and the direction to move on failure |
| **C** | Measured on this game | The sample size and the date it was measured |

**Forbidden:** "industry standard," "common practice," "most games," or any
number with no posture at all. An unlabelled number reads as sourced whether it
is or not — that is the failure mode, not the guess itself.

**This binds every skill in dm-game, not just this one.** Full contract,
worked examples, and the assumption-labelling format:
`references/numbers-policy.md`.

### 3. Assumption Labeling

When critical information is missing, state explicitly:

```
ASSUMPTION: [what you're assuming]
IMPACT: [why it matters to the design]
IF WRONG: [failure mode]
VALIDATE: [how to check quickly]
```

### 4. Research Triggers

Search before proposing when:
- About to claim "best practice" or "standard approach"
- Balance/economy values need benchmarks
- Accessibility requirements apply
- Comparative references needed from similar games

If search unavailable, convert to "Assumption + Test Plan" format.

---

## State Machine Checklist

For ANY feature that changes player state (movement abilities, combat actions, status effects):

| Property | Must Define |
|----------|-------------|
| **Entry conditions** | What states can transition INTO this? |
| **Exit conditions** | What ends this state? (timer, input, external event) |
| **Interruptibility** | What can cancel this? (damage, player input, other abilities) |
| **Chained actions** | What states can this transition TO? |
| **Resource cost** | What is consumed on entry? On sustain? |
| **Edge cases** | Behavior on: slopes, ceilings, moving platforms, during hitstun, at resource zero |

---

## Debugging Protocol

When told "it feels wrong/boring/clunky," diagnose in order:

| Symptom | Check First | Before Tuning Numbers | Deep Dive |
|---------|-------------|----------------------|-----------|
| "I didn't know that would happen" | Clarity | Add telegraph, audio cue, UI indicator | **player-ux** |
| "I don't care" | Motivation | Connect to progression, increase stakes | **experience-design** |
| "It feels laggy" | Response | Add buffering, allow cancels, reduce lockouts | **game-feel** |
| "It feels weak" | Satisfaction | Add feedback channels (minimum 2) | **game-feel** |
| "It doesn't fit" | Fit | Adjust timing, weight, audio texture | **game-feel** |
| "It's not balanced" | Balance | Check cost curves, dominant strategies | **game-balance** |
| "It's boring" | Engagement | Check loop, pacing, meaningful choice | **experience-design** |
| "It's too hard/easy" | Progression | Check flow channel, difficulty curve | **progression-systems** |

**Rule:** Do not tune damage/timing numbers until Clarity and Response are verified as not the root cause.

---

## Playtest Requirements

Every significant feature must include scenarios for:

1. **New player test:** Can they infer the rules without being told?
2. **Stress test:** Spam inputs, boundary conditions, edge cases
3. **Skill test:** Can mastery improve outcomes meaningfully?
4. **Abuse test:** Can this be exploited to skip content or trivialize risk?
5. **Readability test:** Can an observer understand what happened and why?

---

## Red Flags (Stop and Clarify)

- State machine transitions are undefined ("works from any state")
- Multiplayer authority is unspecified
- Economy/currency feature has no balance targets
- Camera behavior during action is undefined
- Feature scope is actually 3+ features in disguise

---

## Definition of Done

- [ ] 5-Component Filter evaluated and documented
- [ ] State Machine Checklist completed (if applicable)
- [ ] Edge cases enumerated and handled
- [ ] Minimum 2 feedback channels for significant actions
- [ ] Playtest script written and smoke-tested
- [ ] Numbers justified per Numbers Policy

---

## Output Structure

When proposing or critiquing a feature:

1. **Player Goal & Context** — What is the player trying to do and why?
2. **System Rules** — Core behavior, failure conditions, edge cases
3. **5-Component Evaluation** — Which components are strong/weak?
4. **Risks & Abuse Cases** — What could break or be exploited?
5. **Playtest Scenarios** — How to validate quickly
6. **Tuning Priority** — What to adjust first if it doesn't feel right

---

## Related Skills

This skill is the hub. The full index of which skill answers which question —
by question, by stage, and the layer pairs where two skills cover the same
ground at different altitudes — lives in `references/routing-map.md`.

Read it once; it is the only place the routing is written down, so adding a
skill touches one file rather than twenty.

## Reference Files

For detailed guidance:

- **`references/worked-examples.md`** - Full pipeline examples: vision → systems → evaluation, diagnostic flows, council debate format
- **`references/5-component-rubric.md`** - Full evaluation rubrics with signals, rules, knobs, acceptance tests
- **`references/domain-guide.md`** - Combat, movement, camera, audio, UI/UX, progression, persistence domains
- **`references/templates.md`** - Edge case enumeration, debugging flow, playtest scripts

---
name: experience-design
description: "Engagement loop design, pacing frameworks, the experience triangle, emotion layering, and meaningful choice evaluation. Use when designing core loops, evaluating why gameplay feels flat, structuring emotional arcs, or answering 'why isn't this fun?'"
---

# Experience Design

**Purpose:** Tools for designing, diagnosing, and improving the player *experience* — not the feature set. Games are systems that generate experiences; this skill helps you build better generators.

**Influences:** Frameworks here draw on work by Tynan Sylvester (experience engineering, emergent systems), Celia Hodent (cognitive engagement), and Ian Schreiber (balance in service of fun).

---

## When to Activate

Use this skill when:
- Designing or evaluating a core gameplay loop
- Something "works" mechanically but doesn't feel engaging
- Planning the emotional arc of a level, session, or campaign
- Evaluating whether a mechanic creates meaningful choices
- A feature is technically complete but players aren't having fun
- Deciding what to cut vs. what to keep

---

## Core Framework: The Experience Triangle

Every moment of gameplay is the product of three forces:

```
        Mechanics
       (what players do)
          /    \
         /      \
        /        \
   Fiction ——— Feedback
 (what it means)  (what players perceive)
```

- **Mechanics** — The systems and rules. What inputs are available? What outcomes are possible?
- **Fiction** — The narrative and thematic wrapper. What does this action *mean* in the game world?
- **Feedback** — What the player sees, hears, and feels in response. How does the system communicate?

**Diagnostic:** When something feels wrong, identify which vertex is weak:

| Symptom | Weak Vertex | Fix Direction |
|---------|-------------|---------------|
| "I don't know what to do" | Mechanics (unclear rules) | Simplify options, add tutorials |
| "I don't care" | Fiction (no meaning) | Connect to stakes, add narrative weight |
| "Did that work?" | Feedback (no response) | Add visual/audio/haptic confirmation |
| "It's boring" | Mechanics + Fiction gap | Close the gap — make actions feel consequential |
| "It's confusing" | All three misaligned | Strip back and realign around one clear experience |

---

## The Engagement Loop

Every game runs on loops. The tightest one is the core engagement loop:

```
Action → Feedback → Evaluation → Decision → Action ...
```

1. **Action** — Player does something (the mechanic)
2. **Feedback** — System responds (perceivable, timely, proportional)
3. **Evaluation** — Player assesses the outcome (cognitive processing)
4. **Decision** — Player chooses what to do next (meaningful choice)

### Loop Health Check

- [ ] Can a player complete the loop in < 10 seconds? (Core loop should be fast)
- [ ] Is the feedback immediate and perceivable?
- [ ] Does evaluation involve genuine uncertainty? (If outcome is always obvious, the loop is dead)
- [ ] Does the decision feel like a real choice? (Not "one right answer")
- [ ] Does the loop build toward a larger loop? (Session loop, progression loop)

### Nested Loop Structure

```
Core loop:     move → shoot → evaluate → reposition     (seconds)
Session loop:  mission → rewards → loadout → next mission  (minutes)
Meta loop:     campaign → unlock → new content → campaign   (hours/days)
```

Each loop should be satisfying on its own while feeding into the next.

---

## Emotion Layering

The best moments layer multiple emotions simultaneously. Design for this:

1. **Name the primary emotion** — not "fun" (too vague), but *mastery satisfaction*, *discovery delight*, *social triumph*, *creative pride*
2. **Add a contrasting undercurrent** — tension + anticipation, relief + pride, curiosity + apprehension
3. **Use fiction to bridge them** — narrative context turns mechanical outcomes into emotional ones
4. **Leave room for emergence** — don't over-specify; let the system surprise

**Anti-pattern:** Designing for "fun." Fun is an umbrella over dozens of specific emotions that require different design approaches.

---

## The Elegance Test

For any mechanic or feature, evaluate:

```
Elegance = Emotional Payoff / (Player Attention Cost + Development Cost)
```

| Factor | Question |
|--------|----------|
| **Emotional payoff** | What does the player feel? How intensely? How often? |
| **Attention cost** | How much must the player learn, remember, and track? |
| **Development cost** | How much effort to build, tune, and maintain? |

- **High elegance:** Simple to learn, cheap to build, produces rich emotional variety
- **Low elegance:** Complex to understand, expensive to build, produces tepid engagement

**Decision rule:** If a feature scores low on elegance, either simplify it or cut it. Complexity is a budget — spend it on what matters.

---

## Meaningful Choice Evaluation

A choice is meaningful when:

1. **The player understands the options** (clarity)
2. **The options have different consequences** (differentiation)
3. **The consequences matter** (stakes)
4. **No option is obviously best** (tension)
5. **The player has enough information to reason but not to solve** (uncertainty)

### Choice Diagnostic

| Question | If "No" |
|----------|---------|
| Can the player understand what each option does? | Clarity problem — simplify or explain |
| Do the options lead to genuinely different outcomes? | False choice — collapse or differentiate |
| Does the outcome affect something the player cares about? | Stakes problem — raise consequences |
| Is there a dominant option? | Balance problem — see **game-balance** |
| Is the outcome fully predictable? | Determinism problem — add uncertainty or hidden information |

---

## Pacing

Pacing is cognitive load management across time.

### The Tension Curve

```
Intensity
    |     /\        /\  /\
    |    /  \  /\  /  \/  \
    |   /    \/  \/        \___
    |  /
    | /
    +---------------------------→ Time
     Intro  Rising  Climax  Rest
```

**Principles:**
- **Peaks need valleys.** High-intensity moments are meaningless without contrast
- **Valleys are active.** Rest periods aren't empty — they're exploration, narrative, planning, customization
- **Escalate across sessions.** Each session's peak should be slightly higher than the last
- **Respect encoding time.** After introducing a new mechanic or concept, give the player space to practice before adding more

### Pacing Checklist

- [ ] Does the first 5 minutes teach through *doing*, not *reading*?
- [ ] Is there a clear rhythm of tension and release?
- [ ] After each new concept, is there practice time before the next one?
- [ ] Do difficulty spikes coincide with new tools/abilities (not just harder enemies)?
- [ ] Is there a moment of "earned rest" after each major challenge?

---

## "Why Isn't This Fun?" Diagnostic

When a mechanic works correctly but doesn't engage, run through in order:

1. **Is the core loop running?** (Action → Feedback → Evaluation → Decision)
   - If any step is broken, fix that first
2. **Is there a meaningful choice?** Run the Choice Diagnostic above
3. **Check the Experience Triangle** — which vertex is weak?
4. **Check pacing** — is this moment in a valley that's gone on too long? Or a peak with no buildup?
5. **Check elegance** — is the attention cost too high for the payoff?
6. **Check emotion targets** — what *specific* emotion should this produce? Is the mechanic actually capable of producing it?
7. **Check context** — is the fiction supporting or undermining the mechanic?

**If all seven check out and it still isn't fun:** The mechanic may simply not be interesting. Consider cutting it and redirecting the complexity budget elsewhere.

---

## Narrative Integration

Three approaches to narrative, each with different design implications:

| Mode | Control | Replayability | Design Challenge |
|------|---------|---------------|------------------|
| **Scripted** | High (author-controlled) | Low | Don't let narrative contradict mechanics |
| **Environmental** | Medium (player-discovered) | Medium | Reward exploration without requiring it |
| **Emergent** | Low (system-generated) | High | Build systems that produce story-worthy events |

**The dissonance test:** If the story says one thing and the mechanics reward another, players will follow the mechanics and resent the story. Align them or cut the conflict.

---

## Cross-References

- **game-design** — 5-Component Framework for evaluating individual mechanics
- **game-feel** — Feedback vertex of the Experience Triangle in detail
- **player-ux** — Cognitive load management that underpins pacing
- **progression-systems** — Session and meta loop pacing through difficulty and rewards
- **playtest-design** — Testing whether the experience matches your intent

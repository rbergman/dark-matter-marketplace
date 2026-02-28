---
name: playtest-design
description: "Question generation for playtests, what to observe vs. ask, metrics to track, and how to interpret playtest data without confirmation bias. Use when planning a playtest session, designing a feedback survey, setting up analytics, or when you have playtest data and need to make decisions from it."
---

# Playtest Design

**Purpose:** Get useful signal from playtests. Most playtest sessions are wasted — observers confirm what they already believe, ask leading questions, and draw conclusions from noise. This skill provides structured methods to avoid those traps.

**Influences:** Frameworks here draw on work by Celia Hodent (UX research methodology, perception/attention/memory testing), Ian Schreiber and Brenda Romero (metrics-driven iteration, statistical validation), and Tynan Sylvester (emergent behavior observation, planning under uncertainty).

---

## When to Activate

Use this skill when:
- Planning a playtest session (what to test, who to recruit, what to measure)
- Designing post-playtest surveys or interview questions
- Setting up analytics/metrics for ongoing data collection
- Interpreting playtest results and deciding what to change
- Resolving team disagreements about what the data shows

---

## Core Principle: Observe, Then Ask

Players are reliable reporters of their *experience* (what they felt) but unreliable reporters of *causes* (why they felt it). Design your process accordingly.

```
Most Reliable ←———————————————→ Least Reliable
  What they did    What they felt    Why they think
  (behavior)       (experience)      they felt it
                                     (attribution)
```

**Hierarchy of evidence:**
1. **Behavioral data** — what players actually did (metrics, video, observation)
2. **Experience reports** — what players say they felt ("I was frustrated," "that was exciting")
3. **Causal attribution** — what players think caused their experience ("the controls are bad")

Players attributing frustration to "bad controls" might actually be experiencing a perception failure (they couldn't see the indicator) or a pacing problem (too many new concepts at once). Use behavior to diagnose; use self-report to locate.

---

## Question Generation Framework

### The Three-Pillar Method

Generate questions along the perception → attention → memory pipeline:

**Perception Questions** (Did they see it?)
- Did the player notice [critical UI element / feedback / environmental cue]?
- How long before they noticed?
- Did they look at it before acting or after?
- Did they confuse it with something else?

**Attention Questions** (Did they focus on the right thing?)
- Where was the player looking during [critical moment]?
- Did they engage with [intended system] or get distracted by [ancillary system]?
- Did they understand what was important vs. optional?
- Was there a moment where they seemed overwhelmed?

**Memory Questions** (Will they retain it?)
- After a break, can they recall how to [key mechanic]?
- Did they apply a lesson learned earlier to a later challenge?
- Did they remember the goal after a distraction?
- Can they explain the core rules to someone else?

### Stage-Specific Questions

| Dev Stage | Focus | Key Questions |
|-----------|-------|---------------|
| **Prototype** | Core loop viability | Is the core action inherently interesting? Do they want to do it again? |
| **Alpha** | System comprehension | Do they understand the rules? Can they make intentional decisions? |
| **Beta** | Pacing and polish | Does the session arc feel right? Where do they get bored or frustrated? |
| **Pre-launch** | Edge cases and balance | What breaks? What's exploitable? What did we miss? |

---

## Observation Protocol

### What to Watch (Not Ask)

| Observable | What It Tells You |
|------------|-------------------|
| **First action** | What the UI communicates as "start here" |
| **Hesitation points** | Where clarity fails or cognitive load spikes |
| **Repeated failures** | Where difficulty exceeds skill (or UI is misleading) |
| **Where they look** | What's grabbing attention (intended or not) |
| **Body language** | Leaning in = engaged; leaning back = disengaged; fidgeting = frustrated |
| **Utterances** | Unprompted comments ("what?", "oh!", "come on") are gold |
| **Where they quit** | The most valuable data point you'll collect |
| **What they skip** | Content they ignore reveals priority mismatches |

### The Silent Observer Protocol

1. **Say nothing** unless they're about to break the test setup
2. **Don't explain** — if they're confused, that's data
3. **Don't reassure** — "you're doing great" biases the session
4. **Note timestamps** — when you feel the urge to help, write down the time and why
5. **Record everything** — your memory of the session will be biased toward your expectations

---

## Metrics to Track

### Core Metrics (Track Always)

| Metric | What It Measures | Warning Signal |
|--------|-----------------|----------------|
| **Session length** | Engagement | Bimodal distribution (some quit fast, some stay long) |
| **Quit points** | Pain points | Cluster of quits at same location/moment |
| **Completion rate** | Difficulty/clarity | < 70% on intended-critical-path content |
| **Time per section** | Pacing | Sections taking 2x+ longer than designed |
| **Death/failure rate** | Difficulty curve | Spike = wall; zero = too easy |

### Balance Metrics (When Tuning Systems)

| Metric | What It Measures | Warning Signal |
|--------|-----------------|----------------|
| **Pick rate by option** | Strategy diversity | One option > 50% pick rate |
| **Win rate by strategy** | Balance | Any strategy > 55% win rate at comparable skill |
| **Average game/match length** | Pacing | Games consistently shorter or longer than intended |
| **Resource accumulation rate** | Economy health | Exponential growth = inflation incoming |
| **Strategy churn** | Meta health | If dominant strategy shifts too fast, balance is noisy |

### UX Metrics (When Testing Comprehension)

| Metric | What It Measures | Warning Signal |
|--------|-----------------|----------------|
| **Time to first meaningful action** | Onboarding quality | > 60 seconds before the player *does* something |
| **Tutorial completion rate** | Tutorial design | < 90% = tutorial is the problem, not the player |
| **Hint/help usage** | Clarity | High usage = UI isn't communicating; zero usage = help system is invisible |
| **Error rate on intended actions** | Usability | Player tries to do the right thing but fails due to UI |

---

## Avoiding Confirmation Bias

The biggest threat to useful playtest data is your own expectations.

### Pre-Test Protocol

Before the session:
1. **Write down your predictions** — what do you expect to happen?
2. **Define "surprising" outcomes** — what would change your mind?
3. **Assign a skeptic** — one team member whose job is to challenge interpretations
4. **Pre-commit to sample size** — decide how many sessions before drawing conclusions (minimum 5 for qualitative, 30+ for quantitative)

### Post-Test Protocol

After the session:
1. **Review predictions vs. reality** — where were you wrong? Those are the insights.
2. **Separate observation from interpretation** — "Player hesitated for 8 seconds at the door" (observation) vs. "Player didn't understand the door mechanic" (interpretation)
3. **Look for disconfirming evidence** — actively search for data that contradicts your preferred narrative
4. **Quantify before concluding** — "it felt like everyone struggled" vs. "3 of 7 players failed this section"
5. **Delay solutions** — understand the problem fully before proposing fixes

### Common Bias Traps

| Trap | Mechanism | Counter |
|------|-----------|---------|
| **Anchoring** | First session dominates your impression | Review all sessions before concluding |
| **Availability** | Dramatic moments overshadow quiet ones | Use metrics, not memory |
| **Projection** | Attributing your own experience to players | Watch what they *do*, not what you'd do |
| **Sunk cost** | Defending features you spent time on | Ask "would we add this today?" not "should we cut this?" |
| **Survivorship** | Only hearing from players who stayed | Track quit points with equal priority |

---

## Survey Design

### Good Questions (Experience-Focused)

- "How would you describe the experience in one word?"
- "What moment stands out most?" (Then probe: "What made it stand out?")
- "Was there a point where you wanted to stop? What was happening?"
- "What would you do differently on a second playthrough?"
- "Rate how [specific emotion] you felt during [specific moment]" (1-5 scale)

### Bad Questions (Leading or Attributive)

- "Did you find the controls intuitive?" (Leading — assumes controls are the issue)
- "What would you change?" (Too broad — gets surface-level answers)
- "Did you like it?" (Binary, social pressure toward "yes")
- "Was it too hard?" (Leading — frames difficulty as the variable)
- "What features would you add?" (Players aren't designers; this generates noise)

### The One-Question Shortcut

If you can only ask one question: **"Tell me about a moment that stood out — good or bad."**

Then follow up with: "What were you trying to do?" and "What happened next?"

---

## Interpreting Data

### Decision Framework

| Signal | Confidence | Action |
|--------|------------|--------|
| Metrics + observation + self-report all agree | High | Act on it |
| Metrics show it, observation confirms, self-report disagrees | Moderate-High | Trust behavior over self-report |
| Self-report says it, but metrics/observation don't show it | Low | Investigate further — the report may point to a *different* real problem |
| Single session shows it, others don't | Very Low | Note it but don't act — one data point isn't a pattern |

### Sample Size Guidance

- **5-8 sessions** — finds ~85% of major usability problems
- **15-20** — identifies behavioral patterns
- **30+** — minimum for quantitative conclusions (win rates, balance)
- **A/B tests** — require statistical power calculation; varies by effect size

---

## Cross-References

- **game-design** — Playtest scenarios from the 5-Component Framework (new player, stress, skill, abuse, readability tests)
- **player-ux** — The cognitive pillars (perception/attention/memory) drive the question generation framework
- **game-balance** — Metrics-driven iteration for detecting and resolving balance problems
- **experience-design** — Testing whether the intended experience matches actual player experience
- **game-feel** — "Does this feel good?" requires observation, not surveys

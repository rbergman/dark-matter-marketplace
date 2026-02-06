---
name: team-refinement
description: Transform ambiguous specs into implementable work items through live adversarial debate using Agent Teams. Evolves dm-work:dialectical-refinement from sequential pipeline to simultaneous multi-agent debate. Use PROACTIVELY for l/xl complexity tasks.
---

# Team Refinement

Team-based adversarial spec refinement using Agent Teams. This evolves `dm-work:dialectical-refinement` from sequential pipeline to live debate.

## Why Teams > Pipeline

The original dialectical-refinement runs 5 sequential phases (Analyst->Proposer->Advocate->Scope Lock->Judge) where each phase sees only the previous output. This prevents self-reinforcing mistakes but loses the back-and-forth of genuine argument. With Agent Teams, debaters are persistent -- the Advocate can push back on the Proposer *while the Proposer is still formulating*, creating richer adversarial tension.

## When to Use

| Complexity | Mechanism |
|-----------|-----------|
| xs/s | Skip refinement entirely |
| m | Use dm-work:dialectical-refinement (2-phase, lightweight) |
| l/xl | Use team-refinement (full debate) |

## Team Composition

| Role | Teammate | Model | Purpose |
|------|----------|-------|---------|
| Analyst | Teammate 1 | haiku | Surface ambiguity, identify gaps, tag protected items |
| Proposer | Teammate 2 | sonnet | Propose simplifications and cuts with confidence levels |
| Advocate | Teammate 3 | sonnet | Challenge cuts, defend scope, suggest cheap additions |
| Judge | Lead | opus | Moderate debate, enforce scope lock, synthesize final spec |

## Protected Categories

Carry over from dialectical-refinement:

| Category | Description |
|----------|-------------|
| Core Workflow | The minimal viable loop |
| Agent Primitives | Flags/features enabling agent autonomy (--json, --range, --auto) |
| User-Requested Features | Explicitly requested by user |
| Token Efficiency | Batch operations, context injection |
| Structured Output | Machine-parseable output |

## Debate Protocol

### Phase 1 -- Analysis (Analyst teammate)

- Read the spec/bead
- Surface ambiguity, undefined terms, implicit dependencies
- Tag protected items
- Share analysis with team

### Phase 2 -- Live Debate (Proposer + Advocate, simultaneous)

- Proposer reviews analysis, proposes cuts with confidence (Strong/Moderate/Weak)
- Advocate receives proposals and challenges each one
- They message each other directly -- genuine back-and-forth
- Lead monitors for convergence (when new messages add <10% new information)

### Phase 3 -- Scope Lock (Lead)

- Verify essential scope preserved using "Too Thin" indicators:
  - Fewer than 5 commands/features for a system?
  - Removed structured output (--json)?
  - Removed range/anchor/batch capabilities?
  - All m+ tasks cut to xs/s?
- If 2+ indicators trigger, tell Advocate to argue harder, resume debate
- HITL checkpoint: Use AskUserQuestion if significant scope decisions remain

### Phase 4 -- Synthesis (Lead)

- Resolve remaining debates
- Write concrete implementation details
- Define testable acceptance criteria
- Document OUT OF SCOPE explicitly
- Quality gate: GO / GO with caveats / REVISE

## Output Format

Same as dialectical-refinement for compatibility:

```markdown
## Introduction
[What + Why in 2-3 sentences]

## Scope
[What's being built]

## Acceptance Criteria
[Testable outcomes]

## Out of Scope
[Explicit boundaries]

## Appendix A: Project Context (if needed)
[Token-efficient big picture: ~100-200 words max]
```

## Anti-patterns

- **Proposer and Advocate agreeing too quickly** -- reframe perspectives
- **Analyst doing too much work** -- keep analysis phase fast with haiku
- **Lead implementing during debate** -- stay in delegate mode
- **Skipping scope lock** -- Too Thin indicators exist for a reason
- **Running team refinement for xs/s tasks** -- use subagent pipeline or skip

## Related Skills

- **dm-work:dialectical-refinement** - Sequential alternative
- **dm-team:council** - General deliberation
- **dm-team:compositions** - Team template

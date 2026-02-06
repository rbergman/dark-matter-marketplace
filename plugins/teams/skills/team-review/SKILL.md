---
name: team-review
description: Collaborative code review using Agent Teams where reviewers discuss findings, challenge each other, and converge on a unified assessment. Evolves dm-work:review from isolated parallel reviewers to a review team.
---

# Team Review

Team-based collaborative code review using Agent Teams.

## Why teams > parallel subagents

Current /dm-work:review spawns 3 isolated subagents that report back independently. Findings may conflict, duplicate, or miss connections between concerns. With Agent Teams, reviewers can:

- Challenge each other ("I flagged this as security, but arch says the pattern is intentional")
- Cross-pollinate ("the perf issue I found is caused by the architecture pattern you identified")
- Converge on unified severity ratings instead of potentially conflicting ones

## When to use

- Complex PRs touching multiple domains
- Security-sensitive changes where arch context matters
- When previous reviews produced conflicting findings
- For dm-work:review's use cases, see tiered-delegation — simple reviews are fine with subagents

## Team composition

| Role | Teammate | Model | Skills to inject |
|------|----------|-------|-----------------|
| Architecture | Teammate 1 | sonnet | dm-arch:solid-architecture, dm-arch:data-oriented-architecture |
| Code Quality | Teammate 2 | sonnet | Language-specific dm-lang:*-pro skill |
| Security | Teammate 3 | sonnet | (none — general security knowledge) |
| Lead | You | opus | Synthesis and final assessment |

Code reviewer may split by domain (same as dm-work:review) for large reviews.

## Scout phase

Still uses a haiku Explore subagent (not a teammate — too small for team overhead). Scout categorizes files, detects patterns, identifies hotspots, splits review domains.

## Review protocol

### Phase 1 — Scout (haiku subagent, same as dm-work:review)

- Categorize files, detect project type, identify hotspots
- Split into review domains with skill assignments

### Phase 2 — Independent review (teammates work in parallel)

- Each reviewer examines their domain
- Produces initial findings with severity and confidence

### Phase 3 — Cross-examination (teammates message each other)

- Reviewers share findings with the team
- Challenge findings they disagree with
- Identify connections between concerns
- Adjust severity based on cross-domain context
- 1-2 rounds of discussion

### Phase 4 — Unified assessment (lead synthesizes)

- Merge findings, resolve conflicts
- Apply severity filter (--min-severity)
- Deduplicate by file+line
- Produce final assessment

## Output format

Compatible with dm-work:review:

```markdown
## Review: <scope> (<N> commits, <LOC> across <M> files)

### Verdict: <emoji> <summary>

**Critical** (<count>)
1. `file:line` - <description> [Consensus: arch+security agreed]

**High** (<count>)
...

**Architecture**: <verdict + summary>
**Code Quality**: <verdict + summary>
**Security**: <verdict + summary>

### Review Discussion Notes
[Key debates between reviewers and resolutions]
```

New addition: "Review Discussion Notes" section captures inter-reviewer debates and resolutions — this is the unique value of team review over subagent review.

## Supports

- `--pr N` for PR mode (GitHub review comments)
- `--commits <range>` for explicit scope
- `--only <acs>` to filter reviewer types
- `--min-severity <level>` to filter output
- `--skip-beads` for local mode without bead creation

## Related

- **dm-work:review** — subagent alternative
- **dm-team:compositions** — review team template

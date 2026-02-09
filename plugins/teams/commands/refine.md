---
description: Run team-based adversarial refinement on a bead or spec using Agent Teams debate
argument-hint: "bead ID or spec file path"
---

# /refine

Run team-based adversarial spec refinement.

Arguments: $ARGUMENTS

## Protocol

### 1. Parse Target

- Bead ID -> `bd show <id>`
- File path -> read file
- No args -> check conversation for current spec context

### 2. Assess Complexity

- **xs/s** -> "This doesn't need refinement. Proceed to implementation."
- **m** -> "Medium complexity -- using 2-phase dm-work:dialectical-refinement instead." Run /dm-work:refine.
- **l/xl** -> Proceed with team refinement.

### 3. Gather Context

Read target spec, related files, existing beads for the project.

### 4. Create Team

Spawn Agent Team with Analyst (haiku), Proposer (opus), Advocate (opus). Lead acts as Judge.

- Include in each spawn prompt: the spec text, their role description, protected categories, instructions to debate with other teammates
- Require plan approval for the Analyst (fast review of analysis before debate starts)

### 5. Run Debate Protocol

Execute the debate protocol as described in the **refinement** skill:

1. **Analysis** -- Analyst surfaces ambiguity, tags protected items, shares with team
2. **Live Debate** -- Proposer proposes cuts, Advocate challenges, genuine back-and-forth until convergence
3. **Scope Lock** -- Lead checks Too Thin indicators, resumes debate if 2+ trigger, HITL checkpoint if needed
4. **Synthesis** -- Lead resolves debates, writes concrete spec with acceptance criteria

### 6. Produce Output

Synthesized spec in standard format:

```markdown
## Introduction
## Scope
## Acceptance Criteria
## Out of Scope
## Appendix A: Project Context (if needed)
```

### 7. Update Bead

If input was a bead, update with refined spec, add `refined` label.

### 8. Cleanup Team

Dismiss teammates after synthesis is complete.

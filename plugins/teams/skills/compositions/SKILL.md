---
name: compositions
description: Reusable team composition templates for common multi-agent workflows. Includes templates for research, review, refinement, implementation, and council teams, plus beads-teams bridge patterns.
---

# Team Compositions

Reusable team templates for common multi-agent workflows. Pick a template, adapt the roles, spawn the team.

## Team Templates

### Research Team (3 teammates)

| Role | Model | Responsibility |
|------|-------|---------------|
| Investigator A | sonnet | Primary research angle |
| Investigator B | sonnet | Alternative angle, different sources |
| Devil's Advocate | sonnet | Challenge findings, look for gaps |
| **Lead** | — | Synthesize findings into report |

**Use for:** library evaluation, architecture research, debugging with competing hypotheses.

The value is in the tension between investigators. Investigator A builds the case, Investigator B explores alternatives, and the Devil's Advocate stress-tests both. The lead synthesizes — not by averaging, but by judging which evidence holds up under scrutiny.

### Review Team (3 teammates)

| Role | Model | Responsibility |
|------|-------|---------------|
| Architecture Reviewer | sonnet | SOLID, module boundaries, dependency direction |
| Code Reviewer | sonnet | Bugs, logic errors, test coverage, conventions |
| Security Reviewer | sonnet | Vulnerabilities, secrets, injection, auth |
| **Lead** | opus | Merge findings, resolve conflicts between reviewers |

**Use for:** PR review, pre-merge review, audit.

See **dm-team:team-review** for full implementation.

Reviewers may disagree — the architecture reviewer wants an abstraction layer, the code reviewer says YAGNI. The lead (opus) resolves these tensions with judgment, not compromise.

### Refinement Team (3 teammates)

| Role | Model | Responsibility |
|------|-------|---------------|
| Analyst | haiku | Surface ambiguity, formalize spec |
| Proposer | sonnet | Suggest simplifications and cuts |
| Advocate | sonnet | Challenge cuts, defend scope |
| **Lead as Judge** | opus | Synthesize final spec |

**Use for:** spec refinement, epic scoping.

See **dm-team:team-refinement** for full implementation.

The Analyst finds the holes. The Proposer tries to shrink scope. The Advocate pushes back when cuts go too deep. The lead judges which cuts improve the spec and which gut it.

### Implementation Team (2-4 teammates)

| Role | Model | Responsibility |
|------|-------|---------------|
| Module Owner A-D | sonnet | Each owns a distinct set of files |
| **Lead** | — | Coordinate dependencies, merge shared files, run quality gates |

**Use for:** parallel feature implementation, cross-layer changes.

**CRITICAL:** Assign non-overlapping file sets per teammate. File ownership collisions cause merge conflicts and wasted tokens. The lead owns any shared files (interfaces, types, configs) and distributes them after coordinating with owners.

Example file ownership split:
```
Owner A: src/api/**
Owner B: src/ui/**
Owner C: src/db/**
Lead:    src/shared/**, package.json, tsconfig.json
```

### Council Team (3-5 teammates)

| Role | Model | Responsibility |
|------|-------|---------------|
| Perspective A-E | vary | Different viewpoints on a decision |
| **Lead** | — | Moderate debate, synthesize recommendation |

**Use for:** architecture decisions, trade-off analysis, spec review.

See **dm-team:council** for full implementation.

Use mixed models for epistemic diversity — different models emphasize different trade-offs. A haiku perspective often catches simplicity opportunities that larger models over-engineer.

## Model Selection Guide

| Role type | Recommended model | Why |
|-----------|------------------|-----|
| Research / scouting | haiku | Fast, cheap, good for information gathering |
| Implementation / debate | sonnet | Balanced capability and cost |
| Synthesis / judgment | opus | Highest quality for final decisions |
| Diverse perspectives | mixed | Model diversity = epistemic diversity |

When in doubt, default to sonnet for teammates and opus for leads that must make judgment calls. Use haiku for high-volume, low-stakes roles (scanning, listing, initial triage).

## Beads-Teams Bridge

Beads tracks persistent issues across sessions. Agent Teams coordinates within a session. They complement each other.

### Syncing beads state with Agent Teams task list

```bash
# Before team creation — load beads into task list
bd ready --json | jq -r '.[] | .id + ": " + .title'
# → Create corresponding team tasks with bead IDs in descriptions

# During team work — teammates reference bead IDs
# Teammate messages: "Completed work for bead dark-matter-marketplace-abc"

# After team cleanup — sync back to beads
bd close <id1> <id2> ... --reason "Completed by team"
bd sync
```

**Pattern:** beads = persistent cross-session state, Agent Teams tasks = session-level coordination. Beads survive session boundaries; team tasks do not. Always sync results back to beads before the session ends.

### Workflow

1. `bd ready` to identify open beads
2. Map beads to team tasks (include bead ID in each task description)
3. Spawn team, teammates work against tasks
4. Lead collects results, closes team tasks
5. `bd close` completed beads with reason
6. `bd sync` to persist state

## Teammate Profiles

Reusable spawn prompt fragments for composing team definitions. Each profile defines a role that can be dropped into any team template.

### Profile Format

```yaml
role: <role-name>
model: <haiku|sonnet|opus>
skills:
  - <skill-1>
  - <skill-2>
file_ownership:
  - <glob-pattern>
success_criteria:
  - <criterion-1>
  - <criterion-2>
prompt_fragment: |
  You are the <role-name>. Your job is to <responsibility>.
  You own these files: <file_ownership>.
  You succeed when: <success_criteria>.
  Activate these skills: <skills>.
```

### Example Profiles

```yaml
role: architecture-reviewer
model: sonnet
skills:
  - dm-arch:adr
  - dm-tool:mise
file_ownership: []
success_criteria:
  - All module boundaries are clean
  - Dependency direction is correct (inward)
  - No SOLID violations in public interfaces
prompt_fragment: |
  You are the Architecture Reviewer. Evaluate module boundaries,
  dependency direction, and SOLID compliance. Flag violations with
  severity (critical/warning/info). Do not review implementation
  details — that's the Code Reviewer's job.
```

```yaml
role: module-owner
model: sonnet
skills:
  - dm-work:subagent
file_ownership:
  - "src/api/**"
success_criteria:
  - All owned files compile and pass lint
  - Tests pass for owned modules
  - No changes outside owned file set
prompt_fragment: |
  You are a Module Owner. You own the files matching your assigned
  glob patterns. Make changes ONLY within your owned files. If you
  need changes to shared files, request them from the Lead. Run
  quality gates on your files before reporting completion.
```

```yaml
role: devils-advocate
model: sonnet
skills: []
file_ownership: []
success_criteria:
  - At least 3 substantive challenges raised
  - Each challenge includes a concrete failure scenario
  - No strawman arguments
prompt_fragment: |
  You are the Devil's Advocate. Your job is to find weaknesses in
  the team's conclusions. For every finding, ask: "What if this is
  wrong?" and "What are we missing?" Back challenges with concrete
  failure scenarios, not vague concerns.
```

Compose teams by selecting profiles and wiring them into a team template. Adjust file ownership and success criteria per project.

## Related Skills

- **dm-team:tiered-delegation** — When to use teams vs subagents vs single session
- **dm-team:team-review** — Full review team implementation
- **dm-team:team-refinement** — Full refinement team implementation
- **dm-team:council** — Full council team implementation
- **dm-work:orchestrator** — Delegation thresholds and subagent templates

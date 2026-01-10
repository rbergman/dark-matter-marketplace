# Epic Breakdown Command

Decompose an epic or external specification into implementable task beads with complexity-based labeling.

## Arguments

$ARGUMENTS - Either an epic bead ID (e.g., `bd-42`, `silica-state-bvt`) or a file path to a specification document

## Process

### Setup

1. Identify the target:
   - If argument looks like a bead ID (matches `bd-\w+` or `[a-z]+-\w+`), use `bd show <id> --json` to fetch the epic
   - If argument is a file path, read the file content
   - If no argument provided, ask the user what to break down

2. Set bd workspace context: `bd set-context /path/to/workspace`

3. Pre-refinement check:
   - If bead has `needs-refinement` label, run `/refine` first
   - If spec document lacks clear scope/acceptance criteria, run refinement pass

### Analysis

Before proposing breakdown, understand:

- **Scope**: What's explicitly in vs out?
- **Dependencies**: What external systems/APIs/data are involved?
- **Sequencing**: What must complete before other work can start?

If unclear on any, ask the user before proceeding.

**HITL CLARIFICATION PROTOCOL:**

When uncertainties block decomposition, use the `AskUserQuestion` tool:
- Provide 2-4 concrete options (not open-ended)
- Include trade-off descriptions for each option
- "Other" is always implicit for custom input

Example question structure:
```yaml
question: "How should error recovery be handled?"
options:
  - label: "Fail fast, user handles"
    description: "Minimal implementation, user sees raw errors"
  - label: "Graceful fallback with logging"
    description: "More code, better UX, easier debugging"
```

Structured questions prevent vague assumptions from affecting task scope.

### Propose Breakdown

For each proposed task, determine:

| Field        | Source                                          |
| ------------ | ----------------------------------------------- |
| Title        | Concise, action-oriented                        |
| Type         | task, feature, bug, or chore                    |
| Complexity   | xs, s, m, l, xl (see heuristics)                |
| Description  | 2-3 sentences                                   |
| Dependencies | Which tasks must complete first                 |
| Label        | `refined` (xs/s) or `needs-refinement` (m/l/xl) |

**Complexity Heuristics:**

- **xs** (extra-small): <50 lines, 1 file, obvious implementation
- **s** (small): <150 lines, 1-2 files, well-understood pattern
- **m** (medium): <500 lines, 3-5 files, some unknowns
- **l** (large): <1500 lines, 5-10 files, significant unknowns
- **xl** (extra-large): >1500 lines or architectural change → consider splitting into sub-epic

**Keywords that increase complexity:**

- "refactor", "migrate", "redesign" → +2 levels
- "integrate", "new system" → +1 level
- "fix", "update", "adjust" → baseline

### User Review

Present the proposed breakdown:

```
## Proposed Breakdown: [Epic Title]

| # | Task | Complexity | Label | Blocks |
|---|------|------------|-------|--------|
| 1 | [Title] | s | refined | - |
| 2 | [Title] | l | needs-refinement | - |
| 3 | [Title] | m | needs-refinement | #2 |

### Dependency Flow
Task 1 and Task 2 can start in parallel.
Task 3 requires Task 2 complete.

### Concerns
- [Any risks or assumptions needing validation]
```

Ask user to:

- Approve the breakdown
- Adjust complexity estimates
- Identify missing tasks
- Modify dependencies

**Single review iteration.** If user requests changes, adjust and re-present.

### Create Beads

Once approved, create task beads:

```bash
# For each task:
bd create "<title>" \
  -t task \
  -p <priority> \
  --description "<brief scope>" \
  --json

# Link to parent epic:
bd dep <task-id> <epic-id> --type parent-child

# Add blocking dependencies:
bd dep <task-id> <blocking-task-id> --type blocks

# Apply label:
bd update <task-id> --labels <refined|needs-refinement> --json
```

**Priority assignment:**

- Inherit from parent epic, OR
- Tasks with no blockers get higher priority
- Sequential tasks get decreasing priority

### Summary

After creating all beads:

```
## Breakdown Complete

**Source:** [Epic ID or spec file]

| ID | Title | Complexity | Label |
|----|-------|------------|-------|
| bd-101 | [Title] | s | refined |
| bd-102 | [Title] | l | needs-refinement |

**Dependency Chain:** bd-101 → bd-102 → bd-103

**Ready to Start:** bd-101 (no blockers, refined)

**Next Steps:**
- Claim bd-101 to begin implementation
- Run `/refine bd-102` before claiming (complexity: l)
```

## External Specs

When target is a file path:

1. **Analyze** the spec document
2. **Determine epic count:**
   - Single epic? → Create one epic bead, then break into tasks
   - Multiple epics? → Create epic beads with `needs-breakdown` label
3. **Present analysis:**

```
## Spec Analysis: [filename]

This specification contains [N] epic(s):

### Epic 1: [Title]
[Brief scope summary]
Estimated tasks: ~[N]

**Recommendation:** [Single epic | Multiple epics]

Shall I create epic bead(s) and proceed with breakdown?
```

4. **On approval:** Create epic bead(s), then run breakdown on each

## Error Handling

- **Epic not found:** Exit with "Bead not found. Run: bd list --type epic"
- **Epic already has children:** Warn user, ask whether to add more or abort
- **bd command failure:** Show error output, suggest manual fix

## Notes

- Keep tasks completable in 1-3 focused sessions
- Prefer more smaller tasks over fewer larger tasks
- If a task needs subtasks, it's probably an epic
- Minimize sequential dependencies to enable parallel work

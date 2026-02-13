# Dialectical Refinement Command

Transform an ambiguous specification into an implementable one through 4 adversarial passes.

## Arguments

$ARGUMENTS - Either a bead ID (e.g., `bd-42`) or a file path to a specification document

## Process

### Setup

1. Identify the target:
   - If argument looks like a bead ID (matches pattern `bd-\w+` or `[a-z]+-\w+`), use `bd show <id> --json` to fetch the spec
   - If argument is a file path, read the file content
   - If no argument provided, ask the user what to refine
2. Set bd workspace context: `bd set-context /path/to/workspace`

### Pass 1: Formalize (The Analyst)

**Role:** Surface ambiguity and missing details.

**Prompt:**

```
You are The Analyst reviewing a specification. Your job is to surface ambiguity and missing details.

Analyze this spec and identify:
1. Undefined or inconsistently used terms
2. Missing input/output contracts
3. What already exists vs genuinely new work (check the codebase)
4. Missing or weak acceptance criteria
5. Implicit dependencies

Produce a more detailed version of the spec with gaps explicitly called out.
Do NOT simplify or cut scope - that's the next pass's job.

SPEC TO ANALYZE:
<spec>
{current spec}
</spec>
```

**Clarification checkpoint:**

After Pass 1, review the output for major unknowns:

- Scope boundaries unclear (what's included vs excluded?)
- Architectural choices with trade-offs (which approach to take?)
- Must-have vs nice-to-have ambiguity

If ANY major unknowns exist, PAUSE and ask 1-3 focused questions. Do NOT proceed to Pass 2 carrying assumptions silently.

**User clarification protocol:**

When unknowns require user input, use the `AskUserQuestion` tool:
- Provide 2-4 concrete options (not open-ended)
- Include trade-off descriptions for each option
- "Other" is always implicit for custom input

Example question structure:
```yaml
question: "Which entities should be affected?"
options:
  - label: "Player only"
    description: "Simplest, avoids side effects"
  - label: "All entities"
    description: "Most realistic but may have performance implications"
```

Structured questions get clearer answers than assumptions.

### Pass 2: Simplify (The Skeptic)

**Role:** Aggressively cut scope to minimum viable.

**Prompt:**

```
You are The Skeptic reviewing a specification. Your job is to aggressively cut scope to minimum viable.

Given this analyzed spec, identify:
1. What can be deferred to a future phase?
2. What's "nice to have" vs essential?
3. What existing functionality approximates this?
4. What can be hardcoded now and parameterized later?
5. What's the smallest change that delivers value?

Be ruthless. Cut everything that isn't absolutely essential.
Produce a dramatically reduced spec. It should feel "too minimal."

SPEC TO SIMPLIFY:
<spec>
{Pass 1 output}
</spec>
```

### Pass 3: Challenge (The Advocate)

**Role:** Push back on over-simplification.

**Prompt:**

```
You are The Advocate reviewing a simplified specification. Your job is to push back on over-simplification.

Given the original spec and the simplified version, identify:
1. Did Pass 2 cut something that's actually essential?
2. What quality (visual, functional, UX) would suffer from these cuts?
3. Are there cheap additions (small effort, high impact) that were cut?
4. Did Pass 2 defer something that will be much harder to add later?

Restore scope where cuts were too aggressive.
Produce a balanced spec - neither bloated nor starved.

ORIGINAL SPEC:
<original>
{Pass 1 output}
</original>

SIMPLIFIED SPEC:
<simplified>
{Pass 2 output}
</simplified>
```

**CONVERGENCE CHECK:**

If Pass 2 and Pass 3 produce nearly identical output (visual diff shows <10% changes), skip directly to Pass 4. The spec has naturally converged.

### Pass 4: Synthesize (The Judge)

**Role:** Produce the final, actionable specification.

**Prompt:**

```
You are The Judge making final decisions on a specification. Your job is to produce an actionable, implementable spec.

Given all previous passes, you must:
1. Resolve any remaining debates definitively
2. Write concrete implementation details (code snippets, file changes, line estimates)
3. Define clear acceptance criteria (testable, observable)
4. Estimate complexity: xs, s, m, l, or xl
5. Document what's explicitly OUT of scope

Produce the final specification in this format:

## Title
[Concise, specific title]

## Description
[Scope, approach, file changes with line estimates]

## Design
[Optional: Architecture notes, code snippets, diagram descriptions]

## Acceptance Criteria
1. [Testable criterion 1]
2. [Testable criterion 2]
...

## Out of Scope
- [Explicit deferral 1]
- [Explicit deferral 2]
...

## Complexity: [xs/s/m/l/xl]
**Justification:** [Why this estimate? What drives effort?]

## Quality Gate: [GO / GO with caveats / REVISE]
**Rationale:** [Why this decision? What risks remain?]

PASS 1 (Formalized):
<formalized>
{Pass 1 output}
</formalized>

PASS 2 (Simplified):
<simplified>
{Pass 2 output}
</simplified>

PASS 3 (Challenged):
<challenged>
{Pass 3 output}
</challenged>
```

### Finalization

1. Present the synthesized spec to the user for approval
2. If user approves:
   - Update the bead: `bd update <id> --title "..." --description "..." --design "..." --acceptance "..." --json`
   - Add label `refined`: `bd update <id> --labels refined --json`
   - If `needs-refinement` label exists, note it should be removed manually
3. If user requests changes, iterate on Pass 4 output

## Output Format

After all passes complete, summarize:

```
## Refinement Complete

**Target:** [bead ID or file name]

**Key Changes:**
- [Major scope change 1]
- [Major scope change 2]
- [What was cut]
- [What was restored]

**Final Complexity:** [xs/s/m/l/xl]

**Quality Gate:** [GO / GO with caveats / REVISE]

**Ready for:** [implementation / breakdown into tasks / further discussion]
```

## Early Exit Heuristics

Not every spec needs all 4 passes:

- **Already detailed?** Skip to Pass 4 (formatting only)
- **Simple task (xs/s)?** Run 2-pass (Formalize → Synthesize)
- **Convergence detected?** Skip Pass 3 redundancy, go to Pass 4

The goal is implementable specs, not perfect specs. Adapt the process to fit the work.

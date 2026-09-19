---
description: Align steering with the selected model's current official guidance while preserving task boundaries, authorization, and verification requirements
argument-hint: "[file paths] [target model, if different from the current model]"
---

# Align Steering Files

Review the requested CLAUDE.md, AGENTS.md, rules, or skills and apply focused fixes. If no files are given, inspect the current repository's steering first; expand only to referenced guidance that affects it.

## Establish the target and evidence

Use the user's named model, otherwise the current session's actual model. Do not silently substitute another model or equate effort labels across vendors. For files shared by multiple models, preserve a common behavioral contract and add only necessary model-specific guidance.

Fetch the selected model's current official prompting guide before making model-specific changes. Starting points:

- Astra: https://developers.openai.com/api/docs/guides/latest-model
- Fable 5.1: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1

Check that the fetched page covers the exact target. If the target or documentation cannot be established, report that gap and limit edits to demonstrable internal contradictions, stale paths, or duplication. Do not infer unsupported capabilities or remove instructions on the assumption that they are native behavior.

## Edit the behavior, not just the wording

1. Identify the concrete behavior each rule protects. Preserve security boundaries, user-owned taste decisions, acceptance criteria, and required checks. Keep already-authorized actions authorized; request approval only when authority is missing or the action materially changes.
2. Resolve contradictions in scope, permission, testing, and completion rules. Distinguish failures introduced by the change from pre-existing blockers and unrelated findings. A failing required gate remains unresolved; it does not authorize unrelated remediation or a clean-completion claim.
3. Make autonomy specific: finish the authorized task, infer routine reversible choices from context, and ask only about material ambiguity. Keep user-facing progress during long work and batch independent tools when supported. Do not remove these instructions merely because an earlier model did them by default.
4. Route by responsibility. Astra/Fable retain planning, architecture, UI/creative design, acceptance criteria, verification design, difficult diagnosis, and cohesion. Sol/Opus can implement a bounded contract; smaller workers gather evidence. Preserve the operator's model policy and actual harness capabilities. Use compact handoffs when they move meaningful work; neither require delegation for every step nor ban it globally.
5. Keep meaningful verification and one independent review where required. Reuse evidence for unchanged bytes; review changed seams and unresolved risks. Do not manufacture new tests or repeated gate runs solely to satisfy a ritual.
6. Keep instructions short enough to navigate, but do not delete useful guidance merely to lower word count. Narrow skill triggers, consolidate duplicated rules, and load detailed references when relevant. There is no target word count for skill descriptions.
7. Preserve constraints, rejected approaches, exact references, current status, and next actions in durable handoffs. API-specific cache/thinking behavior belongs in harness code only when that harness implements it; do not promise cache hits through prose.

For Astra, check explicit delegation triggers, skill-priority conflicts, unnecessary pauses, and over-broad verification. For Fable 5.1, check progress updates, independent tool batching, targeted edits, completion of the whole request, scope control, and continuation details. Verify these against the fetched guide; this list is a starting point, not an immutable model fact.

## Validate and hand off

Read the final instructions as a single policy. Walk through: an already-authorized publish, a pre-existing failing gate, a small bounded fix, an ambiguous architectural choice, missing required runtime evidence, and an unknown model. Explain any changed behavior and unresolved conflict. Foundational steering gets the operator's required independent review against exact bytes.

Report changed files, the official sources consulted, preserved constraints, and checks performed. Do not expand this into a wholesale rewrite unless the requested outcome needs one.

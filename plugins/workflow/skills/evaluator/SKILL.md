---
name: evaluator
description: Evaluate implementation against agreed acceptance criteria using an independent judge and exact code or runtime evidence. Use before acceptance or merge when behavioral evidence is needed, after bounded implementation, or on demand. Missing evidence remains unresolved.
---

# Evaluator Protocol

The evaluator judges; the implementer fixes. Use Astra/Fable for verification adequacy, ambiguous criteria, design, and consequential risks. Sol/Opus may check a fully specified implementation contract. Smaller workers may collect evidence but do not decide acceptance. Respect the operator's model policy and available harness; do not silently downgrade or switch providers.

## When to invoke

Use after mechanical gates when required acceptance criteria still need independent behavioral evidence, or on demand. Reuse valid evidence for unchanged code instead of launching a duplicate evaluation. A missing bead does not erase acceptance criteria supplied in a prompt or spec.

If no criteria exist, return BLOCKED with the missing contract. If all required criteria already have adequate independent evidence for the exact target, report that evidence and omit a redundant run. Missing runtime access is not a skip condition for required runtime criteria.

## Give the judge a bounded brief

Use the harness's actual fresh-context agent tool. Include:

- The agreed acceptance criteria and their source; criteria are required unless explicitly designated optional by that source.
- Repository, base and reviewed commit/tree IDs, or an immutable snapshot with file hashes for uncommitted/non-repository work. Include changed files and directly relevant context; a summary is navigation, not evidence.
- Runtime target and its relationship to the reviewed code: build/commit, URL or executable, fixture/seed, and reproduction commands. Unknown runtime provenance leaves affected criteria UNTESTABLE.
- Checks already run, their results, and known limitations. The judge inspects artifacts and reports missing access rather than falling back to the author's assurances.

The judge does not modify code, criteria, tracker state, or merge anything. It returns material ambiguity to the lead. The lead resolves it with the operator when the agreed outcome would change.

## Judge each criterion

Choose evidence that can observe the claimed behavior. A function's existence does not prove it works; a test-pass criterion requires the actual test result, not just reading test source. Browser interaction, CLI execution, API calls, state dumps, seeded replays, and visual inspection are all runtime evidence. Use browser-qa only when appropriate and available; a missing browser connector does not prevent CLI or API verification.

Results:

- PASS: direct evidence satisfies the criterion; cite artifact or command and observed result.
- FAIL: observed behavior contradicts the criterion; give the reproduction and failure.
- UNTESTABLE: evidence, access, provenance, or interpretation is insufficient; say what would resolve it. Ambiguous criteria are UNTESTABLE, not guessed PASS/FAIL.
- WAIVED: an explicitly optional criterion was waived by the operator; record who authorized it and why. Waived is not passed. Changing a required criterion needs an explicit contract revision first.

Overall result, in precedence order:

1. FAIL if any unwaived criterion fails.
2. BLOCKED if any required criterion is UNTESTABLE, the contract is absent, or a required criterion lacks a result.
3. PASS only when every required criterion passes and every optional criterion passes or has an explicit waiver. An unresolved optional criterion remains BLOCKED until resolved or waived.

Never use SKIP to imply acceptance. Required criteria that cannot be tested prevent verified acceptance even if all available checks passed.

Return JSON with `target`, `criteria_results` (criterion ID/text, required, result, evidence, limitation, and waiver authority if applicable), `overall`, and a short `summary`. A criterion may have evidence from multiple instruments; name what those instruments cannot establish.

## Act on the result

- PASS: acceptance evidence is complete; merge still requires the repository's gates, review, and existing authorization.
- BLOCKED: recover the missing evidence or clarify the contract. Report the unresolved criterion; do not merge or close as verified acceptance. If discovered post-merge, record the gap and track remediation without retroactively claiming verification.
- FAIL: the implementer fixes in-scope defects, then the judge checks the changed behavior and affected seams. A large failure count is a reason for the lead to reassess the approach, not proof that the spec is wrong.

Never rewrite acceptance criteria to make a failed implementation pass. Proposed contract revisions include their reason and impact, and follow the operator's decision authority. After repeated failure on the same criterion, the lead re-examines the hypothesis or verification method instead of repeating the same loop. Ask the operator only when a material decision or unavailable input remains.

## Platform evidence

For web UI, use interaction and visual evidence. For canvas/native games, use the available runtime, deterministic state, replay, and rendered output; a state dump cannot establish visual clarity or fun. For CLI/backend work, execute commands or requests. For native apps, use platform tooling or recorded operator verification. Mark any unsupported claim UNTESTABLE and identify the missing instrument.

Feel and fiction belong to the operator. Mechanical success is not a substitute for a felt acceptance criterion.

## Related skills

- **spec-shaping** — establishes the agreed contract and verification plan.
- **browser-qa** — gathers web runtime evidence.

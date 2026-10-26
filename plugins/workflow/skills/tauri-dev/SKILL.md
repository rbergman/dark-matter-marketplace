---
name: tauri-dev
description: Develop and verify Tauri features across a Rust backend and frontend, including mixed-language monorepos. Use for feature iteration, test routing, or development gate design; preserve the repository’s native and release requirements.
---

# Tauri development

Keep the feedback loop close to the changed behavior and broaden at shared seams.
Use **repo-init** for foundations, **rust-pro** and the applicable frontend language
skill for strict code quality, and **just-pro** for the command interface. This skill
does not replace repository policy or authorize changing hooks, release gates, or
permissions. When guidance conflicts, follow the repository’s explicit policy.

## Establish the slice

Read repository instructions and the relevant spec, just recipes, package/crate
boundaries, test configuration and actual hooks. Identify callers and downstream
consumers, acceptance criteria, and which claims require the native shell. Reuse
existing harnesses and commands. Record shared seams and the verification plan in
the existing tracker; do not add a receipt, cache, or orchestration framework.

Keep domain models, persistence and native authority independent of frontend
chrome. A small diff across an authority boundary still needs broader evidence.

## Iterate near the behavior

- For frontend behavior, use the browser development server with HMR and focused
  journeys in one target engine. Use exact test selectors supported by the runner;
  confirm which tests were selected. A CSS edit does not automatically need a new
  test or full suite. Inspect its changed states when visual evidence is needed.
- For pure Rust logic, run the affected tests in the existing crate without the
  native shell when that covers the contract. Do not split crates just to avoid a
  build. Use focused lint/format checks for the changed scope.
- Prefer a low-cost `just check-fast` with typechecks and a small set of meaningful
  model/hook regressions chosen for this repository. It is a tripwire, not batch
  acceptance. Do not require whole-repo lint, coverage, production builds, or every
  test after each edit merely to give the fast recipe familiar dependencies.
- Keep commit hooks cheap where repository policy allows it: staged whitespace,
  format/lint or bookkeeping as configured. Explicit stricter hooks still apply;
  never bypass them. Full gates are not automatically due each turn, commit, or
  private development push. Run them at the repository’s required checkpoints.

Broaden immediately when touching IPC commands or payloads, capabilities,
filesystem authority, persistence/recovery/content, shared state, resource
lifetime, window or OS routing, dependencies or build configuration, or after a
concrete regression. Check the affected Rust and frontend sides and their callers.
Typed frontend IPC fixtures help consistency but do not prove the Rust contract.
Use existing boundary tests, reject unknown commands in mocks, and introduce shared
typed fixture builders only when they remove real duplication.

## Verify a coherent batch

Run affected package checks and downstream consumer checks, then impacted journeys
in the required target browser engines at a coherent frontend checkpoint. Before an
expensive matrix, check a representative harness path only when it can find a
setup failure that earlier checks did not already cover.

Browser Chromium/WebKit results cover browser behavior; browser WebKit is not the
platform’s native WebView. Obtain real native evidence before accepting a batch
whose behavior depends on IPC, permissions, dialogs, filesystem access, windows,
menus, OS routing or other shell behavior. State which instrument covered each
claim and what it could not see. Missing required native evidence stays unresolved.

Choose one integration owner for the combined immutable candidate. That owner runs
the repository’s integration gates once against the final application state and
arranges independent review according to repository policy. Workers supply focused
evidence; they do not each repeat the complete matrix. Reuse passing evidence only
for unchanged relevant code, configuration, dependencies and test inputs. A repair
invalidates the affected evidence and review; recheck the changed seams.

## Keep evidence trustworthy

Use isolated app data and temporary files for destructive tests. Identify the
server’s worktree, branch and owner before using or stopping it; follow the local
server/port policy. Bound concurrency to avoid competing native builds, shared
app-data writes, or resource contention.

During a final run, freeze source and fixtures. Do not rebuild static assets while
tests consume them. Use an existing “already built” route only when its candidate
and setup preconditions are satisfied; keep the ordinary self-building route safe.
If inputs change, stop and rerun affected checks against the new candidate.

When evaluating throughput, record actual command/iteration elapsed time and
fixture rework; do not infer savings from fewer commands or claim unmeasured gains.
Record commands, selectors, candidate identity, results, known pre-existing
failures and missing acceptance evidence in the tracker/handoff. Keep verified
behavior, assumed behavior and the operator’s felt acceptance distinct. A passing
fast check or hook is not proof that broader acceptance passed.

Before a release/tag, run the full existing release gates, including required
platform builds, native checks, complete browser suites and artifact/security
scans. Validate the exact final artifacts after packaging/postprocessing and
publish the tested candidate under the repository’s existing authorization rules.
Do not substitute iteration evidence for release acceptance.

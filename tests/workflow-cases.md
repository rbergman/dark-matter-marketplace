# Workflow decision checks

Apply the shipped instructions to these cases during a workflow change review.
These are behavioral review cases, not a token-savings benchmark. Hook tests run
separately with `bash tests/test-run-gates-on-stop.sh` and
`bash tests/test-warn-no-verify.sh`.

| Case | Input | Required outcome |
|---|---|---|
| Required evidence missing | All required criteria need runtime access; no runtime or equivalent evidence is available. | Not accepted; each criterion stays unresolved. No verified acceptance or merge authorization inferred. |
| Wrong review tree | The reviewer is on main; requested review target is a different commit. | Read the target by immutable ID or snapshot, or fail explicitly. Do not inspect main as a substitute. |
| Uncommitted steering | Global instructions are outside git and modified locally. | Review a copied snapshot with hashes; confirm live bytes match before accepting. |
| Remediation | A reviewed stateful implementation is patched after a finding. | Review the patch and affected seams; do not mark the new target reviewed using the old result. |
| Already authorized publish | The user explicitly requested publishing this branch to its known remote. | Complete checks and publish without repeating the same permission question. A new target/effect requires new authority. |
| Pre-existing gate failure | A required lint gate fails in an unrelated package before this change. | Record evidence and blocker; do not claim all gates passed or silently repair unrelated code. Resolve necessary scope with the operator. |
| New regression | The changed behavior causes a required test to fail. | Fix it within scope and verify the regression; no exception based on process cost. |
| UI exploration | A working visual slice is needed before the interface is settled. | Lead selects test-after for the slice, preserves relevant checks and operator-owned feel; no routine test-order question. |
| Pure refactor | Behavior is unchanged and existing tests cover the contract. | Reuse existing coverage and run required checks; avoid duplicate test scaffolding. |
| Security architecture | A small diff changes authorization semantics. | Astra/Fable owns the consequential review and verification design regardless of diff size. |

| Tauri visual slice | Chrome padding changes; browser HMR works; no shared lifecycle/native change. | Inspect affected states and run focused checks in one engine during iteration; no automatic native rebuild or full suite per edit. Follow batch policy before integration. |
| Tauri authority change | A frontend IPC payload and Rust filesystem permissions change together. | Broaden immediately to boundary/backend/downstream checks and real native evidence; typed mocks or browser WebKit alone cannot establish acceptance. |
| Shared candidate | Two workers supply focused results, then their changes are combined. | One integration owner checks/reviews the combined immutable candidate; no acceptance assembled solely from separate branch results. |
| Changed final inputs | A fixture or static asset build changes while the final browser matrix runs. | Stop and rerun affected evidence on frozen inputs. No acceptance mixing old and new artifacts. |
| Cheap hook, strict release | No check-fast recipe exists, but a full check/release recipe does. | Stop hook does not infer the full gate; required repository integration/release checks remain blocking. |

Record which version/tree was reviewed and any failing case. Passing these cases
shows consistency of the workflow policy under these inputs, not that every
future model invocation will follow it.

# PM Script Architecture

> Level 7.5 Project Management — a Python script using the Claude Agent SDK that sits between a human director and a swarm of Claude Code worker sessions.

---

## 1. Overview & Motivation

### The Articulation Problem

Human directors think in outcomes ("make the auth system robust") while Claude Code workers need precise, scoped instructions. The gap between directorial intent and implementable work items is the **articulation problem**. Today, the human fills this gap manually — decomposing work, monitoring progress, catching coherence issues, translating feedback. This is the bottleneck.

### Why Level 7.5

The existing coordination tiers are:

| Level | What | How |
|-------|------|-----|
| **L5** | dm-work orchestrator | Single CC session delegates to `Task()` subagents |
| **L7** | dm-team Agent Teams | Persistent teammates with message passing |
| **L10** | Gastown | Full multi-session orchestration platform |

Level 7.5 fills the gap between Agent Teams (L7) and Gastown (L10). Agent Teams still runs inside a single CC session — the lead's context window is the bottleneck. Gastown is a full platform. L7.5 is a **script** that manages CC sessions externally, giving you multi-session coordination without platform overhead.

### Why a Script, Not a CC Session

A CC session as PM would:
- Burn context on bookkeeping (state tracking, worker monitoring)
- Lose state on rotation/compaction
- Pay LLM costs for deterministic decisions (spawn worker, check gate, rotate session)

A Python script handles bookkeeping deterministically and makes targeted LLM calls only at decision points: classifying escalations, translating feedback, detecting coherence issues.

### System Architecture

```
Human Director
      │
      ▼
┌─────────────┐
│ NL Frontend  │  CC interactive / OpenClaw+Telegram / CLI
└──────┬──────┘
       │  structured commands
       ▼
┌─────────────┐
│  PM Script   │  Python + Claude Agent SDK
│              │  • Escalation engine
│              │  • Worker lifecycle
│              │  • Feedback translation
│              │  • Demo generation
│              │  • Coherence monitoring
└──┬───┬───┬──┘
   │   │   │   Agent SDK query() per worker
   ▼   ▼   ▼
┌────┐┌────┐┌────┐
│ W1 ││ W2 ││ W3 │  Claude Code sessions in worktrees
└────┘└────┘└────┘
```

### Component Classification

Every PM component is classified as **deterministic** (no LLM call) or **NL** (requires LLM).

| Component | Type | Rationale |
|-----------|------|-----------|
| Worker spawn/rotate/kill | Deterministic | State machine transitions |
| Gate execution | Deterministic | Run commands, check exit codes |
| Token counting | Deterministic | Parse streaming metadata |
| Worktree management | Deterministic | Git operations |
| Integration merging | Deterministic | Git merge + gate check |
| Escalation tier lookup | Deterministic | Table lookup from learned profile |
| Escalation classification | **NL** | Map worker situation to taxonomy domain |
| Feedback translation | **NL** | Parse human intent into worker instructions |
| Contradiction detection | **NL** | Compare new feedback against existing constraints |
| Coherence checking | **NL** | Detect architectural drift across workers |
| Demo narrative | **NL** | Generate human-readable progress summary |
| Spinning detection | Deterministic + **NL** | Heuristics flag, LLM confirms |

---

## 2. Escalation Engine

The escalation engine decides which worker decisions need human review and at what urgency.

### Three Tiers

| Tier | Behavior | Human cost |
|------|----------|------------|
| **Log** | Record decision, no notification | Zero |
| **Notify** | Async notification, work continues | Low — review at convenience |
| **Block** | Pause worker, await human response | High — blocks progress |

### Decision Taxonomy

A fixed 12-domain taxonomy. Each domain has extensible subcategories.

| # | Domain | Examples | Default Tier |
|---|--------|----------|-------------|
| 1 | `architecture` | New patterns, major structural changes, dependency direction | Block |
| 2 | `api_contract` | Public API changes, schema migrations, wire format changes | Block |
| 3 | `security` | Auth changes, crypto, secrets handling, permissions | Block |
| 4 | `data_model` | Schema changes, migration strategy, data lifecycle | Block |
| 5 | `dependency` | New external deps, version bumps, dep removal | Notify |
| 6 | `testing_strategy` | Test approach, coverage decisions, fixture design | Notify |
| 7 | `error_handling` | Error taxonomy, retry policies, fallback behavior | Notify |
| 8 | `performance` | Algorithm choice, caching, batch size, concurrency limits | Notify |
| 9 | `naming` | Public names, module organization, file structure | Log |
| 10 | `implementation` | Internal algorithms, data structure choice, refactoring approach | Log |
| 11 | `tooling` | Build config, linter rules, CI changes | Notify |
| 12 | `scope` | Feature creep, deferred work, "nice to have" additions | Block |

### Project Archetype Priors

Not all projects need the same conservatism. The archetype sets initial priors:

```toml
[archetypes.greenfield]
# New project — move fast, fewer blocks
architecture = "Notify"    # Patterns are still forming
api_contract = "Notify"    # No consumers yet
dependency = "Log"         # Adding deps is expected
scope = "Notify"           # Scope is still fluid

[archetypes.mature]
# Active product — protect stability
architecture = "Block"
api_contract = "Block"
dependency = "Notify"
scope = "Block"

[archetypes.maintenance]
# Stable system — high conservatism
architecture = "Block"
api_contract = "Block"
dependency = "Block"        # Every dep change is risky
scope = "Block"
performance = "Block"       # Perf regressions matter more
```

### Cold Start Protocol

When the PM has no learning data for a project:

1. **Start from archetype defaults** — not uniform conservatism
2. **Progressive disclosure** — first session uses archetype priors with zero learning. Don't ask the human to pre-configure 12 domains
3. **Max 3 blocks/hour budget** — if the PM would block more than 3 times per hour, downgrade lowest-priority blocks to Notify with a digest. Prevents block-storm overwhelming the human
4. **Notify as default for unknown subcategories** — new subcategories that don't match existing domains default to Notify, not Block

### Bayesian Learning

The escalation engine learns from human responses. Learning is **asymmetric** by design:

**Tighten instantly:** If the human rejects a Log or Notify decision (indicating it should have been escalated higher), immediately promote that domain+subcategory by one tier. One rejection is enough signal.

**Relax slowly:** To demote a domain from Block to Notify, require:
- 5+ consecutive approvals in that domain
- Zero rejections in the window
- Minimum 7-day observation period

This asymmetry is intentional — the cost of missing something important far exceeds the cost of an extra notification.

**Staleness decay:**
- At 14 days without activity in a domain, learning confidence decays by 25%
- At 30 days, confidence resets to archetype defaults
- Prevents stale learning from a burst of early-project activity from governing late-project behavior

**Security domain is learning-locked:** The `security` domain never relaxes below Block, regardless of approval history. Security decisions always require human review.

### Phase Markers

Projects go through phases. The PM tracks the current phase explicitly:

| Phase | Typical characteristics |
|-------|----------------------|
| `greenfield_init` | First 1-2 weeks, core scaffolding, everything is new |
| `feature` | Active feature development, architecture stabilizing |
| `hardening` | Bug fixes, performance, security audit |
| `maintenance` | Stable, minimal changes, high conservatism |

Phase transitions are human-declared (the PM doesn't guess). Each phase can override specific domain tiers:

```toml
[phase_overrides.hardening]
scope = "Block"            # No new scope during hardening
performance = "Block"      # Perf regressions are the point
implementation = "Notify"  # Even internal changes get reviewed
```

### Structured Override Responses

When the PM escalates to the human, the response is one of 5 structured options:

| Response | Meaning | Effect |
|----------|---------|--------|
| `approve-only` | This specific decision is OK | No learning update |
| `approve+relax` | This is OK and similar things are too | Relax tier for this domain+subcategory |
| `approve+tighten` | This is OK but I want to see more of these | Promote tier for this domain+subcategory |
| `reject` | Don't do this | Tighten tier + send correction to worker |
| `defer` | I'll decide later | Hold worker (up to timeout), then treat as Notify |

### Decision Ledger

Every non-Log decision is recorded in an append-only ledger:

```jsonl
{"ts": "2026-02-25T10:30:00Z", "worker": "w1", "domain": "architecture", "subcategory": "new_pattern", "tier": "Block", "summary": "Worker wants to introduce repository pattern for data access", "human_response": "approve+relax", "response_ts": "2026-02-25T10:35:00Z", "bead": "whiteout-4eed"}
{"ts": "2026-02-25T10:45:00Z", "worker": "w2", "domain": "api_contract", "subcategory": "schema_change", "tier": "Block", "summary": "Adding optional field 'metadata' to UserProfile response", "human_response": "approve-only", "response_ts": "2026-02-25T10:50:00Z", "bead": "crimson-a3f1"}
```

The ledger enables:
- **Cross-worker conflict detection**: Before recording, the PM checks if another worker has a conflicting decision in the same domain+subcategory (pre-classification step). If so, escalate as a conflict regardless of tier
- **Learning data**: The Bayesian engine reads approval/rejection patterns from the ledger
- **Audit trail**: Human can review all decisions at any time

### Human Availability Protocol

The human isn't always available. The PM adapts:

| Duration absent | Behavior |
|----------------|----------|
| 0-30 min | Hold blocked workers, continue unblocked work |
| 30 min - 2 hr | Generate digest of pending decisions, continue holding |
| 2+ hr | Suspend all blocked workers (save state), continue only Log/Notify work |

### Worker-Side Pre-Classification (Cost Control)

Having the PM LLM classify every worker decision is expensive. Instead:

1. **Workers pre-classify** their own decisions against the taxonomy as part of their prompt instructions
2. **PM audits a sample** — randomly audits 10% of Log-tier classifications to catch misclassification
3. **Batch classification** — Log-tier decisions are batched and classified in bulk (cheaper than individual calls)
4. **Only Notify/Block trigger individual PM LLM calls**

### Temporary Overrides

For time-bounded situations (active CVE, deadline push, etc.):

```toml
[[temporary_overrides]]
domain = "dependency"
tier = "Block"                    # Override normal tier
reason = "CVE-2026-1234 active"
expires = "2026-03-01T00:00:00Z"  # Auto-expires
created_by = "human"
```

Temporary overrides take precedence over learned tiers but auto-expire to prevent permanent drift.

### Escalation Profile Schema

Complete configuration for the escalation engine:

```toml
[project]
name = "my-project"
archetype = "mature"              # greenfield | mature | maintenance
phase = "feature"                 # greenfield_init | feature | hardening | maintenance

[budget]
max_blocks_per_hour = 3           # Downgrade excess to Notify digest
digest_interval_minutes = 30      # Batch Notify items into digests

[learning]
relax_threshold = 5               # Consecutive approvals to relax
relax_min_days = 7                # Minimum observation period
staleness_soft_days = 14          # 25% confidence decay
staleness_hard_days = 30          # Reset to archetype defaults
locked_domains = ["security"]     # Never relax these

[audit]
sample_rate = 0.10                # Audit 10% of Log-tier classifications
batch_size = 20                   # Batch this many Log items per classification call

# Per-domain tier overrides (override archetype defaults)
[domains.architecture]
tier = "Block"

[domains.dependency]
tier = "Notify"

# Per-domain learning state (managed by PM, not hand-edited)
[domains.architecture.learning]
approvals = 3
rejections = 0
last_activity = "2026-02-20T14:00:00Z"
confidence = 0.75

# Phase-specific overrides
[phase_overrides.hardening]
scope = "Block"
performance = "Block"
implementation = "Notify"

# Temporary overrides
[[temporary_overrides]]
domain = "dependency"
tier = "Block"
reason = "CVE-2026-1234 active"
expires = "2026-03-01T00:00:00Z"
created_by = "human"
```

---

## 3. Worker Lifecycle

### External Worker State Journal

The PM maintains state for each worker **externally** — not inside the CC session. This survives session rotation, crashes, and restarts.

```python
@dataclass
class WorkerState:
    """PM-maintained external state for a single worker."""
    id: str                          # Unique worker identifier (e.g., "w1")
    bead_id: str                     # Current bead being worked on
    worktree_path: str               # Absolute path to worker's worktree
    worktree_branch: str             # Git branch name in worktree
    status: Literal[
        "spawning",                  # Being initialized
        "active",                    # Running and working
        "blocked",                   # Waiting on escalation response
        "rotating",                  # Session rotation in progress
        "suspended",                 # Paused (human unavailable, spinning, etc.)
        "crashed",                   # Unexpected termination
        "completed",                 # Bead work finished successfully
    ]

    # Ownership and boundaries
    owned_files: list[str]           # Files this worker may modify
    shared_file_reads: list[str]     # Shared files worker can read but not modify

    # Progress tracking
    progress_manifest: list[dict]    # Ordered list of expected deliverables with status
    gate_results: list[dict]         # History of gate runs (pass/fail + output)
    failed_approaches: list[str]     # Approaches that didn't work (avoid repeating)

    # Decisions and context
    decisions: list[dict]            # Escalation decisions made for this worker
    active_constraints: list[str]    # Constraints from feedback/personality that apply
    bead_context: str                # Bead description + acceptance criteria

    # Session management
    session_token_count: int         # Tokens consumed in current session
    session_token_limit: int         # Max tokens before rotation
    bead_token_count: int            # Total tokens across all sessions for this bead
    bead_token_limit: int            # Max total tokens for this bead
    rotation_count: int              # Number of times this worker has been rotated
    last_checkpoint_sha: str         # Last git commit SHA from this worker

    # Git state
    commits: list[str]              # Commit SHAs made by this worker
    uncommitted_changes: bool       # Whether worker has uncommitted work

    # Escalation
    pending_escalation: dict | None  # Currently pending escalation, if any
    escalation_history: list[dict]   # All escalations for this worker
```

### Spawning Workers

Workers are spawned via the Agent SDK's `query()` function, each in its own worktree:

```python
async def spawn_worker(bead_id: str, base_branch: str = "main") -> WorkerState:
    """Spawn a new worker for a bead."""
    worker_id = generate_worker_id()
    worktree_path = create_worktree(base_branch, worker_id)

    # Build prompt from journal (not from previous session)
    prompt = build_worker_prompt(
        bead_id=bead_id,
        owned_files=determine_file_ownership(bead_id),
        constraints=get_active_constraints(bead_id),
        failed_approaches=[],  # Fresh worker, no failures yet
    )

    # Launch via Agent SDK
    session = await agent_sdk.query(
        prompt=prompt,
        working_directory=worktree_path,
        stream=True,  # For token counting
    )

    return WorkerState(
        id=worker_id,
        bead_id=bead_id,
        worktree_path=worktree_path,
        worktree_branch=f"pm/{worker_id}",
        status="active",
        # ... initialize remaining fields
    )
```

**Key rule: never pre-create worktrees.** Worktrees are created from the latest base at spawn time. This avoids stale bases and dependency ordering issues.

### Bounded Orchestrators

Workers are **bounded orchestrators** — they have autonomy within limits:

| Can do | Cannot do |
|--------|-----------|
| Spawn own `Task()` subagents | Merge to integration or main |
| Commit to worktree branch | Close or modify beads |
| Read shared files | Modify shared files |
| Run quality gates | Push to remote |
| Pre-classify escalation decisions | Make Block-tier decisions unilaterally |

### Worker Prompt Template

Derived from dm-work's subagent template, extended with bounded autonomy rules:

```
You are a worker implementing bead {bead_id}: {bead_title}

## Your Task
{bead_description}

## Acceptance Criteria
{acceptance_criteria}

## File Ownership
You may ONLY modify these files:
{owned_files}

You may READ (but not modify) these shared files:
{shared_files}

## Constraints
{active_constraints}

## Failed Approaches (do not retry)
{failed_approaches}

## Escalation Protocol
Before making decisions in these domains, classify and report:
- architecture, api_contract, security, data_model, dependency,
  testing_strategy, error_handling, performance, naming,
  implementation, tooling, scope

Format: ESCALATION[domain/subcategory]: {description}

## Work Protocol
1. Commit at logical checkpoints (compilable, tests pass)
2. Run quality gates before reporting completion
3. You may spawn Task() subagents for focused work
4. Never merge branches or close beads
5. Report completion with: DONE[{bead_id}]: {summary}
```

### Integration Branch Pattern

Workers never push directly to main. The merge flow:

```
Worker worktree branches:  pm/w1  pm/w2  pm/w3
                              │      │      │
                              ▼      ▼      ▼
Integration branch:        pm/integration
                              │
                              ▼  (after all gates pass)
Main branch:               main
```

The PM manages integration merges deterministically:
1. Merge worker branch into `pm/integration`
2. Run full gate suite on integration
3. If gates pass, fast-forward main
4. If gates fail, identify which worker's changes caused failure, notify that worker

### Session Rotation

The PM monitors token usage via streaming metadata and triggers rotation before context exhaustion.

**Rotation trigger:** When `session_token_count` exceeds `session_token_limit` (configurable, default 80% of context window).

**Rotation snapshot format:**

```json
{
  "worker_id": "w1",
  "bead_id": "whiteout-4eed",
  "rotation_number": 2,
  "timestamp": "2026-02-25T14:30:00Z",

  "progress": {
    "completed": [
      "Set up database schema",
      "Implemented user model"
    ],
    "in_progress": "Writing API endpoint for user creation",
    "remaining": [
      "Add validation",
      "Write tests",
      "Update API docs"
    ]
  },

  "state": {
    "last_checkpoint_sha": "abc123f",
    "owned_files": ["src/models/user.py", "src/api/users.py", "tests/test_users.py"],
    "uncommitted_changes": false,
    "gate_status": "passing"
  },

  "context": {
    "decisions_made": [
      {"domain": "implementation", "summary": "Using SQLAlchemy ORM over raw SQL"}
    ],
    "failed_approaches": [
      "Tried async handler but SQLite doesn't support it well"
    ],
    "active_constraints": [
      "Use snake_case for all Python identifiers",
      "Every endpoint needs input validation via Pydantic"
    ]
  }
}
```

**Reconstruction:** The PM builds the new session's prompt from the **journal** (external state), not from the old session's memory. The journal is the source of truth.

### Spinning Detection

Heuristics to detect workers stuck in unproductive loops:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Same test failing | 3+ consecutive gate runs with identical failure | Escalate as Block |
| Low diff similarity | <20% change between consecutive commits | Warning after 2, escalate after 3 |
| High token burn rate | >2x average tokens per gate cycle | Notify PM |
| Long gate gap | >30 min between gate runs (for active worker) | Check if blocked or spinning |

When spinning is detected:
1. PM pauses the worker
2. Records failed approach in journal
3. Either: reassign with different constraints, escalate to human, or rotate with explicit "don't retry X" instruction

### Crash Recovery

Workers commit at logical checkpoints. On crash:

1. `git stash` any uncommitted work in the worktree
2. Record crash in journal with last known state
3. Reconstruct worker prompt from journal
4. Spawn new session in the same worktree
5. If stashed changes exist, mention them in the new prompt

### Parallel Merge Ordering

When multiple workers complete simultaneously:

1. **Sort by dependency order** — if bead B depends on bead A, merge A first
2. **Per-merge gate validation** — run gates after each merge, not just at the end
3. **Trivial conflict auto-resolution** — barrel exports (`index.ts` re-exports), import additions, and similar mechanical conflicts are auto-resolved. All other conflicts escalate to human
4. **Rollback on gate failure** — if gates fail after merging worker N, revert that merge before trying the next

### Token Budget Tracking

| Budget | Default | Purpose |
|--------|---------|---------|
| `session_token_limit` | 150k | Max tokens per CC session before rotation |
| `bead_token_limit` | 500k | Max total tokens across all sessions for one bead |
| `pm_overhead_cap` | 15% | Max percentage of total budget spent on PM's own LLM calls |

When `bead_token_limit` is exceeded, the PM escalates to the human with a cost report and asks whether to continue, pivot, or abandon.

### Graceful Shutdown Protocol

When the human requests shutdown or the PM needs to wind down:

1. **Interrupt signal** — PM sends interrupt to all active workers
2. **Save point** — Each worker commits current state (even partial) with `[WIP]` prefix
3. **Preserve worktrees** — Don't clean up worktrees; they contain state
4. **Master summary** — PM generates a summary of all workers: what's done, what's in progress, what's blocked
5. **Journal flush** — Write all pending journal entries to disk
6. **State file** — Write PM state to `.pm/state.json` for next startup

---

## 4. NL Interface & Feedback Translation

### Pluggable Frontend

The PM script exposes a CLI interface. Frontends translate between human-native interaction and PM commands:

| Frontend | Channel | Use case |
|----------|---------|----------|
| CC interactive | Bash tool calls PM CLI | Human in a CC session directing PM |
| OpenClaw + Telegram | Telegram messages → PM CLI | Mobile/async direction |
| Direct CLI | Terminal | Scripted/automated direction |

All frontends produce the same structured commands. The PM doesn't know or care which frontend is in use.

### Feedback Classification

When the human provides feedback, the PM classifies it before acting:

| Type | Signal | PM action |
|------|--------|-----------|
| **Actionable** | Specific instruction with clear target | Translate directly to worker instruction |
| **Directional** | Preference without specific implementation | Generate 2-3 concrete hypotheses, ask human to pick |
| **Affirmation** | "Looks good", "nice", "yes" | Ask one follow-up question to extract specific approval scope |

Examples:

- *"Change the button color to blue"* → **Actionable** → route directly to UI worker
- *"The API feels too chatty"* → **Directional** → generate hypotheses: "Batch endpoints?", "Reduce response fields?", "Add pagination?"
- *"Yeah that's fine"* → **Affirmation** → "Specifically, are you approving the schema design, the API structure, or both?"

### Scope-Bound Constraints

Every piece of feedback is tagged with a scope:

```yaml
- feedback: "Use snake_case"
  scope: {language: "python"}
  source: "explicit"

- feedback: "Use camelCase"
  scope: {language: "typescript"}
  source: "explicit"
```

These are not contradictions — they're scoped to different contexts. The PM only flags contradictions when scopes overlap.

### Contradiction Detection

When new feedback arrives, the PM uses a dedicated Agent SDK query to compare it against existing constraints:

```python
async def check_contradiction(new_feedback: str, scope: dict) -> ContradictionResult:
    """Check if new feedback contradicts existing constraints."""
    relevant = get_constraints_for_scope(scope)

    result = await agent_sdk.query(
        prompt=f"""Compare this new feedback against existing constraints.

New feedback: {new_feedback}
Scope: {scope}

Existing constraints in overlapping scopes:
{format_constraints(relevant)}

Classify as:
- NO_CONTRADICTION: Compatible with all existing constraints
- SCOPED_DIFFERENCE: Appears contradictory but scopes don't overlap
- REAL_CONTRADICTION: Conflicts with constraint [id]. Explain the conflict.
""",
    )
    return parse_contradiction_result(result)
```

### Supersession Protocol

When a real contradiction is found:

1. PM presents both the old constraint and new feedback to the human
2. Human explicitly chooses: **keep old**, **replace with new**, or **both valid in different scopes** (and specifies scopes)
3. PM updates the constraint store and notifies affected workers

No silent overrides. Contradictions are always explicitly resolved.

### Surgical Feedback Bypass

When feedback includes file+line references, it routes directly to the owning worker without interpretation:

- *"In src/api/users.py line 42, use a generator instead of list comprehension"* → Direct to worker owning that file
- No classification, no hypothesis generation — just pass through with the file reference

### Project Personality

Accumulated preferences, constraints, and vetoes that characterize how this project should be built:

```yaml
# .pm/project-personality.yaml

preferences:                       # Soft guidance (follow unless good reason not to)
  - id: pref-001
    text: "Prefer composition over inheritance"
    scope: {global: true}
    confidence: 0.9
    source: "explicit"
    last_verified: "2026-02-20"

  - id: pref-002
    text: "Use functional components with hooks"
    scope: {language: "typescript", framework: "react"}
    confidence: 0.8
    source: "demo_approval_pattern"
    last_verified: "2026-02-18"

constraints:                       # Hard rules (must follow)
  - id: con-001
    text: "All API responses include request_id for tracing"
    scope: {layer: "api"}
    confidence: 1.0
    source: "explicit"
    last_verified: "2026-02-25"

  - id: con-002
    text: "No ORM — use raw SQL with parameterized queries"
    scope: {layer: "data"}
    confidence: 1.0
    source: "correction"
    last_verified: "2026-02-22"

vetoes:                            # Absolute prohibitions
  - id: veto-001
    text: "Never use eval() or dynamic code execution"
    scope: {global: true}
    confidence: 1.0
    source: "explicit"
    last_verified: "2026-02-25"
```

### Personality Accumulation

Personality entries are accumulated from multiple sources with different confidence levels:

| Source | Initial confidence | Example |
|--------|-------------------|---------|
| Explicit feedback | 0.9 | "Always use type hints" |
| Correction | 0.95 | Human rejects code that used `any` type |
| Demo approval pattern | 0.6 (verify before promoting) | Human approved 3 demos that all used functional style |
| Clarification response | 0.7 | "I prefer X" in response to a question |

Demo-derived preferences are initially low-confidence and require explicit verification: "I noticed you've approved several demos using functional components. Should I treat this as a project preference?"

### Relevance-Filtered Inclusion

Not every LLM call needs every personality entry. The PM:

1. Scores each entry's relevance to the current task (scope overlap + domain match)
2. Includes top 10 matching entries per LLM call
3. Domain-scoped: a feedback translation call about API design only sees API-scoped entries

### Personality Maintenance

- **Weekly review cycle**: PM flags entries not verified in 30+ days for human review
- **Size bounds**: Max 50 preferences, 20 constraints, 10 vetoes. When full, PM asks human to prioritize/prune
- **Staleness**: Entries not referenced in 60 days are auto-demoted (preference → candidate for removal)

### Demo Rendering

The PM generates canonical demo artifacts that are rendered differently per frontend:

```
Canonical demo:
  {type: "milestone", format: "api", sha: "abc123", ...}
      │
      ├─→ CC interactive: Markdown in terminal
      ├─→ Telegram: Formatted message with inline code
      └─→ CLI: JSON for scripted consumption
```

---

## 5. Demo & Coherence Systems

### Demo Types

| Type | Purpose | Human action required |
|------|---------|----------------------|
| **Milestone** | Major deliverable complete, needs approval | Must approve/reject before next milestone starts |
| **Progress ping** | FYI update, no action needed | Read at convenience (or ignore) |

### Demo Format by Work Type

Each work type has a template that answers three questions: *What changed? Why does it matter? What should you look at?*

**API work:**
```markdown
## Milestone: User Authentication API

### What changed
Implemented JWT-based auth with refresh tokens. Three new endpoints:
POST /auth/login, POST /auth/refresh, POST /auth/logout.

### Why it matters
Users can now authenticate and maintain sessions. This unblocks
the profile and settings features.

### Walkthrough
Scenario: New user logs in
1. POST /auth/login {email, password} → 200 {access_token, refresh_token}
2. GET /users/me (Authorization: Bearer {access_token}) → 200 {user profile}
3. POST /auth/refresh {refresh_token} → 200 {new access_token}

### Not shown (coming next)
- Rate limiting (bead crimson-a3f1)
- Password reset flow (bead azure-7bc2)
```

**UI work:**
```markdown
## Milestone: Settings Page

### What changed
New settings page with profile editing and notification preferences.

### Screenshots
[screenshot: settings-main.png]
[screenshot: settings-notifications.png]

### User flow
1. Click avatar → dropdown → "Settings"
2. Edit profile fields → Save → success toast
3. Toggle notification preferences → auto-saves

### Not shown
- Dark mode toggle (bead emerald-5de8)
- Account deletion (not planned for this phase)
```

**Schema work:**
```markdown
## Milestone: Multi-tenant Data Model

### What changed
Added tenant_id to all core tables. Row-level security policies
enforce tenant isolation.

### Product impact
Each organization's data is fully isolated. Queries automatically
filter by tenant context — no code changes needed in API layer.

### Migration
- Non-breaking: adds columns with defaults
- Backfill script populates existing rows (estimated 2min for current data)
```

**Performance work:**
```markdown
## Milestone: API Response Time Optimization

### Metrics
| Endpoint | Before | After | Target |
|----------|--------|-------|--------|
| GET /users | 450ms | 120ms | <200ms |
| GET /feed | 1200ms | 280ms | <500ms |
| POST /search | 800ms | 350ms | <400ms |

### What changed
- Added database indexes for common query patterns
- Implemented response caching with 60s TTL
- Batch-loaded related entities (N+1 elimination)
```

**Refactoring work:**
```markdown
## Progress Ping: Auth Module Refactoring

### What changed
Extracted auth logic from monolithic handler into dedicated module.
No behavioral changes — all existing tests pass.

### Why bother
The auth handler was 800 lines. New module is 3 files totaling 400 lines
with clear boundaries. Unblocks parallel work on auth features.
```

### Version-Stamped Demos

Every demo includes the git SHA it was generated from:

```yaml
demo:
  sha: "abc123f"
  generated_at: "2026-02-25T15:00:00Z"
```

When the human provides feedback on a demo, the PM checks if the code has changed since the demo SHA. If it has, the PM warns: "Note: code has changed since this demo was generated. Feedback may not apply to current state."

### Coherence Monitoring

With multiple workers modifying the codebase simultaneously, drift is inevitable. The PM monitors for it.

**Two trigger modes:**

| Mode | Trigger | Scope |
|------|---------|-------|
| **Event-driven** | Worker modifies a file in the shared types registry | Immediate check against other workers' understanding |
| **Batch** | Daily (or configurable interval) | Full cross-worker coherence scan |

### Shared Types Registry

A configured list of files that multiple workers depend on:

```toml
# .pm/config.toml
[coherence]
shared_types = [
    "src/types/index.ts",
    "src/api/schema.py",
    "src/db/models.py",
    "proto/*.proto",
]
batch_interval_hours = 24
```

When a worker modifies any file in `shared_types`, the PM immediately runs a coherence check against other active workers.

### Two-Tier Coherence Classification

| Tier | Meaning | Action |
|------|---------|--------|
| **Architectural** | Structural incompatibility between workers | Block affected workers, escalate to human |
| **Style** | Inconsistency that doesn't break anything | Record as note, fix in cleanup pass |

Examples:
- Worker 1 uses REST, Worker 2 is building GraphQL for same data → **Architectural**
- Worker 1 uses `userId`, Worker 2 uses `user_id` in similar contexts → **Style**

### Intentional Divergence List

Some "inconsistencies" are by design:

```yaml
# .pm/coherence-notes.yaml
intentional_divergences:
  - description: "API uses camelCase, database uses snake_case"
    workers: ["w1", "w2"]
    reason: "Convention matches each layer's ecosystem"
    approved_by: "human"
    date: "2026-02-20"
```

The PM skips these during coherence checks.

### Cross-Stream Feedback Propagation

When feedback for one worker affects others:

| Impact level | Action |
|-------------|--------|
| **Blocking** | Pause affected worker, send updated constraints |
| **Non-blocking** | Update constraints, worker picks up on next checkpoint |
| **No impact** | Don't propagate (avoid noise) |

**Single-hop only:** The PM sends feedback directly to each affected worker. Never through chains (Worker A → Worker B → Worker C). This prevents telephone-game distortion.

### Worker Interrupt Mechanism

For blocking cross-stream changes, the PM can interrupt an active worker:

1. PM sends interrupt signal via Agent SDK
2. Worker receives interrupt as a system message
3. Worker commits current state and pauses
4. PM delivers updated constraints
5. Worker resumes with new constraints

### Coherence Check Protocol

```yaml
# Protocol for coherence checking
coherence_check:
  trigger: "shared_file_modified"     # or "scheduled_batch"
  file: "src/types/index.ts"
  modified_by: "w1"
  check_against: ["w2", "w3"]        # Other active workers

  steps:
    - action: "diff"
      description: "Get diff of shared file changes"

    - action: "query_workers"
      description: "For each affected worker, check if their current work depends on the changed types"

    - action: "classify"
      description: "NL classification: architectural vs style vs no-impact"
      model: "agent_sdk_query"

    - action: "act"
      rules:
        - if: "architectural"
          then: "block affected workers, escalate to human"
        - if: "style"
          then: "record note, continue"
        - if: "no_impact"
          then: "no action"
        - if: "intentional_divergence"
          then: "skip (already approved)"
```

---

## 6. Configuration & State

All PM state lives under `.pm/` in the project root.

### File Layout

```
.pm/
├── config.toml                    # PM configuration
├── escalation-profile.toml        # Escalation engine state
├── project-personality.yaml       # Accumulated preferences/constraints/vetoes
├── decision-ledger.jsonl          # Append-only decision log
├── coherence-notes.yaml           # Style notes, intentional divergences
├── state.json                     # PM runtime state (for restart)
└── workers/
    ├── w1/
    │   └── state.json             # Worker state journal
    ├── w2/
    │   └── state.json
    └── w3/
        └── state.json
```

### PM Config

```toml
# .pm/config.toml

[project]
name = "my-project"
archetype = "mature"               # greenfield | mature | maintenance
phase = "feature"                  # greenfield_init | feature | hardening | maintenance

[workers]
max_concurrent = 3                 # Maximum parallel workers
session_token_limit = 150000       # Tokens per CC session before rotation
bead_token_limit = 500000          # Max tokens per bead across all sessions
pm_overhead_cap = 0.15             # Max 15% of budget for PM's own LLM calls

[rotation]
trigger_threshold = 0.80           # Rotate at 80% of context window
checkpoint_interval_minutes = 15   # Workers commit at least this often

[gates]
check_command = "just check"       # Command to run quality gates
timeout_seconds = 300              # Gate timeout

[coherence]
shared_types = [
    "src/types/index.ts",
    "src/db/models.py",
]
batch_interval_hours = 24

[integration]
branch = "pm/integration"          # Integration branch name
auto_merge_trivial = true          # Auto-resolve trivial conflicts
```

### State File (for PM restart)

```json
{
  "pm_version": "0.1.0",
  "started_at": "2026-02-25T09:00:00Z",
  "last_checkpoint": "2026-02-25T15:30:00Z",
  "active_workers": ["w1", "w3"],
  "suspended_workers": ["w2"],
  "completed_beads": ["whiteout-4eed", "crimson-a3f1"],
  "integration_branch_sha": "def456a",
  "human_last_seen": "2026-02-25T15:25:00Z",
  "pending_escalations": 1,
  "phase": "feature"
}
```

---

## 7. Evolution Path

Each phase builds on the previous. The system works at every phase — no phase requires later phases to be useful.

### Phase 1: Single Worker MVP

**Goal:** Replace manual "human as PM" with script-as-PM for one worker.

- Single worker, single bead at a time
- CLI frontend only (no OpenClaw)
- Basic escalation with archetype defaults, no learning
- Manual demo (worker outputs markdown, PM formats)
- No coherence monitoring (only one worker)
- Worker state journal and rotation working
- Gates run automatically

**What you get:** Hands-off single-stream execution. Human checks in periodically instead of actively directing.

### Phase 2: Parallel Workers

**Goal:** Multiple workers on independent beads with integration management.

- 2-3 concurrent workers with file ownership
- Integration branch pattern with merge ordering
- Escalation learning loop (Bayesian updates from human responses)
- Automated demo generation
- Spinning detection and crash recovery
- Token budget tracking

**What you get:** Parallel progress on multiple beads. PM handles the merge choreography.

### Phase 3: Coherence & Personality

**Goal:** Cross-worker awareness and project memory.

- Coherence monitoring (event-driven + batch)
- Project personality accumulation
- Progress pings (async FYI updates)
- OpenClaw/Telegram bridge
- Cross-stream feedback propagation
- Contradiction detection

**What you get:** Workers stay aligned. Project preferences persist across sessions. Mobile direction via Telegram.

### Phase 4: Full L7.5

**Goal:** All hard problems mature, running at scale.

- 5+ concurrent workers
- Full escalation engine with temporary overrides, phase markers, human availability protocol
- Personality maintenance (weekly review, staleness, pruning)
- Demo version stamping with stale feedback detection
- Advanced spinning detection with LLM confirmation
- Graceful shutdown with full state preservation

**What you get:** The human directs at the outcome level. The PM translates, delegates, monitors, and escalates.

---

## 8. Relationship to Existing Patterns

### What the PM Reuses

| Existing pattern | PM equivalent | How it's used |
|-----------------|---------------|---------------|
| dm-work orchestrator's subagent template | Worker prompt template | Extended with bounded autonomy rules |
| dm-work's file ownership model | Worker `owned_files` | Same concept, PM-enforced externally |
| Beads issue tracking | Bead-per-worker assignment | PM reads beads, assigns to workers |
| dm-work's quality gates | Gate execution | Same commands, PM runs them on integration |
| dm-work's session rotation | Token-triggered rotation | Same idea, PM manages externally via journal |
| dm-team's tiered delegation | Worker as bounded orchestrator | Workers can spawn own subagents (L5 within L7.5) |
| dm-team's council | (Not directly reused) | PM's NL calls serve a similar advisory role |

### What the PM Replaces

| Current approach | PM replacement | Why |
|-----------------|----------------|-----|
| Human decomposes work | PM translates feedback into worker instructions | Automates the articulation bridge |
| Human monitors progress | PM tracks via journals + gate results | Continuous, not periodic |
| Human catches coherence issues | PM's coherence monitoring | Systematic, not ad-hoc |
| Human manages session rotation | PM monitors tokens, triggers rotation automatically | No manual checkpoint needed |
| Human resolves merge conflicts | PM auto-resolves trivial, escalates complex | Reduces human merge burden |

### What's New

| Capability | Why it doesn't exist yet |
|-----------|------------------------|
| Escalation learning | No persistent decision tracking across sessions today |
| Project personality | Preferences live in CLAUDE.md but don't accumulate |
| Cross-worker coherence | Single-session tools can't see across workers |
| Demo system | No structured demo format today |
| Human availability protocol | Workers block indefinitely today if human is away |
| Feedback contradiction detection | No systematic check for conflicting instructions |

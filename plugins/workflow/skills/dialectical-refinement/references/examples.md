# Refinement Examples

## Before and After

### Example 1: Vague Feature Request

**Before Refinement:**
```
Title: Add caching to API

Description: We should add caching to make the API faster.
```

**After Refinement:**
```
Title: Add Redis response caching for GET /users endpoint

Description:
Cache GET /users responses in Redis with 5-minute TTL.
~60 lines across 3 files.

Design:
- Add redis client to src/lib/redis.ts
- Add caching middleware to src/middleware/cache.ts
- Wire middleware to GET /users in src/routes/users.ts
- Cache key format: `users:list:{queryHash}`

Acceptance Criteria:
1. Second request within 5 min returns cached response
2. Cache miss logs to console
3. Cache can be bypassed with `Cache-Control: no-cache` header
4. Redis connection failure falls back to no-cache (not error)

Out of Scope:
- Cache invalidation on user changes (future task)
- Caching other endpoints (separate tasks per endpoint)
- Cache warming (not needed for this use case)

Complexity: m
Labels: [refined]
```

### Example 2: Epic Breakdown

**Before:**
```
Title: User Authentication System
Type: epic
Description: Add login/logout functionality
```

**After Breakdown:**
```
Epic: User Authentication System (refined)
├── Task: Add password hashing utility (xs, refined)
├── Task: Create User model with auth fields (s, refined)
├── Task: Implement login endpoint (m, needs-refinement)
├── Task: Implement logout endpoint (s, refined)
├── Task: Add session middleware (m, needs-refinement)
└── Task: Create login UI component (m, needs-refinement)

Dependencies:
- Login endpoint blocks Logout endpoint
- User model blocks Login endpoint
- Password hashing blocks User model
```

## The Dialectical Arc

| Phase | Role | Cognitive Mode |
|-------|------|----------------|
| 1. Formalize | Thesis | Analysis + Protection |
| 2. Propose Cuts | Antithesis | Criticism (proposals only) |
| 3. Challenge | Antithesis to antithesis | Advocacy (per-proposal) |
| 4. Scope Lock | Checkpoint | Verification |
| 5. Synthesize | Synthesis | Integration |

This mirrors classical dialectical reasoning—structured tension that surfaces and resolves conflicts *before* code is written.

## Example: Proposer/Advocate Exchange

### Phase 2 Output (Proposer)

```markdown
## PROTECTED (never cut)
- Core CRUD operations — essential workflow
- `--json` output on all commands — agent primitives
- `--range` flag — agent primitives, enables non-linear work
- User authentication — explicitly requested

## PROPOSED CUTS

### Strong Cut Candidates (high confidence)
- `--interactive` mode — Agents don't use TUI
- `--template` flag — Premature abstraction

### Moderate Cut Candidates (medium confidence)
- `narrate` command — Closes feedback loop but adds LLM complexity
- `--batch` mode — Could defer, but note token efficiency concerns

### Weak Cut Candidates (low confidence, protect carefully)
- `skill` meta-command — Meta-tooling, but user mentioned wanting it
```

### Phase 3 Output (Advocate)

```markdown
## ADVOCATE RESPONSES

### Strong Cuts — Agreed
- `--interactive` — Agree: agents don't use interactive modes
- `--template` — Agree: YAGNI, can add later if pattern emerges

### Moderate Cuts — Contested
- `narrate` — Contest: feedback loop is core to agent DX; LLM call is cheap
- `--batch` — Contest: token efficiency is protected category; keep

### Weak Cuts — Recommendations
- `skill` — Keep: user explicitly mentioned, low implementation cost

### Cheap Additions Missed
- `--dry-run` flag — Show what would happen without executing (low effort)
```

### Phase 4: Scope Lock

| Check | Status | Notes |
|-------|--------|-------|
| Core workflow preserved | ✅ | CRUD intact |
| Agent primitives preserved | ✅ | --json, --range kept |
| User requests addressed | ✅ | Auth, skill included |
| Structured output | ✅ | --json on all |
| Token efficiency | ✅ | --batch preserved |

**Too Thin Indicators:** 0 triggered. Proceed to Synthesize.

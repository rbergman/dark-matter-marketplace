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

| Pass | Role | Cognitive Mode |
|------|------|----------------|
| 1. Formalize | Thesis | Analysis |
| 2. Simplify | Antithesis | Criticism |
| 3. Challenge | Antithesis to antithesis | Advocacy |
| 4. Synthesize | Synthesis | Integration |

This mirrors classical dialectical reasoning—structured tension that surfaces and resolves conflicts *before* code is written.

---
name: dm:typescript-pro
description: Expert TypeScript developer specializing in advanced type system usage, full-stack development, and build optimization. This skill should be used PROACTIVELY when working on any TypeScript code - implementing features, reviewing configurations, or debugging type errors. Use unless a more specific subagent role applies.
---

# TypeScript Pro

Senior-level TypeScript expertise for production projects. Focuses on strict type safety, zero-any tolerance, and TypeScript's full type system capabilities.

## When Invoked

1. Review `tsconfig.json` and `eslint.config.js` for project conventions
2. For build system setup, invoke the **just-pro** skill (covers just vs make)
3. Apply type-first development and established project patterns

## Core Standards

**Non-Negotiable:**
- Strict mode enabled with all compiler flags
- **NO explicit or implicit `any`** - use `unknown` and narrow
- **NO type assertions to circumvent the type system** (`as any`, `as unknown as T`)
- **NO dangling promises** - await, return, or void explicitly
- All exported functions have explicit return types
- ESLint strict-type-checked passes with project configuration
- Table-driven tests for multiple cases

**Foundational Principles:**
- **Single Responsibility**: One module = one purpose, one function = one job
- **No God Objects**: Split large classes/objects; if it has 10+ methods or properties, decompose
- **Dependency Injection**: Pass dependencies via constructor/params, don't instantiate internally
- **Small Interfaces**: Prefer many small types over few large ones; compose with intersection types
- **Composition over Inheritance**: Use object composition and mixins, not deep class hierarchies

---

## Project Setup (TypeScript 5.5+)

### New Project Quick Start

```bash
# Initialize
npm init -y
npm install -D typescript typescript-eslint @eslint-community/eslint-plugin-eslint-comments vitest husky

# Copy configs from this skill's references/ directory:
#   references/tsconfig.strict.json  → tsconfig.json
#   references/eslint.config.js      → eslint.config.js

# Add scripts to package.json:
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint src/"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.check="npm run typecheck && npm run lint && npm run test"
npm pkg set scripts.prepare="husky"

# Set up pre-commit hook
npm run prepare
echo "npm run check" > .husky/pre-commit
chmod +x .husky/pre-commit

# Verify
npm run check
```

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
npm install              # Gets all tools automatically
npm run check            # Or: just check
```

**Why strict configs?** Type errors caught at compile time are 10x cheaper than runtime bugs. Strict linting prevents `any` from leaking through the codebase.

---

## Build System

**Invoke the `just-pro` skill** for build system setup. It covers:
- Simple repos vs monorepos
- Hierarchical justfile modules
- TypeScript-specific templates (`references/package-ts.just`)

**Alternative**: Use npm scripts directly if just is unavailable.

---

## Quality Assurance

**Auto-Fix First** - Always try auto-fix before manual fixes:

```bash
npx eslint src/ --fix        # Fixes style, imports, etc.
npx tsc --noEmit             # Type check without emit
```

**Verification:**
```bash
npm run check                # typecheck + lint + test
```

**Pre-commit Hook** (automatic if husky configured):
- Runs `npm run check` before every commit
- Blocks commits with type errors, lint violations, or failing tests

---

## Linting Configuration

For new projects, copy the ESLint strict config:
```bash
# references/eslint.config.js → eslint.config.js
```

**Key rule categories:**

| Category | Purpose |
|----------|---------|
| Type Safety | no-explicit-any, no-unsafe-*, no-non-null-assertion |
| Promises | no-floating-promises, no-misused-promises, require-await |
| Assertions | no-unsafe-type-assertion, consistent-type-assertions |
| Complexity | complexity, max-depth, max-lines-per-function |
| Comments | ban-ts-comment (requires @ts-expect-error with description) |

---

## Quick Reference

### Type Safety Patterns

| Pattern | Use |
|---------|-----|
| `unknown` over `any` | Safe default for unknown types |
| Type guards | Runtime narrowing with type safety |
| Discriminated unions | State machines, tagged unions |
| Branded types | Domain modeling (UserId vs string) |
| `satisfies` operator | Validate without widening |
| `as const` | Literal types from values |

### Error Handling

| Pattern | Use |
|---------|-----|
| `Result<T, E>` type | Explicit success/failure |
| `never` exhaustive check | Catch unhandled cases |
| Custom error classes | Typed error discrimination |
| Zod validation | Runtime + compile-time safety |

### Type System Techniques

- Generic constraints and variance
- Conditional types with `infer`
- Mapped types with modifiers
- Template literal types
- Index access types (`T[K]`)

### Project Organization

```
project/
├── src/
│   ├── index.ts          # Entry point / exports
│   ├── types/            # Shared type definitions
│   └── lib/              # Implementation
├── tsconfig.json
├── eslint.config.js
├── package.json
└── justfile
```

**Rules:** One module = one purpose. Use barrel exports sparingly. Avoid circular dependencies.

---

## Anti-Patterns

- `as any` or `as unknown as T` type assertions
- `@ts-ignore` instead of `@ts-expect-error` with reason
- Disabling strict checks to fix errors
- Implicit any in function parameters
- Dangling promises without await/void
- Over-complicated generic signatures
- `!` non-null assertions instead of proper narrowing
- Truthy/falsy checks on non-booleans
- God classes/objects with 10+ methods or properties
- Deep inheritance hierarchies (prefer composition)
- Barrel files that re-export everything (causes circular deps)

---

## Framework-Specific

**React 19+**: Explicit props typing (avoid `FC`), use `satisfies` for configs.

**Next.js**: Type server components, use `Metadata` types, type API routes.

**Express/Fastify**: Type request handlers, use generic route parameters.

See `references/integration.md` for detailed framework patterns.

---

## AI Agent Guidelines

**Before writing code:**
1. Read `tsconfig.json` for compiler options and strict settings
2. Check `eslint.config.js` for project-specific lint rules
3. Identify existing type patterns in the codebase to follow

**When writing code:**
1. Start with type definitions before implementation
2. Use `unknown` and narrow with type guards - never `any`
3. Handle all promise returns explicitly
4. Add explicit return types to exported functions

**Before committing:**
1. Run `npm run check` (standard for single packages)
2. For monorepos at repo root: `just check` or `turbo run check`
3. Fallback: `npx eslint src/ --fix && npx tsc --noEmit && npm test`

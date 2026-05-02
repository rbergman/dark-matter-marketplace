---
name: typescript-pro
description: Expert TypeScript developer specializing in advanced type system usage, full-stack development, and build optimization. Use PROACTIVELY when working on any TypeScript code - implementing features, reviewing configurations, or debugging type errors, even if not explicitly requested. Applies unless a more specific subagent role overrides.
---

# TypeScript Pro

Senior-level TypeScript expertise for production projects. Focuses on strict type safety, zero-any tolerance, and TypeScript's full type system capabilities.

## When Invoked

1. Review `tsconfig.json` and `eslint.config.js` for project conventions
2. For build system setup, invoke the **just-pro** skill (covers just vs make)
3. Apply type-first development and established project patterns

## Core Standards

**Required:**
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

### Version Management

Pin Node version with [mise](https://mise.jdx.dev): `mise use node@22` (creates `.mise.toml` — commit it). Team members run `mise install`. See **mise** skill for setup.

### New Project Quick Start

```bash
# Initialize
npm init -y
npm install -D typescript typescript-eslint @eslint-community/eslint-plugin-eslint-comments eslint-plugin-sonarjs prettier lint-staged vitest

# Add scripts to package.json:
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint src/"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.check="npm run typecheck && npm run lint && npm run test"

# Configure lint-staged (formats only staged files on commit)
npm pkg set lint-staged --json '{"*.{ts,tsx}": ["prettier --write"], "*.{json,yml,yaml}": ["prettier --write"]}'

# Create .prettierignore (prevent formatting machine-generated and non-TS files)
cat > .prettierignore << 'EOF'
# ============================================================================
# DO NOT ADD SOURCE FILES HERE TO WORK AROUND LINE LENGTH LIMITS.
#
# If prettier expansion pushes a file past max-lines (400) or
# max-lines-per-function (60), the file needs to be DECOMPOSED — extract
# functions, split into modules, rearchitect. That is the engineering fix.
#
# Adding source files here suppresses formatting without fixing the real
# problem. The line limits are design signals, not obstacles to route around.
# ============================================================================

# Machine-generated / non-source (safe to exclude)
coverage/
dist/
node_modules/
.worktrees/
.timbers/
.beads/
EOF

# Verify
npm run check
```

### Pre-commit Hook

Quality gates run via a git pre-commit hook. With beads 1.0+, hooks live in **`.beads/hooks/`** (committed to git, managed by `bd hooks install --beads`). Beads, timbers, and your quality gates all coexist in the same hook file via section markers — content outside markers is preserved across reinstalls.

**Setup:**
1. `bd init` (creates `.beads/hooks/` and sets `core.hooksPath = .beads/hooks`)
2. `timbers hooks install` (detects `core.hooksPath`, appends into existing files alongside beads)
3. Add quality gates between the BEADS and TIMBERS marker sections — they're preserved across `bd hooks install --force` and `timbers hooks install` reruns

**Pre-commit hook structure** (`.beads/hooks/pre-commit`):
```bash
#!/usr/bin/env sh
# --- BEGIN BEADS INTEGRATION v1.0.x ---  (managed — do not edit)
# ... bd hooks run pre-commit shim ...
# --- END BEADS INTEGRATION v1.0.x ---

# Quality gates (preserved across reinstalls — outside markers)
if [ -f .git/MERGE_HEAD ]; then
  echo "Merge commit — skipping lint-staged"
else
  npx lint-staged
fi
if command -v just >/dev/null 2>&1 && [ -f justfile ]; then
  just check
else
  npm run check
fi

# --- timbers section (managed by timbers hooks install)
# ... timbers hook run pre-commit shim ...
# --- end timbers section ---
```

**Why this order:** Beads runs first (fast: bd's internal hook handles auto-export+stage of `.beads/issues.jsonl`). Quality gates run next (slowest, may fail — but `bd export` already happened, so beads state is captured even if gates fail and the commit aborts). Timbers runs last (post-gate, post-export).

**Auto-export defaults (beads 1.0+):**
- `export.auto = true` — every `bd` mutation writes `.beads/issues.jsonl` (60s throttled)
- `export.git-add = true` — auto-stages it
- The pre-commit hook forces a flush, so commits always carry current state

**Justfile recipe:**
```just
hooks:
    @bd hooks install --force --beads >/dev/null && echo "  ✅ beads hooks installed"
    @if command -v timbers >/dev/null 2>&1; then \
        timbers hooks install >/dev/null && echo "  ✅ timbers hooks installed"; \
    fi
    @current=$(git config --get core.hooksPath 2>/dev/null || true); \
    if [ "$current" != ".beads/hooks" ]; then \
        git config core.hooksPath .beads/hooks; \
        echo "  ✅ core.hooksPath fixed to .beads/hooks (was $current)"; \
    fi
```

**Note on `core.hooksPath`:** `bd hooks install --force` may set this to an absolute path. Force it relative — worktrees share repo config, and an absolute path won't resolve from a worktree's working dir.

**New dev/agent onboarding:** `git clone <repo> && just setup` (which includes `just hooks`).

If a project currently uses husky, migrate:
```bash
npm uninstall husky && rm -rf .husky && npm pkg delete scripts.prepare
bd hooks install --force --beads
git config core.hooksPath .beads/hooks
# Move any custom hook content into .beads/hooks/<hook> outside the BEADS markers
```

### Monorepo Variant

In monorepos (multiple packages, possibly mixed languages), adjust the setup:

**lint-staged: scoped to TS packages only.** Don't format Go/Rust code with Prettier — they have their own formatters (goimports, rustfmt).

```bash
# Root package.json (npm workspaces / turborepo):
npm pkg set lint-staged --json '{"packages/web/**/*.{ts,tsx}": ["prettier --write"], "*.{json,yml,yaml}": ["prettier --write"]}'

# Or independent packages (no workspaces): install lint-staged per TS package
```

**Pre-commit: lint-staged only, no `npm run check`.** Full quality gates across all packages are too slow for pre-commit. Run lint-staged in the hook, run full gates via `just check` or CI.

```bash
# .beads/hooks/pre-commit (between BEADS markers and timbers section):
npx lint-staged
```

(beads 1.0+ auto-exports + auto-stages `.beads/issues.jsonl` on every mutation; the manual export+stage lines older docs showed are no longer needed.)

For mixed-language monorepos without workspaces, detect which packages have staged files:

```bash
if git diff --cached --name-only | grep -q '^packages/web/'; then
  (cd packages/web && npx lint-staged)
fi
```

**`.prettierrc`: root-level.** Prettier walks up the directory tree, so a single root config covers all TS packages. Use per-package configs only if packages need different formatting.

**Required Config Files:** Copy `references/gitignore` → `.gitignore`, `references/prettierrc.json` → `.prettierrc`, then create `tsconfig.json` and `eslint.config.js` per the templates below.

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
just setup               # Runs mise trust/install + npm ci
just check               # Verify everything works
```

Or manually:
```bash
mise trust && mise install  # Get pinned Node version
npm ci                      # Get dependencies
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
npx prettier --write src/    # Format changed files
npx eslint src/ --fix        # Fixes style, imports, etc.
npx tsc --noEmit             # Type check without emit
```

**Verification:**
```bash
npm run check                # typecheck + lint + test
npm audit --omit=dev --audit-level=high   # vulnerability check (production deps only)
```

Or via just (which combines both):
```bash
just check
```

**Pre-commit Hook** (git hook with lint-staged):
- lint-staged formats only staged files via Prettier (no whole-repo formatting)
- Then `npm run check` runs typecheck + lint + test
- Blocks commits with formatting issues, type errors, lint violations, or failing tests
- Lives in `.beads/hooks/pre-commit` alongside beads/timbers hooks (not husky, not `.git/hooks/`)
- `.prettierignore` must exclude `.timbers/` and `.beads/` — without this, lint-staged reformats timbers JSON during commit, but its stash/restore cycle puts the original format back in the working tree, creating perpetual `MM` diffs with no semantic content

---

## Linting Configuration

### eslint.config.js Template

When creating a new project, use this complete template — omitting rules allows `any` to leak through the codebase.

```javascript
import tseslint from 'typescript-eslint';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      // === TYPE SAFETY (non-negotiable) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // === PROMISES ===
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: true }],
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // === COMPLEXITY LIMITS ===
      // These limits exist to trigger EXTRACTION into well-named companion
      // files/functions — NOT to compress code, remove comments, combine
      // statements, or shorten names. When violated, decompose by responsibility.
      'complexity': ['error', { max: 10 }],
      'sonarjs/cognitive-complexity': ['error', 15],
      'max-depth': ['error', 4],
      'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: false, ignoreTemplateLiterals: false, ignoreRegExpLiterals: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 400, skipComments: true }],
      'max-params': ['error', 4],

      // === BLOCK DISABLING CRITICAL RULES ===
      '@eslint-community/eslint-comments/no-restricted-disable': ['error',
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-argument',
        '@typescript-eslint/no-floating-promises',
        'complexity', 'sonarjs/cognitive-complexity', 'max-len', 'max-lines-per-function', 'max-lines',
      ],
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: ['eslint-enable'] }],

      // === COMMENTS ===
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        minimumDescriptionLength: 10,
      }],

      // === CONSISTENCY ===
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Relax for tests
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'complexity': 'off',
      'sonarjs/cognitive-complexity': 'off',
      '@eslint-community/eslint-comments/no-restricted-disable': 'off',
    },
  },
  { ignores: ['dist/', 'node_modules/', 'coverage/', '*.js', '*.cjs', '*.mjs'] },
);
```

### Responding to Limit Violations

**These limits exist to improve code architecture, not to be gamed.** When a file or function exceeds a limit, the correct response is to decompose by responsibility — not to make the code fit by any means necessary.

**Extract, don't compress:**
1. Identify logical sections (validation, transformation, formatting, I/O)
2. Extract each into a well-named function or module — the function name itself documents what the section does
3. Place extracted code in a companion file in the same directory (e.g., `order-service.ts` → `order-validation.ts`, `order-transforms.ts`)

**When extraction is costly** (many locals to pass), use a context/options object. If splitting would duplicate state, the code may need a different decomposition axis (by entity rather than by phase).

**Prohibited responses to limit violations:**
- Combining statements onto single lines to dodge file/function length limits (`max-len` at 120 catches this — the line limit and file limit work together)
- Removing or shortening comments
- Compressing whitespace or collapsing readable formatting
- Shortening descriptive variable/function names
- Inlining helper functions to reduce function count
- Adding source files to `.prettierignore` so prettier won't expand them back

Any of these trades one problem (length) for a worse one (readability). The goal is clean architecture, not metric compliance. Prettier enforces consistent formatting, so compressed code will be expanded back to its readable form — and `max-len` prevents the line-combining workaround entirely. Extraction is the only sustainable fix.

### Enforced Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| `max-len` | 120 chars | Prevent line-combining to dodge file/function limits |
| `max-lines` | 400 code | Prevent god modules (comments excluded) |
| `max-lines-per-function` | 60 | Single responsibility |
| `complexity` | 10 | Cyclomatic complexity (branching paths) |
| `sonarjs/cognitive-complexity` | 15 | Cognitive complexity (perceived difficulty) |
| `max-depth` | 4 | Avoid arrow code |
| `max-params` | 4 | Use options objects |

Critical rules **cannot be disabled via eslint-disable comments** - the config blocks it.

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
- **Using `eslint-disable` to bypass type safety or complexity rules** (blocked by config)
- Implicit any in function parameters
- Dangling promises without await/void
- Over-complicated generic signatures
- Non-null assertions (the `x!` operator) instead of proper narrowing
- Truthy/falsy checks on non-booleans
- Functions over 60 lines or files over 400 lines (extract into companion files, don't compress)
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
1. Run `just check` (includes typecheck + lint + test + vulnerability audit)
2. Fallback: `npm run check && npm audit --omit=dev --audit-level=high`
3. For monorepos at repo root: `just check` or `turbo run check`
4. Fallback: `npx eslint src/ --fix && npx tsc --noEmit && npm test`

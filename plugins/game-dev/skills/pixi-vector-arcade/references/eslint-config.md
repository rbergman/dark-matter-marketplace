# ESLint Configuration

Strict TypeScript rules for game development. These rules enforce complexity limits and prevent common anti-patterns.

---

## Full Configuration

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
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
      // ===================
      // TYPE SAFETY
      // ===================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // ===================
      // COMPLEXITY LIMITS
      // ===================
      // Prevents god objects and unmaintainable functions
      'complexity': ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 3],

      // ===================
      // CODE QUALITY
      // ===================
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],

      // ===================
      // PREVENT DISABLING CRITICAL RULES
      // ===================
      '@eslint-community/eslint-comments/no-restricted-disable': [
        'error',
        // Type safety - never disable
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-unsafe-argument',
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-call',
        '@typescript-eslint/no-unsafe-member-access',
        '@typescript-eslint/no-unsafe-return',
        // Complexity - never disable
        'complexity',
        'max-lines-per-function',
        'max-lines',
        'max-depth',
      ],

      // ===================
      // TYPESCRIPT SPECIFIC
      // ===================
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },
  {
    // Test file overrides
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js'],
  }
);
```

---

## Rule Explanations

### Complexity Limits

| Rule | Value | Rationale |
|------|-------|-----------|
| `complexity` | 10 | Functions with cyclomatic complexity >10 are hard to test |
| `max-depth` | 4 | Deep nesting signals extraction needed |
| `max-lines-per-function` | 60 | Forces single-responsibility functions |
| `max-lines` | 400 | Files >400 lines usually need splitting |
| `max-params` | 4 | More params → use options object |

### No-Disable Rules

These rules **cannot be disabled with eslint-disable comments**:
- All `@typescript-eslint/no-unsafe-*` rules
- `@typescript-eslint/no-explicit-any`
- `complexity`, `max-lines-per-function`, `max-lines`, `max-depth`

If code violates these rules, **refactor it**—don't disable the rule.

---

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Key TypeScript Flags

| Flag | Purpose |
|------|---------|
| `noUncheckedIndexedAccess` | Array/object access returns `T \| undefined` |
| `exactOptionalPropertyTypes` | Distinguishes `{ a?: string }` from `{ a: string \| undefined }` |
| `noImplicitReturns` | All code paths must return |
| `strict` | Enables all strict checks |

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

---

## Pre-commit Hooks

```bash
# Install husky
npm install -D husky
npx husky init

# .husky/pre-commit
npm run lint
npm run typecheck
npm run test -- --run
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## Dealing with Violations

### Complexity Violation

```typescript
// ❌ BAD: complexity 15
function processEntity(entity: Entity): void {
  if (entity.type === 'player') {
    if (entity.health > 0) {
      if (entity.isMoving) {
        // ...nested logic
      }
    }
  } else if (entity.type === 'enemy') {
    // ...more branches
  }
}

// ✅ GOOD: Split into focused functions
function processEntity(entity: Entity): void {
  if (entity.type === 'player') {
    processPlayer(entity);
  } else if (entity.type === 'enemy') {
    processEnemy(entity);
  }
}

function processPlayer(player: Entity): void {
  if (!isAlive(player)) return;
  if (player.isMoving) updatePlayerMovement(player);
}
```

### Max-Lines Violation

Split file by responsibility:
- `player.ts` → `player-movement.ts`, `player-combat.ts`, `player-state.ts`
- `collision.ts` → `collision-detection.ts`, `collision-response.ts`

### Max-Params Violation

```typescript
// ❌ BAD: 6 params
function createEnemy(x: number, y: number, type: string, health: number, speed: number, damage: number): Enemy

// ✅ GOOD: Options object
interface EnemyConfig {
  position: Vec2;
  type: EnemyType;
  health: number;
  speed: number;
  damage: number;
}

function createEnemy(config: EnemyConfig): Enemy
```

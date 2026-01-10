// TypeScript ESLint Strict Configuration Template
// Copy to project root as eslint.config.js
// Requires: npm install -D eslint typescript-eslint @eslint-community/eslint-plugin-eslint-comments
//
// Usage: npx eslint src/
// Auto-fix: npx eslint src/ --fix

import tseslint from 'typescript-eslint';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';

export default tseslint.config(
  // --- Base: Strict Type-Checked ---
  // Includes recommended + recommended-type-checked + strict rules requiring type info
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // --- Main Configuration ---
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
      // ============================================================
      // TYPE SAFETY - Zero tolerance for type system escape hatches
      // ============================================================

      // Ban `any` - the root of all type unsafety
      '@typescript-eslint/no-explicit-any': 'error',

      // Catch `any` leaking through the codebase
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Ban unsafe type assertions that narrow without validation
      '@typescript-eslint/no-unsafe-type-assertion': 'error',

      // Force catch variables to be unknown, not any
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',

      // Ban non-null assertions (!) - use proper narrowing instead
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Type assertions: prefer `as const`, ban `as any` patterns
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      }],

      // ============================================================
      // PROMISE HANDLING - Prevent async footguns
      // ============================================================

      // No dangling promises - must be awaited, returned, or voided explicitly
      '@typescript-eslint/no-floating-promises': ['error', {
        ignoreVoid: true,  // Allow `void promise` for intentional fire-and-forget
        ignoreIIFE: true,
      }],

      // Prevent promises in wrong contexts (if conditions, array callbacks, etc.)
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: {
          arguments: true,
          attributes: false,  // Allow in JSX onClick etc.
        },
      }],

      // Async functions should actually await something
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // ============================================================
      // COMMENT DIRECTIVES - No silent escapes
      // ============================================================

      // Ban @ts-ignore - use @ts-expect-error with explanation instead
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,           // Banned entirely
        'ts-nocheck': true,          // Banned entirely
        'ts-check': false,           // Allow
        minimumDescriptionLength: 10, // Require meaningful explanation
      }],

      // Prevent disabling critical lint rules via comments
      '@eslint-community/eslint-comments/no-restricted-disable': ['error',
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-argument',
        '@typescript-eslint/no-unsafe-call',
        '@typescript-eslint/no-unsafe-member-access',
        '@typescript-eslint/no-unsafe-return',
        '@typescript-eslint/no-floating-promises',
        'complexity',
        'max-lines-per-function',
        'max-lines',
      ],

      // Require eslint-disable comments to have descriptions
      '@eslint-community/eslint-comments/require-description': ['error', {
        ignore: ['eslint-enable'],
      }],

      // ============================================================
      // CODE QUALITY - Structural limits
      // ============================================================

      // Cyclomatic complexity - keep functions simple
      'complexity': ['error', { max: 10 }],

      // Maximum nesting depth - avoid arrow code
      'max-depth': ['error', 4],

      // Function length - encourage single responsibility
      'max-lines-per-function': ['error', {
        max: 60,
        skipBlankLines: true,
        skipComments: true,
      }],

      // File length - prevent god modules
      'max-lines': ['error', {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }],

      // Maximum parameters - use options objects for complex APIs
      'max-params': ['error', 4],

      // ============================================================
      // EXPLICIT CONTRACTS - Clear interfaces
      // ============================================================

      // Require return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Require explicit member accessibility (public/private/protected)
      '@typescript-eslint/explicit-member-accessibility': ['error', {
        accessibility: 'explicit',
        overrides: {
          constructors: 'no-public',
        },
      }],

      // ============================================================
      // CONSISTENCY - Uniform patterns
      // ============================================================

      // Prefer type imports for type-only usage (tree-shaking)
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],

      // Prefer type exports
      '@typescript-eslint/consistent-type-exports': 'error',

      // Enforce consistent array types (T[] for simple, Array<T> for complex)
      '@typescript-eslint/array-type': ['error', {
        default: 'array-simple',
      }],

      // Use Record<K, V> instead of { [key: K]: V }
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],

      // ============================================================
      // UNUSED CODE - Keep codebase clean
      // ============================================================

      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // No empty functions without comment
      '@typescript-eslint/no-empty-function': ['error', {
        allow: ['private-constructors', 'protected-constructors'],
      }],

      // ============================================================
      // SAFETY NETS - Additional protections
      // ============================================================

      // Prefer nullish coalescing (??) over logical or (||)
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Prefer optional chaining (?.) over && chains
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Switch statements must be exhaustive
      '@typescript-eslint/switch-exhaustiveness-check': ['error', {
        requireDefaultForNonUnion: true,
      }],

      // No unnecessary boolean literal comparisons
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

      // No unnecessary type assertions
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // Strict boolean expressions - no truthy/falsy coercion
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowString: false,
        allowNumber: false,
        allowNullableObject: true,  // Allow if (obj) for null checks
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
        allowAny: false,
      }],
    },
  },

  // --- Test File Overrides ---
  // Relax rules for test files where flexibility aids testing
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Allow any in test mocks and assertions
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Allow longer test functions and files
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'complexity': 'off',
      'max-depth': 'off',

      // Allow disabling rules in tests
      '@eslint-community/eslint-comments/no-restricted-disable': 'off',
      '@eslint-community/eslint-comments/require-description': 'off',

      // Relax type strictness for test utilities
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },

  // --- Ignores ---
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'coverage/',
      '*.js',           // Ignore JS config files at root
      '*.cjs',
      '*.mjs',
      '.worktrees/',
    ],
  },
);

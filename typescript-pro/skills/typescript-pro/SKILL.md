---
name: typescript-pro
description: Expert TypeScript developer specializing in advanced type system usage, full-stack development, and build optimization. This skill should be used PROACTIVELY when working on any TypeScript code - analyzing types, implementing features, reviewing configurations, or debugging type errors. Use unless a more specific subagent role applies.
---

# TypeScript Pro

## Overview

This skill provides senior-level TypeScript expertise for TypeScript 5.0+ projects, covering advanced type system features, full-stack type safety, and modern build tooling. It enables type-safe patterns for frontend frameworks, Node.js backends, and cross-platform development.

## When Invoked

1. Review tsconfig.json, package.json, and build configurations
2. Analyze existing type patterns, test coverage, and compilation targets
3. Implement solutions leveraging TypeScript's full type system capabilities

## Core Requirements

**Non-Negotiable Standards:**
- Strict mode enabled with all compiler flags
- **NO explicit `any` usage**
- **NO type assertion abuse to circumvent proper typing**
- 100% type coverage for public APIs
- ESLint and Prettier configured
- Source maps properly configured
- Declaration files generated for libraries

## Development Workflow

### 1. Type Architecture Analysis

Before implementation, assess the type system:
- Type coverage and safety gaps
- Generic usage patterns and constraints
- Union/intersection complexity
- Build performance metrics
- Declaration file quality

### 2. Implementation Phase

Apply type-driven development:
- Start with type definitions before implementation
- Design type-first APIs with branded types for domains
- Use discriminated unions for state machines
- Implement type guards and predicates
- Leverage the compiler for correctness validation
- Optimize for inference over explicit annotations

### 3. Type Quality Assurance

Verify before completion:
- Type coverage analysis
- Strict mode compliance
- Build time within acceptable range
- Bundle size verification
- Error message clarity
- IDE performance with types

## Quick Reference

### Advanced Type Patterns

| Pattern | Use Case |
|---------|----------|
| Conditional types | Flexible APIs that adapt based on input |
| Mapped types | Transform existing types systematically |
| Template literal types | String manipulation at type level |
| Discriminated unions | State machines, tagged unions |
| Type predicates/guards | Runtime narrowing with type safety |
| Branded types | Domain modeling (UserId vs string) |
| Const assertions | Literal types from values |
| Satisfies operator | Validate types without widening |

### Type System Techniques

- Generic constraints and variance
- Recursive type definitions
- `infer` keyword for extraction
- Distributive conditional types
- Index access types (`T[K]`)
- Utility type creation

### Error Handling Patterns

- Result types (`Result<T, E>`) for explicit errors
- `never` type for exhaustive checking
- Custom error classes with type discrimination
- Type-safe try-catch wrappers
- Validation error aggregation

## Build & Tooling Checklist

- [ ] tsconfig.json optimized for project type
- [ ] Project references for monorepos
- [ ] Incremental compilation enabled
- [ ] Path mapping configured
- [ ] Module resolution correct for target
- [ ] Source maps for debugging
- [ ] Declaration bundling for libraries
- [ ] Tree shaking optimization verified

## Framework-Specific Guidance

**React 19+**: Use proper component typing, avoid `FC` in favor of explicit props, leverage `satisfies` for config objects.

**Next.js**: Type server components, use `Metadata` types, type API routes with `NextRequest`/`NextResponse`.

**Express/Fastify**: Type request handlers, use generic route parameters, type middleware chains.

## Resources

For detailed type patterns, code generation workflows, and integration guidance, see:
- `references/patterns.md` - Comprehensive type pattern examples
- `references/integration.md` - Framework and tooling integration details

## Anti-Patterns to Avoid

- `as any` or `as unknown as T` type assertions
- Disabling strict checks to fix errors
- Over-complicated generic signatures
- Type assertions instead of type guards
- Ignoring inference in favor of explicit types
- `@ts-ignore` without documented reason

---
name: rust-pro
description: Expert Rust developer specializing in ownership semantics, zero-cost abstractions, and idiomatic patterns. This skill should be used PROACTIVELY when working on any Rust code - implementing features, debugging borrow checker issues, optimizing performance, or reviewing code quality. Use unless a more specific subagent role applies.
---

# Rust Pro

## Overview

This skill provides senior-level Rust expertise for production Rust projects, covering ownership and borrowing, idiomatic patterns, performance optimization, and strict code quality standards. It enables safe, performant systems programming with a focus on zero-cost abstractions and compiler-driven correctness.

## When Invoked

1. Review Cargo.toml, clippy.toml, and rustfmt.toml configurations
2. Analyze existing patterns, module organization, and compilation targets
3. Implement solutions leveraging Rust's ownership system and type safety

## Core Requirements

**Non-Negotiable Standards:**
- All warnings treated as errors (`#![deny(warnings)]`)
- Clippy pedantic lints enabled project-wide
- **NO `unwrap()` or `expect()` in production code** - use `?` or explicit error handling
- **NO `unsafe` without documented safety invariants and justification**
- Zero `#[allow(...)]` without inline justification comment
- rustfmt enforced on all code
- Documentation on all public APIs
- Tests for all non-trivial logic

## Development Workflow

### 1. Ownership & Borrowing Analysis

Before implementation, assess the data flow:
- Ownership transfer vs borrowing needs
- Lifetime requirements and annotations
- Interior mutability patterns (Cell, RefCell, Mutex)
- Reference counting needs (Rc, Arc)
- Clone costs and when to accept them

### 2. Implementation Phase

Apply Rust-first development:
- Start with types and traits before implementation
- Design with composition over inheritance (no inheritance in Rust anyway)
- Use enums + match for exhaustive state handling
- Leverage the compiler for correctness - if it compiles, it should work
- Prefer iterators over manual loops
- Use type state pattern for compile-time state machines
- Minimize allocations where performance matters

### 3. Quality Assurance

Verify before completion:
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo fmt --check`
- `cargo test`
- `cargo doc --no-deps` (ensure docs build)
- No compiler warnings
- Profile for hot paths if performance-critical

## Quick Reference

### Ownership Patterns

| Pattern | Use Case |
|---------|----------|
| Move semantics | Transfer ownership, prevent use-after-move |
| Borrowing (`&T`, `&mut T`) | Temporary access without ownership |
| `Cow<T>` | Clone-on-write for conditional ownership |
| `Box<T>` | Heap allocation, recursive types |
| `Rc<T>` / `Arc<T>` | Shared ownership (single/multi-threaded) |
| `Cell<T>` / `RefCell<T>` | Interior mutability (single-threaded) |
| `Mutex<T>` / `RwLock<T>` | Interior mutability (multi-threaded) |

### Error Handling Patterns

- `Result<T, E>` for recoverable errors - propagate with `?`
- Custom error types implementing `std::error::Error`
- `thiserror` crate for derive-based error types
- `anyhow` for application-level error handling
- Never panic in library code - return `Result`
- Use `#[must_use]` on functions returning important values

### Idiomatic Patterns

| Pattern | Description |
|---------|-------------|
| Builder pattern | Complex construction with fluent API |
| Newtype pattern | Type safety via wrapper structs |
| Type state pattern | Compile-time state machine enforcement |
| RAII | Resource management via Drop trait |
| Deref coercion | Smart pointer ergonomics |
| From/Into traits | Type conversion ergonomics |
| Iterator chains | Functional data transformation |
| Match exhaustiveness | Compiler-enforced case handling |

### Trait Design

- Small, focused traits (Interface Segregation)
- Blanket implementations where appropriate
- Associated types vs generics (choose based on "one impl per type")
- Default implementations for convenience
- Marker traits for compile-time properties
- Extension traits for adding methods to foreign types

## Project Configuration

### Cargo.toml Lints Section

```toml
[lints.rust]
unsafe_code = "deny"
missing_docs = "warn"

[lints.clippy]
all = "deny"
pedantic = "warn"
nursery = "warn"
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
```

### clippy.toml

```toml
cognitive-complexity-threshold = 15
too-many-arguments-threshold = 5
type-complexity-threshold = 250
```

### Source File Header (lib.rs/main.rs)

```rust
#![deny(warnings)]
#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![warn(clippy::nursery)]
#![deny(clippy::unwrap_used)]
#![deny(clippy::expect_used)]
// Allow specific pedantic lints with justification
#![allow(clippy::module_name_repetitions)] // Common in domain modeling
```

## Performance Patterns

### Zero-Cost Abstractions
- Iterators compile to loops
- Traits monomorphize at compile time
- Generics create specialized code
- Inline hints for hot paths (`#[inline]`)

### Allocation Awareness
- Prefer stack allocation for small, fixed-size data
- Use `SmallVec` for usually-small collections
- Pool allocations for frequently created/destroyed objects
- Avoid `clone()` in hot paths - use references
- Pre-allocate with `Vec::with_capacity`

### Concurrency
- Prefer message passing (channels) over shared state
- Use `rayon` for data parallelism
- `Send` and `Sync` for thread safety guarantees
- Atomic types for lock-free data structures
- Scope threads with `std::thread::scope` or `crossbeam`

## Anti-Patterns to Avoid

- `unwrap()` / `expect()` in production code
- `unsafe` without documented invariants
- `clone()` to satisfy borrow checker without understanding why
- Fighting the borrow checker - redesign data flow instead
- Over-generic code that hurts compile times
- Deep trait hierarchies mimicking OOP inheritance
- Stringly-typed APIs - use enums and newtypes
- `#[allow(...)]` without justification comment
- Ignoring clippy suggestions without understanding them

## Bevy-Specific (Game Development)

When working with Bevy ECS:
- Components are data, Systems are behavior
- Use `Query<&T>` for read, `Query<&mut T>` for write
- Prefer `Commands` for entity/component changes over direct World access
- Use `Res<T>` for shared resources, `ResMut<T>` for mutable
- Events for decoupled system communication
- Use `#[derive(Component)]`, `#[derive(Resource)]` macros
- Leverage Bevy's change detection (`Changed<T>`, `Added<T>`)
- Organize systems into plugins for modularity

## AI Agent Collaboration Guidelines

When working with AI coding assistants on Rust code:

**Prompting Best Practices:**
- Provide explicit constraints: "Use `?` for error propagation, no `unwrap()`"
- Share relevant type signatures and trait bounds
- Explain ownership requirements: "This needs to own the data" vs "borrow is fine"
- Iterate on borrow checker issues: "Here's the error, propose a minimal fix"

**Quality Gates for AI-Generated Code:**
- Run `cargo clippy` before accepting suggestions
- Verify ownership model makes sense for the use case
- Check for unnecessary `clone()` calls
- Ensure error handling follows project patterns
- Validate that tests cover the new code

## Resources

For detailed patterns and examples, see:
- `references/patterns.md` - Comprehensive Rust patterns
- `references/bevy.md` - Bevy ECS patterns (if working on games)

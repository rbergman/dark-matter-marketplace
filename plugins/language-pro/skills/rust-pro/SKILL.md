---
name: rust-pro
description: Expert Rust developer specializing in ownership semantics, zero-cost abstractions, and idiomatic patterns. This skill should be used PROACTIVELY when working on any Rust code - implementing features, debugging borrow checker issues, optimizing performance, or reviewing code quality. Use unless a more specific subagent role applies.
---

# Rust Pro

Senior-level Rust expertise following "Boring Rust" principles. Correctness over cleverness. One way to do things. Local reasoning.

## When Invoked

1. Review `Cargo.toml`, `clippy.toml`, and `rustfmt.toml` for project conventions
2. For build system setup, invoke the **just-pro** skill
3. Apply Boring Rust patterns and established project conventions

## Core Standards

**Non-Negotiable:**
- All clippy warnings treated as errors
- **NO `unwrap()` or `expect()` in production code** — use `.context("...")?`
- **NO `unsafe` without `#[human_authored]` designation**
- **NO panic paths** — indexing, unreachable, todo, unimplemented all banned
- Exhaustive match — no wildcard `_` on enums you control
- rustfmt enforced on all code
- Documentation on all public APIs

**Foundational Principles:**
- **Single Responsibility**: One module = one purpose, one function = one job
- **No God Objects**: Split large structs; if it has 10+ fields or methods, decompose
- **Dependency Injection**: Pass dependencies, don't create them internally
- **Clone Freely**: Prefer correctness over premature optimization; clone to satisfy borrow checker
- **Explicit Over Clever**: If you need complex lifetimes, restructure instead

---

## The Three Tiers

### Tier 1: Default (Strict)

All agent-generated code. Maximum guardrails.

```rust
// Complexity limits enforced:
// - Cognitive complexity: 15 max
// - Function lines: 50 max
// - Arguments: 5 max

// Error handling: Always with context
let config = load_config(path)
    .context("failed to load configuration")?;

// Iteration: for loops by default (not iterator chains)
for item in collection {
    process(item)?;
}

// Matching: Exhaustive, no wildcards
match state {
    State::Active => handle_active()?,
    State::Pending => handle_pending()?,
    State::Done => handle_done()?,
    // NO: _ => unreachable!()
}
```

### Tier 2: `#[hot_path]` (Relaxed)

Performance-critical code. Flagged for human review.

```rust
#[hot_path]
pub fn process_batch(records: &[Record]) -> Result<Summary, Error> {
    // Allowed: iterators, borrowing, fewer clones
    records.iter()
        .filter(|r| r.is_valid())
        .try_fold(Summary::default(), |mut acc, r| {
            acc.add(r)?;
            Ok(acc)
        })
}
```

**Relaxations:** Cognitive complexity 20, function lines 75, iterator chains allowed.

### Tier 3: `#[human_authored]` (Unrestricted)

Agent cannot modify, only call. For unsafe, SIMD, complex generics.

```rust
#[human_authored]
pub fn simd_normalize(vectors: &mut [f32x8]) {
    // Agent treats as black box
}
```

---

## Project Setup (Rust 1.83+)

### Version Management with mise

[mise](https://mise.jdx.dev) manages language runtimes per-project. For Rust, this complements rustup by pinning the exact toolchain version.

```bash
# Install mise (once)
curl https://mise.run | sh

# In project root
mise use rust@1.83

# Creates .mise.toml — commit it
# Team members just run: mise install
```

Alternatively, use `rust-toolchain.toml` (rustup-native) if you prefer not to add mise as a dependency.

### New Project Quick Start

```bash
# Initialize
cargo new project-name && cd project-name

# Copy configs from this skill's references/ directory:
#   references/gitignore        → .gitignore
#   references/clippy.toml      → clippy.toml
#   references/cargo_lints.toml → merge into Cargo.toml [lints] section
#   references/rustfmt.toml     → rustfmt.toml

# For build system, invoke just-pro skill

# Verify
just check   # Or: cargo clippy && cargo test
```

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
just setup               # Runs mise trust/install + cargo build
just check               # Verify everything works
```

Or manually:
```bash
mise trust && mise install  # Get pinned Rust toolchain
cargo build                 # Get dependencies
```

**Why Boring Rust?** Agent-generated code that compiles is usually correct. Complex patterns cause agents to produce incorrect or unmaintainable code.

---

## Build System

**Invoke the `just-pro` skill** for build system setup. It covers:
- Simple repos vs monorepos
- Hierarchical justfile modules
- Rust-specific templates

**Why just?** Consistent toolchain frontend between agents and humans.

---

## Quality Assurance

**Auto-Fix First:**

```bash
just fix             # Or: cargo clippy --fix && cargo fmt
```

**Verification:**
```bash
just check           # Or: cargo clippy --all-targets -- -D warnings && cargo test
```

Use `--all-targets` to lint tests, examples, and benches too.

---

## Quick Reference

### Error Handling

```rust
// Libraries: thiserror for typed errors
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing field: {field}")]
    MissingField { field: &'static str },

    #[error("failed to read file")]
    Io(#[from] std::io::Error),
}

// Applications: anyhow with context
pub fn load_config(path: &Path) -> anyhow::Result<Config> {
    let content = fs::read_to_string(path)
        .context("failed to read config file")?;

    toml::from_str(&content)
        .context("failed to parse config")
}

// Option handling: explicit, never silent
let user = users.get(&id)
    .ok_or_else(|| Error::NotFound { id: id.clone() })?;
```

### State Machines

```rust
pub enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32, started: Instant },
    Connected { session: Session },
}

impl ConnectionState {
    pub fn connect(&mut self) -> Result<(), Error> {
        match self {
            Self::Disconnected => {
                *self = Self::Connecting {
                    attempt: 1,
                    started: Instant::now(),
                };
                Ok(())
            }
            Self::Connecting { .. } => Err(Error::AlreadyConnecting),
            Self::Connected { .. } => Err(Error::AlreadyConnected),
        }
    }
}
```

### Builder Pattern (bon crate)

```rust
use bon::Builder;

#[derive(Debug, Builder)]
pub struct ServerConfig {
    #[builder(default = 8080)]
    port: u16,
    host: String,  // Required
    #[builder(default)]
    timeout: Option<Duration>,
}

let config = ServerConfig::builder()
    .host("localhost".to_string())
    .build();
```

### Newtype Pattern

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId(String);

impl UserId {
    pub fn new(raw: impl Into<String>) -> Result<Self, ValidationError> {
        let s = raw.into();
        if s.is_empty() {
            return Err(ValidationError::Empty("user_id"));
        }
        Ok(Self(s))
    }

    pub fn as_str(&self) -> &str { &self.0 }
}
```

### Async (Blessed Subset)

```rust
// GOOD: Owned data in, owned data out
pub async fn fetch_user(client: &Client, id: UserId) -> Result<User, Error> {
    let response = client
        .get(format!("/users/{}", id.as_str()))
        .send()
        .await
        .context("request failed")?;

    response.json::<User>().await
        .context("failed to parse response")
}

// GOOD: Structured concurrency
pub async fn fetch_all(client: &Client, ids: Vec<UserId>) -> Result<Vec<User>, Error> {
    futures::future::try_join_all(
        ids.into_iter().map(|id| fetch_user(client, id))
    ).await
}

// BANNED: Complex lifetime bounds in async
async fn bad<'a>(data: &'a [u8]) -> &'a str { ... }

// BANNED: select!, manual Poll
```

### Test File Separation

```rust
// src/parser.rs - production code only, keeps file small
#[cfg(test)]
#[path = "parser_tests.rs"]
mod tests;

// src/parser_tests.rs - can have test relaxations
#![allow(clippy::unwrap_used, clippy::expect_used)]
use super::*;

#[test]
fn test_parser() {
    let result = parse("input").unwrap();
    assert_eq!(result, expected);
}
```

### Project Organization

```
project/
├── src/
│   ├── lib.rs            # Crate root
│   ├── error.rs          # Error types
│   ├── config.rs         # Production code
│   ├── config_tests.rs   # Tests (if config.rs > 200 lines)
│   └── external/         # Wrappers around external crates
├── Cargo.toml
├── clippy.toml
├── rustfmt.toml
└── justfile
```

**File size targets:** Production < 300 LOC, Tests < 500 LOC.

---

## Banned Patterns

| Banned | Why | Alternative |
|--------|-----|-------------|
| `.unwrap()` | Panics | `.context("...")?` |
| `.expect("msg")` | Panics | `.context("msg")?` |
| `array[i]` | Panics | `.get(i).ok_or(Error::Index)?` |
| `unsafe { }` | Correctness | `#[human_authored]` module |
| `impl Trait` in params | Hides types | `<T: Trait>` explicit |
| `macro_rules!` | Complexity | Functions or generics |
| `RefCell<T>` | Runtime borrow | Restructure with `&mut` |
| Complex lifetimes | Agent confusion | Clone or restructure |
| `select!` | Cancellation bugs | Structured concurrency |
| Wildcard `_` match | Silent failures | Explicit variants |
| Iterator chains (Tier 1) | Harder to debug | `for` loops |

---

## Anti-Patterns

- `clone()` to silence borrow checker without understanding why
- Fighting the borrow checker — redesign data flow instead
- Deep trait hierarchies mimicking OOP
- Over-generic code hurting compile times
- `#[allow(...)]` without `// JUSTIFICATION:` comment
- Stringly-typed APIs — use enums and newtypes
- Interior mutability (`RefCell`, `Cell`) in agent code

---

## Blessed Crates

| Category | Crate | Notes |
|----------|-------|-------|
| Errors (lib) | `thiserror` | Derive-based |
| Errors (app) | `anyhow` | With `.context()` |
| Builder | `bon` | Derive-based |
| Serialization | `serde` | Standard |
| Async runtime | `tokio` | Blessed subset only |
| HTTP client | `reqwest` | High-level |
| Logging | `tracing` | Structured |
| CLI | `clap` | Derive mode |

---

## AI Agent Guidelines

**Before writing code:**
1. Read `Cargo.toml` for dependencies and lint configuration
2. Check `clippy.toml` for complexity thresholds
3. Identify existing patterns in the codebase to follow

**When writing code:**
1. Handle all errors with `.context("what you were doing")?`
2. Use `for` loops, not iterator chains (unless `#[hot_path]`)
3. Clone freely to satisfy borrow checker — optimize later
4. Match exhaustively — no wildcard `_` on your own enums

**Before committing:**
1. Run `just check` (standard for projects using just)
2. Fallback: `cargo clippy -- -D warnings && cargo test`
3. Ensure no `#[allow]` without justification comment

---

## Troubleshooting

### Config File Inheritance

Clippy and rustfmt walk up directory trees looking for config files. A rogue config in a parent directory (like `/tmp`) can break your project.

**Symptoms:**
- `unknown field` errors from clippy
- Wall of "unstable feature" warnings from rustfmt
- Unexpected lint behavior

**Fix:** Create project-local configs to prevent inheritance:

```toml
# clippy.toml - prevents inheriting parent configs
# (empty file is valid)
```

```toml
# rustfmt.toml - minimal stable config
edition = "2024"
```

### Edition 2024

`cargo init` now defaults to edition 2024. If referencing older templates, update them.

---

## References

- `references/clippy.toml` — Boring Rust clippy configuration
- `references/cargo_lints.toml` — Cargo.toml [lints] section
- `references/rustfmt.toml` — Formatting rules
- `references/patterns.md` — Additional Rust patterns
- `references/bevy.md` — Bevy ECS patterns (game development)

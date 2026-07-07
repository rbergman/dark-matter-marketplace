---
name: rust-pro
description: "Boring Rust" — clone freely, simple control flow, max-strictness lints with mechanical enforcement, ownership-honest code that compiles and reads cleanly. Use when implementing, debugging, refactoring, or reviewing Rust code; resolving borrow checker errors; tuning Cargo lints; choosing between Arc/Rc/Box; designing trait boundaries; or evaluating whether a clone is the right call. Applies to any Rust work unless a more specific role overrides.
---

# Rust Pro

Senior-level Rust expertise following "Boring Rust" principles. Correctness over cleverness. One way to do things. Local reasoning.

## When Invoked

1. Review `Cargo.toml`, `clippy.toml`, and `rustfmt.toml` for project conventions
2. For build system setup, invoke the **just-pro** skill
3. Apply Boring Rust patterns and established project conventions

## Core Standards

**Required:**
- All clippy warnings treated as errors (`-D warnings` in the gate)
- **NO `unwrap()` or `expect()` in production code** — use `.context("...")?` (tests are exempt via clippy.toml, not via allow attributes)
- **NO `unsafe` without explicit human approval** — isolated in a dedicated module, every block `// SAFETY:`-documented (mechanically enforced)
- **NO panic paths** — indexing, unreachable, todo, unimplemented all banned
- **NO silent suppressions** — every `#[expect]`/`#[allow]` carries `reason = "..."` (denied otherwise)
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

## Strictness Model

One strict default, with two real escape hatches. (Everything here uses stable Rust mechanisms — no custom attributes, no pretend enforcement.)

### Default: full strictness

All code, all the time. The shipped `clippy.toml` + `[lints]` config enforces:

```rust
// Complexity ceilings: cognitive 15, function lines 50, args 5, nesting 4

// Error handling: always with context
let config = load_config(path)
    .context("failed to load configuration")?;

// Matching: exhaustive, no wildcards
match state {
    State::Active => handle_active()?,
    State::Pending => handle_pending()?,
    State::Done => handle_done()?,
    // NO: _ => unreachable!()
}
```

Test code (`#[cfg(test)]`) is automatically exempt from the panic lints (`unwrap`, `expect`, `panic!`, indexing) via `allow-*-in-tests` keys in `clippy.toml` — write natural test assertions, no preamble needed.

### Escape hatch 1: `#[expect]` with reason

For justified local relaxations (hot paths, invariants the checker can't see). `#[expect]` beats `#[allow]` because it **self-cleans**: if the lint stops firing, the attribute becomes an error and gets removed.

```rust
#[expect(clippy::indexing_slicing, reason = "hot path: index bounded by loop above")]
fn sample(pixels: &[Rgba], idx: usize) -> Rgba {
    pixels[idx]
}
```

Rules: smallest possible scope (never module-wide in production code), `reason` mandatory (`allow_attributes_without_reason` is denied), and the reason states the invariant — not "clippy is wrong".

### Escape hatch 2: the unsafe module (human sign-off required)

`unsafe_code` is **deny** (not forbid) so exactly one sanctioned pattern can re-enable it:

```rust
// src/simd_ops.rs — human-approved unsafe island
#![allow(unsafe_code, reason = "SIMD intrinsics; reviewed by <name> <date>")]

/// Normalizes vectors in place using AVX2.
pub fn normalize(vectors: &mut [f32]) {
    // SAFETY: alignment verified by caller contract; length checked above
    unsafe { ... }
}
```

Agents do not create or modify these modules without explicit human direction. `undocumented_unsafe_blocks` (every block needs `// SAFETY:`) and `multiple_unsafe_ops_per_block` are denied, so sloppy unsafe can't slip in even with sign-off.

---

## Project Setup (Rust 1.85+, edition 2024)

### Version Management

Pin the Rust toolchain with [mise](https://mise.jdx.dev): `mise use rust@latest` (resolves and pins current stable in `.mise.toml` — commit it, complements rustup). Team members run `mise install`. See **mise** skill for setup.

Alternatively, use `rust-toolchain.toml` (rustup-native) if you prefer not to add mise as a dependency.

The lint config assumes 1.85+ (edition 2024 baseline); keep `msrv` in `clippy.toml` aligned with your actual floor.

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
just check   # Or: cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
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
- Rust-specific templates (`references/package-rust.just`)

**Why just?** Consistent toolchain frontend between agents and humans.

---

## Quality Assurance

**Auto-Fix First:**

```bash
just fix             # Or: cargo clippy --fix --allow-dirty --all-targets && cargo fmt --all
```

**Verification:**
```bash
just check           # fmt + clippy -D warnings + tests with coverage floor
```

Use `--all-targets` so tests, examples, and benches are linted too.

**Supply chain:** `just audit` runs `cargo audit` against the RustSec advisory DB (CI: `just audit-ci`). For license/source/duplicate policy on top of advisories, graduate to [`cargo-deny`](https://github.com/EmbarkStudios/cargo-deny).

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

### Iteration: loops for effects, chains for pure transforms

The shipped lint set (pedantic) pushes *toward* idiomatic iterator use — fighting it with manual loops everywhere loses. The boring rule:

```rust
// Pure transformation, short and linear → iterator chain
let total: f32 = probes.iter()
    .filter(|probe| probe.faction == target)
    .map(|probe| probe.damage)
    .sum();

// Body propagates errors (?) or mutates state → for loop
for record in records {
    let parsed = parse(record).context("bad record")?;
    store.insert(parsed)?;
}
```

Limits for chains: no nested closures, no side effects inside closures, no `try_fold`/`scan` cleverness when a `for` loop reads plainly. When in doubt, write the loop.

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
    // Explicit generic, not `impl Into<String>` (impl_trait_in_params is denied)
    pub fn new<S: Into<String>>(raw: S) -> Result<Self, ValidationError> {
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

// BANNED: select! (disallowed-macros), manual Poll
```

### Tests

Panic-style assertions are automatically allowed in `#[cfg(test)]` code (via `clippy.toml`) — no allow preamble:

```rust
// src/parser.rs
#[cfg(test)]
#[path = "parser_tests.rs"]  // separate file keeps production files small
mod tests;

// src/parser_tests.rs
use super::*;

#[test]
fn parses_valid_input() {
    let result = parse("input").unwrap();  // fine in tests
    assert_eq!(result, expected);
}
```

Inline `mod tests` is fine for small files; switch to the `#[path]` companion file when the production file approaches its size target. One behavior per test; name describes the behavior. Property-based tests (proptest) for parsers and invariants — see `references/patterns.md`.

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

Module layout is `foo.rs` + `foo/` — `mod.rs` files are denied (`mod_module_files`).

**File size targets:** Production < 300 LOC (code, excluding comments), Tests < 500 LOC.

### Responding to Limit Violations

**These limits exist to improve code architecture, not to be gamed.** When a file or function exceeds its clippy/size limit, the correct response is to decompose by responsibility.

**Extract, don't compress:**
1. Identify logical sections (validation, transformation, serialization, domain logic)
2. Extract each into a well-named function or submodule — the name documents what the section does
3. Place in a companion file (e.g., `order.rs` → `order/validate.rs`, `order/transform.rs`) or a sibling module

**When extraction is costly:** Many locals to pass — consider a context struct or builder pattern.

**Prohibited responses to limit violations:** combining statements onto single lines, removing or shortening comments, compressing whitespace, shortening descriptive names, inlining helpers, and `#[expect]`-ing the complexity lint. The goal is clean architecture, not metric compliance.

---

## Banned Patterns

Mechanically enforced by the shipped config unless noted:

| Banned | Why | Alternative |
|--------|-----|-------------|
| `.unwrap()` / `.expect()` | Panics | `.context("...")?` (tests exempt) |
| `array[i]` | Panics | `.get(i).ok_or(Error::Index)?` |
| `unsafe { }` | Correctness | Human-approved unsafe module with `// SAFETY:` docs |
| `#[allow]` without reason | Silent drift | `#[expect(lint, reason = "...")]` |
| `impl Trait` in params | Hides types | `<T: Trait>` explicit |
| `RefCell<T>` / `Cell<T>` | Runtime borrow panics | Restructure with `&mut` |
| `select!` | Cancellation bugs | Structured concurrency (`try_join_all`, `JoinSet`) |
| Wildcard `_` match | Silent failures | Explicit variants |
| `mod.rs` files | Two layouts = zero layouts | `foo.rs` + `foo/` |
| `dbg!`, `println!` debugging | Ships noise | `tracing` |
| `macro_rules!` | Complexity (convention, not lint) | Functions or generics |
| Complex lifetimes | Agent confusion (convention) | Clone or restructure |

---

## Anti-Patterns

- `clone()` to silence borrow checker without understanding why
- Fighting the borrow checker — redesign data flow instead
- Deep trait hierarchies mimicking OOP
- Over-generic code hurting compile times
- Stringly-typed APIs — use enums and newtypes
- Interior mutability (`RefCell`, `Cell`) in agent code
- Iterator chains with side-effecting closures — that's a `for` loop wearing a costume

---

## Blessed Crates

| Category | Crate | Notes |
|----------|-------|-------|
| Errors (lib) | `thiserror` | Derive-based |
| Errors (app) | `anyhow` | With `.context()` |
| Builder | `bon` | Derive-based |
| Serialization | `serde` | Standard |
| Async runtime | `tokio` | Blessed subset only (no `select!`) |
| HTTP client | `reqwest` | High-level |
| Logging | `tracing` | Structured |
| CLI | `clap` | Derive mode |
| Data parallelism | `rayon` | `par_iter` for CPU-bound work |
| Property tests | `proptest` | Parsers, invariants |

---

## AI Agent Guidelines

**Before writing code:**
1. Read `Cargo.toml` for dependencies and lint configuration
2. Check `clippy.toml` for complexity thresholds and disallowed items
3. Identify existing patterns in the codebase to follow

**When writing code:**
1. Handle all errors with `.context("what you were doing")?`
2. `for` loops for effectful iteration; short pure chains are fine
3. Clone freely to satisfy borrow checker — optimize later
4. Match exhaustively — no wildcard `_` on your own enums
5. Suppress a lint only with `#[expect(lint, reason = "...")]` at the smallest scope

**Before committing:**
1. Run `just check` (standard for projects using just)
2. Fallback: `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test`
3. Never weaken the lint config to make a gate pass — decompose or justify with `#[expect]`

---

## Troubleshooting

### Config File Inheritance

Clippy and rustfmt walk up directory trees looking for config files. A rogue config in a parent directory (like `/tmp`) can break your project.

**Symptoms:**
- `unknown field` errors from clippy (an unknown clippy.toml key is a **hard error** — clippy stops linting entirely)
- Wall of "unstable feature" warnings from rustfmt (nightly-only options on stable)
- Unexpected lint behavior

**Fix:** Project-local `clippy.toml` and `rustfmt.toml` (this skill's references) prevent inheritance. Keep them stable-clean: verify any new clippy.toml key against `cargo clippy` output and any rustfmt option against the stable list before committing.

### Edition 2024

`cargo init` defaults to edition 2024. If referencing older templates, update them. Note `style_edition` in rustfmt.toml is separate from the language edition in Cargo.toml.

---

## References

- `references/clippy.toml` — thresholds, test relaxations, disallowed items (validated on stable)
- `references/cargo_lints.toml` — Cargo.toml [lints] section (validated on stable)
- `references/rustfmt.toml` — stable-only formatting rules
- `references/patterns.md` — Additional Rust patterns
- `references/bevy.md` — Bevy ECS patterns (game development)

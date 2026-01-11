# Rust Package Justfile
# Package-specific build, test, and lint recipes
#
# Usage from package: just --list
# Usage from root: just rust <recipe>

# === Default ===

default:
    @just --list

# === Setup ===

# Install Rust toolchain and dependencies (run once after clone)
setup:
    -mise trust 2>/dev/null  # Allow .mise.toml config (ignore if mise absent)
    -mise install 2>/dev/null
    cargo build
    @echo "Rust toolchain ready"

# === Build ===

# Build in debug mode
build:
    cargo build

# Build for release
build-release:
    cargo build --release

# === Format & Lint ===

# Check formatting
fmt:
    cargo fmt --all --check

# Format code (fix)
fmt-fix:
    cargo fmt --all

# Lint with clippy (all targets)
lint:
    cargo clippy --all-targets -- -D warnings

# Auto-fix clippy issues
fix:
    cargo clippy --fix --allow-dirty
    cargo fmt --all

# === Test ===

# Run tests
test:
    cargo test

# Run tests with output
test-verbose:
    cargo test -- --nocapture

# === Security ===

# Check for vulnerabilities (requires cargo-audit: cargo install cargo-audit)
audit:
    cargo audit

# CI-friendly audit (fails on any vulnerability)
audit-ci:
    cargo audit --deny warnings

# === Quality Gates ===

# Run all checks (fmt, lint, test) - use before commits
check: fmt lint test
    @echo "All Rust checks passed"

# === Clean ===

# Remove build artifacts
clean:
    cargo clean

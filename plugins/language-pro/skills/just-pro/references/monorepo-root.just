# Monorepo Build System
# Router justfile - delegates to package-specific justfiles
#
# Usage: just --list
# Usage: just go <recipe>    # Go commands
# Usage: just web <recipe>   # Web frontend commands
# Usage: just ops <recipe>   # DevOps commands

# Uncomment to ensure mise-pinned tool versions are used:
# set shell := ["mise", "exec", "--", "bash", "-c"]

# === Module Imports ===
# Package justfiles are imported as namespaced modules

mod go "packages/api-go"
mod web "packages/web"
# mod ops "ops"             # Uncomment when ops/ exists

# Optional modules (no error if missing)
# mod? experimental "packages/experimental"

# === Default ===

default:
    @just --list

# === Setup ===

# Install all toolchain dependencies (run once after clone)
setup:
    -mise trust 2>/dev/null  # Allow .mise.toml config (ignore if mise absent)
    -mise install 2>/dev/null
    just go::setup
    just web::setup
    @echo "All toolchains ready"

# === Quality Gates ===

# Run all checks across packages
check: (go::check) (web::check)
    @echo "All checks passed"

# === Direct Delegation Examples ===
# For packages without their own justfile, delegate directly:

# Lint mcp package
ts-mcp-lint:
    cd packages/mcp && npm run lint

# Test mcp package
ts-mcp-test:
    cd packages/mcp && npm test

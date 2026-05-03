# TypeScript Package Justfile
# Direct tool invocation via PATH export for self-contained recipes
#
# Usage from package: just --list
# Usage from root: just web <recipe>

# Put node_modules/.bin on PATH so recipes call tools directly (no npx overhead)
export PATH := "./node_modules/.bin:" + env_var("PATH")

# === Default ===

default:
    @just --list

# === Setup ===

# Install Node.js dependencies (run once after clone)
setup:
    -mise trust 2>/dev/null  # Allow .mise.toml config (ignore if mise absent)
    -mise install 2>/dev/null
    npm ci
    @echo "Node.js dependencies installed"

# === Quality Gates ===

# Run all checks (typecheck, lint, test, vulnerability audit)
check: typecheck lint test
    npm audit --omit=dev --audit-level=high

# Fast gate — Stop hook, iterative dev (drop audit)
check-fast: typecheck lint test
    @echo "Fast checks passed"

# === Format & Lint ===

# Lint code
lint:
    eslint .

# Auto-fix lint issues
lint-fix:
    eslint . --fix

# Type check
typecheck:
    tsc --noEmit

# === Test ===

# Run tests
test:
    vitest run

# Run tests in watch mode
test-watch:
    vitest --watch

# === Build ===

# Build for production
build:
    tsc

# === Run ===

# Start development server
dev:
    npm run dev

# Start production server
start:
    npm start

# === Security ===

# Check for vulnerabilities (informational)
audit:
    npm audit

# Auto-fix vulnerabilities where possible
audit-fix:
    npm audit fix

# CI-friendly audit (high severity only, production deps)
audit-ci:
    npm audit --omit=dev --audit-level=high

# === Clean ===

# Remove build artifacts and dependencies
clean:
    rm -rf node_modules dist .next out

# Remove only build artifacts
clean-build:
    rm -rf dist .next out

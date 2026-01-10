# TypeScript Package Justfile
# Thin wrapper around npm scripts for consistent just interface
#
# Usage from package: just --list
# Usage from root: just web <recipe>

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

# Run all checks (typecheck, lint, test, build)
check:
    npm run check

# === Format & Lint ===

# Lint code
lint:
    npm run lint

# Auto-fix lint issues
lint-fix:
    npm run lint:fix

# Type check
typecheck:
    npm run typecheck

# === Test ===

# Run tests
test:
    npm test

# Run tests in watch mode
test-watch:
    npm run test:watch

# === Build ===

# Build for production
build:
    npm run build

# === Run ===

# Start development server
dev:
    npm run dev

# Start production server
start:
    npm start

# === Clean ===

# Remove build artifacts and dependencies
clean:
    rm -rf node_modules dist .next out

# Remove only build artifacts
clean-build:
    rm -rf dist .next out

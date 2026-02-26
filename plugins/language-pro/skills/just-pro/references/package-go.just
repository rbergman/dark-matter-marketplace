# Go Package Justfile
# Package-specific build, test, and lint recipes
#
# Usage from package: just --list
# Usage from root: just go <recipe>

# === Default ===

default:
    @just --list

# === Setup ===

# Install Go toolchain dependencies (run once after clone)
setup:
    -mise trust 2>/dev/null  # Allow .mise.toml config (ignore if mise absent)
    -mise install 2>/dev/null
    go mod download
    @echo "Go toolchain ready. Tools available via 'go tool <name>'"

# === Build ===

# Build the server binary (adjust paths for your project)
build:
    go build -o ../../build/bin/server ./cmd/server

# Build for production
build-prod:
    CGO_ENABLED=0 go build -ldflags="-s -w" -o ../../build/bin/server ./cmd/server

# === Format & Lint ===

# Format Go code
fmt:
    go fmt ./...

# Lint Go code (uses tool from go.mod)
lint:
    go tool golangci-lint run

# Auto-fix lint issues (chains goimports to fix imports after modernize changes)
fix:
    go tool golangci-lint run --fix
    go tool goimports -w .

# === Test ===

# Run unit tests with race detection
test:
    go test -race ./...

# Run tests including integration tests (requires Docker)
test-integration:
    go test -tags=integration -race ./...

# Run tests with coverage report
coverage:
    go test -race -coverprofile=coverage.out ./... && go tool cover -func=coverage.out

# Check coverage meets 70% minimum (adjust threshold as needed)
coverage-check:
    #!/usr/bin/env bash
    set -euo pipefail
    go test -race -coverprofile=coverage.out ./...
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
    if [ -z "$COVERAGE" ]; then
        echo "FAIL: Could not parse coverage output"; exit 1
    fi
    COVERAGE_INT=${COVERAGE%.*}
    if ! [[ "$COVERAGE_INT" =~ ^[0-9]+$ ]]; then
        echo "FAIL: Invalid coverage value: $COVERAGE"; exit 1
    fi
    if [ "$COVERAGE_INT" -lt 70 ]; then
        echo "FAIL: Coverage ${COVERAGE}% < 70%"; exit 1
    fi
    echo "PASS: Coverage ${COVERAGE}% meets minimum 70%"

# === Security ===

# Check for vulnerabilities (requires govulncheck in go.mod tools)
audit:
    go tool govulncheck ./...

# CI-friendly audit (same as audit for Go - govulncheck is already strict)
audit-ci:
    go tool govulncheck ./...

# === Quality Gates ===

# Run all checks (fmt, lint, test, coverage, vulnerabilities) - use before commits
check: fmt lint coverage-check audit
    @echo "All Go checks passed"

# === Run ===

# Run the server locally
run:
    go run ./cmd/server

# Run with hot reload (requires air)
dev:
    air

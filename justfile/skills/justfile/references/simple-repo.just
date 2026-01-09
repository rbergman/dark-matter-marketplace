# Project Build System
# Single-package repository template
#
# Usage: just --list

# === Default ===

default:
    @just --list

# === Setup ===

# Install toolchain dependencies
setup:
    go mod download
    @echo "Toolchain ready"

# === Quality Gates ===

# Full quality gates - run before commits
check: fmt lint test coverage-check
    @echo "All checks passed"

# === Format & Lint ===

# Format code
fmt:
    go fmt ./...

# Lint code
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

# Run tests including integration tests
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

# === Build ===

# Build the application
build:
    go build -o bin/app ./cmd/app

# Build for production (with optimizations)
build-prod:
    CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/app ./cmd/app

# === Run ===

# Run the application
run:
    go run ./cmd/app

# Run with hot reload (requires air: go install github.com/air-verse/air@latest)
dev:
    air

# === Clean ===

# Remove build artifacts
clean:
    rm -rf bin/ coverage.out

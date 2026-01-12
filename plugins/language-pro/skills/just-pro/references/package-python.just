# Python package justfile template
# Copy to your project and adjust as needed

# Default recipe - show available commands
default:
    @just --list

# Run the main application
run *args:
    uv run python -m src.main {{args}}

# Install dependencies and set up environment
setup:
    #!/usr/bin/env bash
    if [[ -f .setup-complete ]]; then
        echo "Already set up. Run 'just setup-force' to reinstall."
        exit 0
    fi
    mise trust && mise install 2>/dev/null || true
    uv sync
    touch .setup-complete
    echo "Setup complete"

setup-force:
    rm -f .setup-complete
    @just setup

# Format code
fmt:
    uv run ruff format .

# Fix linting issues
fix:
    uv run ruff check --fix .
    uv run ruff format .

# Run all checks (lint + typecheck + test)
check:
    uv run ruff check .
    uv run pyright
    uv run pytest

# Run linter only
lint:
    uv run ruff check .

# Run type checker only
typecheck:
    uv run pyright

# Run tests
test *args:
    uv run pytest {{args}}

# Run tests with coverage
test-cov:
    uv run pytest --cov=src --cov-report=term-missing --cov-report=html

# Watch tests (requires pytest-watch)
test-watch:
    uv run ptw -- --last-failed

# Add a dependency
add *packages:
    uv add {{packages}}

# Add a dev dependency
add-dev *packages:
    uv add --dev {{packages}}

# Update dependencies
update:
    uv sync --upgrade

# Clean build artifacts
clean:
    rm -rf .pytest_cache .ruff_cache .mypy_cache __pycache__ .coverage htmlcov dist build *.egg-info
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Validate toolchain versions
doctor:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Checking toolchain..."

    # Validate Python version
    PY_VERSION=$(python --version | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$(printf '%s\n' "3.12" "$PY_VERSION" | sort -V | head -1)" != "3.12" ]]; then
        echo "FAIL: Python $PY_VERSION < 3.12 required"
        exit 1
    fi
    echo "OK: Python $PY_VERSION"

    # Check uv
    if ! command -v uv &> /dev/null; then
        echo "FAIL: uv not found"
        exit 1
    fi
    echo "OK: uv $(uv --version | cut -d' ' -f2)"

    echo "All checks passed"

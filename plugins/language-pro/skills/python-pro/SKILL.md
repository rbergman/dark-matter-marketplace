---
name: python-pro
description: Expert Python developer specializing in modern tooling (uv, ruff, pyright), type safety, and clean module design. This skill should be used PROACTIVELY when working on any Python code - implementing features, designing APIs, debugging issues, or reviewing code quality. Use unless a more specific subagent role applies.
---

# Python Pro

Senior-level Python expertise for production projects. Focuses on modern tooling, strict type checking, and Pythonic idioms.

## When Invoked

1. Review `pyproject.toml` for project conventions and tooling config
2. For build system setup, invoke the **just-pro** skill
3. Apply Python idioms and established project patterns

## Core Standards

**Non-Negotiable:**
- All public functions/classes have docstrings
- All functions have type annotations (params + return)
- ruff passes with project configuration
- pyright passes in strict mode
- Meaningful tests with pytest

**Foundational Principles:**
- **Single Responsibility**: One module = one purpose, one function = one job
- **No God Classes**: Split large classes; if it has 10+ methods, decompose
- **Dependency Injection**: Pass dependencies, don't create them internally
- **Explicit over Implicit**: Clear is better than clever

---

## Project Setup (Python 3.12+)

### Version Management with mise

[mise](https://mise.jdx.dev) manages language runtimes per-project. Ensures all contributors use the same Python version.

```bash
# Install mise (once)
curl https://mise.run | sh

# In project root
mise use python@3.12

# Creates .mise.toml - commit it
# Team members just run: mise install
```

### New Project Quick Start with uv

[uv](https://docs.astral.sh/uv/) is the modern Python package manager (10-100x faster than pip).

```bash
# Initialize project
uv init project-name
cd project-name

# Or in existing directory
uv init

# Add dependencies
uv add httpx pydantic

# Add dev dependencies
uv add --dev pytest pytest-cov pytest-asyncio ruff pyright

# Set up src layout (required for imports to work)
mkdir -p src/projectname tests
mv *.py src/projectname/ 2>/dev/null || true
touch src/projectname/__init__.py tests/__init__.py tests/conftest.py

# Copy configs from this skill's references/ directory:
#   references/gitignore               -> .gitignore
#   references/pyproject-template.toml -> use as pyproject.toml base
#   references/pyrightconfig.json      -> pyrightconfig.json
# For build system, invoke just-pro skill

# Verify
just check   # Or: uv run ruff check . && uv run pyright
```

### pyproject.toml Requirements

**Critical:** uv init creates a minimal pyproject.toml. For src layout to work, you MUST add:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/projectname"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

Without `[build-system]` and `[tool.hatch.build.targets.wheel]`, tests cannot import your package.

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
just setup         # Runs mise trust/install + uv sync
just check         # Verify everything works
```

Or manually:
```bash
mise trust && mise install  # Get pinned Python version
uv sync                     # Install dependencies from lockfile
```

**Why uv?** Lockfile-based reproducibility, automatic venv management, 10-100x faster than pip.

---

## Build System

**Invoke the `just-pro` skill** for build system setup. It covers:
- Simple repos vs monorepos
- Hierarchical justfile modules
- Python-specific templates

**Why just?** Consistent toolchain frontend between agents and humans. Instead of remembering `uv run ruff check --fix .`, use `just fix`.

---

## Quality Assurance

**Auto-Fix First** - Always try auto-fix before manual fixes:

```bash
just fix             # Or: uv run ruff check --fix . && uv run ruff format .
```

**Verification:**
```bash
just check           # Or: uv run ruff check . && uv run pyright && uv run pytest
```

---

## Handling Strict Pyright

### Untyped Libraries

Some libraries lack type stubs. In pyright strict mode, use `Any`:

```python
from typing import Any

import structlog  # No complete type stubs

# Annotate as Any to silence pyright
logger: Any = structlog.get_logger()
```

**When to use `Any`:**
- Library has no stubs and you can't create them
- Return types are dynamic/unpredictable
- Interfacing with weakly-typed external systems

**Avoid `# type: ignore`** - it silences all errors. Explicit `Any` is clearer.

### TYPE_CHECKING Imports

Ruff's TCH rules flag imports used only for type hints. Move them to a `TYPE_CHECKING` block:

```python
from __future__ import annotations  # Required for forward refs

from typing import TYPE_CHECKING

from mypackage.service import run_service  # Runtime import

if TYPE_CHECKING:
    from mypackage.models import User  # Type-only import

def process(user: User) -> None:  # Works due to __future__ annotations
    run_service(user)
```

**Rules:**
- Imports used at runtime stay at top level
- Imports used only in type hints go in `TYPE_CHECKING`
- `from __future__ import annotations` enables string-based forward refs
- This also reduces import cycles

### Optional Field Access

When a field might be `None`, assert before accessing:

```python
# BAD - pyright error: "x" could be None
result.error_message.lower()

# GOOD - narrow the type first
assert result.error_message is not None
result.error_message.lower()

# OR use conditional
if result.error_message:
    result.error_message.lower()
```

---

## Quick Reference

### Type Annotations

```python
from typing import TypeVar, Protocol
from collections.abc import Callable, Iterator, Sequence

# Basic annotations
def process(items: list[str], timeout: float = 30.0) -> dict[str, int]:
    ...

# Generic functions
T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None

# Protocols for structural typing (duck typing with types)
class Readable(Protocol):
    def read(self, n: int = -1) -> bytes: ...

def load_data(source: Readable) -> bytes:
    return source.read()
```

### Error Handling

```python
# Custom exceptions with context
class ValidationError(Exception):
    def __init__(self, field: str, message: str) -> None:
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")

# Explicit error handling
def parse_config(path: str) -> Config:
    try:
        with open(path) as f:
            data = json.load(f)
    except FileNotFoundError:
        raise ConfigError(f"Config file not found: {path}") from None
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON in {path}: {e}") from e
    return Config.from_dict(data)

# Use Result pattern for expected failures (optional)
from dataclasses import dataclass

@dataclass
class Ok[T]:
    value: T

@dataclass
class Err[E]:
    error: E

type Result[T, E] = Ok[T] | Err[E]
```

### Data Classes and Pydantic

```python
from dataclasses import dataclass, field
from pydantic import BaseModel, Field

# Simple data containers
@dataclass(frozen=True, slots=True)
class Point:
    x: float
    y: float

# Pydantic for validation and serialization
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    age: int = Field(ge=0, le=150)

    model_config = {"strict": True}
```

### Async Patterns

```python
import asyncio
from collections.abc import AsyncIterator

# Async context managers
async def fetch_with_timeout(url: str, timeout: float = 10.0) -> bytes:
    async with asyncio.timeout(timeout):
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

# Async generators
async def paginate(client: Client, url: str) -> AsyncIterator[Item]:
    while url:
        response = await client.get(url)
        for item in response.items:
            yield item
        url = response.next_url

# Gather with error handling
async def fetch_all(urls: list[str]) -> list[bytes | Exception]:
    tasks = [fetch_with_timeout(url) for url in urls]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

### Context Managers

```python
from contextlib import contextmanager, asynccontextmanager
from collections.abc import Generator, AsyncGenerator

@contextmanager
def temporary_config(overrides: dict[str, str]) -> Generator[None, None, None]:
    original = config.copy()
    config.update(overrides)
    try:
        yield
    finally:
        config.clear()
        config.update(original)

@asynccontextmanager
async def database_transaction(db: Database) -> AsyncGenerator[Transaction, None]:
    tx = await db.begin()
    try:
        yield tx
        await tx.commit()
    except Exception:
        await tx.rollback()
        raise
```

### Testing with pytest

```python
import pytest
from unittest.mock import Mock, patch

# Parametrized tests
@pytest.mark.parametrize(
    "input_val,expected",
    [
        ("hello", "HELLO"),
        ("", ""),
        ("123", "123"),
    ],
    ids=["normal", "empty", "digits"],
)
def test_uppercase(input_val: str, expected: str) -> None:
    assert uppercase(input_val) == expected

# Fixtures
@pytest.fixture
def sample_user() -> User:
    return User(name="Test", email="test@example.com")

@pytest.fixture
def mock_client() -> Mock:
    client = Mock(spec=APIClient)
    client.get.return_value = {"status": "ok"}
    return client

# Async tests
@pytest.mark.asyncio
async def test_fetch_data(mock_client: Mock) -> None:
    result = await fetch_data(mock_client, "test-id")
    assert result.status == "ok"

# Exception testing
def test_invalid_input_raises() -> None:
    with pytest.raises(ValueError, match="must be positive"):
        process_value(-1)
```

### Structured Logging

```python
import logging
from typing import Any

import structlog

# Note: structlog lacks complete type stubs. Use Any for logger type.
logger: Any = structlog.get_logger()

# Configure structlog for console output
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),  # Or JSONRenderer() for prod
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

# Structured logging with context
logger.info("request_processed", method="GET", path="/api/users", duration_ms=42)
logger.error("operation_failed", error=str(e), user_id=user_id)

# Bind context for a scope
bound_logger: Any = logger.bind(request_id=request_id, user_id=user_id)
bound_logger.info("starting_operation")
```

### Package Organization

```
project/
├── src/
│   └── projectname/
│       ├── __init__.py
│       ├── api/              # HTTP handlers
│       ├── domain/           # Business logic
│       └── infra/            # External integrations
├── tests/
│   ├── conftest.py           # Shared fixtures
│   ├── test_api/
│   └── test_domain/
├── pyproject.toml
├── pyrightconfig.json
├── uv.lock
└── justfile
```

**Rules:** Use `src/` layout for installable packages. One module = one purpose. Avoid `utils`, `common`, `helpers` modules.

---

## DX Patterns

### Doctor Recipe with Version Validation

```just
# Validate toolchain versions meet requirements
doctor:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Checking toolchain..."

    # Validate Python version (requires 3.12+)
    PY_VERSION=$(python --version | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$(printf '%s\n' "3.12" "$PY_VERSION" | sort -V | head -1)" != "3.12" ]]; then
        echo "FAIL: Python $PY_VERSION < 3.12 required"
        exit 1
    fi
    echo "OK: Python $PY_VERSION"

    # Check uv is available
    if ! command -v uv &> /dev/null; then
        echo "FAIL: uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    echo "OK: uv $(uv --version | head -1)"

    echo "All checks passed"
```

### First-Run Detection

```just
# Setup with first-run detection
setup:
    #!/usr/bin/env bash
    if [[ -f .setup-complete ]]; then
        echo "Already set up. Run 'just setup-force' to reinstall."
        exit 0
    fi
    mise trust && mise install
    uv sync
    touch .setup-complete
    echo "Setup complete"

setup-force:
    rm -f .setup-complete
    @just setup
```

---

## Anti-Patterns

- Bare `except:` clauses (always specify exception type)
- Mutable default arguments (`def f(items=[])` - use `None` and create inside)
- Star imports (`from module import *`)
- God classes with 10+ methods
- Missing type annotations on public APIs
- `Any` when specific types work
- Nested functions when a module-level function suffices
- `print()` for logging (use logging/structlog)
- Ignoring return values of functions with side effects

---

## AI Agent Guidelines

**Before writing code:**
1. Read `pyproject.toml` for project structure and dependencies
2. Check ruff/pyright config for project-specific rules
3. Identify existing patterns in the codebase to follow

**When writing code:**
1. Add type annotations immediately - never leave functions untyped
2. Add docstrings to public functions/classes
3. Use existing project abstractions over creating new ones
4. Prefer explicit types; use generics only when pattern repeats 3+ times

**Before committing:**
1. Run `just check` (standard for projects using just)
2. Fallback: `uv run ruff check --fix . && uv run ruff format .`
3. Fallback: `uv run pyright && uv run pytest`

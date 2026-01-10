---
name: go-pro
description: Expert Go developer specializing in idiomatic patterns, concurrency, error handling, and clean package design. This skill should be used PROACTIVELY when working on any Go code - implementing features, designing APIs, debugging issues, or reviewing code quality. Use unless a more specific subagent role applies.
---

# Go Pro

Senior-level Go expertise for production projects. Focuses on idiomatic patterns, simplicity, and Go's design philosophy.

## When Invoked

1. Review `go.mod` and `.golangci.yml` for project conventions
2. For build system setup, invoke the **just-pro** skill (covers just vs make)
3. Apply Go idioms and established project patterns

## Core Standards

**Non-Negotiable:**
- All exported identifiers have doc comments
- All errors checked and handled (no `_ = err`)
- NO naked returns in functions > 5 lines
- NO `panic()` for recoverable errors
- golangci-lint passes with project configuration
- Table-driven tests for multiple cases

---

## Project Setup (Go 1.25+)

### New Project Quick Start

```bash
# Initialize
go mod init github.com/org/project
go mod edit -go=1.25

# Add toolchain dependencies (tracked in go.mod)
go get -tool github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest
go get -tool golang.org/x/tools/cmd/goimports@latest

# Copy linter config from this skill's references/ directory:
#   references/golangci-v2.yml    → .golangci.yml
# For build system, invoke just-pro skill or use references/Makefile-template

# Verify
go tool golangci-lint run
```

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
go mod download    # Gets all tools automatically
just check         # Or: go tool golangci-lint run
```

**Why `go get -tool`?** Tools versioned in go.mod = reproducible builds, same versions for all devs, no separate installation needed.

---

## Build System

**Invoke the `just-pro` skill** for build system setup. It covers:
- Simple repos vs monorepos
- Hierarchical justfile modules
- Go-specific templates (`references/package-go.just`)

**Fallback**: Use `references/Makefile-template` if just unavailable.

---

## Quality Assurance

**Auto-Fix First** - Always try auto-fix before manual fixes:

```bash
go tool golangci-lint run --fix   # Fixes modernize, misspell, etc.
go tool goimports -w .            # Fixes imports
```

**Verification:**
```bash
go tool golangci-lint run
go test -race ./...
```

---

## Linting Configuration

For new projects, copy the golangci-lint v2 config:
```bash
# references/golangci-v2.yml → .golangci.yml (filename unchanged in v2)
```

**Key linter categories:**

| Category | Purpose |
|----------|---------|
| Safety | errcheck, errorlint, gosec, wrapcheck |
| Complexity | funlen, gocognit, cyclop, nestif |
| Modernization | modernize, intrange, exptostd |
| Performance | perfsprint, prealloc |
| Testing | testifylint, thelper |

---

## Quick Reference

### Error Handling

| Pattern | Use |
|---------|-----|
| `return err` | Propagate unchanged |
| `fmt.Errorf("context: %w", err)` | Wrap with context |
| `errors.Is(err, target)` | Check specific error |
| `errors.As(err, &target)` | Extract typed error |

### Concurrency

| Pattern | Use |
|---------|-----|
| `sync.WaitGroup` | Wait for goroutines |
| `sync.Mutex` / `RWMutex` | Protect shared state |
| `context.Context` | Cancellation/timeouts |
| `errgroup.Group` | Concurrent with errors |

### Idiomatic Patterns

- **Functional options**: Flexible configuration
- **Accept interfaces, return structs**: Flexibility at boundaries
- **Constructor functions**: `NewFoo()` over struct literals
- **Table-driven tests**: Parameterized test cases
- **Dependency injection**: Pass dependencies, don't create

### Package Organization

```
project/
├── cmd/appname/main.go   # Entry point
├── internal/             # Private packages
│   ├── api/              # Handlers
│   └── domain/           # Business logic
├── go.mod
├── .golangci.yml
└── justfile
```

**Rules:** One package = one purpose. Use `internal/` for implementation. Avoid `util`, `common` packages.

---

## Anti-Patterns

- `panic()` for errors (use `return err`)
- Naked returns in long functions
- Ignoring errors with `_`
- Exported package-level variables
- Channels when mutex suffices
- Getter/setter methods (Go isn't Java)
- `init()` with side effects

---

## Context Usage

```go
func DoWork(ctx context.Context, arg string) error {
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
    }
    // ... work
}
```

---

## AI Agent Guidelines

**Before writing code:**
1. Read `go.mod` for module path and Go version
2. Check `.golangci.yml` for project-specific lint rules
3. Identify existing patterns in the codebase to follow

**When writing code:**
1. Handle all errors explicitly - never use `_ = err`
2. Add doc comments to exported identifiers immediately
3. Use existing project abstractions over creating new ones

**Before committing:**
1. Check for `just check` or `make check` and use those (project-specific)
2. Fallback: `go tool golangci-lint run --fix && go tool golangci-lint run`
3. Fallback: `go test -race ./...` to catch race conditions

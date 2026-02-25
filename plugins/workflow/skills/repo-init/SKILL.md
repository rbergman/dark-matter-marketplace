---
name: repo-init
description: Initialize a new repository with standard scaffolding - git, gitignore, AGENTS.md, justfile, mise, and beads. Use when starting a new project or setting up an existing repo for Claude Code workflows.
---

# Repository Initialization

Scaffold a new or existing repository with standard project infrastructure.

**Related skills:**
- **just-pro** - Build system patterns and templates
- **mise** - Tool version management
- **tokf** - CLI output compression for LLM context efficiency
- **go-pro**, **rust-pro**, **typescript-pro**, **python-pro** - Language-specific setup

## Execution Modes

This skill supports two modes. **Prefer molecule mode** when beads is available.

### Molecule Mode (Preferred)

Use beads molecules for tracked, closeable tasks. Each step becomes an issue you can close as you complete it.

**Prerequisites:** beads installed (`bd --version` works)

**Steps:**

1. Find the dm-work plugin install path:
   ```bash
   jq -r '.plugins["dm-work@dark-matter-marketplace"][0].installPath' ~/.claude/plugins/installed_plugins.json
   ```

2. Wisp the formula (ephemeral, no git pollution):
   ```bash
   bd mol wisp <install-path>/skills/repo-init/references/repo-init.formula.json \
     --var lang=<language> --var name=<project-name> --var type=<project-type>
   ```

3. Work through tasks:
   ```bash
   bd ready              # See next task
   # ... do the work ...
   bd close <step-id>    # Mark complete
   ```

4. Clean up when done:
   ```bash
   bd mol burn <wisp-id>
   ```

**Variables:**
| Variable | Required | Default | Values |
|----------|----------|---------|--------|
| `lang` | Yes | - | go, rust, typescript, python |
| `name` | Yes | - | Project name |
| `type` | No | cli | cli, lib, web, api |

---

### Manual Mode (Fallback)

Use when beads is not installed or for quick setups without tracking.

Follow the steps below in order. Steps 3-6 can run in parallel after git-init.

---

## Step 1: Gather Context

Before scaffolding, clarify:

1. **Project language(s)**: Go, Rust, TypeScript, Python, or multi-language?
2. **Project type**: Library, CLI, web app, API, monorepo?
3. **Existing files**: Is this a fresh repo or adding to existing code?

Use AskUserQuestion if unclear from context.

---

## Step 2: Git Setup

```bash
# Initialize git if needed
git init
```

### .gitignore Templates

Copy from the appropriate language skill's `references/gitignore`:

| Language | Source |
|----------|--------|
| Go | `go-pro/references/gitignore` |
| Rust | `rust-pro/references/gitignore` |
| TypeScript | `typescript-pro/references/gitignore` |
| Python | `python-pro/references/gitignore` |

**For multi-language repos:** Start with the primary language's gitignore, then merge patterns from others.

**Minimal fallback** (if language skill unavailable):

```gitignore
# Environment
.env
.env.local
.env.*.local
.envrc

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/

# Build (customize per language)
dist/
build/
target/
node_modules/
__pycache__/
```

---

## Step 3: AGENTS.md

Copy the AGENTS.md template from this skill's `references/AGENTS.md` to the project root, then create a symlink so Claude Code discovers it automatically:

```bash
cp <skill-install-path>/references/AGENTS.md ./AGENTS.md
ln -s AGENTS.md CLAUDE.md
```

AGENTS.md is the canonical file; CLAUDE.md is a symlink so Claude Code discovers it automatically.

Customize the template for the specific project (update project description, add project-specific conventions).

---

## Step 4: Justfile Skeleton

```just
# Project Build System
# Usage: just --list

default:
    @just --list

# First-time setup
setup:
    mise trust
    mise install
    @echo "Ready. Run 'just check' to verify."

# Quality gates - add language-specific checks
check:
    @echo "Add fmt, lint, test recipes"

# Remove build artifacts
clean:
    @echo "Add clean commands"
```

See **just-pro** skill for language-specific recipes.

---

## Step 5: Mise Configuration

Create `.mise.toml`:

```toml
[tools]
# Add tools with: mise use <tool>@<version>
# Examples:
# node = "22"
# go = "1.23"
# rust = "1.83"
# just = "latest"
```

---

## Step 5.5: tokf Setup (Optional)

If the user wants CLI output compression for LLM context efficiency:

```bash
# Install tokf
brew install mpecan/tokf/tokf   # or: cargo install tokf, mise use -g tokf

# Set up Claude Code hook (auto-filters Bash output)
tokf hook install

# Enable agent filter authoring
tokf skill install

# Verify
tokf ls                          # List available filters
```

Optionally create `.tokf/filters/` for project-specific filter overrides and commit it. See **tokf** skill for full configuration details.

---

## Step 6: Environment Template

Create `.envrc.example` (committed) as template for `.envrc` (gitignored):

```bash
# Copy to .envrc and fill in values
# cp .envrc.example .envrc && direnv allow

# Mise integration
if command -v mise &> /dev/null; then
  eval "$(mise hook-env -s bash)"
fi

# Project-specific environment
# export DATABASE_URL="postgres://localhost/myapp"
# export API_KEY=""
```

---

## Step 7: Beads Initialization

```bash
bd init -q
bd onboard
```

---

## Step 8: Next Steps

Point user to language-specific setup:

| Language | Next Step |
|----------|-----------|
| Go | Invoke **go-pro** skill, run `go mod init` |
| Rust | Invoke **rust-pro** skill, run `cargo init` |
| TypeScript | Invoke **typescript-pro** skill, run `npm init` |
| Python | Invoke **python-pro** skill, run `uv init` |

---

## Quick Reference

```bash
# Full manual init sequence
git init
# Create .gitignore, AGENTS.md, CLAUDE.md symlink, justfile, .mise.toml, .envrc.example
bd init -q
bd onboard
mise use just@latest
# Then follow language skill for specifics
```

## Monorepo Variant

For monorepos, the root gets:
- Root `justfile` with module imports (see just-pro monorepo patterns)
- Root `.mise.toml` with shared tooling
- Single `.beads/` at root

Each package gets:
- Package-local `justfile`
- Language-specific configs (Cargo.toml, package.json, etc.)

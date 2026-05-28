---
name: repo-init
description: Initialize a new repository with standard scaffolding - git, gitignore, AGENTS.md, justfile, mise, beads, and timbers. Use when starting a new project or setting up an existing repo for Claude Code workflows.
---

# Repository Initialization

Scaffold a new or existing repository with standard project infrastructure.

**Related skills:**
- **just-pro** - Build system patterns and templates
- **mise** - Tool version management
- **output-compression** - CLI output compression (RTK + tokf)
- Timbers (`timbers init`) - Development reasoning ledger
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

### .claudeignore

Every repo should have a `.claudeignore` file. Claude Code indexes everything it can see — without ignore patterns, it reads build artifacts, generated files, and large binaries, wasting massive token budget. This is the single highest-impact CC optimization.

**Universal base (all projects):**

```
# Secrets — never leak into CC context
.env
.env.*
.envrc
secrets/
*.pem
*.key
*.p12

# Lock files (large, no signal)
pnpm-lock.yaml
package-lock.json
yarn.lock
bun.lockb
Cargo.lock
go.sum
Gemfile.lock
poetry.lock

# Source maps
*.map

# Binary assets (images, fonts)
*.png
*.jpg
*.jpeg
*.gif
*.ico
*.svg
*.woff
*.woff2
*.ttf
*.eot

# Logs and OS
*.log
logs/
.DS_Store

# Agent working dirs
.worktrees/
history/
```

**Add language-specific patterns:**

| Language | Patterns |
|----------|----------|
| TypeScript/Node | `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`, `*.tsbuildinfo`, `.turbo/`, `.cache/` |
| Python | `__pycache__/`, `.venv/`, `venv/`, `*.pyc`, `.mypy_cache/`, `.pytest_cache/`, `dist/`, `build/`, `*.egg-info/` |
| Go | `vendor/`, `bin/` |
| Rust | `target/` |
| AI/ML | `output/`, `models/`, `*.safetensors`, `*.ckpt`, `*.pt`, `*.bin`, `checkpoints/` |

**For multi-language repos:** Combine all relevant language patterns.

---

## Step 3: AGENTS.md

Copy the AGENTS.md template from this skill's `references/AGENTS.md` to the project root, then create a symlink so Claude Code discovers it automatically:

```bash
cp "${CLAUDE_PLUGIN_ROOT}/skills/repo-init/references/AGENTS.md" ./AGENTS.md
ln -s AGENTS.md CLAUDE.md
```

AGENTS.md is the canonical file; CLAUDE.md is a symlink so Claude Code discovers it automatically. Verify after creation: `readlink CLAUDE.md` should print `AGENTS.md`, and `test -e CLAUDE.md` should succeed (catches dangling symlinks).

Customize the template for the specific project (update project description, add project-specific conventions).

**Symlink fallback (Windows or FS without symlink support):** if `ln -s` fails or symlinks aren't usable, use the stub pattern instead — keep AGENTS.md canonical and make CLAUDE.md a one-line stub:

```bash
echo "See @AGENTS.md" > CLAUDE.md
```

Claude Code's `@path` import resolves the reference at session start. Higher maintenance than a symlink (two real files) but works everywhere.

### CLAUDE.local.md (personal project prefs)

Create `CLAUDE.local.md` for personal preferences that shouldn't be committed (it's auto-added to `.gitignore`):

```bash
cat > CLAUDE.local.md << 'EOF'
# Personal Project Preferences
# This file is gitignored — safe for local paths, sandbox URLs, etc.

# For worktrees: import shared personal prefs so all worktrees stay in sync
# @~/.claude/my-project-instructions.md
EOF
```

Use this for sandbox URLs, test data paths, local tool overrides, and other per-developer settings.

### Modular rules (monorepos)

For monorepos or projects with distinct subsystems, use `.claude/rules/` instead of a single large CLAUDE.md:

```
.claude/
├── CLAUDE.md              # Core project instructions
└── rules/
    ├── go-backend.md      # Go-specific rules
    ├── ts-frontend.md     # TypeScript-specific rules
    └── api-design.md      # API conventions
```

All `.md` files in `.claude/rules/` are auto-loaded. Rules can be **path-scoped** via YAML frontmatter to only activate when Claude touches matching files:

```markdown
---
paths:
  - "packages/api/**/*.go"
---

# API Backend Rules
- All handlers return structured errors
- Use slog for logging, never fmt.Print
```

Skip this for single-language repos — a single CLAUDE.md is simpler.

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

## Step 5.5: Output Compression (Optional)

CLI output compression reduces build/test/git noise before it reaches LLM context. See **output-compression** skill for full details.

```bash
# Option 1: RTK (zero-config baseline — recommended)
command -v rtk &>/dev/null && rtk init --global || echo "Install: brew install rtk"

# Option 2: tokf (per-project customization — add when RTK isn't enough)
command -v tokf &>/dev/null && tokf hook install || echo "Install: brew install mpecan/tokf/tokf"
```

Either or both tools can be active. RTK handles most CLI noise automatically. Add tokf with project-local `.tokf/filters/` when you need surgical filtering for specific commands.

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

## Step 7: Claude Code Project Settings

Create `.claude/settings.local.json` to wire DM orchestration, hooks, and session management for this project:

```bash
mkdir -p .claude
```

Write to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "if command -v timbers &>/dev/null && [ -d .timbers ]; then timbers prime; fi",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "if command -v timbers &>/dev/null && [ -d .timbers ]; then timbers hook run claude-stop; fi",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

This wires session-start context recovery and session-end enforcement. DM plugin skills (browser-qa, evaluator, repo-init, language skills, architecture skills) are available globally from the plugin install — this file adds project-specific hooks.

**Customize per-project:** Add project-specific SessionStart commands (e.g., `bd prime` if beads is initialized), adjust Stop hook timeout for heavy gate suites.

---

## Step 8: Beads Initialization

Beads supports two sync modes. Pick one before running `bd init` for a new project. Per upstream's [`docs/SYNC_CONCEPTS.md`](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md), canonical (`refs/dolt/data`) is the recommended mode for new repos; legacy (JSONL-in-git) is supported for compatibility with existing repos that use it.

### Sync mode at a glance

| | **Canonical** (recommended for new repos) | **Legacy** (JSONL-in-git, for existing repos) |
|---|---|---|
| Source of truth | Dolt state in `refs/dolt/data` git ref namespace on origin | `.beads/issues.jsonl` (committed) |
| `.beads/issues.jsonl` role | Passive local export (viewer, interchange, backup) — gitignored | Cross-clone transport — committed |
| Sync commands | `bd dolt push` (after bead work) / `bd dolt pull` (after `git pull`) | Pre-commit auto-export + post-merge auto-import hooks |
| Config | `sync.remote` set in `.beads/config.yaml`; `export.auto = false` | `export.auto = true`, `export.git-add = true` |
| Fresh-clone onboarding | `bd bootstrap` (auto-detects `refs/dolt/data` on origin) | `bd bootstrap` (auto-detects committed JSONL) |
| PR noise | None — bead state never appears in branch diffs | Every bead mutation produces JSONL diff |

`bd bootstrap` is the universal entry point for both modes — it auto-detects which the repo is in. Prefer it over `bd init` / `bd import` for cloning.

### Canonical mode (recommended)

```bash
# 1. Initialize beads — auto-detects git origin and sets sync.remote
bd init

# 2. Seed refs/dolt/data on the git remote (publishes Dolt history)
bd dolt push

# 3. Disable JSONL auto-export — JSONL is no longer your sync channel
bd config set export.auto false
bd config set export.git-add false

# 4. Gitignore the JSONL exports (local view, not transport)
cat >> .beads/.gitignore <<'EOF'
issues.jsonl
sync_base.jsonl
EOF

# 5. Set your role and confirm
bd config set beads.role maintainer  # or "contributor" for outside contributors
bd dolt remote list                   # should show origin
```

**Daily flow:**
- After making bead changes: `bd dolt push`
- After `git pull` (peer may have pushed bead work): `bd dolt pull`
- New clones: `bd bootstrap` — clones Dolt history from `refs/dolt/data` automatically

`bd dolt push` is **load-bearing** under canonical mode — it's the sync. It is not optional and not a no-op. Treat any `~/.claude/CLAUDE.md` or per-repo directive that forbids `bd dolt push` as a hard conflict requiring user attention.

**Verifying sync cleanliness.** `bd dolt push` doubles as the divergence verifier: it's a no-op (`Push complete.` with no chunks transferred) when local Dolt already matches `refs/dolt/data` on origin, ships unpushed state otherwise, and surfaces auth / divergence / offline errors via stderr. **Do not reach for `bd dolt status` for this check** — in beads 1.0.4 it reports only engine info + data dir, nothing about remote-divergence state. Run `bd dolt push` at session-close, pre-merge, or anywhere you need "is canonical sync clean?" — no chunks transferred = clean.

**If you wire `bd dolt push` / `bd dolt pull` into git hooks (pre-push / post-merge): surface failures, don't swallow them.** The naive `bd dolt push 2>/dev/null || true` pattern silently regresses what JSONL transport made visible (sync failures used to show up as merge conflicts on `.beads/issues.jsonl`; under canonical they vanish into the void if hidden). Use a tempfile + warning pattern that doesn't block the git op:

```sh
# pre-push (mirror for post-merge with bd dolt pull):
if command -v bd >/dev/null 2>&1; then
  _bd_err=$(mktemp -t bd-dolt-push.err.XXXXXX 2>/dev/null || echo /tmp/bd-dolt-push.err)
  if ! bd dolt push 2>"$_bd_err"; then
    echo >&2 "beads: 'bd dolt push' failed (continuing with git push); see $_bd_err"
    echo >&2 "       or run 'bd dolt push' manually after resolving (often: 'bd dolt pull' first)."
  else
    rm -f "$_bd_err"
  fi
fi
```

The dev gets feedback, the git op still completes, and the failure log survives for diagnosis.

### Legacy mode (JSONL-in-git, for existing repos)

```bash
bd init  # embedded Dolt is the default and works on macOS in 1.0+
```

`bd init` does several things automatically in beads 1.0+:
- Creates `.beads/embeddeddolt/` (data, gitignored) and `.beads/hooks/` (committed shims)
- Sets `core.hooksPath = .beads/hooks` (relative)
- Installs `bd setup claude` integration (CLAUDE.md beads section + `.claude/settings.json`)
- Enables `export.auto = true` and `export.git-add = true` — every `bd` mutation auto-exports `.beads/issues.jsonl` and stages it (60s throttle; pre-commit hook forces a flush)

### Hooks and timbers (both modes)

After `bd init`, install timbers hooks if used (they detect `core.hooksPath` and append into `.beads/hooks/pre-commit` alongside the beads hook):

```bash
timbers hooks install
```

Quality gates and any other custom hook content go OUTSIDE the `--- BEGIN/END BEADS INTEGRATION ---` and `--- BEGIN/END TIMBERS ---` markers — `bd hooks install --force` and `timbers hooks install` both preserve user content outside their managed sections.

**Hook structure** (`.beads/hooks/pre-commit`):
```
# --- BEGIN BEADS INTEGRATION v1.0.x ---  (managed by bd hooks install)
# --- END BEADS INTEGRATION v1.0.x ---

# Quality gates (lint-staged, just check, etc.) — preserved across reinstalls

# --- timbers section (managed by timbers hooks install)
# --- end timbers section ---
```

Add a `just hooks` recipe for onboarding that re-runs `bd hooks install --force --beads` (idempotent — preserves user content). Verify with `bd hooks list` (shows shim version per hook) and `git config core.hooksPath` (should be `.beads/hooks`).

**Note on `core.hooksPath`:** `bd hooks install --force` may set this to an absolute path on first install. Fix to relative manually if needed: `git config core.hooksPath .beads/hooks` — relative is required for worktrees, which share repo config.

### Migration: legacy → canonical

If an existing legacy-mode repo wants to move to canonical:

1. `bd dolt push` — seeds `refs/dolt/data` on origin from current local Dolt state
2. `git rm --cached .beads/issues.jsonl` and add the file to `.beads/.gitignore`
3. `bd config set export.auto false && bd config set export.git-add false`
4. Commit the gitignore + JSONL removal
5. Peer clones run `bd dolt pull` once to refresh local Dolt; they're now on canonical

Do this as a deliberate one-time migration, not a side-effect of other work.

---

## Step 8.5: Timbers Initialization (Optional)

If the user wants structured development reasoning logs (what/why/how per commit):

```bash
# Check if installed
command -v timbers || echo "Install: brew install gorewood/tap/timbers"

# Initialize (creates .timbers/, .gitattributes, git hooks, Claude Code integration)
timbers init --yes --git-hooks

# Add onboarding snippet to AGENTS.md
timbers onboard --target agents >> AGENTS.md
```

This sets up:
- `.timbers/` directory for entry storage
- Pre-commit hook (blocks commits when prior commits are undocumented)
- Post-commit hook (reminds to document)
- Claude Code Stop hook (blocks session end if pending entries)

Timbers captures the *reasoning* behind commits — the "why" that git log can't tell you. Entries are files in `.timbers/` that sync via regular `git push`.

**Optional:** Create `.timbersignore` at repo root to extend the default skip rules (lockfiles, reverts are already skipped by default in v0.19+). Use gitignore-style patterns for files that should never require a timbers entry:

```
# Generated files that don't need reasoning documented
*.generated.ts
db/migrations/*.sql
```

Skip timbers entirely if the project is trivial or short-lived.

---

## Step 8.7: Multi-Account GitHub Auth (Optional)

If the user works across multiple GitHub identities (personal + work, multiple orgs), per-repo SSH-key routing is necessary for canonical-mode beads sync to work — `bd dolt push` uses the standard `git@github.com:` URL and needs the right key.

The legacy pattern was `Host github.<alias>` blocks in `~/.ssh/config` with rewritten remote URLs, but that locks the SSH alias into team-shared config and breaks for anyone else.

**Modern git-native pattern: `includeIf` in `~/.gitconfig`.**

```ini
# ~/.gitconfig
[includeIf "gitdir:~/Projects/<org>/"]
    path = ~/.gitconfig-<org>
```

```ini
# ~/.gitconfig-<org>
[user]
    email = you@<org>-domain
[core]
    sshCommand = "ssh -i ~/.ssh/<org>_key -o IdentitiesOnly=yes -F /dev/null"
```

Any git operation under `~/Projects/<org>/` uses the per-account key. All URLs stay standard `git@github.com:org/repo.git` (no `Host github.<alias>` rewrites), so `bd dolt push`, `gh`, and other tooling work transparently.

The `-o IdentitiesOnly=yes -F /dev/null` flags matter — without them, ssh may try other keys first and trip GitHub's bad-key rate limiter.

Skip if the user only has one GitHub identity.

---

## Step 9: Next Steps

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
# Full manual init sequence — pick canonical or legacy at the bd step (see Step 8)
git init
# Create .gitignore, .claudeignore, AGENTS.md, CLAUDE.md symlink, justfile, .mise.toml, .envrc.example

# Canonical sync mode (recommended for new repos):
bd init
bd dolt push                             # seed refs/dolt/data on origin
bd config set export.auto false
bd config set export.git-add false
echo -e "issues.jsonl\nsync_base.jsonl" >> .beads/.gitignore

# OR legacy sync mode (JSONL-in-git, for compatibility):
# bd init  # embedded Dolt default with export.auto=true

timbers init --yes --git-hooks           # appends into .beads/hooks/ alongside beads
timbers onboard --target agents >> AGENTS.md
mise use just@latest
# Then follow language skill for specifics
```

## Monorepo Variant

For monorepos, the root gets:
- Root `justfile` with module imports (see just-pro monorepo patterns)
- Root `.mise.toml` with shared tooling
- Root `.claudeignore` combining patterns for all languages in the monorepo
- Single `.beads/` at root

Each package gets:
- Package-local `justfile`
- Language-specific configs (Cargo.toml, package.json, etc.)

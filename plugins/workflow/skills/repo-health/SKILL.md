---
name: repo-health
description: Analyze a repository's configuration against CC and workflow best practices. Use when auditing a repo, after repo-init, or when troubleshooting token usage or workflow gaps. Reports issues by severity with auto-fix offers.
---

# Repo Health Analyzer

Scan the current repository against CC optimization and workflow best practices. Reports gaps with severity ratings and offers to fix what it can.

**Canonical reference:** The checks below derive from `cc-optimization-playbook.md`. When in doubt, the playbook is the source of truth.

**Related skills:**
- **repo-init** — Initial scaffolding (this skill audits after the fact)
- **compress** — Fix oversized CLAUDE.md/AGENTS.md

---

## How to Run

Run all checks in order. Collect findings into a report table, then present to user.

**Default:** Report only. Offer fixes inline — apply only with user confirmation.

---

## Step 1: Detect Project Type

Auto-detect from repo contents:

```bash
# Language detection
[ -f go.mod ] && echo "go"
[ -f Cargo.toml ] && echo "rust"
[ -f package.json ] && echo "node"
[ -f pyproject.toml ] || [ -f setup.py ] && echo "python"
[ -f mix.exs ] && echo "elixir"
```

Also detect: monorepo (multiple language markers or `packages/`/`apps/` dirs), web framework (`.next/`, `vite.config.*`), AI/ML (`*.safetensors`, `models/`).

Record detected types for use in subsequent checks.

---

## Step 2: CC Hygiene Checks

### 2.1 `.claudeignore` exists (CRITICAL)

Check: file exists at repo root.

If missing → offer to create from universal base + detected language patterns. Use templates from **repo-init** skill.

If exists → verify it covers:

| Category | Patterns to check | Severity |
|----------|--------------------|----------|
| Secrets | `.env`, `.env.*`, `.envrc`, `*.pem`, `*.key` | CRITICAL |
| Lock files | `package-lock.json`, `yarn.lock`, `Cargo.lock`, `go.sum`, etc. | IMPORTANT |
| Source maps | `*.map` | IMPORTANT |
| Binary assets | `*.png`, `*.jpg`, `*.svg`, `*.woff`, etc. | IMPORTANT |
| Build output | Language-specific (`node_modules/`, `target/`, `dist/`, etc.) | IMPORTANT |
| Agent dirs | `.worktrees/`, `history/` | NICE |

Report each missing category separately.

### 2.2 CLAUDE.md / AGENTS.md size (IMPORTANT)

```bash
wc -l CLAUDE.md AGENTS.md 2>/dev/null
```

- If either exceeds 100 lines → flag as IMPORTANT, suggest `/compress`
- Estimate token cost: `bytes / 4`

### 2.3 CLAUDE.md / AGENTS.md duplication (IMPORTANT)

If both files exist and neither is a symlink:
- Check if CLAUDE.md is a symlink to AGENTS.md (`readlink CLAUDE.md`)
- If not a symlink, check for content overlap (shared headings, similar line counts)
- Flag duplication, suggest stub pattern or symlink

### 2.4 Global config duplication (NICE)

If `~/.claude/CLAUDE.md` exists, check for sections duplicated into the repo's AGENTS.md/CLAUDE.md:
- Prime Directive
- Quality Gates
- Session Orientation
- Role / Orchestrator

Flag matches as NICE — suggest removing from per-repo file.

---

## Step 3: Git Hygiene Checks

### 3.1 `.gitignore` exists (CRITICAL)

Check: file exists. If missing → offer to create from **repo-init** templates.

### 3.2 `.gitignore` coverage (IMPORTANT)

Verify language-specific patterns are present for detected project type:

| Language | Must include |
|----------|-------------|
| Node/TS | `node_modules/`, `dist/`, `.next/` (if Next.js) |
| Python | `__pycache__/`, `.venv/`, `*.pyc` |
| Go | `vendor/` (if vendoring), `bin/` |
| Rust | `target/` |

### 3.3 Secrets in tracked files (CRITICAL)

```bash
git ls-files | grep -iE '\.env$|\.env\.|\.pem$|\.key$|credentials|secret' 2>/dev/null
```

If matches found → CRITICAL. Do NOT auto-fix (destructive). Warn user.

---

## Step 4: Beads Integration

### 4.1 Detect beads

```bash
command -v bd >/dev/null 2>&1 && echo "installed" || echo "not installed"
[ -d .beads ] && echo "initialized" || echo "not initialized"
```

### 4.2 If beads installed but not initialized (IMPORTANT)

Suggest `bd init -q && bd onboard` for project repos. Skip for config/docs-only repos.

### 4.3 If beads initialized — run doctor (NICE)

```bash
bd doctor 2>/dev/null
```

Surface any warnings or failures.

### 4.4 `.beads/` in `.gitignore` check (IMPORTANT)

Beads tracks its own files in git, but `.beads/beads.db*` should NOT be tracked. Check:

```bash
git check-ignore -q .beads/beads.db 2>/dev/null || echo "beads.db not ignored"
```

---

## Step 5: Timbers Integration

### 5.1 Detect timbers

```bash
command -v timbers >/dev/null 2>&1 && echo "installed" || echo "not installed"
[ -d .timbers ] && echo "initialized" || echo "not initialized"
```

### 5.2 If timbers installed — run doctor (NICE)

```bash
timbers doctor 2>/dev/null
```

Surface any warnings or failures from timbers doctor output.

### 5.3 If timbers not initialized (NICE)

Suggest `timbers init` for project repos that have active development (commits in last 30 days).

### 5.4 Pending entries (INFO)

```bash
timbers status --json 2>/dev/null
```

If pending commit count is high (>20), note it as INFO — suggest `timbers log` to catch up.

---

## Step 6: Present Report

Collect all findings and present as a severity-grouped table:

```
## Repo Health Report: <repo-name>

Detected: <language(s)>, <project-type>

### CRITICAL
| Check | Status | Fix |
|-------|--------|-----|
| .claudeignore exists | MISSING | Create from template? |
| Secrets in tracked files | .env tracked | ⚠️ Manual removal needed |

### IMPORTANT
| Check | Status | Fix |
|-------|--------|-----|
| .claudeignore covers lock files | Missing Cargo.lock | Add pattern? |
| CLAUDE.md size | 147 lines (~920 tokens) | Run /compress? |

### NICE TO HAVE
| Check | Status | Fix |
|-------|--------|-----|
| Timbers initialized | Not initialized | Run timbers init? |
| Global config duplication | Prime Directive duplicated | Remove from AGENTS.md? |

### INFO
| Check | Status |
|-------|--------|
| Timbers pending | 42 undocumented commits |
| Beads doctor | 0 warnings |

### PASSED
✓ .gitignore exists
✓ .claudeignore covers secrets
✓ Beads initialized and healthy
✓ No CLAUDE.md/AGENTS.md duplication
```

---

## Step 7: Apply Fixes

For each finding with an available fix, ask the user:

- **Create files** (.claudeignore, .gitignore): generate from templates, show diff, confirm
- **Add patterns**: append to existing file, show what will be added, confirm
- **Compress**: invoke `/compress` on oversized files
- **Initialize tools**: run `bd init`, `timbers init` with confirmation

**Never auto-fix:**
- Secrets in git history (destructive, needs `git filter-branch` or BFG)
- File deletions
- Content removals from CLAUDE.md/AGENTS.md (suggest, don't execute)

---

## Severity Reference

| Level | Meaning | Examples |
|-------|---------|---------|
| CRITICAL | Security risk or massive token waste | Missing .claudeignore, tracked secrets |
| IMPORTANT | Significant inefficiency | Missing lock file patterns, oversized CLAUDE.md |
| NICE | Improvement opportunity | Tool not initialized, global config duplication |
| INFO | Informational, no action needed | Pending timbers entries, beads stats |

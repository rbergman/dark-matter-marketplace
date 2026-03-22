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
| Lock files | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`, `poetry.lock`, `uv.lock` | IMPORTANT |
| Source maps | `*.map` | IMPORTANT |
| Binary assets | `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.ico`, `*.svg`, `*.woff`, `*.woff2`, `*.ttf`, `*.eot` | IMPORTANT |
| Build output | Language-specific (`node_modules/`, `target/`, `dist/`, etc.) | IMPORTANT |
| Agent dirs | `.worktrees/`, `.beads/`, `.timbers/`, `history/` | IMPORTANT |

Report each missing category separately.

### 2.2 CLAUDE.md / AGENTS.md size (IMPORTANT)

```bash
wc -l CLAUDE.md AGENTS.md 2>/dev/null
```

- If either exceeds 100 lines → flag as IMPORTANT, suggest `/compress`
- Estimate token cost: `bytes / 4`

### 2.3 CLAUDE.md / AGENTS.md duplication (IMPORTANT)

If both files exist:

1. **Check symlinks first** — run `readlink CLAUDE.md` and `readlink AGENTS.md`
2. If either is a symlink to the other → **PASSED** ("unified via symlink — zero-maintenance dedup")
3. If both are regular files → check for content overlap (shared headings, similar line counts)
4. If overlap detected → flag as IMPORTANT, suggest **either** a stub pattern or symlink as valid dedup strategies — don't prescribe one over the other

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

### 3.3 `core.hooksPath` conflicts (IMPORTANT)

```bash
git config core.hooksPath 2>/dev/null
```

If set (typically to `.husky/`), this overrides `.git/hooks/` entirely — beads and timbers hooks installed there will never fire. Flag as IMPORTANT.

**Fix:** Remove husky, unset `core.hooksPath`, and let beads own `.git/hooks/` with quality gates appended outside its section markers:
```bash
npm uninstall husky
rm -rf .husky
git config --unset core.hooksPath
bd hooks install
# Then append quality gates after END BEADS INTEGRATION marker
```

### 3.4 Secrets in tracked files (CRITICAL)

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

### 4.2 Beads version and Dolt dependency (IMPORTANT)

```bash
bd --version 2>/dev/null
command -v dolt >/dev/null 2>&1 && echo "dolt installed" || echo "dolt missing"
```

Beads 0.58+ requires Dolt as its storage backend. Check both:

- If beads version is below 0.60: flag as IMPORTANT — upgrade needed (`brew upgrade steveyegge/beads/bd`)
- If dolt is not installed: flag as IMPORTANT — required dependency (`brew install dolt`)
- If both present and current: PASSED

### 4.3 If beads installed but not initialized (IMPORTANT)

Suggest `bd init` for project repos. Skip for config/docs-only repos.

### 4.4 If beads initialized — run doctor (NICE)

```bash
bd doctor 2>/dev/null
```

Surface any warnings or failures.

### 4.5 `.beads/` gitignore check (IMPORTANT)

Beads 0.58+ stores data in `.beads/dolt/` and creates `.beads/.gitignore` automatically to exclude dolt data and runtime files. Check that this internal gitignore exists:

```bash
[ -f .beads/.gitignore ] && echo "beads gitignore exists" || echo "beads gitignore missing"
```

If missing → flag as IMPORTANT. Suggest running any `bd` command to trigger auto-creation, or manually create `.beads/.gitignore` with `dolt/` entry.

Also verify these entries are in `.beads/.gitignore` (not auto-added during upgrade):

```bash
grep -q "dolt-monitor.pid.lock" .beads/.gitignore 2>/dev/null && echo "pid.lock: present" || echo "pid.lock: missing"
grep -q "^backup/" .beads/.gitignore 2>/dev/null && echo "backup/: present" || echo "backup/: missing"
```

If either is missing → flag as IMPORTANT. `dolt-monitor.pid.lock` goes after `dolt-monitor.pid`. `backup/` is the local backup directory (auto-generated, should not be committed).

### 4.6 Dolt server port check (IMPORTANT)

```bash
bd dolt show 2>/dev/null | grep 'Port:'
```

Beads 0.60+ uses OS-assigned ephemeral ports. If port is 3307 (pre-0.59 hardcoded) or a fixed hash-derived port (0.59), flag as IMPORTANT — upgrade to beads 0.60+ for automatic ephemeral port assignment.

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

## Step 5.5: Quality Gate Checks

Verify the repo has infrastructure to catch problems before they ship. Detection uses the project type from Step 1.

### 5.5.1 Build system (IMPORTANT)

Check for `justfile` at repo root:

```bash
[ -f justfile ] || [ -f Justfile ] && echo "exists" || echo "missing"
```

If exists, verify it has core recipes:

```bash
just --list 2>/dev/null | grep -E '^\s*(check|test|setup|clean)\b'
```

| Recipe | Purpose | Severity if missing |
|--------|---------|---------------------|
| `check` or `test` | Quality gates | IMPORTANT |
| `setup` | First-time setup | NICE |
| `clean` | Remove artifacts | NICE |

If no justfile at all → NICE (suggest creating via **just-pro** skill).

### 5.5.2 Tool version pinning (NICE)

```bash
[ -f .mise.toml ] && echo "exists" || echo "missing"
```

If missing → NICE. Suggest `mise use <lang>@<version>` to pin.

If exists, verify at least one tool is pinned (not just comments):

```bash
grep -E '^\w+\s*=' .mise.toml 2>/dev/null | grep -v '^#'
```

### 5.5.3 Language-specific quality configs (IMPORTANT)

Each **lang-pro** skill ships strict reference configs that enforce complexity limits, file/function length caps, and comprehensive lint rules. Repos should adopt these configs — they represent the quality floor.

**Do NOT auto-create or auto-update configs.** Instead: read the repo's current config, read the lang-pro reference, analyze the diff, and present the user with specific recommendations. Let the user decide what to adopt.

#### Go — check against `go-pro/references/golangci-v2.yml`

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `.golangci.yml` exists | This is where Go quality lives — without it, only `go vet` runs | IMPORTANT |
| Linter count | Reference enables 40+ linters (funlen, gocognit, gosec, errcheck, etc.) | IMPORTANT |
| Complexity limits | `funlen: 60 lines / 40 statements`, `gocognit: 15`, `cyclop: 10` | IMPORTANT |
| File length | `revive file-length-limit: 350` | IMPORTANT |
| Line length | `lll: 140` | NICE |
| Formatters | `gofumpt` + `gci` enabled | NICE |

If `.golangci.yml` exists but is weak (few linters, no complexity limits), diff against the reference and present gaps.

#### TypeScript — check against `typescript-pro/references/`

Two configs to check:

**`tsconfig.json`** vs `tsconfig.strict.json` reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `"strict": true` | Base requirement | IMPORTANT |
| `"noUncheckedIndexedAccess": true` | Catches undefined from index access | IMPORTANT |
| `"exactOptionalPropertyTypes": true` | Distinguishes undefined from optional | IMPORTANT |
| `"noImplicitReturns": true` | All code paths return | IMPORTANT |
| `"verbatimModuleSyntax": true` | Enforces type-only imports | NICE |

**`eslint.config.js`** vs `eslint.config.js` reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| ESLint config exists | Any ESLint config file present | IMPORTANT |
| `strictTypeChecked` preset | Reference uses `tseslint.configs.strictTypeChecked` | IMPORTANT |
| Zero-any rules | `no-explicit-any`, `no-unsafe-*` family all set to `error` | IMPORTANT |
| Floating promises | `no-floating-promises` set to `error` | IMPORTANT |
| Complexity limits | `complexity: 10`, `max-lines-per-function: 60`, `max-lines: 400`, `max-depth: 4` | IMPORTANT |
| `max-lines` has no skip options | `max-lines` must NOT use `skipBlankLines` or `skipComments` — total lines count | IMPORTANT |
| Comment discipline | `no-restricted-disable` blocks disabling critical rules | NICE |

#### Rust — check against `rust-pro/references/`

Three configs:

**`clippy.toml`** reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `clippy.toml` exists | Complexity thresholds configured | IMPORTANT |
| `cognitive-complexity-threshold = 15` | Function complexity cap | IMPORTANT |
| `too-many-lines-threshold = 50` | Function length cap | IMPORTANT |
| `too-many-arguments-threshold = 5` | Parameter count cap | IMPORTANT |

**`Cargo.toml` `[lints]`** vs `cargo_lints.toml` reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `[lints.clippy]` section exists | Central lint configuration | IMPORTANT |
| Pedantic/nursery/cargo groups enabled | `pedantic = "warn"`, etc. | IMPORTANT |
| Panic prevention denies | `unwrap_used`, `expect_used`, `panic`, `indexing_slicing` = `"deny"` | IMPORTANT |
| Type safety denies | `as_conversions`, `cast_*` family = `"deny"` | IMPORTANT |
| `unsafe_code = "deny"` in `[lints.rust]` | Safety guarantee | IMPORTANT |

**`rustfmt.toml`** — check exists.

#### Python — check against `python-pro/references/`

**`pyproject.toml`** ruff section vs `pyproject-ruff.toml` reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `[tool.ruff]` section exists | Primary linter configured | IMPORTANT |
| Rule selection breadth | Reference selects: E, W, F, I, B, C4, UP, ARG, SIM, TCH, PTH, RUF | IMPORTANT |
| `target-version` set | Ensures modern Python features | NICE |

**Type checking** vs `pyrightconfig.json` reference:

| Check | What to look for | Severity |
|-------|-----------------|----------|
| Pyright or mypy configured | `pyrightconfig.json`, or `[tool.pyright]`/`[tool.mypy]` in pyproject.toml | IMPORTANT |
| `"typeCheckingMode": "strict"` | Maximum type safety | IMPORTANT |
| `reportUnknown*Type` rules enabled | Catches untyped code | IMPORTANT |

### 5.5.4 Test infrastructure (IMPORTANT)

Verify tests can be discovered:

```bash
# Node/TS
[ -f package.json ] && grep -q '"test"' package.json && echo "npm test configured"

# Go
find . -name '*_test.go' -maxdepth 3 | head -1 | grep -q . && echo "go tests found"

# Rust
grep -q '\[dev-dependencies\]' Cargo.toml 2>/dev/null || find . -name '*_test.rs' -o -path '*/tests/*.rs' | head -1 | grep -q . && echo "rust tests found"

# Python
find . -name 'test_*.py' -o -name '*_test.py' -maxdepth 3 | head -1 | grep -q . && echo "python tests found"
```

No test files found → IMPORTANT. Suggest creating initial test structure via **lang-pro** skill.

### 5.5.5 CI/CD (NICE)

```bash
[ -d .github/workflows ] && ls .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null | head -5
```

No CI workflows → NICE for private repos. IMPORTANT for repos with a remote and collaborators.

If CI exists, verify it runs quality gates (grep for `test`, `check`, `lint` in workflow files).

---

## Step 5.6: Session Retro Integration

Check that the user's landing-the-plane workflow includes session retro.

### 5.6.1 Landing-the-plane rule exists (IMPORTANT)

```bash
[ -f ~/.claude/rules/landing-the-plane.md ] && echo "exists" || echo "missing"
```

If missing → flag as IMPORTANT. Offer to create from the standard template (see dm-work:session-retro skill for context).

### 5.6.2 Session retro step present (IMPORTANT)

```bash
grep -qi 'session.retro\|session-retro' ~/.claude/rules/landing-the-plane.md 2>/dev/null && echo "present" || echo "missing"
```

If the rule file exists but doesn't mention session retro → flag as IMPORTANT. Offer to add the retro step:

```markdown
3. **Session retro** — run `/session-retro` to convert friction, mistakes, and discoveries into persistent rules and memories
```

This is the self-improvement loop — without it, sessions end without capturing what went wrong or what was learned.

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
| Quality gates recipe | No `just check` recipe | Add to justfile? |
| TypeScript strict mode | `"strict": false` in tsconfig | Enable strict? |
| Test infrastructure | No test files found | See typescript-pro skill |

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
✓ just check recipe exists
✓ tsconfig.json strict mode enabled
✓ CI workflow runs quality gates
```

---

## Step 7: Apply Fixes

For each finding with an available fix, ask the user:

- **Create files** (.claudeignore, .gitignore): generate from templates, show diff, confirm
- **Add patterns**: append to existing file, show what will be added, confirm
- **Compress**: invoke `/compress` on oversized files
- **Initialize tools**: run `bd init`, `timbers init` with confirmation
- **Fix `max-lines` skip options**: If `max-lines` uses `skipBlankLines` or `skipComments`, apply this migration:
  1. Remove skip options: change to `'max-lines': ['error', { max: 400 }]`
  2. Find existing violations: `find src -name '*.ts' ! -name '*.test.ts' ! -name '*.spec.ts' | xargs wc -l | awk '$1 > 400'`
  3. Add a legacy override block in `eslint.config.js` for existing violations (warn, not error):
     ```js
     {
       files: ['src/existing-large-file.ts', ...],  // frozen list — trends DOWN only
       rules: { 'max-lines': ['warn', { max: 400 }] },
     },
     ```
  4. New files get `error`. Legacy files get `warn` until refactored below 400.

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

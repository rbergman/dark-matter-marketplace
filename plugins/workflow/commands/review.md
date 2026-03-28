---
description: Run parallel architecture, code, security, and design review with local beads or GitHub PR comments
argument-hint: "--pr <number>, --commits <range>, --only <acsd>, --min-severity <level>, --skip-beads, --output-file <path>, --format json, --no-interactive, --adversarial"
---

# Unified Code Review Command

Run parallel architecture, code, and security reviewers for comprehensive peer review. Supports two modes:

- **Local mode** (default): Creates beads for findings + inline report
- **PR mode** (`--pr N`): Posts findings as GitHub review comments

## Arguments

```
$ARGUMENTS
```

| Flag | Description | Default |
|------|-------------|---------|
| `--pr <number>` | PR mode - post findings as GH review comments | (local mode) |
| `--commits <range>` | Explicit commit range (e.g., `HEAD~5..HEAD`) | auto-detect |
| `--only <letters>` | Filter reviewers: a=arch, c=code, s=security, d=design | `acs` (all, design opt-in) |
| `--min-severity <level>` | Filter output: low\|medium\|high\|critical | all |
| `--skip-beads` | Local mode only - don't create beads | create beads |
| `--output-file <path>` | Write findings to file instead of inline report | (inline) |
| `--format <mode>` | Output format: `markdown` or `json` | `markdown` |
| `--no-interactive` | Skip all AskUserQuestion prompts, use defaults | (interactive) |
| `--adversarial` | Spawn blind verifier that tests behavior against spec | (off) |

---

## Phase 1: Scope Detection

Determine what code to review based on mode and arguments.

### PR Mode (`--pr N`)

```bash
# Get PR metadata
gh pr view $PR_NUMBER --json title,headRefName,headRefOid,baseRefName,files

# Check if on PR branch
CURRENT_BRANCH=$(git branch --show-current)
PR_BRANCH=$(gh pr view $PR_NUMBER --json headRefName -q '.headRefName')
```

**If not on PR branch:**

- **Interactive (default):** Use AskUserQuestion to offer checkout:
  - "Checkout PR branch" - Run `gh pr checkout $PR_NUMBER`
  - "Review from current branch" - Continue without checkout
  - "Cancel" - Abort review
- **`--no-interactive`:** Continue without checkout (equivalent to "Review from current branch")

```bash
# Get diff for PR
git diff $(gh pr view $PR_NUMBER --json baseRefName -q '.baseRefName')...HEAD
```

### Local Mode (default)

**Priority order:**

1. **Explicit `--commits <range>`**: Use provided range
   ```bash
   git diff $RANGE
   git log --oneline $RANGE
   ```

2. **Review tag exists**: If a review tag exists for the current branch, scope = tag to HEAD
   ```bash
   BRANCH=$(git branch --show-current)
   TAG="review/${BRANCH}/latest"
   if git rev-parse "$TAG" >/dev/null 2>&1; then
     TAG_SHA=$(git rev-parse "$TAG")
     HEAD_SHA=$(git rev-parse HEAD)
     if [ "$TAG_SHA" = "$HEAD_SHA" ]; then
       # No changes since last review — report and exit
       echo "No changes since last review at $(git log -1 --format=%h $TAG)."
       exit
     fi
     git log --oneline $TAG_SHA..HEAD
     git diff --stat $TAG_SHA...HEAD
   fi
   ```
   > **Tip:** To re-review a full feature branch, use `--commits main..HEAD`.

3. **Feature branch/worktree**: If not on `main`/`master`, scope = divergence from main
   ```bash
   BASE_BRANCH=$(git rev-parse --abbrev-ref main 2>/dev/null || echo master)
   git log --oneline $BASE_BRANCH..HEAD
   git diff --stat $BASE_BRANCH...HEAD
   ```

4. **On main with unclear scope**:
   - **Interactive (default):** Use AskUserQuestion:
     - "Recent commits (HEAD~5)" - Review last 5 commits
     - "Custom range" - Prompt for range
     - "Cancel" - Abort
   - **`--no-interactive`:** Default to `HEAD~5..HEAD`

**Scope output needed:**
- Commit range (BASE_SHA..HEAD_SHA)
- List of changed files
- Total LOC changed
- Commit count

---

## Phase 2: Scout (Haiku, Fast)

Quick pre-analysis to route files and provide focused guidance to reviewers.

````
Task(subagent_type="Explore", model="haiku", prompt="
TASK: Analyze scope for code review preparation

COMMIT RANGE: <range>
CHANGED FILES: <file list>

ANALYZE:
1. File types and languages present
2. Project type signals (game, web app, API, CLI, library)
3. Architectural patterns visible (ECS, MVC, microservices, etc.)
4. Key areas of change
5. Complexity hotspots (large files, concentrated changes)
6. Lint config for LOC limits (check eslint, golangci-lint, etc.)
7. Domain classification — group changed files into review domains and assign skills.
   Only split into multiple domains when files span genuinely distinct areas (e.g.,
   frontend components vs backend API handlers). Single-domain is correct when changes
   are cohesive.

   SKILL CATALOG (assign matching skills to each domain):
   | Skill | When to assign |
   |-------|----------------|
   | frontend-design:frontend-design | React/Vue/Svelte components, CSS/HTML, UI logic |
   | dm-lang:typescript-pro | TypeScript (.ts, .tsx) |
   | dm-lang:go-pro | Go (.go) |
   | dm-lang:python-pro | Python (.py) |
   | dm-lang:rust-pro | Rust (.rs) |
   | dm-game:game-perf | Game loops, update/render, per-frame code |
   | dm-game:game-design | Game mechanics, player systems |
   | dm-arch:solid-architecture | Module boundaries, dependency patterns |
   | dm-arch:data-oriented-architecture | Polymorphic entities, type switches |

OUTPUT (structured):
PROJECT_TYPE: <e.g., TypeScript game, Go API, React web app>
LANGUAGES: <comma-separated>
PATTERNS: <architectural patterns detected>
CHANGE_AREAS: <key areas modified>
HOTSPOTS: <files/areas needing extra scrutiny>
LOC_LIMIT: <from lint config, or 500 default>
REVIEW_FOCUS: <specific guidance for reviewers>
REVIEW_DOMAINS:
- name: <e.g., frontend, backend, game-logic, infra>
  files: <comma-separated file list>
  skills: <comma-separated skill names from catalog>
  focus: <domain-specific review guidance>
")
````

---

## Phase 3: Parallel Reviewers

Launch reviewers based on `--only` filter. Default is `acs` (design is opt-in via `d`).

**Parse `--only` flag:**
- `a` → Architecture reviewer
- `c` → Code reviewer
- `s` → Security reviewer
- `d` → Design quality reviewer (opt-in — not included in default `acs`)

Launch selected reviewers in a SINGLE message (parallel execution).

### Architecture Reviewer (a)

````
Task(subagent_type="general-purpose", model="opus", description="Architecture review", prompt="
You are a Senior Architecture Reviewer. Review the following scope for architectural quality.

SCOPE:
- Commit range: <range>
- Files: <arch-relevant files from scout>
- Project type: <from scout>
- Patterns: <from scout>

REVIEW CHECKLIST:
1. **SOLID Principles**
   - Single Responsibility: Can each module's purpose be described in one sentence?
   - Open/Closed: Are there growing switch/if-else chains?
   - Dependency Inversion: Are dependencies injected, not hard-coded?

2. **God Object Detection**
   - LOC limit: <from scout, or 500 default>
   - Flag files approaching or exceeding limit
   - Check for classes/modules with too many responsibilities

3. **Module Organization**
   - Clear dependency direction (core → domain → application → UI)
   - No circular dependencies
   - Proper separation of concerns

4. **Project Rules**
   - Read CLAUDE.md for project-specific guidelines
   - Check compliance with stated architectural patterns

FOCUS AREAS: <from scout>
HOTSPOTS: <from scout>

OUTPUT as JSON to stdout:
```json
{
  "reviewer": "architecture",
  "summary": "1-2 sentence architectural assessment",
  "findings": [
    {
      "path": "relative/path/to/file.go",
      "line": 45,
      "side": "RIGHT",
      "severity": "medium",
      "size_estimate": "M",
      "category": "SOLID:SRP",
      "body": "[Architecture] **medium** - SOLID:SRP\n\nThis module handles both X and Y..."
    }
  ]
}
```

Severity guide:
- critical: Fundamental design flaw
- high: Significant issue worth blocking
- medium: Worth addressing, not blocking
- low: Suggestion for improvement

Size estimate (effort to fix):
- S: Trivial fix, <10 lines changed
- M: Moderate, 10-50 lines or needs some thought
- L: Significant refactor, 50-200 lines or cross-file
- XL: Major restructuring, 200+ lines or architectural change

Only flag genuine concerns. No nitpicks.
")
````

### Code Reviewer (c) — Domain-Aware

Based on the scout's `REVIEW_DOMAINS` output, code review may split into specialized reviewers:

- **Single domain** (or scout returns no domains): One code reviewer for all files, with that domain's skills injected.
- **Multiple domains**: One code reviewer **per domain**, each scoped to its file subset. All domain reviewers launch in the SAME parallel message as other Phase 3 reviewers.

**Skill injection:** Before constructing reviewer prompts, invoke each domain's listed skills using the Skill tool. Extract key review criteria, anti-patterns, and conventions from each skill. Include the extracted guidance in the corresponding reviewer's prompt under `DOMAIN-SPECIFIC CRITERIA`.

Each domain reviewer uses:

````
Task(subagent_type="feature-dev:code-reviewer", model="opus", description="Code review: <domain>", prompt="
You are a Senior Code Reviewer specializing in <domain name>.

SCOPE:
- Commit range: <range>
- Files: <this domain's files from scout — NOT all files>
- Project type: <from scout>
- Domain focus: <focus from scout's REVIEW_DOMAINS>

DOMAIN-SPECIFIC CRITERIA:
<key review criteria, anti-patterns, and conventions extracted from invoked skills>

REVIEW CHECKLIST:
1. **Bugs & Logic Errors** (confidence ≥ 80% only)
   - Null/undefined handling
   - Race conditions
   - Off-by-one errors
   - Resource leaks

2. **Error Handling**
   - Unchecked errors
   - Missing error propagation
   - Swallowed exceptions

3. **Test Coverage**
   - Changed code without corresponding test changes
   - Missing edge case coverage
   - Regression test gaps

4. **Performance**
   - Allocations in hot paths
   - Inefficient algorithms
   - Missing caching where appropriate

5. **Project Conventions**
   - Read CLAUDE.md for project rules
   - Naming, imports, error handling per standards

FOCUS AREAS: <from scout>
HOTSPOTS: <from scout, filtered to this domain's files>

OUTPUT as JSON to stdout:
```json
{
  "reviewer": "code",
  "domain": "<domain name>",
  "summary": "1-2 sentence code quality assessment for this domain",
  "findings": [
    {
      "path": "relative/path/to/file.go",
      "line": 112,
      "side": "RIGHT",
      "severity": "high",
      "size_estimate": "S",
      "category": "bug",
      "confidence": 85,
      "body": "[Code:<domain>] **high** - bug (85% confidence)\n\nError from DoThing() is not checked..."
    }
  ]
}
```

Severity guide:
- critical: Will cause runtime failures
- high: Likely bug or security issue
- medium: Code smell or minor bug risk
- low: Style or minor improvement

Size estimate (effort to fix):
- S: Trivial fix, <10 lines changed
- M: Moderate, 10-50 lines or needs some thought
- L: Significant refactor, 50-200 lines or cross-file
- XL: Major restructuring, 200+ lines or architectural change

Only report findings with ≥80% confidence.
")
````

### Security Reviewer (s)

````
Task(subagent_type="general-purpose", model="opus", description="Security review", prompt="
You are a Senior Security Reviewer. Review the following scope for security vulnerabilities.

SCOPE:
- Commit range: <range>
- Files: <security-relevant files: auth, input handling, *.tf, *.sh, env>
- Project type: <from scout>

REVIEW CHECKLIST:
1. **Secrets Handling**
   - Hardcoded secrets, API keys, tokens
   - Secrets in logs or error messages
   - Insecure secret storage

2. **Input Validation**
   - SQL injection vectors
   - Command injection
   - Path traversal
   - XSS (if web)

3. **Authentication & Authorization**
   - Auth bypass possibilities
   - Missing authorization checks
   - Session handling issues

4. **Infrastructure (if *.tf files)**
   - Overly permissive IAM
   - Public exposure of resources
   - Missing encryption

5. **General**
   - Insecure dependencies
   - Debug code in production paths
   - Information disclosure

FOCUS AREAS: <from scout>

OUTPUT as JSON to stdout:
```json
{
  "reviewer": "security",
  "summary": "1-2 sentence security assessment",
  "findings": [
    {
      "path": "relative/path/to/file.go",
      "line": 78,
      "side": "RIGHT",
      "severity": "critical",
      "size_estimate": "M",
      "category": "injection",
      "body": "[Security] **critical** - injection\n\nSQL query built via string concatenation..."
    }
  ]
}
```

Severity guide:
- critical: Exploitable vulnerability
- high: Significant security risk
- medium: Defense-in-depth issue
- low: Hardening suggestion

Size estimate (effort to fix):
- S: Trivial fix, <10 lines changed
- M: Moderate, 10-50 lines or needs some thought
- L: Significant refactor, 50-200 lines or cross-file
- XL: Major restructuring, 200+ lines or architectural change

Flag anything exploitable. Be thorough but not paranoid.
")
````

### Design Quality Reviewer (d) — Opt-In

Only runs when `d` is included in `--only` (e.g., `--only acsd` or `--only d`). Not part of the default `acs` set because it reviews UI/visual concerns that not every project has.

**Best with CDT MCP:** If the chrome-devtools MCP is connected and the app is running, the reviewer takes screenshots for visual evaluation. Without CDT, it falls back to code-only review of CSS/component files.

````
Task(subagent_type="general-purpose", model="opus", description="Design quality review", prompt="
You are a Senior Design Quality Reviewer. Review the UI-facing code for design quality and AI slop patterns.

SCOPE:
- Commit range: <range>
- Files: <UI-relevant files from scout: CSS, components, templates, layouts>
- Project type: <from scout>

VISUAL INSPECTION (if chrome-devtools MCP available and app running):
1. Navigate to affected pages
2. Take screenshots (desktop + mobile viewport)
3. Evaluate visual output against criteria below

CODE INSPECTION (always):
Review CSS, component, and layout files in the diff.

REVIEW CRITERIA:

1. **AI Slop Detection** — penalize generic patterns
   - Generic gradient backgrounds (purple/blue over white cards)
   - Template-default spacing, typography, and color choices
   - Identical component styling across unrelated sections
   - Stock placeholder content that survived to production
   - Over-reliance on rounded corners + drop shadows + blur
   - Generic hero sections with centered text over stock imagery
   - No distinct visual identity or mood — indistinguishable from other AI output
   - Excessive use of utility classes without semantic abstraction

2. **Design Coherence**
   - Consistent typography hierarchy (headings, body, captions)
   - Spacing follows a defined scale (not random px values)
   - Color palette is intentional, not default
   - Components feel like parts of the same whole
   - Distinct mood or identity (could you identify this app from a screenshot?)

3. **Design Craft**
   - Contrast ratios meet WCAG AA (4.5:1 text, 3:1 large text)
   - Interactive elements have visible focus/hover/active states
   - Loading, empty, and error states are designed (not default browser)
   - Responsive behavior is intentional (not just broken desktop layout)
   - Animations serve a purpose (feedback, orientation) not decoration

4. **Code Patterns**
   - Hard-coded colors instead of design tokens or CSS variables
   - Inline styles that duplicate theme values
   - Magic numbers for spacing/sizing (use scale)
   - Duplicated styling across unrelated components
   - Missing dark mode support where the project uses it

AI SLOP SCORE: Rate the overall output on a 1-5 scale:
  5 = Distinctive, clearly designed with intent
  4 = Solid, some custom decisions visible
  3 = Adequate but generic, could be any app
  2 = Template-feeling, minimal custom design decisions
  1 = Pure AI slop, generic patterns throughout

FOCUS AREAS: <from scout>

OUTPUT as JSON to stdout:
```json
{
  \"reviewer\": \"design\",
  \"summary\": \"1-2 sentence design quality assessment\",
  \"slop_score\": 3,
  \"findings\": [
    {
      \"path\": \"src/components/Hero.tsx\",
      \"line\": 15,
      \"side\": \"RIGHT\",
      \"severity\": \"medium\",
      \"size_estimate\": \"M\",
      \"category\": \"ai-slop\",
      \"body\": \"[Design] **medium** - ai-slop\\n\\nGeneric purple-to-blue gradient with centered white text. This hero section is indistinguishable from template defaults. Replace with project-specific colors and layout.\"
    }
  ]
}
```

Severity guide:
- critical: Design makes the app unusable or inaccessible
- high: Significant design issue (WCAG failure, broken responsive, pure slop)
- medium: Generic but functional (template defaults, no identity)
- low: Polish opportunity (missing hover state, spacing inconsistency)

Only flag genuine concerns. Focus on patterns, not individual style preferences.
")
````

---

## Phase 3.5: Adversarial Verification (`--adversarial`)

**Only runs when `--adversarial` flag is present.** Launches in parallel with Phase 3 reviewers.

The adversarial agent verifies behavior against the spec WITHOUT reading the implementation. It derives what the code SHOULD do from the spec, writes tests to verify those behaviors, and reports gaps.

### Spec resolution

Find the spec from (in priority order):
1. Bead — if reviewing a bead-linked branch, fetch via `bd show <id>`
2. PR body — if `--pr` mode, extract from PR description
3. Commit messages — concatenate commit messages in the scope range

If no spec is found, skip adversarial verification and warn: "No spec found for adversarial verification. Provide a bead or PR description."

### Agent design

````
Agent(subagent_type="general-purpose", model="opus", description="Adversarial verification", prompt="
You are an Adversarial Verifier. Your job is to test whether the implementation matches the spec — WITHOUT reading the implementation source code.

SPEC:
<resolved spec text>

SCOPE:
- Commit range: <range>
- Changed files: <file list — for reference only, DO NOT read these>

RULES — what you CAN and CANNOT read:
- DO NOT read changed source files (the implementation under review)
- MAY read: test files, config files, type definitions, unchanged source files
- MAY read: package.json, tsconfig, go.mod, Cargo.toml (project structure)

PROCESS:
1. Read the spec carefully. Identify 5-10 behavioral assertions — things the code MUST do if it correctly implements the spec.
2. For each assertion, write a test that verifies the behavior from the outside (call the public API, check the output, verify side effects).
3. Write all tests to a temporary file: __adversarial_test__.<appropriate extension>
4. Run the tests.
5. Delete the temporary test file.
6. Report results.

OUTPUT as JSON to stdout:
```json
{
  \"reviewer\": \"adversarial\",
  \"summary\": \"1-2 sentence assessment of spec compliance\",
  \"assertions_total\": 8,
  \"assertions_passed\": 6,
  \"assertions_failed\": 2,
  \"findings\": [
    {
      \"path\": \"(spec)\",
      \"line\": 0,
      \"side\": \"RIGHT\",
      \"severity\": \"high\",
      \"size_estimate\": \"M\",
      \"category\": \"spec-gap\",
      \"assertion\": \"Users with expired tokens should receive 401\",
      \"test_result\": \"FAIL\",
      \"body\": \"[Adversarial] **high** - spec-gap\\n\\nSpec says expired tokens return 401, but test shows 403 returned instead.\"
    }
  ]
}
```

Severity for adversarial findings:
- critical: Core spec requirement completely unimplemented
- high: Spec behavior incorrect or missing
- medium: Edge case from spec not handled
- low: Spec ambiguity that could go either way
")
````

### Output integration

Adversarial findings merge into Phase 4 alongside other reviewer findings. They appear with `reviewer: "adversarial"` and `category: "spec-gap"`.

**Markdown output** adds an "Adversarial Verification" section:

````markdown
### Adversarial Verification (6/8 assertions passed)

| # | Assertion | Result |
|---|-----------|--------|
| 1 | Users with expired tokens receive 401 | FAIL |
| 2 | Rate limit headers present in response | PASS |
| ... | ... | ... |

**Gap analysis:** 2 spec behaviors not correctly implemented. See findings above.
````

**JSON output** adds an `adversarial` key to the `summaries` object:

```json
"adversarial": {
  "verdict": "issues",
  "summary": "6/8 spec assertions passed",
  "assertions_total": 8,
  "assertions_passed": 6
}
```

---

## Phase 4: Collect & Process Results

After all reviewers complete (including multiple domain code reviewers if split):

1. **Parse JSON output** from each reviewer

2. **Dedupe by file+line**
   - Key: `${path}:${line}`
   - Keep finding with higher severity
   - Keep larger `size_estimate` on merge (XL > L > M > S)
   - Merge bodies if from different reviewers or different domain code reviewers

3. **Apply `--min-severity` filter**
   - If `--min-severity medium`: exclude `low`
   - If `--min-severity high`: exclude `low`, `medium`
   - If `--min-severity critical`: only keep `critical`

4. **Sort by severity** (critical → high → medium → low)

---

## Phase 5: Output

Output behavior depends on `--format` and `--output-file` flags:

| `--format` | `--output-file` | Behavior |
|------------|-----------------|----------|
| `markdown` (default) | not set | Inline report to conversation |
| `markdown` | set | Write markdown report to file |
| `json` | not set | Print JSON to conversation |
| `json` | set | Write JSON to file |

### JSON Output Format (`--format json`)

When `--format json` is specified, produce machine-readable output:

```json
{
  "scope": {
    "commit_range": "abc123..def456",
    "commit_count": 5,
    "files_changed": 12,
    "loc_changed": 340
  },
  "verdict": "issues_found",
  "summaries": {
    "architecture": { "verdict": "pass", "summary": "Clean module boundaries" },
    "code": { "verdict": "issues", "summary": "2 unchecked errors" },
    "security": { "verdict": "pass", "summary": "No vulnerabilities found" },
    "design": { "verdict": "issues", "summary": "AI slop score 2/5, generic template patterns", "slop_score": 2 }
  },
  "findings": [
    {
      "id": "f1",
      "reviewer": "code",
      "domain": "backend",
      "path": "pkg/handler.go",
      "line": 112,
      "side": "RIGHT",
      "severity": "high",
      "size_estimate": "S",
      "category": "bug",
      "confidence": 85,
      "body": "Error from DoThing() is not checked...",
      "bead_id": "beads-abc123"
    }
  ],
  "stats": {
    "total": 5,
    "by_severity": { "critical": 0, "high": 2, "medium": 2, "low": 1 },
    "by_size": { "S": 3, "M": 1, "L": 1, "XL": 0 }
  }
}
```

Notes:
- `verdict` is one of: `pass`, `issues_found`, `critical_issues`
- `bead_id` is present only when beads are created (omitted with `--skip-beads`)
- `confidence` is present only for code reviewer findings

### File Output (`--output-file <path>`)

When `--output-file` is specified, write the output (markdown or JSON per `--format`) to the given file path instead of printing inline. Always confirm the write succeeded and print the path.

### Local Mode

**Create beads** (unless `--skip-beads`):

```bash
# For each finding:
bd create --title="[<severity>] <short description>" --type=bug --priority=<0-2> --json
```

Priority mapping:
- critical → P0
- high → P1
- medium → P2
- low → P3

**Generate report** (format depends on `--format` flag):

#### Markdown Report (default)

````markdown
## Review: <scope description> (<N> commits, <LOC> across <M> files)

### Verdict: <emoji> <summary>

**Critical** (<count>)
1. `file:line` [XL] - <description> → bead <id>

**High** (<count>)
2. `file:line` [S] - <description> → bead <id>
...

**Medium** (<count>)
- `file:line` [M] - <description> → bead <id>
...

**Low** (<count>)
- `file:line` [S] - <description> → bead <id>
...

**Architecture**: <PASS/ISSUES verdict + summary>
**Code Quality**: <PASS/ISSUES verdict + summary>
  (if domain-split: one sub-line per domain, e.g., "  frontend: PASS", "  backend: ISSUES - ...")
**Security**: <PASS/ISSUES verdict + summary>
**Design Quality** (if `d` included): <PASS/ISSUES verdict + summary + AI slop score>

Run `bd ready` to see created issues.
````

Verdict emojis:
- ✅ PASS - No issues found
- ⚠️ ISSUES FOUND - Has important/minor issues
- 🚨 CRITICAL ISSUES - Has critical issues

Size tags (in brackets after file:line):
- `[S]` `[M]` `[L]` `[XL]` — estimated fix effort

**Tag checkpoint** (after report output):

```bash
BRANCH=$(git branch --show-current)
TAG="review/${BRANCH}/latest"
git tag -f "$TAG" HEAD
```

This moves (or creates) the review tag to HEAD so the next `/review` starts from here.

### PR Mode

**Step 1: Show preview** of what will be posted (same format as local inline report, without bead references)

**Step 2: Confirm posting:**
- **Interactive (default):** Use AskUserQuestion:
  - "Post to GitHub" - Proceed with posting
  - "Cancel" - Abort without posting
- **`--no-interactive`:** Post immediately without confirmation

**Step 3: Post review via GitHub API:**

````bash
# Get required info
HEAD_SHA=$(gh pr view $PR_NUMBER --json headRefOid -q '.headRefOid')
OWNER_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')

# Build review body
REVIEW_BODY="## Automated PR Review

**Architecture:** <arch_summary>
**Code Quality:** <code_summary>
**Security:** <security_summary>
$(if d in --only: **Design Quality:** <design_summary> (AI slop score: <N>/5))

---
*<N> inline comments below*"

# Build comments array (example)
COMMENTS='[
  {"path": "file.go", "line": 45, "side": "RIGHT", "body": "..."}
]'

# Post review
gh api repos/$OWNER_REPO/pulls/$PR_NUMBER/reviews \
  --method POST \
  -f commit_id="$HEAD_SHA" \
  -f body="$REVIEW_BODY" \
  -f event="COMMENT" \
  --input <(echo "{\"comments\": $COMMENTS}")
````

**Step 4: Confirm success** with link to the review.

---

## Quick Reference

```bash
# Local review, auto-detect scope (resumes from last review tag if present)
/dm-work:review

# Local, re-review full feature branch (bypass review tag)
/dm-work:review --commits main..HEAD

# Local, skip security reviewer
/dm-work:review --only ac

# Local, specific commits, medium+ only
/dm-work:review --commits HEAD~5..HEAD --min-severity medium

# Local, exploratory (no beads)
/dm-work:review --skip-beads

# PR review
/dm-work:review --pr 123

# PR review, security only
/dm-work:review --pr 123 --only s

# Include design quality review (opt-in)
/dm-work:review --only acsd

# Design-only review (UI changes)
/dm-work:review --only d

# Automated/nightly: JSON output to file, no prompts, no beads
/dm-work:review --format json --output-file review-findings.json --no-interactive --skip-beads

# Automated: write markdown report to file
/dm-work:review --output-file review-report.md --no-interactive
```

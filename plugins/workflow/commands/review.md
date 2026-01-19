---
description: Run parallel architecture, code, and security review with local beads or GitHub PR comments
argument-hint: "--pr <number>, --commits <range>, --only <acs>, --min-severity <level>, --skip-beads"
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
| `--only <letters>` | Filter reviewers: a=arch, c=code, s=security | `acs` (all) |
| `--min-severity <level>` | Filter output: low\|medium\|high\|critical | all |
| `--skip-beads` | Local mode only - don't create beads | create beads |

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

**If not on PR branch:** Use AskUserQuestion to offer checkout:
- "Checkout PR branch" - Run `gh pr checkout $PR_NUMBER`
- "Review from current branch" - Continue without checkout
- "Cancel" - Abort review

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

2. **Feature branch/worktree**: If not on `main`/`master`, scope = divergence from main
   ```bash
   BASE_BRANCH=$(git rev-parse --abbrev-ref main 2>/dev/null || echo master)
   git log --oneline $BASE_BRANCH..HEAD
   git diff --stat $BASE_BRANCH...HEAD
   ```

3. **On main with unclear scope**: Use AskUserQuestion:
   - "Recent commits (HEAD~5)" - Review last 5 commits
   - "Custom range" - Prompt for range
   - "Cancel" - Abort

**Scope output needed:**
- Commit range (BASE_SHA..HEAD_SHA)
- List of changed files
- Total LOC changed
- Commit count

---

## Phase 2: Scout (Haiku, Fast)

Quick pre-analysis to route files and provide focused guidance to reviewers.

```
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

OUTPUT (structured):
```
PROJECT_TYPE: <e.g., TypeScript game, Go API, React web app>
LANGUAGES: <comma-separated>
PATTERNS: <architectural patterns detected>
CHANGE_AREAS: <key areas modified>
HOTSPOTS: <files/areas needing extra scrutiny>
LOC_LIMIT: <from lint config, or 500 default>
REVIEW_FOCUS: <specific guidance for reviewers>
```
")
```

---

## Phase 3: Parallel Reviewers

Launch reviewers based on `--only` filter. Default is all three (`acs`).

**Parse `--only` flag:**
- `a` → Architecture reviewer
- `c` → Code reviewer
- `s` → Security reviewer

Launch selected reviewers in a SINGLE message (parallel execution).

### Architecture Reviewer (a)

```
Task(subagent_type="general-purpose", model="sonnet", description="Architecture review", prompt="
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
  \"reviewer\": \"architecture\",
  \"summary\": \"1-2 sentence architectural assessment\",
  \"findings\": [
    {
      \"path\": \"relative/path/to/file.go\",
      \"line\": 45,
      \"side\": \"RIGHT\",
      \"severity\": \"medium\",
      \"category\": \"SOLID:SRP\",
      \"body\": \"[Architecture] **medium** - SOLID:SRP\\n\\nThis module handles both X and Y...\"
    }
  ]
}
```

Severity guide:
- critical: Fundamental design flaw
- high: Significant issue worth blocking
- medium: Worth addressing, not blocking
- low: Suggestion for improvement

Only flag genuine concerns. No nitpicks.
")
```

### Code Reviewer (c)

```
Task(subagent_type="feature-dev:code-reviewer", model="sonnet", description="Code quality review", prompt="
You are a Senior Code Reviewer. Review the following scope for code quality, bugs, and conventions.

SCOPE:
- Commit range: <range>
- Files: <all source + test files>
- Project type: <from scout>

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
HOTSPOTS: <from scout>

OUTPUT as JSON to stdout:
```json
{
  \"reviewer\": \"code\",
  \"summary\": \"1-2 sentence code quality assessment\",
  \"findings\": [
    {
      \"path\": \"relative/path/to/file.go\",
      \"line\": 112,
      \"side\": \"RIGHT\",
      \"severity\": \"high\",
      \"category\": \"bug\",
      \"confidence\": 85,
      \"body\": \"[Code] **high** - bug (85% confidence)\\n\\nError from DoThing() is not checked...\"
    }
  ]
}
```

Severity guide:
- critical: Will cause runtime failures
- high: Likely bug or security issue
- medium: Code smell or minor bug risk
- low: Style or minor improvement

Only report findings with ≥80% confidence.
")
```

### Security Reviewer (s)

```
Task(subagent_type="general-purpose", model="sonnet", description="Security review", prompt="
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
  \"reviewer\": \"security\",
  \"summary\": \"1-2 sentence security assessment\",
  \"findings\": [
    {
      \"path\": \"relative/path/to/file.go\",
      \"line\": 78,
      \"side\": \"RIGHT\",
      \"severity\": \"critical\",
      \"category\": \"injection\",
      \"body\": \"[Security] **critical** - injection\\n\\nSQL query built via string concatenation...\"
    }
  ]
}
```

Severity guide:
- critical: Exploitable vulnerability
- high: Significant security risk
- medium: Defense-in-depth issue
- low: Hardening suggestion

Flag anything exploitable. Be thorough but not paranoid.
")
```

---

## Phase 4: Collect & Process Results

After all reviewers complete:

1. **Parse JSON output** from each reviewer

2. **Dedupe by file+line**
   - Key: `${path}:${line}`
   - Keep finding with higher severity
   - Merge bodies if from different reviewers

3. **Apply `--min-severity` filter**
   - If `--min-severity medium`: exclude `low`
   - If `--min-severity high`: exclude `low`, `medium`
   - If `--min-severity critical`: only keep `critical`

4. **Sort by severity** (critical → high → medium → low)

---

## Phase 5: Output

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

**Generate inline report:**

```markdown
## Review: <scope description> (<N> commits, <LOC> across <M> files)

### Verdict: <emoji> <summary>

**Critical** (<count>)
1. `file:line` - <description> → bead <id>

**High** (<count>)
2. `file:line` - <description> → bead <id>
...

**Medium** (<count>)
- `file:line` - <description> → bead <id>
...

**Low** (<count>)
- `file:line` - <description> → bead <id>
...

**Architecture**: <PASS/ISSUES verdict + summary>
**Code Quality**: <PASS/ISSUES verdict + summary>
**Security**: <PASS/ISSUES verdict + summary>

Run `bd ready` to see created issues.
```

Verdict emojis:
- ✅ PASS - No issues found
- ⚠️ ISSUES FOUND - Has important/minor issues
- 🚨 CRITICAL ISSUES - Has critical issues

### PR Mode

**Step 1: Show preview** of what will be posted (same format as local inline report, without bead references)

**Step 2: Confirm with AskUserQuestion:**
- "Post to GitHub" - Proceed with posting
- "Cancel" - Abort without posting

**Step 3: Post review via GitHub API:**

```bash
# Get required info
HEAD_SHA=$(gh pr view $PR_NUMBER --json headRefOid -q '.headRefOid')
OWNER_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')

# Build review body
REVIEW_BODY="## Automated PR Review

**Architecture:** <arch_summary>
**Code Quality:** <code_summary>
**Security:** <security_summary>

---
*<N> inline comments below*"

# Build comments array
COMMENTS='[
  {"path": "file.go", "line": 45, "side": "RIGHT", "body": "..."},
  ...
]'

# Post review
gh api repos/$OWNER_REPO/pulls/$PR_NUMBER/reviews \
  --method POST \
  -f commit_id="$HEAD_SHA" \
  -f body="$REVIEW_BODY" \
  -f event="COMMENT" \
  --input <(echo "{\"comments\": $COMMENTS}")
```

**Step 4: Confirm success** with link to the review.

---

## Quick Reference

```bash
# Local review, auto-detect scope
/dm-work:review

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
```

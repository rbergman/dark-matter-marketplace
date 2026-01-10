---
description: Run parallel architecture and code review subagents for comprehensive peer review of a scope of work
argument-hint: [--epic <id>] [--commits <range>] [--skip-beads]
---

# Peer Review Command

Run parallel architecture and code review subagents to perform comprehensive peer review before merging, continuing to new work, or at any checkpoint.

## Arguments

```
$ARGUMENTS
```

| Arg | Description |
|-----|-------------|
| `--epic <id>` | Review epic + discovered issues (finds related commits) |
| `--commits <range>` | Explicit git range (e.g., `HEAD~5..HEAD`) |
| `--skip-beads` | Don't create beads for issues (exception case) |

---

## Phase 1: Determine Scope

**Priority order for scope detection:**

1. **Worktree or feature branch**: If not on `main`/`master`, scope = all commits since diverging from main
   ```bash
   git log --oneline main..HEAD
   git diff --stat main...HEAD
   ```

2. **Explicit arguments**: If `--epic <id>` or `--commits <range>` provided, use that

3. **Conversation context**: If on main, scan recent conversation for:
   - Bead IDs mentioned (e.g., "completed redshifted-abc1, redshifted-abc2")
   - Epic references or phase summaries
   - "Next Ready Work" lists
   - Recent commits discussed

4. **Ask user**: If on main with unclear context, use AskUserQuestion:
   - "What scope should I review?" with options:
     - Recent commits (HEAD~N)
     - Specific epic/beads
     - Custom commit range

**Scope output needed:**
- Commit range (BASE_SHA..HEAD_SHA)
- List of changed files
- Total LOC changed
- Commit count

---

## Phase 2: Pre-Evaluation Scout (Quick)

Before launching reviewers, run a **quick exploration** (haiku model) to analyze scope and generate focused guidance.

```
Task(subagent_type="Explore", model="haiku", prompt="
TASK: Analyze scope for peer review preparation

COMMIT RANGE: <range>
CHANGED FILES: <file list>

ANALYZE:
1. File types and languages present (TS, Go, Rust, etc.)
2. Project type signals (game code, web app, API, CLI, library)
3. Architectural patterns visible (ECS, MVC, microservices, etc.)
4. Key areas of change (rendering, physics, API, UI, data layer)
5. Complexity hotspots (large files, many changes in one area)

OUTPUT (structured):
```
PROJECT_TYPE: <e.g., TypeScript game, Go API, React web app>
LANGUAGES: <comma-separated>
PATTERNS: <architectural patterns detected>
CHANGE_AREAS: <key areas modified>
HOTSPOTS: <files/areas needing extra scrutiny>
SUGGESTED_SKILLS: <skills relevant to this repo - see examples below>
REVIEW_FOCUS: <specific guidance for reviewers based on changes>
```

SKILL EXAMPLES (adapt to detected project type):
- TypeScript game: typescript-pro, game-perf, solid-architecture
- Go API: go-pro, solid-architecture
- React web: typescript-pro, frontend patterns
- Rust CLI: rust-pro, solid-architecture
- Python ML: python patterns, data-oriented-architecture
")
```

**Use scout output to:**
- Select appropriate skills for reviewers
- Provide focused guidance (don't make reviewers rediscover scope)
- Identify if scope is small enough for inline-only report

---

## Phase 3: Launch Parallel Review Subagents

Launch BOTH subagents in a SINGLE message (parallel execution):

### Architecture Reviewer

```
Task(subagent_type="general-purpose", model="opus", description="Architecture review", prompt="
You are a Senior Architecture Reviewer. Review the following scope of work for architectural quality.

SCOPE:
- Commit range: <BASE_SHA>..<HEAD_SHA>
- Files: <changed files list>
- Project type: <from scout>
- Patterns: <from scout>

SKILLS TO APPLY: <from scout, e.g., solid-architecture, data-oriented-architecture, typescript-pro>

REVIEW CHECKLIST:
1. **SOLID Principles**
   - Single Responsibility: Can each module's purpose be described in one sentence?
   - Open/Closed: Are there growing switch/if-else chains?
   - Dependency Inversion: Are dependencies injected, not hard-coded?

2. **God Object Detection**
   - Flag any file approaching or exceeding 600 LOC
   - Check for classes/modules with too many responsibilities
   - Look for tight coupling (changes ripple across codebase)

3. **Module Organization**
   - Clear dependency direction (core → domain → application → UI)
   - No circular dependencies
   - Proper separation of concerns

4. **Project-Specific Rules**
   - Read CLAUDE.md and AGENTS.md for project rules
   - Check compliance with stated architectural guidelines

FOCUS AREAS (from scout): <review focus>
HOTSPOTS: <hotspots to scrutinize>

OUTPUT FORMAT:
```
ARCH_VERDICT: PASS | ISSUES_FOUND | CRITICAL_ISSUES
ISSUE_COUNT: <N critical, M important, P minor>

CRITICAL:
- [file:line] <description> | SOLID:<principle> or GOD_OBJECT or COUPLING
...

IMPORTANT:
- [file:line] <description> | <category>
...

MINOR:
- [file:line] <description> | <category>
...

STRENGTHS:
- <what was done well architecturally>

SUMMARY: <1-2 sentence architectural assessment>
```
")
```

### Code Reviewer

```
Task(subagent_type="feature-dev:code-reviewer", model="opus", description="Code quality review", prompt="
Review the following scope of work for code quality, bugs, and project convention adherence.

SCOPE:
- Commit range: <BASE_SHA>..<HEAD_SHA>
- Files: <changed files list>
- Project type: <from scout>

SKILLS TO APPLY: <from scout, e.g., typescript-pro, game-perf, go-pro>

REVIEW FOCUS:
1. **Bugs & Logic Errors** (confidence ≥ 80% only)
   - Null/undefined handling
   - Race conditions
   - Off-by-one errors
   - Resource leaks

2. **Security Vulnerabilities**
   - Injection risks
   - Auth/authz issues
   - Data exposure

3. **Performance Issues**
   - Allocations in hot paths (game loops, per-frame code)
   - Inefficient algorithms
   - Missing caching where appropriate

4. **Test Coverage**
   - Changed code without corresponding test changes
   - Missing edge case coverage
   - Regression test gaps

5. **Project Conventions**
   - Read CLAUDE.md and AGENTS.md for project rules
   - Import patterns, naming, error handling per project standards

FOCUS AREAS (from scout): <review focus>
HOTSPOTS: <hotspots to scrutinize>

OUTPUT FORMAT:
```
CODE_VERDICT: PASS | ISSUES_FOUND | CRITICAL_ISSUES
ISSUE_COUNT: <N critical, M important, P minor>

CRITICAL (confidence ≥ 90%):
- [file:line] <description> | confidence:<N>% | category:<bug|security|perf>
...

IMPORTANT (confidence ≥ 80%):
- [file:line] <description> | confidence:<N>% | category:<type>
...

MINOR (confidence ≥ 80%):
- [file:line] <description> | confidence:<N>% | category:<type>
...

TEST_COVERAGE_GAPS:
- <files with code changes but no test changes>

STRENGTHS:
- <what was done well>

SUMMARY: <1-2 sentence code quality assessment>
```
")
```

---

## Phase 4: Collect Results & Create Beads

After both subagents complete:

1. **Parse responses** - Extract issues from both reviewers

2. **Create beads for ALL issues** (unless `--skip-beads`):
   ```bash
   # For each issue:
   bd create --title="<issue summary>" --type=bug --priority=<0-2 based on severity> --json
   ```

   Priority mapping:
   - Critical → P0 or P1
   - Important → P1 or P2
   - Minor → P2 or P3

3. **Track bead IDs** for inline report

---

## Phase 5: Generate Report

### Inline Report (Always)

Token-efficient, human-friendly, actionable:

```markdown
## Peer Review: <scope description> (<N> commits, <LOC> across <M> files)

### Verdict: <emoji> <summary>

**Critical** (<count>)
1. `file:line` - <description> → bead <id>
2. ...

**Important** (<count>)
3. `file:line` - <description> → bead <id>
...

**Minor** (<count>)
- `file:line` - <description> → bead <id>
...

**Architecture**: <PASS/ISSUES verdict + 1-line summary>
**Code Quality**: <PASS/ISSUES verdict + 1-line summary>
**Test Coverage**: <gaps if any>

### Next Steps
- [ ] Address <N> critical issues before proceeding
- [ ] Review <M> important issues
- Run `bd ready` to see created issues
```

Verdict emojis:
- ✅ PASS - No issues found
- ⚠️ ISSUES FOUND - Has Important/Minor issues
- 🚨 CRITICAL ISSUES - Has Critical issues, must address

### History File (Conditional)

Only create if findings are extensive (>20 issues OR reviewers provided detailed code examples):

**Path:** `history/peer-reviews/<YYYY-MM-DD>-<scope-slug>.md`

**Contents:**
- Full reviewer outputs
- Detailed code examples
- Extended recommendations
- Reference material

**Inline note when history file created:**
```
📄 Detailed report: history/peer-reviews/2026-01-02-feature-branch.md
```

---

## Quick Reference

**On feature branch/worktree:**
```
/peer-review
```
→ Auto-detects scope as all work since diverging from main

**On main with recent work:**
```
/peer-review
```
→ Checks conversation context for beads/commits discussed, asks if unclear

**Specific epic:**
```
/peer-review --epic redshifted-abc1
```
→ Reviews epic + all discovered issues

**Custom range:**
```
/peer-review --commits HEAD~5..HEAD
```
→ Reviews specific commit range

**Skip bead creation (rare):**
```
/peer-review --skip-beads
```
→ Review only, no tracking (for exploratory reviews)

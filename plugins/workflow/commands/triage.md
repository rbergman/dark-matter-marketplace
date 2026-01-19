---
description: Triage PR review comments - accept to create beads, reject with optional reply
argument-hint: "--pr <number>"
---

# Triage PR Review Comments

Pull review comments from a GitHub PR, triage (accept/reject), and create beads for accepted items. Counterpart to `/dm-work:review --pr` which *gives* reviews.

## Arguments

```
$ARGUMENTS
```

| Flag | Description | Default |
|------|-------------|---------|
| `--pr <number>` | Specify PR to triage | auto-detect from branch |

---

## Phase 1: Resolve PR

**Auto-detect from current branch:**

```bash
PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null)
```

**Or use explicit `--pr N`** from arguments.

**If no PR found:** Fail with "No PR found for current branch. Use --pr <number> to specify."

---

## Phase 2: Branch Check

```bash
# Check for dirty workspace
if ! git diff --quiet || ! git diff --cached --quiet; then
  FAIL: "Workspace dirty. Stash or commit changes first."
fi

# Get PR branch
PR_BRANCH=$(gh pr view $PR_NUMBER --json headRefName -q '.headRefName')
CURRENT_BRANCH=$(git branch --show-current)
```

**If not on PR branch:** Use AskUserQuestion:
- "Checkout PR branch" - Run `gh pr checkout $PR_NUMBER`
- "Continue from current branch" - Proceed (user knows what they're doing)
- "Cancel" - Abort

---

## Phase 3: Fetch Comments

```bash
# Get repo info
OWNER_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')

# Get PR title
PR_TITLE=$(gh pr view $PR_NUMBER --json title -q '.title')

# Fetch all review comments
gh api repos/$OWNER_REPO/pulls/$PR_NUMBER/comments
```

**Filter for unresolved comments:**
- Exclude comments that are replies (`in_reply_to_id != null`)
- Exclude resolved threads (check via review threads API if needed)

**Parse each comment for:**
- `id` - Comment ID for replies
- `user.login` - Reviewer username
- `path` - File path
- `line` or `original_line` - Line number
- `body` - Comment text
- Inferred severity (parse `**critical**`, `**high**`, etc. from body)

---

## Phase 4: Display & Triage

**Display summary:**

````markdown
## PR #$PR_NUMBER: $PR_TITLE ($TOTAL comments, $UNRESOLVED unresolved)

| # | Reviewer | File | Severity | Summary |
|---|----------|------|----------|---------|
| 1 | @alice | auth/login.go:45 | high | Missing error check on token validation |
| 2 | @alice | auth/login.go:78 | medium | Consider rate limiting here |
| 3 | @bob | db/user.go:23 | low | Naming: userRecord → user |
...

**Accepting all $UNRESOLVED comments by default.**
````

**If no unresolved comments:** Report "No unresolved comments to triage." and exit.

**AskUserQuestion - select comments to reject:**

Prioritize low-value comments as rejection candidates:
1. Low severity
2. Style/naming suggestions (detect keywords: "naming", "style", "consider", "might")
3. If many comments, show up to 4 most likely rejects

```
Which comments to reject? (All others will become beads)

○ #3 - @bob: Naming: userRecord → user [low]
○ #7 - @alice: Add comment explaining this logic [low]
○ #9 - @bob: Consider using constants [low]
○ None - accept all
```

Use `multiSelect: true` to allow rejecting multiple.

---

## Phase 5: Handle Rejections

**For each rejected comment, prompt for reply:**

```
Reply to @bob about rejecting "#3 - Naming: userRecord → user"?

○ "Intentional - matches domain terminology" (Recommended)
○ "Out of scope for this PR"
○ "Will address in follow-up"
○ No reply
```

User can also select "Other" for custom reply.

**Canned response selection logic:**
- Naming/style comments → "Intentional - matches domain terminology"
- Scope suggestions → "Out of scope for this PR"
- Default → "Will address in follow-up"

**Post reply if not "No reply":**

```bash
gh api repos/$OWNER_REPO/pulls/$PR_NUMBER/comments/$COMMENT_ID/replies \
  --method POST \
  -f body="$REPLY_TEXT"
```

---

## Phase 6: Create Beads

**For each accepted comment:**

```bash
# Infer severity from comment body
# Look for patterns: **critical**, **high**, **medium**, **low**
# Or [Severity] prefix from /dm-work:review format
# Default to medium (P2) if not found

# Infer type
# bug/security keywords → bug
# else → task

bd create \
  --title="[$SEVERITY] $SUMMARY" \
  --description="From PR #$PR_NUMBER review by @$REVIEWER

> $FILE:$LINE
> $COMMENT_BODY

$COMMENT_URL" \
  --type=$TYPE \
  --priority=$PRIORITY \
  --external-ref="gh-pr-$PR_NUMBER-r$COMMENT_ID" \
  --json
```

**Priority mapping:**

| Severity | Priority |
|----------|----------|
| critical | 0 |
| high | 1 |
| medium | 2 |
| low | 3 |
| (none) | 2 |

**Track created bead IDs for summary.**

---

## Phase 7: Summary

````markdown
## Triage Complete: PR #$PR_NUMBER

**Accepted:** $ACCEPTED_COUNT comments → $BEAD_COUNT beads created
**Rejected:** $REJECTED_COUNT comments ($REPLIED_COUNT replies posted)

| Bead ID | Priority | Summary |
|---------|----------|---------|
| abc-123 | P1 | Missing error check on token validation |
| def-456 | P2 | Consider rate limiting |
| ghi-789 | P2 | SQL injection risk |
...

**Rejected:**
- #3 @bob: Naming suggestion → "Intentional - matches domain terminology"
- #7 @alice: Add comment → (no reply)

Run `bd ready` to see work queue.
````

---

## Quick Reference

```bash
# Triage current branch's PR
/dm-work:triage

# Triage specific PR
/dm-work:triage --pr 123
```

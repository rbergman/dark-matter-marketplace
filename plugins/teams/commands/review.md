---
description: Run collaborative team-based code review where reviewers discuss and challenge each other's findings
argument-hint: "--pr <number>, --commits <range>, --only <acs>, --min-severity <level>, --skip-beads"
---

# /review

Run collaborative team-based code review where reviewers discuss and challenge each other's findings.

Arguments: $ARGUMENTS

## Command behavior

1. **Scope detection**: Same as dm-work:review Phase 1 (PR mode, review tags, feature branch, explicit commits).

2. **Scout**: Same as dm-work:review Phase 2 — haiku Explore subagent for fast categorization.

3. **Create review team**: Spawn Agent Team with reviewers based on --only filter (default: all three). Include in spawn prompts:
   - Commit range and changed files (scoped to their domain)
   - Scout findings (project type, patterns, hotspots)
   - Their review checklist (same checklists as dm-work:review)
   - Domain-specific skills to activate
   - Instruction: "After initial review, share findings with teammates and discuss"

4. **Monitor debate**: Lead watches for:
   - Reviewers sharing findings (good)
   - Cross-examination happening (good)
   - Convergence (time to synthesize)
   - Stalemate (intervene to resolve)

5. **Synthesize**: Merge findings, resolve conflicts, produce unified assessment.

6. **Output**: Same as dm-work:review Phase 5 (local mode with beads, or PR mode with GitHub comments), plus Review Discussion Notes section.

7. **Tag checkpoint**: Move review tag to HEAD (same as dm-work:review).

8. **Cleanup team**.

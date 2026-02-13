---
name: brainstorming
description: Use when the user wants to explore approaches or discuss design before implementation. Explores intent, requirements, and design through collaborative dialogue.
---

# Brainstorming Ideas Into Designs

Turn ideas into fully formed designs through natural collaborative dialogue.

**Process:** Understand context → Ask questions one at a time → Explore approaches → Present design incrementally → Validate each section.

---

## Phase 1: Understanding

### Check Project Context

Before asking questions:
- Review relevant files, docs, recent commits
- Understand existing patterns and constraints
- Note what's already built that relates

### Ask Questions

**Rules:**
- One question per message
- Prefer multiple choice when possible
- Open-ended when exploration needed
- Break complex topics into multiple questions

**Focus on:**
- Purpose: What problem does this solve?
- Constraints: What must it work with?
- Success criteria: How do we know it's done?

---

## Phase 2: Exploring Approaches

Once you understand the goal:

1. Propose 2-3 different approaches
2. Include trade-offs for each
3. Lead with your recommendation and why
4. Let user choose or refine

**Example:**
```
I see three approaches:

1. **Component-based** (recommended) - Fits your existing pattern,
   easiest to test, but more files.

2. **Inline** - Fewer files, but harder to reuse and test.

3. **Hook-based** - Most flexible, but adds complexity you may not need.

I'd go with #1 because [reasoning]. Thoughts?
```

---

## Phase 3: Presenting Design

Once approach is chosen:

1. Present in sections (200-300 words each)
2. After each section: "Does this look right so far?"
3. Be ready to revise if something doesn't fit

**Cover:**
- Architecture / component structure
- Data flow
- Error handling
- Testing approach
- Edge cases

---

## Phase 4: After Design

### Document

Write validated design to:
```
docs/plans/YYYY-MM-DD-<topic>-design.md
```

Commit to git.

### Implementation (if continuing)

Ask: "Ready to set up for implementation?"

Then:
1. Use `dm-work:worktrees` to create isolated workspace
2. Create beads for implementation tasks
3. Use `dm-work:orchestrator` patterns for delegation

---

## Key Principles

| Principle | Why |
|-----------|-----|
| One question at a time | Don't overwhelm |
| Multiple choice preferred | Easier to answer |
| YAGNI ruthlessly | Remove unnecessary features |
| Explore alternatives | Always 2-3 approaches before settling |
| Incremental validation | Present design in sections |
| Be flexible | Go back when something doesn't fit |

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Jump to implementation | Understand first, design second |
| Ask 5 questions at once | One question per message |
| Present monolithic design | Break into 200-300 word sections |
| Skip trade-off discussion | Always propose 2-3 approaches |
| Assume you understand | Validate understanding with user |

---

## Quick Reference

```
1. Check project context (files, docs, commits)
2. Ask questions one at a time (prefer multiple choice)
3. Propose 2-3 approaches with trade-offs
4. Present design in sections, validate each
5. Write to docs/plans/YYYY-MM-DD-<topic>-design.md
6. If implementing: worktree → beads → orchestrate
```

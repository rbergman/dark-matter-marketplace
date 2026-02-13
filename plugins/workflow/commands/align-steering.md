---
description: Review and align steering files (CLAUDE.md, AGENTS.md) with Claude Opus 4.6 prompting best practices
argument-hint: "[file paths]"
---

# Align Steering Files

Review steering files for alignment with Claude Opus 4.6 prompting best practices, then apply fixes.

## Arguments

If file paths are provided, review those files. Otherwise, find and review the standard steering artifacts:
- `CLAUDE.md` (project root)
- `AGENTS.md` (project root)
- `.claude/CLAUDE.md` (if present)

## Checklist

Apply each check to every steering file. For each issue found, edit the file directly.

### 1. Soften aggressive triggers

Opus 4.6 follows instructions more precisely than older models. Aggressive language that compensated for undertriggering now causes overtriggering.

| Find | Replace with |
|------|-------------|
| `CRITICAL`, `CRITICAL:`, `**CRITICAL**` | Remove or state plainly |
| `MUST`, `ALWAYS`, `NEVER` (in caps) | Lowercase equivalents with motivation |
| `BLOCKING REQUIREMENT` | Remove — just state the requirement |
| `MANDATORY`, `NON-NEGOTIABLE` | "Required" or just state it |
| `DO NOT` / `NEVER` without motivation | Add why: "Do not X because Y" |

**Key principle:** Where you would have said "CRITICAL: You MUST do X", say "Do X" or "Do X because Y". Claude follows either, but the aggressive version causes overtriggering on edge cases.

### 2. Add motivation to constraints

Instructions with "why" are followed more precisely than bare commands. Claude generalizes from explanations.

**Before:** `NEVER use ellipses`
**After:** `Avoid ellipses — they render poorly in text-to-speech output.`

For each constraint that lacks motivation, add a brief reason. If the reason is obvious, the constraint can stay bare.

### 3. Remove anti-laziness prompting

Opus 4.6 is proactive by default. Instructions that pushed older models to be thorough will cause over-exploration.

Remove or soften:
- "If in doubt, use [tool]" — causes overtriggering
- "Default to using [tool]" — replace with "Use [tool] when..."
- "Be thorough" / "Be comprehensive" — remove unless you genuinely want exhaustive output
- "Make sure to check..." / "Don't forget to..." — remove if it describes default behavior
- Anti-laziness affirmation checklists ("I will not skip steps...")

### 4. Remove redundancy with native behavior

Opus 4.6 does these natively. Instructions about them add context cost without benefit:

- Parallel tool calls (native — remove unless tuning aggression level)
- Concise communication style (native — remove unless asking for MORE detail)
- Reading files before editing (native — remove)
- Using available tools (native — remove "Use your tools" type instructions)

### 5. Tell what to do, not what not to do

Negative instructions are harder to follow precisely. Reframe as positive guidance.

**Before:** "Do not use markdown in your response"
**After:** "Write in flowing prose paragraphs."

**Before:** "Do not create unnecessary files"
**After:** "Prefer editing existing files over creating new ones."

### 6. Check overeagerness prevention

Ensure the file includes minimal-change principles if the project does implementation work. If missing, consider adding:

```
Keep changes minimal and focused. Only modify what was requested or is clearly necessary. Don't add features, refactor surrounding code, or introduce abstractions beyond what the task requires.
```

Skip this if the file is purely informational (project structure docs, etc.).

### 7. Check autonomy/safety balance

If the file governs agent behavior, ensure it distinguishes:
- **Local, reversible actions** (editing files, running tests) — proceed freely
- **Shared/destructive actions** (pushing, deleting branches, posting comments) — confirm first

If this distinction is missing and the project has agents doing implementation work, add it.

### 8. Match style to desired output

If the steering file uses heavy markdown formatting (bold everywhere, tables for simple lists, nested bullet points), the agent's output will mirror that style. Simplify the file's own formatting to match the communication style you want.

## Output

After applying all edits, summarize:
- Number of issues found and fixed per category
- Any items you chose not to change and why
- Remaining concerns that need human judgment

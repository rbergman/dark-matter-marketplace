---
description: Align this repo's AGENTS.md with the dm-work reference template — diff and merge, never replace
argument-hint: "[optional: path to AGENTS.md if not at repo root]"
---

# Align AGENTS.md with the dm-work reference template

The canonical reference is `${CLAUDE_PLUGIN_ROOT}/skills/repo-init/references/AGENTS.md` (the dm-work plugin's repo-init template). **That's the alignment target, not a drop-in replacement.** This repo has its own history, conventions, settled decisions, and project-specific content that must be preserved.

Target file: $ARGUMENTS (or `./AGENTS.md` if no arg)

## Steps

### 1. Read both files first

- Current state: target AGENTS.md (and `./CLAUDE.md` if it's not a symlink to AGENTS.md)
- Reference target: the dm-work plugin's `repo-init/references/AGENTS.md`
- Don't edit anything yet.

### 2. Build a diff plan

Identify:

- **Missing concepts** — sections/content in the reference that don't exist here at all (Gall's Law framing, SWE Practices, pause-for-review cadence, etc.)
- **Stale or outdated wording** — places where this repo's wording predates current guidance (e.g. old beads sync model, references to deleted commands like `/rotate` or `/compress`, "Use PROACTIVELY" patterns, Opus 4.6 references)
- **Conflicts** — places where this repo's content disagrees with the reference. These need a *judgment call*, not a silent overwrite. Flag them.
- **Project-specific content to preserve** — Settled Decisions, project description, domain-specific conventions, language/framework specifics, anything referencing this repo's actual code. The reference template won't know about these.

### 3. Show the plan before editing

Format:

```
ADDITIONS  (new sections / content to add):       ...
UPDATES    (existing content to modernize, diff): ...
CONFLICTS  (need user decision):                  ...
PRESERVED  (project-specific, leaving alone):     ...
```

Wait for user approval before applying.

### 4. Apply the approved changes

- Preserve the file's existing structure where possible — don't reorder sections just because the reference orders them differently
- Keep this repo's voice and project-specific details intact
- Don't introduce content that contradicts Settled Decisions
- If a Settled Decision row needs revisiting, surface it as a CONFLICT — never modify silently

### 5. Verify symlink and structure

- `readlink CLAUDE.md` should print `AGENTS.md`, OR `CLAUDE.md` should contain the stub `See @AGENTS.md`
- `test -e CLAUDE.md` should succeed (no dangling symlink)
- If neither pattern is in place, propose adding one before editing AGENTS.md content

### 6. Don't touch what tools own

If `bd setup claude` injected a beads section, or `timbers onboard` injected a timbers section, leave those alone — they're maintained by those tools. The reference template intentionally defers to those injections; don't reintroduce content the tools own.

### 7. Don't commit yet

Show the result. The user reviews and commits.

## Constraints

- No wholesale replacement. Diff and merge, don't overwrite.
- Conflicts get surfaced, not silently resolved. The repo's content wins by default; flag if you believe the reference is clearly correct.
- Settled Decisions are sacred — never modify those rows without explicit approval.
- If the repo lacks a Settled Decisions section but has clear long-standing conventions visible in code or commit history, suggest promoting them to a Settled Decisions block rather than rewriting them.

## Related

- **`/dm-work:align-steering`** — Modernizes *prompting style* (CRITICAL/MUST/PROACTIVELY scrubbing, native-feature redundancy, reasoning-backed instructions). Run after `/dm-work:align-agents` on the same file to clean up wording. They compose: align-agents fixes *content*; align-steering fixes *style*.
- **`dm-work:repo-init`** — The skill that provides the reference template; use for fresh repo setup rather than alignment of existing ones.

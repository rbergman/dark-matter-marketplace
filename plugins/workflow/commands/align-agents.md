---
description: Align this repo's AGENTS.md with the dm-work reference template — diff and merge, never replace
argument-hint: "[optional: path to AGENTS.md if not at repo root]"
---

# Align AGENTS.md with the dm-work reference template

The canonical reference is `${CLAUDE_PLUGIN_ROOT}/skills/repo-init/references/AGENTS.md` (the dm-work plugin's repo-init template). **That's the alignment target, not a drop-in replacement.** This repo has its own history, conventions, settled decisions, and project-specific content that must be preserved.

Target file: $ARGUMENTS (or `./AGENTS.md` if no arg)

> **If this command was loaded from an older session:** consider running `/reload-plugins` before proceeding so you pick up the latest version of this command. The guidance below evolves; stale loads produce stale advice.

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

**Note on Skills Available / proactive-skill-selection lists:** the reference template doesn't include one, but **don't strip an existing list** if the repo has one. They're a load-bearing orchestrator delegation cheatsheet — they tell Claude which skills apply to which work without forcing skill-description re-reads each time. Keep as-is unless the list is stale (references deleted skills like `dm-work:tdd`, `dm-work:dialectical-refinement`, or `dm-tool:*` — those should be removed). If the list is missing, don't add one mechanically; ask the user whether the repo would benefit from one.

**Note on shared repos and the global-CLAUDE.md dedup rule:** the reference template suggests dropping content already covered by `~/.claude/CLAUDE.md` (Prime Directive, Quality Gates, Role). That dedup is correct for *solo* repos, but **AGENTS.md is checked in and read by other contributors who don't share the user's global config**. For shared repos, keep concise versions of those foundational sections (especially Gall's Law / Prime Directive) at the repo level — terser than the reference, but present. Ask the user up front: "Is this repo shared with other contributors?" If yes, keep concise foundational sections. If solo, dedup against global is fine.

**Note on beads `bd dolt push/pull` references in injected blocks — leave them alone.** As of beads 1.0.3 (fix #3194), `bd dolt push` and `bd dolt pull` are safe to run on every setup. When a Dolt remote is configured they sync against it; when no remote is configured (the typical embedded+git case) they exit 0 with an informational message rather than erroring. The commands are not mode-specific.

This means:
- **Don't add an override paragraph above the BEADS INTEGRATION block.** Earlier guidance in this command suggested doing so for embedded+git repos. That guidance was wrong — the injection is correct on every setup.
- **Don't treat `bd dolt push` references in injected blocks as bugs, contradictions, or stale.** They're intentional safe-to-call instructions.
- **If a global `~/.claude/CLAUDE.md` says "DO NOT use bd dolt push/pull,"** that line predates fix #3194 and is now stale. Surface it as a CONFLICT — the user should update or remove that global directive. Don't propagate the prohibition into the repo file.
- **If a repo's AGENTS.md already has an override paragraph from earlier alignment runs**, flag it for removal — it's noise now, not protection.

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

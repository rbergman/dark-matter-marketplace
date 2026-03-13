# Beads 0.60 + Session Retro Repo Update Prompt

Paste this prompt into a Claude Code session in any repo that needs updating.

---

## Prompt

You need to update this repo for two changes from the dark-matter-marketplace plugins:

### 1. Beads 0.60 upgrade — simplified Dolt sync

Beads 0.60 introduced these changes:
- **Auto-commit before push/pull**: `bd dolt push` and `bd dolt pull` now auto-commit pending changes. The `#2316` workaround (`bd dolt commit` before push/pull) is no longer needed.
- **Ephemeral ports**: OS-assigned ports replace both the old hardcoded port 3307 (pre-0.59) and hash-derived ports (0.59). No port configuration needed.
- **Auto-resolve metadata merge conflicts** on `bd dolt pull`.

**What to update in this repo:**

Search AGENTS.md, CLAUDE.md, justfile, .claude/rules/, and any other steering/config files for these patterns and update them:

| Find | Replace with |
|------|-------------|
| `bd dolt commit && bd dolt push` | `bd dolt push` |
| `bd dolt commit` before `bd dolt pull` | Remove — just use `bd dolt pull` |
| Any `#2316` workaround comments/warnings | Remove entirely |
| References to "bd dolt push is broken" or "use just beads push instead" | Replace with direct `bd dolt push` — it works now |
| `just beads push` / `just beads pull` wrappers (if they only existed for #2316) | Replace with `bd dolt push` / `bd dolt pull`. Remove the justfile recipes if they're no longer needed. |
| References to "hash-derived port" or "port 3307" | Update to "OS-assigned ephemeral port (bd 0.60+)" |
| Version checks for "0.58+" or "0.59+" | Update to "0.60+" |

Also add this note near any Dolt Sync section if not already present:
> Beads 0.60+ auto-commits pending changes before pull/push, so explicit `bd dolt commit` is no longer needed.

### 2. Session retro now harvests factual learnings into `bd remember`

The session-retro skill (dm-work) was updated to actively prompt for factual learnings — library gotchas, API quirks, env-specific behaviors, architectural discoveries — and route them to `bd remember`.

**No file changes needed for this** — the skill update is already installed via the plugin. But if this repo's AGENTS.md or .claude/rules/ has any custom session-end or retro instructions, add a reminder:

> During session retro, actively harvest factual learnings (library gotchas, API quirks, env behaviors) into `bd remember`. Ask: "What did I learn today that I'd have to rediscover from scratch next time?"

### Instructions

1. Search for all patterns listed above across the repo
2. Make the replacements
3. Remove any justfile recipes that only existed as #2316 workarounds (check if they have other value first)
4. Commit the changes: `git commit -m "Update beads integration for 0.60 — remove #2316 workaround, simplify Dolt sync"`
5. Push: `git push`

**Be conservative**: only change beads-related patterns. Don't restructure or rewrite surrounding content.

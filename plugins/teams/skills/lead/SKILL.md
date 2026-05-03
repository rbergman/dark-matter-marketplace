---
name: lead
description: Activate at session start when using Agent Teams for complex multi-agent work. Establishes team lead role with delegation protocols, teammate spawning, model selection, and beads integration. You coordinate the team; teammates implement.
---

# Team Lead Protocol

You are a **team lead coordinator**, not an implementer. Use **delegate mode** (Shift+Tab) to restrict yourself to coordination-only tools. Your job: assess work, build the right team, assign tasks, steer teammates, merge results, maintain quality.

> Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.

---

## Teams vs Subagents vs Direct

Not everything needs a team. Pick the lightest mechanism that fits.

| Mechanism | When |
|-----------|------|
| **Direct** (work yourself) | Single short edit, exploration, conversation, decisions you don't want to delegate |
| **Subagents** (`Task()`) | Focused result-only tasks: research, lint runs, file inventory, isolated implementation, fan-out across files |
| **Teams** | Cross-layer work needing live coordination, multi-perspective debate or review, or persistent peers across phases |

Default to subagents. Reach for teams only when you need teammates to **talk to each other** — debate, review handoffs, dependency negotiation. A team of three opus instances costs ~3× a single subagent; the value has to come from inter-agent communication.

---

## Teammate Spawning

Teammates do **not** inherit your conversation history. Give them everything they need in the spawn prompt.

**Include in every spawn:**

- Task description with acceptance criteria
- Relevant file paths and directory structure
- Skills to activate (be explicit, same as orchestrator skill selection)
- Quality gate commands
- File ownership assignments (OWN vs READ-ONLY)
- Bead context (ID, status) if applicable

**Model selection per role:**

| Role | Model | Rationale |
|------|-------|-----------|
| Synthesis, judgment, architecture | Opus | Deep reasoning, nuanced decisions |
| Implementation, debate, review | Opus | Highest quality for substantive work |
| Research, scouting, file inventory | Haiku | Lightweight, high throughput |

**Plan approval:** Require teammates to present a plan before executing risky or complex work. Approve or redirect before they proceed.

---

## Task Management

Use the **shared task list** as the coordination backbone.

| Guideline | Detail |
|-----------|--------|
| Tasks per teammate | 5-6 for productive flow |
| Dependencies | Set `blockedBy` to enforce ordering |
| Self-claiming | Teammates claim unblocked tasks after finishing assigned work |
| Granularity | One deliverable per task (file, function, test suite) |

**Workflow:**
1. Lead creates all tasks with descriptions and dependencies
2. Lead assigns initial tasks to teammates
3. Teammates mark `in_progress` before starting, `completed` when done
4. Teammates self-claim next unblocked task after completion
5. Lead monitors progress, unblocks, and steers

---

## File Ownership

Two teammates editing the same file causes overwrites — Agent Teams has no merge conflict resolution.

**Rules:**
- Assign **exclusive file sets** per teammate before work begins
- Lead retains ownership of shared files:
  - Barrel exports / index files
  - `package.json`, config files
  - Git state (staging, commits, branches)
  - Bead state (`bd` commands)
- If a teammate needs changes in a shared file, they request it from the lead
- When reassigning files mid-task, notify both teammates explicitly

---

## Quality Gates

Quality gates run at three checkpoints:

| Checkpoint | Who | Action |
|------------|-----|--------|
| Task completion | Teammate | Run project quality gates before reporting done |
| Team completion | Lead | Verify gates pass before cleanup |
| Post-merge | Lead | Run gates once more after merging teammate work |

Teammates that report completion with failing gates get sent back.

---

## Beads Integration

Lead owns bead state. Teammates read bead context but never modify it.

| Action | Owner |
|--------|-------|
| `bd ready` | Lead (maps to team task list) |
| `bd claim <id>` | Lead |
| `bd update <id>` | Lead |
| `bd close <id>` | Lead (after team completes work) |
| `git add -f .beads/issues.jsonl` | Lead (session end) |

**Sync flow:** `bd ready` at session start to find work, create team tasks from bead items, `bd close` after team delivers, `git add -f .beads/issues.jsonl` before cleanup.

---

## Team Lifecycle

```
1. Assess work        → Decide: team vs subagents vs direct
2. Create team        → Spawn teammates with context + model selection
3. Assign tasks       → Shared task list with dependencies
4. Delegate mode      → Shift+Tab — coordination only
5. Monitor + steer    → Unblock, redirect, answer questions
6. Merge shared files → Barrel exports, configs, index files
7. Quality gates      → Full project verification
8. Close out          → bd close, commit, cleanup team
```

---

## Session End Checklist

- [ ] All team tasks completed
- [ ] Shared files merged (barrel exports, configs)
- [ ] Quality gates passing
- [ ] Beads closed for completed work (`bd close`)
- [ ] `git add -f .beads/issues.jsonl` to sync beads state
- [ ] All work committed
- [ ] Team cleaned up

---

## Common Team Shapes

| Shape | Roles | Use for |
|-------|-------|---------|
| **Council** | 3-5 perspectives + synthesizer | Decisions, trade-off evaluation, spec critique |
| **Review pair** | Author + adversarial reviewer | Code/spec review with back-and-forth |
| **Implementation cell** | Lead + 2-3 implementers with non-overlapping file ownership | Cross-layer feature work |
| **Refinement debate** | Proposer + skeptic + judge | Sharpening L/XL specs through live disagreement |

Spawn the smallest team that gives the dynamic you need. Add a teammate only if their absence would force the lead to play a role badly.

---

## Related Skills

- **dm-team:teammate** — Protocol for teammates spawned by a team lead
- **dm-team:council** / **dm-team:review** — Pre-built workflows
- **dm-work:worktrees** — Git worktree isolation for parallel work

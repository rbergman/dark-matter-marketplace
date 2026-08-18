---
name: lead
description: Use when coordinating an Agent Teams session — you are the lead and teammates do the implementing. Covers deciding whether the work warrants a team at all, spawning teammates with enough context, reusing subagent definitions as teammate roles, requiring plan approval before risky work, assigning and sequencing the shared task list, file-ownership boundaries that prevent overwrites, quality gates, beads ownership, and the limitations that bite (no nested teams, no resumption of in-process teammates, one team per session). Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1; without it, named spawns are ordinary subagents and this protocol does not apply.
---

# Team Lead Protocol

You are a **coordinator**, not an implementer. Assess the work, build the right team, assign tasks, steer, merge results, hold the quality line.

> Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. There is no separate setup step — the `TeamCreate` and `TeamDelete` tools were removed in v2.1.178. You spawn teammates directly, and the team's directories are cleaned up automatically when the session exits.

---

## Teams vs Subagents vs Direct

Pick the lightest mechanism that fits.

| Mechanism | When |
|-----------|------|
| **Direct** (work yourself) | Single short edit, exploration, conversation, decisions you don't want to delegate |
| **Subagents** | Focused result-only tasks: research, lint runs, file inventory, isolated implementation, fan-out across files |
| **Teams** | Cross-layer work needing live coordination, multi-perspective debate, or persistent peers across phases |

Default to subagents. Reach for teams only when teammates need to **talk to each other**. Three teammates cost roughly 3× a single subagent, and the value has to come from inter-agent communication — not from parallelism, which subagents already give you.

**The distinction is now mechanical, not stylistic:** with teams enabled, any subagent you give a `name` launches as a teammate. Naming is the switch. That also means teams can form when you didn't intend one — if you want a result reported back to you, spawn it unnamed.

---

## Spawning Teammates

Teammates do **not** inherit your conversation history. They load CLAUDE.md, skills and MCP servers like any session; everything else goes in the spawn prompt.

**Include in every spawn:**

- Task description with acceptance criteria
- Relevant file paths and directory structure
- Skills to activate, named explicitly
- Quality gate commands
- File ownership: which files they OWN, which are READ-ONLY
- Bead context (ID, status) if applicable
- **How to report** — see the trap below

> **The idle-notification trap:** when a teammate finishes, the lead gets an idle notification that does **not** contain the teammate's output. A flow that waits for results will hang. Every spawn prompt must instruct the teammate to message you its findings, or to write them to the shared task list.

**Model selection:** teammates run on your model unless the spawn prompt names one or `CLAUDE_CODE_SUBAGENT_MODEL` is set. (`teammateDefaultModel` was removed in v2.1.234 and a leftover value is ignored.) Teammates inherit your effort level; their model and fast-mode are fixed at spawn, so `/model` later only affects you.

Use opus for synthesis, judgment, architecture, and substantive implementation. Haiku is fine for scouting and file inventory — but a scout is usually better as an unnamed subagent than a teammate.

**Reuse roles via subagent definitions.** Reference any subagent type — project, user, plugin, or CLI-defined — when spawning:

```
Spawn a teammate using the code-reviewer agent type to audit src/auth/.
```

The teammate honors that definition's `tools` allowlist and `model`, and its body is appended to the system prompt. **Caveat:** the `skills` and `mcpServers` frontmatter fields are *not* applied to teammates — they load skills from project and user settings like a normal session. If a role depends on a specific skill, name it in the spawn prompt.

**Require plan approval** for risky or complex work. The teammate stays in read-only plan mode until you approve:

```
Spawn an architect teammate to refactor auth. Require plan approval before any changes.
```

You approve or reject autonomously, without prompting the human. Rejected teammates revise and resubmit. Give yourself criteria up front — "only approve plans that include test coverage" — or you'll rubber-stamp.

---

## Task Management

The **shared task list** is the coordination backbone. Tasks are pending, in progress, or completed, and can depend on each other; a pending task with unresolved dependencies can't be claimed. Completing a task unblocks its dependents automatically.

| Guideline | Detail |
|-----------|--------|
| Tasks per teammate | 5-6 keeps everyone productive and lets you reassign |
| Dependencies | Set them to enforce ordering |
| Self-claiming | Teammates claim unblocked tasks after finishing assigned work; claiming uses file locking, so races are safe |
| Granularity | One deliverable per task (file, function, test suite) |

Task status can lag — teammates sometimes finish work without marking it complete, which blocks dependents. If a task looks stuck, verify the work and update the status yourself.

---

## File Ownership

Two teammates editing one file means overwrites. There is no merge resolution.

- Assign **exclusive file sets** before work begins
- You retain: barrel exports and index files, `package.json` and configs, git state, bead state
- A teammate needing a shared file requests it from you
- Reassigning files mid-flight requires telling **both** teammates

---

## Quality Gates

| Checkpoint | Who | Action |
|------------|-----|--------|
| Task completion | Teammate | Run gates before reporting done |
| Team completion | Lead | Verify gates pass before wrapping up |
| Post-merge | Lead | Run gates again after merging teammate work |

Teammates reporting completion with failing gates get sent back.

Enforce this mechanically rather than by trust — hooks fire on team events and exit code 2 sends feedback instead of allowing the transition:

| Hook | Fires | Exit 2 |
|------|-------|--------|
| `TeammateIdle` | A teammate is about to go idle | Keeps it working, with feedback |
| `TaskCreated` | A task is being created | Blocks creation |
| `TaskCompleted` | A task is being marked complete | Blocks completion |

---

## Beads Integration

You own bead state. Teammates read bead context and never modify it.

| Action | Owner |
|--------|-------|
| `bd ready` / `bd show` | Lead |
| `bd update --claim` | Lead |
| `bd close` | Lead, after the team delivers |
| `bd dolt push` | Lead, at session end |

Check the repo's sync mode before assuming: `bd dolt remote list` (a remote means canonical mode — push `refs/dolt/data`). Legacy JSONL-in-git repos auto-flush on commit instead.

---

## Permissions

Teammates start with your permission mode, including `--dangerously-skip-permissions` if you're running that way. You can change individual modes after spawning but not at spawn time. **Teammate permission prompts surface in your session** — pre-approve common operations before spawning or you'll spend the run answering prompts.

A message from one agent to another is treated as untrusted input: a teammate can't approve a prompt on your behalf, and a denied teammate can't route around it by asking a peer.

---

## Lifecycle

```
1. Assess        → team vs subagents vs direct
2. Spawn         → context, file ownership, model, reporting instruction
3. Assign        → shared task list with dependencies
4. Monitor       → unblock, redirect, answer questions
5. Merge         → shared files: barrel exports, configs
6. Gate          → full project verification
7. Close out     → bd close, commit, push
```

Shutdown: ask a teammate by name to shut down. It can approve, or reject with a reason if mid-task. Shutdown is slow — teammates finish the current tool call first. Team directories clean themselves up on session exit; the task list persists for resumed sessions.

---

## Limitations That Bite

- **In-process teammates don't survive `/resume` or `/rewind`.** After resuming, you may try to message teammates that no longer exist. Spawn fresh ones.
- **No nested teams.** Teammates cannot spawn teammates. Only you manage the team.
- **One team per session**, scoped to that session. No named teams, no sharing across sessions.
- **You are the lead permanently.** No promoting a teammate, no transferring leadership.
- **In-process teammates can't run background subagents** — their subagents run in the foreground, because a teammate's background work can't outlive your process.
- **Split panes need tmux or iTerm2** (`teammateMode`; default is `in-process`, which works anywhere). Not supported in VS Code's integrated terminal, Windows Terminal, or Ghostty.

---

## Common Team Shapes

| Shape | Roles | Use for |
|-------|-------|---------|
| **Council** | 3-5 opposed perspectives + synthesizer | Decisions, trade-off evaluation, spec critique — see **dm-work:council** |
| **Review pair** | Author + adversarial reviewer | Review with real back-and-forth |
| **Implementation cell** | Lead + 2-3 implementers, non-overlapping file ownership | Cross-layer feature work |
| **Competing hypotheses** | 3-5 investigators told to disprove each other | Debugging where the root cause is unclear and anchoring is the risk |

Spawn the smallest team that produces the dynamic you need. Add a teammate only if their absence would force you to play that role badly.

---

## Related

- **dm-team:teammate** — the other side of this protocol
- **dm-work:council** — deliberation workflow; runs as a team here, as subagents without teams

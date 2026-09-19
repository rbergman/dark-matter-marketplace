---
name: workflow-commands
description: Run a requested DM workflow command when the host does not expose Claude slash commands, including align-steering, align-agents, review, post-merge, merge, handoff, and triage. Use for those named workflows, not as an automatic ceremony on ordinary coding tasks.
---

# Workflow commands across hosts

The command files ship inside this plugin. In hosts such as Codex, read the
matching file below and follow it using the tools actually available. Load only
the requested workflow; pass the user's supplied arguments as its `$ARGUMENTS`.
In Claude, prefer the native command when exposed.

| Requested workflow | Instruction file |
|---|---|
| align-steering | [align-steering](../../commands/align-steering.md) |
| align-agents | [align-agents](../../commands/align-agents.md) |
| review | [review](../../commands/review.md) |
| post-merge | [post-merge](../../commands/post-merge.md) |
| merge | [merge](../../commands/merge.md) |
| handoff | [handoff](../../commands/handoff.md) |
| triage | [triage](../../commands/triage.md) |
| spec | [spec](../../commands/spec.md) |
| council | [council](../../commands/council.md) |

These files are the single source of workflow instructions. A textual command
reference is not an executable shell command or proof that the host provides
that tool. Follow a command's documented fallback where available; otherwise
identify the unavailable operation and continue only the supported independent
work. Preserve its review target, acceptance evidence, model policy, and existing
authorization. Routing to a command does not itself authorize an external action.

# Testing the dm-team Plugin

A practical guide for testing and iterating on the Agent Teams skills and commands.

---

## Prerequisites

1. **Enable Agent Teams:**
   ```json
   // ~/.claude/settings.json
   {
     "env": {
       "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
     }
   }
   ```

2. **Install the plugin:**
   ```bash
   claude plugin marketplace update dark-matter-marketplace
   claude plugin install dm-team@dark-matter-marketplace
   ```

3. **Choose display mode:**
   - **In-process** (default): all teammates in one terminal, Shift+Up/Down to navigate
   - **Split panes** (recommended for testing): requires tmux or iTerm2
   ```json
   { "teammateMode": "tmux" }
   ```

---

## Smoke Tests

Quick validation that each component works at all.

### team-lead + teammate
```
Start a session. Tell Claude to activate dm-team:team-lead.
Ask it to create a 2-person team to implement a simple feature (e.g., "add a hello-world endpoint").
Verify: team created, teammates spawned, tasks assigned, file ownership respected.
```

### council
```
/dm-team:council "Should we use REST or GraphQL for the new API?"
Verify: 3+ teammates spawned with different perspectives, debate occurs, synthesis produced.
```

### team-refine
```
Create a bead with a vague spec: bd create --title="Add caching to the API" --type=feature
/dm-team:refine <bead-id>
Verify: complexity assessed as l/xl, team spawned, debate occurs, refined spec produced.
```

### team-review
```
Make some changes on a feature branch.
/dm-team:review
Verify: scout runs, review team spawned, cross-examination occurs, unified assessment produced.
```

### team-brainstorm
```
Ask to brainstorm a feature: "I want to add real-time collaboration to the editor"
Verify: multiple perspectives spawn, parallel exploration, convergence to design.
```

---

## What to Look For

### Positive signals
- Teammates message each other (not just the lead)
- Debate produces insights a single reviewer wouldn't find
- File ownership is respected (no overwrites)
- Beads integration works (state updated correctly)
- Quality gates run and pass
- Team cleanup completes cleanly

### Red flags
- Lead starts implementing instead of delegating (should use delegate mode)
- Teammates idle without claiming tasks
- File conflicts between teammates
- Beads state modified by teammates (only lead should)
- Team not cleaned up after completion
- Excessive token usage for simple tasks (should have used subagents)

---

## Iteration Tips

1. **Start with council** — simplest to test (no file changes, just debate)
2. **Then team-review** — verifiable output, comparable to dm-work:review
3. **Then team-refine** — more complex, needs a real spec to refine
4. **Then team-brainstorm** — subjective output, harder to validate
5. **Test team-lead + teammate last** — these are activated by the other skills

### Comparing with dm-work equivalents

For review and refinement, run both the dm-work and dm-team versions on the same input:

```bash
# Subagent version
/dm-work:review --commits HEAD~3..HEAD

# Team version (in a different session)
/dm-team:review --commits HEAD~3..HEAD
```

Compare: Did team review find things subagent review missed? Did cross-examination add value?

---

## Known Limitations

From the Agent Teams docs (these affect all dm-team skills):

- **No session resumption** with in-process teammates
- **Task status can lag** — teammates may not mark tasks complete
- **Shutdown can be slow** — teammates finish current work first
- **One team per session** — clean up before starting a new team
- **No nested teams** — teammates can't spawn their own teams
- **Split panes need tmux/iTerm2** — in-process mode works everywhere
- **Higher token cost** — each teammate is a separate Claude instance

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Teammates not appearing | Check `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set |
| Too many permission prompts | Pre-approve common operations in permission settings |
| Teammates stopping on errors | Message them directly with Shift+Up/Down |
| Lead implementing instead of delegating | Press Shift+Tab for delegate mode |
| Orphaned tmux sessions | `tmux ls` then `tmux kill-session -t <name>` |

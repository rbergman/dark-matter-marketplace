# Autonomous Claude Runs with srt

Running Claude autonomously (with `--dangerously-skip-permissions`) requires careful safety controls. [Sandbox Runtime (srt)](https://github.com/anthropic-experimental/sandbox-runtime) provides OS-level sandboxing without containers.

---

## Why srt?

| Concern | How srt helps |
|---------|---------------|
| Filesystem damage | Default-deny writes, explicit allowlist |
| Data exfiltration | Default-deny network, explicit allowlist |
| Credential exposure | Block reads to `~/.ssh`, `~/.aws`, etc. |
| No containers needed | Uses macOS `sandbox-exec` / Linux `bubblewrap` |

---

## Quick Start

```bash
# Install
npm install -g @anthropic-ai/sandbox-runtime

# Run sandboxed Claude
srt -s .srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "Build and test the project"'
```

---

## Example Config

Project-specific `.srt.json`:

```json
{
  "network": {
    "allowedDomains": [
      "api.anthropic.com",
      "crates.io", "*.crates.io",
      "github.com", "*.github.com"
    ]
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.gnupg", "~/.aws/credentials"],
    "allowWrite": [".", "~/.cargo/registry", "/tmp"]
  }
}
```

---

## Stateless Flags

For autonomous runs, prevent Claude from writing session state:

| Flag | Purpose |
|------|---------|
| `--dangerously-skip-permissions` | No permission prompts (srt handles safety) |
| `--no-session-persistence` | Don't write to `~/.claude.json` |
| `--strict-mcp-config --mcp-config '{}'` | No MCP servers (avoids cache writes) |

---

## How the dm-work:srt Skill Helps

The `dm-work:srt` skill provides ready-to-use configuration for common scenarios. Instead of figuring out which domains and paths each ecosystem needs, invoke the skill and get working configs.

### What the Skill Provides

| Section | Content |
|---------|---------|
| Ecosystem allowlists | Pre-built network rules for Rust, Go, Node, Python |
| MCP integration | How to add Context7, Brightdata if needed |
| Justfile recipes | `ai-auto` pattern for project justfiles |
| Troubleshooting | Common EPERM errors and fixes |
| Debug mode | How to diagnose sandbox violations |

### When to Use the Skill

**Invoke `dm-work:srt` when:**
- Setting up a new project for autonomous runs
- Adding CI/CD Claude integration
- Troubleshooting sandbox permission errors
- Configuring network allowlists for a new ecosystem

**The skill auto-triggers for:**
- "sandboxed Claude" mentions
- "autonomous run" discussions
- CI/CD integration planning
- `--dangerously-skip-permissions` usage

### Example: Setting Up a Rust Project

1. Tell Claude: "I want to run autonomous Claude on this Rust project"
2. Claude invokes `dm-work:srt` automatically
3. Skill provides Rust-specific config:
   - Network: `crates.io`, `static.rust-lang.org`, `cloudfront.net`
   - Filesystem: `~/.cargo/registry`, `~/.cargo/git`
4. Create `.srt.json` with provided config
5. Add justfile recipe for convenience

---

## Use Cases

### 1. CI/CD Automation

Run Claude in GitHub Actions or other CI systems:

```yaml
- name: Claude Code Review
  run: |
    srt -s .srt.json -c 'claude --dangerously-skip-permissions \
      --no-session-persistence \
      --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
      -p "Review the changes in this PR and report any issues"'
```

### 2. DX Testing

Stress-test skills in isolated environments:

```bash
srt -s /tmp/dx-test.srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "Create a Rust CLI in /tmp/test-project following rust-pro patterns.
      Report any toolchain friction or missing patterns."'
```

### 3. Batch Processing

Process multiple repos without prompts:

```bash
for repo in project1 project2 project3; do
  cd "$repo"
  srt -s ../.srt.json -c 'claude --dangerously-skip-permissions \
    --no-session-persistence \
    --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
    -p "Update dependencies and run tests"'
  cd ..
done
```

### 4. Justfile Integration

Add to your project's justfile:

```just
# Interactive Claude session
ai:
    claude

# Autonomous Claude (sandboxed, no prompts)
ai-auto:
    srt -s .srt.json -c 'claude --dangerously-skip-permissions \
      --no-session-persistence \
      --strict-mcp-config --mcp-config "{\"mcpServers\":{}}"'
```

---

## Network Allowlist Strategy

**The GitHub question:** Many examples include `github.com`. Understand when you actually need it:

| Reason to allow GitHub | When needed |
|------------------------|-------------|
| Git-based dependencies | Cargo git deps, Go modules, npm git refs |
| Beads sync | `bd sync` pushes work state to remote |

| Reason to avoid GitHub | Consideration |
|------------------------|---------------|
| Exfiltration surface | Domain fronting risk |
| Often unnecessary | Pure registry deps don't need it |
| Context7 alternative | Better for docs lookup |

**Recommendation:** Start minimal. Add GitHub only if builds fail or you need beads sync.

## Limitations

| Limitation | Impact |
|------------|--------|
| Domain fronting | Broad allowlists (github.com) have exfiltration surface |
| Linux monitoring | No real-time violation alerts (macOS has notifications) |

### Context7 vs GitHub for Information

The context7 plugin is an MCP wrapper, so it needs:
- Network: `context7.com`, `*.context7.com`, `api.upstash.com`
- Filesystem: `~/Library/Caches/claude-cli-nodejs` (write)

**Tradeoff:** Context7 gives focused docs without GitHub's broad surface. Worth enabling for research tasks, skip for pure build/test.

See `dm-work:srt` skill for full config examples including Context7-enabled setups.

---

## Related

- **`dm-work:srt` skill** — Full configuration reference with ecosystem-specific allowlists
- **workflow.md** — Development loop context (srt enables unattended execution phases)

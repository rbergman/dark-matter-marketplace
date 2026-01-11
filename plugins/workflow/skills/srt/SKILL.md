---
name: srt
description: Sandbox Runtime (srt) patterns for running Claude with filesystem/network restrictions. Use when setting up sandboxed autonomous Claude sessions, DX testing, or CI/CD integration with constrained dangerous mode.
---

# Sandbox Runtime (srt)

[srt](https://github.com/anthropic-experimental/sandbox-runtime) is a lightweight OS-level sandbox for restricting filesystem and network access without containers.

**Use cases:**
- Running Claude with `--dangerously-skip-permissions` safely
- DX testing (stress-testing skills, toolchain validation)
- CI/CD autonomous Claude runs
- Isolating subagent work to specific directories

## Installation

```bash
npm install -g @anthropic-ai/sandbox-runtime
```

## How It Works

| Platform | Mechanism |
|----------|-----------|
| macOS | `sandbox-exec` with dynamic profiles |
| Linux | `bubblewrap` with network namespaces |

**Access model:**
- **Network**: Default deny, explicit allowlist
- **FS Read**: Default allow, explicit denylist
- **FS Write**: Default deny, explicit allowlist

---

## Configuration

srt uses JSON config files (default: `~/.srt-settings.json` or `-s <path>`).

### Config Structure

```json
{
  "network": {
    "allowedDomains": ["api.anthropic.com", "github.com"],
    "deniedDomains": []
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.gnupg", "~/.aws/credentials"],
    "allowWrite": [".", "/tmp"],
    "denyWrite": []
  }
}
```

### Network Allowlists by Ecosystem

**Rust development:**
```json
"allowedDomains": [
  "api.anthropic.com",
  "crates.io", "*.crates.io", "static.crates.io", "index.crates.io",
  "github.com", "*.github.com",
  "static.rust-lang.org",
  "*.cloudfront.net"
]
```

**Go development:**
```json
"allowedDomains": [
  "api.anthropic.com",
  "proxy.golang.org", "sum.golang.org", "storage.googleapis.com",
  "github.com", "*.github.com",
  "gopkg.in"
]
```

**Node/TypeScript development:**
```json
"allowedDomains": [
  "api.anthropic.com",
  "registry.npmjs.org", "*.npmjs.org",
  "github.com", "*.github.com"
]
```

**With MCP services (Context7, Brightdata):**
```json
"allowedDomains": [
  "api.anthropic.com",
  "context7.com", "*.context7.com",
  "brightdata.com", "*.brightdata.com"
]
```

---

## Claude Stateless Flags

For sandboxed Claude runs, disable state writes:

```bash
claude --dangerously-skip-permissions \
       --no-session-persistence \
       --strict-mcp-config --mcp-config '{"mcpServers":{}}'
```

| Flag | Purpose |
|------|---------|
| `--dangerously-skip-permissions` | No permission prompts (srt handles safety) |
| `--no-session-persistence` | Don't write to `~/.claude.json` |
| `--strict-mcp-config --mcp-config '{...}'` | No MCP servers (avoids log writes to `~/Library/Caches/`) |

**Why disable MCP?** Claude writes MCP logs to `~/Library/Caches/claude-cli-nodejs/`. Sandboxing this requires broad write access. Simpler to disable for autonomous runs.

---

## Example Configs

### Project-Specific `.srt.json`

For a Rust project:

```json
{
  "network": {
    "allowedDomains": [
      "api.anthropic.com",
      "crates.io", "*.crates.io", "static.crates.io", "index.crates.io",
      "github.com", "*.github.com",
      "static.rust-lang.org", "*.cloudfront.net"
    ]
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.gnupg", "~/.aws/credentials"],
    "allowWrite": [
      ".",
      "~/.cargo/registry",
      "~/.cargo/git",
      "/tmp"
    ]
  }
}
```

### DX Testing Config

For stress-testing skills in `/tmp`:

```json
{
  "network": {
    "allowedDomains": [
      "api.anthropic.com",
      "crates.io", "*.crates.io", "github.com", "*.github.com",
      "registry.npmjs.org", "proxy.golang.org"
    ]
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.gnupg"],
    "allowWrite": [
      "/tmp",
      "~/.cargo/registry", "~/.cargo/git",
      "~/.npm", "~/.cache/go-build"
    ]
  }
}
```

---

## Usage Patterns

### One-Shot Task

```bash
srt -s .srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "Build and test the project, report any issues"'
```

### DX Stress Test

```bash
srt -s /tmp/dx-test.srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "Create a Rust CLI in /tmp/test-project following rust-pro patterns.
      Report any toolchain friction or missing patterns."'
```

---

## Optional: Justfile Integration

Add these recipes to a project's justfile for convenient access:

```just
# Interactive Claude session
ai:
    claude

# Autonomous Claude (sandboxed, no prompts)
ai-auto:
    srt -s .srt.json -c 'claude --dangerously-skip-permissions --no-session-persistence --strict-mcp-config --mcp-config "{\"mcpServers\":{}}"'
```

**Note:** This is an optional pattern. Only add if the project needs autonomous Claude runs.

---

## Limitations

| Limitation | Impact |
|------------|--------|
| Domain fronting | Broad allowlists (github.com) have exfiltration surface |
| Linux monitoring | No violation alerts (macOS has real-time notifications) |
| Proxy bypass | Apps ignoring env vars can bypass network filtering |
| MCP disabled | No Context7, Brightdata, etc. in sandboxed runs |

For MCP in sandbox, you'd need to allow `~/Library/Caches/claude-cli-nodejs/` writes and add MCP endpoints to network allowlist.

---

## Troubleshooting

### "EPERM: operation not permitted"

Check what path is being blocked:
- `~/.claude.json` → Add `--no-session-persistence`
- `~/Library/Caches/claude-cli-nodejs/` → Disable MCP or allow writes
- Project files → Add project dir to `allowWrite`

### Debug Mode

```bash
srt -d -s .srt.json -c 'your-command'
```

Shows sandbox profile and violations.

### Test Write Access

```bash
srt -s .srt.json -c 'touch /path/to/test && echo "write ok"'
```

---

## Quick Reference

```bash
# Install
npm install -g @anthropic-ai/sandbox-runtime

# Run sandboxed command
srt -s config.json -c 'command'

# Run sandboxed Claude (stateless)
srt -s .srt.json -c 'claude --dangerously-skip-permissions \
  --no-session-persistence \
  --strict-mcp-config --mcp-config "{\"mcpServers\":{}}" \
  -p "prompt"'

# Debug mode
srt -d -s config.json -c 'command'
```

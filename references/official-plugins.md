# Official Anthropic Plugins

Reference documentation for official Claude Code plugins from `claude-plugins-official`. These are installed and maintained separately from dark-matter-marketplace but are worth knowing about and using.

---

## Code Quality

### code-simplifier

**Type:** Agent (Opus-powered)
**Trigger:** Proactive after code changes

Simplifies and refines code for clarity, consistency, and maintainability while preserving functionality. Focuses on recently modified code unless instructed otherwise.

**Key behaviors:**
- Preserves exact functionality (only changes how, not what)
- Applies project standards from CLAUDE.md
- Reduces unnecessary complexity and nesting
- Avoids nested ternaries (prefers switch/if-else)
- Chooses clarity over brevity

**When it runs:** Automatically after code is written or modified.

### code-review

**Type:** Plugin
**Command:** `/code-review:code-review`

Reviews pull requests for issues and improvements.

---

## Development Workflow

### feature-dev

**Type:** Plugin with 3 agents
**Command:** `/feature-dev`

Guided feature development with codebase understanding and architecture focus.

| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Reviews code for bugs, security issues, and quality |
| `code-explorer` | Analyzes existing features by tracing execution paths |
| `code-architect` | Designs feature architectures based on existing patterns |

### commit-commands

**Type:** Plugin
**Commands:** `/commit`, `/commit-push-pr`, `/clean_gone`

Git workflow commands for commits and PRs.

### frontend-design

**Type:** Plugin
**Command:** `/frontend-design`

Creates distinctive, production-grade frontend interfaces. Generates creative, polished code that avoids generic AI aesthetics.

---

## Plugin Development

### plugin-dev

**Type:** Plugin with skills
**Command:** `/plugin-dev:create-plugin`

Guided plugin creation workflow with component design, implementation, and validation.

**Skills available:**
- `plugin-dev:agent-development` - Agent structure and system prompts
- `plugin-dev:skill-development` - Skill structure and best practices
- `plugin-dev:command-development` - Slash command creation
- `plugin-dev:hook-development` - Hook creation and event handling
- `plugin-dev:mcp-integration` - MCP server integration
- `plugin-dev:plugin-structure` - Plugin manifest and organization
- `plugin-dev:plugin-settings` - Configuration with .local.md files

### hookify

**Type:** Plugin
**Commands:** `/hookify`, `/hookify:list`, `/hookify:configure`

Create hooks to prevent unwanted behaviors from conversation analysis or explicit instructions.

---

## External Integrations

### context7

**Type:** MCP Server
**Tools:** `resolve-library-id`, `query-docs`

Retrieves up-to-date documentation and code examples for any library. Useful for checking current API patterns.

### firebase

**Type:** MCP Server
**Tools:** Various `firebase_*` tools

Firebase project management, app creation, and configuration.

---

## Language Server Protocol (LSP)

See [lsp-setup.md](./lsp-setup.md) for detailed LSP configuration.

| Plugin | Language | Binary Required |
|--------|----------|-----------------|
| typescript-lsp | TypeScript/JavaScript | `typescript-language-server` |
| gopls-lsp | Go | `gopls` |
| rust-analyzer-lsp | Rust | `rust-analyzer` |
| pyright-lsp | Python | `pyright` |

---

## Security

### security-guidance

**Type:** Plugin

Security best practices and guidance for code review.

---

## Usage Notes

1. **These plugins are separate from dm-*** - They're maintained by Anthropic and installed from `claude-plugins-official`
2. **Check what's enabled** - Run `cat ~/.claude/settings.json | jq '.enabledPlugins'`
3. **Some run proactively** - code-simplifier activates automatically after edits
4. **Some require invocation** - Use `/command` or invoke via Task tool with appropriate agent

## Complementary Use with dm-*

| Task | Official Plugin | dm-* Complement |
|------|-----------------|-----------------|
| Code review | feature-dev:code-reviewer | dm-arch:solid-architecture for principles |
| Feature development | feature-dev | dm-work:orchestrator for delegation |
| Code cleanup | code-simplifier | dm-lang:* for language-specific standards |
| Plugin creation | plugin-dev | - |
| Debugging | - | dm-work:debugging |
| TDD | - | dm-work:tdd |

---

## Agent Teams Integration

With Agent Teams (experimental), some official plugin capabilities can be enhanced:

| Official Plugin | Enhancement with Agent Teams |
|----------------|------------------------------|
| `code-review` | Use `dm-team:team-review` for reviewers that discuss and challenge each other's findings |
| `feature-dev:code-architect` | Spawn as a teammate alongside implementation teammates for real-time architectural guidance |
| `superpowers:dispatching-parallel-agents` | Agent Teams provides native parallel coordination; see `dm-team:tiered-delegation` for when each approach fits |

Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. See `dm-team` plugin for full details.

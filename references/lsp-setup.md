# LSP Setup for Claude Code

Language Server Protocol integration provides Claude with code intelligence: go-to-definition, find references, diagnostics, and more.

## Why You Should Care

Without LSP, Claude reads files as plain text and infers types, definitions, and relationships from patterns. With LSP, Claude gets the same real-time intelligence your IDE uses: actual type information, precise symbol locations, compiler diagnostics before you run the build. This means fewer hallucinated function signatures, faster navigation through unfamiliar code, and catching type errors immediately instead of after a failed build. The difference is subtle but cumulative—LSP makes Claude meaningfully more accurate on typed codebases.

---

## Quick Status Check

```bash
# Check enabled LSP plugins
cat ~/.claude/settings.json | jq '.enabledPlugins | to_entries | .[] | select(.key | contains("lsp")) | {plugin: .key, enabled: .value}'

# Check if binaries are installed
which typescript-language-server gopls rust-analyzer pyright
```

---

## Supported Languages

| Language | Plugin | Binary | Install Command |
|----------|--------|--------|-----------------|
| TypeScript/JS | typescript-lsp | `typescript-language-server` | `npm install -g typescript-language-server typescript` |
| Go | gopls-lsp | `gopls` | `go install golang.org/x/tools/gopls@latest` |
| Rust | rust-analyzer-lsp | `rust-analyzer` | `rustup component add rust-analyzer` |
| Python | pyright-lsp | `pyright` | `npm install -g pyright` or `pip install pyright` |
| Kotlin | kotlin-lsp | `kotlin-language-server` | See [kotlin-language-server](https://github.com/fwcd/kotlin-language-server) |
| HTML/CSS/JSON | vscode-langservers | `vscode-html-language-server`, etc. | `npm install -g vscode-langservers-extracted` |

---

## Installation

### 1. Install the binaries

**TypeScript:**
```bash
npm install -g typescript-language-server typescript
```

**Go:**
```bash
go install golang.org/x/tools/gopls@latest
# Ensure $GOPATH/bin or $HOME/go/bin is in PATH
```

**Rust:**
```bash
rustup component add rust-analyzer
# Or via Homebrew: brew install rust-analyzer
```

**Python:**
```bash
npm install -g pyright
# Or: pip install pyright
```

**Kotlin:**
```bash
# Build from source or use a package manager
# See: https://github.com/fwcd/kotlin-language-server
brew install kotlin-language-server  # macOS with Homebrew
```

**HTML/CSS/JSON:**
```bash
npm install -g vscode-langservers-extracted
# Provides: vscode-html-language-server, vscode-css-language-server, vscode-json-language-server
```

### 2. Enable the plugins

The LSP plugins should be enabled by default from `claude-plugins-official`. Verify:

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins | keys | .[] | select(contains("lsp"))'
```

Expected output:
```
"gopls-lsp@claude-plugins-official"
"pyright-lsp@claude-plugins-official"
"rust-analyzer-lsp@claude-plugins-official"
"typescript-lsp@claude-plugins-official"
```

### 3. Verify PATH

Binaries must be in PATH. Check common issues:

```bash
# Go - add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:$HOME/go/bin"

# Rust - usually handled by rustup
export PATH="$PATH:$HOME/.cargo/bin"

# Node global - check npm prefix
npm config get prefix  # Should be in PATH
```

---

## How LSP Works in Claude Code

1. **Transparent operation** - LSP runs automatically when you work with supported files
2. **No explicit invocation** - Unlike MCP tools, you don't call LSP directly
3. **Enhanced intelligence** - Claude gets type information, definitions, references, diagnostics
4. **Project-aware** - Respects tsconfig.json, go.mod, Cargo.toml, etc.

---

## Verifying LSP is Active

### Method 1: Debug logs

```bash
# Check recent debug logs for LSP activity
ls -lt ~/.claude/debug/ | head -5 | tail -4 | awk '{print $NF}' | \
  xargs -I{} grep -l -i "lsp" ~/.claude/debug/{} 2>/dev/null

# Look for specific LSP calls
grep -i "LSP Diagnostics" ~/.claude/debug/<recent-session-id>.txt
```

Healthy output shows:
```
LSP Diagnostics: getLSPDiagnosticAttachments called
```

### Method 2: Behavior observation

LSP is working if Claude:
- Accurately identifies type errors before running the compiler
- Navigates to definitions without grep/glob searches
- Knows function signatures without reading entire files
- Reports unused imports or variables

### Method 3: Plugin errors

```bash
# Check for LSP-related errors in recent sessions
grep -i "lsp.*error\|language.server.*error" ~/.claude/debug/*.txt | tail -20
```

---

## Troubleshooting

### "Executable not found in $PATH"

Binary not installed or not in PATH:
```bash
# Find where it's installed
which <binary-name>

# If not found, install it (see above)
# If found but not working, check PATH in Claude's environment
```

### "No LSP server available"

1. Check Claude version (need 2.1.0+ for LSP fix):
   ```bash
   claude --version
   ```

2. Verify plugin is enabled:
   ```bash
   cat ~/.claude/settings.json | jq '.enabledPlugins["typescript-lsp@claude-plugins-official"]'
   ```

3. Restart Claude after installing binaries

### LSP not used for specific project

- Check for valid project config (tsconfig.json, go.mod, etc.)
- LSP needs a project root to initialize
- Some file types may not trigger LSP (check extensions in plugin README)

---

## Version Requirements

- **Claude Code:** 2.1.0+ (fixes race condition in 2.0.69-2.0.x)
- **typescript-language-server:** latest via npm
- **gopls:** latest via `go install`
- **rust-analyzer:** latest via rustup or package manager
- **pyright:** latest via npm or pip

---

## Performance Notes

- LSP servers start lazily when you first open a supported file type
- Initial project indexing may take a few seconds for large projects
- TypeScript LSP benefits from having TypeScript installed alongside the language server
- Go LSP (gopls) requires a valid go.mod for module-aware features

---

## Related

- [Official Plugins](./official-plugins.md) - Full list of official Claude Code plugins
- [Claude Code LSP Guide](https://www.aifreeapi.com/en/posts/claude-code-lsp) - External comprehensive guide

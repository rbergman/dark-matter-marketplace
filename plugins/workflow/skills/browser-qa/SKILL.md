---
name: browser-qa
description: QA web applications using Chrome DevTools MCP. Use when testing running apps, verifying acceptance criteria against a live UI, checking for console errors, evaluating UI behavior, or running regression checks. Requires the chrome-devtools MCP server to be connected. Complements dm-work:review (code-level) with runtime verification.
---

# Browser QA

Test running web applications by actually navigating, clicking, and asserting — not just reading code.

## Scope

This skill covers **standard web applications** testable via Chrome DevTools. It is NOT suitable for:
- **WebGL/Canvas-heavy apps** (real-time games, 3D renderers) — CDT snapshots can't inspect canvas internals. Use manual verification with screenshots, or project-specific tools.
- **Native mobile apps** — use platform-specific QA tools (e.g., Maestro for iOS/Android).
- **CLI tools** — use bash-based testing, not browser QA.

When the evaluator encounters projects outside browser-qa's scope, it should mark runtime criteria as UNTESTABLE and note the recommended verification method.

## When to Use

- After implementation work, before merge — verify acceptance criteria against the live app
- Post-merge regression checks — exercise key user flows after code lands
- Investigating visual or interaction bugs — reproduce in browser, inspect state
- Evaluator protocol — the evaluator uses this skill to grade against sprint contracts
- Design quality checks — screenshot and visually evaluate for AI slop patterns

## Prerequisites

- **Chrome DevTools MCP** connected (chrome-devtools-mcp plugin)
- **App running locally** — dev server started (the QA agent does NOT start the server)
- **Acceptance criteria available** — from bead, spec, or derived from the change

## QA Workflow

### Step 1: Resolve Acceptance Criteria

Find testable criteria from (in priority order):

1. **Bead** — `bd show <id>` → check the `design` field for acceptance criteria
2. **Spec file** — check `docs/` or `history/` for the spec that spawned this work
3. **Explicit** — user or orchestrator provides criteria in the prompt
4. **Derived** — if nothing else, derive basic criteria from the change:
   - Page loads without console errors
   - Changed elements are visible and interactive
   - No network request failures
   - No regressions in surrounding UI

### Step 2: Navigate and Snapshot

```
navigate_page(url: "http://localhost:<port>/<path>")
take_snapshot()
```

The snapshot returns a text representation of the page's accessibility tree. Each interactive element has a UID you can target with click, fill, etc.

**Always snapshot before interacting** — UIDs are ephemeral and change on navigation.

### Step 3: Exercise User Flows

For each acceptance criterion, drive the corresponding user flow.

**Navigate and verify content:**
```
navigate_page(url: "<target URL>")
wait_for(text: ["<expected content>"])
take_snapshot()    # confirm element is present in a11y tree
```

**Fill and submit a form:**
```
take_snapshot()                                    # get current UIDs
fill(uid: "<input-uid>", value: "<test value>")    # type into field
click(uid: "<submit-uid>", includeSnapshot: true)  # submit + get new state
wait_for(text: ["<success indicator>"])             # wait for result
```

**Multi-field forms (more efficient):**
```
fill_form(elements: [
  { uid: "<email-uid>", value: "test@example.com" },
  { uid: "<name-uid>", value: "Test User" },
  { uid: "<role-uid>", value: "admin" }
])
click(uid: "<save-uid>", includeSnapshot: true)
```

**Keyboard interaction:**
```
press_key(key: "Enter")           # submit
press_key(key: "Escape")          # dismiss modal
press_key(key: "Tab")             # focus next
press_key(key: "Control+A")       # select all
```

**Drag and drop:**
```
drag(from_uid: "<source>", to_uid: "<target>", includeSnapshot: true)
```

### Step 4: Assert Expected Behavior

After each flow step, verify using the cheapest sufficient method:

**Text/element presence** (cheapest — prefer this):
```
take_snapshot()
# Scan the a11y tree for expected text, roles, states
```

**Visual verification** (use when layout/styling matters):
```
take_screenshot()
# Review for correct layout, colors, typography, spacing
```

**Console errors** (always check):
```
list_console_messages(types: ["error"])
# Should be empty. Warnings are informational, errors are failures.
```

**Network request success:**
```
list_network_requests(resourceTypes: ["fetch", "xhr"])
# Verify status codes (200, 201, 204). Flag 4xx/5xx.
```

**Custom JS assertions** (for state that isn't visible in the a11y tree):
```
evaluate_script(expression: "document.querySelector('.toast.success') !== null")
evaluate_script(expression: "window.__APP_STATE__.user.role === 'admin'")
```

### Step 5: Regression Checks

Beyond the specific acceptance criteria, check for collateral damage:

1. **Console errors** — `list_console_messages(types: ["error"])` on every page visited
2. **Network failures** — any 4xx/5xx in `list_network_requests()`
3. **Responsive** — `emulate(viewport: "375x667,mobile,touch")` then re-check key elements
4. **Dark mode** (if supported) — `emulate(colorScheme: "dark")` then screenshot
5. **Accessibility** — `lighthouse_audit(mode: "snapshot")` for quick a11y score

### Step 6: Report Results

Structure the report as pass/fail per acceptance criterion:

```markdown
## QA Report: <bead-id or description>

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | User can navigate to /settings | PASS | |
| 2 | Form validates email client-side | PASS | Shows red border + message |
| 3 | Save button disabled during submit | FAIL | Button stays enabled |
| 4 | Success toast after save | PASS | |
| 5 | No console errors | PASS | 0 errors |

### Regression Checks

- Console errors: 0
- Network failures: 0
- Mobile responsive: PASS
- Lighthouse accessibility: 92

### Verdict: FAIL (1/5 criteria failed)

Failing criteria:
- #3: Save button not disabled during form submission. The button remains
  clickable, allowing duplicate submissions.
```

**Integration with beads:** If a criterion fails, create a linked bead:
```bash
bd create --title="Save button not disabled during submission" --type=bug --priority=2 --deps discovered-from:<parent-bead>
```

---

## CDT Tool Reference

| Tool | Purpose | When to use |
|------|---------|-------------|
| `navigate_page` | Go to URL, back/forward/reload | Start of each flow |
| `take_snapshot` | A11y tree with element UIDs | Before any interaction; for text/structure assertions |
| `take_screenshot` | Visual capture (PNG) | Layout/styling verification; design quality checks |
| `click` | Click element by UID | Buttons, links, toggles |
| `fill` | Input/textarea/select by UID | Single form fields |
| `fill_form` | Multiple fields at once | Multi-field forms (more efficient) |
| `type_text` | Raw keystrokes (no targeting) | When you need to type into the focused element |
| `press_key` | Key/combo (Enter, Escape, Ctrl+A) | Submit, dismiss, shortcuts |
| `wait_for` | Wait for text to appear | After navigation or async operations |
| `drag` | Drag element to element | Drag-and-drop UIs |
| `list_console_messages` | Console output (filter by type) | Error checking — always run |
| `list_network_requests` | Network activity (filter by type) | API call verification |
| `get_network_request` | Single request details + body | Deep API response inspection |
| `get_console_message` | Single console message details | Investigating specific errors |
| `lighthouse_audit` | A11y, SEO, best practices scores | Quick accessibility check |
| `evaluate_script` | Run JS in page context | Custom assertions on app state |
| `emulate` | Viewport, dark mode, network, geo | Responsive/a11y/offline testing |
| `upload_file` | File input interaction | Upload flows |

## Context Efficiency Tips

- **Prefer `take_snapshot` over `take_screenshot`** — text is far cheaper than images in context
- Use `take_screenshot` only when you need to verify visual appearance (layout, colors, styling)
- `wait_for` before asserting — async UI needs time to settle after interactions
- `list_console_messages(types: ["error"])` is the cheapest smoke test — run it on every page
- For SPAs, always `wait_for` expected content after navigation — don't assume instant render
- Use `includeSnapshot: true` on click/fill to get the post-action state in one call instead of two
- Save screenshots to files (`filePath`) when running multiple checks to avoid bloating context
- `lighthouse_audit(mode: "snapshot")` is faster than `mode: "navigation"` (no reload)

## Patterns

### Quick Smoke Test
Cheapest possible verification — use when you just need to know the page works:
```
navigate_page(url: "<url>")
wait_for(text: ["<any expected text>"])
list_console_messages(types: ["error"])    # should be empty
```

### Form Submission Flow
```
navigate_page(url: "<form page>")
take_snapshot()
fill_form(elements: [<fields>])
click(uid: "<submit>", includeSnapshot: true)
wait_for(text: ["<success message>"])
list_console_messages(types: ["error"])
list_network_requests(resourceTypes: ["fetch"])   # verify API call
```

### Visual Regression Check
```
navigate_page(url: "<page>")
wait_for(text: ["<loaded indicator>"])
take_screenshot(filePath: "qa-screenshots/desktop.png")
emulate(viewport: "375x667,mobile,touch")
take_screenshot(filePath: "qa-screenshots/mobile.png")
emulate(colorScheme: "dark")
take_screenshot(filePath: "qa-screenshots/dark-mobile.png")
```

### Design Quality Spot Check
```
navigate_page(url: "<page>")
take_screenshot(fullPage: true, filePath: "qa-screenshots/full-page.png")
# Review screenshot for AI slop patterns:
# - Generic purple/blue gradients over white cards
# - Template-default typography and spacing
# - Identical component styling across unrelated sections
# - Over-reliance on rounded corners + drop shadows + blur
# - No distinct identity or mood — looks like every other AI-generated site
```

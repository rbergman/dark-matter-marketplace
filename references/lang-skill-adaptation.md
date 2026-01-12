# Language Skill Adaptation & DX Testing

A workflow for creating language-specific skills by adapting proven ones, then validating them through sandboxed stress testing.

---

## What "DX" Means Here

Two kinds of ergonomics matter:

**Human developer ergonomics** — A solid porcelain layer where viable: consistent `just` commands, toolchain management with `mise`, clear project structure. The skill should guide Claude to set up repos that are pleasant for humans to work in. (Note: some ecosystems don't fit this mold well — Haskell and mise don't mix, for example. Adapt to what works.)

**Agent ergonomics** — How smoothly Claude can follow the skill patterns while maintaining quality standards. The goal is dialing automated quality checks to maximum strictness, then backing off just enough that agent ergonomics are fluid but constrained to high quality from an automatically verifiable perspective.

---

## Skill Scope

Language skills should match the scope of the reference skill (e.g., `dm-lang:go-pro`):

- **Clean, maintainable code** following general best practices
- **Strict automated quality gates** — lints, types, tests all pass
- **Idiomatic patterns** for the language
- **Standard project structure** with just/mise where viable

Specialized concerns (architecture patterns, frontend/backend specifics, domain logic) belong in auxiliary skills that layer on top. Instruct the implementing agent to apply relevant arch skills as appropriate to the challenge.

---

## The Workflow

### 1. Create the Adapted Skill

Ask Claude to:

- **Reference a proven skill** — Start from `dm-lang:go-pro` or similar
- **Adapt for the target language** — Focus on:
  - Strict compiler/linting/quality rules
  - `just` recipes and `mise` configs (where viable)
  - Idiomatic patterns and common pitfalls
- **Use web research** — Ground decisions in current best practices, not training data

Example prompt:
```
Read dm-lang:go-pro and create a Python equivalent.

Use web research to find current best practices for:
- ruff configuration (latest rules)
- pyright strict mode settings
- pytest patterns
- uv or poetry for dependency management

Adapt the just/mise patterns for Python. Keep the same rigor
on quality gates (all lints pass, all tests pass, strict types).
```

### 2. Create Test Repo with Challenge

Ask Claude to:

- **Create a new repo in `/tmp`** with git and beads initialized
- **Use the new skill to seed the repo** — Tests project initialization guidance
- **Brainstorm 5 programming challenges** suited to the language, then pick the most effective one

The repo should have working `just check`, `just test`, and pass all quality gates from the start.

**Challenge criteria:**
- Exercises idiomatic patterns for the language
- Cannot be zero-shot from memory — requires actual problem-solving
- Completes in under 10 minutes of agent time
- Complex enough to span multiple files, error handling, tests

Good challenges: CLI tools with subcommands, parsers, concurrent data processing, API clients with retry logic.

*(Optional: inject yourself into challenge selection if you want more control over what gets tested.)*

### 3. Stress Test with srt

Ask Claude to:

- **Act as orchestrator**
- **Use the srt skill** to configure and run a sandboxed subagent
- **Have the subagent solve the challenge**, following the new skill strictly
- **Apply relevant arch skills** as appropriate to the challenge
- **Record ergonomics friction** encountered during development

Example:
```
Using the srt skill, run a sandboxed subagent to implement the
challenge in /tmp/test-python.

Have the subagent follow python-pro strictly, applying
solid-architecture patterns where appropriate.

Record friction:
- Places where guidance was unclear
- Decisions the subagent had to guess at
- Quality gate failures and what caused them
- Tooling issues or missing configuration
```

### 4. QA Assessment

After the challenge is complete, assess:

- **Test quality** — Are tests meaningful or just coverage padding?
- **Code coverage** — What's tested, what's not?
- **Automated check results** — Did everything pass? What almost failed?

This validates that the skill's quality gates are properly calibrated.

### 5. Debrief and Decide

**You review:**
- The final solution in the repo
- Code quality and idiom adherence
- Whether it meets your standards

**Orchestrator presents:**
- Ergonomics friction report
- QA assessment findings
- Recommendations: what to fix vs what's acceptable

**Together decide:**
- Is the skill good enough to put into practice?
- What specific changes need to be made?
- Is the problem the skill or the challenge?

### 6. Iterate (if needed)

Update the skill based on findings. Re-run the stress test.

**Typical iteration count:** 1-2 rounds to reach acceptable quality. Further refinement comes from practical application — real projects surface edge cases that synthetic challenges miss.

**Convergence:** When you and the orchestrator agree the skill is good enough to use in practice.

---

## Example Findings and Fixes

| Finding | Skill Update |
|---------|--------------|
| Subagent guessed at error handling pattern | Add explicit error handling section |
| `just check` recipe missing lint step | Fix just recipe template |
| Subagent used outdated library | Add web research requirement for deps |
| Tests passed but weren't idiomatic | Add testing patterns section |
| Project init missed `mise` config | Add mise setup to initialization checklist |
| Test coverage was high but tests were trivial | Add test quality guidance |

---

## Tips

**Start with go-pro as template.** It's battle-tested and covers the full surface area.

**Require web research.** Training data gets stale; current tooling configs matter.

**Make challenges realistic.** "Build a CLI" exercises more patterns than algorithm puzzles.

**Review the repo yourself.** Automated metrics don't catch everything; your taste matters.

**Adapt the workflow.** This reflects one person's preferences. Add your own constraints at the outset.

---

## Related

- **dm-lang:go-pro** — Reference template for language skills
- **dm-work:srt** — Sandbox configuration for stress testing
- **dm-work:orchestrator** — Orchestrator patterns for delegation
- **dm-arch:solid-architecture** — Architecture patterns to layer on top

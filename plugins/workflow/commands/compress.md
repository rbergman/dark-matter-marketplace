---
description: Compress a document or artifact for agent-optimized token density while preserving effectiveness
argument-hint: [file path or artifact name to compress]
---

# Agent-Optimized Compression

Target: $ARGUMENTS (or infer from conversation)

## Principles

- **Audience is AI agents**, not humans — terse > readable
- **Preserve all salient details** — compress, don't lose information
- **Eliminate redundancy** — say it once, clearly
- **Compact formatting** — bullets, tables, shorthand over prose

## Compression Techniques

| Verbose | Compressed |
|---------|------------|
| Paragraphs explaining concepts | Bullet points |
| Multiple examples showing same thing | One example + rule |
| "You should do X because Y" | "X" (or "X — Y" if reason critical) |
| Repeated warnings | Single bold statement |
| Step-by-step with explanations | Numbered steps, terse |
| "If X then Y, if A then B, if C then D" | Decision table |

## Process

1. **Read** the original artifact
2. **Identify** core requirements vs verbose explanation
3. **Preserve** critical patterns (WRONG/CORRECT examples, decision logic)
4. **Remove** redundant examples, obvious explanations, filler
5. **Restructure** prose → bullets/tables
6. **Verify** no salient detail lost

## Quality Check

- Would an agent following compressed version produce same results?
- Are all decision points preserved?
- Are critical warnings/boundaries retained?
- Is any essential context lost?

If yes to first three and no to last → compression successful.

---
name: debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Requires root cause investigation before any fix attempts. Random fixes waste time and create new bugs.
---

# Systematic Debugging

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

---

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

---

## When to Use

**Any technical issue:**
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Especially when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work

---

## The Four Phases

Complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**
   ```
   For EACH component boundary:
     - Log what data enters
     - Log what data exits
     - Verify environment/config propagation

   Run once to gather evidence showing WHERE it breaks
   THEN investigate that specific component
   ```

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

### Phase 2: Pattern Analysis

1. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - Read reference implementation COMPLETELY
   - Don't skim - read every line

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis**
   - "I think X is the root cause because Y"
   - Be specific, not vague

2. **Test Minimally**
   - Make the SMALLEST possible change
   - One variable at a time
   - Don't fix multiple things at once

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

### Phase 4: Implementation

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - MUST have before fixing

2. **Implement Single Fix**
   - Address the root cause
   - ONE change at a time
   - No "while I'm here" improvements

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?

4. **Circuit Breaker — 2+ Approaches Failed**

   If you have attempted 2 or more distinct approaches to the same problem:

   **STOP. Do not attempt a third approach.**

   Instead:
   1. Summarize what you tried and why each failed
   2. Propose 2-3 alternative approaches with tradeoffs
   3. Ask the user to choose before continuing

   This is NOT optional. Cycling through 3-4 failed approaches wastes entire sessions.

---

## Red Flags - STOP and Return to Phase 1

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- "One more fix attempt" — **circuit breaker: STOP after 2 failed approaches**

---

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple" | Simple issues have root causes too |
| "Emergency, no time" | Systematic is FASTER than thrashing |
| "Just try this first" | First fix sets the pattern |
| "Multiple fixes saves time" | Can't isolate what worked |
| "I see the problem" | Seeing symptoms ≠ understanding root cause |
| "One more attempt" (after 2+) | Circuit breaker: STOP, summarize, ask user |

---

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

---

## Real-World Impact

| Approach | Time to Fix | First-Time Fix Rate | New Bugs |
|----------|-------------|---------------------|----------|
| Systematic | 15-30 min | 95% | Near zero |
| Random fixes | 2-3 hours | 40% | Common |

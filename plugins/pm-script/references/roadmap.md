# PM Script Roadmap

> Phase 1 shipped. Everything below is uncommitted future work.

## Phase 2: Parallel Workers + Hardening

### From the original plan
- 2-3 concurrent workers with file ownership boundaries
- Integration merge ordering + per-merge gate validation
- Escalation learning (Bayesian: tighten instantly, relax slowly)
- Model routing (Opus/Sonnet/Haiku by task complexity)
- Rate limit detection + backoff
- Crash recovery (git stash + journal reconstruction)

### From Phase 1 review
- **Spinning detection during active sessions** — currently only checks gate results, which are only appended on completion. Need periodic gate runs in the monitor loop, or track worker output similarity.
- **Real Agent SDK backend** — `AgentSDKBackend` is a stub (shells out to `claude -p`). True SDK integration: streaming token counts, native cancellation, real `claude-code-sdk` usage.
- **`run_gate` shell injection** — uses `create_subprocess_shell`. Switch to `create_subprocess_exec` with argument splitting for safety.
- **Token count accuracy** — CLI backend uses rough `num_turns * 4000` estimate. Parse actual token counts from `claude -p --output-format json` response metadata.
- **Worker prompt path fragility** — escalation drop path (`.pm/worker-escalations.jsonl`) is relative. Worker `cd` could break it. Use absolute path injected from PM.

### From feedback
- **Timbers integration** — on bead completion, auto-generate `timbers log` entry from decision ledger. Collapse escalation history into what/why/how with `--work-item bead:<id>`.
- **CC-as-HITL frontend** — formalize the pattern of CC interactive session as the human control plane. The hooks ship with Phase 1 but the workflow isn't documented.

## Phase 3: Coherence & Personality

- Cross-worker coherence: deterministic first (type compat, schema validation)
- Explicit-feedback personality (corrections + clarifications only, no demo-derived)
- Cross-stream feedback propagation (single-hop)
- Contradiction detection
- Progress pings (async FYI)

## Phase 4: Full L7.5

- 5+ workers, OpenClaw/Telegram frontend
- Temporary overrides with auto-expiry
- Phase markers with tier overrides
- Human availability protocol (hold -> digest -> suspend)
- Personality maintenance (weekly review, staleness, pruning)
- Demo system with version stamping
- Feedback translation (NL: directional -> hypotheses)

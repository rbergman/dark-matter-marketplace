#!/usr/bin/env python3
"""pm.py — Level 7.5 Project Manager MVP

Single-worker, single-bead PM that sits between a human director and a Claude Code
worker session. Spawns workers via claude -p (CLI backend) or the Claude Agent SDK.
All PM logic is deterministic — the only LLM interaction is the worker session itself.

Usage:
    python pm.py init --name <project> --archetype greenfield|mature|maintenance
    python pm.py run <bead-id>
    python pm.py status
    python pm.py escalations
    python pm.py respond <id> <action>
    python pm.py cost
    python pm.py ledger
    python pm.py shutdown
"""

from __future__ import annotations

import argparse
import asyncio
import json
import signal
import subprocess
import sys
import time
import tomllib
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import NoReturn, Protocol

__version__ = "0.1.0"

# ── Constants ────────────────────────────────────────────────────────────────

PM_DIR = ".pm"
CONFIG_FILE = "config.toml"
LEDGER_FILE = "decision-ledger.jsonl"
COST_FILE = "cost-log.jsonl"
STATE_FILE = "state.json"
WORKERS_DIR = "workers"

DOMAINS = [
    "architecture", "api_contract", "security", "data_model",
    "dependency", "testing_strategy", "error_handling", "performance",
    "naming", "implementation", "tooling", "scope",
]

DEFAULT_TIERS: dict[str, str] = {
    "architecture": "Block",
    "api_contract": "Block",
    "security": "Block",
    "data_model": "Block",
    "dependency": "Notify",
    "testing_strategy": "Notify",
    "error_handling": "Notify",
    "performance": "Notify",
    "naming": "Log",
    "implementation": "Log",
    "tooling": "Notify",
    "scope": "Block",
}

ARCHETYPE_OVERRIDES: dict[str, dict[str, str]] = {
    "greenfield": {
        "architecture": "Notify",
        "api_contract": "Notify",
        "dependency": "Log",
        "scope": "Notify",
    },
    "mature": {},  # uses defaults
    "maintenance": {
        "dependency": "Block",
        "performance": "Block",
    },
}

# Approximate cost per million tokens (input/output) for dashboard estimates
MODEL_COSTS: dict[str, tuple[float, float]] = {
    "claude-opus-4-6": (15.0, 75.0),
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-haiku-4-5": (0.80, 4.0),
}

# ── Data Structures ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class PMConfig:
    project_name: str
    archetype: str  # greenfield | mature | maintenance
    phase: str  # feature | hardening | maintenance
    backend: str  # agent-sdk | claude-cli
    model: str
    session_token_limit: int
    bead_token_limit: int
    gate_command: str
    gate_timeout: int
    integration_branch: str
    pm_dir: Path

    @staticmethod
    def load(root: Path) -> PMConfig:
        pm_dir = root / PM_DIR
        config_path = pm_dir / CONFIG_FILE
        if not config_path.exists():
            _die(f"No PM config at {config_path}. Run 'pm init' first.")
        with open(config_path, "rb") as f:
            raw = tomllib.load(f)
        proj = raw.get("project", {})
        workers = raw.get("workers", {})
        gates = raw.get("gates", {})
        return PMConfig(
            project_name=proj.get("name", root.name),
            archetype=proj.get("archetype", "mature"),
            phase=proj.get("phase", "feature"),
            backend=proj.get("backend", "claude-cli"),
            model=proj.get("model", "claude-sonnet-4-6"),
            session_token_limit=workers.get("session_token_limit", 150_000),
            bead_token_limit=workers.get("bead_token_limit", 500_000),
            gate_command=gates.get("check_command", "just check"),
            gate_timeout=gates.get("timeout_seconds", 300),
            integration_branch=proj.get("integration_branch", "pm/integration"),
            pm_dir=pm_dir,
        )


@dataclass
class WorkerState:
    id: str
    bead_id: str
    worktree_path: str
    worktree_branch: str
    status: str  # spawning|active|blocked|rotating|suspended|crashed|completed
    owned_files: list[str] = field(default_factory=list)
    gate_results: list[dict] = field(default_factory=list)
    failed_approaches: list[str] = field(default_factory=list)
    decisions: list[dict] = field(default_factory=list)
    active_constraints: list[str] = field(default_factory=list)
    session_token_count: int = 0
    bead_token_count: int = 0
    rotation_count: int = 0
    last_checkpoint_sha: str = ""
    commits: list[str] = field(default_factory=list)
    pending_escalation: dict | None = None
    escalation_history: list[dict] = field(default_factory=list)


@dataclass
class GateResult:
    passed: bool
    command: str
    exit_code: int
    output: str
    duration_s: float
    timestamp: str


@dataclass
class CostEntry:
    timestamp: str
    worker_id: str
    bead_id: str
    model: str
    input_tokens: int
    output_tokens: int
    session_number: int


# ── Helpers ──────────────────────────────────────────────────────────────────


def _die(msg: str) -> NoReturn:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _pm_dir(root: Path | None = None) -> Path:
    return (root or Path.cwd()) / PM_DIR


def _jsonl_append(path: Path, record: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a") as f:
        f.write(json.dumps(record) + "\n")


def _jsonl_read(path: Path) -> list[dict]:
    if not path.exists():
        return []
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


# ── Escalation Engine ────────────────────────────────────────────────────────


def lookup_tier(archetype: str, domain: str) -> str:
    """Look up escalation tier for a domain given project archetype."""
    base = DEFAULT_TIERS.get(domain, "Notify")
    overrides = ARCHETYPE_OVERRIDES.get(archetype, {})
    return overrides.get(domain, base)


def record_escalation(pm_dir: Path, escalation: dict) -> None:
    """Append an escalation to the decision ledger."""
    _jsonl_append(pm_dir / LEDGER_FILE, escalation)


def load_pending_escalations(pm_dir: Path) -> list[dict]:
    """Load escalations that are waiting for human response."""
    records = _jsonl_read(pm_dir / LEDGER_FILE)
    return [r for r in records if r.get("tier") == "Block" and not r.get("human_response")]


def respond_to_escalation(pm_dir: Path, escalation_id: str, action: str) -> dict | None:
    """Record human response to a Block escalation. Returns the updated record."""
    ledger_path = pm_dir / LEDGER_FILE
    records = _jsonl_read(ledger_path)
    updated = None
    for rec in records:
        if rec.get("id") == escalation_id and not rec.get("human_response"):
            rec["human_response"] = action
            rec["response_ts"] = _now_iso()
            updated = rec
            break
    if updated:
        # Atomic rewrite: write to temp, then rename (crash-safe on POSIX)
        tmp = ledger_path.with_suffix(".tmp")
        with open(tmp, "w") as f:
            for rec in records:
                f.write(json.dumps(rec) + "\n")
        tmp.replace(ledger_path)
    return updated


def classify_escalation(
    domain: str, subcategory: str, description: str,
    worker_id: str, bead_id: str, archetype: str,
) -> dict:
    """Create an escalation record with tier looked up from archetype."""
    tier = lookup_tier(archetype, domain)
    esc_id = str(uuid.uuid4())[:8]
    return {
        "id": esc_id,
        "ts": _now_iso(),
        "worker": worker_id,
        "bead": bead_id,
        "domain": domain,
        "subcategory": subcategory,
        "description": description,
        "tier": tier,
        "human_response": None,
        "response_ts": None,
    }


# ── Config / Init ────────────────────────────────────────────────────────────


DEFAULT_CONFIG_TOML = """\
[project]
name = "{name}"
archetype = "{archetype}"
phase = "feature"
backend = "{backend}"
model = "claude-sonnet-4-6"
integration_branch = "pm/integration"

[workers]
session_token_limit = 150000
bead_token_limit = 500000

[gates]
check_command = "just check"
timeout_seconds = 300
"""


def init_pm(root: Path, name: str, archetype: str, backend: str) -> Path:
    """Create .pm/ directory with default config."""
    pm_dir = root / PM_DIR
    if pm_dir.exists():
        _die(f"{pm_dir} already exists. Remove it first to reinitialize.")

    pm_dir.mkdir(parents=True)
    (pm_dir / WORKERS_DIR).mkdir()

    config_content = DEFAULT_CONFIG_TOML.format(
        name=name, archetype=archetype, backend=backend,
    )
    (pm_dir / CONFIG_FILE).write_text(config_content)

    print(f"Initialized PM at {pm_dir}")
    print(f"  Project: {name}")
    print(f"  Archetype: {archetype}")
    print(f"  Backend: {backend}")
    print(f"\nEdit {pm_dir / CONFIG_FILE} to customize gates, token limits, etc.")
    return pm_dir


# ── Worker Journal ───────────────────────────────────────────────────────────


def _worker_dir(pm_dir: Path, worker_id: str) -> Path:
    return pm_dir / WORKERS_DIR / worker_id


def save_journal(pm_dir: Path, state: WorkerState) -> None:
    """Persist worker state to JSON journal."""
    wdir = _worker_dir(pm_dir, state.id)
    wdir.mkdir(parents=True, exist_ok=True)
    path = wdir / "state.json"
    with open(path, "w") as f:
        json.dump(asdict(state), f, indent=2)


def load_journal(pm_dir: Path, worker_id: str) -> WorkerState | None:
    """Load worker state from JSON journal."""
    path = _worker_dir(pm_dir, worker_id) / "state.json"
    if not path.exists():
        return None
    with open(path) as f:
        data = json.load(f)
    return WorkerState(**data)


def find_active_worker(pm_dir: Path) -> WorkerState | None:
    """Find the currently active/blocked worker (Phase 1: at most one)."""
    workers_dir = pm_dir / WORKERS_DIR
    if not workers_dir.exists():
        return None
    for wdir in workers_dir.iterdir():
        if not wdir.is_dir():
            continue
        state_file = wdir / "state.json"
        if state_file.exists():
            state = load_journal(pm_dir, wdir.name)
            if state and state.status in ("active", "blocked", "spawning", "rotating"):
                return state
    return None


def build_worker_prompt(state: WorkerState, bead_context: str) -> str:
    """Build the initial prompt for a worker session."""
    owned = "\n".join(f"- {f}" for f in state.owned_files) if state.owned_files else "- (all files — no ownership boundaries in Phase 1)"
    constraints = "\n".join(f"- {c}" for c in state.active_constraints) if state.active_constraints else "- (none)"
    failed = "\n".join(f"- {a}" for a in state.failed_approaches) if state.failed_approaches else "- (none)"

    escalation_helper = (
        'To report a decision for PM review, run:\n'
        'echo \'{"domain":"DOMAIN","subcategory":"SUB","description":"DESC"}\''
        " >> .pm/worker-escalations.jsonl"
    )

    return f"""You are a worker implementing bead {state.bead_id}.

## Your Task
{bead_context}

## File Ownership
You may modify these files:
{owned}

## Constraints
{constraints}

## Failed Approaches (do not retry)
{failed}

## Escalation Protocol
Before making significant decisions in these domains, report them:
architecture, api_contract, security, data_model, dependency,
testing_strategy, error_handling, performance, naming,
implementation, tooling, scope

{escalation_helper}

## Work Protocol
1. Commit at logical checkpoints (compilable, tests pass if applicable)
2. Run quality gates before reporting completion
3. Never merge branches or close beads
4. When done, print: DONE[{state.bead_id}]: <summary of what was accomplished>
"""


def build_resume_prompt(state: WorkerState, bead_context: str) -> str:
    """Build a prompt for a rotated session, incorporating journal state."""
    base = build_worker_prompt(state, bead_context)
    progress_lines = []
    if state.commits:
        progress_lines.append(f"Previous commits: {', '.join(state.commits[-5:])}")
    if state.last_checkpoint_sha:
        progress_lines.append(f"Last checkpoint: {state.last_checkpoint_sha}")
    progress_lines.append(f"Rotation #{state.rotation_count + 1}")
    if state.gate_results:
        last_gate = state.gate_results[-1]
        progress_lines.append(f"Last gate: {'PASS' if last_gate.get('passed') else 'FAIL'}")

    progress = "\n".join(f"- {p}" for p in progress_lines)
    return f"""{base}

## Session Continuity
This is a continuation of previous work. State from the journal:
{progress}

Pick up where the previous session left off. Check git log and file state to orient yourself.
"""


# ── Git Operations ───────────────────────────────────────────────────────────


async def _git(args: list[str], cwd: str | Path | None = None) -> tuple[int, str, str]:
    """Run a git command, return (exit_code, stdout, stderr)."""
    proc = await asyncio.create_subprocess_exec(
        "git", *args,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return proc.returncode or 0, stdout.decode().strip(), stderr.decode().strip()


async def create_worktree(root: Path, branch_name: str) -> Path:
    """Create a git worktree for a worker."""
    worktree_dir = root / ".worktrees" / branch_name
    worktree_dir.parent.mkdir(parents=True, exist_ok=True)
    code, _, err = await _git(["worktree", "add", "-b", branch_name, str(worktree_dir)], cwd=root)
    if code != 0:
        _die(f"Failed to create worktree: {err}")
    return worktree_dir


async def remove_worktree(root: Path, worktree_path: Path) -> None:
    """Remove a git worktree."""
    await _git(["worktree", "remove", "--force", str(worktree_path)], cwd=root)


async def merge_to_integration(root: Path, worker_branch: str, integration_branch: str) -> tuple[bool, str]:
    """Merge worker branch into integration branch using a temporary worktree.

    Never touches the user's working tree — all merge work happens in a
    disposable worktree under .worktrees/.
    """
    # Ensure integration branch exists
    code, _, _ = await _git(["rev-parse", "--verify", integration_branch], cwd=root)
    if code != 0:
        await _git(["branch", integration_branch, "main"], cwd=root)

    # Create temporary worktree for the merge
    merge_wt = root / ".worktrees" / "_pm_merge"
    merge_wt.parent.mkdir(parents=True, exist_ok=True)
    # Clean up stale worktree if it exists
    if merge_wt.exists():
        await _git(["worktree", "remove", "--force", str(merge_wt)], cwd=root)
    code, _, err = await _git(["worktree", "add", str(merge_wt), integration_branch], cwd=root)
    if code != 0:
        return False, f"Failed to create merge worktree: {err}"

    try:
        code, out, err = await _git(
            ["merge", "--no-ff", worker_branch, "-m", f"Merge {worker_branch} into {integration_branch}"],
            cwd=merge_wt,
        )
        if code != 0:
            # Abort the failed merge in the worktree
            await _git(["merge", "--abort"], cwd=merge_wt)
            return False, err
        return True, out
    finally:
        await _git(["worktree", "remove", "--force", str(merge_wt)], cwd=root)


async def fast_forward_main(root: Path, integration_branch: str) -> tuple[bool, str]:
    """Fast-forward main to the integration branch tip.

    Uses git update-ref to avoid checking out main in the user's working tree.
    Only succeeds if main is an ancestor of the integration branch (true ff).
    """
    # Verify fast-forward is possible
    code, _, _ = await _git(["merge-base", "--is-ancestor", "main", integration_branch], cwd=root)
    if code != 0:
        return False, f"Cannot fast-forward: main is not an ancestor of {integration_branch}"

    # Get the integration branch tip
    _, tip_sha, _ = await _git(["rev-parse", integration_branch], cwd=root)
    if not tip_sha:
        return False, "Could not resolve integration branch"

    # Update main ref directly (no checkout needed)
    code, out, err = await _git(["update-ref", "refs/heads/main", tip_sha], cwd=root)
    if code != 0:
        return False, err
    return True, f"main updated to {tip_sha[:8]}"


async def get_head_sha(cwd: Path) -> str:
    _, sha, _ = await _git(["rev-parse", "HEAD"], cwd=cwd)
    return sha


# ── Gates ────────────────────────────────────────────────────────────────────


async def run_gate(command: str, cwd: Path, timeout: int) -> GateResult:
    """Run a gate command and return the result."""
    start = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        stdout_bytes, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        duration = time.monotonic() - start
        output = stdout_bytes.decode(errors="replace") if stdout_bytes else ""
        return GateResult(
            passed=(proc.returncode == 0),
            command=command,
            exit_code=proc.returncode or 0,
            output=output[-2000:],  # Truncate large output
            duration_s=round(duration, 2),
            timestamp=_now_iso(),
        )
    except asyncio.TimeoutError:
        duration = time.monotonic() - start
        return GateResult(
            passed=False,
            command=command,
            exit_code=-1,
            output=f"Gate timed out after {timeout}s",
            duration_s=round(duration, 2),
            timestamp=_now_iso(),
        )


# ── Cost Tracking ────────────────────────────────────────────────────────────


def record_cost(pm_dir: Path, entry: CostEntry) -> None:
    """Append a cost entry to the cost log."""
    _jsonl_append(pm_dir / COST_FILE, {
        "timestamp": entry.timestamp,
        "worker_id": entry.worker_id,
        "bead_id": entry.bead_id,
        "model": entry.model,
        "input_tokens": entry.input_tokens,
        "output_tokens": entry.output_tokens,
        "session_number": entry.session_number,
    })


def compute_cost_summary(pm_dir: Path) -> dict:
    """Compute cost summary from the cost log."""
    entries = _jsonl_read(pm_dir / COST_FILE)
    if not entries:
        return {"total_input_tokens": 0, "total_output_tokens": 0, "total_usd": 0.0, "by_model": {}, "by_bead": {}}

    total_in = sum(e.get("input_tokens", 0) for e in entries)
    total_out = sum(e.get("output_tokens", 0) for e in entries)

    by_model: dict[str, dict] = {}
    by_bead: dict[str, dict] = {}
    total_usd = 0.0

    for e in entries:
        model = e.get("model", "unknown")
        bead = e.get("bead_id", "unknown")
        inp, outp = e.get("input_tokens", 0), e.get("output_tokens", 0)

        costs = MODEL_COSTS.get(model, (3.0, 15.0))
        usd = (inp * costs[0] + outp * costs[1]) / 1_000_000
        total_usd += usd

        if model not in by_model:
            by_model[model] = {"input_tokens": 0, "output_tokens": 0, "usd": 0.0}
        by_model[model]["input_tokens"] += inp
        by_model[model]["output_tokens"] += outp
        by_model[model]["usd"] += usd

        if bead not in by_bead:
            by_bead[bead] = {"input_tokens": 0, "output_tokens": 0, "usd": 0.0, "sessions": 0}
        by_bead[bead]["input_tokens"] += inp
        by_bead[bead]["output_tokens"] += outp
        by_bead[bead]["usd"] += usd

    # Count sessions per bead
    for e in entries:
        bead = e.get("bead_id", "unknown")
        by_bead[bead]["sessions"] = max(by_bead[bead].get("sessions", 0), e.get("session_number", 1))

    return {
        "total_input_tokens": total_in,
        "total_output_tokens": total_out,
        "total_usd": round(total_usd, 4),
        "by_model": by_model,
        "by_bead": by_bead,
    }


def render_cost_dashboard(pm_dir: Path) -> str:
    """Render a human-readable cost dashboard."""
    s = compute_cost_summary(pm_dir)
    lines = ["Cost Dashboard", "=" * 50]

    if s["total_input_tokens"] == 0:
        lines.append("No cost data recorded yet.")
        return "\n".join(lines)

    lines.append(f"Total tokens: {s['total_input_tokens']:,} in / {s['total_output_tokens']:,} out")
    lines.append(f"Estimated cost: ${s['total_usd']:.4f}")
    lines.append("")

    if s["by_model"]:
        lines.append("By Model:")
        for model, data in s["by_model"].items():
            lines.append(f"  {model}: {data['input_tokens']:,} in / {data['output_tokens']:,} out (${data['usd']:.4f})")

    if s["by_bead"]:
        lines.append("\nBy Bead:")
        for bead, data in s["by_bead"].items():
            lines.append(f"  {bead}: {data['input_tokens']:,} in / {data['output_tokens']:,} out (${data['usd']:.4f}, {data['sessions']} sessions)")

    return "\n".join(lines)


# ── Spinning Detection ───────────────────────────────────────────────────────


def check_spinning(gate_results: list[dict]) -> str | None:
    """Check if recent gate results indicate spinning. Returns signal description or None."""
    if len(gate_results) < 3:
        return None

    recent = gate_results[-3:]
    # All must be failures
    if any(r.get("passed", True) for r in recent):
        return None

    # Check for identical failure output (normalized)
    outputs = [r.get("output", "").strip()[-500:] for r in recent]
    if len(set(outputs)) == 1:
        return f"Spinning: 3 identical gate failures — {outputs[0][:100]}..."

    return None


# ── Rotation ─────────────────────────────────────────────────────────────────


def should_rotate(tokens: int, limit: int) -> bool:
    """Check if the session should be rotated based on token count."""
    return tokens >= int(limit * 0.8)


# ── Worker Backend ───────────────────────────────────────────────────────────


class WorkerSession:
    """Represents a running worker session."""

    def __init__(self, proc: asyncio.subprocess.Process, worker_id: str):
        self.proc = proc
        self.worker_id = worker_id
        self.output_lines: list[str] = []
        self.token_count: int = 0

    @property
    def returncode(self) -> int | None:
        return self.proc.returncode


class WorkerBackend(Protocol):
    async def spawn(self, prompt: str, cwd: Path, model: str, worker_id: str) -> WorkerSession: ...
    async def wait(self, session: WorkerSession) -> tuple[int, str]: ...
    async def cancel(self, session: WorkerSession) -> None: ...


class ClaudeCLIBackend:
    """Worker backend using `claude -p` subprocess."""

    async def spawn(self, prompt: str, cwd: Path, model: str, worker_id: str) -> WorkerSession:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            "--model", model,
            "--output-format", "json",
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        return WorkerSession(proc, worker_id)

    async def wait(self, session: WorkerSession) -> tuple[int, str]:
        stdout, _stderr = await session.proc.communicate()
        output = stdout.decode(errors="replace") if stdout else ""
        # Parse JSON output from claude CLI for token counts
        try:
            result = json.loads(output)
            session.token_count = result.get("num_turns", 0) * 4000  # rough estimate
            text = result.get("result", output)
        except (json.JSONDecodeError, TypeError):
            text = output
        return session.proc.returncode or 0, text

    async def cancel(self, session: WorkerSession) -> None:
        if session.proc.returncode is None:
            session.proc.send_signal(signal.SIGINT)
            try:
                await asyncio.wait_for(session.proc.wait(), timeout=10)
            except asyncio.TimeoutError:
                session.proc.kill()


class AgentSDKBackend:
    """Worker backend using the Claude Agent SDK.

    NOTE: Phase 1 stub — currently shells out to `claude -p` identically to
    ClaudeCLIBackend. Requires claude-code-sdk to be installed as a signal that
    the user intends SDK-style usage. True SDK streaming integration (real token
    counts, native cancellation) is deferred to Phase 2.
    """

    def __init__(self) -> None:
        try:
            import claude_code_sdk  # noqa: F401
        except ImportError:
            _die("claude-code-sdk not installed. Use --backend=claude-cli or install with: pip install claude-code-sdk")

    async def spawn(self, prompt: str, cwd: Path, model: str, worker_id: str) -> WorkerSession:
        # Agent SDK uses a different async pattern; wrap in a subprocess-like interface
        # For Phase 1, we shell out to `claude` which the SDK provides
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            "--model", model,
            "--output-format", "json",
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        return WorkerSession(proc, worker_id)

    async def wait(self, session: WorkerSession) -> tuple[int, str]:
        stdout, _ = await session.proc.communicate()
        output = stdout.decode(errors="replace") if stdout else ""
        try:
            result = json.loads(output)
            text = result.get("result", output)
        except (json.JSONDecodeError, TypeError):
            text = output
        return session.proc.returncode or 0, text

    async def cancel(self, session: WorkerSession) -> None:
        if session.proc.returncode is None:
            session.proc.send_signal(signal.SIGINT)
            try:
                await asyncio.wait_for(session.proc.wait(), timeout=10)
            except asyncio.TimeoutError:
                session.proc.kill()


def get_backend(name: str) -> WorkerBackend:
    if name == "agent-sdk":
        return AgentSDKBackend()
    return ClaudeCLIBackend()


# ── Run Loop ─────────────────────────────────────────────────────────────────


def _get_bead_context(bead_id: str) -> str:
    """Get bead context from the beads CLI."""
    try:
        result = subprocess.run(
            ["bd", "show", bead_id], capture_output=True, text=True, timeout=10,
        )
        return result.stdout.strip() if result.returncode == 0 else f"Bead {bead_id} (could not load details)"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return f"Bead {bead_id} (bd CLI not available)"


def _poll_escalations(pm_dir: Path) -> list[dict]:
    """Poll the worker-escalations.jsonl file for new escalations from the worker.

    Uses rename-read-delete to avoid TOCTOU race with the worker appending.
    """
    esc_path = pm_dir / "worker-escalations.jsonl"
    if not esc_path.exists():
        return []
    tmp = esc_path.with_suffix(".reading")
    try:
        esc_path.rename(tmp)  # atomic on POSIX
    except FileNotFoundError:
        return []
    records = _jsonl_read(tmp)
    tmp.unlink(missing_ok=True)
    return records


async def run_bead(bead_id: str, config: PMConfig) -> None:
    """Main PM loop: spawn worker, monitor, handle escalations, merge on completion."""
    root = config.pm_dir.parent
    backend = get_backend(config.backend)

    # Check for existing active worker
    existing = find_active_worker(config.pm_dir)
    if existing and existing.bead_id == bead_id:
        print(f"Resuming worker {existing.id} for bead {bead_id} (status: {existing.status})")
        state = existing
    else:
        # Create new worker
        worker_id = f"w{int(time.time()) % 10000}"
        branch_name = f"pm/{worker_id}"

        print(f"Spawning worker {worker_id} for bead {bead_id}...")
        worktree_path = await create_worktree(root, branch_name)

        state = WorkerState(
            id=worker_id,
            bead_id=bead_id,
            worktree_path=str(worktree_path),
            worktree_branch=branch_name,
            status="spawning",
        )
        save_journal(config.pm_dir, state)

    bead_context = _get_bead_context(bead_id)

    # Create the escalation drop file in the worktree
    worktree = Path(state.worktree_path)
    esc_dir = worktree / PM_DIR
    esc_dir.mkdir(parents=True, exist_ok=True)

    # Build prompt (fresh or resume)
    if state.rotation_count > 0:
        prompt = build_resume_prompt(state, bead_context)
    else:
        prompt = build_worker_prompt(state, bead_context)

    state.status = "active"
    save_journal(config.pm_dir, state)

    print(f"Worker {state.id} active in {state.worktree_path}")
    print(f"Backend: {config.backend} | Model: {config.model}")
    print("Launching worker session...")

    # Spawn the worker
    session = await backend.spawn(prompt, worktree, config.model, state.id)

    # Monitor loop — poll for escalations and completion
    session_start = time.monotonic()
    poll_interval = 2.0  # seconds

    try:
        while True:
            # Check if worker finished
            if session.returncode is not None:
                break

            # Check for done (non-blocking wait with timeout)
            try:
                await asyncio.wait_for(asyncio.shield(session.proc.wait()), timeout=poll_interval)
                break  # Worker finished
            except asyncio.TimeoutError:
                pass  # Still running, continue monitoring

            # Poll for escalations from worker
            worker_escs = _poll_escalations(Path(state.worktree_path))
            for raw_esc in worker_escs:
                domain = raw_esc.get("domain", "implementation")
                esc = classify_escalation(
                    domain=domain,
                    subcategory=raw_esc.get("subcategory", "general"),
                    description=raw_esc.get("description", "No description"),
                    worker_id=state.id,
                    bead_id=bead_id,
                    archetype=config.archetype,
                )
                record_escalation(config.pm_dir, esc)

                if esc["tier"] == "Log":
                    pass  # Silent
                elif esc["tier"] == "Notify":
                    print(f"\n[NOTIFY] {domain}: {esc['description']}")
                elif esc["tier"] == "Block":
                    print(f"\n[BLOCK] {domain}: {esc['description']}")
                    print(f"  Escalation ID: {esc['id']}")
                    print(f"  Respond with: python pm.py respond {esc['id']} <action>")
                    state.pending_escalation = esc
                    state.status = "blocked"
                    save_journal(config.pm_dir, state)
                    # Cancel the worker while blocked
                    await backend.cancel(session)
                    print("\nWorker paused. Waiting for escalation response...")
                    print("Run 'python pm.py respond' to continue.")
                    return  # Exit run loop; user responds then reruns

            # Check spinning
            spinning_signal = check_spinning(state.gate_results)
            if spinning_signal:
                print(f"\n[SPINNING DETECTED] {spinning_signal}")
                esc = classify_escalation(
                    domain="implementation",
                    subcategory="spinning",
                    description=spinning_signal,
                    worker_id=state.id,
                    bead_id=bead_id,
                    archetype=config.archetype,
                )
                esc["tier"] = "Block"  # Always block on spinning
                record_escalation(config.pm_dir, esc)
                state.pending_escalation = esc
                state.status = "blocked"
                save_journal(config.pm_dir, state)
                await backend.cancel(session)
                print(f"  Escalation ID: {esc['id']}")
                return

    except KeyboardInterrupt:
        print("\nInterrupted. Saving state...")
        await backend.cancel(session)
        state.status = "suspended"
        save_journal(config.pm_dir, state)
        return

    # Worker completed
    exit_code, output = await backend.wait(session) if session.returncode is None else (session.returncode, "")
    elapsed = time.monotonic() - session_start

    # Propagate token count from session to state
    if session.token_count > 0:
        state.session_token_count = session.token_count
        state.bead_token_count += session.token_count

    # Record cost (use session tokens if available, else rough estimate)
    input_tokens = state.session_token_count or 50000
    record_cost(config.pm_dir, CostEntry(
        timestamp=_now_iso(),
        worker_id=state.id,
        bead_id=bead_id,
        model=config.model,
        input_tokens=input_tokens,
        output_tokens=input_tokens // 3 or 15000,
        session_number=state.rotation_count + 1,
    ))

    # Capture checkpoint
    sha = await get_head_sha(Path(state.worktree_path))
    if sha and sha != state.last_checkpoint_sha:
        state.commits.append(sha)
        state.last_checkpoint_sha = sha

    if exit_code == 0 or "DONE[" in str(output):
        print(f"\nWorker {state.id} completed bead {bead_id}")
        print(f"Duration: {elapsed:.0f}s")
        state.status = "completed"
        save_journal(config.pm_dir, state)

        # Run gate on worktree
        print(f"Running gate: {config.gate_command}")
        gate = await run_gate(config.gate_command, Path(state.worktree_path), config.gate_timeout)
        state.gate_results.append(asdict(gate))
        save_journal(config.pm_dir, state)

        if gate.passed:
            print("Gate passed. Merging to integration...")
            ok, msg = await merge_to_integration(root, state.worktree_branch, config.integration_branch)
            if ok:
                print(f"Merged {state.worktree_branch} -> {config.integration_branch}")
                # Run gate on integration
                int_gate = await run_gate(config.gate_command, root, config.gate_timeout)
                if int_gate.passed:
                    print("Integration gate passed. Fast-forwarding main...")
                    ok2, msg2 = await fast_forward_main(root, config.integration_branch)
                    if ok2:
                        print("main updated successfully.")
                    else:
                        print(f"Fast-forward failed: {msg2}")
                else:
                    print(f"Integration gate failed:\n{int_gate.output[:500]}")
            else:
                print(f"Merge failed: {msg}")
        else:
            print(f"Gate failed:\n{gate.output[:500]}")
            print("Fix issues and rerun, or merge manually.")
    else:
        print(f"\nWorker {state.id} exited with code {exit_code}")
        state.status = "crashed"
        save_journal(config.pm_dir, state)


# ── CLI ──────────────────────────────────────────────────────────────────────


def cmd_init(args: argparse.Namespace) -> None:
    root = Path.cwd()
    init_pm(root, args.name, args.archetype, args.backend)


def cmd_run(args: argparse.Namespace) -> None:
    config = PMConfig.load(Path.cwd())

    # Refuse to run if worker is blocked — human must respond first
    active = find_active_worker(config.pm_dir)
    if active and active.status == "blocked" and active.pending_escalation:
        esc = active.pending_escalation
        print(f"Worker {active.id} is blocked on escalation {esc.get('id')}:")
        print(f"  [{esc.get('domain')}] {esc.get('description', '')[:80]}")
        print(f"\nRespond first: python pm.py respond {esc.get('id')} <action>")
        print("Actions: approve-only | approve+relax | approve+tighten | reject | defer")
        sys.exit(1)

    asyncio.run(run_bead(args.bead_id, config))


def cmd_status(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")

    worker = find_active_worker(pm_dir)
    if not worker:
        # Check all workers
        workers_dir = pm_dir / WORKERS_DIR
        if not workers_dir.exists():
            print("No workers.")
            return
        any_found = False
        for wdir in sorted(workers_dir.iterdir()):
            if wdir.is_dir() and (wdir / "state.json").exists():
                w = load_journal(pm_dir, wdir.name)
                if w:
                    any_found = True
                    print(f"Worker {w.id}: {w.status} (bead: {w.bead_id})")
                    print(f"  Worktree: {w.worktree_path}")
                    print(f"  Commits: {len(w.commits)}")
                    print(f"  Rotations: {w.rotation_count}")
                    print(f"  Gate results: {len(w.gate_results)}")
        if not any_found:
            print("No workers.")
    else:
        print(f"Active worker: {worker.id}")
        print(f"  Bead: {worker.bead_id}")
        print(f"  Status: {worker.status}")
        print(f"  Worktree: {worker.worktree_path}")
        print(f"  Commits: {len(worker.commits)}")
        print(f"  Rotations: {worker.rotation_count}")
        if worker.pending_escalation:
            esc = worker.pending_escalation
            print(f"  Pending escalation: [{esc.get('domain')}] {esc.get('description', '')[:60]}")


def cmd_escalations(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")

    pending = load_pending_escalations(pm_dir)
    if not pending:
        print("No pending escalations.")
        return

    for esc in pending:
        print(f"\nID: {esc['id']}")
        print(f"  Domain: {esc.get('domain')} / {esc.get('subcategory', 'general')}")
        print(f"  Tier: {esc.get('tier')}")
        print(f"  Worker: {esc.get('worker')}")
        print(f"  Bead: {esc.get('bead')}")
        print(f"  Description: {esc.get('description')}")
        print(f"  Time: {esc.get('ts')}")
    print(f"\nRespond: python pm.py respond <id> approve-only|approve+relax|approve+tighten|reject|defer")


def cmd_respond(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")

    valid_actions = {"approve-only", "approve+relax", "approve+tighten", "reject", "defer"}
    if args.action not in valid_actions:
        _die(f"Invalid action '{args.action}'. Must be one of: {', '.join(sorted(valid_actions))}")

    updated = respond_to_escalation(pm_dir, args.escalation_id, args.action)
    if not updated:
        _die(f"Escalation '{args.escalation_id}' not found or already responded to.")

    print(f"Responded to {args.escalation_id}: {args.action}")
    print(f"  Domain: {updated.get('domain')} / {updated.get('subcategory')}")

    # Unblock the worker if it was waiting
    worker = find_active_worker(pm_dir)
    if worker and worker.status == "blocked" and worker.pending_escalation:
        if worker.pending_escalation.get("id") == args.escalation_id:
            if args.action == "reject":
                worker.failed_approaches.append(updated.get("description", ""))
            worker.pending_escalation = None
            worker.status = "active"
            worker.escalation_history.append(updated)
            save_journal(pm_dir, worker)
            print(f"Worker {worker.id} unblocked.")
            if args.action != "reject":
                print(f"Rerun: python pm.py run {worker.bead_id}")
            else:
                print(f"Worker will avoid: {updated.get('description', '')[:60]}")
                print(f"Rerun: python pm.py run {worker.bead_id}")


def cmd_cost(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")
    print(render_cost_dashboard(pm_dir))


def cmd_ledger(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")

    records = _jsonl_read(pm_dir / LEDGER_FILE)
    if not records:
        print("Decision ledger is empty.")
        return

    for rec in records:
        status = rec.get("human_response", "pending")
        tier_marker = {"Log": ".", "Notify": "~", "Block": "!!"}.get(rec.get("tier", ""), "?")
        print(f"[{tier_marker}] {rec.get('ts', '?')[:19]}  {rec.get('domain')}/{rec.get('subcategory', 'general')}")
        print(f"    {rec.get('description', '')[:80]}")
        print(f"    Worker: {rec.get('worker')} | Bead: {rec.get('bead')} | Response: {status}")


def cmd_shutdown(args: argparse.Namespace) -> None:
    pm_dir = _pm_dir()
    if not pm_dir.exists():
        _die("No .pm directory. Run 'pm init' first.")

    worker = find_active_worker(pm_dir)
    if not worker:
        print("No active worker to shut down.")
        return

    print(f"Shutting down worker {worker.id}...")
    worker.status = "suspended"
    save_journal(pm_dir, worker)
    print(f"Worker {worker.id} suspended. Worktree preserved at {worker.worktree_path}")
    print(f"Resume later with: python pm.py run {worker.bead_id}")


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="pm", description="Level 7.5 Project Manager — Phase 1 MVP",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command")

    # init
    p_init = sub.add_parser("init", help="Initialize PM state in .pm/")
    p_init.add_argument("--name", required=True, help="Project name")
    p_init.add_argument("--archetype", choices=["greenfield", "mature", "maintenance"], default="mature")
    p_init.add_argument("--backend", choices=["agent-sdk", "claude-cli"], default="claude-cli")
    p_init.set_defaults(func=cmd_init)

    # run
    p_run = sub.add_parser("run", help="Run PM for a bead")
    p_run.add_argument("bead_id", help="Bead ID to work on")
    p_run.set_defaults(func=cmd_run)

    # status
    p_status = sub.add_parser("status", help="Show worker status")
    p_status.set_defaults(func=cmd_status)

    # escalations
    p_esc = sub.add_parser("escalations", help="Show pending escalations")
    p_esc.set_defaults(func=cmd_escalations)

    # respond
    p_resp = sub.add_parser("respond", help="Respond to an escalation")
    p_resp.add_argument("escalation_id", help="Escalation ID")
    p_resp.add_argument("action", help="approve-only|approve+relax|approve+tighten|reject|defer")
    p_resp.set_defaults(func=cmd_respond)

    # cost
    p_cost = sub.add_parser("cost", help="Cost dashboard")
    p_cost.set_defaults(func=cmd_cost)

    # ledger
    p_ledger = sub.add_parser("ledger", help="Decision ledger")
    p_ledger.set_defaults(func=cmd_ledger)

    # shutdown
    p_shut = sub.add_parser("shutdown", help="Graceful shutdown")
    p_shut.set_defaults(func=cmd_shutdown)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)
    args.func(args)


if __name__ == "__main__":
    main()

// pointer-lock reference sketch: want derived every frame from named reasons; one request when want
// returns (exempt after our own release), then retries only while a click's activation lasts; our own
// releases never reported as losses; late grants given back. Strict TS, no dependencies. Adapt; don't import.

export type UnlockReason = 'screen' | 'map' | 'debug' | 'preview' | 'userPref';

/**
 * GRACE: corpus value, Hard Deck LOCK_GRACE_MS (300 ms); B here, test in SKILL.md rule 4.
 * RETRY: posture B. Test: escape, then click Resume at once; the lock returns within ~150 ms of the 1250 ms
 * cooldown ending. If retries flood the console, lengthen.
 */
const GRACE_MS = 300;
const RETRY_MS = 150;

export class PointerLock {
  /** Called on an involuntary loss after the lock had been held for GRACE_MS: wire to shell.requestAutoPause('lockLost'). */
  onLost: () => void = () => undefined;
  /** Called when a request can no longer succeed without a new click: show "Click to aim". */
  onNeedsClick: () => void = () => undefined;
  onChange: (locked: boolean) => void = () => undefined;

  private readonly reasons = new Set<UnlockReason>();
  private baseline = false;
  private wanted = false;
  private isLocked = false;
  private acquiredAt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pending = false; // one request in flight at a time (a Resume click can trigger two paths)
  private raw = true; // try unadjustedMovement until an engine rejects it
  private readonly supported: boolean;

  constructor(private readonly target: HTMLElement) {
    this.supported = 'pointerLockElement' in document && typeof target.requestPointerLock === 'function';
    document.addEventListener('pointerlockchange', () => {
      this.pending = false; // some engines settle via events only; never leave a request stuck in flight
      this.handleChange();
    });
    document.addEventListener('pointerlockerror', () => {
      this.pending = false;
      this.scheduleRetry();
    });
    target.addEventListener('click', (e) => {
      if (e instanceof PointerEvent && e.pointerType === 'touch') return; // never lock for touch
      this.onGesture();
    });
  }

  get locked(): boolean {
    return this.isLocked;
  }

  /** Each owner sets/clears its own reason; game-shell's onStackChange drives 'screen'. */
  setReason(r: UnlockReason, on: boolean): void {
    if (on) this.reasons.add(r);
    else this.reasons.delete(r);
    this.sync();
  }

  /** Call every frame (or on change) with: in play, option on, input is mouse. */
  setBaseline(b: boolean): void {
    this.baseline = b;
    this.sync();
  }

  /**
   * Call synchronously from every handler that should recapture: canvas click, Resume click,
   * Enter/Space on Resume. Requests inside the activation.
   */
  onGesture(): void {
    if (this.wanted && !this.isLocked) this.attempt();
  }

  private sync(): void {
    const want = this.supported && this.baseline && this.reasons.size === 0;
    if (want === this.wanted) return;
    this.wanted = want; // set BEFORE exiting, so our own release is never reported as a loss
    if (!want) {
      this.cancelRetry();
      // Programmatic exit: per the Pointer Lock spec the next request is exempt from the
      // activation requirement, so a menu the game opened can relock on resume without a click.
      if (this.isLocked) document.exitPointerLock();
    }
    // Always try once: after a programmatic exit this succeeds without a gesture. If it is refused,
    // the retry logic decides between waiting out a cooldown and asking for a click.
    else if (!this.isLocked) this.attempt();
  }

  /**
   * Raw input: NotSupportedError drops it for the session. Any other non-NotAllowed error retries
   * once without it, for that request only (Hard Deck's per-request fallback), so an engine that
   * rejects the option with an odd error still locks, and a transient error doesn't cost raw input.
   */
  private attempt(raw = this.raw): void {
    if (this.pending || this.isLocked) return;
    this.cancelRetry();
    this.pending = true;
    void this.request(raw).then(
      () => {
        this.pending = false;
      },
      (err: unknown) => {
        this.pending = false;
        const name = err instanceof DOMException ? err.name : '';
        if (raw && name === 'NotSupportedError') this.raw = false;
        // A refusal (cooldown, no activation) isn't about raw input. Chrome 154 reports its post-Esc
        // cooldown as SecurityError, not NotAllowedError (probe page, 2026-10-12).
        const refused = name === 'NotAllowedError' || name === 'SecurityError';
        if (raw && !refused) {
          this.attempt(false);
          return;
        }
        this.scheduleRetry(); // a refusal (cooldown, no activation) or a plain request failing
      },
    );
  }

  /** Retry only while the click's activation is still live; a retry without it can only fail. */
  private scheduleRetry(): void {
    if (!this.wanted || this.isLocked || this.retryTimer !== null) return;
    if (!activationLive()) {
      this.onNeedsClick();
      return;
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.wanted && !this.isLocked) this.attempt();
    }, RETRY_MS);
  }

  private cancelRetry(): void {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private async request(raw: boolean): Promise<void> {
    // async wrapper: some engines throw synchronously, and Firefox 150 returns no promise (errors only via the event)
    await (raw ? this.target.requestPointerLock({ unadjustedMovement: true }) : this.target.requestPointerLock());
  }

  private handleChange(): void {
    const was = this.isLocked;
    this.isLocked = document.pointerLockElement === this.target;
    if (!was && this.isLocked) {
      this.acquiredAt = performance.now();
      this.cancelRetry();
      if (!this.wanted) document.exitPointerLock(); // a late grant nobody wants: give it back
    }
    if (was !== this.isLocked) this.onChange(this.isLocked);
    if (was && !this.isLocked && this.wanted) {
      // A loss right after acquiring is the acquire-then-lose race: don't pause for it, but never
      // leave the game running with a free cursor either. Ask for a click; don't auto-retry: that
      // would re-grab the mouse ~1.3 s after a quick deliberate Esc, reversing the player's choice.
      if (performance.now() - this.acquiredAt >= GRACE_MS) this.onLost();
      else this.onNeedsClick();
    }
  }
}

function activationLive(): boolean {
  // Where UserActivation is missing, assume live and let the request's own rejection decide.
  return navigator.userActivation?.isActive ?? true;
}

/** Virtual cursor in input space: accumulate movement, clamp per event and to the viewport. */
export class VirtualCursor {
  x = 0;
  y = 0;
  /** Starting value (B): clamp per-event deltas at 200 px. VALIDATE: log the largest delta per OS. */
  constructor(
    private readonly sensitivity: () => number,
    private readonly maxDelta = 200,
  ) {
    window.addEventListener('pointermove', (e) => {
      if (document.pointerLockElement === null) {
        this.x = e.clientX;
        this.y = e.clientY;
        return;
      }
      const k = this.sensitivity();
      const dx = Math.max(-this.maxDelta, Math.min(this.maxDelta, e.movementX));
      const dy = Math.max(-this.maxDelta, Math.min(this.maxDelta, e.movementY));
      this.x = Math.max(0, Math.min(window.innerWidth, this.x + dx * k));
      this.y = Math.max(0, Math.min(window.innerHeight, this.y + dy * k));
    });
  }
}

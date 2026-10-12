// pointer-lock reference sketch: want derived every frame from named reasons, requests only from
// activation and retried while that activation lasts, our own releases never reported as losses,
// late grants given back. Strict TS, no dependencies. Adapt; don't import.

export type UnlockReason = 'screen' | 'map' | 'debug' | 'preview' | 'userPref';

/** Starting values. GRACE: posture C in Downwash (300 ms). RETRY: how often to retry while activation lasts (B). */
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
  private raw = true; // try unadjustedMovement until an engine rejects it
  private readonly supported: boolean;

  constructor(private readonly target: HTMLElement) {
    this.supported = 'pointerLockElement' in document && typeof target.requestPointerLock === 'function';
    document.addEventListener('pointerlockchange', () => this.handleChange());
    document.addEventListener('pointerlockerror', () => this.scheduleRetry());
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
      if (this.isLocked) document.exitPointerLock(); // programmatic exit: next request is exempt
    }
    // want became true without a gesture (e.g. a menu closed by Esc): we can only try if
    // activation is still live; otherwise ask for a click.
    else if (!this.isLocked) this.attemptOrAsk();
  }

  private attemptOrAsk(): void {
    if (activationLive()) this.attempt();
    else this.onNeedsClick();
  }

  private attempt(): void {
    this.cancelRetry();
    void this.request().then(
      () => undefined,
      (err: unknown) => {
        const name = err instanceof DOMException ? err.name : '';
        if (name !== 'NotAllowedError' && this.raw) {
          this.raw = false; // raw input unsupported here: plain requests from now on
          this.attempt();
          return;
        }
        this.scheduleRetry(); // NotAllowedError: cooldown or no activation
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
      if (this.wanted && !this.isLocked) this.attemptOrAsk();
    }, RETRY_MS);
  }

  private cancelRetry(): void {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private async request(): Promise<void> {
    // async wrapper: some older engines throw synchronously instead of rejecting
    await (this.raw ? this.target.requestPointerLock({ unadjustedMovement: true }) : this.target.requestPointerLock());
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
    if (was && !this.isLocked && this.wanted && performance.now() - this.acquiredAt >= GRACE_MS) this.onLost();
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

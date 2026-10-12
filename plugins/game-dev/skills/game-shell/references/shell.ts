// game-shell reference sketch: one owner for screens, Escape, auto-pause and fresh presses.
// DOM overlay over a canvas renderer. Strict TS, no dependencies. Adapt; don't import.
//
// Wiring this file assumes:
//   - each screen is a <dialog> in index.html (pause, options, death, ...)
//   - gameplay input reads `shell.ownsInput` and ignores keys while it is true
//   - the sim checks `shell.simPaused` before each fixed tick
//   - the pad is polled once per rendered frame and its edges passed to `shell.pad()`

export type AutoPauseReason = 'hidden' | 'blur' | 'overload' | 'lockLost' | 'padLost' | 'fullscreenExit';

export interface ShellHooks {
  /** True while a run is live (not title, not game over). */
  inPlay(): boolean;
  /** Remap capture (input-bindings) gets Esc first, to cancel itself. */
  capturing(): boolean;
  cancelCapture(): void;
  /** Drop held gameplay input so nothing ghost-holds after a screen closes. */
  clearHeldInput(): void;
  onResume(): void;
  /** Automation runs (?bot, ?perf) must not pause on an operator's alt-tab. */
  automation: boolean;
}

interface Screen {
  el: HTMLDialogElement;
  pausesSim: boolean;
  opener: Element | null;
  /** event.timeStamp / performance.now() of the open, for fresh-press checks. */
  openedAt: number;
  /** Pad buttons held when the screen opened; masked until released. */
  heldPad: Set<number>;
  /** Minimum ms before confirm is accepted (read-hold); 0 for most screens. */
  readHoldMs: number;
}

export interface OpenOptions {
  pausesSim?: boolean;
  readHoldMs?: number;
  heldPad?: Iterable<number>;
}

/** Starting value: posture C in Downwash (300 ms), logarithmic (250 ms). Test: lose lock with Esc; pause must stay open. */
const LATCH_GRACE_MS = 300;

export class Shell {
  private readonly stack: Screen[] = [];
  private readonly hooks: ShellHooks;
  private armed: HTMLButtonElement | null = null;
  /** Set once at boot: the dialog the latch, Esc and Start open. */
  pauseDialog: HTMLDialogElement | null = null;

  constructor(hooks: ShellHooks) {
    this.hooks = hooks;
    // The ONE Escape listener. Capture phase, so it runs before anything else and its
    // preventDefault() suppresses the browser's dialog close request (verified Chrome 152).
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.requestAutoPause('hidden');
    });
    window.addEventListener('blur', () => {
      // Focus moving into an in-page iframe (e.g. a captcha) is not the player leaving.
      if (document.activeElement instanceof HTMLIFrameElement) return;
      this.requestAutoPause('blur');
    });
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === null) this.requestAutoPause('fullscreenExit');
    });
  }

  get ownsInput(): boolean {
    return this.stack.length > 0;
  }

  get simPaused(): boolean {
    return this.stack.some((s) => s.pausesSim);
  }

  /** Register a dialog once. `cancel` covers close requests without a keydown (Android back). */
  register(el: HTMLDialogElement): void {
    el.addEventListener('cancel', (e) => {
      if (e.cancelable) e.preventDefault();
      if (this.top()?.el === el) this.back();
    });
    // If the browser closed it anyway (non-cancelable cancel), resync instead of drifting.
    el.addEventListener('close', () => {
      const i = this.stack.findIndex((s) => s.el === el);
      if (i !== -1) this.removeAt(i, false);
    });
  }

  open(el: HTMLDialogElement, opts: OpenOptions = {}, at = performance.now()): void {
    if (this.stack.some((s) => s.el === el)) return;
    this.disarm();
    this.hooks.clearHeldInput();
    this.stack.push({
      el,
      pausesSim: opts.pausesSim ?? true,
      opener: document.activeElement,
      openedAt: at,
      heldPad: new Set(opts.heldPad ?? []),
      readHoldMs: opts.readHoldMs ?? 0,
    });
    el.showModal();
  }

  /** Pop one level. Popping the pause screen resumes play. */
  back(): void {
    if (this.stack.length > 0) this.removeAt(this.stack.length - 1, true);
  }

  closeAll(): void {
    while (this.stack.length > 0) this.removeAt(this.stack.length - 1, false);
  }

  /** Every pause source calls this; none of them opens pause itself. Never auto-resumes. */
  requestAutoPause(reason: AutoPauseReason): void {
    const pause = this.pauseDialog;
    if (pause === null || !this.hooks.inPlay() || this.stack.length > 0) return;
    if (this.hooks.automation && (reason === 'blur' || reason === 'hidden')) return;
    this.open(pause, { pausesSim: true });
  }

  /** True when `input` may act on the top screen: the fresh-press guard, in one place. */
  isFresh(kind: 'key' | 'pad' | 'pointer', at: number, padButton = -1, repeat = false): boolean {
    const top = this.top();
    if (top === undefined) return true;
    if (repeat) return false; // a held key only repeats; a new press has repeat === false
    if (at < top.openedAt) return false; // the event that opened the screen, or a press from before it
    if (kind === 'pad' && top.heldPad.has(padButton)) return false;
    return at - top.openedAt >= top.readHoldMs;
  }

  /** Pad edges from this rendered frame. Release unmasks a button held at open. */
  pad(edges: { pressed: readonly number[]; released: readonly number[] }, at = performance.now()): void {
    const top = this.top();
    if (top === undefined) {
      if (edges.pressed.includes(PAD_START) && this.hooks.inPlay() && this.pauseDialog !== null) {
        this.open(this.pauseDialog, { heldPad: [PAD_START] }, at);
      }
      return;
    }
    for (const b of edges.released) top.heldPad.delete(b);
    for (const b of edges.pressed) {
      if (!this.isFresh('pad', at, b)) continue;
      if (b === PAD_B || (b === PAD_START && top.el === this.pauseDialog)) this.back();
    }
  }

  /** A destructive button needs a second activation; the first relabels it. Blur disarms. */
  confirming(el: HTMLButtonElement, ask: string, act: () => void): void {
    const label = el.textContent;
    el.addEventListener('click', () => {
      if (this.armed === el) {
        this.disarm();
        act();
        return;
      }
      this.disarm();
      this.armed = el;
      el.dataset['label'] = label;
      el.textContent = ask;
    });
    el.addEventListener('blur', () => {
      if (this.armed === el) this.disarm();
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.code !== 'Escape') return;
    e.preventDefault(); // always: Esc never reaches the browser's close-request path
    if (this.hooks.capturing()) {
      this.hooks.cancelCapture();
      return;
    }
    if (e.repeat) return;
    const top = this.top();
    if (top === undefined) {
      if (this.hooks.inPlay() && this.pauseDialog !== null) this.open(this.pauseDialog, {}, e.timeStamp);
      return;
    }
    // Any screen opened a moment ago ignores Esc: covers the pause the latch opened on lost
    // pointer lock (whose Esc the page may or may not also see) and a double-tapped Esc.
    if (e.timeStamp - top.openedAt < LATCH_GRACE_MS) return;
    this.back();
  }

  private removeAt(i: number, user: boolean): void {
    const [s] = this.stack.splice(i, 1);
    if (s === undefined) return;
    this.disarm();
    if (s.el.open) s.el.close();
    // Restore focus to whatever opened this screen, if it still exists.
    if (s.opener instanceof HTMLElement && s.opener.isConnected) s.opener.focus({ preventScroll: true });
    if (user && s.el === this.pauseDialog && this.stack.length === 0) this.hooks.onResume();
  }

  private top(): Screen | undefined {
    return this.stack.at(-1);
  }

  private disarm(): void {
    const el = this.armed;
    if (el === null) return;
    this.armed = null;
    el.textContent = el.dataset['label'] ?? el.textContent;
  }
}

// W3C Gamepad "standard" mapping indices.
const PAD_B = 1;
const PAD_START = 9;

/**
 * Call synchronously from the title's first key/pointer handler, before any await.
 * Gamepad input is not user activation: a pad-only start may stay silent, so say so.
 */
export function unlockOnGesture(ctx: AudioContext, onSilent: () => void): void {
  if (ctx.state !== 'running') {
    void ctx.resume().catch(() => undefined);
  }
  const retry = (): void => {
    if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  };
  // Keep the cheap check on every later gesture: some platforms suspend the context again
  // after backgrounding, so removing the listener once it runs would strand the next suspend.
  window.addEventListener('keydown', retry, true);
  window.addEventListener('pointerdown', retry, true);
  ctx.addEventListener('statechange', () => {
    if (ctx.state !== 'running') onSilent();
  });
}

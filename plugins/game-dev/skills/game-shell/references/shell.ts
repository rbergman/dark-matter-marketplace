// game-shell reference sketch: one owner for screens, Escape/Start/P, auto-pause and fresh presses.
// DOM overlay over a canvas renderer. Strict TS, no dependencies. Adapt; don't import.
//
// Wiring this file assumes:
//   - each screen is a <dialog> in index.html (pause, options, death, ...), its safe default marked
//     with `data-default`
//   - gameplay input reads `shell.ownsInput` and ignores keys while it is true
//   - the sim checks `shell.simPaused` before each fixed tick, and drops its accumulator on resume
//   - the pad is polled once per rendered frame and its edges passed to `shell.pad()`
//   - pointer-lock derives its want from `!shell.ownsInput` (an open screen is an unlock reason)

export type AutoPauseReason = 'hidden' | 'blur' | 'overload' | 'lockLost' | 'padLost' | 'fullscreenExit';

export interface PadEdges {
  pressed: readonly number[];
  released: readonly number[];
}

export interface ShellHooks {
  /** True while a run is live (not title, not game over). */
  inPlay(): boolean;
  /** Remap capture (input-bindings) gets every key and pad edge first; Esc and pad Start cancel it. */
  capturing(): boolean;
  captureKey(e: KeyboardEvent): void;
  capturePad(edges: PadEdges): void;
  cancelCapture(): void;
  /** True when `code` is bound to input-bindings' remappable `pause` action (default KeyP). Esc always pauses too. */
  isPauseKey(code: string): boolean;
  /** Drop held gameplay input so nothing ghost-holds after a screen closes. */
  clearHeldInput(): void;
  /** True when the last-used device is a pad (input-bindings' LastDevice). */
  lastDeviceIsPad(): boolean;
  /** Called on every push/pop: apply the pause duck, freeze view FX, etc. */
  onStackChange(state: { open: number; simPaused: boolean; topId: string | null }): void;
  onResume(): void;
  /** Automation runs (?bot, ?perf) must not pause on an operator's alt-tab. */
  automation: boolean;
}

interface Screen {
  el: HTMLDialogElement;
  /** Called on Esc/B before popping; return true when the screen handled it (an inventory cancelling a carry). */
  consumeBack: (() => boolean) | null;
  pausesSim: boolean;
  /** False for screens Esc/B must not close (death screen: it has its own Restart/Title). */
  dismissable: boolean;
  opener: Element | null;
  /** event.timeStamp / performance.now() of the open, for fresh-press checks. */
  openedAt: number;
  /** Pad buttons held when the screen opened; masked until released. */
  heldPad: Set<number>;
  /** Minimum ms before an activation is accepted (read-hold); 0 for most screens. */
  readHoldMs: number;
}

export interface OpenOptions {
  /** The screen's own first use of Back (cancel a carry, close a sub-panel). The ONLY per-screen Esc hook. */
  consumeBack?: () => boolean;
  pausesSim?: boolean;
  dismissable?: boolean;
  readHoldMs?: number;
  heldPad?: Iterable<number>;
}

/** Corpus value: logarithmic's 250 ms resume grace (player.ts); posture B here. Test: lose lock with Esc and pause stays
 * open; if a stray Esc still closes it, lengthen in 50 ms steps. */
export const ESC_GRACE_MS = 250;

export type EscDecision = 'capture' | 'ignore' | 'openPause' | 'back' | 'blocked';

/** The Esc decision as a pure function, so every branch is unit-testable (and mutation-checkable). */
export function escDecision(s: {
  capturing: boolean;
  repeat: boolean;
  open: number;
  inPlay: boolean;
  msSinceTopOpened: number;
  topDismissable: boolean;
}): EscDecision {
  if (s.capturing) return 'capture';
  if (s.repeat) return 'ignore';
  if (s.open === 0) return s.inPlay ? 'openPause' : 'ignore';
  if (s.msSinceTopOpened < ESC_GRACE_MS) return 'ignore';
  return s.topDismissable ? 'back' : 'blocked';
}

// W3C Gamepad "standard" mapping indices.
const PAD_A = 0;
const PAD_B = 1;
const PAD_START = 9;

/** Keys menus need: a pause binding never fires on these while a screen is open. */
const MENU_KEYS = new Set(['Enter', 'NumpadEnter', 'Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** Text fields keep their keys: P types a "p", a held Space types spaces. */
function isEditable(t: EventTarget | null): boolean {
  if (t instanceof HTMLTextAreaElement) return true;
  if (t instanceof HTMLElement && t.isContentEditable) return true;
  return t instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(t.type);
}

export class Shell {
  private readonly stack: Screen[] = [];
  private readonly hooks: ShellHooks;
  private armed: HTMLButtonElement | null = null;
  private lastPointerDown = -Infinity;
  /** Pad buttons currently down (from pad() edges): masked on every screen open. */
  private readonly padDown = new Set<number>();
  private ownFullscreenExit = false;
  /** Set once at boot: the dialog Esc, Start, P and the latch open. */
  pauseDialog: HTMLDialogElement | null = null;

  constructor(hooks: ShellHooks) {
    this.hooks = hooks;
    // The ONE keyboard router for shell keys. Capture phase on window, so it runs first; its
    // preventDefault() on Esc suppresses the browser's dialog close request (verified Chrome 152).
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
    window.addEventListener('pointerdown', (e) => (this.lastPointerDown = e.timeStamp), { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.requestAutoPause('hidden');
    });
    window.addEventListener('blur', () => {
      // Focus moving into an in-page iframe (e.g. a captcha) is not the player leaving.
      if (document.activeElement instanceof HTMLIFrameElement) return;
      this.requestAutoPause('blur');
    });
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement !== null) return;
      if (this.ownFullscreenExit) this.ownFullscreenExit = false; // the game's own toggle: not a "stop"
      else this.requestAutoPause('fullscreenExit');
    });
    window.addEventListener('gamepaddisconnected', () => {
      if (this.hooks.lastDeviceIsPad()) this.requestAutoPause('padLost');
    });
  }

  get ownsInput(): boolean {
    return this.stack.length > 0;
  }

  get simPaused(): boolean {
    return this.stack.some((s) => s.pausesSim);
  }

  /** Register each dialog once. */
  register(el: HTMLDialogElement): void {
    // Close requests that arrive without a keydown (Android back): route to back().
    el.addEventListener('cancel', (e) => {
      if (e.cancelable) e.preventDefault();
      const top = this.top();
      if (top?.el === el && top.dismissable) this.back();
    });
    // If the browser closed it anyway (non-cancelable cancel), resync instead of drifting;
    // a non-dismissable screen (death) is shown again, since it holds the only way forward.
    el.addEventListener('close', () => {
      const i = this.stack.findIndex((s) => s.el === el);
      if (i === -1) return;
      if (this.stack[i]?.dismissable === false) el.showModal();
      else this.removeAt(i, false);
    });
    // The fresh-press guard for native activation: a click from a press that began before the
    // screen opened, or inside its read-hold, never reaches the button.
    el.addEventListener(
      'click',
      (e) => {
        const top = this.top();
        if (top?.el !== el) return;
        const byPointer = e.detail > 0; // keyboard-synthesised clicks have detail 0
        const stale = byPointer && this.lastPointerDown < top.openedAt;
        if (stale || e.timeStamp - top.openedAt < top.readHoldMs) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }

  open(el: HTMLDialogElement, opts: OpenOptions = {}, at = performance.now()): void {
    if (this.stack.some((s) => s.el === el)) return;
    this.disarm();
    this.hooks.clearHeldInput();
    this.stack.push({
      el,
      consumeBack: opts.consumeBack ?? null,
      pausesSim: opts.pausesSim ?? true,
      dismissable: opts.dismissable ?? true,
      opener: document.activeElement,
      openedAt: at,
      heldPad: new Set([...this.padDown, ...(opts.heldPad ?? [])]),
      readHoldMs: opts.readHoldMs ?? 0,
    });
    el.showModal();
    focusDefault(el);
    this.changed();
  }

  /** Pop one level, unless the top screen consumes Back itself. Popping the pause screen resumes play. */
  back(): void {
    const top = this.top();
    if (top === undefined) return;
    if (top.consumeBack?.() === true) return;
    this.removeAt(this.stack.length - 1, true);
  }

  /** Call just before the game's own document.exitFullscreen(), so its fullscreenchange doesn't pause. */
  noteOwnFullscreenExit(): void {
    this.ownFullscreenExit = true;
  }

  closeAll(): void {
    while (this.stack.length > 0) this.removeAt(this.stack.length - 1, false);
  }

  /**
   * Every pause source calls this; none of them opens pause itself. Never auto-resumes.
   * A live side panel (pausesSim: false) does not protect the run, so pause opens over it.
   */
  requestAutoPause(reason: AutoPauseReason): void {
    const pause = this.pauseDialog;
    if (pause === null || !this.hooks.inPlay() || this.simPaused) return;
    if (this.hooks.automation && (reason === 'blur' || reason === 'hidden')) return;
    this.open(pause, { pausesSim: true });
  }

  /** Start and P: toggle pause. Opens it in play; with pause on the stack, closes down through it. */
  togglePause(at = performance.now(), heldPad: Iterable<number> = []): void {
    const pause = this.pauseDialog;
    if (pause === null) return;
    const i = this.stack.findIndex((s) => s.el === pause);
    if (i === -1) {
      if (this.hooks.inPlay() && !this.simPaused) this.open(pause, { heldPad }, at);
      return;
    }
    while (this.stack.length > i + 1) this.removeAt(this.stack.length - 1, false);
    this.back();
  }

  /** True when an input at `at` may act on the top screen: the fresh-press guard, in one place. */
  isFresh(at: number, padButton = -1, repeat = false): boolean {
    const top = this.top();
    if (top === undefined) return true;
    if (repeat || at < top.openedAt) return false;
    if (padButton >= 0 && top.heldPad.has(padButton)) return false;
    return at - top.openedAt >= top.readHoldMs;
  }

  /**
   * Pad edges from this rendered frame. Call FIRST each frame, before menu-navigation's D-pad
   * handling and before gameplay reads the pad. Release unmasks a button held at open.
   */
  pad(edges: PadEdges, at = performance.now()): void {
    for (const b of edges.pressed) this.padDown.add(b);
    for (const b of edges.released) this.padDown.delete(b);
    const top = this.top();
    // Releases unmask held-at-open buttons even during a capture, so no press is eaten later.
    if (top !== undefined) for (const b of edges.released) top.heldPad.delete(b);
    if (this.hooks.capturing()) {
      // Capture first, exactly as the keyboard path does. Start cancels; everything else binds.
      if (edges.pressed.includes(PAD_START)) this.hooks.cancelCapture();
      else this.hooks.capturePad(edges);
      return;
    }
    for (const b of edges.pressed) {
      if (b === PAD_START) {
        if (top === undefined || this.isFresh(at, b)) this.togglePause(at, [PAD_START]);
        continue;
      }
      if (top === undefined || !this.isFresh(at, b)) continue;
      if (b === PAD_B && top.dismissable) this.back();
      // A activates the focused control on its press edge (pointer-cancellation rules are about
      // pointers, not pads), here where the fresh-press guard lives. menu-navigation moves focus.
      if (b === PAD_A) {
        const f = document.activeElement;
        if (f instanceof HTMLElement && top.el.contains(f)) f.click();
      }
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
    if (this.hooks.capturing()) {
      // Capture owns the keyboard: no gameplay or menu listener may see this key. Esc cancels.
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.code === 'Escape') this.hooks.cancelCapture();
      else if (!e.repeat) this.hooks.captureKey(e);
      return;
    }
    const editable = isEditable(e.target);
    // A held Enter/Space must not re-activate (and so arm-then-confirm) a focused button.
    // preventDefault on the keydown blocks Enter activation (verified Chrome 152).
    if (
      this.ownsInput && e.repeat && !editable &&
      (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')
    ) {
      e.preventDefault();
      return;
    }
    if (e.code !== 'Escape') {
      // A pause binding never steals a key menus need while a screen is open.
      const menuKey = this.ownsInput && MENU_KEYS.has(e.code);
      if (!editable && !menuKey && this.hooks.isPauseKey(e.code) && !e.repeat) {
        e.preventDefault();
        this.togglePause(e.timeStamp);
      }
      return;
    }
    e.preventDefault(); // always: Esc never reaches the browser's close-request path
    const top = this.top();
    const d = escDecision({
      capturing: false,
      repeat: e.repeat,
      open: this.stack.length,
      inPlay: this.hooks.inPlay(),
      msSinceTopOpened: top === undefined ? Infinity : e.timeStamp - top.openedAt,
      topDismissable: top?.dismissable ?? true,
    });
    if (d === 'openPause' && this.pauseDialog !== null) this.open(this.pauseDialog, {}, e.timeStamp);
    else if (d === 'back') this.back();
  }

  private removeAt(i: number, user: boolean): void {
    const [s] = this.stack.splice(i, 1);
    if (s === undefined) return;
    this.disarm();
    if (s.el.open) s.el.close();
    // Restore focus to the opener; if it's gone, to the new top's default.
    if (s.opener instanceof HTMLElement && s.opener.isConnected) s.opener.focus({ preventScroll: true });
    else {
      const top = this.top();
      if (top !== undefined) focusDefault(top.el);
    }
    this.changed();
    if (user && s.el === this.pauseDialog && !this.simPaused) this.hooks.onResume();
  }

  private changed(): void {
    this.hooks.onStackChange({
      open: this.stack.length,
      simPaused: this.simPaused,
      topId: this.top()?.el.id ?? null,
    });
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

/** Focus the screen's declared safe default (data-default), else let showModal()'s choice stand. */
function focusDefault(el: HTMLDialogElement): void {
  el.querySelector<HTMLElement>('[data-default]')?.focus({ preventScroll: true });
}

/**
 * Call synchronously from the title's first key/pointer handler, before any await.
 * Gamepad input is not user activation: a pad-only start stays silent, so say so at once
 * (resume() without activation can stay pending forever, so waiting for statechange is not enough).
 */
export function unlockOnGesture(ctx: AudioContext, onSilent: () => void): void {
  const activated = navigator.userActivation?.isActive ?? true;
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  if (!activated && ctx.state !== 'running') onSilent();
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

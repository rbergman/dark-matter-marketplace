// hud-readouts reference sketch: interpolation, a pausable view clock, write-on-change text,
// edge-arrow placement, shortest-arc easing, and a tiered toast queue. Strict TS, no dependencies.
// Adapt; don't import. Placement, easing and the queue are pure and unit-testable.

// ---- Interpolation ---------------------------------------------------------------------------

/** World-anchored HUD reads the same alpha the world renderer used this frame (alpha = acc / STEP). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---- A pausable view clock: HUD time is seconds, frozen while the sim is paused ------------

export class ViewClock {
  /** Seconds of unpaused view time. */
  t = 0;
  /** Starting value (B): clamp a frame's dt at 0.1 s so a returning tab doesn't skip every timer. */
  constructor(private readonly maxDt = 0.1) {}
  /** Call once per rendered frame with real elapsed seconds; returns the dt HUD timers should use. */
  tick(realDt: number, simPaused: boolean): number {
    if (simPaused) return 0;
    const dt = Math.min(Math.max(realDt, 0), this.maxDt);
    this.t += dt;
    return dt;
  }
}

// ---- Write-on-change DOM text ----------------------------------------------------------------

export class TextCache {
  private readonly last = new WeakMap<Element, string>();
  set(el: Element, text: string): void {
    if (this.last.get(el) === text) return;
    this.last.set(el, text);
    el.textContent = text;
  }
}

// ---- Edge arrows -----------------------------------------------------------------------------

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Where a target at screen point (tx, ty) gets drawn. `safe` is the viewport minus HUD insets
 * (timberwolf's hudInset). `margin` widens "on screen" so arrows don't flicker at the edge
 * (Downwash: 40 px, posture C). `behind` is true when a 3-D projection had w < 0.
 */
export function placeIndicator(
  tx: number,
  ty: number,
  safe: Rect,
  margin: number,
  behind = false,
): { onScreen: true; x: number; y: number } | { onScreen: false; x: number; y: number; angle: number } {
  const cx = (safe.left + safe.right) / 2;
  const cy = (safe.top + safe.bottom) / 2;
  let dx = tx - cx;
  let dy = ty - cy;
  if (behind) {
    dx = -dx; // a point behind the camera projects mirrored: flip before placing
    dy = -dy;
  }
  const inside =
    !behind &&
    tx >= safe.left - margin && tx <= safe.right + margin &&
    ty >= safe.top - margin && ty <= safe.bottom + margin;
  if (inside) return { onScreen: true, x: tx, y: ty };
  if (dx === 0 && dy === 0) dy = 1;
  // Scale the ray from centre to just touch the safe rectangle.
  const hw = (safe.right - safe.left) / 2;
  const hh = (safe.bottom - safe.top) / 2;
  const s = Math.min(dx !== 0 ? hw / Math.abs(dx) : Infinity, dy !== 0 ? hh / Math.abs(dy) : Infinity);
  return { onScreen: false, x: cx + dx * s, y: cy + dy * s, angle: Math.atan2(dy, dx) };
}

/** Ease an angle toward a target along the shortest arc. rate: radians per second (posture B/C per game). */
export function easeAngle(current: number, target: number, rate: number, dt: number): number {
  let d = target - current;
  d = Math.atan2(Math.sin(d), Math.cos(d)); // wrap to (-π, π]
  const step = rate * dt;
  return Math.abs(d) <= step ? target : current + Math.sign(d) * step;
}

// ---- Toast queue (after timberwolf's radio-queue) ------------------------------------------

export type Tier = 'now' | 'next' | 'chatter';
const RANK: Readonly<Record<Tier, number>> = { now: 0, next: 1, chatter: 2 };

export interface Toast {
  text: string;
  tier: Tier;
  /** Seconds left on screen once shown. */
  left?: number;
}

/** Starting values (B): hold 2 s + 60 ms/char; CHATTER_MAX is posture C in timberwolf (6). */
export const CHATTER_MAX = 6;
export const holdFor = (text: string, scale = 1): number => (2 + 0.06 * text.length) * scale;

export class ToastQueue {
  readonly queue: Toast[] = [];
  current: Toast | null = null;

  constructor(private readonly holdScale: () => number = () => 1) {}

  push(t: Toast): void {
    // De-duplicate: the same line on screen or already waiting is not queued again.
    if (this.current?.text === t.text || this.queue.some((q) => q.text === t.text)) return;
    // An alert cuts in on anything but another alert; the cut toast returns to the head of its tier.
    if (t.tier === 'now' && this.current !== null && this.current.tier !== 'now') {
      const cut: Toast = { text: this.current.text, tier: this.current.tier }; // re-shown with a fresh hold
      this.current = null;
      this.insert(cut, true);
    }
    if (t.tier === 'chatter') {
      const chatter = this.queue.filter((q) => q.tier === 'chatter');
      if (chatter.length >= CHATTER_MAX) {
        const oldest = chatter[0];
        if (oldest !== undefined) this.queue.splice(this.queue.indexOf(oldest), 1);
      }
    }
    this.insert(t, false);
  }

  /** dt from the ViewClock: 0 while paused, so toasts freeze with the game. */
  tick(dt: number): Toast | null {
    if (this.current !== null) {
      this.current.left = (this.current.left ?? 0) - dt;
      if (this.current.left <= 0) this.current = null;
    }
    if (this.current === null) {
      const next = this.queue.shift();
      if (next !== undefined) this.current = { ...next, left: holdFor(next.text, this.holdScale()) };
    }
    return this.current;
  }

  /** XAG 116: an input dismisses the current toast. */
  dismiss(): void {
    this.current = null;
  }

  private insert(t: Toast, atHead: boolean): void {
    const r = RANK[t.tier];
    const at = this.queue.findIndex((q) => (atHead ? RANK[q.tier] >= r : RANK[q.tier] > r));
    this.queue.splice(at < 0 ? this.queue.length : at, 0, t);
  }
}

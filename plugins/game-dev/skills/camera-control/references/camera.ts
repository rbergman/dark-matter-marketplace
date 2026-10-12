// camera-control reference sketch: a pure target ("where it wants to be") eased by a separate mover
// ("how it gets there"); zoom as a product of named factors; combat framing; an aim lead on its own
// clock; shake only at apply; one pair of conversions. From ice-pirates src/view/camera.ts and
// src/app/focus.ts, and redshifted src/rendering/camera-math.ts (2026-10-12). Heading-follow is not in
// either game: UNSOURCED, marked below. Strict TS, no dependencies. Adapt; don't import.

export interface Pt {
  x: number;
  y: number;
}

/** What the game wants this frame. Pure: built from sim state, never from the camera's own state. */
export interface CameraTarget extends Pt {
  zoom: number;
  /** Points that must stay on screen (every threat that has the player in range). */
  frame: readonly Pt[];
  /** Radians; used only in heading-follow mode. */
  heading: number;
}

/** Fraction of the gap closed this frame at `rate` per second, at any frame rate. */
export function damp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/**
 * Exact critically damped spring (redshifted's springDamperExact; Daniel Holden, "Spring-It-On").
 * Carries velocity, so kicks and zoom pulses can be impulses. `halflife` in seconds is the tuning unit.
 */
export function spring(pos: number, vel: number, goal: number, halflife: number, dt: number): [number, number] {
  const y = halflife > 1e-5 ? (2 * Math.LN2) / halflife : 100;
  const j0 = pos - goal;
  const j1 = vel + j0 * y;
  const e = Math.exp(-y * dt);
  return [e * (j0 + j1 * dt) + goal, e * (vel - j1 * y * dt)];
}

export interface CameraSettings {
  /** Player's base zoom multiplier. Redshifted's slider spans 0.5625..1.25, default 0.75. */
  baseZoom: number;
  /** Follow halflife, s. Redshifted's "lag" slider spans 0.02..0.25. */
  halflife: number;
  /** 'north' (default) or 'heading' (UNSOURCED: rotate with the player). */
  orient: 'north' | 'heading';
  /** 0..1, already 0 under reduced motion (settings-and-persistence resolves it). */
  shake: number;
}

/** HUD margins, px: a framed point stays clear of them. Corpus values (ice-pirates). */
const MARGIN_X = 120;
const MARGIN_Y = 150;
const POINT_PAD = 40;
/** The framing floor: sized from the LONGEST threat range on the SMALLEST supported window. */
const ZOOM_FLOOR = 0.4;

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  angle = 0;
  w = 1;
  h = 1;
  /** Wheel offset on top of the base zoom, multiplicative. ice-pirates clamps 0.45..1.8. */
  userZoom = 1;
  private vx = 0;
  private vy = 0;
  private trauma = 0;
  private sx = 0;
  private sy = 0;

  constructor(private readonly settings: () => CameraSettings) {}

  /** New run, respawn, teleport: no spring from the last position. */
  snap(p: Pt): void {
    this.x = p.x;
    this.y = p.y;
    this.vx = this.vy = 0;
  }

  /** A velocity impulse (recoil kick): the spring carries it, the target doesn't move. */
  kick(dx: number, dy: number): void {
    this.vx += dx;
    this.vy += dy;
  }

  addTrauma(a: number): void {
    this.trauma = Math.min(1, this.trauma + a);
  }

  /** dt is 0 while paused or in hit-stop; the caller decides. `noise` in -1..1, seeded (game-feel). */
  follow(t: CameraTarget, dt: number, noise: (ch: number) => number): void {
    const s = this.settings();
    [this.x, this.vx] = spring(this.x, this.vx, t.x, s.halflife, dt);
    [this.y, this.vy] = spring(this.y, this.vy, t.y, s.halflife, dt);
    // Same width of world on a phone and an ultrawide (ice-pirates' screen factor).
    const screen = Math.min(1.4, Math.max(0.6, Math.min(this.w, this.h * 1.6) / 1440));
    let z = t.zoom * s.baseZoom * this.userZoom * screen;
    for (const p of t.frame) z = Math.min(z, this.fit(t, p)); // fit only ever caps the zoom
    this.zoom += (z - this.zoom) * damp(1.6, dt); // zoom eases slower than position, on purpose
    if (s.orient === 'heading') {
      // UNSOURCED. Shortest arc, eased slowly; the view rotates so the player's heading points up.
      const goal = -t.heading - Math.PI / 2;
      const d = Math.atan2(Math.sin(goal - this.angle), Math.cos(goal - this.angle));
      this.angle += d * damp(2, dt);
    } else this.angle = 0;
    this.trauma = Math.max(0, this.trauma - dt); // ~1 s from full; see game-feel's budgets
    const amp = 15 * this.trauma * this.trauma * s.shake;
    this.sx = amp * noise(0);
    this.sy = amp * noise(1);
  }

  /** Largest zoom keeping `p` on screen around `c`, clear of the HUD; never below the floor. */
  private fit(c: Pt, p: Pt): number {
    let dx = Math.abs(p.x - c.x);
    let dy = Math.abs(p.y - c.y);
    if (this.angle !== 0) {
      // A rotated view: fit the point's distance in screen axes (either axis can carry it).
      const r = Math.hypot(dx, dy);
      dx = dy = r;
    }
    return Math.max(ZOOM_FLOOR, Math.min((this.w / 2 - MARGIN_X) / (dx + POINT_PAD), (this.h / 2 - MARGIN_Y) / (dy + POINT_PAD)));
  }

  /**
   * What is on screen, in world units, as an axis-aligned box: the input to fair fire and culling.
   * With rotation, the box bounds the rotated screen, so it errs toward "seen".
   */
  view(): { x: number; y: number; hw: number; hh: number } {
    const hw = this.w / 2 / this.zoom;
    const hh = this.h / 2 / this.zoom;
    const c = Math.abs(Math.cos(this.angle));
    const s = Math.abs(Math.sin(this.angle));
    return { x: this.x, y: this.y, hw: hw * c + hh * s, hh: hw * s + hh * c };
  }

  /** World -> screen, shake included: for drawing and the HUD (compass, edge arrows, markers). */
  toScreen(p: Pt): Pt {
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    const dx = (p.x - this.x) * this.zoom;
    const dy = (p.y - this.y) * this.zoom;
    return { x: dx * c - dy * s + this.w / 2 + this.sx, y: dx * s + dy * c + this.h / 2 + this.sy };
  }

  /** Screen -> world, shake EXCLUDED (redshifted): shake must never move the aim point. */
  toWorld(p: Pt): Pt {
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    const dx = (p.x - this.w / 2) / this.zoom;
    const dy = (p.y - this.h / 2) / this.zoom;
    return { x: this.x + dx * c + dy * s, y: this.y - dx * s + dy * c };
  }
}

/**
 * The look-toward-aim offset, on its own slow clock (ice-pirates' AimLead). Frozen while paused, and while
 * the pointer is outside the window unless the last device is a pad: a pointer that re-enters elsewhere
 * would otherwise yank the view.
 */
export class AimLead implements Pt {
  x = 0;
  y = 0;

  update(from: Pt, aim: Pt, frozen: boolean, dt: number): void {
    if (frozen) return;
    const k = damp(1.6, dt);
    this.x += (Math.max(-110, Math.min(110, (aim.x - from.x) * 0.15)) - this.x) * k;
    this.y += (Math.max(-110, Math.min(110, (aim.y - from.y) * 0.15)) - this.y) * k;
  }
}

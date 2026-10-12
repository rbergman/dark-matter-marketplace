// touch-controls reference sketch: floating twin sticks on pointer events. A thumb landing on the left half
// spawns the move stick under it, the right half the aim stick; the aim stick fires past FIRE_AT. Each stick
// owns one pointerId; every way a touch can end releases it. Adapted from Hard Deck src/view/touch.ts
// (2026-10-12). Release on hide and blur, and destroy(), are ADDED. Strict TS, no deps.

/** Corpus values (Hard Deck); posture B for your game. Checks: SKILL.md's verification checklist. */
export const RADIUS = 60; // CSS px of knob travel at full deflection
export const DEAD = 0.12; // fraction of travel ignored, so a resting thumb doesn't drift
export const FIRE_AT = 0.5; // aim-stick deflection that also fires

export interface Vec {
  x: number;
  y: number;
}

/** Thumb offset (px) -> 0..1 vector. Zero in the dead zone; rescaled beyond it, so output starts at 0 (no jump). */
export function stickVector(dx: number, dy: number, out: Vec): Vec {
  const dist = Math.hypot(dx, dy);
  const m = Math.min(1, dist / RADIUS);
  if (m <= DEAD || dist === 0) {
    out.x = out.y = 0;
    return out;
  }
  const k = (m - DEAD) / (1 - DEAD) / dist;
  out.x = dx * k;
  out.y = dy * k;
  return out;
}

export class Stick {
  id = -1;
  readonly v: Vec = { x: 0, y: 0 };
  /** Base position (where the thumb landed), for drawing. */
  ox = 0;
  oy = 0;

  get held(): boolean {
    return this.id !== -1;
  }

  get mag(): number {
    return Math.hypot(this.v.x, this.v.y);
  }

  down(id: number, x: number, y: number): void {
    this.id = id;
    this.ox = x;
    this.oy = y;
    this.v.x = this.v.y = 0;
  }

  move(x: number, y: number): void {
    let dx = x - this.ox;
    let dy = y - this.oy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      // The base follows a thumb dragged past the rim, so the stick never "runs out".
      this.ox = x - (dx / d) * RADIUS;
      this.oy = y - (dy / d) * RADIUS;
      dx = x - this.ox;
      dy = y - this.oy;
    }
    stickVector(dx, dy, this.v);
  }

  up(): void {
    this.id = -1;
    this.v.x = this.v.y = 0;
  }
}

export class TwinStick {
  readonly left = new Stick();
  readonly right = new Stick();
  /**
   * Touch play is on after any touch, off after a real mouse move. The pad path must clear it too (Hard
   * Deck's padEndsTouch), or an idle touch aim overwrites the pad's aim: call endTouch() on pad input.
   */
  usingTouch = false;
  private readonly ac = new AbortController();

  constructor(surface: HTMLElement, win: Window = window, doc: Document = document) {
    const signal = this.ac.signal;
    win.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') this.usingTouch = true;
      },
      { capture: true, signal },
    );
    surface.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      // Suppresses the compatibility mousedown/mouseup only. `click` still fires: click handlers check pointerType.
      e.preventDefault();
      const stick = e.clientX < win.innerWidth / 2 ? this.left : this.right;
      if (!stick.held) stick.down(e.pointerId, e.clientX, e.clientY); // a second finger on a held half is ignored
    }, { signal });
    win.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        this.usingTouch = false;
        return;
      }
      if (e.pointerId === this.left.id) this.left.move(e.clientX, e.clientY);
      else if (e.pointerId === this.right.id) this.right.move(e.clientX, e.clientY);
    }, { signal });
    const release = (e: PointerEvent): void => {
      if (e.pointerId === this.left.id) this.left.up();
      else if (e.pointerId === this.right.id) this.right.up();
    };
    win.addEventListener('pointerup', release, { signal });
    win.addEventListener('pointercancel', release, { signal }); // a phone call, a system gesture, a palm
    // A hidden page may never deliver the pointerup; drop every stick so nothing stays held.
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) this.releaseAll();
    }, { signal });
    win.addEventListener('blur', () => this.releaseAll(), { signal });
  }

  /** A remounting UI (React, a restart) must remove the old listeners, or stale sticks read every touch. */
  destroy(): void {
    this.ac.abort();
    this.releaseAll();
  }

  endTouch(): void {
    this.usingTouch = false;
    this.releaseAll();
  }

  get move(): Vec {
    return this.left.v;
  }

  /** Zero when released or resting: the consumer keeps the last non-zero aim, or the turret snaps (Hard Deck). */
  get aim(): Vec {
    return this.right.v;
  }

  /** Fire while the aim stick is pushed past the threshold; below it the stick aims without firing. */
  get firing(): boolean {
    return this.right.mag >= FIRE_AT;
  }

  releaseAll(): void {
    this.left.up();
    this.right.up();
  }
}

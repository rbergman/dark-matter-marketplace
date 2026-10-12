// menu-navigation reference sketch: one move() for every directional input, one highlight,
// stick repeat for pads. DOM menus over a canvas. Strict TS, no dependencies. Adapt; don't import.

export type Dir = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), [data-nav]';

/** Visible, enabled, navigable items inside the top screen, in DOM order. */
export function items(screen: HTMLElement): HTMLElement[] {
  return [...screen.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  );
}

/** Focus the screen's declared safe default (data-default), else its first item. */
export function focusDefault(screen: HTMLElement): void {
  const el = screen.querySelector<HTMLElement>('[data-default]') ?? items(screen)[0];
  setHighlight(screen, el ?? null);
}

/** Lists wrap; grids (data-grid on the screen) move spatially and stop at edges (XAG 112). */
export function move(screen: HTMLElement, dir: Dir): void {
  const all = items(screen);
  if (all.length === 0) return;
  const cur = document.activeElement instanceof HTMLElement && all.includes(document.activeElement)
    ? document.activeElement
    : null;
  if (cur === null) {
    focusDefault(screen);
    return;
  }
  if (screen.dataset['grid'] !== undefined) {
    setHighlight(screen, spatial(all, cur, dir) ?? cur);
    return;
  }
  if (dir === 'left' || dir === 'right') {
    // A focused slider takes left/right; elsewhere in a list they do nothing.
    if (cur instanceof HTMLInputElement && cur.type === 'range') step(cur, dir === 'right' ? 1 : -1);
    return;
  }
  const i = all.indexOf(cur);
  const n = all.length;
  setHighlight(screen, all[(i + (dir === 'down' ? 1 : -1) + n) % n] ?? cur);
}

/** Nearest item whose centre lies in `dir`. Starting value: weight 2 on the orthogonal axis. */
const ORTHO_WEIGHT = 2;

function spatial(all: HTMLElement[], cur: HTMLElement, dir: Dir): HTMLElement | null {
  const a = centre(cur);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of all) {
    if (el === cur) continue;
    const b = centre(el);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const primary = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
    if (primary <= 0) continue;
    const ortho = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + ORTHO_WEIGHT * ortho;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

function centre(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Pad step on a range input, firing `input` AND `change` as native arrow keys do (settings saves on change). */
function step(el: HTMLInputElement, by: 1 | -1): void {
  if (by > 0) el.stepUp();
  else el.stepDown();
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * One highlight: a class the nav layer owns, plus real focus. The class shows the ring even when
 * the browser's focus-visible heuristic would hide it (focus moved by pad code after a click).
 */
export function setHighlight(screen: HTMLElement, el: HTMLElement | null): void {
  if (el === null) return;
  el.focus({ preventScroll: true }); // wireHighlight's focusin moves the class
  el.scrollIntoView({ block: 'nearest' });
}

/**
 * The highlight class follows real focus, whoever moved it (this file, game-shell's restore,
 * showModal's autofocus, a Tab). One listener per screen; no other code touches `.hl`.
 */
export function wireHighlight(screen: HTMLElement): void {
  screen.addEventListener('focusin', (e) => {
    for (const old of screen.querySelectorAll('.hl')) old.classList.remove('hl');
    if (e.target instanceof HTMLElement) e.target.classList.add('hl');
  });
}

/** Mouse moves the same highlight; the next key continues from here. Not while pointer-locked. */
export function wireHover(screen: HTMLElement): void {
  screen.addEventListener('pointerover', (e) => {
    if (document.pointerLockElement !== null) return;
    // Don't steal focus from a text field (initials entry) or a live remap capture. The Controls
    // screen sets data-capturing on itself while input-bindings' capture is live.
    const a = document.activeElement;
    const textLike = a instanceof HTMLInputElement && ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(a.type);
    if (a instanceof HTMLTextAreaElement || textLike) return;
    if (screen.dataset['capturing'] !== undefined) return;
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>(FOCUSABLE) : null;
    if (target !== null && screen.contains(target)) setHighlight(screen, target);
  });
}

/** Rebuild-safe refresh: remember the focused item's data-id, refocus it after the rebuild. */
export function rebuildKeepingFocus(screen: HTMLElement, rebuild: () => void): void {
  const id = document.activeElement instanceof HTMLElement ? document.activeElement.dataset['id'] : undefined;
  rebuild();
  if (id === undefined) return;
  const again = screen.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
  if (again !== null) setHighlight(screen, again);
}

/**
 * Left-stick navigation with hold-to-repeat. Call every rendered frame with the stick axes.
 * Starting values (posture B): threshold 0.5, first repeat 400 ms, then every 100 ms.
 * Test: a player stops on the intended item 9/10 times in a 12-item list; overshoot -> longer repeat.
 */
export class StickRepeat {
  private held: Dir | null = null;
  private nextAt = 0;

  constructor(
    private readonly threshold = 0.5,
    private readonly firstMs = 400,
    private readonly repeatMs = 100,
  ) {}

  /** Returns the direction to move this frame, or null. */
  update(x: number, y: number, now: number): Dir | null {
    const dir = this.dirOf(x, y);
    if (dir === null) {
      this.held = null;
      return null;
    }
    if (dir !== this.held) {
      this.held = dir;
      this.nextAt = now + this.firstMs;
      return dir;
    }
    if (now >= this.nextAt) {
      this.nextAt = now + this.repeatMs;
      return dir;
    }
    return null;
  }

  private dirOf(x: number, y: number): Dir | null {
    if (Math.max(Math.abs(x), Math.abs(y)) < this.threshold) return null;
    if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
    return y > 0 ? 'down' : 'up';
  }
}

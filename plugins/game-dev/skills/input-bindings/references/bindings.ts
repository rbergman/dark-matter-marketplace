// input-bindings reference sketch: action map on KeyboardEvent.code, swap-with-undo remapping,
// merge-on-load, gamepad edges and deadzones, prompts for the last-used device.
// Strict TS, no dependencies. Adapt; don't import. The pure functions are unit-testable as-is.

// ---- The action map ------------------------------------------------------------------------

export type Action = 'up' | 'down' | 'left' | 'right' | 'fire' | 'jump' | 'sprint' | 'pause';
export type Context = 'play' | 'menu';

export interface ActionDef {
  kind: 'press' | 'hold';
  context: Context;
}

export const ACTIONS: Readonly<Record<Action, ActionDef>> = {
  up: { kind: 'hold', context: 'play' },
  down: { kind: 'hold', context: 'play' },
  left: { kind: 'hold', context: 'play' },
  right: { kind: 'hold', context: 'play' },
  fire: { kind: 'hold', context: 'play' },
  jump: { kind: 'press', context: 'play' },
  sprint: { kind: 'hold', context: 'play' },
  /** game-shell's isPauseKey() reads this; Esc always pauses as well and can't be bound. */
  pause: { kind: 'press', context: 'play' },
};

/** Two keyboard slots per action, by KeyboardEvent.code. null = empty slot. */
export type Slots = readonly [string | null, string | null];
export type KeyMap = Readonly<Record<Action, Slots>>;

export const DEFAULTS: KeyMap = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  fire: ['Space', null],
  jump: ['KeyE', null],
  sprint: ['ShiftLeft', null],
  pause: ['KeyP', null],
};

/**
 * Refused with a reason. Esc belongs to game-shell. Tab is NOT reserved: menus own input while
 * open, so Tab is free for play (keep HUD buttons out of the tab order with tabindex="-1").
 */
export const RESERVED: ReadonlyMap<string, string> = new Map([
  ['Escape', 'Esc is reserved for menus'],
  ['F5', 'F5 reloads the page'],
  ['F11', 'F11 is the browser’s fullscreen key'],
  ['F12', 'F12 opens developer tools'],
]);

/** Pad Start is reserved: game-shell toggles pause with it and cancels a pad capture on it; never offer it to rebind. */
export const PAD_RESERVED: ReadonlySet<number> = new Set([9]);

/** Free keys for an action that an old save predates (timberwolf's idea, by code). */
const SPARE = ['KeyR', 'KeyG', 'KeyX', 'KeyC', 'KeyZ', 'KeyT', 'KeyV', 'KeyB', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'];

const actions = Object.keys(ACTIONS) as Action[];

function owner(map: KeyMap, code: string, ctx: Context, except?: Action): { action: Action; slot: 0 | 1 } | null {
  for (const a of actions) {
    if (a === except || ACTIONS[a].context !== ctx) continue;
    const s = map[a];
    if (s[0] === code) return { action: a, slot: 0 };
    if (s[1] === code) return { action: a, slot: 1 };
  }
  return null;
}

function withSlot(s: Slots, slot: 0 | 1, code: string | null): Slots {
  return slot === 0 ? [code, s[1]] : [s[0], code];
}

function spareFor(map: KeyMap, ctx: Context, except: Action): string | null {
  return SPARE.find((k) => owner(map, k, ctx, except) === null) ?? null;
}

// ---- Remapping: swap, notice, undo ---------------------------------------------------------

export type RebindResult =
  | { ok: false; reason: string }
  | { ok: true; map: KeyMap; undo: KeyMap; notice: string | null };

/**
 * Bind `code` to `action`'s `slot`. If another action in the same context holds it, that action
 * takes this slot's old key (D4: swap, never silently unbind) and the notice names both.
 * `label` turns a code into what the player sees (layout-aware); pass the real one from the UI.
 */
export function rebind(
  map: KeyMap,
  action: Action,
  slot: 0 | 1,
  code: string,
  label: (code: string) => string = (c) => c,
): RebindResult {
  const reason = RESERVED.get(code);
  if (reason !== undefined) return { ok: false, reason };
  const old = map[action][slot];
  if (old === code) return { ok: true, map, undo: map, notice: null };
  const next: Record<Action, Slots> = { ...map };
  const clash = owner(map, code, ACTIONS[action].context, action);
  let notice: string | null = null;
  if (clash !== null) {
    let swapped = withSlot(map[clash.action], clash.slot, old);
    let given = old;
    // Never leave the displaced action with no key at all: give it a spare and say which.
    if (swapped[0] === null && swapped[1] === null) {
      given = spareFor({ ...map, [action]: withSlot(map[action], slot, code) }, ACTIONS[action].context, clash.action);
      swapped = withSlot(swapped, clash.slot, given);
    }
    next[clash.action] = swapped;
    notice =
      given === null
        ? `${label(code)} moved from ${clash.action} to ${action}. ${clash.action} has no key left: bind one.`
        : `${label(code)} moved from ${clash.action} to ${action}. ${clash.action} is now on ${label(given)}.`;
  }
  // The same code may sit in this action's other slot: clear it so one action never holds it twice.
  const other: 0 | 1 = slot === 0 ? 1 : 0;
  let mine = withSlot(map[action], slot, code);
  if (mine[other] === code) mine = withSlot(mine, other, null);
  next[action] = mine;
  return { ok: true, map: next, undo: map, notice };
}

export function resetAction(
  map: KeyMap,
  action: Action,
  label: (code: string) => string = (c) => c,
): { map: KeyMap; undo: KeyMap; notices: string[] } {
  // Resetting can collide too: route each default through rebind so collisions swap, and keep
  // the notices so Reset never silently moves another action's key.
  let cur: KeyMap = map;
  const notices: string[] = [];
  for (const slot of [0, 1] as const) {
    const code = DEFAULTS[action][slot];
    if (code === null) {
      cur = { ...cur, [action]: withSlot(cur[action], slot, null) };
      continue;
    }
    const r = rebind(cur, action, slot, code, label);
    if (r.ok) {
      cur = r.map;
      if (r.notice !== null) notices.push(r.notice);
    }
  }
  return { map: cur, undo: map, notices };
}

// ---- Loading: merge over defaults, never replace -------------------------------------------

/**
 * Lay a saved (untrusted) map over the defaults. Unknown actions are dropped; a saved code that is
 * reserved or not a string falls back to the default; duplicates resolve per action (later loses);
 * an action the save predates keeps its default unless taken, then takes a spare.
 */
export function mergeSaved(saved: unknown): KeyMap {
  const out: Record<Action, Slots> = { ...DEFAULTS };
  const src = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {};
  const fresh: Action[] = [];
  for (const a of actions) {
    const s = src[a];
    if (!Array.isArray(s)) {
      fresh.push(a);
      continue;
    }
    const pick = (v: unknown, d: string | null): string | null =>
      v === null ? null : typeof v === 'string' && v.length > 0 && !RESERVED.has(v) ? v : d;
    out[a] = [pick(s[0], DEFAULTS[a][0]), pick(s[1], DEFAULTS[a][1])];
  }
  // Duplicates among SAVED actions within a context: the later action's slot falls back to empty.
  // New actions are skipped here so a save always beats a default; they are resolved below.
  const seen = new Set<string>();
  for (const a of actions) {
    if (fresh.includes(a)) continue;
    for (const slot of [0, 1] as const) {
      const code = out[a][slot];
      if (code === null) continue;
      const key = `${ACTIONS[a].context}:${code}`;
      if (seen.has(key)) out[a] = withSlot(out[a], slot, null);
      else seen.add(key);
    }
  }
  // New actions: keep the default unless a saved action already owns it, then take a spare.
  for (const a of fresh) {
    for (const slot of [0, 1] as const) {
      const code = out[a][slot];
      if (code === null || owner(out, code, ACTIONS[a].context, a) === null) continue;
      out[a] = withSlot(out[a], slot, spareFor(out, ACTIONS[a].context, a));
    }
  }
  return out;
}

// ---- Labels --------------------------------------------------------------------------------

/** Layout-aware label where the Keyboard API exists (Chromium); QWERTY-assuming fallback elsewhere. */
export async function makeLabeller(): Promise<(code: string) => string> {
  const kb = (navigator as Navigator & { keyboard?: { getLayoutMap(): Promise<Map<string, string>> } }).keyboard;
  const layout = kb !== undefined ? await kb.getLayoutMap().catch(() => null) : null;
  return (code) => {
    const fromLayout = layout?.get(code);
    if (fromLayout !== undefined) return fromLayout.toUpperCase();
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return NAMED[code] ?? code;
  };
}

const NAMED: Readonly<Record<string, string>> = {
  Space: 'Space',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: 'Enter',
};

// ---- Press latch: render-rate edges into a fixed-step sim ---------------------------------

/**
 * Edges arrive per rendered frame; the sim ticks at 60 Hz. Latch each press until a tick consumes
 * it: a 120 Hz frame with no tick keeps it, a 30 Hz frame with two ticks delivers it to the first
 * only. Holds are sampled, not latched.
 */
export class PressLatch<A extends string> {
  private readonly pending = new Set<A>();
  press(a: A): void {
    this.pending.add(a);
  }
  /** Call once at the start of each sim tick; returns this tick's presses and clears them. */
  take(): ReadonlySet<A> {
    const out = new Set(this.pending);
    this.pending.clear();
    return out;
  }
  /** game-shell clears held input on every screen open; clear presses too. */
  clear(): void {
    this.pending.clear();
  }
}

// ---- Gamepad: edges, deadzone, trigger hysteresis -----------------------------------------

/** Starting values, posture B: deadzone 0.15-0.2 (accessibility-design's default range); triggers 0.5/0.4. */
export interface PadTuning {
  deadzone: number;
  triggerPress: number;
  triggerRelease: number;
}

export class Pad {
  private prev: boolean[] = [];
  readonly pressed: number[] = [];
  readonly released: number[] = [];
  lx = 0;
  ly = 0;
  connected = false;
  standard = true;

  constructor(private readonly tuning: PadTuning = { deadzone: 0.18, triggerPress: 0.5, triggerRelease: 0.4 }) {}

  /** Call once per rendered frame (never inside the sim tick, which stops while paused). */
  poll(): void {
    this.pressed.length = 0;
    this.released.length = 0;
    const pad = navigator.getGamepads().find((p) => p !== null) ?? null;
    this.connected = pad !== null;
    if (pad === null) {
      this.prev = [];
      return;
    }
    this.standard = pad.mapping === 'standard';
    pad.buttons.forEach((b, i) => {
      const was = this.prev[i] ?? false;
      const isTrigger = i === 6 || i === 7;
      const down = isTrigger ? b.value >= (was ? this.tuning.triggerRelease : this.tuning.triggerPress) : b.pressed;
      if (down && !was) this.pressed.push(i);
      if (!down && was) this.released.push(i);
      this.prev[i] = down;
    });
    [this.lx, this.ly] = radial(pad.axes[0] ?? 0, pad.axes[1] ?? 0, this.tuning.deadzone);
  }

  isDown(button: number): boolean {
    return this.prev[button] ?? false;
  }
}

/** Radial deadzone, rescaled so output starts at 0 at the deadzone's edge. */
export function radial(x: number, y: number, dz: number): [number, number] {
  const m = Math.hypot(x, y);
  if (m <= dz || m === 0) return [0, 0]; // m === 0 guards dz = 0 (0/0 -> NaN poisons movement)
  const k = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * k, y * k];
}

// ---- Last-used device and prompts ----------------------------------------------------------

export type Device = 'kbm' | 'pad';

/** Keys and clicks switch to kbm; pad buttons or a stick past the deadzone switch to pad. Mouse motion alone does not. */
export class LastDevice {
  device: Device = 'kbm';
  constructor(onChange: (d: Device) => void) {
    const set = (d: Device): void => {
      if (d !== this.device) {
        this.device = d;
        onChange(d);
      }
    };
    window.addEventListener('keydown', () => set('kbm'), true);
    window.addEventListener('pointerdown', () => set('kbm'), true);
    this.fromPad = (pad: Pad): void => {
      if (pad.pressed.length > 0 || pad.lx !== 0 || pad.ly !== 0) set('pad');
    };
  }
  /** Call after pad.poll() each frame. */
  fromPad: (pad: Pad) => void;
}

const PAD_GLYPH: Readonly<Record<number, string>> = { 0: 'Ⓐ', 1: 'Ⓑ', 2: 'Ⓧ', 3: 'Ⓨ', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 9: 'Start' };

/** The ONLY way a prompt is written. No literal key names anywhere else in the game. */
export function prompt(
  action: Action,
  device: Device,
  keys: KeyMap,
  padMap: Readonly<Partial<Record<Action, number>>>,
  label: (code: string) => string,
): string {
  if (device === 'pad') {
    const b = padMap[action];
    return b === undefined ? '—' : (PAD_GLYPH[b] ?? `Button ${b}`);
  }
  const code = keys[action][0] ?? keys[action][1];
  return code === null ? 'unbound' : label(code);
}

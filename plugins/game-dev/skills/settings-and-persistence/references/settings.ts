// settings-and-persistence reference sketch: one versioned record, parse -> migrate -> sanitise,
// failure-tolerant writes, tri-state reduced motion, an FX gate, and Web Audio buses.
// Strict TS, no dependencies. Adapt; don't import. load/migrate/sanitise are pure and unit-testable.

export const VERSION = 3;

export type Bus = 'music' | 'sfx' | 'ui';
export type Tri = 'system' | 'on' | 'off';

export interface Settings {
  version: number;
  audio: { master: number; muted: boolean; buses: Record<Bus, { level: number; muted: boolean }> };
  /** shake 0-100 (%), or null = never chosen: follow the OS (0 if it asks for reduced motion). */
  fx: { motion: Tri; flash: Tri; shake: number | null };
  display: { uiScale: number }; // 1 = 100%; XAG 101 asks for up to 2
  /** keys/pad are sanitised by input-bindings' mergeSaved() in the game's glue, not here. */
  input: { keys: unknown; pad: unknown; toggles: Record<string, boolean>; deadzone: number };
}

/**
 * Starting values, posture B: levels 80/70/80/60 and a 0.18 deadzone. Test: on a first run, does
 * a new player touch the mix or the stick before playing? If most do, the defaults are wrong.
 */
export const DEFAULTS: Settings = {
  version: VERSION,
  audio: {
    master: 80,
    muted: false,
    buses: { music: { level: 70, muted: false }, sfx: { level: 80, muted: false }, ui: { level: 60, muted: false } },
  },
  fx: { motion: 'system', flash: 'system', shake: null },
  display: { uiScale: 1 },
  input: { keys: null, pad: null, toggles: {}, deadzone: 0.18 },
};

// ---- Migrations: only for renames and changed units/meanings -------------------------------

type Raw = Record<string, unknown>;

/** migrations[v] turns a version-v record into version v+1. */
const MIGRATIONS: Readonly<Record<number, (r: Raw) => Raw>> = {
  // v1 stored volumes as 0-1 floats under `volume`; v2 stores 0-100 under `audio`.
  1: (r) => {
    const v = isRec(r['volume']) ? r['volume'] : {};
    const pct = (x: unknown): unknown => (typeof x === 'number' ? Math.round(x * 100) : x);
    return {
      ...r,
      version: 2,
      audio: { master: pct(v['master']), muted: false, buses: { music: { level: pct(v['music']) }, sfx: { level: pct(v['sfx']) } } },
    };
  },
  // v2 stored `reducedMotion: boolean` (the OS value got frozen in); v3 stores a tri-state.
  // A stored `false` is indistinguishable from "never chose", so map it back to 'system'.
  2: (r) => {
    const rm = r['reducedMotion'];
    return { ...r, version: 3, fx: { ...(isRec(r['fx']) ? r['fx'] : {}), motion: rm === true ? 'on' : 'system' } };
  },
};

export function migrate(raw: Raw): Raw {
  let r = raw;
  let v = typeof r['version'] === 'number' ? r['version'] : 1;
  while (v < VERSION) {
    const step = MIGRATIONS[v];
    if (step === undefined) return {}; // a gap in the ladder: fall back to defaults, loudly in tests
    r = step(r);
    v += 1;
  }
  return r;
}

// ---- Sanitise: field by field, every load, after migrating ---------------------------------

export function sanitise(raw: Raw): Settings {
  const d = DEFAULTS;
  const a = rec(raw['audio']);
  const b = rec(a['buses']);
  const bus = (k: Bus): { level: number; muted: boolean } => {
    const x = rec(b[k]);
    return { level: num(x['level'], d.audio.buses[k].level, 0, 100), muted: bool(x['muted'], d.audio.buses[k].muted) };
  };
  const fx = rec(raw['fx']);
  const disp = rec(raw['display']);
  const inp = rec(raw['input']);
  const toggles: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(rec(inp['toggles']))) if (typeof v === 'boolean') toggles[k] = v;
  return {
    version: VERSION,
    audio: { master: num(a['master'], d.audio.master, 0, 100), muted: bool(a['muted'], d.audio.muted), buses: { music: bus('music'), sfx: bus('sfx'), ui: bus('ui') } },
    fx: {
      motion: tri(fx['motion']),
      flash: tri(fx['flash']),
      shake: fx['shake'] === null ? null : typeof fx['shake'] === 'number' ? num(fx['shake'], 100, 0, 100) : d.fx.shake,
    },
    // uiScale floor 0.75: posture B (test: is the smallest setting still legible at the target distance?)
    display: { uiScale: num(disp['uiScale'], d.display.uiScale, 0.75, 2) },
    input: {
      keys: inp['keys'] ?? null,
      pad: inp['pad'] ?? null,
      toggles,
      deadzone: num(inp['deadzone'], d.input.deadzone, 0, 0.5),
    },
  };
}

// ---- Load / save -----------------------------------------------------------------------------

export interface Loaded {
  settings: Settings;
  /** False for a record written by a newer build: use it, but don't write until the player changes something. */
  writable: boolean;
  /** The newer build's raw record, so a later write keeps the fields this build doesn't know. */
  future: Raw | null;
}

export function load(text: string | null): Loaded {
  const fresh = (): Loaded => ({ settings: structuredClone(DEFAULTS), writable: true, future: null });
  if (text === null) return fresh();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fresh();
  }
  if (!isRec(raw)) return fresh();
  const v = typeof raw['version'] === 'number' ? raw['version'] : 1;
  if (v > VERSION) return { settings: sanitise(raw), writable: false, future: raw };
  return { settings: sanitise(migrate(raw)), writable: true, future: null };
}

export class SettingsStore {
  private last = '';
  private warned = false;
  settings: Settings;
  private writable: boolean;

  constructor(
    private readonly key: string,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null,
    private readonly onUnsaved: () => void,
  ) {
    let text: string | null = null;
    try {
      text = storage?.getItem(key) ?? null;
    } catch {
      text = null; // storage disabled: run on defaults
    }
    const l = load(text);
    this.settings = l.settings;
    this.writable = l.writable;
    this.future = l.future;
  }

  private readonly future: Raw | null;

  /** The one write path. Systems read `settings`; nothing else writes storage. */
  update(change: (s: Settings) => void): void {
    change(this.settings);
    this.settings = sanitise(this.settings as unknown as Raw);
    this.writable = true; // the player changed something: this build now owns the record
    this.flush();
  }

  private flush(): void {
    if (!this.writable) return;
    // Over a newer build's record, keep its version and unknown fields; overwrite only what we own.
    const text = JSON.stringify(
      this.future === null ? this.settings : { ...this.future, ...this.settings, version: this.future['version'] },
    );
    if (text === this.last) return; // de-duplicate writes (Downwash)
    try {
      this.storage?.setItem(this.key, text);
      this.last = text;
    } catch {
      if (!this.warned) {
        this.warned = true;
        this.onUnsaved(); // "Settings won't be saved in this browser mode."
      }
    }
  }
}

// ---- The FX gate: resolved live, read by every effect at emit AND render -------------------

export interface FxGate {
  reduceMotion: boolean;
  reduceFlash: boolean;
  shakeScale: number; // 0-1
}

export function resolveFx(s: Settings, osReduce: boolean): FxGate {
  const t = (x: Tri): boolean => (x === 'system' ? osReduce : x === 'on');
  const shake = s.fx.shake ?? (osReduce ? 0 : 100);
  return { reduceMotion: t(s.fx.motion), reduceFlash: t(s.fx.flash), shakeScale: shake / 100 };
}

/** Keep the gate current when the OS preference changes mid-session. Never store the OS value. */
export function watchOsMotion(onChange: (reduce: boolean) => void): boolean {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', (e) => onChange(e.matches));
  return mq.matches;
}

// ---- Audio buses -----------------------------------------------------------------------------

/** Starting value (posture B): gain = (v/100)^2. Test: equal slider steps sound like equal loudness steps. */
export const curve = (v: number): number => (v / 100) ** 2;

export function makeBuses(ctx: AudioContext): { master: GainNode; bus: Record<Bus, GainNode> } {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const mk = (): GainNode => {
    const g = ctx.createGain();
    g.connect(master);
    return g;
  };
  return { master, bus: { music: mk(), sfx: mk(), ui: mk() } };
}

/** Apply levels; `duck` is game-shell's pause duck (1 in Options so levels are judged at full scale). */
export function applyAudio(s: Settings, nodes: ReturnType<typeof makeBuses>, ctx: AudioContext, duck = 1): void {
  const t = ctx.currentTime;
  // 0.02 s smoothing time constant: posture B (test: no click when a slider jumps 0 -> 100).
  nodes.master.gain.setTargetAtTime(s.audio.muted ? 0 : curve(s.audio.master) * duck, t, 0.02);
  for (const k of Object.keys(nodes.bus) as Bus[]) {
    const b = s.audio.buses[k];
    nodes.bus[k].gain.setTargetAtTime(b.muted ? 0 : curve(b.level), t, 0.02);
  }
}

// ---- helpers ---------------------------------------------------------------------------------

function isRec(v: unknown): v is Raw {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function rec(v: unknown): Raw {
  return isRec(v) ? v : {};
}
function num(v: unknown, d: number, lo: number, hi: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
}
function bool(v: unknown, d: boolean): boolean {
  return typeof v === 'boolean' ? v : d;
}
function tri(v: unknown): Tri {
  return v === 'on' || v === 'off' || v === 'system' ? v : 'system';
}

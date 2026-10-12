// in-play-comms reference sketch: the rules of a voice that talks during action, with no DOM.
// Adapted from ice-pirates src/ui/comms-queue.ts and src/app/engagement.ts (2026-10-12). Additions
// beyond that corpus code are marked ADDED. Strict TS, no dependencies. Adapt; don't import.

/** 0 story, 1 coaching, 2 urgent. */
export type LinePri = 0 | 1 | 2;

export interface CommsLine {
  speaker: string;
  text: string;
  pri: LinePri;
  /** The situation this line is about. Absent = a lesson, true all game, never withdrawn. */
  key?: string;
}

export interface CommsCard extends CommsLine {
  shown: number;
  need: number;
}

interface Pending extends CommsLine {
  waited: number;
}

/** Corpus values (ice-pirates); posture B for your game. Tests in SKILL.md. */
const MAX_CARDS = 3;
const MIN_SHOWN = 1.2; // a withdrawn card stays this long, so a line never flickers on and off
const BUSY_SLOW = 0.35; // a fully engaged player's reading clock runs at 0.65x
const OVERLAP = 0.6; // the next non-urgent line may enter once the newest card has had 60% of its time
const GATE: Readonly<Record<LinePri, { calm: number; cap: number }>> = {
  0: { calm: 0.3, cap: 9 }, // story: enters below 0.3 engagement, or after waiting 9 s
  1: { calm: 0.65, cap: 2.5 }, // coaching
  2: { calm: 1.01, cap: 0 }, // urgent: always
};

/** Seconds on screen: a second to find the card plus ~15 characters a second, 3 to 9 s. */
export function readTime(text: string): number {
  return Math.min(9, Math.max(3, 1 + text.length / 15));
}

export interface CommsChange {
  admitted: CommsCard[];
  retired: CommsCard[];
}

export class CommsQueue {
  /** On screen, oldest first. */
  readonly cards: CommsCard[] = [];
  private readonly pending: Pending[] = [];

  /**
   * ADDED (XAG 116): the player's reading-time multiplier from settings, 1..10, or Infinity for
   * "until dismissed". ice-pirates has no such setting.
   */
  constructor(private readonly readScale: () => number = () => 1) {}

  push(line: CommsLine): void {
    // Dedupe by TEXT. Keys are shared by every line of a beat; deduping by key drops lines 2+.
    const same = (l: CommsLine): boolean => l.text === line.text;
    if (this.cards.some(same) || this.pending.some(same)) return;
    this.pending.push({ ...line, waited: 0 });
    this.pending.sort((a, b) => b.pri - a.pri); // stable: arrival order within a priority
  }

  /** `live`: situation keys still true this tick. `engaged`: 0 idle .. 1 hands full. `dt` is 0 while paused. */
  update(dt: number, live: ReadonlySet<string>, engaged: number): CommsChange {
    const out: CommsChange = { admitted: [], retired: [] };
    const stale = (l: CommsLine): boolean => l.key !== undefined && !live.has(l.key);
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if (p !== undefined && stale(p)) this.pending.splice(i, 1);
    }
    for (const c of [...this.cards]) {
      c.shown += dt * (1 - BUSY_SLOW * engaged);
      if (c.shown >= c.need || (c.shown > MIN_SHOWN && stale(c))) this.retire(c, out);
    }
    this.admit(dt, engaged, out);
    return out;
  }

  /** ADDED: a dismiss input retires the newest card (the "until dismissed" setting needs one). Same shape as update(). */
  dismiss(): CommsChange {
    const out: CommsChange = { admitted: [], retired: [] };
    const c = this.cards[this.cards.length - 1];
    if (c !== undefined) this.retire(c, out);
    return out;
  }

  /** Death, restart, quit: drop everything. */
  clear(): CommsCard[] {
    const gone = [...this.cards];
    this.cards.length = 0;
    this.pending.length = 0;
    return gone;
  }

  private admit(dt: number, engaged: number, out: CommsChange): void {
    for (const p of this.pending) p.waited += dt;
    const overdue = this.pending.findIndex((p) => p.waited >= GATE[p.pri].cap);
    const at = overdue >= 0 ? overdue : 0; // a line past its cap jumps the queue: nothing starves
    const next = this.pending[at];
    if (next === undefined) return;
    const gate = GATE[next.pri];
    if (engaged >= gate.calm && next.waited < gate.cap) return;
    const newest = this.cards[this.cards.length - 1];
    if (next.pri < 2 && newest !== undefined && newest.shown < newest.need * OVERLAP) return;
    this.pending.splice(at, 1);
    const oldest = this.cards[0];
    if (this.cards.length >= MAX_CARDS && oldest !== undefined) this.retire(oldest, out);
    const card: CommsCard = { speaker: next.speaker, text: next.text, pri: next.pri, shown: 0, need: readTime(next.text) * this.readScale() };
    if (next.key !== undefined) card.key = next.key;
    this.cards.push(card);
    out.admitted.push(card);
  }

  private retire(c: CommsCard, out: CommsChange): void {
    const i = this.cards.indexOf(c);
    if (i >= 0) this.cards.splice(i, 1);
    out.retired.push(c);
  }
}

/** Frame-rate-independent smoothing factor: the fraction of the gap closed this frame. */
export function damp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/**
 * How busy the player's hands and eyes are, from input, 0..1. Rises fast, settles slowly, so a lull has
 * to be a real lull before story talks. Weights are ice-pirates' (corpus value); map them to your verbs.
 */
export class Engagement {
  value = 0;

  update(signals: { firing: boolean; underFire: boolean; steering: boolean; other: number }, dt: number): number {
    const want = Math.max(signals.firing ? 1 : 0, signals.underFire ? 0.8 : 0, signals.steering ? 0.45 : 0, signals.other);
    this.value += (want - this.value) * damp(want > this.value ? 5 : 0.5, dt);
    return this.value;
  }
}

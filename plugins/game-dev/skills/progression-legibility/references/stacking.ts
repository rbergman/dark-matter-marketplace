// progression-legibility reference sketch: one stacking rule per stat, card text from the real
// pipeline, visible caps, and solving a curve parameter from a target ratio. Pure; unit-testable.

export type Rule = 'additive' | 'multiplicative' | 'diminishing';

export interface StatDef {
  base: number;
  rule: Rule;
  /** Hard cap on the final value (e.g. a score multiplier at 3.0). Undefined = uncapped. */
  cap?: number;
  unit: string;
  /** Display precision; choose so every offered upgrade shows a visible change. */
  digits: number;
}

/**
 * The ONE pipeline for a stat. Cards, HUD and tooltips all call this, so they cannot disagree.
 * `picks` are the per-pick fractions owned (0.2 = "20%").
 *   additive:       base * (1 + Σp)
 *   multiplicative: base * Π(1 + p)
 *   diminishing:    1 - Π(1 - p)   (a chance/reduction in [0, 1); base is ignored and must be 0)
 */
export function effective(def: StatDef, picks: readonly number[]): number {
  let v: number;
  if (def.rule === 'additive') v = def.base * (1 + picks.reduce((a, p) => a + p, 0));
  else if (def.rule === 'multiplicative') v = picks.reduce((a, p) => a * (1 + p), def.base);
  else v = 1 - picks.reduce((a, p) => a * (1 - p), 1);
  return def.cap === undefined ? v : Math.min(v, def.cap);
}

export interface CardText {
  line: string;
  /** False when this pick changes nothing visible (capped, or below display precision): don't offer it. */
  offer: boolean;
}

/** "Fire rate 4.0 -> 4.8 shots/s", computed from the pipeline, never from the card's own p. */
export function cardText(name: string, def: StatDef, owned: readonly number[], pick: number): CardText {
  const before = effective(def, owned);
  const after = effective(def, [...owned, pick]);
  const fmt = (x: number): string =>
    def.rule === 'diminishing' ? `${(x * 100).toFixed(def.digits)}%` : x.toFixed(def.digits);
  const unit = def.rule === 'diminishing' ? '' : def.unit;
  const capped = def.cap !== undefined && after >= def.cap;
  const visible = fmt(before) !== fmt(after);
  return {
    line: `${name} ${fmt(before)} → ${fmt(after)}${unit}${capped ? ' (MAX)' : ''}`,
    offer: visible,
  };
}

/**
 * Exponential threat T(x) = T0 * e^(r x) that should be k times harder between x1 and x2:
 * r = ln(k) / (x2 - x1). Solve, don't guess; then sweep it with the bot and playtest the feel.
 */
export function solveGrowthRate(k: number, x1: number, x2: number): number {
  if (k <= 0 || x2 === x1) throw new RangeError('need k > 0 and x2 != x1');
  return Math.log(k) / (x2 - x1);
}

/** Threat in visible bands: the smooth curve underneath, the band the player can see on top. */
export function threatBand(threat: number, edges: readonly number[]): number {
  let band = 0;
  for (const e of edges) if (threat >= e) band += 1;
  return band;
}

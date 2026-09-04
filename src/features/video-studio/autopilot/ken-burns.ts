/**
 * Picks which still shots get a Ken Burns move, and which one.
 *
 * Kept free of runtime imports so the distribution rules stay unit-testable.
 */

import type { AutoVideoMediaEffect } from '@/features/video-studio/lib/auto-video/types';

/** Ken Burns effects applied to a shot that stays a still image (no video). */
const KEN_BURNS_EFFECTS: AutoVideoMediaEffect[] = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down', 'zoom_pan_left', 'zoom_pan_right'];

/** FNV-1a: a stable seed→number so the same job always plans the same motion. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export interface KenBurnsPlanOptions {
  /** Off freezes every still shot. */
  enabled: boolean;
  /** Share of still shots that move (0-100). */
  percent: number;
  /** Stable per-job seed. */
  seed: string;
}

/**
 * Decides which still shots get a Ken Burns move.
 *
 * Two properties matter beyond the raw percentage:
 * 1. the moving shots are spread evenly over the whole film — picking each shot
 *    independently at 10% clusters three moves together and then leaves forty
 *    frozen shots in a row;
 * 2. the choice is derived from the job seed instead of Math.random(), so a
 *    resumed or re-rendered job reproduces exactly the same edit.
 *
 * Callers must plan over the entire film at once — planning per chapter would
 * apply the percentage to each chapter separately.
 */
export function planKenBurnsEffects(
  shotIndexes: number[],
  options: KenBurnsPlanOptions,
): Map<number, AutoVideoMediaEffect> {
  const plan = new Map<number, AutoVideoMediaEffect>(shotIndexes.map((index) => [index, 'none' as AutoVideoMediaEffect]));
  const percent = Math.min(100, Math.max(0, options.percent));
  if (!options.enabled || percent <= 0 || shotIndexes.length === 0) return plan;

  // A non-zero percentage always moves at least one shot, so "1% of 20 shots"
  // does not silently round down to a fully frozen film.
  const total = shotIndexes.length;
  const moving = percent >= 100 ? total : Math.min(total, Math.max(1, Math.round((total * percent) / 100)));
  const stride = total / moving;
  const used = new Set<number>();
  let previous: AutoVideoMediaEffect | undefined;
  for (let slot = 0; slot < moving; slot += 1) {
    const jitter = (hashSeed(`${options.seed}:slot:${slot}`) % 1000) / 1000;
    let position = Math.min(total - 1, Math.floor(slot * stride + jitter * stride));
    // Neighbouring slots can round onto the same shot when the stride is
    // fractional; walk to a free one so the film still gets the requested count.
    while (used.has(position) && position < total - 1) position += 1;
    while (used.has(position) && position > 0) position -= 1;
    if (used.has(position)) break;
    used.add(position);
    const shotIndex = shotIndexes[position];
    const roll = hashSeed(`${options.seed}:effect:${shotIndex}`) % KEN_BURNS_EFFECTS.length;
    // Nudge off a repeat so two neighbouring moves are not the identical push.
    const effect = KEN_BURNS_EFFECTS[KEN_BURNS_EFFECTS[roll] === previous ? (roll + 1) % KEN_BURNS_EFFECTS.length : roll];
    plan.set(shotIndex, effect);
    previous = effect;
  }
  return plan;
}

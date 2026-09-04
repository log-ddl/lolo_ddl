import { strict as assert } from 'node:assert';
import { planKenBurnsEffects } from './ken-burns.ts';

const indexes = Array.from({ length: 40 }, (_, index) => index + 1);
const moving = (plan: Map<number, string>) => indexes.filter((index) => plan.get(index) !== 'none');

// Default: every still shot moves.
const full = planKenBurnsEffects(indexes, { enabled: true, percent: 100, seed: 'job-a' });
assert.equal(moving(full).length, 40, '100% must animate every still shot');

// Switch off: nothing moves, but every shot still has an entry.
const off = planKenBurnsEffects(indexes, { enabled: false, percent: 100, seed: 'job-a' });
assert.equal(moving(off).length, 0, 'disabled must freeze every still shot');
assert.equal(off.size, 40, 'disabled must still answer for every shot');

// 10% of 40 shots = 4 moves, spread across the film instead of clustered.
const sparse = planKenBurnsEffects(indexes, { enabled: true, percent: 10, seed: 'job-a' });
const sparseMoving = moving(sparse);
assert.equal(sparseMoving.length, 4, '10% of 40 shots must animate 4 shots');
sparseMoving.forEach((index, position) => {
  if (position === 0) return;
  assert.ok(index - sparseMoving[position - 1] >= 2, 'moving shots must not sit adjacent at 10%');
});
assert.ok(sparseMoving[0] <= 10, 'first move must land in the opening tenth');
assert.ok(sparseMoving.at(-1)! >= 30, 'last move must land in the closing quarter');

// Deterministic: a resumed or re-rendered job reproduces the same edit.
const repeat = planKenBurnsEffects(indexes, { enabled: true, percent: 10, seed: 'job-a' });
assert.deepEqual([...repeat.entries()], [...sparse.entries()], 'same seed must reproduce the same plan');
const other = planKenBurnsEffects(indexes, { enabled: true, percent: 10, seed: 'job-b' });
assert.notDeepEqual([...other.entries()], [...sparse.entries()], 'a different job must not copy the same plan');

// A tiny percentage still animates at least one shot.
const minimal = planKenBurnsEffects(indexes, { enabled: true, percent: 1, seed: 'job-a' });
assert.equal(moving(minimal).length, 1, '1% must animate one shot, not zero');

// 0% is a real "freeze everything" answer, not a fallback to the default.
const zero = planKenBurnsEffects(indexes, { enabled: true, percent: 0, seed: 'job-a' });
assert.equal(moving(zero).length, 0, '0% must freeze every still shot');

// No still shots at all (every shot became an AI video) must not throw.
assert.equal(planKenBurnsEffects([], { enabled: true, percent: 50, seed: 'job-a' }).size, 0);

console.log('ken-burns: all assertions passed');

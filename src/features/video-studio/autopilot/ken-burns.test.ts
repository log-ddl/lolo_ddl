import { strict as assert } from 'node:assert';
import { KEN_BURNS_MIN_DURATION_MS, planKenBurnsEffects } from './ken-burns.ts';

const shots = Array.from({ length: 40 }, (_, index) => ({ index: index + 1, durationMs: 4_000 }));
const indexes = shots.map((shot) => shot.index);
const moving = (plan: Map<number, string>) => indexes.filter((index) => plan.get(index) !== 'none');

// Default: every still shot moves.
const full = planKenBurnsEffects(shots, { enabled: true, percent: 100, seed: 'job-a' });
assert.equal(moving(full).length, 40, '100% must animate every still shot');

// Switch off: nothing moves, but every shot still has an entry.
const off = planKenBurnsEffects(shots, { enabled: false, percent: 100, seed: 'job-a' });
assert.equal(moving(off).length, 0, 'disabled must freeze every still shot');
assert.equal(off.size, 40, 'disabled must still answer for every shot');

// 10% of 40 shots = 4 moves, spread across the film instead of clustered.
const sparse = planKenBurnsEffects(shots, { enabled: true, percent: 10, seed: 'job-a' });
const sparseMoving = moving(sparse);
assert.equal(sparseMoving.length, 4, '10% of 40 shots must animate 4 shots');
sparseMoving.forEach((index, position) => {
  if (position === 0) return;
  assert.ok(index - sparseMoving[position - 1] >= 2, 'moving shots must not sit adjacent at 10%');
});
assert.ok(sparseMoving[0] <= 10, 'first move must land in the opening tenth');
assert.ok(sparseMoving.at(-1)! >= 30, 'last move must land in the closing quarter');

// Deterministic: a resumed or re-rendered job reproduces the same edit.
const repeat = planKenBurnsEffects(shots, { enabled: true, percent: 10, seed: 'job-a' });
assert.deepEqual([...repeat.entries()], [...sparse.entries()], 'same seed must reproduce the same plan');
const other = planKenBurnsEffects(shots, { enabled: true, percent: 10, seed: 'job-b' });
assert.notDeepEqual([...other.entries()], [...sparse.entries()], 'a different job must not copy the same plan');

// A tiny percentage still animates at least one shot.
const minimal = planKenBurnsEffects(shots, { enabled: true, percent: 1, seed: 'job-a' });
assert.equal(moving(minimal).length, 1, '1% must animate one shot, not zero');

// 0% is a real "freeze everything" answer, not a fallback to the default.
const zero = planKenBurnsEffects(shots, { enabled: true, percent: 0, seed: 'job-a' });
assert.equal(moving(zero).length, 0, '0% must freeze every still shot');

// Shots under the minimum never move, even at 100%.
const short = shots.map((shot) => (shot.index % 2 === 0 ? { ...shot, durationMs: 1_200 } : shot));
const shortPlan = planKenBurnsEffects(short, { enabled: true, percent: 100, seed: 'job-a' });
assert.equal(moving(shortPlan).length, 20, 'shots under the minimum must stay frozen at 100%');
assert.ok(moving(shortPlan).every((index) => index % 2 === 1), 'only the long shots may move');
assert.equal(shortPlan.size, 40, 'every shot must still get an answer');

// Exactly at the threshold is long enough.
const exact = planKenBurnsEffects(
  [{ index: 1, durationMs: KEN_BURNS_MIN_DURATION_MS }, { index: 2, durationMs: KEN_BURNS_MIN_DURATION_MS - 1 }],
  { enabled: true, percent: 100, seed: 'job-a' },
);
assert.notEqual(exact.get(1), 'none', 'a shot exactly at the minimum must move');
assert.equal(exact.get(2), 'none', 'a shot one millisecond short must not move');

// The percentage counts eligible shots only: 50% of the 20 long ones = 10 moves.
const halfOfEligible = planKenBurnsEffects(short, { enabled: true, percent: 50, seed: 'job-a' });
assert.equal(moving(halfOfEligible).length, 10, 'percentage must apply to eligible shots, not all stills');

// A film of nothing but short shots simply gets no motion.
const allShort = planKenBurnsEffects(shots.map((shot) => ({ ...shot, durationMs: 900 })), { enabled: true, percent: 100, seed: 'job-a' });
assert.equal(moving(allShort).length, 0, 'an all-short film must not force a move');

// No still shots at all (every shot became an AI video) must not throw.
assert.equal(planKenBurnsEffects([], { enabled: true, percent: 50, seed: 'job-a' }).size, 0);

console.log('ken-burns: all assertions passed');

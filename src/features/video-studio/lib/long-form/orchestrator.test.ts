import { strict as assert } from 'node:assert';
import {
  runConcurrentOrdered,
  splitTimedUnitsIntoChapters,
  validateLongFormCoverage,
} from './orchestrator.ts';

const units = Array.from({ length: 240 }, (_, index) => ({
  index: index + 1,
  startMs: index * 7_500,
  endMs: (index + 1) * 7_500,
  text: `Beat ${index + 1}.`,
}));
const chapters = splitTimedUnitsIntoChapters(units);
assert.ok(chapters.length >= 7 && chapters.length <= 12, '30-minute timeline should split into practical chapters');
assert.equal(chapters[0].startMs, 0);
assert.equal(chapters.at(-1)?.endMs, 1_800_000);
assert.ok(chapters.every((chapter) => chapter.endMs - chapter.startMs <= 240_000));
assert.deepEqual(chapters.flatMap((chapter) => chapter.unitIndexes), units.map((unit) => unit.index));

const coverage = validateLongFormCoverage(
  units.map((unit) => unit.index),
  chapters.map((chapter) => chapter.unitIndexes),
);
assert.equal(coverage.valid, true);
assert.equal(validateLongFormCoverage([1, 2, 3], [[1, 2], [2]]).valid, false);

let active = 0;
let maxActive = 0;
const ordered = await runConcurrentOrdered([40, 5, 20, 1], 2, async (delay, index) => {
  active += 1;
  maxActive = Math.max(maxActive, active);
  await new Promise((resolve) => setTimeout(resolve, delay));
  active -= 1;
  return index;
});
assert.deepEqual(ordered, [0, 1, 2, 3], 'parallel execution must merge in source order');
assert.equal(maxActive, 2, 'worker pool must respect configured concurrency');

console.log(`Long-form orchestrator tests passed: ${chapters.length} chapters, concurrency=${maxActive}.`);

import assert from 'node:assert/strict';
import { generationElapsedSeconds } from './generation-timing.ts';

const snapshot = JSON.parse(JSON.stringify({ imageSubmittedAt: 100_000, videoSubmittedAt: 115_000 }));
assert.equal(generationElapsedSeconds('generating', snapshot.imageSubmittedAt, 125_000), 25);
assert.equal(generationElapsedSeconds('generating', snapshot.videoSubmittedAt, 125_000), 10);
// Recreating a view from the same saved asset must preserve elapsed time and offset.
assert.equal(generationElapsedSeconds('generating', snapshot.imageSubmittedAt, 135_000), 35);
assert.equal(generationElapsedSeconds('generating', snapshot.videoSubmittedAt, 135_000), 20);
// A fresh attempt counts from its own submission, never from a previous attempt.
assert.equal(generationElapsedSeconds('queued', snapshot.imageSubmittedAt, 140_000), undefined);
assert.equal(generationElapsedSeconds('generating', 140_000, 142_000), 2);
for (const value of [undefined, NaN, Infinity, 0, -1]) {
  assert.equal(generationElapsedSeconds('generating', value, 150_000), undefined);
}
assert.equal(generationElapsedSeconds('completed', 100_000, 150_000), undefined);
assert.equal(generationElapsedSeconds('generating', 160_000, 150_000), 0);
console.log('generation-timing: all assertions passed');

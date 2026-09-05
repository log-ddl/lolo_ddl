import { strict as assert } from 'node:assert';
import { mapPlannerItemsToBeats } from './planner-beat-map.ts';

const beatsFrom = (start: number, count: number) =>
  Array.from({ length: count }, (_, offset) => ({ index: start + offset }));
const itemsFor = (count: number, beatIndex?: (position: number) => number) =>
  Array.from({ length: count }, (_, position) => ({
    imagePrompt: `shot ${position + 1}`,
    ...(beatIndex ? { beatIndex: beatIndex(position) } : {}),
  }));

// A skill that forbids beatIndex still has to land on the chapter's real beats.
// This is the regression: chapters 2-4 of a long-form job cover global beats
// 17-35, 36-57 and 58-59, so a positional shots[] must not be read as beats 1..N.
for (const [start, count] of [[1, 16], [17, 19], [36, 22], [58, 2]] as const) {
  const beats = beatsFrom(start, count);
  const mapped = mapPlannerItemsToBeats(itemsFor(count), beats);
  assert.equal(mapped.size, count, `chapter starting at beat ${start} must map every beat`);
  beats.forEach((beat, position) => {
    assert.equal(mapped.get(beat.index)?.imagePrompt, `shot ${position + 1}`, `beat ${beat.index} must take its own shot`);
  });
}

// A planner that renumbers per chapter (1..N) must not collide with the global
// indexes it happens to overlap: beats 17-35 partially overlap a 1..19 run.
const renumbered = mapPlannerItemsToBeats(itemsFor(19, (position) => position + 1), beatsFrom(17, 19));
assert.equal(renumbered.size, 19, 'a chapter-local 1..N numbering must still cover every beat');
assert.equal(renumbered.get(17)?.imagePrompt, 'shot 1', 'first beat must take the first shot, not the one numbered 17');
assert.equal(renumbered.get(35)?.imagePrompt, 'shot 19', 'last beat must take the last shot');

// When the planner does use the supplied global indexes, they are authoritative,
// including out-of-order items.
const globalOrder = mapPlannerItemsToBeats(
  [{ imagePrompt: 'b', beatIndex: 37 }, { imagePrompt: 'a', beatIndex: 36 }, { imagePrompt: 'c', beatIndex: 38 }],
  beatsFrom(36, 3),
);
assert.equal(globalOrder.get(36)?.imagePrompt, 'a', 'declared beatIndex must win over position');
assert.equal(globalOrder.get(37)?.imagePrompt, 'b', 'declared beatIndex must win over position');
assert.equal(globalOrder.get(38)?.imagePrompt, 'c', 'declared beatIndex must win over position');

// Duplicated indexes are not trustworthy numbering: fall back to position.
const duplicated = mapPlannerItemsToBeats(
  [{ imagePrompt: 'a', beatIndex: 36 }, { imagePrompt: 'b', beatIndex: 36 }],
  beatsFrom(36, 2),
);
assert.equal(duplicated.get(37)?.imagePrompt, 'b', 'duplicate beatIndex must fall back to positional mapping');

// A short answer leaves the uncovered beats free to take the fallback prompt.
const short = mapPlannerItemsToBeats(itemsFor(2), beatsFrom(36, 5));
assert.equal(short.size, 2, 'a short plan must only claim the beats it answered');
assert.equal(short.has(38), false, 'unanswered beats must stay unmapped');

// Extra items are dropped rather than shifting the beats they follow.
const long = mapPlannerItemsToBeats(itemsFor(5), beatsFrom(36, 2));
assert.equal(long.size, 2, 'extra shots must not invent beats');
assert.equal(long.get(37)?.imagePrompt, 'shot 2', 'extra shots must not shift earlier beats');

// An empty plan maps nothing, which is what the "no shots" guard reports.
assert.equal(mapPlannerItemsToBeats([], beatsFrom(1, 3)).size, 0, 'an empty plan must map no beats');

console.log('planner-beat-map: all assertions passed');

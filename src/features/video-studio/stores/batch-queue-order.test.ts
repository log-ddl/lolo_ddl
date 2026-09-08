/**
 * Which queue entry runs next.
 *
 * Split out from the store's runner because it is the one piece of that file
 * with no timers, no engine and no persistence in it — and the piece that got
 * the scheduling wrong: a due entry used to sit behind an entry waiting for a
 * later slot, while the background scheduler kept waking the queue up precisely
 * because something was due.
 *
 * Imported with the extension so `node --experimental-strip-types` can run this
 * beside the source without a bundler resolving the `@/` alias.
 */

import { strict as assert } from 'node:assert';
import { pickNextEntry } from './batch-queue-order.ts';

const NOW = 1_700_000_000_000;

function entry(id: string, status: string, scheduledAt?: number) {
  return { id, status, scheduledAt };
}

// ---- nothing to run ----
assert.equal(pickNextEntry([], NOW), undefined);
assert.equal(pickNextEntry([entry('a', 'done'), entry('b', 'failed')], NOW), undefined);

// ---- no schedules: plain queue order ----
assert.equal(pickNextEntry([entry('a', 'pending'), entry('b', 'pending')], NOW)?.id, 'a');

// A finished entry above a pending one is skipped, not waited on.
assert.equal(pickNextEntry([entry('a', 'done'), entry('b', 'pending')], NOW)?.id, 'b');

// ---- a due entry beats an earlier one still waiting for its slot ----
// This is the case that used to hang: 'a' is not due for another hour, 'b' was
// due a minute ago, and the queue parked on 'a' until its time came.
const jumped = pickNextEntry(
  [entry('a', 'pending', NOW + 3_600_000), entry('b', 'pending', NOW - 60_000)],
  NOW,
);
assert.equal(jumped?.id, 'b', 'the entry whose time has come runs now');

// An unscheduled entry counts as due, so it is not blocked either.
assert.equal(
  pickNextEntry([entry('a', 'pending', NOW + 3_600_000), entry('b', 'pending')], NOW)?.id,
  'b',
);

// Exactly on time counts as due, not as "still waiting".
assert.equal(pickNextEntry([entry('a', 'pending', NOW)], NOW)?.id, 'a');

// ---- nothing due: park on whichever comes soonest, not on the topmost ----
const soonest = pickNextEntry(
  [entry('a', 'pending', NOW + 7_200_000), entry('b', 'pending', NOW + 60_000)],
  NOW,
);
assert.equal(soonest?.id, 'b', 'waiting out the nearer slot keeps the queue honest');

// ---- only pending entries are ever picked ----
assert.equal(
  pickNextEntry([entry('a', 'running', NOW - 60_000), entry('b', 'pending', NOW - 60_000)], NOW)?.id,
  'b',
  'an entry already in flight is not started a second time',
);
assert.equal(pickNextEntry([entry('a', 'paused', NOW - 60_000)], NOW), undefined);

console.log('batch-queue order tests passed');

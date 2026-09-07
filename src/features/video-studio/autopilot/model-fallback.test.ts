import { strict as assert } from 'node:assert';
import { buildModelChain, runWithModelFallback } from './model-fallback.ts';
import { FLOW_ALL_ACCOUNTS_QUOTA_LOCKED } from '../packages/ai-core/providers/google-flow/types.ts';

const quotaWall = () => new Error(`${FLOW_ALL_ACCOUNTS_QUOTA_LOCKED}: hết hạn mức ngày cho model này`);

// ---- buildModelChain ----
assert.deepEqual(buildModelChain('Veo_3.1-Fast', ['Veo_3.1-Lite']), ['Veo_3.1-Fast', 'Veo_3.1-Lite']);
assert.deepEqual(buildModelChain('Veo_3.1-Fast', undefined), ['Veo_3.1-Fast'], 'no fallbacks = chain of one');
assert.deepEqual(
  buildModelChain('Veo_3.1-Fast', ['Veo_3.1-Fast', ' Veo_3.1-Lite ', '']),
  ['Veo_3.1-Fast', 'Veo_3.1-Lite'],
  'duplicates, padding and blanks must not create dead attempts',
);

// ---- runWithModelFallback ----
const attempted: string[] = [];

// The head model works: nothing else is tried and nothing is marked as fallback.
const first = await runWithModelFallback(['A', 'B'], async (model) => {
  attempted.push(model);
  return `made-with-${model}`;
});
assert.deepEqual(attempted, ['A']);
assert.equal(first.result, 'made-with-A');
assert.equal(first.fellBack, false);

// Quota wall on A: B runs, and the caller is told which model actually produced it.
attempted.length = 0;
const switched: string[][] = [];
const second = await runWithModelFallback(
  ['A', 'B', 'C'],
  async (model) => {
    attempted.push(model);
    if (model === 'A') throw quotaWall();
    return `made-with-${model}`;
  },
  (from, to) => switched.push([from, to]),
);
assert.deepEqual(attempted, ['A', 'B']);
assert.equal(second.model, 'B');
assert.equal(second.fellBack, true);
assert.deepEqual(switched, [['A', 'B']], 'exactly one switch, reported once');

// Any other failure is the caller's problem: a moderation refusal would be refused
// by every model too, so burning the rest of the chain on it is pure waste.
attempted.length = 0;
await assert.rejects(
  runWithModelFallback(['A', 'B'], async (model) => {
    attempted.push(model);
    throw new Error('MODERATION: content rejected');
  }),
  /MODERATION/,
);
assert.deepEqual(attempted, ['A'], 'a non-quota error must not walk the chain');

// Every model walled: the last quota error surfaces, not a generic one.
attempted.length = 0;
await assert.rejects(
  runWithModelFallback(['A', 'B'], async (model) => {
    attempted.push(model);
    throw quotaWall();
  }),
  new RegExp(FLOW_ALL_ACCOUNTS_QUOTA_LOCKED),
);
assert.deepEqual(attempted, ['A', 'B'], 'the whole chain must be tried before giving up');

// An empty chain still runs once, on whatever default the caller passes down.
const empty = await runWithModelFallback([], async (model) => `model=${model}`);
assert.equal(empty.result, 'model=');
assert.equal(empty.fellBack, false);

console.log('model-fallback: all assertions passed');

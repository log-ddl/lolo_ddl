import { strict as assert } from 'node:assert';
import { buildNarrationTimeline, extractNarrationBlocks } from './narration-timeline.ts';

const script = Array.from({ length: 12 }, (_, index) => `**Cảnh ${index + 1}**\nHình ảnh: Minh họa ${index + 1}\nThuyết minh: Đây là lời thuyết minh hoàn chỉnh của cảnh ${index + 1}.`).join('\n\n');
const narration = extractNarrationBlocks(script);
assert.equal(narration.length, 12, 'must extract all 12 narration blocks');

const estimated = buildNarrationTimeline(narration, 60_000, [], 0);
assert.equal(estimated[0].startMs, 0);
assert.equal(estimated.at(-1)?.endMs, 60_000);
assert.ok(estimated.every((beat) => beat.text.length > 0), 'every visual beat keeps narration');
assert.equal(
  estimated.map((beat) => beat.text).join(' ').replace(/\s+/g, ' ').trim(),
  narration.join(' ').replace(/\s+/g, ' ').trim(),
  'timeline must not lose narration',
);

const captions = Array.from({ length: 20 }, (_, index) => ({
  index,
  startMs: index * 1_000,
  endMs: (index + 1) * 1_000,
  text: `Câu ${index + 1}${index % 5 === 4 ? '.' : ''}`,
}));
const aligned = buildNarrationTimeline(narration, 20_000, captions, 2);
assert.equal(aligned[0].startMs, 0);
assert.equal(aligned.at(-1)?.endMs, 20_000);
assert.ok(aligned.length > 2, 'safety cap must not force overlong visual shots');
assert.ok(aligned.every((beat) => beat.endMs - beat.startMs <= 8_000));
assert.equal(
  aligned.map((beat) => beat.text).join(' ').replace(/\s+/g, ' ').trim(),
  narration.join(' ').replace(/\s+/g, ' ').trim(),
  'Whisper alignment must not replace or lose the locked script narration',
);

console.log(`AutoPilot timeline tests passed: ${narration.length} narration blocks, ${estimated.length} estimated shots, ${aligned.length} aligned shots.`);

import { strict as assert } from 'node:assert';
import { buildImportedPlanTimeline, buildNarrationTimeline, extractNarrationBlocks } from './narration-timeline.ts';

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

// ==================== Measured block timings ====================

// Deliberately lopsided: word count says every shot is the same length, the real
// audio says otherwise. Estimating puts shot 2 seconds away from where it is spoken.
const voiceOvers = ['Một hai ba', 'Bốn năm sáu', 'Bảy tám chín', 'Mười mười một mười hai'];
const measuredBlocks = [1_000, 9_000, 1_500, 3_500];
const measuredTotal = measuredBlocks.reduce((sum, value) => sum + value, 0);

const measuredPlan = buildImportedPlanTimeline(voiceOvers, measuredTotal, measuredBlocks);
assert.equal(measuredPlan.length, voiceOvers.length, 'one beat per imported shot');
assert.deepEqual(
  measuredPlan.map((beat) => [beat.startMs, beat.endMs]),
  [[0, 1_000], [1_000, 10_000], [10_000, 11_500], [11_500, 15_000]],
  'imported shots must sit on the measured block boundaries',
);
assert.deepEqual(measuredPlan.map((beat) => beat.text), voiceOvers, 'measured beats keep their own voice-over');

// The last block always closes on the audio, whatever the measurements sum to.
const shortMeasured = buildImportedPlanTimeline(voiceOvers, measuredTotal + 800, measuredBlocks);
assert.equal(shortMeasured.at(-1)?.endMs, measuredTotal + 800, 'last shot ends on the audio');

// A list that does not line up with the shots is refused outright: a partly-correct
// timeline is worse than an estimated one because it looks right at the start.
const mismatched = buildImportedPlanTimeline(voiceOvers, 20_000, [1_000, 2_000]);
assert.equal(mismatched.length, voiceOvers.length);
assert.equal(mismatched.at(-1)?.endMs, 20_000);
assert.notDeepEqual(
  mismatched.map((beat) => beat.startMs),
  measuredPlan.map((beat) => beat.startMs),
  'mismatched measurements must fall back to the word-count estimate',
);
const zeroed = buildImportedPlanTimeline(voiceOvers, 20_000, [1_000, 0, 1_500, 3_500]);
assert.notDeepEqual(zeroed.map((beat) => beat.startMs), measuredPlan.map((beat) => beat.startMs), 'a zero-length part is refused');

// ==================== Imported plan aligned on SRT ====================

// An imported voice file has no parts to measure, so the captions are the only
// truth available. These captions are deliberately uneven: shot 2 is spoken slowly
// over 9 seconds while shots 1, 3 and 4 are quick, which a word-count split cannot see.
const srtCaptions = [
  { index: 0, startMs: 0, endMs: 1_000, text: 'Một hai ba' },
  { index: 1, startMs: 1_000, endMs: 10_000, text: 'Bốn năm sáu' },
  { index: 2, startMs: 10_000, endMs: 11_500, text: 'Bảy tám chín' },
  { index: 3, startMs: 11_500, endMs: 15_000, text: 'Mười mười một mười hai' },
];
const srtAligned = buildImportedPlanTimeline(voiceOvers, 15_000, undefined, srtCaptions);
assert.deepEqual(
  srtAligned.map((beat) => [beat.startMs, beat.endMs]),
  [[0, 1_000], [1_000, 10_000], [10_000, 11_500], [11_500, 15_000]],
  'imported shots must sit on the caption timings, not on a word-count split',
);
assert.deepEqual(srtAligned.map((beat) => beat.text), voiceOvers);

// Captions that spell things differently from the script (digits, a Whisper
// transcript) still map, because the cut is placed by share of narration spoken.
const rewordedCaptions = [
  { index: 0, startMs: 0, endMs: 1_000, text: '123' },
  { index: 1, startMs: 1_000, endMs: 10_000, text: '4 5 6 bảy' },
  { index: 2, startMs: 10_000, endMs: 11_500, text: '789 mười' },
  { index: 3, startMs: 11_500, endMs: 15_000, text: '10 11 12' },
];
const rewordAligned = buildImportedPlanTimeline(voiceOvers, 15_000, undefined, rewordedCaptions);
assert.equal(rewordAligned.length, voiceOvers.length);
assert.equal(rewordAligned[0].startMs, 0);
assert.equal(rewordAligned.at(-1)?.endMs, 15_000);
assert.ok(
  rewordAligned.every((beat, index) => beat.endMs > beat.startMs && (index === 0 || beat.startMs === rewordAligned[index - 1].endMs)),
  'mismatched caption wording must still yield a gapless, forward-only timeline',
);
assert.ok(rewordAligned[1].endMs > 5_000, 'the slow caption must still stretch shot 2');

// Measurements outrank captions when both are there.
const bothSources = buildImportedPlanTimeline(voiceOvers, measuredTotal, measuredBlocks, [
  { index: 0, startMs: 0, endMs: 15_000, text: voiceOvers.join(' ') },
]);
assert.deepEqual(bothSources.map((beat) => beat.endMs), measuredPlan.map((beat) => beat.endMs), 'measured parts win over captions');

// Captions with no usable text fall through to the estimate rather than collapsing.
const emptyCaptions = buildImportedPlanTimeline(voiceOvers, 20_000, undefined, [
  { index: 0, startMs: 0, endMs: 0, text: '' },
]);
assert.equal(emptyCaptions.length, voiceOvers.length);
assert.equal(emptyCaptions.at(-1)?.endMs, 20_000);
assert.ok(emptyCaptions.every((beat) => beat.endMs > beat.startMs));

// Script path: measured blocks replace the estimate. The beat merger may group
// blocks together, but with every block under the beat cap it never cuts inside one,
// so each shot boundary is a moment the voice really moves on.
const scriptBlocks = 12;
const perBlockMs = Array.from({ length: scriptBlocks }, (_, index) => (index % 2 === 0 ? 1_200 : 4_800));
const scriptTotal = perBlockMs.reduce((sum, value) => sum + value, 0);
const measuredNarration = buildNarrationTimeline(narration, scriptTotal, [], 0, perBlockMs);
const boundaries = new Set<number>([0]);
let walk = 0;
for (const value of perBlockMs) { walk += value; boundaries.add(walk); }
assert.equal(measuredNarration.at(-1)?.endMs, scriptTotal);
assert.ok(
  measuredNarration.every((beat) => boundaries.has(beat.startMs) && boundaries.has(beat.endMs)),
  'measured beats may merge blocks but never cut inside one',
);
assert.equal(
  measuredNarration.map((beat) => beat.text).join(' ').replace(/\s+/g, ' ').trim(),
  narration.join(' ').replace(/\s+/g, ' ').trim(),
  'measured timeline must not lose narration',
);

console.log(`AutoPilot timeline tests passed: ${narration.length} narration blocks, ${estimated.length} estimated shots, ${aligned.length} aligned shots, ${measuredPlan.length} measured imported shots, ${measuredNarration.length} measured script shots.`);

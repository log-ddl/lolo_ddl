import assert from 'node:assert/strict';
import { cropRect, chromaKey, removeSolidBackground, imageEditSettings, DEFAULT_IMAGE_EDIT } from './image-processing';
assert.equal(imageEditSettings().aiBackground, true);
assert.equal(imageEditSettings({ autoBackground: true }).aiBackground, false);
assert.equal(imageEditSettings({ chroma: true }).autoBackground, false);
assert.equal(imageEditSettings({ crop: true, autoBackground: false }).autoBackground, false);
assert.deepEqual(cropRect(1920, 1080, DEFAULT_IMAGE_EDIT), { x: 0, y: 0, width: 1920, height: 1080 });
assert.deepEqual(cropRect(100, 80, { ...DEFAULT_IMAGE_EDIT, crop: true, x: 90, y: 90, width: 50, height: 50 }), { x: 90, y: 72, width: 10, height: 8 });
assert.deepEqual(cropRect(1920, 1080, { ...DEFAULT_IMAGE_EDIT, crop: true, ratio: '1:1' }), { x: 0, y: 0, width: 1080, height: 1080 });
assert.deepEqual(cropRect(1, 1, { ...DEFAULT_IMAGE_EDIT, crop: true, ratio: '9:16', x: 100 }), { x: 0, y: 0, width: 1, height: 1 });
const pixels = new Uint8ClampedArray([0,255,0,255, 255,0,0,180, 0,155,0,200, 0,255,0,0]);
chromaKey(pixels, { ...DEFAULT_IMAGE_EDIT, threshold: 80, softness: 40 });
assert.deepEqual([...pixels], [0,255,0,0, 255,0,0,180, 0,155,0,100, 0,255,0,0]);
const hard = new Uint8ClampedArray([0,255,0,255, 0,254,0,127]);
chromaKey(hard, { ...DEFAULT_IMAGE_EDIT, threshold: 0, softness: 0 });
assert.deepEqual([...hard], [0,255,0,0, 0,254,0,127]);
console.log('Crop boundaries, aspect ratio, hard/soft chroma key and source alpha checks passed.');
function solid(rgb: number[]) {
  return new Uint8ClampedArray(Array.from({ length: 81 }, () => [...rgb, 255]).flat());
}
// Different inputs in one batch must detect their own background, not reuse green.
for (const rgb of [[255, 255, 255], [0, 0, 0], [0, 255, 0]]) {
  const image = solid(rgb);
  const foreground = rgb[0] === 255 ? [0, 0, 0] : [255, 0, 255];
  for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) image.set([...foreground, 255], (y * 9 + x) * 4);
  // A same-colored detail enclosed by the subject must survive.
  image.set([...rgb, 180], 40 * 4);
  assert.equal(removeSolidBackground(image, 9, 9, DEFAULT_IMAGE_EDIT), true);
  assert.equal(image[3], 0);
  assert.equal(image[40 * 4 + 3], 180);
  assert.equal(image[20 * 4 + 3], 255);
}
const mixed = solid([255, 255, 255]);
for (let y = 0; y < 9; y++) for (let x = 0; x < 4; x++) mixed.set([0, 0, 0, 255], (y * 9 + x) * 4);
const original = mixed.slice();
assert.equal(removeSolidBackground(mixed, 9, 9, DEFAULT_IMAGE_EDIT), false);
assert.deepEqual(mixed, original);
const transparent = new Uint8ClampedArray(9 * 9 * 4);
assert.equal(removeSolidBackground(transparent, 9, 9, DEFAULT_IMAGE_EDIT), false);
assert.deepEqual(transparent, new Uint8ClampedArray(9 * 9 * 4));
const soft = solid([255, 255, 255]);
soft.set([155, 255, 255, 200], 10 * 4);
assert.equal(removeSolidBackground(soft, 9, 9, DEFAULT_IMAGE_EDIT), true);
assert.equal(soft[10 * 4 + 3], 100);
console.log('Auto background: independent colors, enclosed details, uncertain borders, transparency and soft alpha passed.');
// Pale soft edges used to be traversed, erasing a white interior even though
// the outer edge itself looked acceptable.
for (const shade of [200, 220]) {
  const image = solid([255, 255, 255]);
  for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) image.set([shade, shade, shade, 255], (y * 9 + x) * 4);
  image.set([255, 255, 255, 173], 40 * 4);
  assert.equal(removeSolidBackground(image, 9, 9, DEFAULT_IMAGE_EDIT), true);
  assert.equal(image[3], 0);
  assert.equal(image[40 * 4 + 3], 173, 'pale boundary must not leak into subject');
  assert.equal(image[30 * 4 + 3], 255, 'softening is confined to the exterior band');
}
const jpegNoise = solid([250, 250, 250]);
for (let p = 0; p < 81; p += 2) jpegNoise.set([253, 251, 249, 255], p * 4);
assert.equal(removeSolidBackground(jpegNoise, 9, 9, DEFAULT_IMAGE_EDIT), true);
assert.ok(Array.from({ length: 81 }, (_, p) => jpegNoise[p * 4 + 3]).every((alpha) => alpha === 0));
console.log('Pale subject leakage, bounded edge matting and mild background noise checks passed.');

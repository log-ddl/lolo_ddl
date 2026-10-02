const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Module = require('node:module');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { buildSync } = require('esbuild');
function load(entry) {
  const result = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
  const m = new Module(path.resolve('motion-test.cjs'), module); m.filename = path.resolve('motion-test.cjs'); m.paths = module.paths;
  m._compile(result.outputFiles[0].text, m.filename); return m.exports;
}
async function main() {
  const { renderMotion, cancelMotion, motionFrameSvg } = load('electron/features/video-studio/canvas-motion.ts');
  const { motionAt, motionBounds, motionMatrix, entranceSpring, MOTION_MODES } = load('src/features/video-studio/canvas/motion-math.ts');
  assert.equal(motionAt('motionFrames', 5, 5).imageIndex, 0);
  assert.equal(motionAt('motionFrames', 6, 5).imageIndex, 1);
  assert.equal(motionAt('motionFrames', 30, 5).imageIndex, 0);
  assert.equal(motionAt('motionBobbing', 12, 1).tilt, Math.sin(1) * 1.8);
  assert.equal(motionAt('motionBreathing', 10, 1).scaleY, 1 + Math.sin(1) * .018);
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'test-motion-'));
  const images = await Promise.all(['red', 'blue'].map(async color => {
    const b = await sharp({ create: { width: 64, height: 80, channels: 4, background: color } }).png().toBuffer();
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }));
  try {
    // Regress the original bug: shifts below half a pixel must not stay still.
    const encoded = Buffer.from(images[0]).toString('base64');
    const center = async (offset) => {
      const m = { ...motionAt('natural', 0, 1), x: offset };
      const svg = motionFrameSvg(64, 80, 100, 100, 50, 90, m, encoded);
      const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let sum = 0, weighted = 0;
      for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { const alpha = data[(y * info.width + x) * 4 + 3]; sum += alpha; weighted += x * alpha; }
      return weighted / sum;
    };
    const start = await center(0), shifted = await center(.25);
    assert.ok(Math.abs(shifted - start - .25) < .03, `subpixel displacement: ${shifted - start}`);
    for (const mode of MOTION_MODES) {
      const m = motionAt(mode, 7, 5, 1, 1);
      const matrix = motionMatrix(64, 80, m);
      assert.ok(Math.abs(matrix.a * 32 + matrix.c * 80 + matrix.e - m.x) < 1e-9, 'bottom-center X anchor');
      assert.ok(Math.abs(matrix.b * 32 + matrix.d * 80 + matrix.f - m.y) < 1e-9, 'bottom-center Y anchor');
    }
    assert.equal(motionAt('frames', 7, 5).scaleY, motionAt('natural', 7, 1).scaleY);
    assert.equal(entranceSpring(0), 0); assert.ok(Math.abs(entranceSpring(90) - 1) < .001);
    const cases = [...['motionBobbing', 'motionBreathing', 'motionFrames'].map(kind => ({ kind })), ...MOTION_MODES.map(mode => ({ kind: 'imageMotion', mode, intensity: 3, speed: 3 })), ...['pop', 'left', 'right', 'top', 'bottom'].map(entrance => ({ kind: 'imageMotion', mode: 'natural', entrance }))];
    for (const controls of cases) {
      const framesMode = controls.kind === 'motionFrames' || controls.mode === 'frames';
      const result = await renderMotion({ jobId: controls.kind + (controls.mode || ''), ...controls, duration: .4, images: framesMode ? images : images.slice(0, 1) }, folder);
      assert.equal(result.duration, .4);
      const file = path.join(folder, 'videos', result.url.split('/').pop());
      const decoded = spawnSync(ffmpeg, ['-v','error','-c:v','libvpx-vp9','-i',file,'-f','image2pipe','-vcodec','png','-frames:v','1','pipe:1']);
      assert.equal(decoded.status, 0, decoded.stderr.toString());
      const { data, info } = await sharp(decoded.stdout).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(data[3], 0, 'transparent padding is preserved in encoded video');
      if (!controls.entrance) assert.ok(data.some((value, index) => index % 4 === 3 && value === 255));
      else assert.ok(data.every((value, index) => index % 4 !== 3 || value === 0), 'spring starts transparent');
      const all = spawnSync(ffmpeg, ['-v','error','-c:v','libvpx-vp9','-i',file,'-f','rawvideo','-pix_fmt','rgba','pipe:1'], { maxBuffer: 32 * 1024 * 1024 });
      assert.equal(all.status, 0, all.stderr.toString());
      const bytes = info.width * info.height * 4;
      assert.equal(all.stdout.length / bytes, 12, 'exact frame count at 30 fps');
      if(controls.kind === 'motionFrames') {
        const center=(Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*4;
        assert.ok(all.stdout[center]>200);
        assert.ok(all.stdout[6*bytes+center+2]>200, 'second image begins at frame 6');
      }
    }
    for (const mode of MOTION_MODES.filter(mode => mode !== 'frames')) {
      const still = motionAt(mode, 20, 1, 0, 2);
      assert.equal(Math.abs(still.x) + Math.abs(still.y) + Math.abs(still.tilt), 0);
      assert.equal(still.scaleX, 1); assert.equal(still.scaleY, 1);
    }
    assert.equal(motionAt('frames', 3, 5, 1, 2).imageIndex, 1);
    const bounds = motionBounds(64, 80, 'spin', 120, 3, 3);
    assert.ok(bounds.width >= Math.hypot(64, 80));
    await assert.rejects(renderMotion({ jobId:'invalid-strength', kind:'imageMotion', duration:1, intensity:10, images:images.slice(0,1) }, folder), /controls/);
    const pending = renderMotion({ jobId: 'cancel', kind: 'motionBobbing', duration: 1, images: images.slice(0,1) }, folder);
    cancelMotion('cancel'); await assert.rejects(pending);
    await assert.rejects(renderMotion({ jobId:'invalid', kind:'motionFrames', duration:1, images:images.slice(0,1) }, folder), /Invalid motion images/);
    console.log('Motion rendering: all modes, subpixel displacement, fixed anchor, combined idle, spring, maximum strength, WebM alpha and cancellation passed.');
  } finally { await fs.rm(folder, { recursive:true, force:true }); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

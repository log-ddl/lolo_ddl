import assert from 'node:assert/strict';
import { outputMedia, saveOutputMedia } from './output-files';
import { canConnect } from './graph';
import { mediaFileStem } from './media-filename';
import { CANVAS_NODE_KINDS, type CanvasNodeState, type CanvasSpace } from './types';

async function main() {
  const node = (id: string, kind: CanvasNodeState['kind']): CanvasNodeState => ({ id, kind, index: 1, position: { x: 0, y: 0 }, prompt: '', model: '', refs: [], aspectRatio: '1:1', status: 'done', stale: false });
  const image = node('image', 'imageGenerator'), video = node('video', 'localVideo'), output = node('output', 'output');
  image.name = '../CON:logo';
  image.batchOutputs = ['data:image/png;base64,AQ==', 'data:image/png;base64,Ag=='].map((url) => ({ kind: 'image', url, model: '', createdAt: 1 }));
  video.output = { kind: 'video', url: 'data:video/mp4;base64,Aw==', model: '', createdAt: 1 };
  const space: CanvasSpace = { id: 'space', name: '', createdAt: 1, updatedAt: 1, nodes: [image, video, output], edges: [
    { id: 'a', source: 'image', target: 'output', targetHandle: 'images' },
    { id: 'b', source: 'video', target: 'output', targetHandle: 'videos' },
  ] };
  assert.equal(CANVAS_NODE_KINDS[CANVAS_NODE_KINDS.indexOf('imageEdit') + 1], 'output');
  assert.equal(canConnect(space.nodes, [], space.edges[0]), true);
  assert.equal(canConnect(space.nodes, [], { ...space.edges[0], targetHandle: 'media' }), true);
  assert.equal(canConnect(space.nodes, [], { ...space.edges[1], targetHandle: 'media' }), true);
  assert.equal(canConnect([...space.nodes, node('text', 'text')], [], { source: 'text', target: 'output', targetHandle: 'media' }), false);
  assert.equal(outputMedia(space, 'output').length, 3);
  const writes: any[] = [];
  const used = new Map<string, number>();
  (globalThis as any).window = { exportStorage: { writeFiles: async (payload: any) => {
    writes.push(payload);
    const name = payload.files[0].relativePath;
    const count = (used.get(name) || 0) + 1; used.set(name, count);
    return { success: true, writtenFiles: [count === 1 ? name : name.replace(/(\.[^.]+)$/, ` (${count})$1`)] };
  } } };
  const progress: number[] = [];
  await saveOutputMedia(space, 'output', 'D:/exports', undefined, (files) => progress.push(files.length));
  assert.deepEqual(progress, [1, 2, 3]);
  assert.deepEqual(writes.map((write) => new Uint8Array(write.files[0].data)[0]), [1, 2, 3]);
  assert.ok(writes.every((write) => write.baseDir === 'D:/exports' && !/[\\/:]/.test(write.files[0].relativePath)));
  assert.ok(writes[2].files[0].relativePath.endsWith('.mp4'));
  assert.equal(writes[0].files[0].relativePath, '..-CON-logo.png');
  assert.ok(writes.every((write) => write.uniqueNames === true));
  assert.equal(mediaFileStem('Con mèo'), 'Con mèo');
  assert.equal(mediaFileStem('CON'), '_CON');
  const previous = writes[0].files[0].relativePath;
  await saveOutputMedia(space, 'output', 'D:/exports', undefined, () => {});
  assert.equal(writes[3].files[0].relativePath, previous, 'native writer resolves collisions while preserving node name');
  const controller = new AbortController(); controller.abort();
  await assert.rejects(saveOutputMedia(space, 'output', 'D:/exports', controller.signal, () => {}), { name: 'AbortError' });
  assert.equal(writes.length, 6);
  (window.exportStorage!.writeFiles as any) = async () => ({ success: false, error: 'disk full' });
  await assert.rejects(saveOutputMedia(space, 'output', 'D:/exports', undefined, () => {}), /disk full/);
  console.log('Output: mixed media, batches, exact bytes, folder, safe unique names, cancellation and disk errors passed.');
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });

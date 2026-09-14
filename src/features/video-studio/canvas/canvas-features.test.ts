import assert from 'node:assert/strict';
import { prepareProposal } from './assistant';
import { exportSpace, importSpaceArchive } from './archive';
import { validateSpace } from './validation';
import type { CanvasSpace } from './types';

async function main() {
  const space: CanvasSpace = { id: 's', name: 'Test', createdAt: 1, updatedAt: 1, nodes: [], edges: [], viewport: { x: 3, y: 4, zoom: 0.8 } };
  const graph = prepareProposal(space, { message: 'Build', add: [
    { id: 't', kind: 'text', prompt: 'A cat' }, { id: 'i', kind: 'imageGenerator' }, { id: 'v', kind: 'videoGenerator' },
  ], connect: [{ source: 't', target: 'i', targetHandle: 'prompt' }, { source: 'i', target: 'v', targetHandle: 'start' }] });
  assert.equal(graph.nodes.length, 3); assert.equal(graph.edges.length, 2); assert.equal(space.nodes.length, 0);
  assert.throws(() => prepareProposal(space, { message: 'Bad', add: [{ id: 'i', kind: 'imageGenerator' }], connect: [{ source: 'missing', target: 'i', targetHandle: 'refs' }] }));
  assert.throws(() => prepareProposal(space, { message: 'Cycle', add: [{ id: 'a', kind: 'imageGenerator' }, { id: 'b', kind: 'imageGenerator' }], connect: [{ source: 'a', target: 'b', targetHandle: 'refs' }, { source: 'b', target: 'a', targetHandle: 'refs' }] }));
  const withOutput = { ...space, ...graph };
  withOutput.nodes[1].output = { kind: 'image', url: 'data:image/png;base64,AQID', model: 'test', createdAt: 2, prompt: 'original' };
  withOutput.nodes[1].outputs = [withOutput.nodes[1].output];
  withOutput.nodes[2].refs = ['data:video/mp4;base64,BAUG'];
  const proposal = prepareProposal(withOutput, { message: 'Edit', update: [{ id: graph.nodes[1].id, prompt: 'new' }] });
  assert.equal(proposal.nodes[1].stale, true); assert.equal(proposal.nodes[1].output?.prompt, 'original');
  const bundle = await exportSpace(withOutput, () => {});
  const file = new File([bundle], 'test.canvas');
  const restored = await importSpaceArchive(file, () => {});
  validateSpace(restored);
  assert.equal(restored.nodes[1].output?.url, restored.nodes[1].outputs?.[0].url, 'media deduplicated');
  assert.deepEqual(restored.viewport, space.viewport);
  const storage = (globalThis as any).__canvasBlobs as Map<string, Blob>;
  assert.deepEqual([...new Uint8Array(await storage.get(restored.nodes[1].output!.url)!.arrayBuffer())], [1, 2, 3]);
  assert.deepEqual([...new Uint8Array(await storage.get(restored.nodes[2].refs[0])!.arrayBuffer())], [4, 5, 6]);
  await assert.rejects(() => importSpaceArchive(new File(['bad'], 'bad.canvas'), () => {}));
  await assert.rejects(() => importSpaceArchive(new File([bundle.slice(0, bundle.size - 1)], 'cut.canvas'), () => {}));
  console.log('AI graph validation and binary archive round-trip checks passed.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

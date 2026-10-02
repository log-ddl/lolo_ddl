import assert from 'node:assert/strict';
async function main() {
  const memory = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) || null, setItem: (key: string, value: string) => memory.set(key, value) } });
  const calls: any[] = [];
  (globalThis as any).window = { canvasMotion: { onStarted: () => () => {}, render: async (request: any) => { calls.push(request); return { url: 'data:video/webm;base64,AQ==', duration: request.duration }; }, cancel: async () => {} }, exportStorage: { writeFiles: async () => ({ success: true }) } };
  const { useCanvasStore } = require('./canvas-store') as typeof import('./canvas-store');
  const { runNode } = require('./runner') as typeof import('./runner');
  const { parseWorkflowJson } = require('./json-workflow') as typeof import('./json-workflow');
  const api = useCanvasStore.getState();
  const space = api.createSpace('Motion');
  const a = api.addNode(space, 'localImage', { x: 0, y: 0 });
  const b = api.addNode(space, 'localImage', { x: 0, y: 300 });
  api.setLocalImage(space, a, 'data:image/png;base64,AQ==');
  api.setLocalImage(space, b, 'data:image/png;base64,Ag==');
  const sink = api.addNode(space, 'output', { x: 900, y: 0 });
  api.updateNode(space, sink, { outputDirectory: '/test' });
  for (const kind of ['imageMotion', 'motionBobbing', 'motionBreathing', 'motionFrames'] as const) {
    const node = api.addNode(space, kind, { x: 400, y: 0 });
    api.updateNode(space, node, { motionDuration: 2.5 });
    api.connect(space, { source: a, target: node, targetHandle: 'refs' });
    if (kind === 'motionFrames') api.connect(space, { source: b, target: node, targetHandle: 'refs' });
    api.connect(space, { source: node, target: sink, targetHandle: 'media' });
    await runNode(space, node);
    const request = calls[calls.length - 1];
    assert.equal(request.duration, 2.5); assert.equal(request.kind, kind);
    assert.equal(request.images.length, kind === 'motionFrames' ? 2 : 1);
    if (kind === 'motionFrames') assert.equal(new Uint8Array(request.images[1])[0], 2);
    const state = () => useCanvasStore.getState().spaces.find((s) => s.id === space)!.nodes.find((n) => n.id === node)!;
    assert.equal(state().output?.kind, 'video');
    api.updateNode(space, node, { motionDuration: 3 }); assert.equal(state().stale, true);
    if (kind === 'imageMotion') {
      await runNode(space, node);
      api.updateNode(space, node, { motionMode: 'spin', motionIntensity: 2, motionSpeed: 1.5 });
      assert.equal(state().stale, true);
      await runNode(space, node);
      assert.equal(calls[calls.length - 1].mode, 'spin'); assert.equal(calls[calls.length - 1].intensity, 2); assert.equal(calls[calls.length - 1].speed, 1.5);
      api.updateNode(space, node, { motionMode: 'frames' });
      api.connect(space, { source: b, target: node, targetHandle: 'refs' });
      await runNode(space, node); assert.equal(calls[calls.length - 1].images.length, 2);
    }
  }
  await runNode(space, sink);
  assert.equal(useCanvasStore.getState().spaces.find((s) => s.id === space)!.nodes.find((n) => n.id === sink)!.status, 'done');
  const { CANVAS_NODE_KINDS } = require('./types') as typeof import('./types');
  assert.ok(CANVAS_NODE_KINDS.includes('imageMotion'));
  assert.ok(!CANVAS_NODE_KINDS.includes('motionBobbing'));
  const raw = { nodes: [{ id: 'm', kind: 'motionBobbing', motionDuration: 2 }], edges: [] };
  assert.equal(parseWorkflowJson(JSON.stringify(raw)).nodes[0].motionDuration, 2);
  assert.throws(() => parseWorkflowJson(JSON.stringify({ ...raw, nodes: [{ ...raw.nodes[0], motionDuration: -1 }] })), /duration/);
  console.log('Motion graph: image ports, ordered frames, duration, stale outputs, video export and JSON import passed.');
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });

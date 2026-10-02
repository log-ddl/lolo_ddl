import assert from 'node:assert/strict';

async function main() {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) || null, setItem: (key: string, value: string) => memory.set(key, value) } });
  const written: string[] = [];
  (globalThis as any).window = {
    exportStorage: { writeFiles: async ({ files }: any) => { written.push(...files.map((file: any) => file.relativePath)); return { success: true, writtenFiles: files.map((file: any) => file.relativePath) }; } },
  };
  const { useCanvasStore } = require('./canvas-store') as typeof import('./canvas-store');
  const { runNode, runNodes, cancelSpace } = require('./runner') as typeof import('./runner');
  const api = useCanvasStore.getState();
  const space = api.createSpace('Parallel fan-out to shared output');
  const add = (kind: 'imageGenerator' | 'output', name: string) => {
    const id = api.addNode(space, kind, { x: 0, y: 0 });
    api.updateNode(space, id, { prompt: name, name, ...(kind === 'output' ? { outputDirectory: '/test-output' } : {}) });
    return id;
  };
  const root = add('imageGenerator', 'root');
  const children = Array.from({ length: 4 }, (_, i) => add('imageGenerator', `child-${i}`));
  const sink = add('output', 'sink');
  for (const id of children) {
    api.connect(space, { source: root, target: id, targetHandle: 'refs' });
    api.connect(space, { source: id, target: sink, targetHandle: 'media' });
  }
  const started: string[] = [], finished = new Set<string>();
  let active = 0, peak = 0;
  (globalThis as any).__canvasGenerate = async (input: any) => {
    const name = input.prompt;
    started.push(name);
    if (name.startsWith('child')) assert.ok(finished.has('root'), 'child waits for its reference');
    active++; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 20));
    active--; finished.add(name);
    return { localUrl: `data:image/png;base64,${Buffer.from(name).toString('base64')}` };
  };
  await runNode(space, sink);
  assert.equal(started.filter((name) => name === 'root').length, 1, 'shared source runs once');
  assert.equal(peak, 4, 'four siblings overlap behind a single Output');
  assert.equal(written.length, 4);

  const bad = children[0];
  const blocked = add('imageGenerator', 'blocked-child');
  api.connect(space, { source: bad, target: blocked, targetHandle: 'refs' });
  api.connect(space, { source: blocked, target: sink, targetHandle: 'media' });
  api.updateNode(space, bad, { prompt: 'bad' }); // Old successful output remains, but must not be saved.
  const independent = add('imageGenerator', 'independent');
  let failedAttempts = 0;
  const seen: string[] = [];
  (globalThis as any).__canvasGenerate = async (input: any) => {
    seen.push(input.prompt);
    if (input.prompt === 'bad') { failedAttempts++; throw new Error('Broken source'); }
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { localUrl: 'data:image/png;base64,AQ==' };
  };
  written.length = 0;
  await assert.rejects(runNodes(space, [sink, independent]), /Broken source/);
  assert.equal(failedAttempts, 1, 'failed shared source is not retried by each branch');
  assert.ok(seen.includes('independent'), 'unrelated terminal still runs');
  assert.ok(!seen.includes('blocked-child'), 'descendant cannot consume failed old output');
  const nodes = () => useCanvasStore.getState().spaces.find((item) => item.id === space)!.nodes;
  assert.equal(nodes().find((node) => node.id === independent)?.status, 'done');
  assert.equal(nodes().find((node) => node.id === blocked)?.error, 'UPSTREAM_FAILED');
  assert.equal(nodes().find((node) => node.id === sink)?.status, 'done');
  assert.equal(written.length, 3, 'Output saves successful siblings only');

  // Cancellation drains all launched branches before the run promise settles.
  for (const id of children.slice(1)) api.updateNode(space, id, { prompt: `cancel-${id}` });
  let live = 0;
  (globalThis as any).__canvasGenerate = (input: any) => new Promise((resolve, reject) => {
    live++;
    const timer = setTimeout(() => { live--; resolve({ localUrl: 'data:image/png;base64,Ag==' }); }, 100);
    input.signal.addEventListener('abort', () => { clearTimeout(timer); live--; reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
  });
  const running = runNodes(space, children.slice(1));
  await new Promise((resolve) => setTimeout(resolve, 5));
  cancelSpace(space);
  await assert.rejects(running, { name: 'AbortError' });
  assert.equal(live, 0);
  assert.equal(nodes().some((node) => node.status === 'running'), false);
  console.log('Scheduler: shared Output parallelism, dependency ordering, deduplication, failure isolation, partial export and cancellation passed.');
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseWorkflowJson, importWorkflowJson } from './json-workflow';

async function main() {
  const sample = readFileSync('docs/examples/canvas-workflow.json', 'utf8');
  const space = parseWorkflowJson(sample);
  assert.equal(space.nodes[0].prompt.includes('chú mèo'), true);
  assert.equal(space.nodes[1].model, 'NARWHAL');
  assert.equal(space.nodes[1].status, 'idle');
  assert.deepEqual(space.nodes[1].refs, []);
  assert.equal(space.edges[0].source, space.nodes[0].id);
  assert.ok(space.edges[0].id);
  const wrapped = parseWorkflowJson(JSON.stringify({ version: 1, space, assets: [] }));
  assert.deepEqual(wrapped.nodes, space.nodes);
  const dirty = structuredClone(space);
  Object.assign(dirty.nodes[1], { status: 'running', stale: true, output: { url: 'asset:0' }, outputs: [{}], textOutput: 'old result', error: 'old failure' });
  const clean = parseWorkflowJson(JSON.stringify(dirty)).nodes[1];
  assert.equal(clean.status, 'idle'); assert.equal(clean.stale, false);
  assert.equal(clean.output, undefined); assert.equal(clean.outputs, undefined); assert.equal(clean.textOutput, undefined); assert.equal(clean.error, undefined);
  for (const value of [null, [], { nodes: [], edges: null }, { version: 2, space }, { space, assets: [{}] }, { ...space, nodes: [space.nodes[0], space.nodes[0]] }, { ...space, edges: [{ source: 'missing', target: 'image-1', targetHandle: 'refs' }] }, { ...space, nodes: [{ ...space.nodes[0], kind: 'unknown' }] }]) {
    assert.throws(() => parseWorkflowJson(JSON.stringify(value)));
  }
  assert.throws(() => parseWorkflowJson('{bad json'));
  assert.equal(parseWorkflowJson('\uFEFF' + sample).nodes.length, 2);
  await assert.rejects(importWorkflowJson(new Blob([' '.repeat(16 * 1024 * 1024 + 1)])), /16 MB/);
  assert.equal((await importWorkflowJson(new Blob([sample]))).nodes.length, 2);
  console.log('JSON workflow: defaults, prompts, wrapped manifest, reset state, invalid graph and size checks passed.');
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });

const esbuild = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const mocks = {
  'image-processing': 'export const processImage=async(source,settings)=>{globalThis.__localEdits=(globalThis.__localEdits||0)+1;return new Blob([source],{type:"image/png"})};',
  'feature-router': 'export const getFeatureConfig=()=>null;',
  'script-parser': 'export const callChatAPI=()=>{throw new Error("No external AI calls in tests")};',
  'google-flow-provider': 'export const googleFlowProvider={generateImage:async(input)=>{if(input.signal?.aborted)throw new DOMException("Cancelled","AbortError");return globalThis.__canvasGenerate(input)}};',
  'video-generator': 'export const generateProviderVideo=(input)=>{if(globalThis.__canvasGenerateVideo)return globalThis.__canvasGenerateVideo(input);throw new Error("Unexpected video call")};',
  'media-routing': 'export const googleFlowBoundModel=()=>"mock";export const resolveSettingsMediaRouting=async()=>({chain:["mock"],accountsFor:()=>undefined,modelChains:{}});',
  'image-storage': 'export const readImageAsBase64=async(url)=>url;',
  'browser-image-storage': 'globalThis.__canvasBlobs=new Map();export const isIdbImagePath=(url)=>url.startsWith("idb-image://");export const readBlobFromBrowserStorage=async(url)=>globalThis.__canvasBlobs.get(url);export const saveBlobToBrowserStorage=async(blob)=>{const id="idb-image://"+crypto.randomUUID();globalThis.__canvasBlobs.set(id,blob);return id};export const deleteFromBrowserStorage=async(id)=>globalThis.__canvasBlobs.delete(id);',
};
async function main() {
  const test = process.argv[2] || 'canvas-store';
  const entry = `src/features/video-studio/canvas/${test}.test.ts`;
  const result = await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{ name: 'canvas-test-mocks', setup(build) {
    if(test === 'canvas-runner') build.onResolve({ filter: /\/image-processing$/ }, () => ({ path: 'image-processing', namespace: 'mock' }));
    build.onResolve({ filter: /\/(feature-router|script-parser|google-flow-provider|video-generator|media-routing|image-storage|browser-image-storage)$/ }, (args) => ({ path: args.path.split('/').pop(), namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: mocks[args.path], loader: 'js' }));
  } }] });
  const module = new Module(path.resolve(entry), moduleParent());
  module.filename = path.resolve(entry); module.paths = Module._nodeModulePaths(process.cwd()); module._compile(result.outputFiles[0].text, module.filename);
}
function moduleParent() { return module; }
main().catch((error) => { console.error(error); process.exitCode = 1; });

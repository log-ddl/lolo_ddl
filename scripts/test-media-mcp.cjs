const esbuild = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const mocks = {
  'license-store': 'export const useLicenseStore={getState:()=>({userId:"user",plan:globalThis.__mcpTest.plan,status:"active",deviceAllowed:true})}',
  'license-client': 'export const hasPlanAccess=(plan)=>plan!=="free"',
  'project-store': 'export const useProjectStore={getState:()=>({activeProjectId:"project"})}',
  'api-key-manager': 'export const GOOGLE_FLOW_IMAGE_MODELS=["GEM_PIX_2","NARWHAL"];export const GOOGLE_FLOW_VIDEO_MODELS=["Veo_3.1-Fast","Gemini_Omni_Flash"];export const GROK_VIDEO_MODELS=["Grok Imagine Video"];export const QWEN_LOCAL_IMAGE_MODEL="Qwen/Qwen-Image-2.1";',
  'media-routing': 'export const configuredImageModel=()=>"GEM_PIX_2";export const configuredVideoModel=()=>"Veo_3.1-Fast";export const resolveSettingsMediaRouting=async()=>({accountsFor:()=>["owner-a"]});',
  'qwen-local-provider': 'export const generateImageWithSelectedProvider=async(input)=>{globalThis.__mcpTest.calls.push({kind:"image",...input});return {provider:"googleflow",localUrl:"local-image://images/result.png",ownerScopeId:"owner-a",mediaId:"media-a"}}',
  'google-flow-provider': 'export const googleFlowProvider={generateVideo:async(input)=>{globalThis.__mcpTest.calls.push({kind:"video",...input});return {provider:"googleflow",localUrl:"local-image://videos/result.mp4"}}}',
  'grok-video-provider': 'export const grokVideoProvider={generateVideo:async()=>{throw new Error("Unexpected Grok call")}}',
  'image-storage': 'export const getAbsoluteImagePath=async(source)=>"D:/media/"+source.split("/").pop();export const readImageAsBase64=async()=>"data:image/png;base64,YQ==";',
  'tts-store': 'export const useTtsStore={getState:()=>({selectedModelId:"omnivoice-main",voiceProfiles:globalThis.__mcpTest.profiles,speed:1,language:"vi",splitMode:"default",addVoiceProfile:p=>globalThis.__mcpTest.profiles.push(p),addHistory:h=>globalThis.__mcpTest.history.push(h)})}',
};
async function main() {
  const entry = path.resolve('src/features/content-chat/mcp/media-tools.test.ts');
  const result = await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{ name: 'mcp-test-mocks', setup(build) {
    build.onResolve({ filter: /\/(license-store|license-client|project-store|api-key-manager|media-routing|qwen-local-provider|google-flow-provider|grok-video-provider|image-storage|tts-store)$/ }, (args) => ({ path: args.path.split('/').pop(), namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: mocks[args.path], loader: 'js' }));
  } }] });
  const testModule = new Module(entry, module);
  testModule.filename = entry; testModule.paths = Module._nodeModulePaths(process.cwd());
  testModule._compile(result.outputFiles[0].text, entry);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

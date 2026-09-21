const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const mocks = {
  i18n: `export const useI18n=()=>({t:(key,vars={})=>Object.entries(vars).reduce((text,[name,value])=>text.replace('{'+name+'}',String(value)),window.labels[key]||key)}); export const translate=(_lang,key)=>window.labels[key]||key;`,
  'ui-preferences-store': `export const useUIPreferencesStore={getState:()=>({uiLanguage:'vi'})};`,
  'google-flow-runtime-store': `export const useGoogleFlowRuntimeStore=(select)=>select({status:{credentials:[window.account]},initialize:()=>()=>{}});`,
  'video-studio-settings-store': `export const useVideoStudioSettingsStore=(select)=>select({mediaRouting:{ultraOwnerScopeIds:[]}});`,
  'task-metadata/store': `export const useTaskMetadataStore=(select)=>select({records:{}});`,
};
async function main() {
  const { build } = require('esbuild');
  const result = await build({ stdin: { resolveDir: root, sourcefile: 'canvas-menu-fixture.tsx', loader: 'tsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import labels from './src/shared/i18n/messages/vi/canvas-ui';
    import {Dialog,DialogContent,DialogTitle} from './src/shared/components/ui/dialog';
    import {ImageDownloadMenu} from './src/features/video-studio/components/panels/canvas/image-download-menu';
    import {NodePicker} from './src/features/video-studio/components/panels/canvas/node-picker';
    import {UpscaleNodeControls} from './src/features/video-studio/components/panels/canvas/upscale-node-controls';
    window.labels=labels;window.downloads=[];window.upscales=[];
    window.account={ownerScopeId:'owner',credentialId:'credential',state:'ready',tier:location.search?'PAYGATE_TIER_TWO':'PAYGATE_TIER_ONE'};
    const output={kind:'image',url:'original.jpg',model:'NARWHAL',mediaId:'media',ownerScopeId:'owner',createdAt:1};
    const state={kind:location.search.includes('upscale-node')?'imageUpscale':'imageGenerator',id:'node',index:1,prompt:'',refs:[],model:'NARWHAL',aspectRatio:'16:9',status:'done',stale:false,position:{x:0,y:0},output};
    createRoot(document.getElementById('root')).render(<>
      <NodePicker at={{x:20,y:20}} accepts='image' onClose={()=>{}} onPick={kind=>window.picked=kind}/>
      <div style={{position:'absolute',top:30,left:380,width:280}}><UpscaleNodeControls data={{state:{...state,kind:'imageUpscale'},upscaleSources:[output],onChange:()=>{},onRun:()=>{},onCancel:()=>{}}}/></div>
      <Dialog defaultOpen><DialogContent aria-describedby={undefined}><DialogTitle>Ảnh xem trước</DialogTitle>
        <div style={{height:220,background:'#eee'}}>Ảnh</div>
        <ImageDownloadMenu state={state} expanded downloading={false} onDownload={async output=>{window.downloads.push(output.url)}}
          onUpscale={async(resolution,download)=>{window.upscales.push(resolution);await download({...output,url:resolution+'.jpg'})}}/>
      </DialogContent></Dialog>
    </>);
  ` }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'fixture-stores', setup(build) {
    build.onResolve({filter: /i18n$|ui-preferences-store$|google-flow-runtime-store$|video-studio-settings-store$|task-metadata\/store$/}, ({path: name}) => {
      const key = Object.keys(mocks).find(key => name.endsWith(key));
      return key ? {path:key,namespace:'mock'} : undefined;
    });
    build.onLoad({filter:/.*/,namespace:'mock'}, ({path:key}) => ({contents:mocks[key],loader:'js'}));
  }}] });
  const assets = path.join(root, 'out/renderer/assets');
  const css = fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(name => /^index-.*\.css$/.test(name))), 'utf8');
  const server = http.createServer((req,res) => {
    res.setHeader('content-type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? result.outputFiles[0].text : '<html><head><style>'+css+'</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.platform === 'win32' ? {channel:'chrome'} : {})});
    const page = await browser.newPage({viewport:{width:1100,height:850}});
    const errors=[];page.on('pageerror', error=>errors.push(error.message));
    const url='http://127.0.0.1:'+server.address().port;
    await page.goto(url);
    await page.getByRole('button',{name:'Tải ảnh',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.downloads),['original.jpg']);
    assert.deepEqual(await page.evaluate(()=>window.upscales),[]);
    const quality = page.getByRole('combobox',{name:'Độ phân giải tải về'});
    assert.equal(await quality.inputValue(),'original');
    assert.equal(await quality.locator('option[value="4K"]').isDisabled(),true);
    await quality.selectOption('2K');
    assert.deepEqual(await page.evaluate(()=>window.downloads),['original.jpg']);
    assert.deepEqual(await page.evaluate(()=>window.upscales),[]);
    await page.getByRole('button',{name:'Tải ảnh',exact:true}).click();
    await page.waitForFunction(()=>window.downloads.length===2);
    assert.deepEqual(await page.evaluate(()=>window.upscales),['2K']);
    await page.goto(url+'/?ultra');
    await quality.selectOption('4K');
    assert.deepEqual(await page.evaluate(()=>window.upscales),[]);
    await page.getByRole('button',{name:'Tải ảnh',exact:true}).click();
    await page.waitForFunction(()=>window.downloads.includes('4K.jpg'));
    await page.getByRole('button',{name:'common.close'}).click();
    await page.getByText('Upscale ảnh',{exact:true}).click();
    assert.equal(await page.evaluate(()=>window.picked),'imageUpscale');
    await page.goto(url+'/?upscale-node');
    assert.equal(await page.getByRole('dialog').getByRole('combobox').count(),0);
    await page.getByRole('button',{name:'Tải ảnh',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.downloads),['original.jpg']);
    assert.deepEqual(await page.evaluate(()=>window.upscales),[]);
    assert.deepEqual(errors,[]);
    console.log('Browser checks passed: separate resolution selector and download button work; selecting does not download; upscale nodes download directly.');
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1});

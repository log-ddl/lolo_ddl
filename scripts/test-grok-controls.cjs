const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('extensions/logdd/grok-page-bridge.js','utf8');
const fn=source.slice(source.indexOf('  async function openComposerMenu('),source.indexOf('  async function selectAspectRatio'));
async function test(label, initial, target){
 let open=false, clicks=0;
 const trigger={textContent:initial,disabled:false,getClientRects:()=>[1],getAttribute:key=>key==='aria-label'?label:key==='aria-haspopup'?'menu':key==='aria-expanded'?String(open):null,focus:()=>{},dispatchEvent:event=>{assert.equal(event.key,'ArrowDown');open=true;clicks++},click:()=>{throw Error('click alone must not open a Radix menu')}};
 const option={textContent:target,disabled:false,getClientRects:()=>open?[1]:[],getAttribute:()=>null,click:()=>{trigger.textContent=target;open=false}};
 const context={KeyboardEvent:class {constructor(type,init){this.type=type;Object.assign(this,init)}},document:{querySelectorAll:selector=>selector.startsWith('button')?[trigger]:selector.includes('menuitem')?[option]:[]},waitForElement:async find=>{const value=find();if(!value)throw Error('Missing control');return value}};
 vm.createContext(context);vm.runInContext(fn,context);
 assert.equal(await context.selectRadioOption(label.includes('lượng')?'Video duration':'Video resolution',target,undefined,true),true);
 assert.equal(trigger.textContent,target);assert.equal(open,false);assert.equal(clicks,initial===target?0:1);
}
(async()=>{await test('Độ phân giải video','480p','720p');await test('Video resolution','720p','720p');await test('Video resolution','1080p','480p');await test('Thời lượng video','6s','10s');await test('Thời lượng video','10s','15s');await test('Độ phân giải video','720p','1080p');await test('Độ phân giải video','720p','480p');console.log('Grok new dropdown selection checks passed');})().catch(e=>{console.error(e);process.exitCode=1});

// Public controls regression; fresh browser, generated local audio only.
import {spawn,spawnSync} from 'node:child_process'
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const output='docs/evidence/interface-quick-actions',temporary=await mkdtemp(join(tmpdir(),'echo-quick-actions-'))
await mkdir(output,{recursive:true})
const generated=spawnSync(process.execPath,['scripts/generate-audio-fixture.ts','--long'],{encoding:'utf8'});assert.equal(generated.status,0,generated.stderr)
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>r(p))})})
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws;const report:Record<string,any>={source:'Production build, fresh headless Brave/CDP profile, generated local WAV only. Play wrapper observes the real generated element; sharing rejection explicitly mocked, native picker/audibility not verified.',errors:[],screenshots:[],checks:[]}
try{
 let pages;for(let i=0;i<120;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(500)}
 const metrics=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(300)}
 const screenshot=async name=>{await pause(500);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${output}/${name}.png`,Buffer.from(shot.data,'base64'));report.screenshots.push(name)}
 const bounds=async()=>evaluate(`(()=>{const selectors=['#scene-select','.primary-button','.file-button','.chooser-trigger'];return {viewport:[innerWidth,innerHeight],page:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],items:selectors.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {selector:s,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:hit===e||e.contains(hit)}})}})()`)
 const assertVisible=async()=>{const b=await bounds();assert.ok(b.page[0]<=b.viewport[0]&&b.page[1]<=b.viewport[1]);for(const r of b.items)assert.ok(r.width>0&&r.height>=40&&r.x>=0&&r.y>=0&&r.right<=b.viewport[0]+1&&r.bottom<=b.viewport[1]+1&&r.hit,JSON.stringify(r));return b}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable');await metrics(1440,810)
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__uiAudio=this;window.__uiPlayCalls=(window.__uiPlayCalls||0)+1;return play.call(this)}`})
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 for(const [scene,name]of [['bloom','Bloom'],['nocturne','Nocturne'],['lavender-peaks','Lavender Peaks'],['crimson-horizon','Crimson Horizon']] as const){
  await select('scene-select',scene);await wait(`document.querySelector('[class$="-brand"]')?.textContent===${JSON.stringify(name)}`)
  assert.equal(await evaluate(`['#scene-select','.primary-button','input[type=file]'].every(s=>!document.querySelector(s).closest('details'))`),true)
  assert.equal(await evaluate('document.querySelector("details").open'),false)
  assert.equal(await evaluate(`document.querySelector('main h1').textContent`),name+' — music visualizer')
  await assertVisible();await screenshot(scene+'-toolbar')
 }
 await select('scene-select','nocturne')
 const dom=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'})
 await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-permitted-tones-long.wav']});await wait('!!document.querySelector(".scene-player button")')
 await evaluate('document.querySelector(".scene-player button").click();true');await wait('window.__uiAudio && !window.__uiAudio.paused && window.__uiAudio.currentTime>.1')
 await evaluate('window.__uiOriginalAudio=window.__uiAudio;true')
 for(const scene of ['bloom','lavender-peaks','crimson-horizon','nocturne']){await select('scene-select',scene);assert.equal(await evaluate('window.__uiAudio===window.__uiOriginalAudio&&!window.__uiAudio.paused'),true)}
 await select('graphics-quality','low');await select('graphics-quality','standard')
 assert.equal(await evaluate('window.__uiAudio===window.__uiOriginalAudio&&!window.__uiAudio.paused'),true)
 await screenshot('desktop-player');report.checks.push('External landscape/source controls; four matching scene titles; generated playback and same audio element retained across all scenes/quality')
 await evaluate('document.querySelector("summary").focus();true');assert.equal(await evaluate('document.activeElement===document.querySelector("summary")'),true);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait('document.querySelector("details").open')
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('button,label')).some(e=>e.textContent.trim()==='Reactivity'||e.textContent.trim()==='Enter fullscreen')`),false)
 await assertVisible();await screenshot('desktop-options')
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector("details").open');assert.equal(await evaluate('document.activeElement===document.querySelector("summary")'),true)
 for(const [width,height,label]of [[390,844,'portrait'],[320,568,'narrow'],[844,390,'short']] as const){
  await metrics(width,height);report.checks.push({viewport:label,bounds:await assertVisible()});await screenshot(label+'-toolbar')
  await evaluate('document.querySelector("details").open=true;true');await pause(150)
  const r=await evaluate(`(()=>{const r=document.querySelector('.audio-controls').getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight}})()`)
  assert.ok(r.x>=0&&r.y>=0&&r.right<=r.w+1&&r.bottom<=r.h+1,JSON.stringify(r));await assertVisible();await screenshot(label+'-options')
  await evaluate('document.querySelector("details").open=false;true')
 }
 await metrics(1440,810)
 await evaluate('document.querySelector(".scene-player button").click();true');await wait('window.__uiAudio.paused')
 await evaluate('document.querySelector(".scene-player button").click();true');await wait('!window.__uiAudio.paused')
 await evaluate('document.querySelector("details").open=true;document.querySelector(".disconnect-button").click();true');await wait('!document.querySelector(".scene-player")');assert.equal(await evaluate('document.activeElement===document.querySelector("input[type=file]")'),true)
 // Explicitly mocked rejection exercises external action routing without opening a native picker.
 await evaluate(`navigator.mediaDevices.getDisplayMedia=async options=>{window.__uiShareCalls=(window.__uiShareCalls||0)+1;window.__uiShareOptions=options;throw new DOMException('Generated UI test rejection','NotAllowedError')};document.querySelector('details').open=false;document.querySelector('.primary-button').click();true`)
 await wait('document.querySelector(".source-status").textContent.includes("cancelled or denied")');assert.equal(await evaluate('window.__uiShareCalls'),1);assert.equal(await evaluate('window.__uiShareOptions.audio'),true)
 report.checks.push('Keyboard Options open/Escape focus, responsive action hit targets/panel bounds, real generated pause/play/disconnect and file focus restore, external Share action with mocked denial')
 assert.deepEqual(report.errors,[]);report.status='passed';console.log('PASS public quick actions, four scene labels, generated playback, desktop/portrait/narrow/short layouts')
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

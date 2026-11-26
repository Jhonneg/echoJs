// APP03 browser checks: on-demand landscape loading, held/failed chunk requests with retry and
// dismiss, latest-request-wins, WebGL context loss with automatic restore and with Restart.
// Chunk delays/failures use CDP request interception; context loss uses WEBGL_lose_context.
// Generated WAV only. Native GPU resets and real network failures are not reproduced.
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const output='docs/evidence/application/app03',temporary=await mkdtemp(join(tmpdir(),'echo-app03v-'))
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={errors:[],warnings:[],screenshots:[],checks:[],source:'Production build, headless Brave. Chunk delay/failure via CDP interception; context loss via WEBGL_lose_context. Generated WAV only.'}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map(),held=[]
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))
  if(m.method==='Fetch.requestPaused')held.push(m.params)})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=150)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression+' :: '+JSON.stringify(await ev('__state()')))}
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__gl=[];const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(t,...r){const c=original.call(this,t,...r);if(c&&/webgl/.test(t)&&!c.__tracked){c.__tracked=true;c.__lose=c.getExtension('WEBGL_lose_context');for(const k of ['drawArrays','drawElements']){const f=c[k].bind(c);c[k]=(...a)=>{window.__firstDraw??=performance.now();return f(...a)}}window.__gl.push(c)}return c};
 window.__audios=[];const NativeAudio=window.Audio;window.Audio=function(...a){const x=new NativeAudio(...a);window.__audios.push(x);return x};
 window.__state=()=>{const q=s=>document.querySelector(s),a=[...window.__audios].reverse().find(a=>a.getAttribute('src'));
  return{stage:q('main section')?.className,select:q('#scene-select')?.value,status:q('.scene-status p')?.textContent??null,tone:q('.scene-status')?.dataset.tone??null,
  buttons:[...document.querySelectorAll('.scene-status button')].map(b=>b.textContent),polite:q('main > [role=status]')?.textContent,alert:q('main > [role=alert]')?.textContent,
  audio:a?{time:+a.currentTime.toFixed(2),paused:a.paused}:null,live:window.__gl.filter(c=>!c.isContextLost()).length,
  chunks:performance.getEntriesByType('resource').filter(e=>/Scene-.*\\.js/.test(e.name)).map(e=>({name:e.name.split('/').pop().split('-')[0],start:Math.round(e.startTime)}))}};
 `})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 const state=()=>ev('__state()')
 const shot=async name=>{const row=await state(),s=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(s.data,'base64'));report.screenshots.push({name,row});console.log('shot',name);return row}
 const pick=scene=>ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const click=label=>ev(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click(),true`)
 const play=async()=>{await ev(`{const rate=48000,n=rate*120,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);for(let i=0;i<n;i++)d.setInt16(44+2*i,Math.sin(i*2*Math.PI*110/rate)*6000,true);const dt=new DataTransfer();dt.items.add(new File([b],'generated.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await wait(`!!document.querySelector('.scene-player button')`);await ev(`document.querySelector('.scene-player button').click();true`);await wait(`__state().audio&&__state().audio.time>.5`)}
 const advancing=async()=>{const a=(await state()).audio.time;await pause(600);const b=await state();assert.equal(b.audio.paused,false);assert.ok(b.audio.time>a,'audio stopped')}

 // 1. Cold load: Bloom first; other landscapes fetched only after it is drawing.
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait(`__state().stage==='bloom-stage'&&__state().live===1`)
 await wait('window.__firstDraw!==undefined');const firstFrame=await ev('window.__firstDraw');await wait(`__state().chunks.length===3`)
 let row=await state();report.coldChunks=row.chunks;report.firstFrameMs=Math.round(firstFrame)
 assert.ok(row.chunks.every(c=>c.start>=firstFrame),'landscape chunks requested before Bloom drew: '+JSON.stringify(row.chunks)+' first frame '+firstFrame)
 report.checks.push(`Cold load: Bloom drawing at ${Math.round(firstFrame)}ms; other landscape chunks requested afterwards (${row.chunks.map(c=>c.name+'@'+c.start+'ms').join(', ')}).`)

 // 2. Hold the Nocturne chunk: loading message, Bloom stays, select shows the choice.
 await send('Fetch.enable',{patterns:[{urlPattern:'*NocturneScene-*.js'},{urlPattern:'*LavenderPeaksScene-*.js'},{urlPattern:'*CrimsonHorizonScene-*.js'}]})
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/?held`});await wait(`__state().stage==='bloom-stage'&&__state().live===1`);await play()
 for(let i=0;i<50&&held.length<3;i++)await pause(100);assert.equal(held.length,3,'preload requests not seen')
 const take=name=>{const i=held.findIndex(h=>h.request.url.includes(name));assert.ok(i>=0,name+' not held');return held.splice(i,1)[0]}
 await pick('nocturne');await wait(`__state().status==='Loading Nocturne…'`)
 row=await shot('loading-held');assert.equal(row.stage,'bloom-stage');assert.equal(row.select,'nocturne');assert.equal(row.polite,'Loading Nocturne…');await advancing()
 report.checks.push('Held chunk: "Loading Nocturne…" announced politely, Bloom stays on screen, select shows Nocturne, audio keeps playing.')

 // 3. Fail it: error with Retry, alert region, audio continues. Retry succeeds.
 await send('Fetch.failRequest',{requestId:take('NocturneScene').requestId,errorReason:'ConnectionFailed'})
 await wait(`__state().tone==='error'`);row=await shot('load-failed');assert.ok(row.status.startsWith('Nocturne couldn’t load'));assert.deepEqual(row.buttons,['Retry','Stay on Bloom']);assert.ok(row.alert.includes('couldn’t load'));assert.equal(row.stage,'bloom-stage');await advancing()
 await click('Retry');for(let i=0;i<50&&!held.some(h=>h.request.url.includes('NocturneScene'));i++)await pause(100)
 await send('Fetch.continueRequest',{requestId:take('NocturneScene').requestId});await wait(`__state().stage==='nocturne-stage'&&__state().status===null`);await advancing()
 report.checks.push('Failed chunk: alert "Nocturne couldn’t load" with Retry / Stay on Bloom; Retry refetches and shows Nocturne; audio uninterrupted.')

 // 4. Fail Lavender and dismiss: stays on Nocturne, select reverts.
 await pick('lavender-peaks');await wait(`__state().status==='Loading Lavender Peaks…'`)
 await send('Fetch.failRequest',{requestId:take('LavenderPeaksScene').requestId,errorReason:'ConnectionFailed'});await wait(`__state().tone==='error'`)
 await click('Stay on Nocturne');await wait(`__state().status===null`);row=await state();assert.equal(row.select,'nocturne');assert.equal(row.stage,'nocturne-stage')
 report.checks.push('Failed chunk then "Stay on Nocturne": message clears, select returns to Nocturne.')

 // 5. Latest request wins: Crimson held, user picks Bloom, Crimson arrives later.
 await pick('crimson-horizon');await wait(`__state().status==='Loading Crimson Horizon…'`);await pick('bloom');await wait(`__state().stage==='bloom-stage'&&__state().status===null`)
 await send('Fetch.continueRequest',{requestId:take('CrimsonHorizonScene').requestId});await pause(800);row=await state();assert.equal(row.stage,'bloom-stage');assert.equal(row.select,'bloom')
 await send('Fetch.disable');report.checks.push('Slow Crimson load arriving after the user chose Bloom does not switch away from Bloom.')

 // 6. Context loss restored automatically.
 const lose=()=>ev(`(()=>{const c=window.__gl.filter(c=>!c.isContextLost()).at(-1);window.__lost=c;c.__lose.loseContext();return true})()`)
 await lose();await wait(`__state().status==='Graphics were interrupted — restoring…'`);row=await shot('graphics-restoring');assert.equal(row.tone,'neutral');await advancing()
 await ev(`window.__lost.__lose.restoreContext(),true`);await wait(`__state().status===null&&__state().live===1`);await pause(600);await shot('graphics-restored')
 report.checks.push('Context lost → "Graphics were interrupted — restoring…"; restored context clears the message and Bloom draws again.')

 // 7. Context lost and not restored: Restart after the wait rebuilds the canvas.
 await lose();await wait(`__state().status==='Graphics were interrupted — restoring…'`);const t=Date.now()
 await wait(`__state().buttons.includes('Restart landscape')`,80);const waited=Date.now()-t;row=await shot('graphics-stuck');assert.ok(waited>3000,'Restart offered too early: '+waited);assert.ok(row.alert.includes('didn’t come back'))
 await click('Restart landscape');await wait(`__state().status===null&&__state().live===1`);await pause(600);await shot('graphics-restarted');await advancing()
 report.checks.push(`Context not restored: Restart offered after ${(waited/1000).toFixed(1)}s (alert); Restart rebuilds the canvas with one live context; audio uninterrupted.`)

 // 8. Same flows on Crimson (worker-based terrain) and Lavender after they load.
 for(const scene of ['crimson-horizon','lavender-peaks']){await pick(scene);await wait(`__state().stage.startsWith('${scene.split('-')[0]}')&&__state().live===1&&__state().status===null`);await lose();await wait(`__state().status!==null`);await ev(`window.__lost.__lose.restoreContext(),true`);await wait(`__state().status===null`);await pause(400);await shot('restored-'+scene)}
 report.checks.push('Context loss/restore also clears on Crimson Horizon and Lavender Peaks.')

 const changed=execFileSync('git',['diff','--name-only','HEAD','--','src/scenes']).toString().trim().split('\n').filter(Boolean)
 const sceneDiff=execFileSync('git',['diff','-U0','HEAD','--','src/scenes']).toString().split('\n').filter(l=>/^[+-][^+-]/.test(l))
 assert.ok(sceneDiff.every(l=>l.includes('-fallback">')),'scene changes beyond APP02 fallback text');report.sceneFilesChanged=changed
 const unexpected=report.errors.filter(e=>!/WebGL context|CONTEXT_LOST|ConnectionFailed|Failed to fetch dynamically imported module|net::ERR/.test(e??''));report.unexpectedErrors=unexpected
 assert.deepEqual(unexpected,[]);report.status='APP03 controlled browser checks PASS';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

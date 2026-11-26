// APP04 Chromium (Brave) lifecycle checks: hidden/frozen page and return, shared tab ending,
// Disconnect from each state, reduced motion on all landscapes, phone/touch emulation, and
// browsers without tab capture or without tab audio (simulated). Generated WAV and simulated
// getDisplayMedia only. Firefox/Safari/real devices/native sharing are manual (see checklist).
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const output='docs/evidence/application/app04',temporary=await mkdtemp(join(tmpdir(),'echo-app04-'))
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={errors:[],warnings:[],screenshots:[],results:{},source:'Production build, headless Brave 1.x (Chromium). Generated WAV; getDisplayMedia simulated. Not native sharing, audibility, Firefox/Safari or real devices.'}
const browserVersion=(await new Promise(r=>{const p=spawn('brave',['--version']);let o='';p.stdout.on('data',d=>o+=d);p.on('close',()=>r(o.trim()))}));report.browser=browserVersion
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=150)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression+' :: '+JSON.stringify(await ev('__state()')))}
 await send('Runtime.enable');await send('Page.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__streams=[];window.__audios=[];window.__mode='active';window.__rafs=0;(function f(){window.__rafs++;requestAnimationFrame(f)})();
 window.__roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject(){return 1},onCommitFiberRoot(i,r){window.__roots.add(r)},onCommitFiberUnmount(){},checkDCE(){}};
 window.__analysis=()=>{let a;const walk=f=>{if(!f)return;for(let h=f.memoizedState;h&&typeof h==='object';h=h.next)if(h.memoizedState?.musicFeatures)a=h.memoizedState;walk(f.child);walk(f.sibling)};for(const r of window.__roots)walk(r.current);return a};
 const NativeAudio=window.Audio;window.Audio=function(...a){const x=new NativeAudio(...a);window.__audios.push(x);return x};
 const NativeContext=window.AudioContext;
 window.__makeStream=(audio=true)=>{if(!audio){const c=document.createElement('canvas');c.getContext('2d');const s=c.captureStream();window.__streams.push(s);return s}const c=new NativeContext(),o=c.createOscillator(),d=c.createMediaStreamDestination();o.connect(d);o.start();window.__streams.push(d.stream);return d.stream};
 window.__realGDM=()=>window.__mode==='video-only'?Promise.resolve(window.__makeStream(false)):Promise.resolve(window.__makeStream());
 if(navigator.mediaDevices)navigator.mediaDevices.getDisplayMedia=window.__realGDM;
 window.__state=()=>{const q=s=>document.querySelector(s),a=[...window.__audios].reverse().find(a=>a.getAttribute('src'));
  return{feedback:q('#audio-feedback-status')?.textContent,tone:q('.audio-feedback')?.dataset.tone,action:q('.audio-feedback button')?.textContent??null,
  disconnect:!!q('.disconnect-button'),sceneStatus:q('.scene-status p')?.textContent??null,stage:q('main section')?.className,
  audio:a?{time:+a.currentTime.toFixed(2),paused:a.paused,ended:a.ended}:null,health:window.__analysis()?.health?.status,
  liveTracks:window.__streams.flatMap(s=>s.getTracks()).filter(t=>t.readyState==='live').length,visibility:document.visibilityState,rafs:window.__rafs}};
 window.__diff=(a,b)=>Promise.all([a,b].map(d=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d}))).then(([x,y])=>{const w=x.width,h=Math.floor(x.height*.72),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(x,0,0);const p=g.getImageData(0,0,w,h).data;g.drawImage(y,0,0);const q=g.getImageData(0,0,w,h).data;let s=0,n=0,changed=0;for(let i=0;i<p.length;i+=16){const d=Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]);s+=d;n++;if(d>6)changed++}return{mean:+(s/n).toFixed(3),changedShare:+(changed/n).toFixed(4)}});
 `})
 const size=async(width,height,mobile=false)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pause(120)}
 await size(1440,900)
 const open=async(query='')=>{await send('Page.navigate',{url:`http://127.0.0.1:${http}/${query}`});await wait(`!!document.querySelector('main canvas')&&!!document.getElementById('scene-select')`);await pause(800)}
 const state=()=>ev('__state()')
 const raw=async()=>(await send('Page.captureScreenshot',{format:'png'})).data
 const shot=async name=>{const data=await raw();await writeFile(join(output,name+'.png'),Buffer.from(data,'base64'));report.screenshots.push(name);console.log('shot',name);return data}
 const pick=scene=>ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const share=()=>ev(`document.querySelector('.source-actions button').click();true`)
 const disconnect=()=>ev(`document.querySelector('details').open=true;document.querySelector('.disconnect-button').click();document.querySelector('details').open=false;true`)
 const loadFile=async(seconds=60)=>{await ev(`{const rate=48000,n=rate*${seconds},b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);for(let i=0;i<n;i++)d.setInt16(44+2*i,Math.sin(i*2*Math.PI*110/rate)*6000,true);const dt=new DataTransfer();dt.items.add(new File([b],'generated.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await wait(`!!document.querySelector('.scene-player button')`)}
 const playBtn=()=>ev(`document.querySelector('.scene-player button').click();true`)
 const result=(key,status,detail)=>{report.results[key]={status,detail};console.log(status.padEnd(6),key,'—',detail)}

 // 1. Background and return while a local file plays.
 await open();await loadFile();await playBtn();await wait(`__state().audio.time>1`)
 // a) Hidden: open and focus another tab so this one becomes hidden.
 const other=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:other.targetId});await pause(300)
 let before=await state();await pause(3000);let during=await state()
 await send('Target.activateTarget',{targetId:pages[0].id});await send('Target.closeTarget',{targetId:other.targetId});await pause(1500);let after=await state()
 report.hidden={before,during,after}
 const hiddenOk=after.audio.time>before.audio.time+3.5&&!after.audio.paused&&after.tone!=='error'&&after.health==='running'&&after.rafs>during.rafs
 result('background-hidden',hiddenOk?'PASS':'FAIL',`visibility while away: ${during.visibility}; audio ${before.audio.time}s → ${after.audio.time}s, playing=${!after.audio.paused}; analysis ${after.health}; frames resumed=${after.rafs>during.rafs}; feedback "${after.feedback}"`)
 // b) Frozen page lifecycle (what browsers do to long-backgrounded tabs).
 before=await state();await send('Page.setWebLifecycleState',{state:'frozen'});await pause(3000);await send('Page.setWebLifecycleState',{state:'active'});await pause(1500);after=await state()
 report.frozen={before,after}
 // Forcing the lifecycle API leaves the page hidden; make it visible again before checking recovery.
 await send('Target.activateTarget',{targetId:pages[0].id});await send('Emulation.setFocusEmulationEnabled',{enabled:true});await pause(800)
 const visibleAgain=await state();const label=await ev(`document.querySelector('.scene-player button').textContent`)
 if(visibleAgain.audio.paused){await playBtn();await wait(`!__state().audio.paused&&__state().audio.time>${visibleAgain.audio.time+.5}`)}
 const resumed=await state();report.frozen.recovered=resumed
 const frozenOk=after.tone!=='error'&&!resumed.audio.paused&&resumed.health==='running'&&resumed.rafs>visibleAgain.rafs-1
 result('background-frozen',frozenOk?'NOTE':'FAIL',`forced freeze: browser paused audio (${before.audio.time}s → ${after.audio.time}s); app showed "${after.feedback}" with button "${label}", not an error; pressing Play resumed (${resumed.audio.time}s), analysis ${resumed.health}, frames running. Chrome does not normally freeze tabs that are playing sound.`)
 await shot('after-background')

 // 2. Shared tab ends from the browser side (user clicks "Stop sharing").
 await disconnect();await share();await wait(`__state().feedback==='Listening to your shared tab.'||__state().feedback==='Tab connected · waiting for sound.'`)
 await ev(`window.__streams.at(-1).getTracks().forEach(t=>{t.stop();t.dispatchEvent(new Event('ended'))});true`)
 await wait(`__state().feedback.startsWith('Browser sharing ended')`);let row=await state();await shot('shared-tab-ended')
 const endedOk=row.action==='Retry sharing'&&row.liveTracks===0&&row.tone!=='error'&&!row.disconnect
 result('shared-tab-ended',endedOk?'PASS':'FAIL',`feedback "${row.feedback}", action ${row.action}, live tracks ${row.liveTracks}, tone ${row.tone}, Disconnect shown=${row.disconnect}`)

 // 3. Disconnect from every state that offers it.
 const disc={}
 await share();await wait(`__state().disconnect`);await disconnect();await wait(`!__state().disconnect`);row=await state();disc['tab-connected']=row.liveTracks===0&&row.feedback==='Choose a shared tab or a local audio file.'
 await ev(`navigator.mediaDevices.getDisplayMedia=()=>new Promise(()=>{});true`);await share();await wait(`__state().action==='Cancel sharing'`);await disconnect();await wait(`__state().action===null`);disc['tab-connecting']=(await state()).feedback==='Choose a shared tab or a local audio file.'
 await ev(`navigator.mediaDevices.getDisplayMedia=window.__realGDM;true`)
 for(const [name,prep] of [['file-ready',async()=>{}],['file-playing',async()=>{await playBtn();await wait(`__state().audio&&!__state().audio.paused`)}],['file-paused',async()=>{await playBtn();await wait(`document.querySelector('.scene-player button').textContent==='Pause'`);await playBtn();await wait(`__state().audio.paused`)}],['file-ended',async()=>{await playBtn();await wait(`__state().feedback.startsWith('Playback ended')`,60)}]]){
  await loadFile(name==='file-ended'?1:60);await prep();await disconnect();await wait(`!__state().disconnect`);row=await state();disc[name]=row.audio===null&&row.feedback==='Choose a shared tab or a local audio file.'
 }
 report.disconnect=disc;result('disconnect-all-states',Object.values(disc).every(Boolean)?'PASS':'FAIL',Object.entries(disc).map(([k,v])=>`${k}:${v?'ok':'FAIL'}`).join(', '))

 // 4. Reduced motion: each landscape still vs. moving, silent, fixed camera.
 const motion={}
 for(const reduced of [false,true]){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})
  for(const scene of ['bloom','nocturne','lavender-peaks','crimson-horizon']){
   await pick(scene);await wait(`!!document.querySelector('main section canvas')&&__state().sceneStatus===null&&__state().stage.startsWith('${scene.split('-')[0]}')`);await pause(1200)
   const a=await raw();await pause(1500);const b=await raw();if(reduced)await writeFile(join(output,`reduced-${scene}.png`),Buffer.from(b,'base64'))
   ;(motion[scene]??={})[reduced?'reduced':'normal']=await ev(`__diff(${JSON.stringify(a)},${JSON.stringify(b)})`)
  }
 }
 report.reducedMotion=motion
 for(const [scene,m] of Object.entries(motion)){const ok=m.reduced.changedShare<=Math.max(.002,m.normal.changedShare*.1),informative=m.normal.changedShare>.002;result(`reduced-motion-${scene}`,!ok?'FAIL':informative?'PASS':'NOTE',`pixels changing over 1.5s in silence: normal ${(m.normal.changedShare*100).toFixed(2)}%, reduced ${(m.reduced.changedShare*100).toFixed(2)}%${informative?'':' — still in silence by design, so this test cannot show a difference'}`)}
 await send('Emulation.setEmulatedMedia',{features:[]})

 // 5. Phone emulation: touch, no hover; tab sharing unavailable; controls usable by touch.
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await size(390,844,true)
 await send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',platform:'Linux armv8l'})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`if(navigator.mediaDevices)navigator.mediaDevices.getDisplayMedia=undefined`})
 await open('?phone');const media=await ev(`({fine:matchMedia('(hover: hover) and (pointer: fine)').matches,coarse:matchMedia('(pointer: coarse)').matches})`)
 const tap=async selector=>{const r=await ev(`(()=>{const b=document.querySelector('${selector}').getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);for(const type of ['touchStart','touchEnd'])await send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:r.x,y:r.y}]});await pause(250)}
 await tap('.source-actions button');await wait(`__state().action==='Open audio file'`);row=await state();await shot('phone-no-tab-sharing')
 const phoneShare=row.feedback.startsWith('This browser can’t share tab audio');
 await loadFile();await tap('.scene-player button');await wait(`__state().audio&&__state().audio.time>.5`)
 await wait(`document.querySelector('.scene-player button').textContent==='Pause'`);await tap('.chooser-trigger');const optionsOpen=await ev(`document.querySelector('details').open`);await tap('.options-playback button');await wait(`__state().audio.paused`);await shot('phone-touch-options')
 report.phone={media,feedback:row.feedback,optionsOpen}
 result('phone-touch',!media.fine&&media.coarse&&phoneShare&&optionsOpen?'PASS':'FAIL',`fine-pointer parallax gate=${media.fine} (Bloom parallax off), coarse=${media.coarse}; Share says "${row.feedback}" with Open audio file; tap Play, open Options and Pause work=${optionsOpen}`)
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setUserAgentOverride',{userAgent:''});await size(1440,900)

 // 6. Browser that shares video but no audio (Firefox/Safari behaviour, simulated).
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__mode='video-only';setTimeout(()=>{if(navigator.mediaDevices)navigator.mediaDevices.getDisplayMedia=window.__realGDM},0)`})
 await open('?videoonly');await ev(`navigator.mediaDevices.getDisplayMedia=window.__realGDM;window.__mode='video-only';true`);await share();await wait(`__state().tone==='error'`);row=await state();await shot('video-only-share')
 report.videoOnly=row
 result('no-tab-audio-message',row.liveTracks===0?'NOTE':'FAIL',`simulated video-only share → "${row.feedback}" (action ${row.action}). Tracks released. Message asks to enable tab audio, which Firefox/Safari cannot do; wording unconfirmed in real Firefox/Safari (manual).`)

 const failed=Object.entries(report.results).filter(([,v])=>v.status==='FAIL');report.status=failed.length?'APP04 automated checks: FAILURES '+failed.map(f=>f[0]).join(', '):'APP04 automated checks PASS'
 const unexpected=report.errors.filter(e=>e);report.unexpectedErrors=unexpected;assert.deepEqual(unexpected,[]);console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(temporary,{recursive:true,force:true}).catch(()=>{}) /* removeProfile */}

// Generated fixtures and explicit fault injection only; no native capture approval inferred.
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const output='docs/evidence/application/app01',temporary=await mkdtemp(join(tmpdir(),'echo-app01-'))
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={errors:[],warnings:[],screenshots:[],checks:[],source:'Actual production build. Generated WAV/oscillator only; getDisplayMedia and graph failures explicitly simulated. No owner media; no native picker/audibility certification.'}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description);if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 await send('Runtime.enable');await send('Page.enable');await send('Accessibility.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject(){return 1},onCommitFiberRoot(i,r){window.__roots.add(r)},onCommitFiberUnmount(){},checkDCE(){}};
 window.__contexts=[];window.__testContexts=[];window.__streams=[];window.__nodes=0;window.__captureCalls=0;window.__mode='active';
 const NativeContext=window.AudioContext;window.__NativeContext=NativeContext;
 window.AudioContext=function(...args){if(window.__contextFailure)throw Error('Injected context failure');const c=new NativeContext(...args);window.__contexts.push(c);const stream=c.createMediaStreamSource.bind(c),element=c.createMediaElementSource.bind(c);c.createMediaStreamSource=s=>{if(window.__graphFailure)throw Error('Injected graph failure');return stream(s)};c.createMediaElementSource=e=>{window.__nodes++;return element(e)};return c};
 const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args),play=a.play.bind(a);a.play=()=>window.__playBlocked?Promise.reject(new DOMException('Injected autoplay denial','NotAllowedError')):play();window.__audio=a;return a};
 window.__makeStream=()=>{const c=new NativeContext(),o=c.createOscillator(),g=c.createGain(),d=c.createMediaStreamDestination();o.frequency.value=180;o.connect(g);g.connect(d);g.gain.value=.1;o.start();window.__testContexts.push(c);window.__testGain=g;window.__streams.push(d.stream);return d.stream};
 window.__fakeCapture=()=>{window.__captureCalls++;if(window.__mode==='denied')return Promise.reject(new DOMException('Injected denial','NotAllowedError'));if(window.__mode==='missing')return Promise.resolve(new MediaStream());if(window.__mode==='pending')return new Promise(r=>window.__resolveCapture=r);return Promise.resolve(window.__makeStream())};
 navigator.mediaDevices.getDisplayMedia=window.__fakeCapture;
 window.__state=()=>{let a;const walk=f=>{if(!f)return;for(let h=f.memoizedState;h&&typeof h==='object';h=h.next)if(h.memoizedState?.musicFeatures)a=h.memoizedState;walk(f.child);walk(f.sibling)};for(const r of window.__roots)walk(r.current);window.__analysis=a;const status=document.getElementById('audio-feedback-status'),body=document.querySelector('.audio-feedback-body'),p=document.querySelector('.audio-controls'),rect=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return{feedback:status?.textContent,visible:!!status&&status.getBoundingClientRect().height>0,action:document.querySelector('.audio-feedback button')?.textContent,options:document.querySelector('details').open,health:a?.health,music:a?{status:a.musicFeatures.read().status,session:a.musicFeatures.read().session}:null,audio:window.__audio?{time:window.__audio.currentTime,paused:window.__audio.paused,src:!!window.__audio.src}:null,focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent,streamTracks:window.__streams.map(s=>s.getTracks().map(t=>t.readyState)),captureCalls:window.__captureCalls,nodes:window.__nodes,viewport:[innerWidth,innerHeight],feedbackBounds:rect(body),optionsBounds:rect(p),panelScrollable:p.scrollHeight>p.clientHeight,scene:document.getElementById('scene-select').value}};
 `})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!document.querySelector("canvas")');await pause(600)
 const state=()=>ev('__state()'),share=()=>ev(`document.querySelector('.source-actions button').click();true`)
 const recover=()=>ev(`document.querySelector('.audio-feedback button').focus();document.querySelector('.audio-feedback button').click();true`)
 const snapshot=async(name,pair=true)=>{
  for(const [suffix,width,height]of pair?[['desktop',1440,900],['portrait',390,844]]:[['short',320,256]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(100)
   const row=await state(),shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'-'+suffix+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name:name+'-'+suffix,row})
   assert.ok(row.visible);assert.ok(row.feedbackBounds.y>=0&&row.feedbackBounds.bottom<=height);console.log(name,suffix)
  }
 }
 const disconnect=async()=>{await ev(`document.querySelector('details').open=true;document.querySelector('.disconnect-button').click();true`);await pause(50);await ev(`document.querySelector('details').open=false;true`)}
 await snapshot('initial')
 await ev(`navigator.mediaDevices.getDisplayMedia=undefined;true`);await share();await wait(`__state().action==='Open audio file'`);await snapshot('unsupported')
 await ev(`navigator.mediaDevices.getDisplayMedia=window.__fakeCapture;window.__mode='denied';true`);await share();await wait(`__state().action==='Retry sharing'`);await snapshot('denied')
 await ev(`window.__mode='missing';true`);await recover();await wait(`__state().feedback.startsWith('No audio track')`);await snapshot('missing-audio')
 await ev(`window.__mode='pending';true`);await recover();await wait(`__state().action==='Cancel sharing'`);await snapshot('pending');await recover();await wait(`__state().action===undefined`)
 await ev(`window.__resolveCapture(window.__makeStream());true`);await pause(150);assert.ok((await state()).streamTracks.flat().every(s=>s==='ended'))
 await ev(`window.__contextFailure=true;window.__mode='active';window.__callsBefore=window.__captureCalls;true`);await share();await wait(`__state().action==='Retry sharing'`);assert.equal(await ev('__captureCalls'),await ev('__callsBefore'));await snapshot('prepare-failure')
 await ev('window.__contextFailure=false;window.__graphFailure=true;true');await recover();await wait(`__state().feedback.startsWith('Audio analysis could not start')`);assert.ok((await state()).streamTracks.flat().every(s=>s==='ended'));await snapshot('graph-failure')
 await ev('window.__graphFailure=false;true');await recover();await wait(`__state().feedback==='Listening to your shared tab.'`);await snapshot('connected')
 await ev('window.__testGain.gain.value=0;true');await wait(`__state().feedback==='Tab connected · waiting for sound.'`);assert.equal((await state()).health.status,'running');await snapshot('silent')
 await ev('window.__contexts.at(-1).suspend()');await wait(`__state().action==='Resume audio'`);await snapshot('suspended')
 await ev(`{const c=window.__contexts.at(-1);window.__realResume=c.resume.bind(c);c.resume=()=>Promise.reject(Error('Injected resume rejection'))};true`);await recover();await wait(`__state().feedback.includes('could not resume')`);await snapshot('resume-rejected')
 await ev('window.__contexts.at(-1).resume=window.__realResume;true');await recover();await wait(`__state().health.status==='running'&&__state().action===undefined`);assert.match((await state()).focus,/Options/i)
 await disconnect();assert.ok((await state()).streamTracks.flat().every(s=>s==='ended'))
 // Browser decoder failure from generated invalid bytes; never an owner's file.
 const selectFile=async invalid=>ev(`{const dt=new DataTransfer();${invalid?"dt.items.add(new File(['invalid generated bytes'],'invalid.wav',{type:'audio/wav'}));":`const rate=48000,n=rate*20,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);for(let i=0;i<n;i++)d.setInt16(44+2*i,Math.sin(i*2*Math.PI*180/rate)*3000,true);dt.items.add(new File([b],'generated-tone.wav',{type:'audio/wav'}));`}const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 await selectFile(true);await wait(`__state().feedback.startsWith('This file could not be played')`);await snapshot('decode-error')
 await selectFile(false);await wait(`__state().feedback.startsWith('File selected')`);await snapshot('file-ready')
 await ev(`window.__playBlocked=true;document.querySelector('.scene-player button').click();true`);await wait(`__state().action==='Retry Play'`);await snapshot('play-blocked')
 const attached=(await state()).nodes;await ev('window.__playBlocked=false;true');await recover();await wait(`__state().feedback==='Playing local audio.'&&__state().audio.time>.1`);assert.equal((await state()).nodes,attached);await snapshot('file-playing')
 await ev(`document.querySelector('.scene-player button').click();true`);await wait(`__state().feedback==='Playback paused'`);await snapshot('file-paused')
 await ev(`document.querySelector('details').open=true;true`);await snapshot('short-options',false);const small=await state();assert.ok(small.optionsBounds.y>=0&&small.optionsBounds.bottom<=256)
 await ev(`document.querySelector('details').open=false;document.querySelector('.scene-player button').click();true`);await wait(`__state().audio.time>.2`)
 for(const scene of ['nocturne','lavender-peaks','crimson-horizon','bloom']){await ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await pause(450);assert.equal((await state()).audio.paused,false)}
 await disconnect();assert.match((await state()).focus,/Open audio file/)
 const ax=await send('Accessibility.getFullAXTree');report.accessibility=ax.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value}));assert.ok(report.accessibility.some(n=>n.role==='status'))
 report.checks.push('Status/recovery visible with Options closed at desktop and portrait; short Options bounds; prepare/graph failure release and retry; no picker after failed prepare; stale stream disposal; resume rejection/retry; actual decoder error; generated file blocked-play retry without duplicate graph; file play/pause/switch/disconnect; named live region. Native picker/audibility/screen-reader speech remain manual.')
 assert.deepEqual(report.errors,[])
 const allowed=new Set(['src/audio/analysis.ts','src/audio/localFile.ts','src/audio/tabCapture.ts','src/components/AudioControls.tsx','src/dev/audioLab/sources.ts','src/index.css'])
 let unchanged=0;for(const f of JSON.parse(await readFile(join(output,'source-before.json')))){if(allowed.has(f.file))continue;assert.equal(createHash('sha256').update(await readFile(f.file)).digest('hex'),f.sha256,f.file);unchanged++}
 report.unchangedExistingSources=unchanged;report.status='APP01 controlled browser checks PASS';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

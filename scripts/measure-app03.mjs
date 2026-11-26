// APP03 measurement: cold entry, scene switch gaps, initial download, WebGL context/resource
// cleanup over repeated switching, quality toggles, audio/reader continuity and frame cadence.
// Usage: npm run build && node scripts/measure-app03.mjs <label>
// Headless Brave with a generated WAV; numbers are relative comparisons, not native-hardware claims.
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readdir,stat,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const label=process.argv[2]??'current',output='docs/evidence/application/app03',temporary=await mkdtemp(join(tmpdir(),'echo-app03-'))
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={label,errors:[],warnings:[],requests:[],source:'Production build, headless Brave/ANGLE, generated WAV only. Relative comparison; not native performance.'}
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null},p95=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.min(s.length-1,Math.floor(s.length*.95))]:null}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))
  if(m.method==='Network.loadingFinished')report.requests.push(m.params.encodedDataLength)})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},60000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject(){return 1},onCommitFiberRoot(i,r){window.__roots.add(r)},onCommitFiberUnmount(){},checkDCE(){}};
 window.__gl=[];const original=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...rest){const c=original.call(this,type,...rest);if(c&&/webgl/.test(type)&&!c.__tracked){c.__tracked=true;const live={buffer:0,texture:0,program:0,framebuffer:0};c.__live=live;
  for(const k of Object.keys(live)){const cap=k[0].toUpperCase()+k.slice(1),mk=c['create'+cap].bind(c),rm=c['delete'+cap].bind(c);c['create'+cap]=(...a)=>{const o=mk(...a);if(o)live[k]++;return o};c['delete'+cap]=o=>{if(o)live[k]--;return rm(o)}}
  window.__gl.push(c)}return c};
 window.__audios=[];const NativeAudio=window.Audio;window.Audio=function(...a){const x=new NativeAudio(...a);window.__audios.push(x);return x};
 window.__frames=n=>new Promise(r=>{let i=0;const f=()=>++i>=n?r(performance.now()):requestAnimationFrame(f);requestAnimationFrame(f)});
 window.__ready=s=>{const stage=document.querySelector('.'+s+'-stage canvas');return !!stage&&stage.width>0};
 window.__liveGl=()=>window.__gl.filter(c=>!c.isContextLost()).map(c=>({...c.__live}));
 window.__analysis=()=>{let a;const walk=f=>{if(!f)return;for(let h=f.memoizedState;h&&typeof h==='object';h=h.next)if(h.memoizedState?.musicFeatures)a=h.memoizedState;walk(f.child);walk(f.sibling)};for(const r of window.__roots)walk(r.current);return a};
 `})
 const size=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(100)}
 await size(1440,900)
 const stageClass={bloom:'bloom','nocturne':'nocturne','lavender-peaks':'lavender','crimson-horizon':'crimson'}
 const waitReady=async(scene,timeout=20000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await ev(`__ready('${stageClass[scene]}')`))return;await pause(15)}throw Error('not ready '+scene)}
 // Cold entry: navigation start → first painted frames of the initial landscape. Cache disabled.
 const cold=[]
 for(let i=0;i<3;i++){report.requests=[];await send('Page.navigate',{url:`http://127.0.0.1:${http}/?run=${i}`});await pause(50);await waitReady('bloom');cold.push(await ev(`__frames(2)`));}
 report.coldEntryMs={samples:cold.map(Math.round),median:Math.round(median(cold))}
 report.initialBytes=report.requests.reduce((a,b)=>a+b,0)
 await send('Network.setCacheDisabled',{cacheDisabled:false})
 // Switch gaps: select → new stage painting two frames. First visit vs later visits.
 const pick=scene=>ev(`(()=>{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}));return performance.now()})()`)
 const stalls=[]
 const switchTo=async scene=>{await ev(`(()=>{window.__gaps=[];let last=performance.now();window.__stop=false;const f=t=>{window.__gaps.push(t-last);last=t;if(!window.__stop)requestAnimationFrame(f)};requestAnimationFrame(f);return true})()`);const t0=await pick(scene);await waitReady(scene);const t=(await ev('__frames(2)'))-t0;stalls.push(await ev('(window.__stop=true,Math.max(0,...window.__gaps))'));return t}
 await pause(1500)
 const order=['nocturne','lavender-peaks','crimson-horizon','bloom'],first={},later={}
 for(const s of order){first[s]=Math.round(await switchTo(s));await pause(400)}
 for(let r=0;r<2;r++)for(const s of order){(later[s]??=[]).push(await switchTo(s));await pause(300)}
 report.longestSwitchFrameMs={median:Math.round(median(stalls)),max:Math.round(Math.max(...stalls)),over250:stalls.filter(x=>x>250).length,of:stalls.length}
 report.switchMs={first,later:Object.fromEntries(Object.entries(later).map(([k,v])=>[k,Math.round(median(v))]))}
 // Continuity: generated file plays through 24 switches; reader session stays; contexts are released.
 await ev(`{const rate=48000,n=rate*90,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);for(let i=0;i<n;i++)d.setInt16(44+2*i,Math.sin(i*2*Math.PI*110/rate)*6000,true);const dt=new DataTransfer();dt.items.add(new File([b],'generated.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 for(let i=0;i<50&&!(await ev(`!!document.querySelector('.scene-player button')`));i++)await pause(100)
 await ev(`document.querySelector('.scene-player button').click();true`);await pause(1500)
 const session=await ev(`__analysis().musicFeatures.read().session`),before=await ev(`__liveGl()`)
 const t0=await ev(`[...__audios].reverse().find(a=>a.getAttribute('src')).currentTime`)
 for(let i=0;i<24;i++){await switchTo(order[i%4]);await pause(120)}
 await pause(800)
 const audio=await ev(`(()=>{const a=[...__audios].reverse().find(a=>a.getAttribute('src'));return{time:a.currentTime,paused:a.paused}})()`)
 const after=await ev(`__liveGl()`)
 report.continuity={switches:24,audioBefore:+t0.toFixed(2),audioAfter:+audio.time.toFixed(2),paused:audio.paused,sessionBefore:session,sessionAfter:await ev(`__analysis().musicFeatures.read().session`),readerStatus:await ev(`__analysis().musicFeatures.read().status`)}
 report.webgl={contextsCreated:await ev('__gl.length'),liveBefore:before,liveAfter:after}
 assert.equal(audio.paused,false,'audio stopped during switching');assert.ok(audio.time>t0+2,'audio did not advance')
 // The shared analysis resets by design after a >250ms main-thread gap; record, don't fail.
 report.continuity.sessionResets=report.continuity.sessionAfter-session
 assert.ok(after.length<=1,'more than one live WebGL context after switching: '+after.length)
 // Quality toggles per landscape keep one live context and finite resource counts.
 report.quality={}
 for(const s of order){await switchTo(s);const counts=[];for(const q of ['low','standard','low','standard']){await ev(`{const x=document.getElementById('graphics-quality')??(document.querySelector('details').open=true,document.getElementById('graphics-quality'));x.value='${q}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await ev('__frames(4)');counts.push((await ev('__liveGl()')).length)}report.quality[s]=counts;await ev(`document.querySelector('details').open=false;true`)}
 // Frame cadence: three 10s windows per landscape (vsync-limited headless).
 report.cadence={}
 for(const s of order){await switchTo(s);await pause(800);const windows=[];for(let w=0;w<3;w++)windows.push(await ev(`new Promise(r=>{const d=[];let last=performance.now();const end=last+10000;const f=t=>{d.push(t-last);last=t;t<end?requestAnimationFrame(f):r(d)};requestAnimationFrame(f)})`));const all=windows.flat();report.cadence[s]={medianMs:+median(all).toFixed(1),p95Ms:+p95(all).toFixed(1),maxMs:+Math.max(...all).toFixed(1)}}
 const assets=await readdir('dist/assets');report.assets=Object.fromEntries(await Promise.all(assets.map(async f=>[f,(await stat(join('dist/assets',f))).size])))
 delete report.requests;assert.deepEqual(report.errors,[]);report.status='measured'
 console.log(JSON.stringify({stall:report.longestSwitchFrameMs,cold:report.coldEntryMs,bytes:report.initialBytes,switch:report.switchMs,continuity:report.continuity,webgl:report.webgl.liveAfter.length,quality:report.quality,cadence:report.cadence},null,1))
}catch(e){report.failure=String(e);console.error(e);process.exitCode=1}finally{await writeFile(join(output,`measure-${label}.json`),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(temporary,{recursive:true,force:true}).catch(()=>{}) /* removeProfile */}

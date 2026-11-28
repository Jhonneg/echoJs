// Bass-flash browser checks: bass hits light the whole landscape with aurora light and the
// rivers react strongly to the music. Builds a throwaway copy of the app (in the given scratch
// directory) that exposes Bloom's music state, plays a generated song (quiet pad 0–6 s, kick
// with loud mid chords 6–20 s, silence) through the real file adapter and analysis, and
// captures full frames at rest, right after bass hits and between hits, measuring the
// brightness of the ranges and a river. Generated audio only.
// Usage: node scripts/verify-bloom-bass-flash.ts <scratch-dir> [label]   (label: before | after)
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const scratch=process.argv[2];if(!scratch)throw Error('usage: verify-bloom-bass-flash.ts <scratch-dir>')
const label=process.argv[3]||'after'
const root=resolve('.'),build=resolve(scratch,'bass-flash-build'),output='docs/evidence/bloom/bass-flash/'+label
await mkdir(output,{recursive:true});await rm(build,{recursive:true,force:true});await mkdir(build,{recursive:true})
for(const f of ['src','public','index.html','package.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','tsconfig.scripts.json','tsconfig.tests.json'])await cp(join(root,f),join(build,f),{recursive:true}).catch(()=>{})
await symlink(join(root,'node_modules'),join(build,'node_modules'))
const scenePath=join(build,'src/scenes/bloom/BloomScene.tsx');let scene=await readFile(scenePath,'utf8')
const hook='    const out = bloomMusicOutputs(music.current)\n'
if(!scene.includes(hook))throw Error('hook point not found')
scene=scene.replace(hook,hook+'    Object.assign(window, { __bloomMusic: music.current, __bloomOut: out })\n')
await writeFile(scenePath,scene)
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--logLevel','error'],{cwd:build,stdio:'inherit'})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-flash-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={source:'Throwaway build exposing Bloom music state; production file adapter and analysis; generated 24 s song (quiet pad 0–6 s, kick with loud mid chords 6–20 s, silence); headless Brave 1440×900.',errors:[],checks:{},shots:{}}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=150)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 // Mean brightness (0–255, average of R, G, B) of screen regions, given as fractions x0, y0, x1, y1.
 const REGIONS={rightRanges:[0.55,0.3,1,0.62],leftRanges:[0,0.38,0.42,0.64],tealRiver:[0.69,0.34,0.86,0.52],sky:[0.6,0.02,0.95,0.2]}
 const measure=d=>ev(`(async()=>{const i=new Image();i.src='data:image/png;base64,${d}';await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);const out={};for(const [k,[x0,y0,x1,y1]] of Object.entries(${JSON.stringify(REGIONS)})){const px=g.getImageData(Math.round(x0*i.width),Math.round(y0*i.height),Math.round((x1-x0)*i.width),Math.round((y1-y0)*i.height)).data;let s=0,top=0,n=px.length/4;const lum=[];for(let p=0;p<px.length;p+=4){const v=(px[p]+px[p+1]+px[p+2])/3;s+=v;lum.push(v)}lum.sort((a,b)=>b-a);out[k]={mean:+(s/n).toFixed(2),top1:+(lum.slice(0,Math.max(1,n/100|0)).reduce((a,b)=>a+b,0)/Math.max(1,n/100|0)).toFixed(2)}}return out})()`)
 await send('Runtime.enable');await send('Page.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(output,name+'.png'),Buffer.from(d,'base64'));report.shots[name]=await measure(d);console.log('shot',name,JSON.stringify(report.shots[name]))}
 const open=async()=>{await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!window.__bloomMusic');await pause(1000)}
 const loadTrack=()=>ev(`{const rate=48000,secs=24,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  let kp=0;const TAU=2*Math.PI,saw=(f,t)=>2*((f*t)%1)-1
  for(let i=0;i<n;i++){const t=i/rate;let v=0;const beat=t%0.5
   const pad=(Math.sin(TAU*220*t)+Math.sin(TAU*261.6*t)+Math.sin(TAU*329.6*t))
   if(t<6)v+=pad*0.03
   else if(t<20){kp+=TAU*(42+108*Math.exp(-beat/0.03))/rate;v+=Math.sin(kp)*0.6*Math.exp(-beat/0.18);v+=(saw(392,t)+saw(523.3,t)+saw(659.3,t)+saw(1046.5,t)*0.6)*0.07}
   d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-bass-flash.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const play=()=>ev(`document.querySelector('.scene-player button').click();true`)
 const state=()=>ev(`(()=>{const m=window.__bloomMusic,o=window.__bloomOut;return{ringAge:m.ringAge,river:m.river,flash:m.bassFlash??null,riverGain:o.riverGain}})()`)
 // Wait (up to `limit` ms) until `test` holds for the music state, then shoot.
 const shootWhen=async(name,test,limit=4000)=>{const start=Date.now();for(;;){const s=await state();if(test(s)||Date.now()-start>limit){report.shotState=report.shotState||{};report.shotState[name]=s;await shot(name);return}await pause(5)}}
 await open();await pause(1500);await shot('idle')
 await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const t0=Date.now(),until=s=>pause(Math.max(0,s*1000-(Date.now()-t0)))
 await until(4);await shot('quiet-4s')
 // Two hit shots and two between-hit shots in the loud section (after the rivers have risen).
 for(const [s,i] of [[11,1],[15,2]]){await until(s);await shootWhen('hit-'+i,x=>x.ringAge>0.07&&x.ringAge<0.12);await shootWhen('between-'+i,x=>x.ringAge>0.38&&x.ringAge<0.46)}
 await until(23.5);await shot('after-silence')
 report.errors=report.errors.filter(Boolean)
 console.log(JSON.stringify(report.shotState))
 assert.deepEqual(report.errors,[])
}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true}).catch(()=>{});await rm(build,{recursive:true,force:true}).catch(()=>{})}

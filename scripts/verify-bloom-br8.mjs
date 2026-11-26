// BR8 browser checks: music response timeline and mouse parallax. Builds a throwaway copy of the
// app (in the given scratch directory) that exposes Bloom's music state and camera, plays a
// generated test track (silence, bass hits, high-mid hits, mixed, silence) through the real
// file adapter and analysis, and records what responds when. Generated audio only.
// Usage: node scripts/verify-bloom-br8.mjs <scratch-dir>
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const scratch=process.argv[2];if(!scratch)throw Error('usage: verify-bloom-br8.mjs <scratch-dir>')
const root=resolve('.'),build=resolve(scratch,'br8-build'),output='docs/evidence/bloom/rebuild/br8'
await mkdir(output,{recursive:true});await rm(build,{recursive:true,force:true});await mkdir(build,{recursive:true})
for(const f of ['src','public','index.html','package.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(join(root,f),join(build,f),{recursive:true}).catch(()=>{})
await symlink(join(root,'node_modules'),join(build,'node_modules'))
const scenePath=join(build,'src/scenes/bloom/BloomScene.tsx');let scene=await readFile(scenePath,'utf8')
const hook='    const out = bloomMusicOutputs(music.current)\n'
if(!scene.includes(hook))throw Error('hook point not found')
scene=scene.replace(hook,hook+'    Object.assign(window, { __bloomMusic: music.current, __bloomOut: out, __bloomCamera: state.camera })\n')
// Headless reports no hover-capable mouse, so parallax would stay off. As the old Bloom camera
// test did, the throwaway copy treats the screen as having a fine pointer. Touch input is still
// rejected by the real pointerType check, which the touch section below exercises.
const fine="window.matchMedia('(hover: hover) and (pointer: fine)').matches"
if(!scene.includes(fine))throw Error('fine-pointer check not found')
scene=scene.replace(fine,'true')
await writeFile(scenePath,scene)
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--logLevel','error'],{cwd:build,stdio:'inherit'})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-br8-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={source:'Throwaway build exposing Bloom music state/camera; production adapters and analysis; generated WAV; headless Brave 1440×900.',errors:[],checks:{}}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=150)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 await send('Runtime.enable');await send('Page.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(output,name+'.png'),Buffer.from(d,'base64'));console.log('shot',name)}
 const open=async()=>{await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!window.__bloomMusic');await pause(1000)}
 // Generated track (48 kHz): 0–4 s silence, 4–10 s bass hits (110 Hz), 10–16 s high-mid hits
 // (1.5 kHz), 16–22 s both, 22–28 s silence. Hits: sharp attack every 0.5 s, 0.25 s decay.
 const loadTrack=()=>ev(`{const rate=48000,secs=28,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  for(let i=0;i<n;i++){const t=i/rate,beat=t%0.5,env=beat<0.01?beat/0.01:Math.exp(-(beat-0.01)/0.25);let v=0;const bass=t>=4&&t<10||t>=16&&t<22,mids=t>=10&&t<22;if(bass)v+=Math.sin(2*Math.PI*110*t)*0.55*env;if(mids)v+=Math.sin(2*Math.PI*1500*t)*0.35*env;d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-br8.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const play=()=>ev(`document.querySelector('.scene-player button').click();true`)
 // 1. Timeline through the whole track.
 await open();await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const timeline=[];const start=Date.now()
 for(;;){const row=await ev(`(()=>{const m=window.__bloomMusic,o=window.__bloomOut;return{aurora:m.aurora,seam:m.seam,river:m.river,shimmer:m.shimmer,intensity:m.intensity,seamAccent:m.seamAccent,ringAge:m.ringAge,ringStrength:m.ringStrength,pulseAlong:m.pulseAlong,pulseStrength:m.pulseStrength,lift:o.liftFraction}})()`);row.t=(Date.now()-start)/1000;timeline.push(row)
  if([7,13,19,26].some(s=>Math.abs(row.t-s)<0.06))await shot(`section-${Math.round(row.t)}s`)
  if(row.t>29)break;await pause(100)}
 report.timeline=timeline.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Number.isFinite(v)?+v.toFixed(3):v])))
 const at=(a,b)=>timeline.filter(r=>r.t>=a&&r.t<b),avg=(rows,k)=>rows.reduce((s,r)=>s+r[k],0)/Math.max(1,rows.length),max=(rows,k)=>Math.max(...rows.map(r=>r[k]))
 const S={silence:at(1,3.5),bass:at(6,10),mids:at(12,16),mixed:at(18,22),after:at(27,29)}
 const sec=Object.fromEntries(Object.entries(S).map(([k,rows])=>[k,{aurora:+avg(rows,'aurora').toFixed(3),seam:+avg(rows,'seam').toFixed(3),river:+avg(rows,'river').toFixed(3),maxSeamAccent:+max(rows,'seamAccent').toFixed(3),rings:new Set(rows.filter(r=>r.ringAge!==null&&r.ringAge<0.2).map(r=>Math.round(r.t*2))).size,lift:+avg(rows,'lift').toFixed(4)}]))
 report.sections=sec;console.log(JSON.stringify(sec))
 report.checks.bassDrivesAurora=sec.bass.aurora>sec.silence.aurora+0.2&&sec.bass.seam<0.1
 report.checks.midsDriveSeam=sec.mids.seam>sec.silence.seam+0.2&&sec.mids.aurora<sec.bass.aurora
 report.checks.bassHitsRing=sec.bass.rings>=2&&sec.mids.rings===0
 // Flashes decay in ~0.35 s and are sampled every ~100 ms, so the sampled peak understates them.
 report.checks.midHitsFlashSeam=sec.mids.maxSeamAccent>0.1&&sec.bass.maxSeamAccent<0.05
 report.checks.riversFollowMids=sec.mids.river>sec.silence.river+0.15
 report.checks.liftWhilePlaying=sec.mixed.lift>0.02&&sec.silence.lift<sec.mixed.lift
 report.checks.settlesAfter=sec.after.aurora<sec.mixed.aurora*0.5&&sec.after.seam<sec.mixed.seam*0.5
 // 2. Track ended (no longer playing, no fresh audio): responses fade, monolith returns to idle.
 await wait(`document.querySelector('.scene-player button')?.textContent==='Replay'`,100);await pause(6000)
 const ended=await ev(`({aurora:window.__bloomMusic.aurora,seam:window.__bloomMusic.seam,lift:window.__bloomOut.liftFraction})`)
 report.ended=ended;report.checks.endedSettles=ended.lift<0.003&&ended.aurora<0.05&&ended.seam<0.05
 // 3. Reduced motion: no hits, no lift; slow light still responds.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await open();await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play();await pause(9000)
 const reduced=await ev(`({aurora:window.__bloomMusic.aurora,ringStrength:window.__bloomMusic.ringStrength,accent:window.__bloomMusic.seamAccent,lift:window.__bloomOut.liftFraction})`)
 report.reduced=reduced;report.checks.reducedMotion=reduced.ringStrength===0&&reduced.accent===0&&reduced.lift===0&&reduced.aurora>0.2
 await send('Emulation.setEmulatedMedia',{features:[]})
 // 4. Mouse parallax (fine pointer stubbed in the throwaway copy): corners, limits, return to centre.
 report.finePointerStubbed=true
 await open()
 const cam=()=>ev(`(()=>{const c=window.__bloomCamera;return{yaw:c.rotation.y*180/Math.PI,pitch:c.rotation.x*180/Math.PI,order:c.rotation.order}})()`)
 const rest=await cam()
 const corner=async(x,y,name)=>{await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(1500);const c=await cam();await shot('parallax-'+name);return{yaw:+(c.yaw-rest.yaw).toFixed(3),pitch:+(c.pitch-rest.pitch).toFixed(3)}}
 const corners={topLeft:await corner(0,0,'top-left'),topRight:await corner(1439,0,'top-right'),bottomLeft:await corner(0,899,'bottom-left'),bottomRight:await corner(1439,899,'bottom-right')}
 await ev(`window.dispatchEvent(new Event('blur')),true`);await pause(1500);const back=await cam()
 report.parallax={rest,corners,afterBlur:{yaw:+(back.yaw-rest.yaw).toFixed(3),pitch:+(back.pitch-rest.pitch).toFixed(3)}};console.log(JSON.stringify(report.parallax))
 const within=Object.values(corners).every(c=>Math.abs(c.yaw)<=2.51&&Math.abs(c.pitch)<=1.21)
 const reached=Math.abs(corners.topLeft.yaw)>2.3&&Math.abs(corners.topLeft.pitch)>1.1
 report.checks.parallax=within&&reached&&Math.abs(report.parallax.afterBlur.yaw)<0.05&&Math.abs(report.parallax.afterBlur.pitch)<0.05
 // Wide screen at the extreme: no gaps at the frame edges (left/right horizon band isn't background).
 await send('Emulation.setDeviceMetricsOverride',{width:1920,height:810,deviceScaleFactor:1,mobile:false});await pause(500)
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await pause(1500);await shot('parallax-wide-extreme')
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1919,y:0});await pause(1500);await shot('parallax-wide-extreme-right')
 // 5. Touch: parallax stays off (touch pointer events are not mouse events).
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5})
 await open();const touchRest=await cam()
 for(const type of ['touchStart','touchMove','touchEnd'])await send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:20,y:20}]})
 await pause(1200);const touchAfter=await cam();report.touch={yawChange:+(touchAfter.yaw-touchRest.yaw).toFixed(4)}
 report.checks.touchNoParallax=Math.abs(touchAfter.yaw-touchRest.yaw)<1e-6&&Math.abs(touchAfter.pitch-touchRest.pitch)<1e-6
 report.errors=report.errors.filter(Boolean)
 const failed=Object.entries(report.checks).filter(([,v])=>!v).map(([k])=>k);report.status=failed.length?'BR8 FAIL: '+failed.join(', '):'BR8 checks PASS'
 console.log(JSON.stringify(report.checks));console.log(report.status)
 assert.deepEqual(report.errors,[]);assert.deepEqual(failed,[])
}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true}).catch(()=>{});await rm(build,{recursive:true,force:true}).catch(()=>{})}

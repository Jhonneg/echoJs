// Level-bar browser checks: the seam fills with the overall level and the crystals rise with
// bass (left) and highs (right). Builds a throwaway copy of the app (in the given scratch
// directory) that exposes Bloom's music outputs, plays a generated song (quiet pad 0–8 s, loud
// beat with hats 8–24 s, silence) through the real file adapter and analysis, records the bar
// values and captures close-ups. Generated audio only.
// Usage: node scripts/verify-bloom-level-bars.ts <scratch-dir>
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const scratch=process.argv[2];if(!scratch)throw Error('usage: verify-bloom-level-bars.ts <scratch-dir>')
const root=resolve('.'),build=resolve(scratch,'level-bars-build'),output='docs/evidence/bloom/level-bars'
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
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-bars-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={source:'Throwaway build exposing Bloom music state; production file adapter and analysis; generated 30 s song (quiet pad 0–8 s, loud beat and hats 8–24 s, silence); headless Brave 1440×900.',errors:[],checks:{}}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=150)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 await send('Runtime.enable');await send('Page.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png',clip:{x:1440*0.36,y:900*0.02,width:1440*0.28,height:900*0.68,scale:1.5}})).data;await writeFile(join(output,name+'.png'),Buffer.from(d,'base64'));console.log('shot',name)}
 const open=async()=>{await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!window.__bloomMusic');await pause(1000)}
 const loadTrack=()=>ev(`{const rate=48000,secs=30,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};let hp=0,prev=0,kp=0
  const TAU=2*Math.PI
  for(let i=0;i<n;i++){const t=i/rate;let v=0;const beat=t%0.5,step=t%0.125,noise=rnd();hp=0.6*(hp+noise-prev);prev=noise
   const pad=(Math.sin(TAU*220*t)+Math.sin(TAU*261.6*t)+Math.sin(TAU*329.6*t))
   if(t<8)v+=pad*0.03
   else if(t<24){v+=pad*0.05;kp+=TAU*(42+108*Math.exp(-beat/0.03))/rate;v+=Math.sin(kp)*0.7*Math.exp(-beat/0.18);v+=hp*0.35*Math.exp(-step/0.03)}
   d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-level-bars.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const play=()=>ev(`document.querySelector('.scene-player button').click();true`)
 const sample=`(()=>{const o=window.__bloomOut,m=window.__bloomMusic;return{fill:o.seamFill,peak:o.seamPeak,peakShow:o.seamPeakShow,left:o.crystalLift[0],right:o.crystalLift[1],mode:m.barMode}})()`
 const record=async(seconds,shots={},actions={})=>{const rows:any[]=[],start=Date.now(),done=new Set();for(;;){const row=await ev(sample);row.t=(Date.now()-start)/1000;rows.push(row)
   for(const [s,name] of Object.entries(shots))if(!done.has(name)&&row.t>=+s){done.add(name);await shot(name)}
   for(const [s,fn] of Object.entries<any>(actions))if(!done.has('a'+s)&&row.t>=+s){done.add('a'+s);await fn()}
   if(row.t>seconds)return rows;await pause(50)}}
 const at=(rows,a,b)=>rows.filter(r=>r.t>=a&&r.t<b),avg=(rows,k)=>rows.reduce((s,r)=>s+r[k],0)/Math.max(1,rows.length),max=(rows,k)=>Math.max(...rows.map(r=>r[k])),min=(rows,k)=>Math.min(...rows.map(r=>r[k]))
 const round=r=>Object.fromEntries(Object.entries<any>(r).map(([k,v])=>[k,Number.isFinite(v)?+v.toFixed(3):v]))
 // 1. Idle, then the song; pause at 26 s (silence) and watch the seam refill.
 await open();await shot('idle')
 const idle=await ev(sample);report.idle=round(idle)
 report.checks.idleFullyLit=idle.fill===1&&idle.peakShow===0&&idle.left===0&&idle.right===0
 await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const tl=await record(30,{5:'quiet-5s',12:'loud-12s',12.3:'loud-12_3s',18.15:'loud-18s',24.4:'drop-off-24_4s',29.5:'paused-29s'},{26:()=>play()})
 report.timeline=tl.map(round)
 const S={quiet:at(tl,4,8),loud:at(tl,10,24),silent:at(tl,24.6,26),paused:at(tl,28.5,30)}
 report.sections=Object.fromEntries(Object.entries(S).map(([k,rows])=>[k,Object.fromEntries(['fill','peak','left','right','mode'].map(f=>[f,{avg:+avg(rows,f).toFixed(3),min:+min(rows,f).toFixed(3),max:+max(rows,f).toFixed(3)}]))]))
 console.log(JSON.stringify(report.sections))
 const sec=report.sections
 report.checks.quietBarLow=sec.quiet.fill.avg<0.4&&sec.quiet.mode.min>0.9
 report.checks.loudBarHigherAndMoving=sec.loud.fill.avg>sec.quiet.fill.avg+0.2&&sec.loud.fill.max-sec.loud.fill.min>0.1
 report.checks.peakCapAboveFill=S.loud.some(r=>r.peak>r.fill+0.03)
 report.checks.crystalsRiseInLoud=sec.loud.left.max>0.4&&sec.loud.right.max>0.2&&sec.quiet.left.max<0.2
 report.checks.silenceEmptiesWhilePlaying=sec.silent.fill.min<0.1&&sec.silent.left.min<0.05
 report.checks.pauseRestoresFullSeam=sec.paused.fill.min>0.98&&sec.paused.left.max<0.01&&sec.paused.right.max<0.01
 // 2. Reduced motion: slow bar, no cap, small crystal travel (checked in unit tests).
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await open();await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const red=await record(20,{18:'reduced-18s'})
 const rl=at(red,12,20)
 report.reduced={fill:{min:+min(rl,'fill').toFixed(3),max:+max(rl,'fill').toFixed(3)},peakShowMax:max(red,'peakShow'),leftMax:+max(rl,'left').toFixed(3)}
 report.checks.reducedSlowNoCap=report.reduced.peakShowMax===0&&report.reduced.fill.max-report.reduced.fill.min<sec.loud.fill.max-sec.loud.fill.min
 await send('Emulation.setEmulatedMedia',{features:[]})
 report.errors=report.errors.filter(Boolean)
 const failed=Object.entries(report.checks).filter(([,v])=>!v).map(([k])=>k);report.status=failed.length?'Level bars FAIL: '+failed.join(', '):'Level bars checks PASS'
 console.log(JSON.stringify(report.reduced));console.log(JSON.stringify(report.checks));console.log(report.status)
 assert.deepEqual(report.errors,[]);assert.deepEqual(failed,[])
}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true}).catch(()=>{});await rm(build,{recursive:true,force:true}).catch(()=>{})}

// BR9 browser checks: song structure. Builds a throwaway copy of the app (in the given scratch
// directory) that exposes Bloom's music state, plays a generated song (intro, build with a
// riser, drop, breakdown, silence) through the real file adapter and analysis, and records the
// section, build, drop, mood, fog, swell, ring burst, seam and hue over time. Generated audio only.
// Usage: node scripts/verify-bloom-br9.ts <scratch-dir>
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const scratch=process.argv[2];if(!scratch)throw Error('usage: verify-bloom-br9.ts <scratch-dir>')
const root=resolve('.'),build=resolve(scratch,'br9-build'),output='docs/evidence/bloom/rebuild/br9'
await mkdir(output,{recursive:true});await rm(build,{recursive:true,force:true});await mkdir(build,{recursive:true})
for(const f of ['src','public','index.html','package.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(join(root,f),join(build,f),{recursive:true}).catch(()=>{})
await symlink(join(root,'node_modules'),join(build,'node_modules'))
const scenePath=join(build,'src/scenes/bloom/BloomScene.tsx');let scene=await readFile(scenePath,'utf8')
const hook='    const out = bloomMusicOutputs(music.current)\n'
if(!scene.includes(hook))throw Error('hook point not found')
scene=scene.replace(hook,hook+'    Object.assign(window, { __bloomMusic: music.current, __bloomOut: out })\n')
await writeFile(scenePath,scene)
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--logLevel','error'],{cwd:build,stdio:'inherit'})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-br9-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={source:'Throwaway build exposing Bloom music state; production file adapter and analysis; generated 62 s song (intro 0–14 s, build 14–30 s, drop 30–46 s, breakdown 46–58 s, silence); headless Brave 1440×900.',errors:[],checks:{}}
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
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(output,name+'.png'),Buffer.from(d,'base64'));console.log('shot',name)}
 const open=async()=>{await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!window.__bloomMusic');await pause(1000)}
 // The generated song (48 kHz mono, deterministic noise). 120 bpm.
 const loadTrack=()=>ev(`{const rate=48000,secs=62,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};let hp=0,prev=0,kp=0
  const TAU=2*Math.PI
  for(let i=0;i<n;i++){const t=i/rate;let v=0;const beat=t%0.5,step=t%0.125,noise=rnd();hp=0.6*(hp+noise-prev);prev=noise
   const pad=(Math.sin(TAU*220*t)+Math.sin(TAU*261.6*t)+Math.sin(TAU*329.6*t)+0.5*Math.sin(TAU*440*t))
   if(t<14){v+=pad*0.05+Math.sin(TAU*55*t)*0.08}
   else if(t<30){const k=(t-14)/16;v+=pad*(0.05+0.03*k)+Math.sin(TAU*55*t)*0.08;v+=hp*0.28*k*k;if(t>=22)v+=hp*0.25*Math.exp(-step/0.02);if(t>=22&&beat>=0.25&&beat<0.45)v+=noise*0.15*k*Math.exp(-(beat-0.25)/0.06)}
   else if(t<46){v+=pad*0.04;const kt=beat;kp+=TAU*(42+108*Math.exp(-kt/0.03))/rate;v+=Math.sin(kp)*0.7*Math.exp(-kt/0.18);
    if(beat>=0.25)v+=Math.sign(Math.sin(TAU*55*t))*0.12*Math.exp(-(beat-0.25)/0.1);v+=hp*0.2*Math.exp(-step/0.03);if(t%1>=0.5&&t%1<0.6)v+=noise*0.25*Math.exp(-(t%1-0.5)/0.05)}
   else if(t<58){v+=pad*0.035}
   d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-br9.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const play=()=>ev(`document.querySelector('.scene-player button').click();true`)
 const sample=`(()=>{const m=window.__bloomMusic,o=window.__bloomOut,st=m.structure;return{energy:st.energy,short:st.short,sectionAvg:st.sectionAvg,bassFast:st.bassFast,bassRef:st.bassRef,highShort:st.highShort,section:st.section,build:st.build,drop:st.drop,drops:st.drops,mood:o.mood,fog:o.fog,swell:o.swell,burst:o.burst.strength,burstAge:o.burst.age,seam:o.seamWarmth,hue:o.hue}})()`
 const record=async(seconds,shots={})=>{const rows:any[]=[],start=Date.now(),done=new Set();for(;;){const row=await ev(sample);row.t=(Date.now()-start)/1000;rows.push(row)
   for(const [s,name] of Object.entries(shots))if(!done.has(name)&&row.t>=+s){done.add(name);await shot(name)}
   if(row.t>seconds)return rows;await pause(100)}}
 // 1. The whole song.
 await open();await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const timeline=await record(75,{10:'intro-10s',29:'build-29s',31.5:'drop-31s',42:'drop-section-42s',52:'breakdown-52s',74:'after-74s'})
 const round=r=>Object.fromEntries(Object.entries<any>(r).map(([k,v])=>[k,Number.isFinite(v)?+v.toFixed(3):v]))
 report.timeline=timeline.map(round)
 const at=(a,b)=>timeline.filter(r=>r.t>=a&&r.t<b),avg=(rows,k)=>rows.reduce((s,r)=>s+r[k],0)/Math.max(1,rows.length),max=(rows,k)=>Math.max(...rows.map(r=>r[k])),min=(rows,k)=>Math.min(...rows.map(r=>r[k]))
 const dropTimes:any[]=[];timeline.forEach((r,i)=>{if(i&&r.drops>timeline[i-1].drops)dropTimes.push(+r.t.toFixed(2))})
 const S={intro:at(5,13.5),build:at(24,30),drop:at(36,46),breakdown:at(50,58),after:at(70,75)}
 const sec=Object.fromEntries(Object.entries(S).map(([k,rows])=>[k,{section:+avg(rows,'section').toFixed(3),maxBuild:+max(rows,'build').toFixed(3),mood:+avg(rows,'mood').toFixed(3),maxFog:+max(rows,'fog').toFixed(3),seamRange:+(max(rows,'seam')-min(rows,'seam')).toFixed(3),hue:+avg(rows,'hue').toFixed(3)}]))
 report.sections=sec;report.dropTimes=dropTimes;console.log(JSON.stringify(sec));console.log('drops at',dropTimes)
 const near=at(29.5,35)
 report.checks.buildDetected=sec.build.maxBuild>0.3&&sec.intro.maxBuild<0.15
 report.checks.oneDropAtTheDrop=dropTimes.length===1&&dropTimes[0]>=30&&dropTimes[0]<33.5
 report.checks.dropClearsFog=sec.build.maxFog>0.2&&avg(at(34,36),'fog')<sec.build.maxFog*0.5
 report.checks.swellAndBurst=max(near,'swell')>0.2&&max(near,'burst')>0.3&&max(S.intro,'swell')===0&&max(S.breakdown,'swell')<0.01
 report.checks.moodDarkensWithTheSong=sec.drop.mood>sec.intro.mood+0.2&&sec.build.mood>sec.intro.mood
 report.checks.seamThrobsWithBass=sec.drop.seamRange>0.15&&sec.intro.seamRange<sec.drop.seamRange
 report.checks.settlesAfter=sec.after.mood<sec.drop.mood*0.5&&max(S.after,'fog')<0.05&&max(S.after,'swell')<0.01
 report.checks.hueBounded=timeline.every(r=>Math.abs(r.hue)<=1)
 // 2. Reduced motion: the drop is still found and the mood still follows, but no swell or burst.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await open();await loadTrack();await wait(`!!document.querySelector('.scene-player button')`);await play()
 const reduced=await record(40)
 report.reduced={drops:reduced.at(-1).drops,maxSwell:max(reduced,'swell'),maxBurst:max(reduced,'burst'),moodAt38:+reduced.at(-1).mood.toFixed(3),seamRangeInDrop:+(max(reduced.filter(r=>r.t>36),'seam')-min(reduced.filter(r=>r.t>36),'seam')).toFixed(3)}
 report.checks.reducedMotion=report.reduced.maxSwell===0&&report.reduced.maxBurst===0&&report.reduced.moodAt38>0.2&&report.reduced.seamRangeInDrop<0.08
 await send('Emulation.setEmulatedMedia',{features:[]})
 report.errors=report.errors.filter(Boolean)
 const failed=Object.entries(report.checks).filter(([,v])=>!v).map(([k])=>k);report.status=failed.length?'BR9 FAIL: '+failed.join(', '):'BR9 checks PASS'
 console.log(JSON.stringify(report.reduced));console.log(JSON.stringify(report.checks));console.log(report.status)
 assert.deepEqual(report.errors,[]);assert.deepEqual(failed,[])
}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true}).catch(()=>{});await rm(build,{recursive:true,force:true}).catch(()=>{})}

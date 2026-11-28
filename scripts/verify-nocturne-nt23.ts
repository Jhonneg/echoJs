// NT23: Nocturne performance, accessibility and lifecycle review (after NT16–NT22).
// Builds an instrumented throwaway copy of the app (a read-only probe in LightingDriver; the
// production sources are untouched) and drives it with a generated song only.
//   lifecycle: headless; context loss/restore, scene and quality switching, page freeze/resume,
//              reduced motion with every effect, and a 3-minute soak.
//   native:    a real (headed) Brave window on this machine, 1920x1080 requested; frame
//              intervals and GPU time for Standard and Low, idle and with music.
// Usage: node scripts/verify-nocturne-nt23.ts <lifecycle|native> <scratch-dir> <output-dir>
import {spawn,spawnSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,cp,symlink,readFile,writeFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {release,cpus} from 'node:os'
import assert from 'node:assert/strict'
const [mode,scratch,outDir]=process.argv.slice(2)
if(!['lifecycle','native'].includes(mode)||!scratch||!outDir)throw Error('usage: verify-nocturne-nt23.ts <lifecycle|native> <scratch-dir> <output-dir>')
await mkdir(outDir,{recursive:true})
const repository=resolve('.'),temporary=await mkdtemp(join(resolve(scratch),'echo-nt23-')),root=join(temporary,'app')
await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(join(repository,file),join(root,file),{recursive:true}).catch(()=>{})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
// Read-only probe: renderer memory, programs and the NT19–NT22 effect states, once per frame.
const driverFile=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverFile,'utf8')
assert.ok(driver.includes('useFrame((_, delta) => {'))
driver=driver.replace('useFrame((_, delta) => {','useFrame((root, delta) => {')
driver=driver.replace('    rippleField.active = state.ripples.active\n',`    rippleField.active = state.ripples.active
    ;{ const w = window as unknown as { __nt23?: Record<string, number | boolean | null> }, p = w.__nt23 ?? (w.__nt23 = { frames: 0, rippleFrames: 0, flickerFrames: 0 })
      const steam = root.scene.getObjectByName('nocturne-steam') as unknown as { material?: { uniforms?: { scroll?: { value: number } } } } | undefined
      p.frames = (p.frames as number) + 1
      p.geometries = root.gl.info.memory.geometries; p.textures = root.gl.info.memory.textures
      p.programs = (root.gl.info as unknown as { programs?: unknown[] }).programs?.length ?? -1
      p.rain = !!root.scene.getObjectByName('nocturne-rain')?.visible
      p.steam = steam?.material?.uniforms?.scroll?.value ?? null
      p.ripples = state.ripples.active; p.flicker = state.flicker.factor; p.magenta = state.channels.magentaMain.level
      if (state.ripples.active) p.rippleFrames = (p.rippleFrames as number) + 1
      if (state.flicker.factor < 1) p.flickerFrames = (p.flickerFrames as number) + 1 }
`)
assert.ok(driver.includes('__nt23'),'probe inserted')
await writeFile(driverFile,driver)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:root,stdio:'ignore'})
const flags=mode==='native'?['--window-size=1920,1080','--autoplay-policy=no-user-gesture-required','--mute-audio']:['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']
const browser=spawn('brave',[...flags,`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={mode,os:process.platform+' '+release(),cpu:cpus()[0]?.model,source:'Instrumented throwaway copy of the production build (read-only probe); generated song only.',errors:[],checks:{},native:[]}
let ws
try{
 let pages;for(let i=0;i<200;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timed out: '+JSON.stringify(params).slice(0,160)))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async(expression,tries=200)=>{for(let i=0;i<tries;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression+' (page '+await ev('document.visibilityState').catch(()=>'unreadable')+')')}
 const check=(name,ok,detail)=>{report.checks[name]={pass:!!ok,detail};console.log(ok?'PASS':'FAIL',name,JSON.stringify(detail))}
 await send('Runtime.enable');await send('Page.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
  window.__gl=[];const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){const c=o.call(this,t,...r);if(c&&/webgl/.test(t)&&!c.__tracked){c.__tracked=true;c.__lose=c.getExtension('WEBGL_lose_context');window.__gl.push(c)}return c}
  window.__audios=[];const A=window.Audio;window.Audio=function(...a){const x=new A(...a);window.__audios.push(x);return x}
  // Frame intervals and GPU time per frame: callbacks sharing a frame timestamp are one frame.
  window.__dt=[];window.__gpu={};window.__sample=false;const raf=window.requestAnimationFrame.bind(window);const live:any[]=[];let last=0
  window.requestAnimationFrame=cb=>raf(t=>{if(t!==last){if(window.__sample&&last)window.__dt.push(t-last);last=t}
   const gl=window.__gl.filter(c=>!c.isContextLost()).at(-1),ext=window.__sample&&gl&&gl.getExtension('EXT_disjoint_timer_query_webgl2')
   if(!ext)return cb(t);const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);try{cb(t)}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);live.push([gl,ext,q,t])}
   for(let i=live.length-1;i>=0;i--){const [g,x,qq,tt]=live[i];if(g.isContextLost()){live.splice(i,1);continue}if(g.getQueryParameter(qq,g.QUERY_RESULT_AVAILABLE)){if(!g.getParameter(x.GPU_DISJOINT_EXT))window.__gpu[tt]=(window.__gpu[tt]||0)+g.getQueryParameter(qq,g.QUERY_RESULT)/1e6;g.deleteQuery(qq);live.splice(i,1)}}})
  window.__live=()=>window.__gl.filter(c=>!c.isContextLost()).length
  window.__status=()=>document.querySelector('.scene-status p')?.textContent??null`})
 if(mode==='lifecycle')await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait(`!!document.getElementById('scene-select')`)
 const select=async(elementId,value)=>{await ev(`{document.querySelector('details')&&(document.querySelector('details').open=true);const x=document.getElementById('${elementId}');x.value='${value}';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details')&&(document.querySelector('details').open=false)};true`);await pause(300)}
 await select('scene-select','nocturne');await wait(`!!window.__nt23&&window.__nt23.frames>30`)
 const probe=()=>ev('({...window.__nt23})')
 const advancing=async()=>{const a=(await probe()).frames;await pause(700);return (await probe()).frames-a}
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(outDir,`${mode}-${name}.png`),Buffer.from(d,'base64'))}
 const stats=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?{samples:s.length,mean:+(s.reduce((x,y)=>x+y,0)/s.length).toFixed(3),p50:+s[Math.floor(s.length*.5)].toFixed(3),p95:+s[Math.floor(s.length*.95)].toFixed(3),max:+s.at(-1).toFixed(3)}:null}
 // The generated song (as in verify-nocturne-nt16.ts), loaded through the real file input, looping.
 const loadSong=async()=>{await ev(`{const rate=48000,secs=62,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};let hp=0,prev=0,kp=0;const TAU=2*Math.PI
  for(let i=0;i<n;i++){const t=i/rate;let v=0;const beat=t%0.5,step=t%0.125,noise=rnd();hp=0.6*(hp+noise-prev);prev=noise
   const pad=(Math.sin(TAU*220*t)+Math.sin(TAU*261.6*t)+Math.sin(TAU*329.6*t)+0.5*Math.sin(TAU*440*t))
   if(t<14){v+=pad*0.05+Math.sin(TAU*55*t)*0.08}
   else if(t<30){const k=(t-14)/16;v+=pad*(0.05+0.03*k)+Math.sin(TAU*55*t)*0.08;v+=hp*0.28*k*k;if(t>=22)v+=hp*0.25*Math.exp(-step/0.02);if(t>=22&&beat>=0.25&&beat<0.45)v+=noise*0.15*k*Math.exp(-(beat-0.25)/0.06)}
   else if(t<46){v+=pad*0.04;const kt=beat;kp+=TAU*(42+108*Math.exp(-kt/0.03))/rate;v+=Math.sin(kp)*0.7*Math.exp(-kt/0.18);
    if(beat>=0.25)v+=Math.sign(Math.sin(TAU*55*t))*0.12*Math.exp(-(beat-0.25)/0.1);v+=hp*0.2*Math.exp(-step/0.03);if(t%1>=0.5&&t%1<0.6)v+=noise*0.25*Math.exp(-(t%1-0.5)/0.05)}
   else if(t<58){v+=pad*0.035}
   d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-nt23.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
  await wait(`!!document.querySelector('.scene-player button')`)
  await ev(`document.querySelector('.scene-player button').click();true`)
  await wait(`window.__audios.some(a=>a.getAttribute('src')&&!a.paused)`)
  await ev(`window.__audios.filter(a=>a.getAttribute('src')).forEach(a=>a.loop=true);true`)}
 const audio=()=>ev(`(()=>{const a=[...window.__audios].reverse().find(a=>a.getAttribute('src'));return a?{time:+a.currentTime.toFixed(2),paused:a.paused}:null})()`)
 const seek=t=>ev(`[...window.__audios].reverse().find(a=>a.getAttribute('src')).currentTime=${t},true`)
 const heap=async()=>{await send('HeapProfiler.collectGarbage');const m=await send('Performance.getMetrics');return Math.round(m.metrics.find(x=>x.name==='JSHeapUsedSize').value/1048576*10)/10}
 const sample=async seconds=>{await ev('window.__dt=[];window.__gpu={};window.__sample=true;true');await pause(seconds*1000);await ev('window.__sample=false;true');await pause(300);const [dt,gpu]=await Promise.all([ev('window.__dt'),ev('Object.values(window.__gpu)')]);return {frameMs:stats(dt),fps:dt.length?+(1000/(dt.reduce((a,b)=>a+b,0)/dt.length)).toFixed(1):null,gpuMs:stats(gpu)}}

 if(mode==='lifecycle'){
  await send('HeapProfiler.enable');await send('Performance.enable')
  await loadSong();await seek(31);await pause(6000) // into the drop: kicks, hats, all effects live
  let p=await probe()
  check('effects live in the drop',p.rain&&p.rippleFrames>0&&p.magenta>0&&typeof p.steam==='number',{rain:p.rain,rippleFrames:p.rippleFrames,magenta:+p.magenta.toFixed(3),steam:p.steam})
  await shot('drop')
  // 1. Lost graphics: lose and restore the WebGL context while playing.
  const beforeLoss=await probe()
  await ev(`window.__gl.filter(c=>!c.isContextLost()).at(-1).__lose.loseContext(),true`);await wait(`window.__status()!==null`,50)
  const lostStatus=await ev('window.__status()')
  await pause(1500);await ev(`window.__gl.filter(c=>c.isContextLost()).at(-1).__lose.restoreContext(),true`)
  await wait(`window.__status()===null&&window.__live()===1`,100);await pause(3000)
  p=await probe();const moved=await advancing()
  check('context loss: status shown, then the scene recovers with every effect',lostStatus&&p.rain&&moved>5&&typeof p.steam==='number'&&(await audio()).paused===false,{lostStatus,framesIn700ms:moved,rain:p.rain,steam:p.steam,audio:await audio(),geometries:[beforeLoss.geometries,p.geometries],programs:[beforeLoss.programs,p.programs]})
  await shot('after-context-restore')
  // 2. Scene switching x5: one live context, no runaway heap.
  const heapStart=await heap(),contexts:any[]=[]
  for(let k=0;k<5;k++){await select('scene-select','bloom');await wait(`!!document.querySelector('.bloom-stage')&&window.__live()===1`);await pause(800);await select('scene-select','nocturne');await wait(`!!document.querySelector('.nocturne-stage')&&window.__live()===1`);await pause(1500);contexts.push(await ev('window.__live()'))}
  await pause(2000);const heapEnd=await heap();p=await probe()
  check('scene switching x5: one live context, heap level, scene renders',contexts.every(c=>c===1)&&heapEnd<heapStart*1.25+5&&(await advancing())>5&&p.rain,{contexts,heapMB:[heapStart,heapEnd],audio:await audio()})
  // 3. Quality switching x5 on one renderer: geometries, textures and programs stay level.
  await select('graphics-quality','standard');await pause(1500);const q0=await probe(),levels:any[]=[]
  for(let k=0;k<5;k++){await select('graphics-quality','low');await pause(1200);await select('graphics-quality','standard');await pause(1500);const q=await probe();levels.push([q.geometries,q.textures,q.programs])}
  check('quality switching x5: renderer memory and programs stay level',levels.every(([g,t,pr])=>g<=q0.geometries&&t<=q0.textures&&pr<=q0.programs),{start:[q0.geometries,q0.textures,q0.programs],after:levels})
  // 4. Tab switch: another tab in front for 5 s, then back (the debug protocol's forced 'freeze'
  //    leaves a headless page hidden with no animation frames at all, so it can't test resume).
  const pageId=pages.find(x=>x.type==='page').id,f0=await probe()
  const other=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json()
  await fetch(`http://127.0.0.1:${debug}/json/activate/${other.id}`);await pause(5000)
  const away={visibility:await ev('document.visibilityState'),frames:(await probe()).frames-f0.frames}
  await fetch(`http://127.0.0.1:${debug}/json/activate/${pageId}`);await fetch(`http://127.0.0.1:${debug}/json/close/${other.id}`);await pause(2500);p=await probe()
  const rafFires=await ev('new Promise<any>(r=>{let n=0,on=true;const f=()=>{n++;if(on)requestAnimationFrame(f)};requestAnimationFrame(f);setTimeout(()=>{on=false;r(n)},1000)})')
  const resumed=await advancing()
  check('tab switch: the scene resumes with its effects when the tab is back',resumed>5&&p.rain&&typeof p.steam==='number'&&Number.isFinite(p.flicker),{whileAway:away,visibilityBack:await ev('document.visibilityState'),sceneFramesIn700msAfter:resumed,rawRafPerSecondAfter:rafFires,steam:p.steam,flicker:p.flicker,audio:await audio()})
  // 5. Reduced motion with every effect, Standard and Low: no rain, steam frozen, no ripples
  //    or flicker; the lights still follow the music.
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  for(const quality of ['standard','low']){
   await select('graphics-quality',quality);await seek(31);await pause(1500)
   const a=await probe();await pause(8000);const b=await probe()
   check(`reduced motion (${quality})`,!b.rain&&a.steam===b.steam&&b.rippleFrames===a.rippleFrames&&b.flickerFrames===a.flickerFrames&&b.magenta>0,{rain:b.rain,steam:[a.steam,b.steam],newRippleFrames:b.rippleFrames-a.rippleFrames,newFlickerFrames:b.flickerFrames-a.flickerFrames,magenta:+b.magenta.toFixed(3)})
   await shot(`reduced-motion-${quality}`)
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await select('graphics-quality','standard')
  // 6. Soak: 3 minutes looping the song; compare the first and last minute.
  report.errors=report.errors.filter(Boolean);const errorsBefore=report.errors.length,soakHeap0=await heap(),f1=await probe()
  const first=await sample(60);await pause(60000);const lastMinute=await sample(60);const soakHeap1=await heap(),f2=await probe()
  check('soak 3 min: no errors, steady frames and heap, flicker seen',report.errors.length===errorsBefore&&lastMinute.frameMs!.p95<=first.frameMs!.p95*1.5+2&&soakHeap1<soakHeap0*1.25+5,{firstMinute:first,lastMinute,heapMB:[soakHeap0,soakHeap1],ripplesFrames:f2.rippleFrames-f1.rippleFrames,flickerFrames:f2.flickerFrames-f1.flickerFrames,errors:report.errors.length-errorsBefore})
 }else{
  // Native window: must stay visible and uncovered while sampling.
  const env=await ev(`(()=>{const gl=window.__gl.at(-1),d=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,visibility:document.visibilityState,ua:navigator.userAgent}})()`)
  report.environment=env;console.log('native environment',JSON.stringify(env))
  const t0=Date.now(),step=label=>console.log(`[${((Date.now()-t0)/1000).toFixed(1)}s]`,label)
  const run=async(name,quality)=>{step(`${name} ${quality}: select`);await select('graphics-quality',quality);step('settle 5 s');await pause(5000);const vis0=await ev('document.visibilityState');step('sample 30 s');const r=await sample(30);step('sampled');const vis1=await ev('document.visibilityState');const row={name,quality,visible:vis0==='visible'&&vis1==='visible',...r};report.native.push(row);console.log(JSON.stringify(row))}
  await run('idle','standard');await run('idle','low')
  step('load song');await loadSong();step('song playing');await seek(14)
  await run('music (build, drop)','standard');await seek(14);await run('music (build, drop)','low')
  check('native window stayed visible while sampling',report.native.every(r=>r.visible),report.native.map(r=>[r.name,r.quality,r.visible]))
 }
 report.errors=report.errors.filter(Boolean)
 check('no runtime errors',report.errors.length===0,report.errors)
}catch(e:any){report.failure=String(e?.stack??e);console.log('FAILURE',report.failure);process.exitCode=1}
finally{await writeFile(join(outDir,`${mode}-results.json`),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await pause(800);await rm(temporary,{recursive:true,force:true}).catch(()=>{})}

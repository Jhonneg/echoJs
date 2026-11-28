// Read-only production audit: all probes live in an isolated temporary application.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/lavender-peaks/lp01')
assert.ok((await readFile('src/scenes/lavender-peaks/motion.ts','utf8')).includes('updateSunPulse'),
  'LP01 harness requires the pre-migration source; use retained LP01 evidence or verify-lavender-lp02.ts after migration')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp01-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const app=join(root,'src/App.tsx');let appText=await readFile(app,'utf8')
assert.ok(appText.includes('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))'))
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp01Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('  useFrame((_, delta) => {',`  useFrame(({camera,gl}, delta) => {
    const w=window as any, control=w.__lp01Control
    const reviewSignal=control?.signal??signal, reviewGain=control?.gain??reactivity
    if(control?.offsets) for(let i=0;i<6;i++) motion.current[i].offset=control.offsets[i]
`)
sceneText=sceneText.replace('pulse.value, signal, reactivity, reducedMotion, delta','pulse.value, reviewSignal, reviewGain, reducedMotion, delta')
sceneText=sceneText.replace('motion.current[depth], signal, depth, reactivity, reducedMotion, delta','motion.current[depth], reviewSignal, depth, reviewGain, reducedMotion, delta')
sceneText=sceneText.replace('  return <>',`  useFrame(({camera,gl},delta)=>{
    const w=window as any, a=w.__lp01Audio, ctx=gl.getContext(), debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const features=w.__lp01Analysis.musicFeatures.read()
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,
      signal:JSON.parse(JSON.stringify(signal)),features:JSON.parse(JSON.stringify(features)),
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),sunPulse:sky.current?.uniforms.sunPulse.value,
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp01Control}
    w.__lp01Latest=row
    if(w.__lp01Record&&(!w.__lp01Last||row.now-w.__lp01Last>=.05)){(w.__lp01Rows??=[]).push(row);w.__lp01Last=row.now}
  })
  return <>`)
assert.ok(sceneText.includes('reviewSignal')&&sceneText.includes('__lp01Latest'));await writeFile(scene,sceneText)
const generated=spawnSync(process.execPath,['scripts/generate-nocturne-matrix-review.ts'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}})
assert.equal(generated.status,0,generated.stderr)
const audioPath='/tmp/echo-nocturne-r4-review.wav'
await cp('/tmp/echo-nocturne-r4-review-sections.json',join(output,'generated-schedule.json'))
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report:Record<string,any>={source:'Fresh headless Brave/CDP, isolated current-source Vite copy, generated WAV only. No captured or owner media.',temporary,errors:[],snapshots:[],checks:[]}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__lp01Audio=this;return originalPlay.apply(this,args)}`})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__lp01Latest');await pause(800)
 const snapshot=async name=>{const row=await evaluate('window.__lp01Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.snapshots.push({name,row});return row}
 const quiet=await snapshot('original-no-audio');assert.ok(quiet.motion.every(x=>x.speed===0&&x.offset===0));assert.equal(quiet.sunPulse,0)
 const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
 await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
 await evaluate(`window.__lp01Record=true;document.querySelector('.scene-player button').click();true`)
 await wait('window.__lp01Audio&&!window.__lp01Audio.paused&&window.__lp01Audio.currentTime>.1')
 const frames:any[]=[],states=[['bass',3.5],['low-mid',6.5],['high-mid-quiet',9.5],['high-mid-loud',12.5],['air',15.5],['high-mid-attacks',23],['mixed',46],['silence',63]];let next=0,state=0,lastLog=-1
 while(true){
  const row=await evaluate('window.__lp01Latest'),t=row.audioTime
  if(Math.floor(t/15)!==lastLog){console.log('Generated playback',t.toFixed(1));lastLog=Math.floor(t/15)}
  if(state<states.length&&t>=states[state][1]){await snapshot(states[state][0]);state++}
  if(t>=next){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:85});const end=await evaluate('window.__lp01Audio.currentTime');const path=join(temporary,`frame-${String(frames.length).padStart(4,'0')}.jpg`);await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time:(t+end)/2,before:t,after:end});next=t+.125}
  if(t>=64)break
  await pause(35)
 }
 await evaluate('window.__lp01Record=false;window.__lp01Audio.pause();true')
 const rows=await evaluate('window.__lp01Rows');await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash:createHash('sha256').update(await readFile(audioPath)).digest('hex')}))
 assert.ok(rows.length>500&&frames.length>200);assert.ok(rows.every(x=>x.camera.join(',')==='0,0,20'&&x.quaternion.join(',')==='0,0,0,1'))
 const ratioRows=rows.filter(x=>x.motion[0].speed>.0001)
 assert.ok(ratioRows.every(x=>Math.abs(x.motion[5].speed/x.motion[0].speed-8)<1e-8))
 report.checks.push('Generated PCM through actual production analysis; same shared motion ratio8 at all nonzero samples; camera fixed')
 const concat=frames.map((x,i)=>`file '${x.path}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-x.time):.125}`).join('\n')
 await writeFile(join(temporary,'frames.txt'),concat+'\n')
 const encode=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'generated-baseline.mp4')],{encoding:'utf8'});assert.equal(encode.status,0,encode.stderr)
 // Dev-copy-only scalar fixtures verify disabling and actual rendered wrap positions.
 const ideal=await evaluate('structuredClone(window.__lp01Latest.signal)');ideal.intensity=1;ideal.sixBands.air=1;ideal.fast.bass=1;ideal.transient.bass=1
 await evaluate('window.__lp01Control='+JSON.stringify({signal:ideal,gain:0}));await pause(400)
 const zero=await snapshot('zero-reactivity');await pause(250);const zeroAfter=await evaluate('window.__lp01Latest');assert.deepEqual(zero.motion,zeroAfter.motion);assert.equal(zero.sunPulse,0)
 await evaluate('window.__lp01Control='+JSON.stringify({signal:ideal,gain:1}));await pause(500)
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(500)
 const reduced=await snapshot('reduced-motion');await pause(250);assert.deepEqual(reduced.motion,(await evaluate('window.__lp01Latest')).motion);assert.equal(reduced.sunPulse,0)
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(300)
 await evaluate('window.__lp01Control='+JSON.stringify({signal:ideal,gain:0,offsets:[0,0,0,0,0,0]}));await pause(150);await snapshot('wrap-origin')
 await evaluate('window.__lp01Control='+JSON.stringify({signal:ideal,gain:0,offsets:[24,24,24,24,24,24]}));await pause(150);await snapshot('wrap-full-period')
 report.checks.push('Temporary-copy zero gain and reduced motion freeze; actual geometry rendered at0 and24 units')
 // Extended real-time maximum-drive loop: record every frame's scalar transform, screenshots at intervals.
 await evaluate('window.__lp01Control='+JSON.stringify({signal:ideal,gain:1})+';window.__lp01Rows=[];window.__lp01Record=true;true')
 const longStart=Date.now(),loopFrames:any[]=[]
 while(Date.now()-longStart<90000){const row=await evaluate('window.__lp01Latest');loopFrames.push({elapsed:(Date.now()-longStart)/1000,motion:row.motion,dt:row.dt});await pause(1000)}
 await snapshot('long-loop-end');await evaluate('window.__lp01Record=false;true')
 const longRows=await evaluate('window.__lp01Rows');const wraps=Array.from({length:6},(_,i)=>longRows.slice(1).filter((x,j)=>x.motion[i].offset<longRows[j].motion[i].offset).length)
 assert.ok(wraps[5]>=3);assert.ok(longRows.every(x=>x.motion.every(m=>m.offset>=0&&m.offset<24)))
 const deltas=longRows.map(x=>x.dt).filter(x=>x>0&&x<1).sort((a,b)=>a-b)
 report.loop={seconds:(Date.now()-longStart)/1000,wraps,sampledP95FrameMs:deltas[Math.floor(deltas.length*.95)]*1000,qualification:'Headless instrumented development build; cadence is not target-device performance certification.'}
 await writeFile(join(output,'long-loop.json'),JSON.stringify({rows:loopFrames,summary:report.loop},null,2))
 report.checks.push('90s maximum-drive browser loop; all offsets bounded; nearest ridge wraps at least3times')
 report.browser=await evaluate('navigator.userAgent');report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged);assert.deepEqual(report.errors,[])
 report.status='LP01 technical baseline captured; real-song owner review and proposed mapping approval pending';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

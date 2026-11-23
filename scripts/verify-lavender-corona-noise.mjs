// LP06 generated-input verification; probes and overrides live in an isolated production-build copy.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),baseline=process.env.ECHO_CORONA_BASELINE,sourceRoot=baseline??repository,output=join(repository,'docs/evidence/lavender-peaks/corona-noise',baseline?'baseline':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp06-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const diagnosticOnly=process.env.ECHO_CORONA_DIAGNOSTICS==='1',perfOnly=process.env.ECHO_CORONA_PERF_ONLY==='1'
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(sourceRoot,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const app=join(root,'src/App.tsx');let appText=await readFile(app,'utf8')
assert.ok(appText.includes('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))'))
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp06Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('  useFrame((_, delta) => {', `  useFrame((_, delta) => {
    const w=window as any, control=w.__lp06Control
    if(w.__lp06OverrideFresh&&w.__lp06Override){w.__lp06Override.updatedAtSeconds=performance.now()/1000;w.__lp06Override.frame++}
    const reviewReader=w.__lp06Override?{read:()=>w.__lp06Override}:musicFeatures
    const reviewGain=control?.gain??reactivity
`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, performance.now() / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('motion.current, performance.now() / 1000, reactivity, reducedMotion','motion.current, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('corona.current, response.current, delta, reactivity, reducedMotion','corona.current, response.current, delta, reviewGain, reducedMotion')
sceneText=sceneText.replace('delta, reactivity, reducedMotion)\n    if (sky.current)','delta, reviewGain, reducedMotion)\n    if (sky.current)')
sceneText=sceneText.replace('      updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)', `      if(control?.offsets)motion.current[depth].offset=control.offsets[depth]
      if(!control?.freeze)updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)`)
sceneText=sceneText.replace('  return <>', `  useFrame(({camera,gl},delta)=>{
    const w=window as any, a=w.__lp06Audio, ctx=gl.getContext(), debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const features=w.__lp06Override??musicFeatures.read(), r=response.current, c=corona.current
    const held=w.__lp06Held, control=w.__lp06Control, u=sky.current!.uniforms
    if(held){for(let i=0;i<6;i++)groups.current[i]!.position.x=held.positions[i];for(const [k,v]of Object.entries(held.skyUniforms)){if(!u[k])continue;if(ArrayBuffer.isView(u[k].value))u[k].value.set(Object.values(v as any));else u[k].value=v}}
    if(control?.time!==undefined)u.coronaTime.value=control.time
    if(control?.resetTime){c.time=0;u.coronaTime.value=0;delete control.resetTime}
    u.reviewCoronaOnly.value=control?.coronaOnly?1:0;u.reviewOuterOnly.value=control?.outerOnly?1:0;u.reviewFlatOpacity.value=control?.flatOpacity?1:0;u.reviewCoronaOff.value=control?.coronaOff?1:0
    for(const group of groups.current)group!.visible=!control?.coronaOnly
    if(control?.perfTime)u.coronaTime.value=(performance.now()/1000)%(Math.PI*200)
    const variant=control?.illuminationOff?'none':'all'
    const air=held?.atmosphere??atmosphere.current
    u.atmosphereDensity.value=control?.atmosphereOff?0:air.density;u.atmosphereWarmth.value=control?.atmosphereOff?0:air.warmth
    const light=held?.illumination??{coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)}
    u.coronaLight.value=variant==='all'||variant==='sky-only'?light.coronaLight:0
    const delivered=groups.current.map((g,i)=>{
      const m=(g!.children[0] as any).material
      if(held){m.uniforms.sustained.value=held.response.ridges[i].sustained;m.uniforms.accent.value=held.response.ridges[i].accent;m.uniforms.terrainOffset.value=held.positions[i];m.uniforms.nextOffset.value=held.positions[Math.min(i+1,5)]}
      m.uniforms.coronaLight.value=variant==='all'||variant==='slopes-only'?light.coronaLight:0
      m.uniforms.mistLight.value=variant==='all'||variant==='mist-only'?light.mist:0
      m.uniforms.glintLight.value=variant==='all'||variant==='glints-only'?light.glints[i]:0
      if(held){m.uniforms.traceHead.value=held.delivered[i].traceHead;m.uniforms.traceOpacity.value=held.delivered[i].traceOpacity;m.uniforms.traceDirection.value=held.delivered[i].traceDirection;m.uniforms.traceTail.value=held.delivered[i].traceTail}
      m.uniforms.atmosphereDensity.value=control?.atmosphereOff?0:air.density;m.uniforms.atmosphereWarmth.value=control?.atmosphereOff?0:air.warmth
      if(control?.off)m.uniforms.traceOpacity.value=0
      return {atmosphereDensity:m.uniforms.atmosphereDensity.value,atmosphereWarmth:m.uniforms.atmosphereWarmth.value,traceHead:m.uniforms.traceHead.value,traceOpacity:m.uniforms.traceOpacity.value,traceDirection:m.uniforms.traceDirection.value,traceTail:m.uniforms.traceTail.value,sustained:m.uniforms.sustained.value,accent:m.uniforms.accent.value,coronaLight:m.uniforms.coronaLight.value,mist:m.uniforms.mistLight.value,glint:m.uniforms.glintLight.value,offset:m.uniforms.terrainOffset.value,nextOffset:m.uniforms.nextOffset.value}
    })
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,delivered,
      features:JSON.parse(JSON.stringify(features)),atmosphere:{...atmosphere.current},response:{context:{...r.context},fresh:r.fresh,session:r.session,sequence:r.sequence,count:r.count,ridges:r.ridges.map(x=>({...x}))},corona:{...c,pulses:c.pulses?.map(p=>({...p})),pulseUniforms:Array.from(c.pulseUniforms??[])},traces:{session:traces.current.session,slots:traces.current.slots.map(x=>({...x}))},illumination:{session:illumination.current.session,coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)},
      skyUniforms:Object.fromEntries(Object.entries(u).map(([k,v])=>[k,ArrayBuffer.isView(v.value)?Array.from(v.value as any):v.value])),
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp06Override,held:!!held}
    w.__lp06Latest=row
    if(w.__lp06Record&&!held&&(!w.__lp06Last||row.now-w.__lp06Last>=.05)){(w.__lp06Rows??=[]).push(row);w.__lp06Last=row.now}
  })
  return <>`)
sceneText=sceneText.replace('sunPulse.current, response.current, delta, reactivity, reducedMotion','sunPulse.current, response.current, delta, reviewGain, reducedMotion').replace('atmosphere.current, response.current, delta, reactivity, reducedMotion','atmosphere.current, response.current, delta, reviewGain, reducedMotion')
sceneText=sceneText.replace('coronaTime: { value: 0 },', 'reviewCoronaOnly:{value:0},reviewOuterOnly:{value:0},reviewFlatOpacity:{value:0},reviewCoronaOff:{value:0},coronaTime: { value: 0 },')
sceneText=sceneText.replace('void main() {\n  float height =', `uniform float reviewCoronaOnly;
void main() {
  if(reviewCoronaOnly>0.5){vec2 p=vPosition-vec2(1.6,1.9);float r=length(p);gl_FragColor=vec4(applyCorona(vec3(0.0),p,r,max(fwidth(r),0.006)),1.0);return;}
  float height =`)
sceneText=sceneText.replace('float pulsedSunDistance = sunDistance / (1.0 + sunPulse * 0.2);', 'float pulsedSunDistance = sunDistance;')
sceneText=sceneText.replace('  return <>', `  useFrame(({gl,scene,camera},dt)=>{
    const w=window as any,t=performance.now();gl.render(scene,camera)
    if(w.__noisePerf)(w.__noiseFrames??=[]).push({dt,cpuMs:performance.now()-t})
  },1)
  return <>`)
const coronaPath=join(root,'src/scenes/lavender-peaks/corona.ts')
let coronaText=await readFile(coronaPath,'utf8')
coronaText=coronaText.replace('uniform float coronaTime;', 'uniform float reviewOuterOnly;\nuniform float reviewFlatOpacity;\nuniform float reviewCoronaOff;\nuniform float coronaTime;')
coronaText=coronaText.replace('  float limit =', '  if(reviewCoronaOff>0.5)return color;\n  float limit =')
coronaText=coronaText.replace('    float layer = float(i);', '    if(reviewOuterOnly>0.5 && i<2)continue;\n    float layer = float(i);')
coronaText=coronaText.replace('  float fade =', '  if(reviewFlatOpacity>0.5)opacity=0.4;\n  float fade =')
await writeFile(coronaPath,coronaText)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__lp06Latest'));await writeFile(scene,sceneText)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const generated=spawnSync(process.execPath,['scripts/generate-lavender-corona-fixture.mjs'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}})
assert.equal(generated.status,0,generated.stderr)
const audioPath='/tmp/echo-lavender-corona-noise.wav'
await cp('/tmp/echo-lavender-corona-noise-schedule.json',join(output,'generated-schedule.json'))
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report={source:'Fresh headless Brave/CDP, isolated production-build copy, generated WAV only. No captured or owner media.',temporary,errors:[],snapshots:[],checks:[]}
if(diagnosticOnly||perfOnly){Object.assign(report,JSON.parse(await readFile(join(output,'capture.json'),'utf8')));report.diagnosticTemporary=temporary}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__lp06Audio=this;return originalPlay.apply(this,args)}`})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__lp06Latest');await pause(800)
 const snapshot=async name=>{const row=await evaluate('window.__lp06Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.snapshots.push({name,row});return row}
 await evaluate('window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(150)
 const fixture={version:1,session:9701,frame:1,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,
  energy:{low:.27,mid:0,high:0,overall:.27,six:{subBass:.09,bass:.27,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:0,brightness:0,brightnessValid:false,activity:0},events:[]}
 if(!diagnosticOnly){
 await evaluate('window.__lp06Override='+JSON.stringify(fixture)+';window.__lp06OverrideFresh=true;true');await pause(1500)
 const perfHeld=await evaluate('window.__lp06Latest')
 Object.assign(perfHeld.skyUniforms,{coronaEnvelope:.8,coronaDetail:.2,coronaLowAccent:.4,coronaMidAccent:0,coronaHighAccent:0,coronaLight:.4,sunPulse:.2})
 if(perfHeld.skyUniforms.coronaBassPulses)perfHeld.skyUniforms.coronaBassPulses=[1.6,.5,0,0,0,0]
 await evaluate('window.__lp06Held='+JSON.stringify(perfHeld)+';window.__lp06Control={freeze:true,perfTime:true};true');await pause(1000)
 report.performance=[]
 for(let run=0;run<3;run++){
  await evaluate('window.__noiseFrames=[];window.__noisePerf=true;true');await pause(4000)
  await evaluate('window.__noisePerf=false;true');report.performance.push(await evaluate('window.__noiseFrames'))
 }
 await evaluate('delete window.__lp06Held;delete window.__lp06Override;delete window.__lp06OverrideFresh;window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0]};true')
 }
 report.renderer=(await evaluate('window.__lp06Latest')).renderer
 if(!baseline&&!perfOnly){
  let rows,states
  if(diagnosticOnly){rows=JSON.parse(await readFile(join(output,'trace.json'),'utf8')).rows;states=report.states}
  else{
  const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
  await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
  await evaluate('window.__lp06Record=true;document.querySelector(".scene-player button").click();true');await wait('window.__lp06Audio&&!window.__lp06Audio.paused&&window.__lp06Audio.currentTime>.1')
  const frames=[],cases=[['silence',2],['moderate',8],['strong',18],['isolated-onset',23.4],['repeated-2Hz',29],['repeated-4Hz',33.5],['bass-free',42],['mixed',54],['silence-release',63]];states={};let next=0,lastLog=-1
  while(true){
   const row=await evaluate('window.__lp06Latest'),t=row.audioTime
   if(Math.floor(t/15)!==lastLog){console.log('Corona actual-MI generated playback',t.toFixed(1));lastLog=Math.floor(t/15)}
   for(const [name,time]of cases)if(t>=time&&!states[name]){states[name]=await snapshot(name)}
   if(t>=next){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:92}),end=await evaluate('window.__lp06Audio.currentTime'),path=join(temporary,'frame-'+frames.length+'.jpg');await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time:(t+end)/2,before:t,after:end});next=t+.15}
   if(t>=63.5)break
   await pause(20)
  }
  await evaluate('window.__lp06Record=false;window.__lp06Audio.pause();true')
  rows=await evaluate('window.__lp06Rows');assert.ok(rows.length>500)
  assert.ok(rows.every(r=>r.camera.join(',')==='0,0,20'))
  assert.ok(rows.every(r=>r.skyUniforms.coronaRadiusRatio===1.65))
  assert.ok(rows.filter(r=>r.audioTime>41&&r.audioTime<43.5).every(r=>r.corona.lowAccent===0&&r.corona.envelope<.001))
  await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash:createHash('sha256').update(await readFile(audioPath)).digest('hex')}))
  await writeFile(join(temporary,'frames.txt'),frames.map((x,i)=>`file '${x.path}'\nduration ${frames[i+1]?frames[i+1].time-x.time:.15}`).join('\n')+'\n')
  const movie=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'generated-corona-demo.mp4')],{encoding:'utf8'});assert.equal(movie.status,0,movie.stderr)
  }
  // Equal opacity, single outer strand, no occluders: these expose actual radial geometry.
  report.diagnostic=[]
  for(let frame=0;frame<24;frame++)for(const label of ['silence','moderate','strong']){
   const held=structuredClone(states[label]);held.skyUniforms.coronaTime=1.4+frame*.1
   held.skyUniforms.coronaBassPulses=[0,0,0,0,0,0]
   await evaluate('window.__lp06Held='+JSON.stringify(held)+';window.__lp06Control={freeze:true,coronaOnly:true,outerOnly:true,flatOpacity:true};true');await pause(45)
   const shot=await send('Page.captureScreenshot',{format:'png'}),name='shape-'+label+'-'+String(frame).padStart(2,'0')+'.png'
   await writeFile(join(output,name),Buffer.from(shot.data,'base64'));report.diagnostic.push({label,frame,time:held.skyUniforms.coronaTime,name,envelope:held.skyUniforms.coronaEnvelope})
   await evaluate('window.__lp06Control={freeze:true};true');await pause(40)
   const normal=await send('Page.captureScreenshot',{format:'jpeg',quality:94});await writeFile(join(output,'matched-'+label+'-'+String(frame).padStart(2,'0')+'.jpg'),Buffer.from(normal.data,'base64'))
  }
  const strong=structuredClone(states.strong);strong.skyUniforms.coronaTime=1.4
  await evaluate('window.__lp06Held='+JSON.stringify(strong)+';window.__lp06Control={freeze:true};true');await pause(80);await snapshot('environment-on')
  await evaluate('window.__lp06Control.illuminationOff=true;true');await pause(80);await snapshot('environment-off')
  const onsetRows=rows.filter(r=>r.audioTime>=23.3&&r.audioTime<24.2)
  await writeFile(join(output,'onset-trace.json'),JSON.stringify(onsetRows))
  report.onsetDiagnostic=[]
  for(const held of onsetRows.filter(r=>r.corona.lowAccent>.04)){
   const index=report.onsetDiagnostic.length
   await evaluate('window.__lp06Held='+JSON.stringify(held)+';window.__lp06Control={freeze:true,coronaOnly:true,outerOnly:true,flatOpacity:true};true');await pause(45)
   let shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,'onset-'+index+'-on.png'),Buffer.from(shot.data,'base64'))
   const off=structuredClone(held);off.skyUniforms.coronaBassPulses=[0,0,0,0,0,0]
   await evaluate('window.__lp06Held='+JSON.stringify(off)+';true');await pause(45)
   shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,'onset-'+index+'-off.png'),Buffer.from(shot.data,'base64'))
   report.onsetDiagnostic.push({index,time:held.audioTime,pulses:held.skyUniforms.coronaBassPulses})
  }
  await evaluate('delete window.__lp06Held;window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0]};true')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250)
  const reduced=await snapshot('reduced-motion');await pause(250);const later=await evaluate('window.__lp06Latest')
  assert.equal(later.corona.time,reduced.corona.time);assert.equal(later.corona.lowAccent,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate('window.__lp06Override='+JSON.stringify(fixture)+';window.__lp06OverrideFresh=true;true');await pause(600)
  await evaluate('window.__lp06Control.gain=0;true');await pause(100);assert.equal((await snapshot('gain-zero')).corona.envelope,0)
  await evaluate('delete window.__lp06Control.gain;window.__lp06OverrideFresh=false;window.__lp06Override.updatedAtSeconds=performance.now()/1000-1;true');await pause(150);assert.equal((await snapshot('stale')).response.fresh,false)
  await evaluate('window.__lp06Override.session++;true');await pause(100);assert.equal((await snapshot('session-reset')).corona.lowAccent,0)
  await evaluate('document.getElementById("graphics-quality").value="low";document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));window.__lp06OverrideFresh=true;true');await pause(500);await snapshot('low-quality')
  report.states=states;report.resources=rows[30].cost
  report.checks.push('Actual PCM/MI A-F fixtures, fixed camera, bass-free exclusion, same-opacity radial diagnostics, reduced phase freeze, gain0/stale/session/Low')
 }
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged);assert.deepEqual(report.errors,[])
 report.baseline=!!baseline;report.sourceRoot=sourceRoot;report.status='Corona noise browser capture passed; optical/performance assessment follows';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

// NT13-R0: generated-only aligned baselines. All probes/ablations are temporary-copy only.
import {spawn,spawnSync} from 'node:child_process'
import {mkdtemp,mkdir,cp,symlink,readFile,writeFile,copyFile,readdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {createServer} from 'node:net'
const sceneName=process.env.ECHO_R0_SCENE||'nocturne',quality=process.env.ECHO_R0_QUALITY||'standard'
const phase=process.env.ECHO_NOCTURNE_REFINEMENT_PHASE||'r0',reduced=process.env.ECHO_R0_REDUCED==='1'
assert.ok(['r0','r1','r2','r3','r4','r5'].includes(phase))
const controlsOnly=phase==='r4'&&process.env.ECHO_R4_CONTROLS_ONLY==='1'
const diagnostics=process.env.ECHO_R0_DIAGNOSTICS==='1'
assert.ok(['nocturne','crimson-horizon'].includes(sceneName));assert.ok(['standard','low'].includes(quality))
const repository=process.cwd(),base=join(repository,'docs/evidence/nocturne/nt13-refinement',phase),output=join(base,sceneName,quality+(reduced?'-reduced':''),controlsOnly?'controls':diagnostics?'diagnostics':'baseline')
await mkdir(output,{recursive:true})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
const manifest=await Promise.all((await files('src')).map(async file=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})))
try{assert.deepEqual(JSON.parse(await readFile(join(base,'source-manifest.json'))),manifest,'R0 source changed since initial capture')}catch(e){if(e.code==='ENOENT')await writeFile(join(base,'source-manifest.json'),JSON.stringify(manifest,null,2));else throw e}
const temporary=await mkdtemp(join(tmpdir(),'echo-r0-')),root=join(temporary,'app')
await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const generated=spawnSync(process.execPath,[join(repository,phase==='r4'?'scripts/generate-nocturne-matrix-review.mjs':'scripts/generate-nocturne-coordination-review.mjs')],{encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:phase==='r4'?'1':'0'}});assert.equal(generated.status,0,generated.stderr)
const audioPath=phase==='r4'?'/tmp/echo-nocturne-r4-review.wav':'/tmp/echo-nocturne-coordination-review.wav',pcmHash=createHash('sha256').update(await readFile(audioPath)).digest('hex')
await copyFile(phase==='r4'?'/tmp/echo-nocturne-r4-review-sections.json':'/tmp/echo-nocturne-coordination-review-sections.json',join(base,'generated-schedule.json'))
const common=`
      const view=FEATURE_READER.read(),w=window as any,a=w.__r0Audio
      const features={...view,energy:{...view.energy,six:{...view.energy.six}},context:{...view.context},events:view.events.slice(-6)}
      const ctx=gl.getContext(),debug=ctx.getExtension('WEBGL_debug_renderer_info')
      const renderer={toneMapping:gl.toneMapping,exposure:gl.toneMappingExposure,colorSpace:gl.outputColorSpace,dpr:gl.getPixelRatio(),drawingSize:[gl.domElement.width,gl.domElement.height],shadows:gl.shadowMap.enabled,gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER)}
      const record={audioTime:a?.currentTime??0,now:performance.now()/1000,visibility:document.visibilityState,fullscreen:!!document.fullscreenElement,override:!!w.__r4Override,camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),features,renderer,cost:w.__r0Cost,SCENE_DATA}
      w.__r0Latest=record
      if(w.__r4ResumeRows&&w.__r4ResumeRows.length<40)w.__r4ResumeRows.push(record)
      if(a&&!a.paused){w.__r0Rows ||= [];if(w.__r0Rows.length<6000)w.__r0Rows.push(record)}
`
const reset=`
  useFrame(({gl},dt)=>{
    const w=window as any
    w.__r0Cost={dt,calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures}
    gl.info.autoReset=false;gl.info.reset()
  },-2)
`
const driverFile=join(root,'src/scenes/nocturne/LightingDriver.tsx');let driver=await readFile(driverFile,'utf8')
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene,camera,gl} = useThree()').replace('  const targets =',reset+'  const targets =')
const held=`
    const diagnostic=(window as any).__r0Diagnostic
    if(diagnostic){
      if(diagnostic.held){Object.assign(state.channels,JSON.parse(JSON.stringify(diagnostic.held.channels)));Object.assign(state.spill,diagnostic.held.spill);state.bridge.levels.set(diagnostic.held.bridgeSections);Object.assign(state.atmosphere,diagnostic.held.atmosphere)}
      if(diagnostic.variant==='environment'){for(const c of Object.values(state.channels))c.level=0;for(const n of Object.keys(state.spill) as NocturneVisualChannel[])state.spill[n]=0;state.bridge.levels.fill(0);Object.assign(state.atmosphere,{level:0,magenta:0,cyan:0,violet:0,fogNear:17,fogFar:74})}
    }
    const floor=scene.getObjectByName('nocturne-wet-ground')!
    floor.visible=diagnostic?.variant!=='no-reflection'
`
driver=driver.replace('    applyNocturneVisualState(bound, state)',held+'    applyNocturneVisualState(bound, state)'+`\n    if(diagnostic?.variant==='emitters-only')for(const x of bound.lights)x.light.intensity=0\n`)
const nocturneData=`channels:Object.fromEntries(Object.entries(state.channels).map(([n,x])=>[n,{...x}])),spill:{...state.spill},bridgeSections:Array.from(state.bridge.levels),instanceLevels:(state as any).instances?Object.fromEntries(Object.entries((state as any).instances).map(([k,v])=>[k,Array.from(v as Float64Array)])):null,atmosphere:{...state.atmosphere},emitters:bound.emitters.map(x=>({channel:x.channel,segment:x.segment,intensity:x.material.emissiveIntensity,instances:x.instances?{channel:x.instances.channel,scale:x.instances.scale??1,indices:Array.from(x.instances.indices),levels:Array.from(x.instances.attribute.array)}:null,toneMapped:(x.material as any).toneMapped})),points:bound.lights.map(x=>({channel:x.channel,full:x.full,intensity:x.light.intensity})),actualAtmosphere:{gate:bound.gate.emissive.toArray(),haze:bound.haze.uniforms.glow.value.toArray(),fogColor:bound.fog.color.toArray(),near:bound.fog.near,far:bound.fog.far},floorVisible:floor.visible,environment:(state as any).environment?{...(state as any).environment,depthIntensity:(bound as any).depth?.intensity,depthPosition:(bound as any).depth?.position.toArray()}:null`
driver=driver.replace('    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)','    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)'+common.replace('FEATURE_READER','musicFeatures').replace('SCENE_DATA',nocturneData))
if(phase==='r4')driver=driver.replace('    updateNocturneVisualState(state, musicFeatures,', '    const w4=window as any; if(w4.__r4OverrideFresh){w4.__r4Override.updatedAtSeconds=performance.now()/1000;w4.__r4Override.frame++}\n    const reviewReader = (window as any).__r4Override ? {read:()=> (window as any).__r4Override} : musicFeatures\n    updateNocturneVisualState(state, reviewReader,').replace('const view=musicFeatures.read(),w=', 'const view=reviewReader.read(),w=')
await writeFile(driverFile,driver)
const crimsonFile=join(root,'src/scenes/crimson-horizon/CrimsonHorizonScene.tsx');let crimson=await readFile(crimsonFile,'utf8')
crimson=crimson.replace('  const valley = useRef(createValley())',reset+'  const valley = useRef(createValley())')
const crimsonData=`response:JSON.parse(JSON.stringify(response)),journey:{distance:state.distance,sun:state.sun,sunPulse:state.sunPulse},uniforms:{sun: sunMaterial.current?Object.fromEntries(Object.entries(sunMaterial.current.uniforms).filter(([,v])=>typeof v.value==='number').map(([k,v])=>[k,v.value])):null,glow:glowMaterial.current?Object.fromEntries(Object.entries(glowMaterial.current.uniforms).filter(([,v])=>typeof v.value==='number').map(([k,v])=>[k,v.value])):null,terrain:[...meshes.current.values()].slice(0,1).map(m=>Object.fromEntries(Object.entries((m.material as ShaderMaterial).uniforms).filter(([,v])=>typeof v.value==='number').map(([k,v])=>[k,v.value])))}`
crimson=crimson.replace('    pilot?.inspect?.(state, music.current, scene, camera, gl)','    pilot?.inspect?.(state, music.current, scene, camera, gl)\n    if(pilot){'+common.replace('FEATURE_READER','pilot.reader').replace('SCENE_DATA',crimsonData)+'\n    }')
await writeFile(crimsonFile,crimson)
const localFile=join(root,'src/audio/localFile.ts');await writeFile(localFile,(await readFile(localFile,'utf8')).replace('      element = current','      element = current\n      ;(window as any).__r0Audio=current'))
const freePort=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})}),pause=ms=>new Promise(r=>setTimeout(r,ms))
const [port,debugPort]=await Promise.all([freePort(),freePort()])
if(phase==='r4'||phase==='r5'){const build=spawnSync(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)}
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),...(['r4','r5'].includes(phase)?['preview']:[]),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws;const errors=[],frames=[],snapshots=[],evidence={scene:sceneName,quality,diagnostics,pcmHash,viewport:[1440,810],deviceScale:1,volume:.5,reactivity:1,reduced,build:['r4','r5'].includes(phase)?'isolated instrumented production build':'isolated instrumented development app',navigations:[],errors}
try{
 let pages;for(let i=0;i<120;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Page.frameNavigated')evidence.navigations.push({url:m.params.frame.url,time:Date.now()});if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(200)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})
 for(let i=0;i<200;i++){try{const response=await fetch(`http://127.0.0.1:${port}/src/main.tsx`);if(response.ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")');await select('scene-select',sceneName);await select('graphics-quality',quality);await wait('!!window.__r0Latest');await pause(1200)
 const snapshot=async(name)=>{await pause(650);const before=await evaluate('window.__r0Latest'),shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));snapshots.push({name,record:before});return before}
 if(diagnostics){
  assert.equal(sceneName,'nocturne')
  const baseline=JSON.parse(await readFile(join(base,sceneName,quality,'baseline/trace.json')))
  for(const [label,time]of [['quiet',1.5],['dense',19]]){
   const held=baseline.rows.reduce((a,b)=>Math.abs(b.audioTime-time)<Math.abs(a.audioTime-time)?b:a)
   for(const variant of ['normal','emitters-only','no-reflection','environment']){await evaluate('window.__r0Diagnostic='+JSON.stringify({held,variant}));await snapshot(label+'-'+variant)}
  }
 }else{
  const dom=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'});await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
  await evaluate(`document.querySelector('details.audio-chooser').open=false;document.querySelector('.scene-player button').click();true`);await wait('window.__r0Audio && !window.__r0Audio.paused && window.__r0Audio.currentTime>.05')
  if(!controlsOnly){
  let next=0,lastPrint=-1
  while(true){
   const r=await evaluate('window.__r0Latest'),t=r.audioTime
   if(Math.floor(t/10)!==lastPrint){console.log(sceneName,quality,'time',t.toFixed(1));lastPrint=Math.floor(t/10)}
   if(t>=next&&t<(phase==='r4'?64.8:54.8)){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:88,captureBeyondViewport:false});const after=await evaluate('window.__r0Audio.currentTime');const name=`frame-${String(frames.length).padStart(4,'0')}.jpg`;await writeFile(join(temporary,name),Buffer.from(shot.data,'base64'));frames.push({name,time:(t+after)/2,before:t,after});next+=.125}
   if(t>=(phase==='r4'?64.8:54.8))break
   await pause(25)
  }
  const rows=await evaluate('window.__r0Rows');assert.ok(rows.length>frames.length&&rows.length<6000);assert.ok(frames.length>300)
  for(const r of rows){assert.equal(r.renderer.exposure,1);assert.equal(r.renderer.colorSpace,'srgb');if(sceneName==='nocturne')assert.deepEqual(r.camera,[0,1.6,5])}
  await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash,clock:'Playback currentTime + performance seconds; screenshot time bracket recorded. Generated source soundtrack, not captured output.'}))
  for(const [name,time]of (phase==='r4'?[['quiet',9.5],['bass',3.5],['mids',6.5],['dense',46],['breakdown',18],['return',23],['silent',63],['highmid-loud',12.5],['treble',15.5],['highmid-attacks',22.5]]:[['quiet',1.5],['bass',6],['mids',12],['dense',19],['breakdown',26],['return',33],['silent',53]])){const f=frames.reduce((a,b)=>Math.abs(b.time-time)<Math.abs(a.time-time)?b:a);await copyFile(join(temporary,f.name),join(output,name+'.jpg'))}
  const concat=frames.map((f,i)=>`file '${join(temporary,f.name)}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-f.time):.125}`).join('\n');await writeFile(join(temporary,'frames.txt'),concat+'\n')
  const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',join(output,'generated-baseline.mp4')],{encoding:'utf8'});assert.equal(ff.status,0,ff.stderr)
  if(sceneName==='nocturne'){
   await select('nocturne-lighting-mode','manual');await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(x=>x.textContent==='All on').click();true`)
   const manual=await snapshot('manual-all-on');assert.ok(manual.emitters.every(x=>x.intensity===1.3)&&manual.points.every(x=>x.intensity===x.full))
   if(phase==='r3'||phase==='r4'){await evaluate("document.querySelector('details.audio-chooser').open=true;true");await snapshot('manual-controls-open');await evaluate("document.querySelector('details.audio-chooser').open=false;true")}
   assert.equal(manual.renderer.exposure,rows[0].renderer.exposure);assert.equal(manual.renderer.toneMapping,rows[0].renderer.toneMapping)
   await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(x=>x.textContent==='All off').click();true`);await snapshot('manual-all-off')
   if(phase==='r1'||phase==='r2'||phase==='r3'||phase==='r4'||phase==='r5'){
    await select('nocturne-lighting-mode','audio')
    await evaluate('window.__r0Audio.currentTime=12;window.__r0Audio.play();true')
    await wait('window.__r0Latest.channels.cyanPanel.level>.04')
    const active=await snapshot('audio-after-manual')
    assert.ok(active.channels.cyanPanel.level<1&&active.channels.magentaMain.level<1)
    if(phase==='r3'||phase==='r4'){await evaluate("document.querySelector('details.audio-chooser').open=true;true");await snapshot('audio-controls-open');await evaluate("document.querySelector('details.audio-chooser').open=false;true")}
    await evaluate('window.__r0Audio.pause();true')
    await wait('Object.values(window.__r0Latest.channels).every(x=>x.level===0)')
    await snapshot('paused-after-audio')
   }
  }
  }
 }
 if(phase==='r4'){const {runR4Controls}=await import('./nocturne-r4-controls.mjs');evidence.integration={checks:[]};evidence.integration=await runR4Controls({send,evaluate,wait,select,pause,snapshot,targetId:pages[0].id,reduced,checks:evidence.integration.checks})}
 if(phase==='r2'||phase==='r3'||phase==='r4'||phase==='r5')evidence.generatedFramesDirectory=temporary;
 evidence.snapshots=snapshots;evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[]);evidence.status=controlsOnly?'completed R4 controls; forced-freeze emulation remains separately flagged':`passed generated ${phase.toUpperCase()} capture; owner artistic gate separate`;console.log('PASS',sceneName,quality,diagnostics?'diagnostics':frames.length+' frames')
}catch(e){evidence.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

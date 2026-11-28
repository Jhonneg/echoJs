// NT12 fixed-camera generated-PCM matrix review. All audio and screenshots are generated-only.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile, copyFile, readFile, mkdir, cp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const controlsOnly=process.env.ECHO_NT12_CONTROLS_ONLY==='1'
const costOnly=process.env.ECHO_NT12_COST_ONLY==='1'
const reduced=process.env.ECHO_NOCTURNE_REDUCED==='1'
const sourceRoot=process.env.ECHO_NT12_ROOT || process.cwd(),label=process.env.ECHO_NT12_LABEL || 'current'
const repository=process.cwd(), temporary=await mkdtemp(join(tmpdir(),'echo-nocturne-review-'))
const root=join(temporary,'app'), output=join(repository,'docs/evidence/nocturne/nt12',label)
await mkdir(root);await mkdir(output,{recursive:true})
for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(path==='src'?sourceRoot:repository,path),join(root,path),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const generated=spawnSync(process.execPath,[join(repository,'scripts/generate-nocturne-matrix-review.ts')],{encoding:'utf8'})
assert.equal(generated.status,0,generated.stderr)
// Probes live in an isolated copy. Production source and analysis remain byte-identical.
const driverPath=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverPath,'utf8')
const probe="\n    ;(window as any).__nocturneReview = () => {\n      const view=musicFeatures.read()\n      return {audioTime:(window as any).__reviewAudio?.currentTime??0,now:performance.now()/1000,camera:camera.position.toArray(),resources:{geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,calls:gl.info.render.calls},feature:{session:view.session,frame:view.frame,status:view.status,updatedAt:view.updatedAtSeconds,energy:{...view.energy.six},context:{...view.context},sequence:view.sequence,events:view.events.slice(-6)},\n        atmosphere:{...state.atmosphere},actualAtmosphere:{gate:bound.gate.emissive.toArray(),haze:bound.haze.uniforms.glow.value.toArray(),near:bound.fog.near,far:bound.fog.far},\n        channels:Object.fromEntries(Object.entries(state.channels).map(([name,x])=>[name,{...x}])),bridgeSections:Array.from(state.bridge.levels),\n        emitters:bound.emitters.map(x=>({channel:x.channel,segment:x.segment,intensity:x.material.emissiveIntensity})),points:bound.lights.map(x=>({channel:x.channel,intensity:x.light.intensity,full:x.full}))}\n    }\n"
assert.ok(driver.includes('    applyNocturneVisualState(bound, state)'))
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene, camera, gl} = useThree()')
driver=driver.replace('    applyNocturneVisualState(bound, state)','    applyNocturneVisualState(bound, state)'+probe)
driver=driver.replace("    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)",`    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)
    const w=window as any
    if(w.__reviewAudio && !w.__reviewAudio.paused){
      w.__nt12Trace ||= []
      if(w.__nt12Trace.length<6000)w.__nt12Trace.push(w.__nocturneReview())
    }`)
if(costOnly) driver=driver.replace('  const targets =', `  useFrame((_, dt) => {
    const w=window as any
    w.__nt12Cost ||= []
    if(gl.info.autoReset===false) {
      w.__nt12Cost.push({calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,deltaSeconds:dt})
      if(w.__nt12Cost.length>120) w.__nt12Cost.shift()
    }
    gl.info.autoReset=false
    gl.info.reset()
  }, -2)
  const targets =`)
await writeFile(driverPath,driver)
const localPath=join(root,'src/audio/localFile.ts')
await writeFile(localPath,(await readFile(localPath,'utf8')).replace('      element = current','      element = current\n      ;(window as any).__reviewAudio = current'))
const freePort=()=>new Promise<any>(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]);const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws,success=false
const errors:any[]=[], trace:any[]=[], frames:any[]=[]
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.querySelector('details.audio-chooser').open=true;document.getElementById('scene-select').value='nocturne';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__nocturneReview')
 assert.equal(await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'),reduced)
 if(costOnly){
  await pause(4500)
  const samples=await evaluate('window.__nt12Cost')
  assert.ok(samples.length>20)
  await writeFile(join(output,'whole-frame-cost.json'),JSON.stringify({method:'Temporary info.autoReset=false; collect previous whole frame and reset at useFrame priority -2 before reflection/main render. Fixed camera, idle, Standard quality, no readback during sample interval. Delta is headless smoke only, not hardware performance acceptance.',samples,errors},null,2))
  assert.deepEqual(errors,[]);success=true;console.log('PASS whole-frame cost',label,samples.length)
 }else{
 const dom=await send('DOM.getDocument',{depth:-1});const file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'})
 assert.ok(file.nodeId);await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-matrix-review.wav']})
 await wait('!!document.querySelector(".scene-player button")')
 await evaluate(`document.querySelector('details.audio-chooser').open=false;document.querySelector('.scene-player button').click();true`)
 await wait('!!window.__reviewAudio && !window.__reviewAudio.paused && window.__reviewAudio.currentTime>0.05')
 if(controlsOnly){
  const controls:any[]=[]
  const gain=async value=>{await evaluate(`(()=>{const e=Array.from(document.querySelectorAll('label.slider-control')).find(x=>x.textContent.trim().startsWith('Reactivity')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,String(${value}));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);await pause(180)}
  const mode=async value=>{await evaluate(`document.getElementById('nocturne-lighting-mode').value='${value}';document.getElementById('nocturne-lighting-mode').dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(180)}
  await evaluate('window.__reviewAudio.currentTime=11.2;true')
  await wait('window.__nocturneReview().feature.energy.highMids>.1 && window.__nocturneReview().channels.cyanPanel.level>.08')
  controls.push({name:'active-high-mid',review:await evaluate('window.__nocturneReview()')})
  await gain(0)
  const zero=await evaluate('window.__nocturneReview()')
  assert.ok(zero.feature.energy.highMids>.1,'positive input during zero-gain check')
  assert.ok(zero.emitters.every(x=>x.intensity===0)&&zero.points.every(x=>x.intensity===0)&&zero.atmosphere.level===0)
  controls.push({name:'zero-reactivity',review:zero})
  await mode('manual')
  await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All on').click();true`);await pause(180)
  const on=await evaluate('window.__nocturneReview()')
  assert.ok(on.emitters.every(x=>x.intensity===1.3)&&on.points.every(x=>x.intensity===x.full));assert.equal(on.actualAtmosphere.far,74)
  controls.push({name:'manual-all-on-at-zero-gain',review:on})
  await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All off').click();true`);await pause(180)
  const off=await evaluate('window.__nocturneReview()');assert.ok(off.emitters.every(x=>x.intensity===0)&&off.points.every(x=>x.intensity===0))
  controls.push({name:'manual-all-off',review:off})
  await mode('audio');await gain(1);await evaluate('window.__reviewAudio.currentTime=11.2;true')
  await wait('window.__nocturneReview().channels.cyanPanel.level>.08')
  await evaluate('window.__reviewAudio.pause();true')
  await wait('Object.values(window.__nocturneReview().channels).every(x=>x.level===0)')
  controls.push({name:'pause-recovery',review:await evaluate('window.__nocturneReview()')})
  assert.deepEqual(errors,[]);await writeFile(join(output,'controls.json'),JSON.stringify({reduced,controls,errors},null,2))
  success=true;console.log('PASS active-input zero/Manual/pause controls',label)
 }else{

 let nextFrame=0, lastPrint=-1
 while(true){
  const sample=await evaluate(`({audioTime:window.__reviewAudio.currentTime,paused:window.__reviewAudio.paused,review:window.__nocturneReview()})`)
  trace.push(sample)
  const t=sample.audioTime
  if(Math.floor(t)!==lastPrint){console.log('time',t.toFixed(2),'main',sample.review.channels.magentaMain.level.toFixed(3),'panel',sample.review.channels.cyanPanel.level.toFixed(3),'violet',sample.review.channels.violet.level.toFixed(3));lastPrint=Math.floor(t)}
  if(t>=nextFrame&&t<59.9){const result=await send('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:false});const name=`frame-${String(frames.length).padStart(4,'0')}.jpg`;await writeFile(join(temporary,name),Buffer.from(result.data,'base64'));frames.push({name,time:t});nextFrame+=.125}
  if(t>=59.85||sample.paused)break
  await pause(35)
 }
 assert.ok(frames.length>90,`only ${frames.length} frames`)
 const renderTrace=await evaluate('window.__nt12Trace')
 assert.ok(renderTrace.length>frames.length)
 for(const r of renderTrace){
  assert.deepEqual(r.camera,[0,1.6,5]);assert.deepEqual(r.actualAtmosphere.gate,r.actualAtmosphere.haze)
  r.emitters.forEach(x=>assert.equal(x.intensity,(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment])*1.3))
  r.points.forEach(x=>assert.equal(x.intensity,r.channels[x.channel].level*x.full))
  assert.ok(r.channels.magentaSecondary.level<=.24&&r.channels.cyanWindows.level<=.18)
  assert.ok([r.channels.violet.accent,r.channels.violetSecondary.accent].filter(x=>x>0).length<=1)
  assert.ok(r.bridgeSections.filter(x=>x>0).length<=3)
  assert.ok(r.atmosphere.level<=.65&&r.actualAtmosphere.far>=66&&r.actualAtmosphere.far<=74)
  if(reduced){assert.ok(Object.values<any>(r.channels).every(x=>x.accent===0));assert.ok(r.bridgeSections.every(x=>x===0))}
 }
 await evaluate('window.__originalReviewAudio=window.__reviewAudio')
 async function select(id,value){await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(200)}
 for(const scene of ['bloom','lavender-peaks','crimson-horizon','nocturne']){
  await select('scene-select',scene)
  assert.equal(await evaluate('window.__reviewAudio===window.__originalReviewAudio'),true)
 }
 await select('graphics-quality','low');await select('graphics-quality','standard')
 await select('nocturne-lighting-mode','manual')
 await evaluate(`document.querySelector('details.audio-chooser').open=true;Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All on').click();true`)
 await pause(300)
 assert.equal((await evaluate('window.__nocturneReview()')).channels.magentaMain.level,1)
 await select('nocturne-lighting-mode','audio');await pause(1200)
 assert.ok((await evaluate('window.__nocturneReview()')).channels.cyanPanel.level<.001)
 assert.deepEqual(errors,[])

 const concat=frames.map((f,i)=>`file '${join(temporary,f.name)}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-f.time):.1}`).join('\n')
 await writeFile(join(temporary,'frames.txt'),concat+'\n')
 const audioStart=frames[0].time
 const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(audioStart),'-i','/tmp/echo-nocturne-matrix-review.wav','-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',join(output,'generated-music-demo.mp4')],{encoding:'utf8'})
 assert.equal(ff.status,0,ff.stderr)
 for(const [name,a,b]of [['silence-start',.5,1.5],['bass100',3,4.5],['lowmid450',6,7.5],['quiet1000',9,10.5],['loud1000',12,13.5],['high8000',15,16.5],['low-attacks',19.2,21],['mid-attacks',22.2,24],['high-attacks',25.2,27],['bass-highmid',30,32.5],['lowmid-near-highmid',34,37.5],['dynamics',39,43],['silence',57,59.8]] as const){
  const target=(a+b)/2
  const frame=frames.reduce((x,y)=>Math.abs(y.time-target)<Math.abs(x.time-target)?y:x)
  await copyFile(join(temporary,frame.name),join(output,name+'.jpg'))
 }
 await writeFile(join(output,'trace.json'),JSON.stringify({reducedMotion:reduced,source:'generated WAV through unmodified production analysis and app local-file path; temporary isolated-copy probes only',fixture:'/tmp/echo-nocturne-matrix-review.wav',sections:JSON.parse(await readFile('/tmp/echo-nocturne-matrix-review-sections.json','utf8')),frames,trace,renderTrace,errors,browser:await evaluate('navigator.userAgent')},null,2))
 await copyFile('/tmp/echo-nocturne-matrix-review-sections.json',join(output,'signal-sections.json'))
 assert.deepEqual(errors,[]);success=true;console.log('PASS',temporary,frames.length,'frames',trace.length,'samples')
}
}
}catch(e:any){console.error('FAIL',e);throw e}finally{ws?.close();browser.kill();server.kill();if(!success)console.log('partial temp',temporary)}

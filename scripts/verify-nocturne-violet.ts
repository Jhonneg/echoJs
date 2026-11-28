// NT08 fixed-camera violet treble review. All audio and screenshots are generated-only.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile, copyFile, readFile, mkdir, cp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const costOnly=process.env.ECHO_NT08_COST_ONLY==='1'
const reduced=process.env.ECHO_NOCTURNE_REDUCED==='1'
const sourceRoot=process.env.ECHO_NT08_ROOT || process.cwd(),label=process.env.ECHO_NT08_LABEL || 'after'
const repository=process.cwd(), temporary=await mkdtemp(join(tmpdir(),'echo-nocturne-review-'))
const root=join(temporary,'app'), output=join(repository,'docs/evidence/nocturne/nt08',label)
await mkdir(root);await mkdir(output,{recursive:true})
for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(path==='src'?sourceRoot:repository,path),join(root,path),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const generated=spawnSync(process.execPath,[join(repository,'scripts/generate-nocturne-violet-review.ts')],{encoding:'utf8'})
assert.equal(generated.status,0,generated.stderr)
// Probes live in an isolated copy. Production source and analysis remain byte-identical.
const driverPath=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverPath,'utf8')
const probe="\n    ;(window as any).__nt08Geometry ||= ['nocturne-violet','nocturne-violetSecondary','nocturne-cyanPanel'].map(name=>{\n      const m=scene.getObjectByName(name) as any\n      return m?{name,count:m.count,matrices:Array.from(m.instanceMatrix.array),color:m.material.emissive.getHexString()}:null\n    }).filter(Boolean)\n    ;(window as any).__nocturneReview = () => {\n      const view=musicFeatures.read()\n      return {camera:camera.position.toArray(),resources:{geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,calls:gl.info.render.calls},\n        feature:{session:view.session,frame:view.frame,status:view.status,time:view.updatedAtSeconds,bass:view.energy.six.bass,lowMids:view.energy.six.lowMids,presence:view.energy.six.presence,air:view.energy.six.air,high:view.energy.high,sequence:view.sequence,recentEvents:view.events.slice(-8)},\n        violet:{target:state.violet?.target,body:state.violet?.body,startedAt:state.violet?.startedAt,bank:state.violet?.bank,accents:state.violet?Array.from(state.violet.accents):[state.channels.violet.accent,state.channels.violet.accent],levels:[state.channels.violet.level,state.channels.violetSecondary?.level??state.channels.violet.level],emissives:bound.emitters.filter(x=>x.channel==='violet'||x.channel==='violetSecondary').map(x=>x.material.emissiveIntensity),points:bound.lights.filter(x=>x.channel==='violet'||x.channel==='violetSecondary').map(x=>({channel:x.channel,intensity:x.light.intensity}))},\n        magenta:{level:state.channels.magentaMain.level},panel:{level:state.channels.cyanPanel.level,accent:state.channels.cyanPanel.accent,emissive:bound.emitters.find(x=>x.channel==='cyanPanel')!.material.emissiveIntensity,point:bound.lights.find(x=>x.channel==='cyanPanel')!.light.intensity}}\n    }\n"
assert.ok(driver.includes('    applyNocturneVisualState(bound, state)'))
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene, camera, gl} = useThree()')
driver=driver.replace('    applyNocturneVisualState(bound, state)','    applyNocturneVisualState(bound, state)'+probe)
if(costOnly) driver=driver.replace('  const targets =', `  useFrame((_, dt) => {
    const w=window as any
    w.__nt08Cost ||= []
    if(gl.info.autoReset===false) {
      w.__nt08Cost.push({calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,deltaSeconds:dt})
      if(w.__nt08Cost.length>120) w.__nt08Cost.shift()
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
  const samples=await evaluate('window.__nt08Cost')
  assert.ok(samples.length>20)
  await writeFile(join(output,'whole-frame-cost.json'),JSON.stringify({method:'Temporary info.autoReset=false; collect previous whole frame and reset at useFrame priority -2 before reflection/main render. Fixed camera, idle, Standard quality, no readback during sample interval. Delta is headless smoke only, not hardware performance acceptance.',samples,errors},null,2))
  assert.deepEqual(errors,[]);success=true;console.log('PASS whole-frame cost',label,samples.length)
 }else{
 const dom=await send('DOM.getDocument',{depth:-1});const file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'})
 assert.ok(file.nodeId);await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-violet-review.wav']})
 await wait('!!document.querySelector(".scene-player button")')
 await evaluate(`document.querySelector('details.audio-chooser').open=false;document.querySelector('.scene-player button').click();true`)
 await wait('!!window.__reviewAudio && !window.__reviewAudio.paused && window.__reviewAudio.currentTime>0.05')
 let nextFrame=0, lastPrint=-1
 while(true){
  const sample=await evaluate(`({audioTime:window.__reviewAudio.currentTime,paused:window.__reviewAudio.paused,review:window.__nocturneReview()})`)
  trace.push(sample)
  const t=sample.audioTime
  if(Math.floor(t)!==lastPrint){console.log('time',t.toFixed(2),'presence',sample.review.feature.presence.toFixed(3),'violet',sample.review.violet.levels.map(x=>x.toFixed(3)).join('/'),'accent',sample.review.violet.accents.map(x=>x.toFixed(3)).join('/'));lastPrint=Math.floor(t)}
  if(t>=nextFrame&&t<19.9){const result=await send('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:false});const name=`frame-${String(frames.length).padStart(4,'0')}.jpg`;await writeFile(join(temporary,name),Buffer.from(result.data,'base64'));frames.push({name,time:t});nextFrame+=.1}
  if(t>=19.85||sample.paused)break
  await pause(35)
 }
 assert.ok(frames.length>100,`only ${frames.length} frames`)
 for(const row of trace){
  assert.deepEqual(row.review.camera,[0,1.6,5])
  assert.equal(row.review.panel.point,row.review.panel.level*30)
  assert.equal(row.review.panel.emissive,row.review.panel.level*1.3)
 }
 const section=(a,b)=>trace.filter(x=>x.audioTime>=a&&x.audioTime<b)
 if(label!=='before'){
  for(const row of trace){
   const v=row.review.violet
   v.emissives.forEach((x,i)=>assert.equal(x,v.levels[i]*1.3))
   assert.deepEqual(v.points.map(x=>x.channel).sort(),['violet','violetSecondary'])
   assert.equal(v.emissives.length,2)
   v.points.forEach(x=>assert.equal(x.intensity,v.levels[x.channel==='violet'?0:1]*12))
   assert.ok(v.accents.filter(x=>x>0).length<=1,'localized accent')
  }
  assert.ok(section(1.5,2.8).every(x=>x.review.violet.levels.every(v=>v<.001)),'bass isolation')
  assert.ok(section(3.5,4.8).every(x=>x.review.violet.levels.every(v=>v<.001)),'low-mid isolation')
  if(reduced)assert.ok(trace.every(x=>x.review.violet.accents.every(v=>v===0)))
  else{
   for(let i=0;i<2;i++)assert.ok(Math.max(...section(9.2,10.9).map(x=>x.review.violet.accents[i]))>.02,'side '+i)
   assert.ok(section(8,8.8).every(x=>x.review.violet.accents.every(v=>v===0)),'sustain without cycling')
   assert.ok(section(19.2,19.8).every(x=>x.review.violet.levels.every(v=>v===0)),'silence')
   const starts=[...new Set(trace.map(x=>x.review.violet.startedAt).filter(Number.isFinite))]
   assert.ok(starts.every((x,i)=>i===0||x-starts[i-1]>=.4-1e-8),'bounded high retrigger')
  }
  const mean=(a,b)=>section(a,b).reduce((n,x)=>n+x.review.violet.levels[0],0)/section(a,b).length
  assert.ok(mean(8,8.8)>mean(6,6.8)*2,'quiet versus loud upper energy')
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
 assert.equal((await evaluate('window.__nocturneReview()')).magenta.level,1)
 await select('nocturne-lighting-mode','audio');await pause(1200)
 assert.ok((await evaluate('window.__nocturneReview()')).panel.level<.001)
 assert.deepEqual(errors,[])

 const concat=frames.map((f,i)=>`file '${join(temporary,f.name)}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-f.time):.1}`).join('\n')
 await writeFile(join(temporary,'frames.txt'),concat+'\n')
 const audioStart=frames[0].time
 const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(audioStart),'-i','/tmp/echo-nocturne-violet-review.wav','-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',join(output,'generated-music-demo.mp4')],{encoding:'utf8'})
 assert.equal(ff.status,0,ff.stderr)
 for(const [name,a,b] of [['bass',1.5,2.8],['lowmid',3.5,4.8],['quiet-high',6,6.8],['loud-high',8,8.8],['attacks',9.2,10.9],['dense',11.2,13.8],['air',14.5,15.8],['mixed',16.2,17.8],['silence',19.2,19.8]] as const){
  const rows=section(a,b)
  const target=name==='attacks'?rows.reduce((x,y)=>Math.max(...y.review.violet.accents)>Math.max(...x.review.violet.accents)?y:x).audioTime:(a+b)/2
  const frame=frames.reduce((x,y)=>Math.abs(y.time-target)<Math.abs(x.time-target)?y:x)
  await copyFile(join(temporary,frame.name),join(output,name+'.jpg'))
 }
 if(label==='after')for(let i=0;i<2;i++){
  const rows=section(9.2,10.9),row=rows.reduce((a,b)=>b.review.violet.accents[i]>a.review.violet.accents[i]?b:a)
  const frame=frames.reduce((a,b)=>Math.abs(b.time-row.audioTime)<Math.abs(a.time-row.audioTime)?b:a)
  await copyFile(join(temporary,frame.name),join(output,`side-${i}.jpg`))
 }
 await writeFile(join(output,'trace.json'),JSON.stringify({violetBatches:await evaluate('window.__nt08Geometry'),reducedMotion:reduced,source:'generated WAV through unmodified production analysis and app local-file path; temporary isolated-copy probes only',fixture:'/tmp/echo-nocturne-violet-review.wav',sections:JSON.parse(await readFile('/tmp/echo-nocturne-violet-review-sections.json','utf8')),frames,trace,errors,browser:await evaluate('navigator.userAgent')},null,2))
 await copyFile('/tmp/echo-nocturne-violet-review-sections.json',join(output,'signal-sections.json'))
 assert.deepEqual(errors,[]);success=true;console.log('PASS',temporary,frames.length,'frames',trace.length,'samples')
}
}catch(e:any){console.error('FAIL',e);throw e}finally{ws?.close();browser.kill();server.kill();if(!success)console.log('partial temp',temporary)}

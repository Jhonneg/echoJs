// Nocturne generated-only integration review; never captures private media.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile, copyFile, readFile, mkdir, cp, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const reduced=process.env.ECHO_NOCTURNE_REDUCED==='1'
const repository=process.cwd(), temporary=await mkdtemp(join(tmpdir(),'echo-nocturne-review-'))
const root=join(temporary,'app'), output=join(repository,'docs/evidence/nocturne',process.env.ECHO_NOCTURNE_LABEL || 'nt03')
await mkdir(root);await mkdir(output,{recursive:true})
for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,path),join(root,path),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const generated=spawnSync(process.execPath,[join(repository,'docs/evidence/nocturne/cyan-reactivity/generate-review-audio.mjs')],{encoding:'utf8'})
assert.equal(generated.status,0,generated.stderr)
// Probes live in an isolated copy. Production source and analysis remain byte-identical.
const driverPath=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverPath,'utf8')
const probe="\n    ;(window as any).__nocturneReview = () => {\n      const view = musicFeatures.read()\n      const panelTarget = bound.emitters.find(x => x.channel === 'cyanPanel')!\n      const panelLight = bound.lights.find(x => x.channel === 'cyanPanel')!\n      return { camera: camera.position.toArray(), resources: {geometries: gl.info.memory.geometries, textures: gl.info.memory.textures},\n        groups: {cyan: state.channels.cyanWindows.level, violet: state.channels.violet.level, atmosphere: state.atmosphere.level},\n        now: performance.now() / 1000, feature: {\n          session: view.session, frame: view.frame, status: view.status,\n          time: view.updatedAtSeconds, highMids: view.energy.six.highMids,\n          lowMids: view.energy.six.lowMids, bass: view.energy.six.bass,\n          overall: view.energy.overall, sequence: view.sequence,\n          recentEvents: view.events.slice(-4).map(e => ({sequence:e.sequence,band:e.band,time:e.timeSeconds,emitted:e.emittedAtSeconds,strength:e.strength}))\n        }, panel: { level: state.channels.cyanPanel.level, sustained: state.panel.sustained,\n          accent: state.panel.accent, sequence: state.panel.sequence,\n          emissive: panelTarget.material.emissiveIntensity, point: panelLight.light.intensity },\n        magenta: { level: state.channels.magentaMain.level,\n          emissive: bound.emitters.find(x => x.channel === 'magentaMain')!.material.emissiveIntensity,\n          points: bound.lights.filter(x => x.channel === 'magentaMain' || x.channel === 'bridge').map(x => x.light.intensity) }\n      }\n    }\n"
assert.ok(driver.includes('    applyNocturneVisualState(bound, state)'))
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene, camera, gl} = useThree()')
driver=driver.replace('    applyNocturneVisualState(bound, state)','    applyNocturneVisualState(bound, state)'+probe)
await writeFile(driverPath,driver)
const localPath=join(root,'src/audio/localFile.ts')
await writeFile(localPath,(await readFile(localPath,'utf8')).replace('      element = current','      element = current\n      ;(window as any).__reviewAudio = current'))
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]);const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws,success=false
const errors=[], trace=[], frames=[]
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.querySelector('details.audio-chooser').open=true;document.getElementById('scene-select').value='nocturne';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__nocturneReview')
 assert.equal(await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'),reduced)
 const dom=await send('DOM.getDocument',{depth:-1});const file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'})
 assert.ok(file.nodeId);await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-generated-review.wav']})
 await wait('!!document.querySelector(".scene-player button")')
 await evaluate(`document.querySelector('details.audio-chooser').open=false;document.querySelector('.scene-player button').click();true`)
 await wait('!!window.__reviewAudio && !window.__reviewAudio.paused && window.__reviewAudio.currentTime>0.05')
 let nextFrame=0, lastPrint=-1
 while(true){
  const sample=await evaluate(`({audioTime:window.__reviewAudio.currentTime,paused:window.__reviewAudio.paused,review:window.__nocturneReview()})`)
  trace.push(sample)
  const t=sample.audioTime
  if(Math.floor(t)!==lastPrint){console.log('time',t.toFixed(2),'highMid',sample.review.feature?.highMids?.toFixed(3),'panel',sample.review.panel?.level?.toFixed(3),'accent',sample.review.panel?.accent?.toFixed(3));lastPrint=Math.floor(t)}
  if(t>=nextFrame&&t<16.4){const result=await send('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:false});const name=`frame-${String(frames.length).padStart(4,'0')}.jpg`;await writeFile(join(temporary,name),Buffer.from(result.data,'base64'));frames.push({name,time:t});nextFrame+=.1}
  if(t>=16.35||sample.paused)break
  await pause(35)
 }
 assert.ok(frames.length>100,`only ${frames.length} frames`)
 for(const row of trace){
  assert.deepEqual(row.review.camera,[0,1.6,5])
  assert.equal(row.review.panel.point,row.review.panel.level*30)
  assert.equal(row.review.panel.emissive,row.review.panel.level*1.3)
 }
 const section=(a,b)=>trace.filter(x=>x.audioTime>=a&&x.audioTime<b)
 assert.ok(Math.max(...section(1.3,2.8).map(x=>x.review.magenta.level))>.1)
 assert.ok(section(1.3,2.8).every(x=>x.review.panel.level<.001))
 assert.ok(section(4.3,5.8).every(x=>x.review.panel.accent===0))
 assert.ok(section(7.5,8.8).every(x=>x.review.panel.level>(reduced?.04:.12)&&x.review.magenta.level<(reduced?.01:.001)))
 if(reduced)assert.ok(trace.every(x=>x.review.panel.accent===0))
 else assert.ok(Math.max(...section(9.2,12.3).map(x=>x.review.panel.accent))>.02)
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
 const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(audioStart),'-i','/tmp/echo-nocturne-generated-review.wav','-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',join(output,'generated-music-demo.mp4')],{encoding:'utf8'})
 assert.equal(ff.status,0,ff.stderr)
 await writeFile(join(output,'trace.json'),JSON.stringify({reducedMotion:reduced,source:'generated WAV through unmodified production analysis and app local-file path; temporary isolated-copy probes only',fixture:'/tmp/echo-nocturne-generated-review.wav',sections:JSON.parse(await readFile('/tmp/echo-nocturne-generated-review-sections.json','utf8')),frames,trace,errors,browser:await evaluate('navigator.userAgent')},null,2))
 await copyFile('/tmp/echo-nocturne-generated-review-sections.json',join(output,'signal-sections.json'))
 assert.deepEqual(errors,[]);success=true;console.log('PASS',temporary,frames.length,'frames',trace.length,'samples')
}catch(e){console.error('FAIL',e);throw e}finally{ws?.close();browser.kill();server.kill();if(!success)console.log('partial temp',temporary)}

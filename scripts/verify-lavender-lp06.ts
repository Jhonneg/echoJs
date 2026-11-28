// LP06 generated-input verification; probes and overrides live in an isolated production-build copy.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/lavender-peaks/lp06',process.env.ECHO_LP06_SMOKE==='1'?'smoke':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp06-')),root=join(temporary,'app')
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
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp06Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
assert.ok(!sceneText.includes('createAtmosphere'), 'LP06 capture is historical after LP07; use verify-lavender-lp07.ts to preserve its evidence')
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
    if(held){for(let i=0;i<6;i++)groups.current[i]!.position.x=held.positions[i];for(const [k,v]of Object.entries(held.skyUniforms))u[k].value=v}
    if(control?.time!==undefined)u.coronaTime.value=control.time
    if(control?.resetTime){c.time=0;u.coronaTime.value=0;delete control.resetTime}
    const variant='all'
    const light=held?.illumination??{coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)}
    u.coronaLight.value=variant==='all'||variant==='sky-only'?light.coronaLight:0
    const delivered=groups.current.map((g,i)=>{
      const m=(g!.children[0] as any).material
      if(held){m.uniforms.sustained.value=held.response.ridges[i].sustained;m.uniforms.accent.value=held.response.ridges[i].accent;m.uniforms.terrainOffset.value=held.positions[i];m.uniforms.nextOffset.value=held.positions[Math.min(i+1,5)]}
      m.uniforms.coronaLight.value=variant==='all'||variant==='slopes-only'?light.coronaLight:0
      m.uniforms.mistLight.value=variant==='all'||variant==='mist-only'?light.mist:0
      m.uniforms.glintLight.value=variant==='all'||variant==='glints-only'?light.glints[i]:0
      if(held){m.uniforms.traceHead.value=held.delivered[i].traceHead;m.uniforms.traceOpacity.value=held.delivered[i].traceOpacity;m.uniforms.traceDirection.value=held.delivered[i].traceDirection;m.uniforms.traceTail.value=held.delivered[i].traceTail}
      if(control?.off)m.uniforms.traceOpacity.value=0
      return {traceHead:m.uniforms.traceHead.value,traceOpacity:m.uniforms.traceOpacity.value,traceDirection:m.uniforms.traceDirection.value,traceTail:m.uniforms.traceTail.value,sustained:m.uniforms.sustained.value,accent:m.uniforms.accent.value,coronaLight:m.uniforms.coronaLight.value,mist:m.uniforms.mistLight.value,glint:m.uniforms.glintLight.value,offset:m.uniforms.terrainOffset.value,nextOffset:m.uniforms.nextOffset.value}
    })
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,delivered,
      features:JSON.parse(JSON.stringify(features)),response:{fresh:r.fresh,session:r.session,sequence:r.sequence,count:r.count,ridges:r.ridges.map(x=>({...x}))},corona:{...c},traces:{session:traces.current.session,slots:traces.current.slots.map(x=>({...x}))},illumination:{session:illumination.current.session,coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)},
      skyUniforms:Object.fromEntries(Object.entries(u).map(([k,v])=>[k,v.value])),
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp06Override,held:!!held}
    w.__lp06Latest=row
    if(w.__lp06Record&&!held&&(!w.__lp06Last||row.now-w.__lp06Last>=.05)){(w.__lp06Rows??=[]).push(row);w.__lp06Last=row.now}
  })
  return <>`)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__lp06Latest'));await writeFile(scene,sceneText)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const generated=spawnSync(process.execPath,['scripts/generate-nocturne-matrix-review.ts'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}})
assert.equal(generated.status,0,generated.stderr)
const audioPath='/tmp/echo-nocturne-r4-review.wav'
await cp('/tmp/echo-nocturne-r4-review-sections.json',join(output,'generated-schedule.json'))
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
 const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
 const compare=(left,right)=>{const a=decode(left),b=decode(right);assert.equal(a.length,b.length);let pixels=0,max=0,total=0;for(let i=0;i<a.length;i+=3){let changed=false;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);total+=d;max=Math.max(max,d);changed ||= d!==0}pixels+=changed?1:0}return {changedPixels:pixels,totalPixels:a.length/3,maxChannelDifference:max,meanChannelDifference:total/a.length}}
let ws
const report:Record<string,any>={source:'Fresh headless Brave/CDP, isolated production-build copy, generated WAV only. No captured or owner media.',temporary,errors:[],snapshots:[],checks:[]}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
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
 const waitFrames=()=>pause(60)
 const pair=async(name,state?)=>{
  const held=state??await evaluate('window.__lp06Latest')
  await evaluate('window.__lp06Held='+JSON.stringify(held)+';window.__lp06Control={...(window.__lp06Control||{}),off:false};true');await waitFrames();await snapshot(name+'-on')
  await evaluate('window.__lp06Control.off=true;true');await waitFrames();await snapshot(name+'-off')
  await evaluate('delete window.__lp06Held;window.__lp06Control.off=false;true')
  ;(report.pairs??=[]).push({name,heldState:structuredClone(held)})
  return held
 }
 await evaluate('window.__lp06Control.time=1.4;true');await waitFrames();await snapshot('quiet')
 assert.deepEqual(report.errors,[])
 assert.ok(compare(join(repository,'docs/evidence/lavender-peaks/lp05/current/rest-on.png'),join(output,'quiet.png')).maxChannelDifference<=1)
 const fixture:Record<string,any>={version:1,session:1001,frame:1,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,
  energy:{low:0,mid:0,high:0,overall:0,six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:0,brightness:0,brightnessValid:false,activity:0},events:[]}
 const trigger=async(band,broad,session,strength=.4)=>{
  const view=structuredClone(fixture);view.session=session
  await evaluate('window.__lp06Override='+JSON.stringify(view)+';window.__lp06OverrideFresh=true;true');await pause(180)
  await evaluate('window.__lp06Override.energy.six['+JSON.stringify(band)+']=.4;true');await pause(70)
  await evaluate('(()=>{const v=window.__lp06Override,t=performance.now()/1000;v.sequence=1;v.events=[{session:v.session,sequence:1,band:'+JSON.stringify(broad)+',strength:'+strength+',timeSeconds:t-.03,emittedAtSeconds:t}];return true})()')
 }
 await trigger('highMids','mid',1001)
 await wait('window.__lp06Latest.delivered[2].traceOpacity>.18')
 await pair('high-mid-trace')
 if(process.env.ECHO_LP06_SMOKE!=='1'){
  // Distinct controlled directions and recipients; all use real scene qualification.
  for(const [name,band,broad,ridge,session]of [['bass','bass','low',4,1002],['low-mid','lowMids','mid',3,1003],['air','air','high',0,1004]] as const){
   await trigger(band,broad,session)
   await wait('window.__lp06Latest.delivered['+ridge+'].traceOpacity>.18')
   await pair(name+'-trace')
  }
  // Deterministic replay of a live qualified trace at three ages and across a repeat seam.
  await trigger('highMids','mid',1010,.7);await wait('window.__lp06Latest.delivered[2].traceOpacity>.18')
  const traceState=await evaluate('window.__lp06Latest'),slot=traceState.traces.slots.find(x=>x.active&&x.ridge===2)
  const movement:any[]=[]
  for(const progress of [.20,.45,.70]){
   const held=structuredClone(traceState),roleDistance=slot.distance
   held.delivered[2].traceHead=((slot.startLocal+slot.direction*roleDistance*progress+12)%24+24)%24-12
   held.delivered[2].traceOpacity=.3
   movement.push(await pair('movement-'+progress,held))
  }
 const seam=structuredClone(traceState);seam.delivered[2].traceHead=11.96;seam.delivered[2].traceOpacity=.3
  for(const offset of [0,24,-24]){seam.positions=Array(6).fill(-6+offset);await pair('seam-'+offset,seam)}
  for(const offset of [24,-24])assert.ok(compare(join(output,'seam-0-on.png'),join(output,'seam-'+offset+'-on.png')).maxChannelDifference<=1)
  seam.positions=Array(6).fill(-6)
  for(const [name,head]of [['before',11.86],['at',11.99],['after',-11.88]] as const){seam.delivered[2].traceHead=head;await pair('seam-cross-'+name,seam)}
  report.controlledMovement={ridge:2,direction:slot.direction,samples:movement.map(x=>x.delivered[2].traceHead),method:'Actual qualified trace state replayed at known path fractions; fixed camera, periodic local phase.'}
  // Held high-mid energy must not route low-mid attacks into a high-mid trace.
  const heldView=structuredClone(fixture);heldView.session=1020;heldView.energy.six.highMids=.4
  await evaluate('window.__lp06Override='+JSON.stringify(heldView)+';true');await pause(500)
  await evaluate('window.__lp06Override.energy.six.lowMids=.4;true');await pause(70)
  await evaluate('(()=>{const v=window.__lp06Override,t=performance.now()/1000;v.sequence=1;v.events=[{session:v.session,sequence:1,band:"mid",strength:.5,timeSeconds:t-.03,emittedAtSeconds:t}];return true})()');await pause(250)
  const specific=await snapshot('held-high-mid-low-mid-attack')
  assert.ok(specific.traces.slots.every(x=>!x.active||x.ridge!==2));assert.ok(specific.traces.slots.some(x=>x.active&&x.ridge===3))
  // Gain/reduced/stale/session teardown clear traces immediately and do not replay.
  await evaluate('window.__lp06Control={gain:0};true');await pause(100);assert.ok((await snapshot('gain-zero')).delivered.every(x=>x.traceOpacity===0))
  await evaluate('delete window.__lp06Control;window.__lp06OverrideFresh=false;window.__lp06Override.updatedAtSeconds=performance.now()/1000-1;true');await pause(100);assert.ok((await snapshot('stale')).traces.slots.every(x=>!x.active))
  await evaluate('window.__lp06OverrideFresh=true;true')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(150);assert.ok((await snapshot('reduced')).delivered.every(x=>x.traceOpacity===0))
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate('document.getElementById("graphics-quality").value="low";document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0],time:1.4};true');await pause(250)
  await trigger('highMids','mid',1030);await wait('window.__lp06Latest.delivered[2].traceOpacity>.18');await pair('low-quality-trace')
  await evaluate('document.getElementById("graphics-quality").value="standard";document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));delete window.__lp06Control;delete window.__lp06Override;delete window.__lp06OverrideFresh;true');await pause(300)
  const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
  await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
  await evaluate('window.__lp06Record=true;document.querySelector(".scene-player button").click();true');await wait('window.__lp06Audio&&!window.__lp06Audio.paused&&window.__lp06Audio.currentTime>.1');await evaluate('window.__lp06Source=window.__lp06Audio;true')
  const frames:any[]=[];let next=0,lastLog=-1
  while(true){
   const r=await evaluate('window.__lp06Latest'),t=r.audioTime
   if(Math.floor(t/15)!==lastLog){console.log('Generated playback',t.toFixed(1));lastLog=Math.floor(t/15)}
   if(t>=next){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:87});const end=await evaluate('window.__lp06Audio.currentTime');const path=join(temporary,'music-'+frames.length+'.jpg');await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time:(t+end)/2,before:t,after:end});next=t+.125}
   if(t>=64)break
   await pause(30)
  }
  await evaluate('window.__lp06Record=false;window.__lp06Audio.pause();true')
  const rows=await evaluate('window.__lp06Rows');assert.ok(rows.length>500&&frames.length>200)
  for(const r of rows){
   assert.deepEqual(r.camera,[0,0,20]);assert.deepEqual(r.quaternion,[0,0,0,1])
   assert.ok(r.traces.slots.filter(x=>x.active).length<=3)
   r.delivered.forEach((m,i)=>{
    const slot=r.traces.slots.find(x=>x.active&&x.ridge===i)
    assert.equal(m.traceOpacity,slot?.opacity??0);assert.equal(m.traceHead,slot?.head??0)
    assert.equal(m.sustained,r.response.ridges[i].sustained);assert.equal(m.accent,r.response.ridges[i].accent)
   })
  }
  assert.ok(rows.some(r=>r.delivered.some(x=>x.traceOpacity>.18)))
  assert.ok(rows.filter(r=>r.audioTime>=33.3&&r.audioTime<37.8).every(r=>!r.traces.slots.some(x=>x.active&&x.ridge===2)))
  assert.ok(rows.filter(r=>r.audioTime>=63).every(r=>r.traces.slots.every(x=>!x.active)))
  await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash:createHash('sha256').update(await readFile(audioPath)).digest('hex')}))
  const encode=(list,name,start,withAudio=true)=>{
   const concat=list.map((x,i)=>`file '${x.path}'\nduration ${i<list.length-1?Math.max(.015,list[i+1].time-x.time):.125}`).join('\n')+'\n';const input=join(temporary,name+'.txt')
   return writeFile(input,concat).then(()=>{const args=['-y','-loglevel','error','-f','concat','-safe','0','-i',input];if(withAudio)args.push('-ss',String(start),'-i',audioPath,'-map','0:v:0','-map','1:a:0');args.push('-c:v','libx264','-crf','21','-pix_fmt','yuv420p');if(withAudio)args.push('-c:a','aac');args.push('-shortest','-movflags','+faststart',join(output,name+'.mp4'));const result=spawnSync('ffmpeg',args,{encoding:'utf8'});assert.equal(result.status,0,result.stderr)})
  }
  await encode(frames,'generated-music-demo',frames[0].time)
  // Short, higher-cadence real-PCM replay of the isolated low/mid/high attacks.
  await evaluate('window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0]};window.__lp06Audio.currentTime=18;window.__lp06Audio.play();true')
  await wait('window.__lp06Audio.currentTime>=18.5')
  const short:any[]=[],shortRows:any[]=[]
  while(true){
   const r=await evaluate('window.__lp06Latest'),t=r.audioTime;if(t>=27.6)break
   const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:90});const end=await evaluate('window.__lp06Audio.currentTime'),path=join(temporary,'short-'+short.length+'.jpg')
   await writeFile(path,Buffer.from(shot.data,'base64'));short.push({path,time:(t+end)/2,before:t,after:end});shortRows.push(r);await pause(10)
  }
  await evaluate('window.__lp06Audio.pause();true');await encode(short,'isolated-attacks-demo',short[0].time)
  await writeFile(join(output,'isolated-attacks-trace.json'),JSON.stringify({rows:shortRows,frames:short}))
  await evaluate('delete window.__lp06Control;delete window.__lp06Latest;document.getElementById("scene-select").value="nocturne";document.getElementById("scene-select").dispatchEvent(new Event("change",{bubbles:true}));true');await pause(300)
  await evaluate('document.getElementById("scene-select").value="lavender-peaks";document.getElementById("scene-select").dispatchEvent(new Event("change",{bubbles:true}));true');await wait('!!window.__lp06Latest')
  assert.ok((await snapshot('scene-reentry')).traces.slots.every(x=>!x.active));assert.ok(await evaluate('window.__lp06Audio===window.__lp06Source'))
  report.music={rows:rows.length,frames:frames.length,shortFrames:short.length,cost:rows[30].cost,renderer:rows[0].renderer,activeRecipients:[...new Set(rows.flatMap(r=>r.traces.slots.filter(x=>x.active).map(x=>x.ridge)))],maxActive:Math.max(...rows.map(r=>r.traces.slots.filter(x=>x.active).length))}
  report.checks.push('Controlled directions/recipients and contour seam pairs; low-mid rejection; gain/stale/reduced teardown; real PCM and short isolated-attack capture; same-frame scalar-to-material delivery')
 }
 report.browser=await evaluate('navigator.userAgent');assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status=process.env.ECHO_LP06_SMOKE==='1'?'LP06 visual smoke captured':'LP06 generated integration captured; optical movement assessment and owner review pending'
 console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

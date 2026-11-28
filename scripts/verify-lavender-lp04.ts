// LP04 generated-input verification; probes and overrides live in an isolated production-build copy.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/lavender-peaks/lp04',process.env.ECHO_LP04_SMOKE==='1'?'smoke':'current')
assert.ok(!(await readFile('src/scenes/lavender-peaks/LavenderPeaksScene.tsx','utf8')).includes('skyIllumination'),
  'LP04 harness requires the pre-spill scene; use retained approved LP04 evidence or verify-lavender-lp05.ts after LP05')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp04-')),root=join(temporary,'app')
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
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp04Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('  useFrame((_, delta) => {', `  useFrame((_, delta) => {
    const w=window as any, control=w.__lp04Control
    if(w.__lp04OverrideFresh&&w.__lp04Override){w.__lp04Override.updatedAtSeconds=performance.now()/1000;w.__lp04Override.frame++}
    const reviewReader=w.__lp04Override?{read:()=>w.__lp04Override}:musicFeatures
    const reviewGain=control?.gain??reactivity
`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, performance.now() / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('corona.current, response.current, delta, reactivity, reducedMotion','corona.current, response.current, delta, reviewGain, reducedMotion')
sceneText=sceneText.replace('      updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)', `      if(control?.offsets)motion.current[depth].offset=control.offsets[depth]
      if(!control?.freeze)updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)`)
sceneText=sceneText.replace('  return <>', `  useFrame(({camera,gl},delta)=>{
    const w=window as any, a=w.__lp04Audio, ctx=gl.getContext(), debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const features=w.__lp04Override??musicFeatures.read(), r=response.current, c=corona.current
    const held=w.__lp04Held, control=w.__lp04Control, u=sky.current!.uniforms
    if(held){for(let i=0;i<6;i++)groups.current[i]!.position.x=held.positions[i];for(const [k,v]of Object.entries(held.skyUniforms))u[k].value=v}
    if(control?.time!==undefined)u.coronaTime.value=control.time
    if(control?.resetTime){c.time=0;u.coronaTime.value=0;delete control.resetTime}
    u.coronaMaxOpacity.value=control?.off?0:CORONA_SETTINGS.maximumOpacity
    const delivered=groups.current.map((g,i)=>{
      const m=(g!.children[0] as any).material
      if(held){m.uniforms.sustained.value=held.response.ridges[i].sustained;m.uniforms.accent.value=held.response.ridges[i].accent}
      return {sustained:m.uniforms.sustained.value,accent:m.uniforms.accent.value}
    })
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,delivered,
      features:JSON.parse(JSON.stringify(features)),response:{fresh:r.fresh,session:r.session,sequence:r.sequence,count:r.count,ridges:r.ridges.map(x=>({...x}))},corona:{...c},
      skyUniforms:Object.fromEntries(Object.entries(u).map(([k,v])=>[k,v.value])),
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp04Override,held:!!held}
    w.__lp04Latest=row
    if(w.__lp04Record&&!held&&(!w.__lp04Last||row.now-w.__lp04Last>=.05)){(w.__lp04Rows??=[]).push(row);w.__lp04Last=row.now}
  })
  return <>`)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__lp04Latest'));await writeFile(scene,sceneText)
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
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__lp04Audio=this;return originalPlay.apply(this,args)}`})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__lp04Latest');await pause(800)
 const snapshot=async name=>{const row=await evaluate('window.__lp04Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.snapshots.push({name,row});return row}
 await evaluate('window.__lp04Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(150)
 const waitFrames=()=>pause(65)
 const pair=async name=>{
  const state=await evaluate('window.__lp04Latest')
  await evaluate('window.__lp04Held='+JSON.stringify(state)+';window.__lp04Control={...(window.__lp04Control||{}),off:false};true');await waitFrames()
  await snapshot(name+'-on')
  await evaluate('window.__lp04Control.off=true;true');await waitFrames();await snapshot(name+'-off')
  await evaluate('delete window.__lp04Held;window.__lp04Control.off=false;true')
  ;(report.pairs??=[]).push({name,heldState:state})
  return state
 }
 await evaluate('window.__lp04Control.time=1.4;window.__lp04Control.off=true;true');await waitFrames()
 await snapshot('reference-static-sun')
 assert.deepEqual(report.errors,[])
 const referenceDifference=compare(join(repository,'docs/evidence/lavender-peaks/lp03/matched-rest.png'),join(output,'reference-static-sun.png'))
 assert.ok(referenceDifference.maxChannelDifference<=1,'Static composition must survive shader compilation')
 await evaluate('window.__lp04Control.off=false;true');await waitFrames();await pair('rest')
 const fixture:Record<string,any>={version:1,session:1001,frame:1,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,
   energy:{low:.5,mid:.5,high:.5,overall:.5,six:{subBass:.5,bass:.5,lowMids:.5,highMids:.5,presence:.5,air:.5}},
   context:{intensity:.5,brightness:.5,brightnessValid:true,activity:0},events:[]}
 await evaluate('window.__lp04Override='+JSON.stringify(fixture)+';window.__lp04OverrideFresh=true;true');await pause(3000)
 await pair('strong')
 report.checks.push('Shader compilation/console and static reference check; matched rest/strong corona on/off pairs')
 if(process.env.ECHO_LP04_SMOKE!=='1'){
  // Matched fixed-camera previews: freeze terrain, allow the intrinsic corona clock to run.
  const previewRows={}
  for(const mode of ['rest','strong']){
   const view=structuredClone(fixture);view.session+=mode==='rest'?1:2
   if(mode==='rest'){for(const k of Object.keys(view.energy.six))view.energy.six[k]=0;view.energy.low=view.energy.mid=view.energy.high=view.energy.overall=0}
   await evaluate('window.__lp04Override='+JSON.stringify(view)+';window.__lp04Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(3000)
   await evaluate('window.__lp04Control.resetTime=true;true');await waitFrames()
   const start=Date.now(),list:any[]=[];previewRows[mode]=[]
   while(Date.now()-start<8000){const before=await evaluate('window.__lp04Latest'),shot=await send('Page.captureScreenshot',{format:'jpeg',quality:90});const path=join(temporary,mode+'-'+list.length+'.jpg');await writeFile(path,Buffer.from(shot.data,'base64'));list.push({path,time:(Date.now()-start)/1000});previewRows[mode].push(before);await pause(75)}
   const concat=list.map((x,i)=>`file '${x.path}'\nduration ${i<list.length-1?Math.max(.02,list[i+1].time-x.time):.125}`).join('\n')+'\n';await writeFile(join(temporary,mode+'.txt'),concat)
   const encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,mode+'.txt'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(output,mode+'-fixed-camera.mp4')],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr)
  }
  await writeFile(join(output,'preview-trace.json'),JSON.stringify(previewRows))
  await evaluate('delete window.__lp04Override;delete window.__lp04OverrideFresh;delete window.__lp04Control;true')
  const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
  await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
  await evaluate('window.__lp04Record=true;document.querySelector(".scene-player button").click();true');await wait('window.__lp04Audio&&!window.__lp04Audio.paused&&window.__lp04Audio.currentTime>.1')
  const frames:any[]=[],states=[['bass',3.5],['low-mid',6.5],['high-mid-quiet',9.5],['high-mid-loud',12.5],['air',15.5],['high-mid-attacks',23],['mixed',46],['silence',63]];let next=0,state=0,lastLog=-1
  while(true){
   const row=await evaluate('window.__lp04Latest'),t=row.audioTime
   if(Math.floor(t/15)!==lastLog){console.log('Generated playback',t.toFixed(1));lastLog=Math.floor(t/15)}
   if(state<states.length&&t>=states[state][1]){await snapshot(states[state][0]);state++}
   if(t>=next){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:87});const end=await evaluate('window.__lp04Audio.currentTime');const path=join(temporary,`frame-${frames.length}.jpg`);await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time:(t+end)/2,before:t,after:end});next=t+.125}
   if(t>=64)break
   await pause(35)
  }
  await evaluate('window.__lp04Record=false;window.__lp04Audio.pause();true')
  const rows=await evaluate('window.__lp04Rows');assert.ok(rows.length>500&&frames.length>200)
  assert.ok(rows.every(x=>x.camera.join(',')==='0,0,20'&&x.quaternion.join(',')==='0,0,0,1'))
  const keys={coronaTime:'time',coronaEnvelope:'envelope',coronaDetail:'detail',coronaLowAccent:'lowAccent',coronaMidAccent:'midAccent',coronaHighAccent:'highAccent',coronaMotion:'motion'}
  assert.ok(rows.every(x=>Object.entries(keys).every(([uniform,key])=>x.skyUniforms[uniform]===x.corona[key])))
  assert.ok(rows.every(x=>x.delivered.every((u,i)=>u.sustained===x.response.ridges[i].sustained&&u.accent===x.response.ridges[i].accent)))
  const peak=(start,end,key)=>Math.max(...rows.filter(x=>x.audioTime>=start&&x.audioTime<end).map(x=>x.corona[key]))
  assert.ok(peak(22,25,'midAccent')>.1);assert.equal(peak(33.3,37.8,'midAccent'),0)
  assert.equal(peak(2,5,'midAccent'),0);assert.equal(peak(5,8,'midAccent'),0)
  const late=rows.filter(x=>x.audioTime>=63);assert.ok(late.every(x=>x.corona.envelope===0&&x.corona.detail===0&&x.corona.lowAccent+x.corona.midAccent+x.corona.highAccent===0))
  assert.ok(late.at(-1).corona.time>late[0].corona.time,'Resting animation continues after musical fade')
  await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash:createHash('sha256').update(await readFile(audioPath)).digest('hex')}))
  const concat=frames.map((x,i)=>`file '${x.path}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-x.time):.125}`).join('\n')+'\n';await writeFile(join(temporary,'frames.txt'),concat)
  const encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'generated-music-demo.mp4')],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr)
  report.music={rows:rows.length,frames:frames.length,maxMidAccent:peak(22,25,'midAccent'),heldHighMidFalseAccent:peak(33.3,37.8,'midAccent'),maxLowAccent:peak(19,22,'lowAccent'),maxHighAccent:peak(25,28,'highAccent'),cost:rows[30].cost,renderer:rows[0].renderer}
  report.checks.push('Actual generated PCM → MI → unchanged ridges and new sky uniforms; low/mid/high qualified accents; low-mid/bass rejection; silence returns to intrinsic rest')
  // Controlled qualification states and matched optical ablations at one fixed clock/offset.
  await evaluate('window.__lp04Control={freeze:true,offsets:[0,0,0,0,0,0],time:1.4};true')
  for(const [label,band]of [['bass','bass'],['low-mid','lowMids'],['high-mid','highMids'],['air','air']] as const){
   const view=structuredClone(fixture);view.session+=100+report.snapshots.length
   for(const k of Object.keys(view.energy.six))view.energy.six[k]=k===band?.4:0
   view.energy.low=band==='bass'?.4:0
   await evaluate('window.__lp04Override='+JSON.stringify(view)+';window.__lp04OverrideFresh=true;true');await pause(2600);await pair('isolated-'+label)
  }
  // Actual qualified mid event above a held baseline, with recent own-band rise.
  const view=structuredClone(fixture);view.session+=500
  for(const k of Object.keys(view.energy.six))view.energy.six[k]=0
  view.energy.low=0
  await evaluate('window.__lp04Override='+JSON.stringify(view)+';true');await pause(300)
  await evaluate('window.__lp04Override.energy.six.highMids=.4;true');await pause(70)
  await evaluate('(()=>{const v=window.__lp04Override,t=performance.now()/1000;v.sequence=1;v.events=[{session:v.session,sequence:1,band:"mid",strength:.4,timeSeconds:t-.03,emittedAtSeconds:t}];return true})()');await pause(40)
  const accent=await pair('qualified-mid-accent');assert.ok(accent.corona.midAccent>.2)
  // Hold one exact state, then suppress only the mid accent for pixel-level attribution.
  const noAccent=structuredClone(accent);noAccent.skyUniforms.coronaMidAccent=0
  await evaluate('window.__lp04Held='+JSON.stringify(noAccent)+';true');await waitFrames();await snapshot('qualified-mid-baseline')
  await evaluate('delete window.__lp04Held;true')
  await evaluate('window.__lp04Control={gain:0};true');await pause(200)
  const zero=await snapshot('zero-reactivity');assert.equal(zero.corona.envelope+zero.corona.detail+zero.corona.lowAccent+zero.corona.midAccent+zero.corona.highAccent,0)
  await evaluate('delete window.__lp04Control;window.__lp04OverrideFresh=false;window.__lp04Override.updatedAtSeconds=performance.now()/1000-1;true');await pause(1000)
  const stale=await snapshot('stale');assert.equal(stale.response.fresh,false);assert.equal(stale.corona.midAccent,0)
  await evaluate('window.__lp04OverrideFresh=true;true');await pause(500)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(500)
  const reduced=await snapshot('reduced-motion');await pause(500);const later=await evaluate('window.__lp04Latest');assert.equal(later.corona.time,reduced.corona.time);assert.deepEqual(later.positions,reduced.positions);assert.equal(later.corona.motion,0);assert.equal(later.corona.midAccent,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate('window.__lp04Control={freeze:true,offsets:[0,0,0,0,0,0],time:1.4};true')
  await evaluate('document.getElementById("graphics-quality").value="low";document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));true');await pause(500);await pair('low-quality')
  await evaluate('document.getElementById("graphics-quality").value="standard";document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));delete window.__lp04Override;delete window.__lp04OverrideFresh;delete window.__lp04Control;delete window.__lp04Latest;document.getElementById("scene-select").value="nocturne";document.getElementById("scene-select").dispatchEvent(new Event("change",{bubbles:true}));true');await pause(300)
  await evaluate('document.getElementById("scene-select").value="lavender-peaks";document.getElementById("scene-select").dispatchEvent(new Event("change",{bubbles:true}));true');await wait('!!window.__lp04Latest')
  const reentry=await snapshot('scene-reentry');assert.equal(reentry.corona.lowAccent+reentry.corona.midAccent+reentry.corona.highAccent,0)
  report.checks.push('Matched spectral on/off cases; own-high-mid accent ablation; gain0, stale, reduced freeze, Low quality and re-entry')
 }
 report.browser=await evaluate('navigator.userAgent');assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status=process.env.ECHO_LP04_SMOKE==='1'?'LP04 visual smoke captured; not full verification':'LP04 generated integration captured; optical assessment and owner visual approval required'
 console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

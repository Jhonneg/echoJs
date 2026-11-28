// Isolated production builds; generated audio only. Runtime probes never ship.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
if(process.env.ECHO_BL06_BASELINE==='1'){await import('./verify-bloom-bl06-baseline.ts');process.exit(0)}
const repository=process.cwd(),baseline=false,smoke=process.env.ECHO_BL06_SMOKE==='1'
const evidence='docs/evidence/bloom/bl06'
const output=join(repository,evidence,baseline?'baseline':smoke?'smoke':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-bloom-bl02-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const scene=join(root,'src/scenes/bloom/BloomScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('    const now = performance.now()', `
    const w=window as any
    if(w.__bl06Reset){response.current=createBloomMusic();w.__bl06Reset=false}
    if(w.__bl06Fresh&&w.__bl06Override){w.__bl06Override.updatedAtSeconds=performance.now()/1000;w.__bl06Override.frame++}
    const reviewReader={read:()=>{
      const v=w.__bl06Override??musicFeatures.read()
      w.__bl06Input={session:v.session,frame:v.frame,status:v.status,sequence:v.sequence,energy:{...v.energy,six:{...v.energy.six}},context:{...v.context},events:v.events.map((e:any)=>({...e}))}
      return v
    }}
    const now = performance.now()`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, now / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, now / 1000, w.__bl06Gain??reactivity, w.__bl06Reduced??reducedMotion')
sceneText=sceneText.replace('    const out = state.output, p = state.projection', `
    if(w.__bl06Freeze){state.time=0;state.trails[0].phase=0;state.trails[1].phase=.43}
    const out = state.output, p = state.projection`)
const anchor='  const sky = useMemo(() =>'
sceneText=sceneText.replace(anchor,`  useFrame(({gl,camera,scene},delta)=>{
    const w=window as any,ctx=gl.getContext(),debug=ctx.getExtension('WEBGL_debug_renderer_info'),r=response.current
    w.__bl02Latest={dt:delta,cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length},
      camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom},
      input:w.__bl06Input,response:{fresh:r.fresh,enabled:r.enabled,bands:r.bands.map(b=>({...b})),context:{...r.context},output:{...r.output},trails:r.trails.map(t=>({...t,pulses:t.pulses.map(p=>({...p}))})),projection:{...r.projection},count:r.count,time:r.time,ringAge:r.ringAge,ringStrength:r.ringStrength},
      hero:{position:hero.current!.position.toArray(),rotation:hero.current!.rotation.toArray()},
      delivered:{stoneAurora:stone.current!.auroraStrength.value,stoneSeam:stone.current!.seamLevel.value,seam:seam.current!.uniforms.seamLevel.value,water:Object.fromEntries(Object.entries(lake.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value])),trails:Object.fromEntries(Object.entries(trails.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value]))},
      geometry:scene.getObjectByName('bloom-trails')!.uuid,
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()}}
    if(w.__bl02Benchmark)(w.__bl02Frames??=[]).push(w.__bl02Latest)
    if(w.__bl06Record&&(!w.__bl06Last||performance.now()-w.__bl06Last>40)){(w.__bl06Rows??=[]).push({...w.__bl02Latest,mediaTime:w.__bl02Audio?.currentTime,now:performance.now()/1000});w.__bl06Last=performance.now()}
  })
`+anchor)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__bl02Latest'));await writeFile(scene,sceneText)
const music=join(root,'src/scenes/bloom/music.ts');await writeFile(music,(await readFile(music,'utf8')).replace('updateAurora(state.ambient, dt, reduced)', 'updateAurora(state.ambient, dt, reduced || !!(window as any).__bl06Freeze)').replace('const ambient = updateAurora', 'if((window as any).__bl06Freeze)state.ambient.time=58.90486225480862\n  const ambient = updateAurora'))
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report:Record<string,any>={baseline,smoke,temporary,errors:[],screenshots:[],checks:[],performance:[],source:'Isolated production build with temporary scalar/resource probes; generated local PCM only. No owner media. Headless performance is not native-device certification.'}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 const snapshot=async name=>{const row=await evaluate('window.__bl02Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name,row});return row}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__bl06Freeze=true;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__bl02Audio=this;return play.apply(this,args)}`})
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!window.__bl02Latest');await pause(400)
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]] as const){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)
   const row=await snapshot(name+'-'+quality)
   assert.deepEqual(row.camera.position,[0,0,20]);assert.deepEqual(row.camera.quaternion,[0,0,0,1])
   assert.equal(row.cost.calls,9);assert.equal(row.cost.geometries,9);assert.ok(row.geometry)
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await select('graphics-quality','standard')
 const zero=()=>({version:1,session:1,frame:1,sequence:0,updatedAtSeconds:0,status:'active',sampleRate:48000,fftSize:2048,
   energy:{low:0,mid:0,high:0,overall:0,six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},
   context:{intensity:0,brightness:0,brightnessValid:false,activity:0},events:[]})
 const input=async(view,reset=true)=>{await evaluate(`window.__bl06Override=${JSON.stringify(view)};window.__bl06Fresh=true;window.__bl06Reset=${reset};true`)}
 await snapshot('silence')
 await evaluate('window.__bl06Reduced=false;true')
 for(const [band,label] of [['bass','bass-only'],['lowMids','low-mid'],['highMids','high-mid'],['air','treble-only']] as const){
  const view=zero();view.energy.six[band]=.424;await input(view);await pause(1200);await snapshot(label)
 }
 const high=zero();high.energy.six.highMids=.0424;await input(high);await pause(1000);await snapshot('high-mid-quiet')
 high.energy.six.highMids=.1414;await input(high);await pause(1000);await snapshot('high-mid-moderate')
 high.energy.six.highMids=.424;await input(high);await pause(1000);await snapshot('high-mid-loud')
 const context=zero();context.context={intensity:1,activity:1,brightness:1,brightnessValid:false};await input(context);await pause(1800);await snapshot('context-only')
 // Warm zero history before a fresh high-mid attack; keep event/scalars only.
 await input(zero());await pause(250)
 await evaluate('window.__bl06Override.energy.six.highMids=.424;true');await pause(40)
 await evaluate(`{const v=window.__bl06Override,t=performance.now()/1000;v.sequence=1;v.events=[{session:1,sequence:1,band:'mid',strength:.424,timeSeconds:t-.04,emittedAtSeconds:t}]} ;true`)
 await pause(25);const hit=await snapshot('high-mid-attack');assert.ok(hit.response.bands[3].accent>.35);await pause(350);await snapshot('high-mid-release')
 await evaluate('window.__bl06Override.energy.six.highMids=0;window.__bl06Override.events=[];true');await pause(1800);await snapshot('silence-fade')
 // Held high mids with a low-mid event: the seam's accent must remain zero.
 await input(high);await pause(1000);await evaluate('window.__bl06Override.energy.six.lowMids=.424;true');await pause(40)
 await evaluate(`{const v=window.__bl06Override,t=performance.now()/1000;v.sequence=1;v.events=[{session:1,sequence:1,band:'mid',strength:.424,timeSeconds:t-.04,emittedAtSeconds:t}]} ;true`);await pause(30);await snapshot('low-mid-beside-held-high')
 assert.equal((await evaluate('window.__bl02Latest')).response.bands[3].accent,0)
 await evaluate('window.__bl06Fresh=false;true');await pause(450);await snapshot('stale');assert.equal((await evaluate('window.__bl02Latest')).response.fresh,false)
 await evaluate('window.__bl06Override.status="priming";window.__bl06Fresh=true;true');await pause(100);await snapshot('priming')
 await input(high);await pause(400);await evaluate('window.__bl06Gain=0;true');await pause(50);await snapshot('gain-zero');assert.equal((await evaluate('window.__bl02Latest')).delivered.seam,1)
 await evaluate('window.__bl06Gain=1;window.__bl06Reduced=true;true');await pause(300);await snapshot('reduced-high-mid');const reducedState=await evaluate('window.__bl02Latest.response.time');await pause(100);assert.equal((await evaluate('window.__bl02Latest')).response.time,reducedState)
 await evaluate('window.__bl06Reduced=undefined;window.__bl06Override=undefined;window.__bl06Fresh=false;window.__bl06Reset=true;true')

 if(!smoke){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate('window.__bl06Freeze=false;true');await pause(300)
  for(let run=0;run<3;run++){
   await evaluate('window.__bl02Frames=[];window.__bl02Benchmark=true;true');await pause(10000)
   await evaluate('window.__bl02Benchmark=false;true');report.performance.push(await evaluate('window.__bl02Frames'));console.log('BL06 timing window '+(run+1))
  }
  const gen=spawnSync(process.execPath,['scripts/generate-nocturne-matrix-review.ts'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}});assert.equal(gen.status,0,gen.stderr)
  await cp('/tmp/echo-nocturne-r4-review-sections.json',join(output,'generated-schedule.json'))
  const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
  await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-r4-review.wav']});await wait('!!document.querySelector(".scene-player button")')
  await evaluate('window.__bl06Record=true;window.__bl06Rows=[];document.querySelector(".scene-player button").click();true')
  await wait('window.__bl02Audio&&!window.__bl02Audio.paused&&window.__bl02Audio.currentTime>.1')
  for(const [time,label]of [[4,'actual-bass'],[7,'actual-low-mid'],[10,'actual-quiet-high-mid'],[13,'actual-loud-high-mid'],[16,'actual-treble'],[22.35,'actual-high-mid-attack'],[30,'actual-bass-plus-held-high'],[35.6,'actual-low-mid-beside-held-high'],[47,'actual-mixed'],[58,'actual-silence']] as const){
   await wait(`window.__bl02Audio.currentTime>=${time}`);await snapshot(label);console.log('Generated case '+label)
  }
  await evaluate('window.__bl06Record=false;true');report.generatedRows=await evaluate('window.__bl06Rows');await writeFile(join(output,'generated-trace.json'),JSON.stringify(report.generatedRows));delete report.generatedRows
  await evaluate('window.__bl02Source=window.__bl02Audio;true');const beforeTime=await evaluate('window.__bl02Audio.currentTime')
  for(let run=0;run<3;run++){await select('graphics-quality','low');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,9);await select('graphics-quality','standard');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,9)}
  for(const name of ['nocturne','lavender-peaks','crimson-horizon','bloom'])await select('scene-select',name)
  await wait('window.__bl02Latest?.cost.geometries===9');assert.ok(await evaluate('window.__bl02Audio===window.__bl02Source&&!window.__bl02Audio.paused'));assert.ok(await evaluate('window.__bl02Audio.currentTime')>beforeTime)
  await snapshot('scene-reentry');await evaluate('window.__bl02Audio.pause();true')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300);const r=await snapshot('reduced-motion');await pause(200);assert.equal((await evaluate('window.__bl02Latest')).response.time,r.response.time)
  report.checks.push('Generated WAV actual production MI path; source identity/time retained through repeated quality and landscape changes; resources stable; reduced motion freezes clock')
 }
 assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status=smoke?'BL06 matrix smoke captured':'BL06 matrix and generated-audio checks captured; assessment follows';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

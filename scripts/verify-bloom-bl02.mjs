// Isolated production builds; generated audio only. Runtime probes never ship.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),baseline=process.env.ECHO_BL02_BASELINE==='1',smoke=process.env.ECHO_BL02_SMOKE==='1'
const sculpt=process.env.ECHO_BL02_SCULPT==='1',detail=sculpt||process.env.ECHO_BL02_DETAIL==='1'
const evidence=sculpt?'docs/evidence/bloom/bl02-sculpt':detail?'docs/evidence/bloom/bl02-detail':process.env.ECHO_BL02_REFINEMENT==='1'?'docs/evidence/bloom/bl02-refinement':'docs/evidence/bloom/bl02'
const output=join(repository,evidence,baseline?'baseline':smoke?'smoke':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-bloom-bl02-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const scene=join(root,'src/scenes/bloom/BloomScene.tsx')
let sceneText=baseline?await readFile(join(repository,evidence,'baseline/BloomScene.tsx.txt'),'utf8'):await readFile(scene,'utf8')
if(baseline&&(detail||process.env.ECHO_BL02_REFINEMENT==='1'))await cp(join(repository,evidence,'baseline/mountains.ts.txt'),join(root,'src/scenes/bloom/mountains.ts'))
const anchor='  const sky = useMemo(() =>'
assert.ok(sceneText.includes(anchor))
sceneText=sceneText.replace('    const time = elapsed.current', '    if((window as any).__bl02Freeze)elapsed.current=0\n    const time = elapsed.current')
sceneText=sceneText.replace(anchor,`  useFrame(({gl,camera,scene},delta)=>{
    const w=window as any,ctx=gl.getContext(),debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const banks=['bloom-left-bank','bloom-right-bank'].map(name=>{
      const mesh=scene.getObjectByName(name) as Mesh | undefined
      return mesh?{name,geometry:mesh.geometry.uuid,triangles:mesh.geometry.index!.count/3,vertices:mesh.geometry.getAttribute('position').count}:null
    })
    w.__bl02Latest={dt:delta,cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length},
      banks,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom},
      halo:{position:halo.current!.position.toArray(),scale:halo.current!.scale.toArray()},elapsed:elapsed.current,
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()}}
    if(w.__bl02Benchmark)(w.__bl02Frames??=[]).push(w.__bl02Latest)
  })
`+anchor)
await writeFile(scene,sceneText)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report={baseline,smoke,temporary,errors:[],screenshots:[],checks:[],performance:[],source:'Isolated production build with temporary scalar/resource probes; generated local PCM only. No owner media. Headless performance is not native-device certification.'}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 const snapshot=async name=>{const row=await evaluate('window.__bl02Latest'),shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name,row});return row}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__bl02Freeze=true;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__bl02Audio=this;return play.apply(this,args)}`})
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!window.__bl02Latest');await pause(400)
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)
   const row=await snapshot(name+'-'+quality)
   assert.deepEqual(row.camera.position,[0,0,20]);assert.deepEqual(row.camera.quaternion,[0,0,0,1])
   if(!baseline){assert.equal(row.cost.calls,28);assert.equal(row.cost.geometries,28);assert.ok(row.banks.every(Boolean))}
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await select('graphics-quality','standard')
 if(!smoke){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(1000)
  for(let run=0;run<3;run++){
   await evaluate('window.__bl02Frames=[];window.__bl02Benchmark=true;true');await pause(10000)
   await evaluate('window.__bl02Benchmark=false;true');report.performance.push(await evaluate('window.__bl02Frames'))
   console.log((baseline?'Baseline':'BL02')+' timing window '+(run+1)+' captured')
  }
  if(!baseline){
   const generated=spawnSync(process.execPath,['scripts/generate-audio-fixture.mjs','--long'],{cwd:repository,encoding:'utf8'});assert.equal(generated.status,0,generated.stderr)
   const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
   await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-permitted-tones-long.wav']});await wait('!!document.querySelector(".scene-player button")')
   await evaluate('document.querySelector(".scene-player button").click();true');await wait('window.__bl02Audio&&!window.__bl02Audio.paused&&window.__bl02Audio.currentTime>.1')
   await evaluate('window.__bl02Source=window.__bl02Audio;true');const beforeTime=await evaluate('window.__bl02Audio.currentTime')
   for(let run=0;run<3;run++){
    await select('graphics-quality','low');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,28)
    await select('graphics-quality','standard');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,28)
   }
   await snapshot('generated-playback')
   const banksBefore=(await evaluate('window.__bl02Latest')).banks.map(x=>x.geometry)
   await pause(200);assert.deepEqual((await evaluate('window.__bl02Latest')).banks.map(x=>x.geometry),banksBefore)
   assert.deepEqual((await evaluate('window.__bl02Latest')).camera.quaternion,[0,0,0,1])
   for(const sceneName of ['lavender-peaks','nocturne','crimson-horizon','bloom'])await select('scene-select',sceneName)
   await wait('window.__bl02Latest?.cost.geometries===28');await snapshot('scene-reentry')
   assert.ok(await evaluate('window.__bl02Audio===window.__bl02Source&&!window.__bl02Audio.paused'))
   assert.ok(await evaluate('window.__bl02Audio.currentTime')>beforeTime)
   await evaluate('window.__bl02Audio.pause();window.__bl02Freeze=false;true')
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300)
   const reduced=await snapshot('reduced-motion');await pause(250);assert.equal((await evaluate('window.__bl02Latest')).elapsed,reduced.elapsed)
   report.checks.push('Generated source identity/time preserved through quality and scene changes; geometry count stable after repeated replacements; geometry identity stable across frames; level camera under bass; reduced-motion phase freeze')
  }
 }
 assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status=smoke?'BL02 visual smoke captured':'BL02 composition/resource/lifecycle checks captured; visual assessment follows';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

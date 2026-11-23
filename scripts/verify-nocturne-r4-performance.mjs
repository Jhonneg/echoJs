// Target-machine benchmark; generated input only, isolated production build, no screenshots during sampling.
import {spawn,spawnSync} from 'node:child_process'
import {mkdtemp,mkdir,cp,symlink,readFile,writeFile} from 'node:fs/promises'
import {tmpdir,cpus,release} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/nocturne/nt13-refinement/r4/performance')
await mkdir(output,{recursive:true})
const manifest=JSON.parse(await readFile('docs/evidence/nocturne/nt13-refinement/r3/source-manifest.json'))
async function preserved(){for(const x of manifest)assert.equal(createHash('sha256').update(await readFile(x.file)).digest('hex'),x.sha256,x.file)}
await preserved()
const temporary=await mkdtemp(join(tmpdir(),'echo-r4-performance-')),root=join(temporary,'app')
await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const driverFile=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverFile,'utf8')
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene,gl,camera} = useThree()')
const probe=`
  useLayoutEffect(()=>{
    const w=window as any,ctx=gl.getContext() as WebGL2RenderingContext,ext=ctx.getExtension('EXT_disjoint_timer_query_webgl2')
    const original=gl.render,queue:WebGLQuery[]=[],p=w.__r4Perf={measuring:false,frames:[],gpuMs:[],cpuRenderMs:[],invalidQueries:0,timerAvailable:!!ext}
    const debug=ctx.getExtension('WEBGL_debug_renderer_info')
    p.environment={gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),browser:navigator.userAgent,viewport:[innerWidth,innerHeight],visibility:document.visibilityState,exposure:gl.toneMappingExposure,toneMapping:gl.toneMapping,colorSpace:gl.outputColorSpace,shadows:gl.shadowMap.enabled}
    let depth=0
    ;(gl as any).render=(world:any,view:any)=>{
      const outer=depth++===0,start=performance.now(),query=outer&&p.measuring&&ext&&queue.length<16?ctx.createQuery():null
      if(query)ctx.beginQuery(ext.TIME_ELAPSED_EXT,query)
      try{return original.call(gl,world,view)}finally{
        depth--
        if(query){ctx.endQuery(ext.TIME_ELAPSED_EXT);queue.push(query)}
        if(outer&&p.measuring)p.cpuRenderMs.push(performance.now()-start)
      }
    }
    gl.info.autoReset=false
    w.__r4Drain=()=>{
      const disjoint=ext&&ctx.getParameter(ext.GPU_DISJOINT_EXT)
      for(let i=queue.length-1;i>=0;i--){const q=queue[i];if(disjoint||ctx.getQueryParameter(q,ctx.QUERY_RESULT_AVAILABLE)){if(disjoint)p.invalidQueries++;else p.gpuMs.push(Number(ctx.getQueryParameter(q,ctx.QUERY_RESULT))/1e6);ctx.deleteQuery(q);queue.splice(i,1)}}
    }
    return()=>{gl.render=original;gl.info.autoReset=true;for(const q of queue)ctx.deleteQuery(q);delete w.__r4Drain}
  },[gl])
  useFrame((_,dt)=>{
    const w=window as any,p=w.__r4Perf;if(!p)return
    w.__r4Drain?.()
    if(p.measuring)p.frames.push({dt,calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,dpr:gl.getPixelRatio(),camera:camera.position.toArray(),visibility:document.visibilityState})
    gl.info.reset()
  },-2)
`
driver=driver.replace('  const targets =',probe+'  const targets =');await writeFile(driverFile,driver)
const local=join(root,'src/audio/localFile.ts');await writeFile(local,(await readFile(local,'utf8')).replace('      element = current','      element = current\n      ;(window as any).__r4Audio=current'))
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const generated=spawnSync(process.execPath,[join(repository,'scripts/generate-nocturne-matrix-review.mjs')],{encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}});assert.equal(generated.status,0,generated.stderr)
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})})
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws;const report={targetApproved:'Owner selected this Linux / GTX1660 SUPER machine',os:process.platform+' '+release(),cpu:cpus()[0]?.model,method:'Isolated production build; 5 s warmup + 30 s sampling per quality; no capture/other agent GPU runs during sampling. Timer spans outer renderer render including planar-reflection recursion. Headless Brave, not a headed-owner-window approval.',runs:[],errors:[]}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")');await select('scene-select','nocturne');await wait('!!window.__r4Perf')
 const dom=await send('DOM.getDocument',{depth:-1}),input=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'});await send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:['/tmp/echo-nocturne-r4-review.wav']});await wait('!!document.querySelector(".scene-player button")')
 const stats=a=>{const sorted=[...a].sort((x,y)=>x-y);return{samples:a.length,mean:a.reduce((x,y)=>x+y,0)/a.length,p50:sorted[Math.floor(a.length*.5)],p95:sorted[Math.floor(a.length*.95)],p99:sorted[Math.floor(a.length*.99)],max:sorted.at(-1)}}
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  await evaluate('window.__r4Audio.currentTime=0;window.__r4Audio.play();document.querySelector("details.audio-chooser").open=false;true')
  await pause(5000);await evaluate('window.__r4Perf.frames=[];window.__r4Perf.gpuMs=[];window.__r4Perf.cpuRenderMs=[];window.__r4Perf.started=performance.now();window.__r4Perf.measuring=true;true')
  console.log('Sampling',quality,'30 seconds without screenshots')
  await pause(30000)
  await evaluate('window.__r4Perf.measuring=false;window.__r4Perf.ended=performance.now();true');await pause(500)
  const data=await evaluate('window.__r4Perf'),intervals=data.frames.map(f=>f.dt*1000)
  assert.ok(data.frames.length>300);assert.ok(data.frames.every(f=>f.visibility==='visible'&&f.calls===196&&f.dpr===(quality==='low'?.75:1)));assert.ok(data.environment.gpu.includes('1660'))
  const sample={quality,environment:data.environment,durationSeconds:(data.ended-data.started)/1000,frameMs:stats(intervals),fps:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),cpuRenderMs:stats(data.cpuRenderMs),gpuMs:data.gpuMs.length?stats(data.gpuMs):null,timerAvailable:data.timerAvailable,invalidQueries:data.invalidQueries,framesOver33ms:intervals.filter(x=>x>33.333).length,calls:[...new Set(data.frames.map(f=>f.calls))],geometries:[...new Set(data.frames.map(f=>f.geometries))],textures:[...new Set(data.frames.map(f=>f.textures))]}
  report.runs.push(sample);await writeFile(join(output,quality+'-raw.json'),JSON.stringify(data));console.log(JSON.stringify(sample))
 }
 assert.deepEqual(report.errors,[]);await preserved();report.status='Measured on owner-selected GPU target; headed interaction/comfort separate'
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

// NT09 isolated fixture/reflector diagnostics. Temporary copy only; no captured media.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile,readFile,cp,symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),temporary=await mkdtemp(join(tmpdir(),'echo-nt09-surfaces-'))
const root=join(temporary,'app'),out=join(repository,'docs/evidence/nocturne/nt09/surfaces')
await mkdir(root);await mkdir(out,{recursive:true})
for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,path),join(root,path),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const driverPath=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverPath,'utf8')
const override=`
    const drive=(window as any).__nt09Drive
    if(drive){
      for(const name of Object.keys(state.channels) as NocturneVisualChannel[])state.channels[name].level=0
      state.bridge.levels.fill(0)
      if(drive.channel){
        state.channels[drive.channel as NocturneVisualChannel].level=drive.level
        if(drive.channel==='bridge'){state.bridge.levels[drive.segment??0]=drive.level;state.channels.bridge.level=drive.level/state.bridge.levels.length}
      }
      // Hold global atmosphere fixed: causal comparisons change only final local fixture delivery.
      state.atmosphere.level=state.atmosphere.magenta=state.atmosphere.cyan=state.atmosphere.violet=0
      const floor=scene.getObjectByName('nocturne-wet-ground')!
      floor.visible=drive.reflection!==false
    }
`
const probe=`
    if(drive?.spill===false)for(const x of bound.lights)if(x.channel===drive.channel)x.light.intensity=0
    ;(window as any).__nt09Surface=()=>{
      const floor=scene.getObjectByName('nocturne-wet-ground') as any
      const rt=floor.getRenderTarget()
      return {drive,camera:camera.position.toArray(),atmosphere:{...state.atmosphere},
        emitters:bound.emitters.map(x=>({channel:x.channel,segment:x.segment,intensity:x.material.emissiveIntensity})),
        points:bound.lights.map(x=>({name:x.light.name,channel:x.channel,intensity:x.light.intensity})),
        floor:{visible:floor.visible,target:[rt.width,rt.height],texel:floor.material.uniforms.texel.value.toArray(),position:floor.position.toArray(),rotation:floor.rotation.toArray(),uniforms:Object.keys(floor.material.uniforms)},
        resources:{geometries:gl.info.memory.geometries,textures:gl.info.memory.textures}}
    }
`
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene,camera,gl} = useThree()')
driver=driver.replace('    applyNocturneVisualState(bound, state)',override+'    applyNocturneVisualState(bound, state)'+probe)
await writeFile(driverPath,driver)
const freePort=()=>new Promise<any>(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const args=['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort']
const server=spawn(process.execPath,args,{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const label='isolated-current',errors:any[]=[],evidence:Record<string,any>={label,root,method:'Temporary final-output overrides with atmosphere zero; production source unchanged. Generated geometry only; no captured media.',checks:[],captures:[],errors}
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(method+' timed out'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(200)}
 const capture=async(name,drive)=>{
  await evaluate('window.__nt09Drive='+JSON.stringify(drive))
  await evaluate("document.querySelector('details.audio-chooser').open=false")
  await pause(350)
  const value=await evaluate('window.__nt09Surface()')
  assert.deepEqual(value.camera,[0,1.6,5]);assert.ok(Object.values(value.atmosphere).every(x=>x===0))
  const selected=value.emitters.filter(x=>x.channel===drive.channel&&(drive.channel!=='bridge'||x.segment===(drive.segment??0)))
  for(const x of selected)assert.equal(x.intensity,drive.level*1.3)
  for(const x of value.emitters)if(!selected.includes(x))assert.equal(x.intensity,0)
  for(const x of value.points)if(x.channel!==drive.channel||drive.spill===false)assert.equal(x.intensity,0)
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
  await writeFile(join(out,name+'.png'),Buffer.from(shot.data,'base64'))
  evidence.captures.push({name,...value});console.log(name)
 }
 const dimensions=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await dimensions(1440,810)
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await select('scene-select','nocturne');await wait('!!document.querySelector(".nocturne-stage canvas")');await pause(500)
 await wait('!!window.__nt09Surface')
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  await capture(quality+'-off',{level:0})
  for(const channel of ['magentaMain','cyanPanel'])for(const level of [.25,.75])await capture(`${quality}-${channel}-${level}`,{channel,level})
  for(const channel of ['magentaMain','cyanPanel']){
   await capture(`${quality}-${channel}-no-reflection`,{channel,level:.75,reflection:false})
   await capture(`${quality}-${channel}-no-spill`,{channel,level:.75,spill:false})
  }
  for(const channel of ['violet','violetSecondary','cyanWindows','cyanDetails'])await capture(`${quality}-${channel}`,{channel,level:channel==='cyanWindows'?.18:.4})
  for(const segment of [0,5])await capture(`${quality}-bridge-${segment}`,{channel:'bridge',level:.48,segment})
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await select('graphics-quality','standard')
 await capture('reduced-cyanPanel',{channel:'cyanPanel',level:.75})
 await capture('reduced-off',{level:0})
 evidence.checks.push('Matched fixture off/quiet/bright, reflection-disabled and spill-disabled pairs with constant atmosphere at both qualities; all other channels zero')
 evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[])
 evidence.status='NT09 isolated surface delivery captured; assess pixels before deciding on changes'
 console.log('PASS',label,temporary)
}catch(e:any){evidence.failure=String(e);throw e}
finally{await writeFile(join(out,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

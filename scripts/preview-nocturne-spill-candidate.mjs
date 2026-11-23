// NT13 isolated fixture/reflector diagnostics. Temporary copy only; no captured media.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile,readFile,cp,symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),temporary=await mkdtemp(join(tmpdir(),'echo-nt13-surfaces-'))
const root=join(temporary,'app'),out=join(repository,'docs/evidence/nocturne/nt13/spill-candidate')
await mkdir(root);await mkdir(out,{recursive:true})
for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,path),join(root,path),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const driverPath=join(root,'src/scenes/nocturne/LightingDriver.tsx')
let driver=await readFile(driverPath,'utf8')
const override=`
    const drive=(window as any).__nt13Drive
    if(drive && !drive.manual){
      const presets={
        bass:{magentaMain:.1545,magentaSecondary:.0491,cyanWindows:.0001,cyanDetails:.0001,cyanPanel:0,violet:0,violetSecondary:0,bridge:0},
        dense:{magentaMain:.1595,magentaSecondary:.046,cyanWindows:.038,cyanDetails:.0565,cyanPanel:.1115,violet:.0267,violetSecondary:.0254,bridge:0},
        silence:{magentaMain:0,magentaSecondary:0,cyanWindows:0,cyanDetails:0,cyanPanel:0,violet:0,violetSecondary:0,bridge:0}
      } as const
      const preset=presets[drive.preset as keyof typeof presets]
      for(const name of Object.keys(state.channels) as NocturneVisualChannel[])state.channels[name].level=preset[name]
      state.bridge.levels.fill(0)
      const level=drive.preset==='bass'?.0532:drive.preset==='dense'?.094:0
      Object.assign(state.atmosphere,{level,magenta:level*.24,cyan:level*.85,violet:level*.16,fogNear:17,fogFar:74})
    }
`
const probe=`
    if(drive?.candidate && !drive.manual)for(const x of bound.lights){
      const gain=x.channel==='magentaMain'?1.5:x.channel==='cyanWindows'||x.channel==='cyanDetails'?2:1
      x.light.intensity=Math.min(x.full,x.light.intensity*gain)
    }
    ;(window as any).__nt13Surface=()=>{
      const floor=scene.getObjectByName('nocturne-wet-ground') as any
      const rt=floor.getRenderTarget()
      return {drive,camera:camera.position.toArray(),atmosphere:{...state.atmosphere},
        emitters:bound.emitters.map(x=>({channel:x.channel,segment:x.segment,intensity:x.material.emissiveIntensity})),
        points:bound.lights.map(x=>({name:x.light.name,channel:x.channel,intensity:x.light.intensity,full:x.full})),
        floor:{visible:floor.visible,target:[rt.width,rt.height],texel:floor.material.uniforms.texel.value.toArray(),position:floor.position.toArray(),rotation:floor.rotation.toArray(),uniforms:Object.keys(floor.material.uniforms)},
        resources:{geometries:gl.info.memory.geometries,textures:gl.info.memory.textures}}
    }
`
driver=driver.replace('const scene = useThree(state => state.scene)','const {scene,camera,gl} = useThree()')
driver=driver.replace('    applyNocturneVisualState(bound, state)',override+'    applyNocturneVisualState(bound, state)'+probe)
await writeFile(driverPath,driver)
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const args=['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort']
const server=spawn(process.execPath,args,{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const label='isolated-current',errors=[],evidence={label,root,method:'Synthetic held NT11 bass/dense mean levels and fixed atmosphere. Candidate affects only three point lights in a temporary copy; no production mapping or owner-media capture.',checks:[],captures:[],errors}
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(method+' timed out'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(200)}
 const capture=async(name,drive)=>{
  await evaluate('window.__nt13Drive='+JSON.stringify(drive))
  await evaluate("document.querySelector('details.audio-chooser').open=false")
  await pause(600)
  const value=await evaluate('window.__nt13Surface()')
  assert.deepEqual(value.camera,[0,1.6,5])
  if(drive.manual)assert.ok(value.emitters.every(x=>x.intensity===1.3)&&value.points.every(x=>x.intensity===x.full))
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
  await writeFile(join(out,name+'.png'),Buffer.from(shot.data,'base64'))
  evidence.captures.push({name,...value});console.log(name)
 }
 const dimensions=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await dimensions(1440,810)
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await select('scene-select','nocturne');await wait('!!document.querySelector(".nocturne-stage canvas")');await pause(500)
 await wait('!!window.__nt13Surface')
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  for(const preset of ['bass','dense','silence'])for(const candidate of [false,true])await capture(`${quality}-${preset}-${candidate?'candidate':'current'}`,{preset,candidate})
 }
 await select('graphics-quality','standard');await select('nocturne-lighting-mode','manual')
 await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(x=>x.textContent==='All on').click();true`)
 await capture('standard-manual-all-on',{manual:true})
 evidence.checks.push('Matched synthetic bass/dense/silence at both qualities; original Manual All on reference; no owner music or source inspection')
 evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[])
 evidence.status='Temporary spill proposal only; no production implementation; owner decision pending'
 console.log('PASS',label,temporary)
}catch(e){evidence.failure=String(e);throw e}
finally{await writeFile(join(out,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

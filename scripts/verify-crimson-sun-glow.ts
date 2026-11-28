// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-sun-glow-'))
const freePort = () => new Promise<any>(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors:any[]=[], evidence:Record<string,any>={ date:'2026-11-21', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
try {
  let pages
  for(let i=0;i<80;i++){try{pages=await(await fetch(`http://127.0.0.1:${browserPort}/json`)).json();break}catch{}await pause(100)}
  assert.ok(pages)
  ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
  let id=0;const pending=new Map()
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
  const send=(method,params={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
  const set=options=>evaluate(`window.__mi05.set(${JSON.stringify(options)})`),read=()=>evaluate('window.__mi05.read()')
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  await set({profile:'candidate',stationary:true,moving:false,energy:0,activity:0,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await wait(`window.__mi05.read().sun===0&&window.__mi05.read().weight===1`)
  const camera=(await read()).camera
  evidence.levels=[]
  for(const activity of [0,.25,.75,1]) {
    await set({activity});await wait(`Math.abs(window.__mi05.read().glowActivity-${activity})<.001`);const state=await read()
    assert.ok(Math.abs(state.glowActivity-activity)<.001);assert.deepEqual(state.camera,camera)
    assert.equal(state.sun,0);assert.equal(state.scale,1);assert.equal(state.glow,1);assert.equal(state.pulse,0)
    assert.equal(state.calls,7);assert.equal(state.geometries,7)
    evidence.levels.push({activity,rendered:state.glowActivity,sun:state.sun,sunScale:state.scale,glowScale:state.glow,camera})
    const result=await send('Page.captureScreenshot');const file='activity-'+activity+'.png';await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));evidence.screenshots.push(file)
  }
  await set({activity:0,energy:1});await pause(1400);assert.ok((await read()).glowActivity<.05)
  await set({activity:1,energy:0,gain:0});await pause(150);assert.equal((await read()).glowActivity,0)
  await set({gain:1});await pause(1000);assert.ok((await read()).glowActivity>.9)
  await set({ticking:false});await pause(2200);assert.ok((await read()).glowActivity<.02)
  await set({ticking:true,activity:0});await pause(1500)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await set({activity:1});await pause(300);const reduced=await read();assert.ok(reduced.glowActivity>0&&reduced.glowActivity<.3)
  evidence.reducedMotion=reduced.glowActivity
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  evidence.checks=['Actual GPU halo uniform follows 0/.25/.75/1 activity with unchanged sun/glow scale and camera','Energy alone does not hold Candidate glow; zero Reactivity, stale fade and reduced-motion ramps supported','Same seven geometries/draw calls; no MI or geometry change']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS activity glow verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

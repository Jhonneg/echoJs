// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-contours-'))
const freePort = () => new Promise(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[], evidence={ date:'2026-11-21', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
try {
  let pages
  for(let i=0;i<80;i++){try{pages=await(await fetch(`http://127.0.0.1:${browserPort}/json`)).json();break}catch{}await pause(100)}
  assert.ok(pages)
  ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
  let id=0;const pending=new Map()
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
  const set=options=>evaluate(`window.__mi05.set(${JSON.stringify(options)})`),read=()=>evaluate('window.__mi05.read()')
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`})
  await wait(`window.__mi05?.read()?.chunks===4`)
  await set({profile:'candidate',energy:0,moving:false,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await pause(700)
  evidence.authored=await evaluate('window.__mi05.authored()');assert.ok(evidence.authored.every(x=>x.positions&&x.normals&&!x.deforms))
  const initial=await read();evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:initial.renderer,platform:await evaluate('navigator.platform')}
  await set({energy:1});await pause(700);let state=await read();assert.equal(state.contours.light,0);assert.equal(state.contours.streak,0)
  evidence.bassOnly=state
  await set({energy:0,lowMids:.36});await pause(80);const first=await read();assert.ok(first.contours.light>0&&first.contours.light<.36)
  await pause(1400);state=await read();assert.ok(state.contours.light>.35);assert.equal(state.contours.streak,0);evidence.lowMids=state
  await set({lowMids:0,highMids:.6});await wait(`window.__mi05.read().contours.streak>0`);const head=await read();await pause(120);const later=await read()
  assert.ok(later.contours.progress>head.contours.progress);evidence.highMids={head,later}
  await pause(850);assert.equal((await read()).contours.streak,0);await pause(400);assert.equal((await read()).contours.streak,0)
  evidence.checks.push('Authored buffers and nondeforming shader restored; bass-only no contour drive; low mids rise gradually; high mids travel briefly then stop under sustain')
  await set({highMids:0});await pause(400);await set({highMids:.8});await wait(`window.__mi05.read().contours.streak>0`)
  await set({gain:0});await pause(100);state=await read();assert.equal(state.contours.light,0);assert.equal(state.contours.streak,0)
  await set({gain:1,lowMids:.4});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250)
  assert.equal((await read()).contours.streak,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await set({ticking:false});await pause(350);assert.equal((await read()).contours.streak,0)
  await set({ticking:true,highMids:0,lowMids:0});await pause(400)
  evidence.checks.push('Zero gain, reduced motion and stale input clear moving streaks; source remains unchanged')
  for(const quality of ['standard','low'])for(const [width,height,label] of [[1440,810,'desktop'],[390,844,'portrait'],[1920,810,'wide']]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality});await pause(200)
    for(const [name,light,streak,progress] of [['off',0,0,0],['low-mids',.8,0,0],['high-mids-a',0,.9,.15],['high-mids-b',0,.9,.6]]) {
      await set({fixedLight:light,fixedStreak:streak,fixedProgress:progress});await pause(120)
      const file=`${quality}-${label}-${name}.png`,shot=await send('Page.captureScreenshot');await writeFile(join(temporary,file),Buffer.from(shot.data,'base64'));evidence.screenshots.push({file,state:await read()})
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  for(const quality of ['standard','low']) {
    await set({quality,fixedLight:.8,fixedStreak:.9,fixedProgress:null,highMids:0});await pause(500)
    await evaluate('window.__mi05.trial(true)');await pause(10000)
    const frames=await evaluate('window.__mi05.trial(false)'),sorted=frames.slice().sort((a,b)=>a-b),state=await read()
    assert.equal(state.calls,7);assert.equal(state.geometries,7);assert.equal(state.workerCount,1);assert.ok(state.buffers.every(b=>b.positions===0&&b.normals===0))
    evidence.performance.push({quality,samples:frames.length,p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),state})
  }
  await set({quality:'standard',fixedLight:null,fixedStreak:null,fixedProgress:null,energy:1,moving:true,lowMids:.5,highMids:0})
  const start=(await read()).distance
  for(let i=0;i<35;i++){await pause(1000);const s=await read();assert.ok(s.chunks<=4&&s.geometries<=7&&s.workerCount===1);assert.ok(s.buffers.every(b=>b.positions===0&&b.normals===0))}
  const end=await read();assert.ok(end.distance-start>=480);evidence.journey={start,end:end.distance,boundaries:Math.floor((end.distance-start)/48)}
  evidence.authoredAfter=await evaluate('window.__mi05.authored()');assert.ok(evidence.authoredAfter.every(x=>x.positions&&x.normals&&!x.deforms))
  evidence.checks.push('Standard/Low desktop/portrait/wide isolated lighting frames; bounded resources, unchanged buffers and at least ten streamed chunk lengths')
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner lighting/artistic review and native hardware remain manual'
  console.log(`PASS contour verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

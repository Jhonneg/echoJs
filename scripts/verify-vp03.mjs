// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp03-'+(process.env.ECHO_VP03_LABEL||'after')+'-'))
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
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  evidence.label=process.env.ECHO_VP03_LABEL||'after'
  if (!process.env.ECHO_VP03_PERF_ONLY) {
  await set({profile:'candidate',stationary:true,moving:true,repeatEvents:false,energy:.2,activity:0,intensity:0,brightness:.7,lowMids:0,highMids:0,presence:0,air:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(2500)
  const capture=async name=>{const r=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(r.data,'base64'));evidence.screenshots.push(name+'.png')}
  await capture('resting');const camera=(await read()).camera,scale=(await read()).scale;evidence.levels=[]
  for(const level of [.2,.8]){
    const before=await read();await set({intensity:level,activity:level});await pause(100);const first=await read();assert.ok(first.atmosphere.density-before.atmosphere.density<.06)
    await wait(`Math.abs(window.__mi05.read().atmosphere.density-${level})<.02`);const state=await read();assert.deepEqual(state.camera,camera);assert.ok(Math.abs(state.scale-scale)<.001);assert.equal(state.pulse,0)
    assert.ok(state.calls<=7&&state.geometries<=7);evidence.levels.push({level,atmosphere:state.atmosphere,scale:state.scale,camera});await capture('context-'+level)
  }
  await set({presence:.5,air:.5});await evaluate("window.__mi05.event(.3,'high')");await pause(80);await capture('upper-details');await set({presence:0,air:0})
  await set({lowMids:.25});await pause(1000);await set({highMids:.22});await pause(300);await capture('ridge-head');await set({highMids:0,lowMids:0});await evaluate('window.__mi05.event(.3)');await pause(1600);await capture('ground-front')
  evidence.viewports=[]
  for(const quality of ['standard','low'])for(const [width,height] of [[1440,810],[810,1440],[1920,810]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality});await pause(300);await capture(`${quality}-${width}x${height}`);evidence.viewports.push({quality,width,height})}
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait('window.__mi05?.read()?.chunks===4');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});await evaluate('window.__mi05.review(false,true,true)');evidence.fixture=[]
  for(const time of [4,9,14,20]){await wait(`window.__mi05.read().reviewTime>=${time}`);const state=await read();await capture('moving-fixture-'+time);evidence.fixture.push({time,actual:state.reviewTime,camera:state.camera,distance:state.distance})}
  await evaluate('window.__mi05.stopReview()');evidence.checks=['Fixed-camera before/after controls with stable sun and slow context','Upper/ridge/ground visibility plus six quality/viewports','Same VP00 moving generated source; no new resource/pass']
  }
  evidence.performance=[]
  for(const quality of ['standard','low']){
    await set({profile:'candidate',quality,gain:1,stationary:false,moving:true,repeatEvents:true,energy:.35,activity:1,intensity:1,presence:.5,air:.5,lowMids:.3,highMids:.2});await pause(800)
    await evaluate('window.__mi05.trial(true)');await pause(5000);const frames=await evaluate('window.__mi05.trial(false)');frames.sort((a,b)=>a-b)
    const state=await read();assert.ok(state.calls<=7&&state.geometries<=7);evidence.performance.push({quality,samples:frames.length,p95:frames[Math.floor(frames.length*.95)]})
  }
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VP03 ${evidence.label} verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

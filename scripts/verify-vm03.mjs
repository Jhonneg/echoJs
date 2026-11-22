// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vm03-'))
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
  await set({profile:'candidate',stationary:true,moving:false,repeatEvents:false,energy:0,activity:0,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await wait(`window.__mi05.read().weight===1`)
  const capture=async name=>{const result=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(result.data,'base64'));evidence.screenshots.push(name+'.png')}
  await pause(1500);await capture('resting');const camera=(await read()).camera
  evidence.levels=[]
  for(const strength of [.2,.8]) {
    await evaluate('window.__mi05.reset()');await pause(100)
    await evaluate(`window.__mi05.event(${strength})`);await pause(700);if(strength===.8)await capture('wave-early');await pause(1000)
    const state=await read();assert.deepEqual(state.camera,camera);assert.ok(state.valleyWaves[1]>0)
    evidence.levels.push({strength,state});await capture('wave-'+strength)
  }
  assert.ok(evidence.levels[1].state.valleyWaves[1]>evidence.levels[0].state.valleyWaves[1]*3)
  await pause(2000);assert.ok((await read()).valleyWaves.every((v,i)=>i%4!==1||v===0))
  for(const band of ['mid','high']) {
    await evaluate(`window.__mi05.event(1,'${band}')`);await pause(200)
    assert.ok((await read()).valleyWaves.every((v,i)=>i%4!==1||v===0))
  }
  for(const options of [{gain:0},{ticking:false}]) {
    await evaluate('window.__mi05.event(1)');await pause(200);await set(options);await pause(400)
    assert.ok((await read()).valleyWaves.every((v,i)=>i%4!==1||v===0));await set({gain:1,ticking:true})
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await evaluate('window.__mi05.event(1)');await pause(200);assert.ok((await read()).valleyWaves.every((v,i)=>i%4!==1||v===0))
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  evidence.authored=await evaluate('window.__mi05.authored()');assert.ok(evidence.authored.every(v=>v.positions && v.normals && !v.deforms))
  evidence.viewports=[]
  for(const quality of ['standard','low']) for(const [width,height] of [[1440,810],[810,1440],[1920,810]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality});await pause(300)
    await evaluate('window.__mi05.event(.8)');await pause(1700);await capture(`${quality}-${width}x${height}`)
    const state=await read();assert.equal(state.calls,7);assert.equal(state.geometries,7);evidence.viewports.push({quality,width,height,calls:state.calls,geometries:state.geometries})
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});await set({quality:'standard'})
  await evaluate('window.__vm03Video=null;window.__vm03RecordingError=null;window.__mi05.review(true,true).then(v=>window.__vm03Video=v).catch(e=>window.__vm03RecordingError=String(e));true')
  evidence.audioFrames=[]
  for(let i=0;i<108;i++){await pause(200);const state=await read();evidence.audioFrames.push({time:state.reviewTime,distance:state.distance,waves:state.valleyWaves,bass:state.features.bass});if(i===34)await capture('generated-strong-wave')}
  await wait('window.__vm03Video!==null||window.__vm03RecordingError!==null');assert.equal(await evaluate('window.__vm03RecordingError'),null)
  await writeFile(join(temporary,'moving-review.webm'),Buffer.from(await evaluate('window.__vm03Video'),'base64'))
  assert.ok(evidence.audioFrames.some(f=>f.distance>1));assert.ok(evidence.audioFrames.some(f=>f.waves.some((v,i)=>i%4===1&&v>0)))
  for(const quality of ['standard','low']) {
    await set({quality,stationary:false,energy:.5,moving:true,repeatEvents:true});await pause(1000)
    await evaluate('window.__mi05.trial(true)');await pause(10000);const intervals=await evaluate('window.__mi05.trial(false)');intervals.sort((a,b)=>a-b)
    evidence.performance.push({quality,samples:intervals.length,p95:intervals[Math.floor(intervals.length*.95)]})
  }
  evidence.checks=['One low-onset wave, strict weak/strong ordering, stable stationary camera','Other-band isolation, expiration, zero gain, stale and reduced-motion suppression','Authored geometry, seven calls/geometries, six viewport/quality captures','Generated 110 Hz PCM via unchanged production analysis, moving-camera recording; silence/quiet/loud/sustain/repeated attacks']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VM03 verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

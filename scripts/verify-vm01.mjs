// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vm01-blend-'))
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
  await set({profile:'candidate',stationary:true,moving:true,repeatEvents:false,energy:0,activity:0,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(1800)
  const capture=async name=>{const r=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(r.data,'base64'));evidence.screenshots.push(name+'.png')}
  await capture('resting');evidence.levels=[]
  for(const energy of [.2,.8]) {
    await set({energy});await pause(2200);const sustain=await read();assert.ok(Math.abs(sustain.scale-(1+energy*.15))<.002);assert.equal(sustain.corona,0)
    await capture('sustain-'+energy)
    await evaluate(`window.__mi05.event(${energy})`);await pause(70);const hit=await read();assert.ok(hit.corona>0);assert.ok(hit.scale>sustain.scale);assert.ok(hit.scale<=1.2)
    assert.ok(Math.abs(hit.scale-(1+.15*hit.body+.05*hit.pulse))<1e-8)
    assert.ok(Math.abs(hit.corona-hit.pulse*(2-hit.scale))<1e-8);await capture('attack-'+energy)
    evidence.levels.push({energy,sustain,hit});await pause(2300);assert.equal((await read()).corona,0);assert.ok(Math.abs((await read()).scale-sustain.scale)<.002)
  }
  assert.ok(evidence.levels[1].hit.corona>evidence.levels[0].hit.corona*2)
  await set({energy:0});await pause(6500);assert.equal((await read()).scale,1)
  for(const band of ['mid','high']){await evaluate(`window.__mi05.event(1,'${band}')`);await pause(100);assert.equal((await read()).corona,0)}
  await set({energy:1,gain:0});await pause(6500);assert.equal((await read()).scale,1)
  await set({gain:1,energy:0});await pause(300)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate('window.__mi05.event(1)');await pause(100);assert.equal((await read()).corona,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  evidence.viewports=[]
  for(const quality of ['standard','low']) for(const [width,height] of [[1440,810],[810,1440],[1920,810]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality,energy:1});await pause(1200);await evaluate('window.__mi05.event(1)');await pause(70);await capture(`${quality}-${width}x${height}`)
    const state=await read();assert.equal(state.calls,7);assert.equal(state.geometries,7);evidence.viewports.push({quality,width,height,scale:state.scale,corona:state.corona})
  }
  evidence.checks=['15% sustained expansion plus 5% onset expansion; combined cap20%, proportionally softened corona','Sustain does not retrigger; silence, zero gain, reduced motion and upper-band isolation','Six quality/viewports; seven draw calls/geometries']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VM01 verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

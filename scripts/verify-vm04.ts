// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vm04-visible-'))
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
  await set({profile:'candidate',stationary:true,moving:false,repeatEvents:false,energy:0,activity:0,lowMids:0,highMids:0,presence:0,air:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(1500)
  const capture=async name=>{const r=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(r.data,'base64'));evidence.screenshots.push(name+'.png')}
  await capture('resting');evidence.levels=[]
  for(const band of ['presence','air']) for(const strength of [.2,.8]) {
    await set({presence:band==='presence'?strength:0,air:band==='air'?strength:0});await evaluate(`window.__mi05.event(${strength},'high')`);await pause(70)
    const state=await read();assert.ok(state[band]>.05);assert.equal(state[band==='air'?'presence':'air'],0)
    evidence.levels.push({band,strength,value:state[band]});await capture(band+'-'+strength);await pause(2200);assert.equal((await read())[band],0)
  }
  for(const band of ['presence','air']){const levels=evidence.levels.filter(l=>l.band===band);assert.ok(levels[1].value>levels[0].value*2)}
  await set({presence:0,air:0,energy:1});await evaluate("window.__mi05.event(1,'low')");await pause(100);assert.equal((await read()).presence,0);assert.equal((await read()).air,0)
  await set({energy:0,presence:1,air:1,gain:0});await evaluate("window.__mi05.event(1,'high')");await pause(100);assert.equal((await read()).air,0)
  await set({gain:1});await pause(200);assert.equal((await read()).air,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate("window.__mi05.event(1,'high')");await pause(100);assert.equal((await read()).air,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  evidence.viewports=[]
  for(const quality of ['standard','low']) for(const [width,height] of [[1440,810],[810,1440],[1920,810]] as const) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality});await pause(300);await evaluate("window.__mi05.event(.8,'high')");await pause(70);await capture(`${quality}-${width}x${height}`)
    const state=await read();assert.equal(state.calls,7);assert.equal(state.geometries,7);evidence.viewports.push({quality,width,height,presence:state.presence,air:state.air})
  }
  evidence.checks=['Separate presence/air high-onset accents, weak/strong response, sustain/no retrigger','Bass isolation, zero gain/reduced suppression without replay','Six quality/viewport captures; seven draw calls/geometries']
  for(const quality of ['standard','low']) {
    await set({quality,repeatEvents:true,energy:.5,moving:true});await pause(800);await evaluate('window.__mi05.trial(true)');await pause(10000)
    const frames=await evaluate('window.__mi05.trial(false)');frames.sort((a,b)=>a-b);evidence.performance.push({quality,samples:frames.length,p95:frames[Math.floor(frames.length*.95)]})
  }
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VM04 verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

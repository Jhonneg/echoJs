// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-crimson-constant-'))
const freePort = () => new Promise<any>(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors:any[]=[], evidence:Record<string,any>={ date:'2026-11-22', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
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
  await set({profile:'candidate',stationary:false,moving:false,repeatEvents:false,energy:0,activity:0,intensity:0,lowMids:0,highMids:0,presence:0,air:0});await pause(500)
  evidence.cases=[]
  for(const options of [{energy:0,moving:false,gain:1},{energy:1,moving:true,gain:1},{energy:1,gain:0},{ticking:false},{profile:'legacy'},{profile:'candidate',ticking:true,energy:0,moving:false}]){
    await set(options);await pause(350);const before=await read(),start=Date.now();await pause(750);const after=await read(),seconds=(Date.now()-start)/1000
    assert.equal(before.speed,24);assert.equal(after.speed,24);assert.ok(after.distance>before.distance);assert.ok(Math.abs((after.distance-before.distance)-24*seconds)<1.6)
    assert.ok(after.geometries<=7);evidence.cases.push({options,before:before.distance,after:after.distance,speed:after.speed,seconds,blocked:after.blocked})
  }
  const result=await send('Page.captureScreenshot');await writeFile(join(temporary,'walking-silence.png'),Buffer.from(result.data,'base64'));evidence.screenshots.push('walking-silence.png')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250);const stopped=await read();await pause(500);assert.equal((await read()).distance,stopped.distance);assert.equal(stopped.speed,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(150);const resumed=await read();assert.equal(resumed.speed,24);assert.ok(resumed.distance>stopped.distance)
  evidence.reduced={stopped:stopped.distance,resumed:resumed.distance};evidence.checks=['Constant24-unit speed in quiet/loud/silence/zero gain/stale data and both profiles','Distance advances without resets; reduced-motion freeze/resume and bounded geometry']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS constant Crimson travel: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

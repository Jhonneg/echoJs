// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-crimson-response-'))
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
  await set({profile:'candidate',stationary:false,moving:true,repeatEvents:false,energy:0,activity:0,lowMids:0,highMids:0,presence:0,air:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(1500)
  evidence.levels=[]
  for(const energy of [.03,.1,.25,.35]){
    await set({energy});await pause(2600);const state=await read(),speed=24,body=Math.min(1,energy/.35)
    assert.ok(state.speed<=24&&Math.abs(state.speed-speed)<.1)
    assert.ok(Math.abs(state.body-body)<.002);assert.ok(Math.abs(state.scale-(1+.15*body))<.001)
    evidence.levels.push({energy,sun:state.sun,body:state.body,scale:state.scale,speed:state.speed,distance:state.distance})
    const result=await send('Page.captureScreenshot');const file='energy-'+energy+'.png';await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));evidence.screenshots.push(file)
  }
  await set({stationary:true,moving:false,energy:.1});await pause(3000);evidence.attacks=[]
  for(const strength of [.03,.1,.3]){
    const before=await read();await evaluate(`window.__mi05.event(${strength})`);await pause(65);const state=await read()
    assert.ok(state.scale>before.scale&&state.scale<=1.2);assert.ok(Math.abs(state.scale-(1+.15*state.body+.05*state.pulse))<1e-8)
    const wave=state.valleyWaves.filter((_,i)=>i%4===1);assert.ok(wave.some(v=>v>0))
    evidence.attacks.push({strength,pulse:state.pulse,corona:state.corona,scale:state.scale,waves:state.valleyWaves})
    const result=await send('Page.captureScreenshot');const file='attack-'+strength+'.png';await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));evidence.screenshots.push(file)
    await pause(4500);assert.equal((await read()).pulse,0);assert.ok((await read()).valleyWaves.every((v,i)=>i%4!==1||v===0))
  }
  assert.ok(evidence.attacks[1].pulse>evidence.attacks[0].pulse);assert.ok(evidence.attacks[2].pulse>evidence.attacks[1].pulse)
  await set({stationary:false,energy:0});await wait('window.__mi05.read().sun===0&&window.__mi05.read().body===0');assert.equal((await read()).speed,24)
  await set({energy:1,gain:0});await pause(200);assert.equal((await read()).speed,24)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await set({gain:1,energy:.35});await evaluate('window.__mi05.event(1)');await pause(100);assert.equal((await read()).speed,0);assert.equal((await read()).pulse,0)
  evidence.checks=['Body15% sustained+5% attack bounds; modest attacks ordered with common sun/valley curve','Constant24-unit travel, including silence and zero gain; route unchanged','Finite low accents; sustain no repeated waves; silence/zero/reduced controls']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS combined Crimson response: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp00-'))
const freePort = () => new Promise(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[], evidence={ date:'2026-11-22', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
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
  const read=()=>evaluate('window.__mi05.read()')
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  evidence.fixture={id:'vp00-48k-21s-v1',sampleRate:48000,duration:21,viewport:[1440,810],quality:'standard',gain:1,profile:'candidate',videoOnly:true}
  evidence.runs=[]
  for(const moving of [true,false]) {
    if(!moving){await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait('window.__mi05?.read()?.chunks===4')}
    const mode=moving?'moving':'stationary'
    await evaluate('window.__mi05.trial(true)')
    await evaluate(`window.__vp00Video=null;window.__vp00Error=null;window.__mi05.review(true,${moving},true).then(v=>window.__vp00Video=v).catch(e=>window.__vp00Error=String(e));true`)
    const samples=[],captures=[];let next=0;const times=[1,4,9,14,17.3,20]
    const run={mode,captures,samples};evidence.runs.push(run)
    while(true){
      await pause(100);const state=await read()
      if(state.reviewTime!==null){samples.push(state);assert.ok(state.calls<=7);assert.ok(state.geometries>=6&&state.geometries<=7);assert.equal(state.workerCount,1);assert.ok(state.chunks>=3&&state.chunks<=4)
        if(next<times.length&&state.reviewTime>=times[next]){
          const shot=await send('Page.captureScreenshot');const file=mode+'-'+times[next]+'.png';await writeFile(join(temporary,file),Buffer.from(shot.data,'base64'));evidence.screenshots.push(file);captures.push({requested:times[next],actual:state.reviewTime,camera:state.camera,distance:state.distance,file});next++
        }
      }
      if(await evaluate('window.__vp00Video!==null||window.__vp00Error!==null'))break
    }
    assert.equal(await evaluate('window.__vp00Error'),null);assert.equal(captures.length,times.length)
    await writeFile(join(temporary,mode+'.webm'),Buffer.from(await evaluate('window.__vp00Video'),'base64'))
    if(moving)assert.ok(samples.some(s=>s.distance>10))
    else for(const sample of samples)assert.deepEqual(sample.camera,{x:0,y:3.5,z:24,type:'PerspectiveCamera'})
    const intervals=await evaluate('window.__mi05.trial(false)');intervals.sort((a,b)=>a-b)
    run.cadence={samples:intervals.length,p95:intervals[Math.floor(intervals.length*.95)],recordingActive:true}
  }
  evidence.checks=['Matched generated21s PCM quiet/busy/sustain/repeat/silence source in both moving and stationary views','1440x810 Standard gain1 Candidate; actual timestamps/camera/logical distance recorded for comparison','Bounded streaming window (3-4 chunks during refill), at most seven calls/geometries, one worker in both generated recordings']
  evidence.visualEvidence={accepted:'Browser screenshot sequences with actual source time and pose',video:'Generated canvas exports are diagnostic only: observed missing scene elements; inspect before accepting any future clip',cadence:'Includes recording/readback workload, not production-only performance'}
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VP00 baseline: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

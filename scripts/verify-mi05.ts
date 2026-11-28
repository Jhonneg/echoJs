// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-mi05-'))
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
  const select=async(id,value)=>evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`)
  await send('Runtime.enable');await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const A=window.Audio;window.__elements=[];window.Audio=class extends A{constructor(...a){super(...a);window.__elements.push(this)}};const C=window.AudioContext;window.__contexts=[];window.AudioContext=class extends C{constructor(...a){super(...a);window.__contexts.push(this)}};const W=window.Worker;window.__workers=new Set();window.Worker=class extends W{constructor(...a){super(...a);window.__workers.add(this)}terminate(){window.__workers.delete(this);super.terminate()}}})()`})
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/audio-lab.html`});await wait(`!!document.getElementById('crimson-open')`)
  await evaluate(`document.getElementById('play').click()`);await wait(`window.__elements.length===1&&!window.__elements[0].paused`)
  await evaluate(`window.__elements[0].loop=true;window.__source=window.__elements[0];window.__context=window.__contexts[0];document.getElementById('crimson-open').click()`)
  await wait(`document.getElementById('crimson-profile')&&window.__workers.size===1`)
  await pause(1000)
  await evaluate(`window.__canvas=document.querySelector('#crimson-viewport canvas');window.__worker=Array.from(window.__workers)[0];window.__time=window.__source.currentTime`)
  for(const profile of ['candidate','legacy','candidate']){await select('crimson-profile',profile);await pause(650)}
  assert.equal(await evaluate(`window.__canvas===document.querySelector('#crimson-viewport canvas')&&window.__worker===Array.from(window.__workers)[0]&&window.__source===window.__elements[0]&&window.__context===window.__contexts[0]&&window.__source.currentTime>window.__time&&!window.__source.paused&&window.__workers.size===1`),true)
  await evaluate(`document.getElementById('crimson-open').click()`);await wait(`window.__workers.size===0`)
  assert.equal(await evaluate(`!window.__source.paused&&window.__source===window.__elements[0]`),true)
  evidence.checks.push('Lab A/B preserves source/context/Canvas/worker and playback; preview close releases worker while audio continues')
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`})
  await wait(`window.__mi05?.read()?.chunks===4`);await pause(1500)
  const read=()=>evaluate('window.__mi05.read()')
  const set=options=>evaluate(`window.__mi05.set(${JSON.stringify(options)})`)
  evidence.environment={browser:await evaluate('navigator.userAgent'),platform:await evaluate('navigator.platform'),initial:await read()}
  const initial=await read()
  await set({profile:'candidate'});await wait(`window.__mi05.read().weight===1`);const candidate=await read()
  assert.equal(candidate.workerCount,1);assert.deepEqual(candidate.meshIds,initial.meshIds);assert.ok(candidate.distance>=initial.distance);assert.equal(candidate.chunks,4)
  assert.ok(candidate.contours.light<=1&&candidate.contours.streak<=1);assert.equal(candidate.camera.type,'PerspectiveCamera');assert.ok(candidate.weight===1)
  evidence.checks.push('One terrain stream, nondecreasing journey and identical chunk meshes across A/B; bounded shader controls; PerspectiveCamera')
  await set({gain:0});await pause(400);let state=await read();const stopped=state.distance;assert.equal(state.speed,0);assert.equal(state.scale,1);await pause(250);assert.equal((await read()).distance,stopped)
  await set({gain:1,ticking:false});await pause(350);state=await read();assert.equal(state.speed,0);assert.equal(state.scale,1)
  await set({ticking:true,moving:false});await pause(700)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300);state=await read();assert.equal(state.speed,0);assert.equal(state.scale,1);assert.ok(Math.abs(state.camera.x)<.001)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  evidence.checks.push('Zero Reactivity, stale source and reduced motion stop travel/pulses without rewind')
  // Match logical position and generated input. No movement for paired render-cost comparison.
  await evaluate('window.__mi05.reset()');await pause(1500)
  for(const quality of ['standard','low'])for(const [width,height,label] of [[1440,810,'desktop'],[390,844,'portrait'],[1920,810,'wide']] as const) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
    await set({quality,profile:'legacy'});await pause(700)
    for(const profile of ['legacy','candidate']) {
      await set({profile});await pause(700)
      const name=`${quality}-${label}-${profile}.png`, result=await send('Page.captureScreenshot')
      await writeFile(join(temporary,name),Buffer.from(result.data,'base64'));evidence.screenshots.push({name,state:await read()})
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await set({profile:'candidate',quality:'standard'});await pause(600)
  const centered=(await read()).camera
  for(const [x,y] of [[1,1],[1439,809]] as const) {await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(900);const edge=(await read()).camera;assert.ok(Math.abs(edge.x)<=1.6&&edge.y>=2.65&&edge.y<=4.35)}
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:720,y:405});await pause(800)
  assert.ok(Math.abs((await read()).camera.x-centered.x)<.02)
  evidence.checks.push('Desktop pointer extremes remain bounded and centered return preserved; responsive Standard/Low screenshots captured')
  await set({profile:'candidate', energy:1, moving:true})
  await pause(1200);await evaluate('window.__mi05.peaks(true)')
  const journeyStart=(await read()).distance
  for(let i=0;i<35;i++) {await pause(1000);const s=await read();assert.ok(s.chunks<=4&&s.geometries<=7&&s.workerCount===1)}
  const journeyEnd=await read();assert.ok(journeyEnd.distance-journeyStart>=480)
  evidence.journey={from:journeyStart,to:journeyEnd.distance,boundaries:Math.floor((journeyEnd.distance-journeyStart)/48),state:journeyEnd}
  evidence.peaks=await evaluate('window.__mi05.peaks()')
  assert.ok(evidence.peaks.peakScale<=1.300001&&evidence.peaks.peakScale>=1.29)
  assert.ok(evidence.peaks.peakGlow<=1.120001&&evidence.peaks.peakGlow>=1.115)
  evidence.checks.push('Candidate crosses at least ten chunks with bounded resources; actual sun/glow peaks reach but do not exceed 1.3/1.12')
  await set({moving:false,energy:.3});await evaluate('window.__mi05.reset()');await pause(2500)
  if(process.env.ECHO_MI05_PERF==='1') {
    for(const quality of ['standard','low'])for(let pair=0;pair<3;pair++) {
      for(const profile of pair%2?['candidate','legacy']:['legacy','candidate']) {
        await set({quality,profile});await pause(2000);await evaluate('window.__mi05.trial(true)');await pause(20000)
        const frames=await evaluate('window.__mi05.trial(false)'), sorted=frames.slice().sort((a,b)=>a-b)
        const row={quality,pair,profile,samples:frames.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),state:await read()}
        evidence.performance.push(row);await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({quality,pair,profile,p95:row.p95,samples:row.samples}))
      }
    }
  }
  if(evidence.performance.length) {
    const pairs:any[]=[]
    for(const quality of ['standard','low'])for(let pair=0;pair<3;pair++) {
      const legacy=evidence.performance.find(row=>row.quality===quality&&row.pair===pair&&row.profile==='legacy')
      const candidate=evidence.performance.find(row=>row.quality===quality&&row.pair===pair&&row.profile==='candidate')
      assert.ok(legacy&&candidate)
      pairs.push({quality,pair,legacyP95:legacy.p95,candidateP95:candidate.p95,ratio:candidate.p95/legacy.p95})
    }
    const accelerated=!/SwiftShader|llvmpipe|software/i.test(evidence.environment.initial.renderer)
    evidence.performanceAssessment={accelerated,pairs,pass:accelerated&&pairs.every(row=>row.ratio<=1.1),
      viewport:{width:1440,height:810,deviceScaleFactor:1},generatedInput:{energy:.3,overall:0,legacySix:0,onsetStrength:.3,intervalSeconds:.8},logicalPosition:0,
      note:'20 s RAF intervals, three alternating pairs per quality, 2 s warmup each. Scheduler-limited render-cost fixture, not full-song/GPU-headroom proof; numeric audio regressions also ran in another browser.'}
    if(accelerated)assert.equal(evidence.performanceAssessment.pass,true,'Candidate p95 must stay within 10% of Legacy')
  }
  // Delayed and failed generated terrain: actual Worker messages/errors, no source adapters.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const W=window.Worker;window.Worker=class extends W{postMessage(...args){setTimeout(()=>super.postMessage(...args),1200)}}})()`})
  await send('Page.reload');await wait(`!!window.__mi05?.read()`);await pause(350);state=await read();assert.equal(state.distance,0);await wait(`window.__mi05.read().chunks===4`)
  evidence.checks.push('Delayed terrain holds loaded-distance boundary then becomes ready')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.Worker=class {constructor(){setTimeout(()=>this.onerror?.(new Event('error')),100)}postMessage(){}terminate(){}}`})
  await send('Page.reload');await wait(`document.querySelector('.crimson-status')?.textContent.includes('could not load')`)
  evidence.checks.push('Failed worker exposes recoverable landscape fallback')
  assert.deepEqual(errors,[])
  evidence.status='automated checks passed; owner artistic review and performance assessment separate'
  console.log(`PASS MI05 generated verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-candidate-'))
const freePort = () => new Promise(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[], evidence={ date:'2026-11-21', generatedOnly:true, checks:[], screenshots:[], errors }
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
  const select=async(id,value)=>evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`)
  await send('Runtime.enable');await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
    window.__values={};window.__peaks={};window.__elements=[];window.__contexts=[];window.__frequencyReads=0;window.__timeReads=0;
    const A=window.Audio;window.Audio=class extends A{constructor(...a){super(...a);window.__elements.push(this)}};
    const C=window.AudioContext;window.AudioContext=class extends C{constructor(...a){super(...a);window.__contexts.push(this)}};
    for(const method of ['getFloatFrequencyData','getFloatTimeDomainData']){const native=AnalyserNode.prototype[method];AnalyserNode.prototype[method]=function(...a){if(method==='getFloatFrequencyData')window.__frequencyReads++;else window.__timeReads++;return native.apply(this,a)}}
    for(const Type of [WebGLRenderingContext,WebGL2RenderingContext]) {
      const locations=new WeakMap(),get=Type.prototype.getUniformLocation,set=Type.prototype.uniform1f;
      Type.prototype.getUniformLocation=function(program,name){const location=get.call(this,program,name);if(location)locations.set(location,name);return location};
      Type.prototype.uniform1f=function(location,value){const name=locations.get(location);if(name){window.__values[name]=value;window.__peaks[name]=Math.max(window.__peaks[name]||0,value)}return set.call(this,location,value)};
    }
  })()`})
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait(`!!document.getElementById('scene-select')`)
  await select('scene-select','crimson-horizon')
  await wait(`window.__values.musicWeight===1`)
  assert.equal(await evaluate(`!!document.getElementById('crimson-profile')||!!document.getElementById('baseline')`),false)
  // Generated three-band bursts. One locally synthesized WAV, never a private file.
  await evaluate(`(()=>{
    const rate=48000,length=rate*24,buffer=new ArrayBuffer(44+length*2),v=new DataView(buffer);
    const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i))};
    text(0,'RIFF');v.setUint32(4,36+length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,length*2,true);
    for(let i=0;i<length;i++){const t=i/rate,phase=(t-.5)%1,env=t<.5||phase>.35?0:Math.min(1,phase/.01,(.35-phase)/.05);const sample=env*.15*(Math.sin(2*Math.PI*110*t)+Math.sin(2*Math.PI*469*t)+Math.sin(2*Math.PI*1500*t)+Math.sin(2*Math.PI*8000*t));v.setInt16(44+i*2,Math.round(sample*32767),true)}
    const transfer=new DataTransfer();transfer.items.add(new File([buffer],'generated-candidate.wav',{type:'audio/wav'}));const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`)
  await wait(`!!document.querySelector('.scene-player button')`);await evaluate(`document.querySelector('.scene-player button').click()`)
  await wait(`window.__elements.length===1&&!window.__elements[0].paused`)
  await evaluate(`window.__elements[0].loop=true;window.__player=window.__elements[0];window.__context=window.__contexts[0]`)
  await wait(`window.__peaks.pulse>0&&window.__peaks.contourLight>0&&window.__peaks.contourStreak>0`)
  evidence.active=await evaluate(`({values:window.__values,peaks:window.__peaks,frequencyReads:window.__frequencyReads,timeReads:window.__timeReads,contexts:window.__contexts.length,elements:window.__elements.length})`)
  assert.equal(evidence.active.timeReads,0);assert.equal(evidence.active.contexts,1);assert.ok(evidence.active.frequencyReads>0)
  assert.equal(evidence.active.values.musicWeight,1);assert.ok(evidence.active.peaks.pulse<=1)
  evidence.checks.push('Built public Crimson defaults to Candidate with real generated-file analyser energy/onset/uniform response; one AudioContext and no time-domain reads')
  for(const [width,height,name] of [[1440,810,'desktop'],[390,844,'portrait']]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(300)
    const shot=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(shot.data,'base64'));evidence.screenshots.push(name+'.png')
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true)
  }
  await evaluate(`document.querySelector('.scene-player button').click()`);await wait(`window.__player.paused&&window.__values.pulse===0`)
  evidence.checks.push('Pause clears Candidate pulse; desktop/portrait have no page overflow')
  await evaluate(`window.__player.currentTime=1.2`);await wait(`!window.__player.seeking`)
  await evaluate(`document.querySelector('.scene-player button').click()`);await wait(`!window.__player.paused`)
  let before=await evaluate(`window.__player.currentTime`)
  for(const scene of ['bloom','lavender-peaks','nocturne','crimson-horizon']) {
    await select('scene-select',scene);await pause(500)
    const state=await evaluate(`({same:window.__elements[0]===window.__player&&window.__contexts[0]===window.__context,elements:window.__elements.length,contexts:window.__contexts.length,time:window.__player.currentTime,paused:window.__player.paused})`)
    assert.equal(state.same,true);assert.equal(state.elements,1);assert.equal(state.contexts,1);assert.equal(state.paused,false);assert.ok(state.time>before);before=state.time
  }
  await wait(`window.__values.musicWeight===1`)
  evidence.checks.push('Seek/resume works; generated playback and context preserved across all four landscapes')
  await select('graphics-quality','low');await pause(300)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300)
  assert.equal(await evaluate(`window.__values.pulse`),0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate(`document.querySelector('.disconnect-button').click()`);await pause(500)
  assert.equal(await evaluate(`window.__values.pulse`),0)
  assert.equal(await evaluate(`window.__contexts[0].state`),'closed')
  evidence.checks.push('Low quality/reduced-motion and Disconnect cleanup retained')
  // Synthetic API mock only: exercises the public stream path, never a native picker.
  await evaluate(`(()=>{
    const ctx=new AudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain(),output=ctx.createMediaStreamDestination();osc.frequency.value=110;gain.gain.value=.4;osc.connect(gain);gain.connect(output);osc.start();void ctx.resume();
    window.__generatedContext=ctx;window.__generatedStream=output.stream;window.__peaks={};
    navigator.mediaDevices.getDisplayMedia=async()=>output.stream;
    document.querySelector('.primary-button').click();
  })()`)
  await wait(`window.__values.musicWeight===1&&document.querySelector('.source-status').textContent.includes('Listening to your shared tab')`)
  await pause(1500)
  evidence.mockStream=await evaluate(`({activity:window.__values.activity,weight:window.__values.musicWeight,contexts:window.__contexts.length,timeReads:window.__timeReads})`)
  assert.ok(evidence.mockStream.activity>0);assert.equal(evidence.mockStream.timeReads,0)
  await evaluate(`window.__generatedStream.getTracks()[0].dispatchEvent(new Event('ended'))`)
  await wait(`document.querySelector('.source-status').textContent.includes('sharing ended')`)
  await pause(350);assert.equal(await evaluate(`window.__values.pulse`),0)
  assert.equal(await evaluate(`window.__generatedStream.getTracks().every(track=>track.readyState==='ended')`),true)
  await evaluate(`window.__generatedContext.close()`)
  evidence.checks.push('Mocked generated tab stream drives public Candidate, native-ended callback clears/stops all tracks; no picker or native audibility claim')
  // Existing production exclusion markers still hold after promoting only validated DSP.
  for(const asset of await readdir('dist/assets'))if(asset.endsWith('.js')) {
    const source=await readFile(join('dist/assets',asset),'utf8')
    for(const marker of ['rmsDbfs','createDiagnosticObserver','echo-synthetic.wav','noise-60db-peak','excursionDelayMs','estimatedBroadRms','MI02a · Energy comparison','MI03 · Onset events','MI04 · Musical context','G1 · Feature-quality review','MI05 · Crimson pilot','Open Crimson preview','mountCrimsonPreview','__mi05'])assert.equal(source.includes(marker),false,marker)
  }
  assert.equal((await readdir('dist')).includes('audio-lab.html'),false)
  assert.deepEqual(errors,[]);evidence.status='passed generated production checks; native capture/audibility and owner hardware remain manual'
  console.log(`PASS public Candidate verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

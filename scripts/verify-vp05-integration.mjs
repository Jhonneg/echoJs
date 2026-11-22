// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp05-integration-'))
const freePort = () => new Promise(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[], evidence={ date:'2026-11-22', generatedOnly:true, checks:[], screenshots:[], errors }
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
    window.__workers=0;const W=window.Worker;window.Worker=class extends W{constructor(...args){super(...args);window.__workers++}terminate(){if(!this.__ended){this.__ended=true;window.__workers--}return super.terminate()}};
    window.__wavePeak=0;window.__intervals=[];let previous=performance.now();const cadence=now=>{if(window.__sampleCadence&&window.__intervals.length<10000)window.__intervals.push(now-previous);previous=now;requestAnimationFrame(cadence)};requestAnimationFrame(cadence);
    window.__resources=[];
    for(const Type of [WebGLRenderingContext,WebGL2RenderingContext]) {
      const tracked=new WeakMap();
      for(const [create,remove,key] of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs']]){
        const add=Type.prototype[create],drop=Type.prototype[remove];Type.prototype[create]=function(...args){let state=tracked.get(this);if(!state){state={buffers:new Set(),textures:new Set(),programs:new Set()};tracked.set(this,state);window.__resources.push(state)}const value=add.apply(this,args);state[key].add(value);return value};Type.prototype[remove]=function(value){tracked.get(this)?.[key].delete(value);return drop.call(this,value)}
      }
      const locations=new WeakMap(),get=Type.prototype.getUniformLocation,set=Type.prototype.uniform1f;
      Type.prototype.getUniformLocation=function(program,name){const location=get.call(this,program,name);if(location)locations.set(location,name);return location};
      const set4=Type.prototype.uniform4fv;Type.prototype.uniform4fv=function(location,value,...rest){if(locations.get(location)==='valleyWaves[0]'){for(let i=1;i<value.length;i+=4)window.__wavePeak=Math.max(window.__wavePeak,value[i])}return set4.call(this,location,value,...rest)};
      const set3=Type.prototype.uniform3f;Type.prototype.uniform3f=function(location,x,y,z){if(locations.get(location)==='cameraPosition')window.__crimsonCamera={x,y,z};return set3.call(this,location,x,y,z)};
      Type.prototype.uniform1f=function(location,value){const name=locations.get(location);if(name){window.__values[name]=value;window.__peaks[name]=Math.max(window.__peaks[name]||0,value)}return set.call(this,location,value)};
    }
  })()`})
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait(`!!document.getElementById('scene-select')`)
  await select('scene-select','crimson-horizon')
  const key=async(name,code,number)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code,windowsVirtualKeyCode:number,...(name==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code,windowsVirtualKeyCode:number})}
  await send('Page.bringToFront');await evaluate('document.querySelector("summary").focus()');assert.equal(await evaluate('document.activeElement.tagName'),'SUMMARY');await key('Enter','Enter',13);await wait('document.querySelector("details").open')
  await key('Tab','Tab',9);assert.equal(await evaluate('document.activeElement.classList.contains("chooser-close")'),true)
  await send('Accessibility.enable');const tree=await send('Accessibility.getFullAXTree');evidence.accessibility=tree.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value}))
  for(const name of ['Landscape','Graphics quality','Share a tab','Open audio file','Close audio controls'])assert.ok(evidence.accessibility.some(n=>n.name===name),name)
  const focusShot=await send('Page.captureScreenshot');await writeFile(join(temporary,'keyboard-chooser.png'),Buffer.from(focusShot.data,'base64'));evidence.screenshots.push('keyboard-chooser.png')
  await key('Escape','Escape',27);assert.equal(await evaluate('document.querySelector("details").open'),false);assert.equal(await evaluate('document.activeElement.tagName'), 'SUMMARY')
  evidence.checks.push('Trusted Enter/Tab/Escape opens chooser, reaches close control and restores trigger focus; named accessibility-tree controls present')

  await wait(`window.__values.musicWeight===1`)
  assert.equal(await evaluate(`!!document.getElementById('crimson-profile')||!!document.getElementById('baseline')`),false)
  // Generated three-band bursts. One locally synthesized WAV, never a private file.
  await evaluate(`(()=>{
    const rate=48000,length=rate*24,buffer=new ArrayBuffer(44+length*2),v=new DataView(buffer);
    const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i))};
    text(0,'RIFF');v.setUint32(4,36+length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,length*2,true);
    for(let i=0;i<length;i++){
      const t=i/rate,phase=t% .65;
      const burst=Math.min(1,phase/.012,Math.max(0,(.28-phase)/.05));
      let level=0;
      if(t>=2&&t<6)level=.045*burst;
      else if(t>=6&&t<10)level=.14*burst;
      else if(t>=10&&t<14)level=.14;
      else if(t>=14&&t<17)level=.11*burst;
      else if(t>=19)level=.12*burst;
      let sample=0;
      for(const frequency of t>=10&&t<14?[110]:[110,469,1500,4000,8000])sample+=level*Math.sin(2*Math.PI*frequency*t);
      v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,sample))*32767),true)
    }
    const transfer=new DataTransfer();transfer.items.add(new File([buffer],'generated-candidate.wav',{type:'audio/wav'}));const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`)
  await wait(`!!document.querySelector('.scene-player button')`);await evaluate(`document.querySelector('.scene-player button').click()`)
  await wait(`window.__elements.length===1&&!window.__elements[0].paused`)
  await evaluate(`window.__elements[0].loop=true;window.__player=window.__elements[0];window.__context=window.__contexts[0]`)
  await wait(`window.__peaks.pulse>0&&window.__peaks.glowActivity>0&&window.__peaks.contourLight>0&&window.__peaks.contourStreak>0`)
  evidence.active=await evaluate(`({values:window.__values,peaks:window.__peaks,frequencyReads:window.__frequencyReads,timeReads:window.__timeReads,contexts:window.__contexts.length,elements:window.__elements.length})`)
  assert.equal(evidence.active.timeReads,0);assert.equal(evidence.active.contexts,1);assert.ok(evidence.active.frequencyReads>0)
  assert.equal(evidence.active.values.musicWeight,1);assert.ok(evidence.active.peaks.pulse<=1)
  evidence.checks.push('Built public Crimson defaults to Candidate with real generated-file analyser energy/onset/uniform response; one AudioContext and no time-domain reads')
  evidence.soak=[]
  await evaluate('window.__intervals=[];window.__sampleCadence=true')
  const soakSeconds=Number(process.env.ECHO_VP05_SOAK_SECONDS??120);evidence.soakSeconds=soakSeconds
  for(let i=0;i<soakSeconds;i++){
    await pause(1000)
    const sample=await evaluate('({second:window.__player.currentTime,values:{...window.__values},workers:window.__workers,canvases:document.querySelectorAll("canvas").length,contexts:window.__contexts.length,timeReads:window.__timeReads,resources:window.__resources.map(s=>({buffers:s.buffers.size,textures:s.textures.size,programs:s.programs.size}))})')
    evidence.soak.push(sample);assert.equal(sample.workers,1);assert.equal(sample.canvases,1);assert.equal(sample.contexts,1);assert.equal(sample.timeReads,0)
    const first=evidence.soak[0].resources[0],current=sample.resources[0];assert.ok(current.buffers<=first.buffers+10);assert.ok(current.textures<=first.textures+2);assert.ok(current.programs<=first.programs+2)
    if((i+1)%15===0){await writeFile(join(temporary,'verification-partial.json'),JSON.stringify(evidence,null,2));console.log('Soak checkpoint '+(i+1)+'/'+soakSeconds)}
  }
  evidence.cadence=await evaluate('window.__sampleCadence=false;({intervals:window.__intervals,renderer:document.querySelector("canvas").getContext("webgl2")?.getParameter(7937)})')
  const frames=evidence.cadence.intervals.slice().sort((a,b)=>a-b);evidence.cadence.p95=frames[Math.floor(frames.length*.95)]
  evidence.finalPeaks=await evaluate('({...window.__peaks,wave:window.__wavePeak})')
  for(const key of ['corona','presenceAccent','airAccent','atmosphereDensity','atmosphereWarmth','contourLight','contourStreak','wave'])assert.ok(evidence.finalPeaks[key]>0,key)
  assert.ok(evidence.finalPeaks.corona<=1);assert.ok(evidence.finalPeaks.atmosphereDensity<=1)
  evidence.checks.push(`${soakSeconds}-second production soak; generated sections/all effect uniforms, one worker/Canvas/context and no time-domain reads`)
  await evaluate('document.querySelector("summary").focus()');await key('Enter','Enter',13);await wait('document.querySelector("details").open')
  await evaluate('document.querySelector(".fullscreen-controls button").focus()');await key('Enter','Enter',13);await wait('!!document.fullscreenElement&&document.querySelector(".fullscreen-controls button").getAttribute("aria-pressed")==="true"')
  await evaluate('document.querySelector(".fullscreen-controls button").focus()');await key('Enter','Enter',13);await wait('!document.fullscreenElement');await key('Escape','Escape',27)
  evidence.checks.push('Actual application fullscreen button activated by keyboard, aria-pressed updates; native OS Escape remains manual')
  for(const quality of ['standard','low'])for(const [width,height,name] of [[1440,810,'desktop'],[390,844,'portrait'],[1920,810,'wide']]){
    await select('graphics-quality',quality)
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(400)
    const shot=await send('Page.captureScreenshot');const file=quality+'-'+name+'.png';await writeFile(join(temporary,file),Buffer.from(shot.data,'base64'));evidence.screenshots.push(file)
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true)
  }
  await evaluate(`document.querySelector('.scene-player button').click()`);await wait(`window.__player.paused&&window.__values.pulse===0`)
  const pausedCamera=await evaluate('window.__crimsonCamera.z');await pause(500);const pausedAdvance=await evaluate(`(${pausedCamera}-window.__crimsonCamera.z+48)%48`);assert.ok(pausedAdvance>6&&pausedAdvance<20);evidence.pausedCameraAdvance=pausedAdvance
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
  const frozenZ=await evaluate('window.__crimsonCamera.z');await pause(400);assert.equal(await evaluate('window.__crimsonCamera.z'),frozenZ)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await evaluate('document.querySelector("summary").focus()');await key('Enter','Enter',13);await wait('document.querySelector("details").open');await evaluate('document.querySelector(".disconnect-button").focus()');await key('Enter','Enter',13);await pause(500)
  assert.equal(await evaluate('document.activeElement.matches("input[type=file]")'),true);evidence.checks.push('Disconnect via keyboard restores local-file input focus')
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
    for(const marker of ['rmsDbfs','createDiagnosticObserver','echo-synthetic.wav','noise-60db-peak','excursionDelayMs','estimatedBroadRms','MI02a · Energy comparison','MI03 · Onset events','MI04 · Musical context','G1 · Feature-quality review','MI05 · Crimson pilot','Open Crimson preview','mountCrimsonPreview','__mi05','STATIONARY CAMERA','GENERATED AUDIO INPUT','MediaRecorder'])assert.equal(source.includes(marker),false,marker)
  }
  assert.equal((await readdir('dist')).includes('audio-lab.html'),false)
  assert.deepEqual(errors,[]);evidence.status='passed generated production checks; native capture/audibility and owner hardware remain manual'
  console.log(`PASS VP05 integration verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

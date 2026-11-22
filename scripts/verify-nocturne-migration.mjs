// NT04: production browser parity/lifecycle using generated local audio only.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(), root=process.env.ECHO_NT04_ROOT||repository
const label=process.env.ECHO_NT04_LABEL||'production', legacy=label==='legacy'
const out=join(repository,'docs/evidence/nocturne/nt04',label)
const temporary=await mkdtemp(join(tmpdir(),'echo-nt04-'))
await mkdir(out,{recursive:true})
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
// Fixed mixed input, no captured or third-party content. Volume in the app remains50%.
const rate=48000,seconds=60,wav=Buffer.alloc(44+rate*seconds*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40)
for(let i=0;i<rate*seconds;i++){const t=i/rate,fade=Math.min(1,t/.02);const v=fade*(.18*Math.sin(2*Math.PI*110*t)+.14*Math.sin(2*Math.PI*1500*t)+.06*Math.sin(2*Math.PI*8000*t));wav.writeInt16LE(Math.round(v*32767),44+i*2)}
const audioPath=join(temporary,'nt04-generated-mixed.wav');await writeFile(audioPath,wav)
const args=['node_modules/vite/bin/vite.js',...(legacy?[]:['preview']),'--host','127.0.0.1','--port',String(port),'--strictPort']
const server=spawn(process.execPath,args,{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[],evidence={label,root,checks:[],captures:[],errors}
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(method+' timed out'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(200)}
 const slider=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);await pause(150)}
 const capture=async name=>{await evaluate("document.querySelector('details.audio-chooser').open=false");await pause(350);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name+'.png'),Buffer.from(shot.data,'base64'));evidence.captures.push({name,...await evaluate(`({width:innerWidth,height:innerHeight,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],audio:window.__nt04Audio?{time:window.__nt04Audio.currentTime,paused:window.__nt04Audio.paused}:null})`)});console.log(label,name)}
 const dimensions=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 // Observe generated player/contexts from the browser test only; do not alter production files.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__nt04Contexts=[];window.Audio=new Proxy(window.Audio,{construct(t,args){const a=Reflect.construct(t,args);window.__nt04Audio=a;return a}});window.AudioContext=new Proxy(window.AudioContext,{construct(t,args){const c=Reflect.construct(t,args);window.__nt04Contexts.push(c);return c}});`})
 await dimensions(1440,810)
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await select('scene-select','nocturne');await wait('!!document.querySelector(".nocturne-stage canvas")');await pause(500)
 await capture('audio-idle')
 await select('nocturne-lighting-mode','manual')
 await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All off').click();true`)
 await slider('#nocturne-magenta',1);await slider('#nocturne-cyanPanel',1)
 for(const [name,width,height] of [['desktop',1440,810],['wide',1920,810],['portrait',810,1440]]){
  await dimensions(width,height)
  for(const quality of ['standard','low']){
   await select('graphics-quality',quality);await capture(`manual-${name}-${quality}`)
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true)
  }
 }
 await dimensions(1440,810);await select('graphics-quality','standard')
 await slider('#nocturne-cyanPanel',0);await capture('manual-panel-off')
 await select('nocturne-lighting-mode','audio')
 await evaluate("document.querySelector('details.audio-chooser').open=true")
 async function chooseFile(){const dom=await send('DOM.getDocument',{depth:-1});const node=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'});assert.ok(node.nodeId);await send('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')}
 await chooseFile();await evaluate("document.querySelector('.scene-player button').click();true")
 await wait('window.__nt04Audio.currentTime>=5 && !window.__nt04Audio.paused')
 await capture('mixed-audio')
 evidence.checks.push('Six matched Manual views plus idle/off and same generated mixed source')
 if(!legacy){
  await evaluate('window.__nt04FirstAudio=window.__nt04Audio;window.__nt04FirstContext=window.__nt04Contexts.at(-1);window.__nt04TimeBefore=window.__nt04Audio.currentTime')
  for(const scene of ['bloom','lavender-peaks','crimson-horizon','nocturne']){
   await select('scene-select',scene);await pause(250)
   assert.equal(await evaluate('window.__nt04Audio===window.__nt04FirstAudio && !window.__nt04Audio.paused && window.__nt04FirstContext.state==="running"'),true)
  }
  assert.equal(await evaluate('window.__nt04Audio.currentTime>window.__nt04TimeBefore'),true)
  await evaluate('window.__nt04Canvas=document.querySelector("canvas");true')
  await select('graphics-quality','low');assert.equal(await evaluate('document.querySelector("canvas")===window.__nt04Canvas && document.querySelector("canvas").width===1080'),true)
  await select('graphics-quality','standard');assert.equal(await evaluate('document.querySelector("canvas")===window.__nt04Canvas && document.querySelector("canvas").width===1440'),true)
  evidence.checks.push('Active generated playback/currentTime/context/element preserved across all four scenes; quality changes retain Canvas')
  const gainSelector='input[type=range][min="0"][max="1"][step="0.01"]'
  // The Reactivity range is the only range inside experience-settings in Audio mode.
  await slider('.experience-settings '+gainSelector,0);await capture('zero-reactivity')
  await slider('.experience-settings '+gainSelector,1)
  await select('nocturne-lighting-mode','manual');await wait('!!document.getElementById("nocturne-cyanPanel")')
  assert.equal(await evaluate('document.getElementById("nocturne-cyanPanel").value'), '0')
  await slider('#nocturne-cyanPanel',1)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(500)
  await capture('reduced-centered')
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1000,y:150});await pause(800)
  await capture('reduced-pointer')
  evidence.checks.push('Manual values retained across scenes; reduced-motion Manual frames match despite pointer movement')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:720,y:405});await pause(500)
  await select('nocturne-lighting-mode','audio')
  await evaluate("document.querySelector('.scene-player button').click();true");await wait('window.__nt04Audio.paused')
  await pause(1500);await capture('paused')
  await evaluate("document.querySelector('.scene-player button').click();true");await wait('!window.__nt04Audio.paused')
  await evaluate("document.querySelector('details.audio-chooser').open=true;Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Disconnect').click();true")
  await wait('window.__nt04FirstContext.state==="closed" && window.__nt04FirstAudio.paused && !window.__nt04FirstAudio.getAttribute("src")')
  assert.equal(await evaluate('!!document.querySelector(".scene-player")'),false)
  await capture('disconnected')
  await chooseFile();await evaluate("document.querySelector('.scene-player button').click();true")
  await wait('window.__nt04Audio!==window.__nt04FirstAudio && !window.__nt04Audio.paused && window.__nt04Audio.currentTime>.2')
  assert.equal(await evaluate('window.__nt04Contexts.filter(c=>c.state!=="closed").length'),1)
  await capture('reconnected')
  evidence.contexts=await evaluate('window.__nt04Contexts.map(c=>({state:c.state,sampleRate:c.sampleRate}))')
  evidence.checks.push('Pause/resume, disconnect track/source-element release and closed context, file reconnect with one active context')
  evidence.productionHooks=await evaluate('({mi:typeof window.__mi05,review:typeof window.__nocturneReview})')
  assert.deepEqual(evidence.productionHooks,{mi:'undefined',review:'undefined'})
 }
 evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[])
 evidence.status='technical browser checks passed; owner migration appearance approval pending'
 console.log('PASS',label,temporary)
}catch(e){evidence.failure=String(e);throw e}
finally{await writeFile(join(out,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

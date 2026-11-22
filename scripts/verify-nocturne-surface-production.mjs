// NT09 built-production surface smoke. No injected source or captured media.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const root=process.cwd(),label='production',temporary=await mkdtemp(join(tmpdir(),'echo-nt09-production-'))
const out=join(root,'docs/evidence/nocturne/nt09/production')
await mkdir(out,{recursive:true})
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const args=['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort']
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
 await dimensions(1440,810)
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.getElementById("scene-select")')
 await select('scene-select','nocturne');await wait('!!document.querySelector(".nocturne-stage canvas")');await pause(500)
 await capture('audio-idle')
 await select('nocturne-lighting-mode','manual')
 await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All off').click();true`)
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  await capture(`${quality}-off`)
  await slider('#nocturne-cyanPanel',.75);await capture(`${quality}-cyan-on`)
  await slider('#nocturne-cyanPanel',0)
  await slider('#nocturne-magenta',.75);await capture(`${quality}-magenta-on`)
  await slider('#nocturne-magenta',0)
 }
 // Existing Manual atmosphere weighting remains production behavior, rather than isolated here.
 for(const [name,width,height]of [['wide',1920,810],['portrait',810,1440]]){
  await dimensions(width,height);await slider('#nocturne-cyanPanel',.75);await capture(`${name}-cyan-on`);await slider('#nocturne-cyanPanel',0)
 }
 evidence.checks.push('Built production, original Manual controls: cyan/magenta on/off at both qualities; cyan wide/portrait views; no console errors')
 evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[])
 evidence.status='NT09 built-production on/off surface smoke complete; owner environment review remains pending'
 console.log('PASS',label,temporary)
}catch(e){evidence.failure=String(e);throw e}
finally{await writeFile(join(out,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

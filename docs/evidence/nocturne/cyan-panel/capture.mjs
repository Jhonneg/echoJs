import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
const root=process.env.ECHO_CAPTURE_ROOT||process.cwd(), label=process.env.ECHO_CAPTURE_LABEL||'current'
const out=process.env.ECHO_CAPTURE_OUT||process.cwd()
const temporary=await mkdtemp(join(tmpdir(),'echo-nocturne-capture-'))
const freePort=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()])
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
try {
 let pages
 for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}
 if(!pages)throw Error('browser unavailable')
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map(),errors=[]
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await wait('!!document.querySelector("#scene-select")')
 await evaluate(`document.querySelector('details.audio-chooser').open=true;document.getElementById('scene-select').value='nocturne';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!document.querySelector(".nocturne-stage canvas")')
 await evaluate(`document.getElementById('nocturne-lighting-mode').value='manual';document.getElementById('nocturne-lighting-mode').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!document.getElementById("nocturne-magenta")')
 await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(b=>b.textContent==='All off').click();true`)
 await pause(250)
 if(process.env.ECHO_CAPTURE_SILENCE){await evaluate(`document.querySelector('details.audio-chooser').open=false`);await pause(700);const zero=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,'silence.png'),Buffer.from(zero.data,'base64'));await evaluate(`document.querySelector('details.audio-chooser').open=true`);console.log('silence.png captured with all groups off')}
 async function slider(id,value){await evaluate(`(()=>{const el=document.getElementById(${JSON.stringify(id)});const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return el.value})()`)}
 await slider('nocturne-magenta',1)
 await pause(350)
 const shots=[]
 async function capture(name){await pause(700);const state=await evaluate(`({scene:document.querySelector('.chooser-trigger')?.textContent?.trim(),sliders:Object.fromEntries(Array.from(document.querySelectorAll('.nocturne-lighting-controls input')).map(x=>[x.id,x.value])),canvas:!!document.querySelector('.nocturne-stage canvas')})`);await evaluate(`document.querySelector('details.audio-chooser').open=false`);await pause(200);const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name),Buffer.from(result.data,'base64'));shots.push({name,state});console.log(name,JSON.stringify(state))}
 await capture(`${label}-magenta-panel-off.png`)
 if(label!=='original'){
  await evaluate(`document.querySelector('details.audio-chooser').open=true`);await slider('nocturne-cyanPanel',1);await capture(`${label}-magenta-panel-on.png`)
 }
 await writeFile(join(out,`${label}-capture.json`),JSON.stringify({label,root,shots,errors,browser:await evaluate('navigator.userAgent')},null,2))
 if(errors.length)throw Error(JSON.stringify(errors))
}finally{ws?.close();browser.kill();server.kill()}

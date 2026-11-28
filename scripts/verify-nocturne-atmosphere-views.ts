// NT10 fixed-camera Manual atmosphere Manual preservation parity. No captured media.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, writeFile,cp,symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),sourceRoot=process.env.ECHO_NT10_ROOT||repository,label=process.env.ECHO_NT10_LABEL||'after'
const temporary=await mkdtemp(join(tmpdir(),'echo-nt10-views-'))
const root=label==='before'?join(temporary,'app'):repository
const out=join(repository,'docs/evidence/nocturne/nt10/manual',label)
if(label==='before'){
 await mkdir(root)
 for(const path of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(path==='src'?sourceRoot:repository,path),join(root,path),{recursive:true})
 await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
}
await mkdir(out,{recursive:true})
const freePort=()=>new Promise<any>(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))})})
const [port,debugPort]=await Promise.all([freePort(),freePort()]),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const args=['node_modules/vite/bin/vite.js',...(label==='before'?[]:['preview']),'--host','127.0.0.1','--port',String(port),'--strictPort']
const server=spawn(process.execPath,args,{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors:any[]=[],evidence:Record<string,any>={label,root,checks:[],captures:[],errors}
try{
 let pages;for(let i=0;i<100;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(method+' timed out'))},30000).unref()})
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
 await slider('#nocturne-magenta',1);await slider('#nocturne-cyanPanel',1);await slider('#nocturne-cyan',1);await slider('#nocturne-violet',1)
 for(const [name,width,height] of [['desktop',1440,810],['wide',1920,810],['portrait',810,1440]] as const){
  await dimensions(width,height)
  for(const quality of ['standard','low']){
   await select('graphics-quality',quality);await capture(`manual-${name}-${quality}`)
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true)
  }
 }
 await dimensions(1440,810);await select('graphics-quality','standard')
 await slider('#nocturne-cyanPanel',0);await capture('manual-panel-off')
 evidence.checks.push('Six matched Manual viewports/qualities and panel-off after material split')
 evidence.browser=await evaluate('navigator.userAgent');assert.deepEqual(errors,[])
 evidence.status='Manual atmosphere Manual preservation captures complete; NT10 appearance review pending'
 console.log('PASS',label,temporary)
}catch(e:any){evidence.failure=String(e);throw e}
finally{await writeFile(join(out,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

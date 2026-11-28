// Lavender sun captures: builds a throwaway copy of the app (no probes), selects Lavender Peaks
// and captures the opening view (1.5 s after selecting) and a reduced-motion still at desktop
// 1440×900 and portrait 390×844. No audio. Usage: node scripts/capture-lavender-sun.ts <scratch-dir> <before|after>
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
const scratch=process.argv[2],label=process.argv[3]||'after';if(!scratch)throw Error('usage: capture-lavender-sun.ts <scratch-dir> <before|after>')
const root=resolve('.'),build=resolve(scratch,'lavender-sun-build'),output='docs/evidence/lavender-peaks/big-sun/'+label
await mkdir(output,{recursive:true});await rm(build,{recursive:true,force:true});await mkdir(build,{recursive:true})
for(const f of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(root,f),join(build,f),{recursive:true}).catch(()=>{})
await symlink(join(root,'node_modules'),join(build,'node_modules'))
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--logLevel','error'],{cwd:build,stdio:'inherit'})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-sun-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const errors:string[]=[];let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description)})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async e=>{for(let i=0;i<150;i++){if(await ev(e))return;await pause(100)}throw Error('Timed out: '+e)}
 await send('Runtime.enable');await send('Page.enable')
 for(const [view,width,height] of [['desktop',1440,900],['portrait',390,844]] as const)for(const reduced of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})
  await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait('!!document.getElementById("scene-select")')
  await ev(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
  await pause(1500)
  const name=`${view}-${reduced?'reduced':'opening'}`,d=(await send('Page.captureScreenshot',{format:'png'})).data
  await writeFile(join(output,name+'.png'),Buffer.from(d,'base64'));console.log('shot',name)
 }
 if(errors.filter(Boolean).length)throw Error('page errors: '+errors.join('; '))
}finally{ws?.close();browser.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true}).catch(()=>{});await rm(build,{recursive:true,force:true}).catch(()=>{})}

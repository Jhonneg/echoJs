// Bloom rebuild BR2 (from the BR1 script): capture the 3D mountain ranges at desktop, wide and portrait, side by
// side with the Resonant Monolith reference (scaled to the same height and centre-cropped),
// and check runtime errors, one live WebGL context and landscape switching back to Bloom.
// The reference is read from disk for this evidence only; ECHO never loads it at runtime.
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const output=process.env.ECHO_OUT??'docs/evidence/bloom/rebuild/br2',temporary=await mkdtemp(join(tmpdir(),'echo-br2-'))
const reference=(await readFile('references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png')).toString('base64')
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={errors:[],warnings:[],screenshots:[],checks:[],source:'Production build, headless Brave. Blockout only (flat placeholders).'}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 await send('Runtime.enable');await send('Page.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__gl=[];const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){const c=o.call(this,t,...r);if(c&&/webgl/.test(t)&&!window.__gl.includes(c))window.__gl.push(c);return c};
  window.__live=()=>window.__gl.filter(c=>!c.isContextLost()).length;
  window.__sideBySide=(scene,ref)=>Promise.all([scene,ref].map(d=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d}))).then(([s,f])=>{const h=s.height,w=s.width,c=document.createElement('canvas');c.width=w*2+16;c.height=h;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,h);const scale=Math.max(h/f.height,w/f.width),fw=f.width*scale,fh=f.height*scale;g.drawImage(f,(w-fw)/2,(h-fh)/2,fw,fh);g.drawImage(s,w+16,0);g.font='16px sans-serif';g.fillStyle='#fff';g.fillText('Reference (scaled, centre-cropped)',12,24);g.fillText(${JSON.stringify(process.env.ECHO_LABEL??'BR2 mountains')},w+28,24);return c.toDataURL('image/png').split(',')[1]})`})
 const size=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(400)}
 await size(1440,900)
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait(`!!document.querySelector('.bloom-stage canvas')&&__live()===1`);await pause(800)
 const capture=async name=>{const full=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(output,name+'.png'),Buffer.from(full,'base64'))
  await ev(`document.querySelector('.experience-controls').style.visibility='hidden';document.querySelector('.bloom-brand').style.visibility='hidden';true`);await pause(100)
  const scene=(await send('Page.captureScreenshot',{format:'png'})).data
  await ev(`document.querySelector('.experience-controls').style.visibility='';document.querySelector('.bloom-brand').style.visibility='';true`)
  await writeFile(join(output,name+'-vs-reference.png'),Buffer.from(await ev(`__sideBySide(${JSON.stringify(scene)},${JSON.stringify(reference)})`),'base64'))
  report.screenshots.push(name,name+'-vs-reference');console.log('shot',name)}
 for(const [name,w,h] of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]]){await size(w,h);await capture(name)}
 await size(1440,900)
 // Frame cadence and Low quality. Headless and vsync-limited: relative only, not native performance.
 const cadence=()=>ev(`new Promise(r=>{const d=[];let last=performance.now();const end=last+10000;const f=t=>{d.push(t-last);last=t;t<end?requestAnimationFrame(f):r(d)};requestAnimationFrame(f)})`)
 const summary=all=>{const s=[...all].sort((a,b)=>a-b);return{medianMs:+s[Math.floor(s.length/2)].toFixed(1),p95Ms:+s[Math.floor(s.length*.95)].toFixed(1),maxMs:+s[s.length-1].toFixed(1)}}
 report.cadence={standard:summary([...(await cadence()),...(await cadence()),...(await cadence())])}
 await ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='low';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`);await pause(1200)
 await capture('desktop-low')
 report.cadence.low=summary([...(await cadence()),...(await cadence()),...(await cadence())])
 await ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='standard';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`);await pause(800)
 console.log('cadence',JSON.stringify(report.cadence))
 for(const scene of ['nocturne','lavender-peaks','crimson-horizon','bloom']){await ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await wait(`!!document.querySelector('main section canvas')&&!document.querySelector('.scene-status')`);await pause(500)}
 await wait(`!!document.querySelector('.bloom-stage canvas')`);await pause(500);assert.equal(await ev('__live()'),1,'live WebGL contexts');report.checks.push('Switched Nocturne → Lavender → Crimson → Bloom: Bloom redraws, one live WebGL context.')
 const unexpected=report.errors.filter(Boolean);assert.deepEqual(unexpected,[]);report.status='BR2 capture PASS';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

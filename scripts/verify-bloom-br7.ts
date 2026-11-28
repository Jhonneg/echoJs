// Bloom rebuild BR7 (from the BR6 script): adaptive framing at every screen shape, Standard and Low at desktop, wide and portrait, side by
// side with the Resonant Monolith reference (scaled to the same height and centre-cropped),
// and check runtime errors, one live WebGL context and landscape switching back to Bloom.
// The reference is read from disk for this evidence only; ECHO never loads it at runtime.
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const output=process.env.ECHO_OUT??'docs/evidence/bloom/rebuild/br7',temporary=await mkdtemp(join(tmpdir(),'echo-br7-'))
const reference=(await readFile('references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png')).toString('base64')
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={errors:[],warnings:[],screenshots:[],checks:[],source:'Production build, headless Brave. Blockout only (flat placeholders).'}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}
  if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description)
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 await send('Runtime.enable');await send('Page.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__gl=[];const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){const c=o.call(this,t,...r);if(c&&/webgl/.test(t)&&!window.__gl.includes(c))window.__gl.push(c);return c};
  window.__diff=(a,b)=>Promise.all([a,b].map(d=>new Promise<any>(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d}))).then(([x,y])=>{const w=x.width,h=Math.floor(x.height*.6),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(x,0,0);const p=g.getImageData(0,0,w,h).data;g.drawImage(y,0,0);const q=g.getImageData(0,0,w,h).data;let changed=0,n=0;for(let i=0;i<p.length;i+=16){const d=Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]);n++;if(d>6)changed++}return +(changed/n).toFixed(4)});
  window.__closeup=(scene,ref,y0=0,y1=0.7,xc=0.5,cwf=0.3)=>Promise.all([scene,ref].map(d=>new Promise<any>(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d}))).then(([s,f])=>{const h=s.height,w=s.width,cw=Math.round(h*cwf),top=Math.round(h*y0),ch=Math.round(h*(y1-y0)),k=1.6,c=document.createElement('canvas');c.width=Math.round(cw*k)*2+16;c.height=Math.round(ch*k);const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);const scale=h/f.height,fw=f.width*scale;g.drawImage(f,((fw-w)/2+w*xc-cw/2)/scale,top/scale,cw/scale,ch/scale,0,0,cw*k,ch*k);g.drawImage(s,w*xc-cw/2,top,cw,ch,cw*k+16,0,cw*k,ch*k);g.font='16px sans-serif';g.fillStyle='#fff';g.fillText('Reference',10,22);g.fillText('BR7',cw*k+26,22);return c.toDataURL('image/png').split(',')[1]});
  // Count triangles and draw calls over one frame (shows the reflection pass's cost).
  window.__countFrame=()=>new Promise<any>(r=>{const c=window.__gl.filter(g=>!g.isContextLost()).at(-1);const orig={e:c.drawElements,a:c.drawArrays};let tris=0,calls=0;c.drawElements=function(m,n,...rest){calls++;if(m===c.TRIANGLES)tris+=n/3;return orig.e.call(this,m,n,...rest)};c.drawArrays=function(m,f,n){calls++;if(m===c.TRIANGLES)tris+=n/3;return orig.a.call(this,m,f,n)};requestAnimationFrame(()=>requestAnimationFrame(()=>{tris=0;calls=0;requestAnimationFrame(()=>{c.drawElements=orig.e;c.drawArrays=orig.a;r({triangles:Math.round(tris),drawCalls:calls})})}))});
  window.__live=()=>window.__gl.filter(c=>!c.isContextLost()).length;
  window.__sideBySide=(scene,ref)=>Promise.all([scene,ref].map(d=>new Promise<any>(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d}))).then(([s,f])=>{const h=s.height,w=s.width,c=document.createElement('canvas');c.width=w*2+16;c.height=h;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,h);const scale=Math.max(h/f.height,w/f.width),fw=f.width*scale,fh=f.height*scale;g.drawImage(f,(w-fw)/2,(h-fh)/2,fw,fh);g.drawImage(s,w+16,0);g.font='16px sans-serif';g.fillStyle='#fff';g.fillText('Reference (scaled, centre-cropped)',12,24);g.fillText(${JSON.stringify(process.env.ECHO_LABEL??'BR7')},w+28,24);return c.toDataURL('image/png').split(',')[1]})`})
 const size=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(400)}
 await size(1440,900)
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await wait(`!!document.querySelector('.bloom-stage canvas')&&__live()===1`);await pause(800)
 const capture=async name=>{const full=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(output,name+'.png'),Buffer.from(full,'base64'))
  await ev(`document.querySelector('.experience-controls').style.visibility='hidden';document.querySelector('.bloom-brand').style.visibility='hidden';true`);await pause(100)
  const scene=(await send('Page.captureScreenshot',{format:'png'})).data
  await ev(`document.querySelector('.experience-controls').style.visibility='';document.querySelector('.bloom-brand').style.visibility='';true`)
  await writeFile(join(output,name+'-vs-reference.png'),Buffer.from(await ev(`__sideBySide(${JSON.stringify(scene)},${JSON.stringify(reference)})`),'base64'))
  if(name==='desktop'){
   await writeFile(join(output,'left-rivers-vs-reference.png'),Buffer.from(await ev(`__closeup(${JSON.stringify(scene)},${JSON.stringify(reference)},0.3,0.72,0.2,0.5)`),'base64'))
   await writeFile(join(output,'right-rivers-vs-reference.png'),Buffer.from(await ev(`__closeup(${JSON.stringify(scene)},${JSON.stringify(reference)},0.25,0.72,0.78,0.5)`),'base64'))
   await writeFile(join(output,'water-closeup-vs-reference.png'),Buffer.from(await ev(`__closeup(${JSON.stringify(scene)},${JSON.stringify(reference)},0.5,1)`),'base64'))
   // Mirror alignment: mean x of the brightest seam pixels above vs. below the horizon.
   report.mirror=await ev(`new Promise<any>(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(i,0,0);const w=i.width,h=i.height,x0=Math.round(w/2-h*0.06),x1=Math.round(w/2+h*0.06);const seamX=(ya,yb)=>{const xs:any[]=[];for(let y=Math.round(h*ya);y<Math.round(h*yb);y+=2){const d=g.getImageData(x0,y,x1-x0,1).data;let best=-1,bx=0;for(let x=0;x<x1-x0;x++){const v=d[x*4]+d[x*4+1]+d[x*4+2];if(v>best){best=v;bx=x}}if(best>(ya<0.6?600:330))xs.push(x0+bx)}return xs.length?{x:xs.reduce((a,b)=>a+b,0)/xs.length,rows:xs.length}:null};r({above:seamX(0.15,0.55),below:seamX(0.7,0.92)})};i.src='data:image/png;base64,${scene}'})`)
   console.log('mirror',JSON.stringify(report.mirror))
  }
  report.screenshots.push(name,name+'-vs-reference');console.log('shot',name)}
 const SHAPES=[['desktop',1440,900],['wide',1920,810],['portrait',390,844],['tablet-portrait',768,1024],['tablet',1024,768],['square',900,900],['short-laptop',1440,700]]
 for(const [name,w,h] of SHAPES){await size(w,h);await capture(name)}
 await size(1440,900)
 // Frame cadence and Low quality. Headless and vsync-limited: relative only, not native performance.
 const cadence=()=>ev(`new Promise<any>(r=>{const d:any[]=[];let last=performance.now();const end=last+10000;const f=t=>{d.push(t-last);last=t;t<end?requestAnimationFrame(f):r(d)};requestAnimationFrame(f)})`)
 const summary=all=>{const s=[...all].sort((a,b)=>a-b);return{medianMs:+s[Math.floor(s.length/2)].toFixed(1),p95Ms:+s[Math.floor(s.length*.95)].toFixed(1),maxMs:+s[s.length-1].toFixed(1)}}
 report.perFrame={standard:await ev('__countFrame()')}
 report.cadence={standard:summary([...(await cadence()),...(await cadence()),...(await cadence())])}
 await ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='low';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`);await pause(1200)
 for(const [name,w,h] of SHAPES){await size(w,h);await capture(name+'-low')}
 await size(1440,900)
 report.perFrame.low=await ev('__countFrame()')
 report.cadence.low=summary([...(await cadence()),...(await cadence()),...(await cadence())])
 await ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='standard';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`);await pause(800)
 console.log('cadence',JSON.stringify(report.cadence),'perFrame',JSON.stringify(report.perFrame))
 // Slow ambient motion: three scene-only frames 4 s apart (top 60% compared: sky and peaks).
 const sceneOnly=async()=>{await ev(`document.querySelector('.experience-controls').style.visibility='hidden';document.querySelector('.bloom-brand').style.visibility='hidden';true`);await pause(80);const d=(await send('Page.captureScreenshot',{format:'png'})).data;await ev(`document.querySelector('.experience-controls').style.visibility='';document.querySelector('.bloom-brand').style.visibility='';true`);return d}
 const frames:any[]=[];for(let i=0;i<3;i++){if(i)await pause(4000);const d=await sceneOnly();frames.push(d);await writeFile(join(output,`motion-${i}.png`),Buffer.from(d,'base64'))}
 report.motion={changedShare4s:[await ev(`__diff(${JSON.stringify(frames[0])},${JSON.stringify(frames[1])})`),await ev(`__diff(${JSON.stringify(frames[1])},${JSON.stringify(frames[2])})`)]}
 assert.ok(report.motion.changedShare4s.every(x=>x>0.002),'aurora should move: '+report.motion.changedShare4s)
 // Reduced motion: the scene holds still.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(800)
 const r0=await sceneOnly();await pause(3000);const r1=await sceneOnly();await writeFile(join(output,'reduced-motion.png'),Buffer.from(r1,'base64'))
 report.motion.reducedChangedShare3s=await ev(`__diff(${JSON.stringify(r0)},${JSON.stringify(r1)})`)
 assert.ok(report.motion.reducedChangedShare3s<0.0005,'reduced motion should hold still: '+report.motion.reducedChangedShare3s)
 await send('Emulation.setEmulatedMedia',{features:[]})
 console.log('motion',JSON.stringify(report.motion))
 for(const scene of ['nocturne','lavender-peaks','crimson-horizon','bloom']){await ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await wait(`!!document.querySelector('main section canvas')&&!document.querySelector('.scene-status')`);await pause(500)}
 await wait(`!!document.querySelector('.bloom-stage canvas')`);await pause(500);assert.equal(await ev('__live()'),1,'live WebGL contexts');report.checks.push('Switched Nocturne → Lavender → Crimson → Bloom: Bloom redraws, one live WebGL context.')
 const unexpected=report.errors.filter(Boolean);assert.deepEqual(unexpected,[]);report.status='BR7 capture PASS';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(temporary,{recursive:true,force:true}).catch(()=>{}) /* removeProfile */}

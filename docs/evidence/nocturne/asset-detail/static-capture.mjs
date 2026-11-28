// Static subset of scripts/verify-nocturne-nt22.mjs. Run from repository root.
// Usage: node docs/evidence/nocturne/asset-detail/static-capture.mjs /tmp <output-dir> <label>
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
const [scratch,outDir,label]=process.argv.slice(2)
if(!scratch||!outDir||!label)throw Error('usage: static-capture.mjs <scratch-dir> <output-dir> <label>')
await mkdir(outDir,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(resolve(scratch),'echo-nt22-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:resolve('.'),stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={label,source:'Production build; static asset review, headless Brave (ANGLE GL), 1440×900; idle and Manual only. GPU ms = median whole animation frame from EXT_disjoint_timer_query_webgl2 (relative costs, not native-window certification).',errors:[],luma:{},gpu:{}}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text)})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 await send('Runtime.enable');await send('Page.enable')
 // Time every animation frame callback on the GPU (all WebGL work happens inside them).
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__gl=[];const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){const c=o.call(this,t,...r);if(c&&/webgl2/.test(t)&&!window.__gl.includes(c))window.__gl.push(c);return c}
  window.__gpu=[];const raf=window.requestAnimationFrame.bind(window);const live=[];
  window.requestAnimationFrame=cb=>raf(t=>{const gl=window.__gl.at(-1),ext=gl&&gl.getExtension('EXT_disjoint_timer_query_webgl2');if(!ext||gl.isContextLost())return cb(t);const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);try{cb(t)}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);live.push([gl,ext,q])}
   for(let i=live.length-1;i>=0;i--){const [g,x,qq]=live[i];if(g.getQueryParameter(qq,g.QUERY_RESULT_AVAILABLE)){if(!g.getParameter(x.GPU_DISJOINT_EXT))window.__gpu.push(g.getQueryParameter(qq,g.QUERY_RESULT)/1e6);g.deleteQuery(qq);live.splice(i,1)}}})`})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 const shot=async name=>{const d=(await send('Page.captureScreenshot',{format:'png'})).data;await writeFile(join(outDir,`${label}-${name}.png`),Buffer.from(d,'base64'));console.log('shot',name);return d}
 // Mean luma (0–255) of the whole frame and of a few regions, computed in the page from the screenshot.
 const luma=async(name,data)=>{report.luma[name]=await ev(`new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);
   const hue=(a,b,w,h)=>{const d=x.getImageData(a,b,w,h).data;let c=0,g=0,n=0;for(let k=0;k<d.length;k+=4){const R=d[k],G=d[k+1],B=d[k+2];if(.2126*R+.7152*G+.0722*B<=25)continue;n++;if(G>R*1.3&&B>R*1.3)c++;else if(R>G*1.5&&R>=B)g++}const p=v=>+(100*v/(d.length/4)).toFixed(2);return {cyanPct:p(c),magentaPct:p(g),litPct:p(n)}};
   const m=(a,b,w,h)=>{const d=x.getImageData(a,b,w,h).data;let s=0;for(let k=0;k<d.length;k+=4)s+=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];return +(s/(d.length/4)).toFixed(2)};
   r({frame:m(0,0,1440,700),walls:m(0,100,350,500),floor:m(450,600,600,100),gate:m(650,400,140,150),bridge:m(480,150,480,130),sky:m(560,0,380,140),...hue(0,0,1440,700)})};i.src='data:image/png;base64,${data}'})`)}
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await pause(2500)
 await ev(`{const s=document.getElementById('scene-select');s.value='nocturne';s.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 for(let i=0;i<100&&!(await ev(`!!document.querySelector('.nocturne-stage canvas')`));i++)await pause(100)
 await pause(4000)
 await luma('idle',await shot('idle'))
 const gpu=async name=>{const s=[];for(let k=0;k<3;k++){await ev('window.__gpu.length=0,true');await pause(3000);s.push(await ev(`(()=>{const d=[...window.__gpu].sort((a,b)=>a-b);return d.length?d[Math.floor(d.length/2)]:null})()`))}
   s.sort((a,b)=>a-b);report.gpu[name]={gpuMsPerFrame:s[1]===null?null:+s[1].toFixed(3),samples:s.map(x=>x===null?null:+x.toFixed(3))};console.log(name,report.gpu[name].gpuMsPerFrame,'ms GPU')}
 await gpu('Standard idle')
 const setQuality=q=>ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='${q}';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`)
 await setQuality('low');await pause(2500);await luma('idle-low',await shot('idle-low'));await gpu('Low idle');await setQuality('standard');await pause(2500)
 // Manual preview with every group on (the app default), so all fixtures show at full level.
 const setMode=m=>ev(`{document.querySelector('details').open=true;const x=document.getElementById('nocturne-lighting-mode');x.value='${m}';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`)
 await setMode('manual');await pause(2500);await luma('manual-all-on',await shot('manual-all-on'))
 await pause(4000);await luma('manual-all-on-later',await shot('manual-all-on-later'))
 // NT19: with reduced motion the rain is hidden (compare with the build before NT19).
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(2500);await luma('manual-reduced-motion',await shot('manual-reduced-motion'))
 // NT21: with reduced motion the steam is frozen, so a frame 3 s later is identical.
 await pause(3000);await luma('manual-reduced-motion-later',await shot('manual-reduced-motion-later'))
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(1500)
 await setMode('audio');await pause(2500)
 console.log(JSON.stringify(report))
}finally{await writeFile(join(outDir,`${label}-capture.json`),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true}).catch(()=>{})}

// NT19 browser capture and measurement for Nocturne (light rain). Adds a reduced-motion capture.
// Same as verify-nocturne-nt18.mjs, which added the cyan and magenta pixel shares of the scene
// (share of lit pixels, luma > 25, whose hue is cyan or magenta) so the balance is measured.
// Serves the current production build (run `npm run build` first), switches to Nocturne and:
//  - captures idle and measures its brightness (mean luma of the whole frame and of regions),
//  - captures Manual preview with every group on, and again with reduced motion (rain hidden),
//  - plays a generated song (intro 0–14 s, build 14–30 s, drop 30–46 s, breakdown) through the
//    real file adapter and analysis and captures each section,
//  - times whole animation frames on the GPU (EXT_disjoint_timer_query_webgl2) on Standard and Low.
// Generated audio only. Usage: node scripts/verify-nocturne-nt19.mjs <scratch-dir> <output-dir> <label>
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
const [scratch,outDir,label]=process.argv.slice(2)
if(!scratch||!outDir||!label)throw Error('usage: verify-nocturne-nt19.mjs <scratch-dir> <output-dir> <label>')
await mkdir(outDir,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(resolve(scratch),'echo-nt19-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:resolve('.'),stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report={label,source:'Production build; headless Brave (ANGLE GL, this machine GPU), 1440×900; generated song through the real file adapter and analysis. GPU ms = median whole animation frame from EXT_disjoint_timer_query_webgl2 (relative costs, not native-window certification).',errors:[],luma:{},gpu:{}}
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
 // NT19: with reduced motion the rain is hidden (compare with the build before NT19).
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(2500);await luma('manual-reduced-motion',await shot('manual-reduced-motion'))
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(1500)
 await setMode('audio');await pause(2500)
 // The generated song (as in verify-bloom-br9.mjs).
 await ev(`{const rate=48000,secs=62,n=rate*secs,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);
  let seed=1;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};let hp=0,prev=0,kp=0;const TAU=2*Math.PI
  for(let i=0;i<n;i++){const t=i/rate;let v=0;const beat=t%0.5,step=t%0.125,noise=rnd();hp=0.6*(hp+noise-prev);prev=noise
   const pad=(Math.sin(TAU*220*t)+Math.sin(TAU*261.6*t)+Math.sin(TAU*329.6*t)+0.5*Math.sin(TAU*440*t))
   if(t<14){v+=pad*0.05+Math.sin(TAU*55*t)*0.08}
   else if(t<30){const k=(t-14)/16;v+=pad*(0.05+0.03*k)+Math.sin(TAU*55*t)*0.08;v+=hp*0.28*k*k;if(t>=22)v+=hp*0.25*Math.exp(-step/0.02);if(t>=22&&beat>=0.25&&beat<0.45)v+=noise*0.15*k*Math.exp(-(beat-0.25)/0.06)}
   else if(t<46){v+=pad*0.04;const kt=beat;kp+=TAU*(42+108*Math.exp(-kt/0.03))/rate;v+=Math.sin(kp)*0.7*Math.exp(-kt/0.18);
    if(beat>=0.25)v+=Math.sign(Math.sin(TAU*55*t))*0.12*Math.exp(-(beat-0.25)/0.1);v+=hp*0.2*Math.exp(-step/0.03);if(t%1>=0.5&&t%1<0.6)v+=noise*0.25*Math.exp(-(t%1-0.5)/0.05)}
   else if(t<58){v+=pad*0.035}
   d.setInt16(44+2*i,Math.max(-1,Math.min(1,v))*32000,true)}
  const dt=new DataTransfer();dt.items.add(new File([b],'generated-nt19.wav',{type:'audio/wav'}));const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 for(let i=0;i<50&&!(await ev(`!!document.querySelector('.scene-player button')`));i++)await pause(100)
 await ev(`document.querySelector('.scene-player button').click();true`);const t0=Date.now()
 for(const [s,name] of [[10,'intro'],[28,'build'],[30.6,'drop-hit'],[38,'drop'],[52,'breakdown']]){while((Date.now()-t0)/1000<s)await pause(20);await luma(name,await shot(name))}
 await gpu('Standard with music')
 report.errors=report.errors.filter(Boolean)
 console.log(JSON.stringify(report.luma));console.log('errors',JSON.stringify(report.errors))
}finally{await writeFile(join(outDir,`${label}-capture.json`),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true}).catch(()=>{})}

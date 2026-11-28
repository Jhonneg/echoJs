// BR7 performance measurement. Builds a throwaway copy of the app (in the given scratch
// directory) whose Bloom exposes its three.js scene and renderer, then times each top-level
// render on the GPU with EXT_disjoint_timer_query_webgl2 (the nested reflection pass is
// included, not double-counted). Toggles parts of Bloom off to estimate each part's cost.
// Frame-rate-capped timing (16.7 ms) cannot show this; GPU timer queries can.
// Usage: node scripts/measure-bloom-br7.ts <scratch-dir> <output-json>
// Headless ANGLE on this machine's GPU: relative costs, not a native-window certification.
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
const [scratch,outFile]=process.argv.slice(2)
if(!scratch||!outFile)throw Error('usage: measure-bloom-br7.ts <scratch-dir> <output-json>')
const root=resolve('.'),build=resolve(scratch,'perf-build')
await rm(build,{recursive:true,force:true});await mkdir(build,{recursive:true})
for(const f of ['src','public','index.html','package.json','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(join(root,f),join(build,f),{recursive:true}).catch(()=>{})
await symlink(join(root,'node_modules'),join(build,'node_modules'))
// The only change in the copy: expose Bloom's scene for toggling.
const scenePath=join(build,'src/scenes/bloom/BloomScene.tsx');let scene=await readFile(scenePath,'utf8')
const hook="  const aurora = AURORA\n"
if(!scene.includes(hook))throw Error('hook point not found')
scene=scene.replace(hook,hook+"  const debugScene = useThree(state => state.scene), debugGl = useThree(state => state.gl)\n  useEffect(() => { Object.assign(window, { __bloom: debugScene, __renderer: debugGl }) }, [debugScene, debugGl])\n")
await writeFile(scenePath,scene)
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--logLevel','error'],{cwd:build,stdio:'inherit'})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()]),profile=await mkdtemp(join(tmpdir(),'echo-br7p-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{cwd:build,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${profile}`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={source:'Throwaway build exposing Bloom scene/renderer; headless Brave (ANGLE GL, this machine GPU), 1440×900. GPU ms per frame from EXT_disjoint_timer_query_webgl2: median over ~4 s, median of 3 samples. Relative costs; not native-window certification.',results:{}}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}))})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 await send('Runtime.enable');await send('Page.enable')
 // Track WebGL contexts so each sampled frame can wait for the GPU (gl.finish).
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__gl=[];const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...r){const c=o.call(this,t,...r);if(c&&/webgl/.test(t)&&!window.__gl.includes(c))window.__gl.push(c);return c}`})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`})
 for(let i=0;i<100&&!(await ev('!!window.__bloom'));i++)await pause(100)
 await pause(1500)
 // Wrap the renderer once: time each outermost render() on the GPU.
 const installTimer=()=>ev(`(()=>{const r=window.__renderer;if(r.__timed)return true;const gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');if(!ext)return false;const orig=r.render.bind(r);let depth=0;window.__gpu=[];const pending:any[]=[];r.render=(sc,ca)=>{if(depth++>0){try{return orig(sc,ca)}finally{depth--}}const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);try{return orig(sc,ca)}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);depth--;pending.push(q)}};const poll=()=>{while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();if(!gl.getParameter(ext.GPU_DISJOINT_EXT))window.__gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q)}requestAnimationFrame(poll)};poll();r.__timed=true;return true})()`)
 const sample=()=>ev(`new Promise<any>(r=>{window.__gpu.length=0;setTimeout(()=>{const d=[...window.__gpu].sort((a,b)=>a-b);r(d.length?d[Math.floor(d.length/2)]:NaN)},4000)})`)
 const measure=async label=>{await pause(600);const s=[await sample(),await sample(),await sample()].sort((a,b)=>a-b);report.results[label]={gpuMsPerFrame:+s[1].toFixed(3),samples:s.map(x=>+x.toFixed(3))};console.log(label.padEnd(34),s[1].toFixed(3),'ms GPU')}
 const each=fn=>ev(`(()=>{const out:any[]=[];window.__bloom.traverse(o=>{${fn}});return out.length})()`)
 const setQuality=q=>ev(`{document.querySelector('details').open=true;const x=document.getElementById('graphics-quality');x.value='${q}';x.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('details').open=false};true`)
 report.timerQuery=await installTimer();console.log('GPU timer installed:',report.timerQuery);if(!report.timerQuery)throw Error('EXT_disjoint_timer_query_webgl2 unavailable')
 await measure('Standard — full')
 await each(`if(o.isReflector){o.visible=false;out.push(o)}`);await measure('Standard — no water/reflection');await each(`if(o.isReflector){o.visible=true;out.push(o)}`)
 await each(`const m=o.material;if(m&&m.defines&&'RIVER_COUNT' in m.defines){m.userData.rivers=m.defines.RIVER_COUNT;m.defines.RIVER_COUNT=0;m.needsUpdate=true;out.push(o)}`);await measure('Standard — no rivers')
 await each(`const m=o.material;if(m&&m.defines&&'RIVER_COUNT' in m.defines){m.defines.RIVER_COUNT=m.userData.rivers;m.needsUpdate=true;out.push(o)}`)
 await each(`const m=o.material;if(m&&m.defines&&'RAY_OCTAVES' in m.defines){o.visible=false;out.push(o)}`);await measure('Standard — no sky/aurora dome')
 await each(`const m=o.material;if(m&&m.defines&&'RAY_OCTAVES' in m.defines){o.visible=true;out.push(o)}`)
 await setQuality('low');await pause(1500);await measure('Low — full');await setQuality('standard');await pause(1500)
 // Bloom mount: switch from Nocturne to Bloom, time until Bloom's canvas has drawn two frames.
 const mounts:any[]=[]
 for(let i=0;i<3;i++){
  await ev(`{const x=document.getElementById('scene-select');x.value='nocturne';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await pause(1200)
  mounts.push(await ev(`new Promise<any>(r=>{const t0=performance.now();const x=document.getElementById('scene-select');x.value='bloom';x.dispatchEvent(new Event('change',{bubbles:true}));const check=()=>{const c=document.querySelector('.bloom-stage canvas');if(c&&c.width>0){requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now()-t0)))}else requestAnimationFrame(check)};check()})`))
 }
 report.bloomMountMs={samples:mounts.map(x=>Math.round(x)),median:Math.round(mounts.sort((a,b)=>a-b)[1])};console.log('Bloom mount (from Nocturne)'.padEnd(34),report.bloomMountMs.median,'ms')
}finally{await writeFile(outFile,JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(profile,{recursive:true,force:true}).catch(()=>{}) /* removeProfile */;await rm(build,{recursive:true,force:true}).catch(()=>{})}

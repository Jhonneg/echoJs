// LP03 generated-input verification; probes and overrides live in an isolated production-build copy.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/lavender-peaks/lp03')
assert.ok(!(await readFile('src/scenes/lavender-peaks/LavenderPeaksScene.tsx','utf8')).includes('coronaFragment'),
  'LP03 harness requires the pre-corona scene; use retained LP03 evidence or verify-lavender-lp04.mjs after LP04')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp03-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
const app=join(root,'src/App.tsx');let appText=await readFile(app,'utf8')
assert.ok(appText.includes('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))'))
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp03Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('  useFrame((_, delta) => {', `  useFrame((_, delta) => {
    const w=window as any, control=w.__lp03Control
    if(w.__lp03OverrideFresh&&w.__lp03Override){w.__lp03Override.updatedAtSeconds=performance.now()/1000;w.__lp03Override.frame++}
    const reviewReader=w.__lp03Override?{read:()=>w.__lp03Override}:musicFeatures
    const reviewGain=control?.gain??reactivity
`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, performance.now() / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('      updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)', `      if(control?.offsets)motion.current[depth].offset=control.offsets[depth]
      if(!control?.freeze)updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)`)
sceneText=sceneText.replace('  return <>', `  useFrame(({camera,gl},delta)=>{
    const w=window as any, a=w.__lp03Audio, ctx=gl.getContext(), debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const features=w.__lp03Override??musicFeatures.read(), r=response.current
    const held=w.__lp03Held, control=w.__lp03Control
    if(held){for(let i=0;i<6;i++)groups.current[i]!.position.x=held.positions[i];sky.current!.uniforms.sunPulse.value=held.sunPulse}
    const delivered=groups.current.map((g,i)=>{
      const m=(g!.children[0] as any).material
      if(held){m.uniforms.sustained.value=control?.shadingOff?0:held.response.ridges[i].sustained;m.uniforms.accent.value=control?.shadingOff?0:held.response.ridges[i].accent}
      return {sustained:m.uniforms.sustained.value,accent:m.uniforms.accent.value}
    })
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,
      delivered,held:!!held,features:JSON.parse(JSON.stringify(features)),response:{fresh:r.fresh,session:r.session,sequence:r.sequence,count:r.count,sunSustained:r.sunSustained,sunPulse:r.sunPulse,ridges:r.ridges.map(x=>({...x}))},
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),sunPulse:sky.current?.uniforms.sunPulse.value,
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp03Override}
    w.__lp03Latest=row
    if(w.__lp03Record&&(!w.__lp03Last||row.now-w.__lp03Last>=.05)){(w.__lp03Rows??=[]).push(row);w.__lp03Last=row.now}
  })
  return <>`)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__lp03Latest'));await writeFile(scene,sceneText)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const generated=spawnSync(process.execPath,['scripts/generate-nocturne-matrix-review.mjs'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}})
assert.equal(generated.status,0,generated.stderr)
const audioPath='/tmp/echo-nocturne-r4-review.wav'
await cp('/tmp/echo-nocturne-r4-review-sections.json',join(output,'generated-schedule.json'))
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
 const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
 const compare=(left,right)=>{const a=decode(left),b=decode(right);assert.equal(a.length,b.length);let pixels=0,max=0,total=0;for(let i=0;i<a.length;i+=3){let changed=false;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);total+=d;max=Math.max(max,d);changed ||= d!==0}pixels+=changed?1:0}return {changedPixels:pixels,totalPixels:a.length/3,maxChannelDifference:max,meanChannelDifference:total/a.length}}
let ws
const report={source:'Fresh headless Brave/CDP, isolated production-build copy, generated WAV only. No captured or owner media.',temporary,errors:[],snapshots:[],checks:[]}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__lp03Audio=this;return originalPlay.apply(this,args)}`})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__lp03Latest');await pause(800)
 const snapshot=async name=>{const row=await evaluate('window.__lp03Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.snapshots.push({name,row});return row}
 await evaluate('window.__lp03Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(150)
 const quiet=await snapshot('matched-rest');assert.equal(quiet.sunPulse,0);assert.deepEqual(report.errors,[]);assert.equal(compare(join(repository,'docs/evidence/lavender-peaks/lp01/original-no-audio.png'),join(output,'matched-rest.png')).changedPixels,0)
 await evaluate('delete window.__lp03Control;true');await pause(1000)
 const drift=await snapshot('no-audio-drift');assert.ok(drift.motion.every(x=>x.speed>0&&x.offset>0));assert.equal(drift.sunPulse,0)
 const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
 await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:[audioPath]});await wait('!!document.querySelector(".scene-player button")')
 await evaluate(`window.__lp03Record=true;document.querySelector('.scene-player button').click();true`)
 await wait('window.__lp03Audio&&!window.__lp03Audio.paused&&window.__lp03Audio.currentTime>.1')
 const frames=[],states=[['bass',3.5],['low-mid',6.5],['high-mid-quiet',9.5],['high-mid-loud',12.5],['air',15.5],['high-mid-attacks',23],['mixed',46],['silence',63]];let next=0,state=0,lastLog=-1
 while(true){
  const row=await evaluate('window.__lp03Latest'),t=row.audioTime
  if(Math.floor(t/15)!==lastLog){console.log('Generated playback',t.toFixed(1));lastLog=Math.floor(t/15)}
  if(state<states.length&&t>=states[state][1]){await snapshot(states[state][0]);state++}
  if(t>=next){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:85});const end=await evaluate('window.__lp03Audio.currentTime');const path=join(temporary,`frame-${String(frames.length).padStart(4,'0')}.jpg`);await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time:(t+end)/2,before:t,after:end});next=t+.125}
  if(t>=64)break
  await pause(35)
 }
 await evaluate('window.__lp03Record=false;window.__lp03Audio.pause();true')
 const rows=await evaluate('window.__lp03Rows');await writeFile(join(output,'trace.json'),JSON.stringify({rows,frames,pcmHash:createHash('sha256').update(await readFile(audioPath)).digest('hex')}))
 assert.ok(rows.length>500&&frames.length>200);assert.ok(rows.every(x=>x.camera.join(',')==='0,0,20'&&x.quaternion.join(',')==='0,0,0,1'))
 const speeds=[.03,.05,.09,.13,.18,.24]
 assert.ok(rows.every(x=>x.motion.every((m,i)=>m.speed===speeds[i])))
 assert.ok(rows.every(x=>x.sunPulse===x.response.sunPulse))
 assert.ok(rows.every(x=>x.delivered.every((u,i)=>u.sustained===x.response.ridges[i].sustained&&u.accent===x.response.ridges[i].accent)))
 report.checks.push('Every actual ridge material uniform equals its own sustained/accent response, in the same frame')
 report.checks.push('Generated PCM through actual production analysis; constant six-ridge drift in all passages; actual sky uniform equals response; fixed camera')
 const spans=[['bass',3,4.8],['lowMid',6,7.8],['highMidQuiet',9,10.8],['highMidLoud',12,13.8],['air',15,16.8],['mixed',45,48.8],['lateSilence',61,64.5]]
 const mean=(rs,fn)=>rs.reduce((sum,x)=>sum+fn(x),0)/rs.length
 report.windows=spans.map(([label,start,end])=>{const rs=rows.filter(x=>x.audioTime>=start&&x.audioTime<=end);return {label,count:rs.length,meanEnergy:Object.fromEntries(Object.keys(rs[0].features.energy.six).map(k=>[k,mean(rs,x=>x.features.energy.six[k])])),meanResponse:rs[0].response.ridges.map((r,i)=>({band:r.band,sustained:mean(rs,x=>x.response.ridges[i].sustained),maxAccent:Math.max(...rs.map(x=>x.response.ridges[i].accent))})),meanSunPulse:mean(rs,x=>x.sunPulse)}})
 const quietHigh=report.windows.find(x=>x.label==='highMidQuiet').meanResponse[2].sustained,loudHigh=report.windows.find(x=>x.label==='highMidLoud').meanResponse[2].sustained
 assert.ok(loudHigh>quietHigh*2)
 for(const label of ['bass','lowMid'])assert.ok(report.windows.find(x=>x.label===label).meanResponse[2].sustained<.001)
 const attacks=rows.filter(x=>x.audioTime>=22&&x.audioTime<25)
 assert.ok(Math.max(...attacks.map(x=>x.response.ridges[2].accent))>.05)
 const held=rows.filter(x=>x.audioTime>=33.3&&x.audioTime<37.8)
 assert.ok(held.every(x=>x.response.ridges[2].accent===0))
 const late=rows.filter(x=>x.audioTime>=63)
 assert.ok(late.every(x=>x.sunPulse===0&&x.response.ridges.every(r=>r.sustained===0&&r.accent===0)))
 report.checks.push('Quiet/loud high-mid response >2:1; bass/low-mid isolation; high-mid attacks qualified; held high mids reject low-mid attacks; music response zero in late silence')
 const concat=frames.map((x,i)=>`file '${x.path}'\nduration ${i<frames.length-1?Math.max(.02,frames[i+1].time-x.time):.125}`).join('\n')
 await writeFile(join(temporary,'frames.txt'),concat+'\n')
 const encode=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'generated-baseline.mp4')],{encoding:'utf8'});assert.equal(encode.status,0,encode.stderr)
 // Internal gain override is temporary-copy-only; intrinsic drift must continue.
 await evaluate('window.__lp03Control={gain:0};true');await pause(250)
 const zero=await snapshot('zero-reactivity');await pause(250);const zeroAfter=await evaluate('window.__lp03Latest')
 assert.ok(zeroAfter.motion.every((m,i)=>m.offset>zero.motion[i].offset));assert.equal(zero.sunPulse,0)
 assert.ok(zeroAfter.response.ridges.every(x=>x.sustained===0&&x.accent===0))
 await evaluate('delete window.__lp03Control;true')
 // Same running scene observes fresh, stale and recovered borrowed publications.
 const override=structuredClone(rows.find(x=>x.audioTime>3&&x.features.status==='active').features)
 override.session+=100;override.sequence=0;override.events=[]
 await evaluate('window.__lp03Override='+JSON.stringify(override)+';window.__lp03OverrideFresh=true;true');await pause(600)
 assert.ok((await evaluate('window.__lp03Latest')).sunPulse>.02)
 await evaluate('window.__lp03OverrideFresh=false;window.__lp03Override.updatedAtSeconds=performance.now()/1000-1;true');await pause(2500)
 const stale=await snapshot('stale-fade');assert.equal(stale.response.fresh,false);assert.equal(stale.sunPulse,0);assert.equal(stale.response.count,0)
 await evaluate('window.__lp03OverrideFresh=true;true');await pause(500)
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250)
 const reduced=await snapshot('reduced-motion');await pause(250);assert.deepEqual(reduced.motion,(await evaluate('window.__lp03Latest')).motion);assert.equal(reduced.sunPulse,0)
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
 await evaluate('delete window.__lp03Override;delete window.__lp03OverrideFresh;window.__lp03Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(150);await snapshot('wrap-origin')
 await evaluate('window.__lp03Control={freeze:true,offsets:[24,24,24,24,24,24]};true');await pause(150);await snapshot('wrap-full-period')
 await evaluate('delete window.__lp03Control;true')
 report.checks.push('Gain0 clears music while drift continues; stale publication releases sun; reduced motion freezes drift and suppresses sun; whole-period geometry snapshots')
 // Quality changes and scene re-entry keep the generated source alive.
 await evaluate("document.getElementById('graphics-quality').value='low';document.getElementById('graphics-quality').dispatchEvent(new Event('change',{bubbles:true}));true");await pause(350)
 const low=await snapshot('low-quality');assert.equal(low.renderer.dpr,.75)
 await evaluate("document.getElementById('graphics-quality').value='standard';document.getElementById('graphics-quality').dispatchEvent(new Event('change',{bubbles:true}));delete window.__lp03Latest;document.getElementById('scene-select').value='nocturne';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true");await pause(350)
 await evaluate("document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true");await wait('!!window.__lp03Latest')
 const reentry=await snapshot('scene-reentry');assert.ok(reentry.response.ridges.every(x=>x.accent===0));assert.ok(await evaluate('!!window.__lp03Audio&&window.__lp03Audio.currentTime>63'))
 report.checks.push('Standard/Low and scene re-entry retain generated local source; retained events do not accent on re-entry')
 // Paired render replay: same recorded offsets, sun and response on both sides.
 // Left is the original LP02 gradient (zero new shading uniforms), right LP03.
 const paired=[]
 await evaluate('window.__lp03Control={freeze:true};true')
 for(let i=0;i<frames.length;i++){
  const f=frames[i],held=rows.reduce((a,b)=>Math.abs(b.audioTime-f.time)<Math.abs(a.audioTime-f.time)?b:a)
  await evaluate('window.__lp03Held='+JSON.stringify(held)+';window.__lp03Control.shadingOff=true;true');await pause(18)
  const left=await send('Page.captureScreenshot',{format:'jpeg',quality:85});const leftPath=join(temporary,`pair-left-${i}.jpg`);await writeFile(leftPath,Buffer.from(left.data,'base64'))
  await evaluate('window.__lp03Control.shadingOff=false;true');await pause(18)
  const right=await send('Page.captureScreenshot',{format:'jpeg',quality:85});const rightPath=join(temporary,`pair-right-${i}.jpg`);await writeFile(rightPath,Buffer.from(right.data,'base64'))
  paired.push({leftPath,rightPath,time:held.audioTime})
  if(i%100===0)console.log('Matched shading frames',i,'/',frames.length)
 }
 const pairList=side=>paired.map((x,i)=>`file '${x[side]}'\nduration ${i<paired.length-1?Math.max(.02,frames[i+1].time-frames[i].time):.125}`).join('\n')+'\n'
 await writeFile(join(temporary,'left.txt'),pairList('leftPath'));await writeFile(join(temporary,'right.txt'),pairList('rightPath'))
 const comparison=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'left.txt'),'-f','concat','-safe','0','-i',join(temporary,'right.txt'),'-ss',String(frames[0].time),'-i',audioPath,'-filter_complex',"[0:v]drawtext=text='LP02 - original gradients':fontcolor=0x322e50:fontsize=24:x=45:y=100[l];[1:v]drawtext=text='LP03 - independent shading':fontcolor=0x322e50:fontsize=24:x=45:y=100[r];[l][r]hstack=inputs=2[v]",'-map','[v]','-map','2:a:0','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'lp02-lp03-comparison.mp4')],{encoding:'utf8',maxBuffer:2*1024*1024});assert.equal(comparison.status,0,comparison.stderr)
 report.comparison={frames:paired.length,method:'Recorded source-time states replayed with identical offsets/sun/response; left has original LP02 gradient, right adds LP03 shading. Generated source soundtrack. UI is paused during replay; music timing is annotated by source schedule.',maxStateTimeMismatchSeconds:Math.max(...paired.map((x,i)=>Math.abs(x.time-frames[i].time)))}
 await evaluate('delete window.__lp03Held;true')
 const controlled=[]
 const baseView=structuredClone(rows.find(x=>x.features.status==='active').features)
 baseView.events=[];baseView.sequence=0;baseView.context={intensity:0,brightness:0,brightnessValid:false,activity:0}
 await evaluate('window.__lp03Control={freeze:true,offsets:[0,0,0,0,0,0]};true')
 for(let band=0;band<6;band++){
  for(const [label,level]of [['quiet',.15],['loud',.5]]){
   const view=structuredClone(baseView);view.session+=1000+band*2+(label==='loud'?1:0);view.energy.six=Object.fromEntries(['air','presence','highMids','lowMids','bass','subBass'].map((b,i)=>[b,i===band?level:0]));view.energy.low=band>=4?level:0;view.energy.overall=level
   await evaluate('window.__lp03Override='+JSON.stringify(view)+';window.__lp03OverrideFresh=true;true');await pause(2400)
   const state=await evaluate('window.__lp03Latest');assert.ok(state.delivered.every((u,i)=>i===band?u.sustained>.3:u.sustained===0))
   const active=await snapshot(`band-${band}-${label}`)
   // Exact ablation under the same frozen state isolates the rendered layer.
   await evaluate('window.__lp03Held='+JSON.stringify(active)+';window.__lp03Control.shadingOff=true;true');await pause(40)
   const off=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,`band-${band}-${label}-baseline.png`),Buffer.from(off.data,'base64'))
   await evaluate('delete window.__lp03Held;window.__lp03Control.shadingOff=false;true')
   controlled.push({band,label,level,state:active})
  }
 }
 await writeFile(join(output,'controlled-bands.json'),JSON.stringify(controlled,null,2))
 report.checks.push('All six isolated scene-contract bands reach only their own material; paired quiet/loud active/baseline screenshots captured')
 await evaluate('delete window.__lp03Override;delete window.__lp03OverrideFresh;delete window.__lp03Control;true')
 const activeWraps=[]
 const allBands=structuredClone(baseView);allBands.session+=2000;allBands.energy.six=Object.fromEntries(['air','presence','highMids','lowMids','bass','subBass'].map(b=>[b,.5]));allBands.energy.low=.5
 await evaluate('window.__lp03Override='+JSON.stringify(allBands)+';window.__lp03OverrideFresh=true;window.__lp03Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(2500)
 for(const quality of ['standard','low']){
  await evaluate('document.getElementById("graphics-quality").value='+JSON.stringify(quality)+';document.getElementById("graphics-quality").dispatchEvent(new Event("change",{bubbles:true}));true');await pause(300)
  const held=await evaluate('window.__lp03Latest');held.positions=[0,0,0,0,0,0]
  await evaluate('window.__lp03Held='+JSON.stringify(held)+';true');await pause(40);await snapshot('active-wrap-'+quality+'-origin')
  held.positions=[24,24,24,24,24,24]
  await evaluate('window.__lp03Held='+JSON.stringify(held)+';true');await pause(40);await snapshot('active-wrap-'+quality+'-period')
  const difference=compare(join(output,'active-wrap-'+quality+'-origin.png'),join(output,'active-wrap-'+quality+'-period.png'))
  assert.ok(difference.maxChannelDifference<=1);activeWraps.push({quality,...difference})
  await evaluate('delete window.__lp03Held;true')
 }
 report.activeWraps=activeWraps;report.checks.push('Active six-band shading repeats over a full terrain period in Standard and Low')
 const {assessLavenderLP03}=await import('./assess-lavender-lp03.mjs');await assessLavenderLP03()
 await evaluate('delete window.__lp03Override;delete window.__lp03OverrideFresh;delete window.__lp03Control;true')
 report.browser=await evaluate('navigator.userAgent');report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged);assert.deepEqual(report.errors,[])
 const restComparison=compare(join(repository,'docs/evidence/lavender-peaks/lp01/original-no-audio.png'),join(output,'matched-rest.png'))
 const wrapComparison=compare(join(output,'wrap-origin.png'),join(output,'wrap-full-period.png'))
 assert.equal(restComparison.changedPixels,0);assert.ok(wrapComparison.maxChannelDifference<=1)
 await writeFile(join(output,'assessment.json'),JSON.stringify({restComparison,wrapComparison,rows:rows.length,frames:frames.length,renderer:rows[0].renderer,cost:rows[30].cost,windows:report.windows,activeWraps:report.activeWraps,
   maxHighMidAccent:Math.max(...attacks.map(x=>x.response.ridges[2].accent)),maxHeldHighMidAccent:Math.max(...held.map(x=>x.response.ridges[2].accent)),
   maxBassSunPulse:Math.max(...rows.filter(x=>x.audioTime>=19&&x.audioTime<22).map(x=>x.sunPulse)),checks:report.checks,sourceUnchangedDuringCapture:report.sourceUnchanged,errors:report.errors},null,2))
 report.status='LP03 independent ridge shading verified with generated input; owner visual/music checkpoint pending';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

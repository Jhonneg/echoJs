// LP06 generated-input verification; probes and overrides live in an isolated production-build copy.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),output=join(repository,'docs/evidence/lavender-peaks/corona-review')
const temporary=await mkdtemp(join(tmpdir(),'echo-lavender-lp06-')),root=join(temporary,'app')
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
appText=appText.replace('  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))','  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))\n  ;(window as any).__lp06Analysis = analysis')
await writeFile(app,appText)
const scene=join(root,'src/scenes/lavender-peaks/LavenderPeaksScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace('  useFrame((_, delta) => {', `  useFrame((_, delta) => {
    const w=window as any, control=w.__lp06Control
    if(w.__lp06OverrideFresh&&w.__lp06Override){w.__lp06Override.updatedAtSeconds=performance.now()/1000;w.__lp06Override.frame++}
    const reviewReader=w.__lp06Override?{read:()=>w.__lp06Override}:musicFeatures
    const reviewGain=control?.gain??reactivity
`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, performance.now() / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('motion.current, performance.now() / 1000, reactivity, reducedMotion','motion.current, performance.now() / 1000, reviewGain, reducedMotion')
sceneText=sceneText.replace('corona.current, response.current, delta, reactivity, reducedMotion','corona.current, response.current, delta, reviewGain, reducedMotion')
sceneText=sceneText.replace('delta, reactivity, reducedMotion)\n    if (sky.current)','delta, reviewGain, reducedMotion)\n    if (sky.current)')
sceneText=sceneText.replace('      updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)', `      if(control?.offsets)motion.current[depth].offset=control.offsets[depth]
      if(!control?.freeze)updateLayerMotion(motion.current[depth], depth, reducedMotion, delta)`)
sceneText=sceneText.replace('  return <>', `  useFrame(({camera,gl},delta)=>{
    const w=window as any, a=w.__lp06Audio, ctx=gl.getContext(), debug=ctx.getExtension('WEBGL_debug_renderer_info')
    const features=w.__lp06Override??musicFeatures.read(), r=response.current, c=corona.current
    const held=w.__lp06Held, control=w.__lp06Control, u=sky.current!.uniforms
    if(held){for(let i=0;i<6;i++)groups.current[i]!.position.x=held.positions[i];for(const [k,v]of Object.entries(held.skyUniforms))u[k].value=v}
    if(control?.time!==undefined)u.coronaTime.value=control.time
    if(control?.resetTime){c.time=0;u.coronaTime.value=0;delete control.resetTime}
    const variant='all'
    const light=held?.illumination??{coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)}
    u.coronaLight.value=variant==='all'||variant==='sky-only'?light.coronaLight:0
    const delivered=groups.current.map((g,i)=>{
      const m=(g!.children[0] as any).material
      if(held){m.uniforms.sustained.value=held.response.ridges[i].sustained;m.uniforms.accent.value=held.response.ridges[i].accent;m.uniforms.terrainOffset.value=held.positions[i];m.uniforms.nextOffset.value=held.positions[Math.min(i+1,5)]}
      m.uniforms.coronaLight.value=variant==='all'||variant==='slopes-only'?light.coronaLight:0
      m.uniforms.mistLight.value=variant==='all'||variant==='mist-only'?light.mist:0
      m.uniforms.glintLight.value=variant==='all'||variant==='glints-only'?light.glints[i]:0
      if(held){m.uniforms.traceHead.value=held.delivered[i].traceHead;m.uniforms.traceOpacity.value=held.delivered[i].traceOpacity;m.uniforms.traceDirection.value=held.delivered[i].traceDirection;m.uniforms.traceTail.value=held.delivered[i].traceTail}
      if(control?.off)m.uniforms.traceOpacity.value=0
      return {traceHead:m.uniforms.traceHead.value,traceOpacity:m.uniforms.traceOpacity.value,traceDirection:m.uniforms.traceDirection.value,traceTail:m.uniforms.traceTail.value,sustained:m.uniforms.sustained.value,accent:m.uniforms.accent.value,coronaLight:m.uniforms.coronaLight.value,mist:m.uniforms.mistLight.value,glint:m.uniforms.glintLight.value,offset:m.uniforms.terrainOffset.value,nextOffset:m.uniforms.nextOffset.value}
    })
    const row={now:performance.now()/1000,audioTime:a?.currentTime??null,dt:delta,delivered,
      features:JSON.parse(JSON.stringify(features)),response:{fresh:r.fresh,session:r.session,sequence:r.sequence,count:r.count,ridges:r.ridges.map(x=>({...x}))},corona:{...c},traces:{session:traces.current.session,slots:traces.current.slots.map(x=>({...x}))},illumination:{session:illumination.current.session,coronaLight:illumination.current.coronaLight,mist:illumination.current.mist,glints:Array.from(illumination.current.glints)},
      skyUniforms:Object.fromEntries(Object.entries(u).map(([k,v])=>[k,v.value])),
      motion:motion.current.map(x=>({...x})),positions:groups.current.map(x=>x?.position.x),
      camera:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom,
      cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures},
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()},
      override:!!w.__lp06Override,held:!!held}
    w.__lp06Latest=row
    if(w.__lp06Record&&!held&&(!w.__lp06Last||row.now-w.__lp06Last>=.05)){(w.__lp06Rows??=[]).push(row);w.__lp06Last=row.now}
  })
  return <>`)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__lp06Latest'));await writeFile(scene,sceneText)
const coronaFile=join(root,'src/scenes/lavender-peaks/corona.ts')
let coronaText=await readFile(coronaFile,'utf8')
coronaText=coronaText.replace('uniform float coronaTime;', 'uniform float reviewRingScale;\nuniform float reviewResponse;\nuniform float reviewAccent;\nuniform float coronaTime;')
coronaText=coronaText.replace('(0.04 * coronaEnvelope + 0.035 * coronaDetail));','(0.04 * coronaEnvelope + 0.035 * coronaDetail) * reviewResponse);')
coronaText=coronaText.replace('coronaSunRadius * (1.025 + layer * 0.05) + amplitude * wave','coronaSunRadius * (1.025 + layer * 0.05) * reviewRingScale + amplitude * wave')
coronaText=coronaText.replace('edge += coronaMotion * (','edge += coronaMotion * reviewAccent * (')
await writeFile(coronaFile,coronaText)
sceneText=sceneText.replace('coronaTime: { value: 0 },','reviewRingScale: { value: 1 }, reviewResponse: { value: 1 }, reviewAccent: { value: 1 }, coronaTime: { value: 0 },')
sceneText=sceneText.replace("const variant='all'", "const candidate=control?.reviewVariant==='candidate';u.reviewRingScale.value=candidate?1.15:1;u.reviewResponse.value=candidate?3:1;u.reviewAccent.value=candidate?1.8:1;u.coronaRadiusRatio.value=candidate?1.65:1.35;u.coronaMaxAmplitude.value=candidate?.22:.11;const variant='all'")
await writeFile(scene,sceneText)
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
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__lp06Audio=this;return originalPlay.apply(this,args)}`})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!document.getElementById("scene-select")')
 await evaluate(`document.getElementById('scene-select').value='lavender-peaks';document.getElementById('scene-select').dispatchEvent(new Event('change',{bubbles:true}));true`)
 await wait('!!window.__lp06Latest');await pause(800)
 const snapshot=async name=>{const row=await evaluate('window.__lp06Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.snapshots.push({name,row});return row}
 await evaluate('window.__lp06Control={freeze:true,offsets:[0,0,0,0,0,0]};true');await pause(150)
 const trace=JSON.parse(await readFile(join(repository,'docs/evidence/lavender-peaks/lp06/current/trace.json')))
 assert.equal(createHash('sha256').update(await readFile(audioPath)).digest('hex'),trace.pcmHash)
 const heldAt=time=>{
  const r=structuredClone(trace.rows.reduce((a,b)=>Math.abs(b.audioTime-time)<Math.abs(a.audioTime-time)?b:a))
  r.positions=Array(6).fill(0);return r
 }
 const render=async(state,variant,path)=>{
  await evaluate('window.__lp06Held='+JSON.stringify(state)+';window.__lp06Control={freeze:true,reviewVariant:'+JSON.stringify(variant)+'};true')
  await pause(40)
  const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:93})
  await writeFile(path,Buffer.from(shot.data,'base64'))
 }
 for(const [label,t]of [['quiet',18.5],['bass-attack',19.55],['high-mid-attack',22.5],['air-attack',25.5],['mixed',46]]){
  const held=heldAt(t)
  for(const variant of ['current','candidate'])await render(held,variant,join(output,label+'-'+variant+'.jpg'))
 }
 const frames=[]
 for(let t=18.5;t<=27.5;t+=.1){
  const held=heldAt(t),index=frames.length,left=join(temporary,'current-'+index+'.jpg'),right=join(temporary,'candidate-'+index+'.jpg')
  await render(held,'current',left);await render(held,'candidate',right)
  frames.push({sourceTime:held.audioTime,left,right})
  if(index%30===0)console.log('Corona review paired frames',index)
 }
 for(const side of ['left','right'])await writeFile(join(temporary,side+'.txt'),frames.map(x=>`file '${x[side]}'\nduration 0.1`).join('\n')+'\n')
 const comparison=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'left.txt'),'-f','concat','-safe','0','-i',join(temporary,'right.txt'),'-ss',String(frames[0].sourceTime),'-i',audioPath,'-filter_complex',"[0:v]crop=280:240:688:145,scale=840:720,drawtext=text='Current':fontcolor=0x322e50:fontsize=24:x=20:y=20[l];[1:v]crop=280:240:688:145,scale=840:720,drawtext=text='Proposed - not applied':fontcolor=0x322e50:fontsize=24:x=20:y=20[r];[l][r]hstack=inputs=2[v]",'-map','[v]','-map','2:a:0','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',join(output,'current-proposed-corona.mp4')],{encoding:'utf8'});assert.equal(comparison.status,0,comparison.stderr)
 const still=spawnSync('ffmpeg',['-y','-loglevel','error','-i',join(output,'high-mid-attack-current.jpg'),'-i',join(output,'high-mid-attack-candidate.jpg'),'-filter_complex',"[0:v]crop=280:240:688:145,scale=840:720,drawtext=text='Current':fontcolor=0x322e50:fontsize=24:x=20:y=20[l];[1:v]crop=280:240:688:145,scale=840:720,drawtext=text='Proposed - not applied':fontcolor=0x322e50:fontsize=24:x=20:y=20[r];[l][r]hstack=inputs=2[v]",'-map','[v]','-frames:v','1',join(output,'current-proposed-corona.png')],{encoding:'utf8'});assert.equal(still.status,0,still.stderr)
 report.frames=frames.length;report.source= 'Current LP06 recorded actual-MI states from generated PCM, replayed at fixed terrain/camera with identical features and clock on both sides; detail crops. Not owner media.'
 report.proposal={ringScale:1.15,sustainedWaveMultiplier:3,localAccentMultiplier:1.8,maximumAmplitude:.22,maximumRadiusRatio:1.65,coreRadiusUnchanged:.75,productionApplied:false}
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged);assert.deepEqual(report.errors,[])
 report.status='Review proposal only; no production changes'
 console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

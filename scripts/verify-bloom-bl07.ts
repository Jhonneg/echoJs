// Isolated production builds; generated audio only. Runtime probes never ship.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'
const repository=process.cwd(),baseline=process.env.ECHO_BL07_BASELINE==='1',smoke=process.env.ECHO_BL07_SMOKE==='1'
const evidence='docs/evidence/bloom/bl07'
const output=join(repository,evidence,baseline?'baseline':smoke?'smoke':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-bloom-bl02-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
if(baseline)await writeFile(join(root,'src/scenes/bloom/music.ts'),await readFile(join(repository,evidence,'baseline/music.ts.txt')))
await cp(join(repository,evidence,'generated-sequence.json'),join(root,'src/scenes/bloom/bl07-review-sequence.json'))
const sequence=JSON.parse(await readFile(join(repository,evidence,'generated-sequence.json'),'utf8'))
const scene=join(root,'src/scenes/bloom/BloomScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText="import reviewSequence from './bl07-review-sequence.json'\n"+sceneText
sceneText=sceneText.replace('  const response = useRef(createBloomMusic())','  const response = useRef(createBloomMusic())\n  const reviewIndex=useRef(0)')
sceneText=sceneText.replace('    const now = performance.now()', `
    const w=window as any
    if(w.__bl06Reset){response.current=createBloomMusic();reviewIndex.current=0;w.__bl06Reset=false}
    if(w.__bl07Manual){
      const target=Math.max(1,Math.min(reviewSequence.frames.length,Math.round((w.__bl07Time??0)*60)))
      if(target<reviewIndex.current){response.current=createBloomMusic();reviewIndex.current=0}
      while(reviewIndex.current<target){
        const row=reviewSequence.frames[reviewIndex.current++]
        updateBloomMusic(response.current,{read:()=>row.features as any},1/60,row.time,1,!!w.__bl07Reduced)
        w.__bl06Input=row.features
      }
    }
    const reviewReader={read:()=>{const v=musicFeatures.read();w.__bl06Input={...v,energy:{...v.energy,six:{...v.energy.six}},context:{...v.context},events:v.events.map(e=>({...e}))};return v}}
    const now = performance.now()`)
sceneText=sceneText.replace('const state = updateBloomMusic(response.current, musicFeatures, delta, now / 1000, reactivity, reducedMotion)', 'const state = w.__bl07Manual?response.current:updateBloomMusic(response.current, reviewReader, delta, now / 1000, reactivity, reducedMotion)')
const anchor='  const sky = useMemo(() =>'
sceneText=sceneText.replace(anchor,`  useFrame(({gl,camera,scene},delta)=>{
    const w=window as any,ctx=gl.getContext(),debug=ctx.getExtension('WEBGL_debug_renderer_info'),r=response.current
    w.__bl02Latest={dt:delta,cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length},
      camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom},
      input:w.__bl06Input,response:{fresh:r.fresh,enabled:r.enabled,bands:r.bands.map(b=>({...b})),context:{...r.context},motion:{...r.motion},output:{...r.output},trails:r.trails.map(t=>({...t,pulses:t.pulses.map(p=>({...p}))})),projection:{...r.projection},count:r.count,time:r.time,ringAge:r.ringAge,ringStrength:r.ringStrength},
      hero:{position:hero.current!.position.toArray(),rotation:hero.current!.rotation.toArray()},
      delivered:{stoneAurora:stone.current!.auroraStrength.value,stoneSeam:stone.current!.seamLevel.value,seam:seam.current!.uniforms.seamLevel.value,water:Object.fromEntries(Object.entries(lake.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value])),trails:Object.fromEntries(Object.entries(trails.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value]))},
      geometry:scene.getObjectByName('bloom-trails')!.uuid,
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()}}
    if(w.__bl02Benchmark)(w.__bl02Frames??=[]).push(w.__bl02Latest)
    if(w.__bl06Record&&(!w.__bl06Last||performance.now()-w.__bl06Last>40)){(w.__bl06Rows??=[]).push({...w.__bl02Latest,mediaTime:w.__bl02Audio?.currentTime,now:performance.now()/1000});w.__bl06Last=performance.now()}
  })
`+anchor)
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__bl02Latest'));await writeFile(scene,sceneText)
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report:Record<string,any>={baseline,smoke,temporary,errors:[],screenshots:[],checks:[],performance:[],source:'Isolated production build with temporary scalar/resource probes; generated local PCM only. No owner media. Headless performance is not native-device certification.'}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 const snapshot=async name=>{const row=await evaluate('window.__bl02Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name,row});return row}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__bl07Manual=true;window.__bl07Time=0;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__bl02Audio=this;return play.apply(this,args)}`})
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!window.__bl02Latest');await pause(400)
 for(const quality of ['standard','low']){
  await select('graphics-quality',quality)
  for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]] as const){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(250)
   const row=await snapshot(name+'-'+quality)
   assert.deepEqual(row.camera.position,[0,0,20]);assert.deepEqual(row.camera.quaternion,[0,0,0,1])
   assert.equal(row.cost.calls,9);assert.equal(row.cost.geometries,9);assert.ok(row.geometry)
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await select('graphics-quality','standard')
 const checkpoints=[['idle',2],['quiet',6],['build-early',9],['build-late',14.5],['attack-low',15.65],['attack-high-mid',16.02],['dense-attacks',19.1],['release-early',21.5],['release-mid',24],['silence-tail',37]]
 for(const [name,time]of checkpoints){await evaluate(`window.__bl07Time=${time};true`);await pause(80);await snapshot(name)}
 report.sequence=sequence.phases
 await evaluate('window.__bl06Reset=true;window.__bl07Reduced=true;window.__bl07Time=18;true');await pause(100);const reduced=await snapshot('reduced-sequence');assert.equal(reduced.hero.position[1],2.25);assert.equal(reduced.response.time,0)
 await evaluate('window.__bl07Reduced=false;window.__bl06Reset=true;true');await pause(100)
 if(!smoke){
  const frames:any[]=[]
  await evaluate('window.__bl06Reset=true;true')
  for(let index=0;index<=304;index++){
   const time=index/8;await evaluate(`window.__bl07Time=${time};true`);await pause(25)
   const row=await evaluate('window.__bl02Latest'),shot=await send('Page.captureScreenshot',{format:'jpeg',quality:90}),path=join(temporary,'sequence-'+index+'.jpg')
   await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({path,time,row})
  }
  await writeFile(join(output,'sequence-trace.json'),JSON.stringify(frames.map(({time,row})=>({time,...row}))))
  await writeFile(join(temporary,'video.txt'),frames.map(f=>`file '${f.path}'\nduration 0.125`).join('\n')+'\n')
  const subtitles=sequence.phases.map(p=>`Dialogue: 0,0:00:${String(p.start).padStart(2,'0')}.00,0:00:${String(p.end).padStart(2,'0')}.00,Default,,0,0,0,,${p.label}`).join('\n')
  await writeFile(join(temporary,'labels.ass'),`[Script Info]\nPlayResX: 1440\nPlayResY: 900\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DejaVu Sans,22,&H00FFFFFF,&H00FFFFFF,&H00202020,&H00202020,0,0,0,0,100,100,0,0,1,1,0,7,40,40,135,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${subtitles}\n`)
  const video=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'video.txt'),'-vf',`subtitles=${join(temporary,'labels.ass')},drawtext=text='${baseline?'BL06':'BL07'} - generated MI feature replay | t=%{pts\\:hms}':fontcolor=white:fontsize=20:x=40:y=105`,'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(output,'choreography.mp4')],{encoding:'utf8'});assert.equal(video.status,0,video.stderr)
  report.motionFrames=frames.length
  await evaluate('window.__bl07Manual=false;window.__bl06Reset=true;true')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(300)
  for(let run=0;run<3;run++){
   await evaluate('window.__bl02Frames=[];window.__bl02Benchmark=true;true');await pause(10000)
   await evaluate('window.__bl02Benchmark=false;true');report.performance.push(await evaluate('window.__bl02Frames'));console.log((baseline?'Baseline':'BL07')+' timing '+(run+1))
  }
  if(!baseline){
  const gen=spawnSync(process.execPath,['scripts/generate-nocturne-matrix-review.ts'],{cwd:repository,encoding:'utf8',env:{...process.env,ECHO_MATRIX_REFINEMENT:'1'}});assert.equal(gen.status,0,gen.stderr)
  await cp('/tmp/echo-nocturne-r4-review-sections.json',join(output,'generated-schedule.json'))
  const doc=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'})
  await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-r4-review.wav']});await wait('!!document.querySelector(".scene-player button")')
  await evaluate('window.__bl06Record=true;window.__bl06Rows=[];document.querySelector(".scene-player button").click();true')
  await wait('window.__bl02Audio&&!window.__bl02Audio.paused&&window.__bl02Audio.currentTime>.1')
  for(const [time,label]of [[4,'actual-bass'],[7,'actual-low-mid'],[10,'actual-quiet-high-mid'],[13,'actual-loud-high-mid'],[16,'actual-treble'],[22.35,'actual-high-mid-attack'],[30,'actual-bass-plus-held-high'],[35.6,'actual-low-mid-beside-held-high'],[47,'actual-mixed'],[58,'actual-silence']] as const){
   await wait(`window.__bl02Audio.currentTime>=${time}`);await snapshot(label);console.log('Generated case '+label)
  }
  await evaluate('window.__bl06Record=false;true');report.generatedRows=await evaluate('window.__bl06Rows');await writeFile(join(output,'generated-trace.json'),JSON.stringify(report.generatedRows));delete report.generatedRows
  await evaluate('window.__bl02Source=window.__bl02Audio;true');const beforeTime=await evaluate('window.__bl02Audio.currentTime')
  for(let run=0;run<3;run++){await select('graphics-quality','low');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,9);await select('graphics-quality','standard');assert.equal((await evaluate('window.__bl02Latest')).cost.geometries,9)}
  for(const name of ['nocturne','lavender-peaks','crimson-horizon','bloom'])await select('scene-select',name)
  await wait('window.__bl02Latest?.cost.geometries===9');assert.ok(await evaluate('window.__bl02Audio===window.__bl02Source&&!window.__bl02Audio.paused'));assert.ok(await evaluate('window.__bl02Audio.currentTime')>beforeTime)
  await snapshot('scene-reentry');await evaluate('window.__bl02Audio.pause();true')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300);const r=await snapshot('reduced-motion');await pause(200);assert.equal((await evaluate('window.__bl02Latest')).response.time,r.response.time)
  report.checks.push('Generated WAV actual production MI path; source identity/time retained through repeated quality and landscape changes; resources stable; reduced motion freezes clock')
 }
 }
 assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status=smoke?'BL07 sequence preview captured':'BL07 sequence, performance and lifecycle evidence captured';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

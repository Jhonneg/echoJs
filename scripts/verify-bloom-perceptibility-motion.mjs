// Isolated production builds; generated audio only. Runtime probes never ship.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'

const repository=process.cwd(),baseline=process.env.ECHO_BLOOM_BASELINE==='1',smoke=process.env.ECHO_BL06_SMOKE==='1'
const evidence='docs/evidence/bloom/bl07-perceptibility'
const output=join(repository,evidence,baseline?'baseline':smoke?'smoke':'current')
const temporary=await mkdtemp(join(tmpdir(),'echo-bloom-bl02-')),root=join(temporary,'app')
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})})
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
async function manifest(){return Promise.all((await files(join(repository,'src'))).map(async path=>({file:path.slice(repository.length+1),sha256:createHash('sha256').update(await readFile(path)).digest('hex')})))}
const before=await manifest()
await mkdir(output,{recursive:true});await mkdir(root)
for(const file of ['src','public','index.html','package.json','vite.config.ts'])await cp(join(repository,file),join(root,file),{recursive:true})
await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
const config=join(root,'vite.config.ts');await writeFile(config,(await readFile(config,'utf8')).replace('defineConfig({','defineConfig({cacheDir:'+JSON.stringify(join(temporary,'vite-cache'))+','))
if(baseline)for(const f of ['BloomScene.tsx','lifecycle.ts','trails.ts','music.ts','monolith.ts','reflection.ts'])await cp(join(repository,evidence,'baseline',f+'.txt'),join(root,'src/scenes/bloom',f))
const scene=join(root,'src/scenes/bloom/BloomScene.tsx');let sceneText=await readFile(scene,'utf8')
sceneText=sceneText.replace("window.matchMedia('(hover: hover) and (pointer: fine)')", "({matches:true,addEventListener(){},removeEventListener(){}})")
sceneText=sceneText.replace('updateFloat(floating.current,playing,reducedMotion,delta,state.bands[2].accent,state.bands[3].accent)', 'updateFloat(floating.current,(window as any).__playing??playing,reducedMotion,delta,state.bands[2].accent,state.bands[3].accent)')
sceneText=sceneText.replace('    const now = performance.now()', `
    const w=window as any
    if(w.__bl06Reset){response.current=createBloomMusic();w.__bl06Reset=false}
    if(w.__bl06Fresh&&w.__bl06Override){w.__bl06Override.updatedAtSeconds=performance.now()/1000;w.__bl06Override.frame++}
    const reviewReader={read:()=>{
      const v=w.__bl06Override??musicFeatures.read()
      w.__bl06Input={session:v.session,frame:v.frame,status:v.status,sequence:v.sequence,energy:{...v.energy,six:{...v.energy.six}},context:{...v.context},events:v.events.map((e:any)=>({...e}))}
      return v
    }}
    const now = performance.now()`)
sceneText=sceneText.replace('response.current, musicFeatures, delta, now / 1000, reactivity, reducedMotion', 'response.current, reviewReader, delta, now / 1000, w.__bl06Gain??reactivity, w.__bl06Reduced??reducedMotion')
sceneText=sceneText.replace('    const out = state.output, p = state.projection', `
    if(w.__bl06Freeze){state.time=0;state.trails[0].phase=0;state.trails[1].phase=.43}
    const out = state.output, p = state.projection`)
const anchor='  const sky = useMemo(() =>'
sceneText=sceneText.replace(anchor,`  useFrame(({gl,camera,scene},delta)=>{
    const w=window as any,ctx=gl.getContext(),debug=ctx.getExtension('WEBGL_debug_renderer_info'),r=response.current
    w.__bl02Latest={dt:delta,cost:{calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length},
      camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),zoom:(camera as OrthographicCamera).zoom},
      input:w.__bl06Input,floating:{...floating.current},parallax:{...pointer.current},response:{fresh:r.fresh,enabled:r.enabled,bands:r.bands.map(b=>({...b})),context:{...r.context},output:{...r.output},trails:r.trails.map(t=>({...t,pulses:t.pulses.map(p=>({...p}))})),projection:{...r.projection},count:r.count,time:r.time,ringAge:r.ringAge,ringStrength:r.ringStrength},
      hero:{position:hero.current!.position.toArray(),rotation:hero.current!.rotation.toArray()},
      delivered:{stoneAurora:stone.current!.auroraStrength.value,stoneSeam:stone.current!.seamLevel.value,seam:seam.current!.uniforms.seamLevel.value,water:Object.fromEntries(Object.entries(lake.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value])),trails:Object.fromEntries(Object.entries(trails.current!.uniforms).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value]))},
      reflectionSources:scene.children.filter((m:any)=>m.name==='bloom-reflected-stone'||m.name==='bloom-reflected-beam').map((m:any)=>({name:m.name,positions:Array.from(m.geometry.attributes.position.array),sourceMatrix:m.material.uniforms.sourceMatrix.value.toArray(),beam:m.material.uniforms.beamOnly.value})),
      geometry:scene.getObjectByName('bloom-trails')!.uuid,
      renderer:{gpu:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),dpr:gl.getPixelRatio()}}
    if(w.__bl02Benchmark)(w.__bl02Frames??=[]).push(w.__bl02Latest)
    if(w.__bl06Record&&(!w.__bl06Last||performance.now()-w.__bl06Last>40)){(w.__bl06Rows??=[]).push({...w.__bl02Latest,mediaTime:w.__bl02Audio?.currentTime,now:performance.now()/1000});w.__bl06Last=performance.now()}
  })
`+anchor)
// Deterministic controller replay and fixed pose exist only inside this disposable build.
sceneText=sceneText.replace('    const w=window as any', `
    const w=window as any
    if(w.__reviewCase){
      const c=w.__reviewCase;response.current=createBloomMusic()
      const v={version:1,session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,energy:{low:0,mid:0,high:0,overall:0,six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:c.intensity??0,brightness:.5,brightnessValid:true,activity:c.intensity??0},events:[]} as any
      const names=['subBass','bass','lowMids','highMids','presence','air']
      for(let i=0;i<360;i++){
        v.frame=i;v.updatedAtSeconds=i/60
        names.forEach((n,j)=>v.energy.six[n]=c.bands[j])
        if(c.attack&&i>=350){v.energy.six[c.attack]=.424;if(i>=354){v.sequence=1;v.events=[{session:1,sequence:1,band:c.broad,strength:.424,timeSeconds:350/60,emittedAtSeconds:354/60}]}}
        updateBloomMusic(response.current,{read:()=>v},1/60,i/60,1,false)
      }
      v.updatedAtSeconds=6;w.__bl06Override=v;w.__bl06Fresh=false;w.__playing=!!c.playing
      Object.assign(floating.current,{amount:c.playing?1:0,velocity:0,elapsed:12,phase:0,oscillation:1})
      w.__reviewHold=true;w.__reviewCase=null
    }`)
sceneText=sceneText.replace('response.current, reviewReader, delta, now / 1000', 'response.current, reviewReader, w.__reviewHold?0:delta, w.__reviewHold?6:now / 1000')
sceneText=sceneText.replace('??playing,reducedMotion,delta,state.bands', '??playing,reducedMotion,w.__reviewHold?0:delta,state.bands')
// Final material references, not React props or copied controller output.
sceneText=sceneText.replace('stoneAurora:stone.current!', "mountains:scene.children.filter((m:any)=>m.name==='bloom-left-bank'||m.name==='bloom-right-bank').map((m:any)=>({strength:m.material.auroraStrength?.value,color:m.material.auroraColor?.value.toArray()})),fragments:fragmentsRef.current.map((m:any)=>({position:m.position.toArray(),rotation:m.rotation.toArray(),screen:m.position.clone().project(camera).toArray()})),stoneAurora:stone.current!")
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__bl02Latest'));await writeFile(scene,sceneText)
const music=join(root,'src/scenes/bloom/music.ts');await writeFile(music,(await readFile(music,'utf8')).replace('updateAurora(state.ambient, dt, reduced)', 'updateAurora(state.ambient, dt, reduced || !!(window as any).__bl06Freeze)').replace('const ambient = updateAurora', 'if((window as any).__bl06Freeze)state.ambient.time=58.90486225480862\n  const ambient = updateAurora'))
const build=spawnSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,encoding:'utf8'});assert.equal(build.status,0,build.stderr)
const [httpPort,debugPort]=await Promise.all([port(),port()])
const server=spawn(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(httpPort),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:'ignore'})
let ws
const report={baseline,smoke,temporary,errors:[],screenshots:[],checks:[],performance:[],source:'Isolated production build with temporary scalar/resource probes; generated local PCM only. No owner media. Headless performance is not native-device certification.'}
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break}catch{}await pause(100)}assert.ok(pages)
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')report.errors.push(m.params.args.map(x=>x.value||x.description).join(' '))})
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<600;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const _select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 const _snapshot=async name=>{const row=await evaluate('window.__bl02Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name,row});return row}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__bl06Freeze=true;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__bl02Audio=this;return play.apply(this,args)}`})
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!window.__bl02Latest');await pause(400)

 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})

 const zero=()=>({version:1,session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,energy:{low:0,mid:0,high:0,overall:0,six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:0,brightness:.5,brightnessValid:true,activity:0},events:[]})
 const seed=async(hover=false)=>{
   await evaluate(`window.__reviewCase=${JSON.stringify({bands:Array(6).fill(0),intensity:0,playing:hover})};true`);await pause(80)
   await evaluate(`window.__reviewHold=false;window.__bl06Freeze=false;window.__bl06Override=${JSON.stringify(zero())};window.__bl06Fresh=true;window.__playing=${hover};true`)
 }
 const energy=async(bands={},intensity=0)=>evaluate(`Object.assign(window.__bl06Override.energy.six,${JSON.stringify({subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0,...bands})});window.__bl06Override.context.intensity=${intensity};true`)
 const hit=async(band,broad)=>{
   await evaluate(`window.__bl06Override.energy.six.${band}=.424;true`);await pause(50)
   await evaluate(`{const v=window.__bl06Override,t=performance.now()/1000;v.sequence++;v.events=[{session:1,sequence:v.sequence,band:'${broad}',strength:.424,timeSeconds:t-.05,emittedAtSeconds:t}]};true`)
 }
 let frames=[]
 const compact=row=>({dt:row.dt,cost:row.cost,camera:row.camera,input:row.input,floating:row.floating,parallax:row.parallax,response:row.response,delivered:row.delivered})
 async function film(label,seconds){
   const start=Date.now()
   while(Date.now()-start<seconds*1000){
     const begin=Date.now(),time=await evaluate('performance.now()/1000'),row=compact(await evaluate('window.__bl02Latest'))
     const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:90}),path=join(temporary,'film-'+Date.now()+'.jpg')
     await writeFile(path,Buffer.from(shot.data,'base64'));frames.push({time,label,path,row});await pause(Math.max(0,1000/12-(Date.now()-begin)))
   }
 }
 const stamp=seconds=>{const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;return`${h}:${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`}
 async function save(name){
   const trace=frames.map(({path:_path,...r})=>r);await writeFile(join(output,name+'.json'),JSON.stringify(trace))
   await writeFile(join(temporary,'frames.txt'),frames.map((f,i)=>`file '${f.path}'\nduration ${frames[i+1]?frames[i+1].time-f.time:1/12}`).join('\n')+'\n')
   const labels=frames.filter((f,i)=>!i||f.label!==frames[i-1].label)
   const events=labels.map((f,i)=>`Dialogue: 0,${stamp(f.time-frames[0].time)},${stamp((labels[i+1]?.time??frames.at(-1).time+1/12)-frames[0].time)},Default,,0,0,0,,${f.label}`).join('\n')
   await writeFile(join(temporary,'labels.ass'),`[Script Info]\nPlayResX: 1440\nPlayResY: 900\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DejaVu Sans,19,&H00FFFFFF,&H00FFFFFF,&H00202020,&H00202020,0,0,0,0,100,100,0,0,1,1,0,7,40,40,110,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events}\n`)
   const result=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'frames.txt'),'-vf',`subtitles=${join(temporary,'labels.ass')}`,'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(output,name+'.mp4')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr)
   report.checks.push(name+': '+frames.length+' timestamped browser frames, annotated feature controls, no audio');frames=[];console.log(name)
 }
 const group=process.env.ECHO_BLOOM_DEMO??'effects'
 if(group==='performance'){
   await seed(true);await energy({bass:.424,lowMids:.424,highMids:.424,presence:.3,air:.25},.9);await pause(1500)
   for(let n=0;n<3;n++){await evaluate('window.__bl02Frames=[];window.__bl02Benchmark=true;true');await pause(5000);await evaluate('window.__bl02Benchmark=false;true');const rows=await evaluate('window.__bl02Frames.map(r=>({dt:r.dt,cost:r.cost}))'),ms=rows.map(r=>r.dt*1000).sort((a,b)=>a-b);report.performance.push({frames:rows.length,median:ms[Math.floor(ms.length*.5)],p95:ms[Math.floor(ms.length*.95)],max:ms.at(-1),cost:rows.at(-1).cost})}
 }else if(group==='motion'){
   await seed();await film('Inactive: stone rests on water',1);await evaluate('window.__playing=true;true');await film('Playback: gradual ascent; six bands = 0',5)
   await film('QUIET playback: autonomous monolith and independent stone orbits continue',12)
   await evaluate('window.__playing=false;true');await film('Pause: smooth descent',2)
   await evaluate('window.__playing=true;true');await film('Resume during descent: continuous return',3)
   await evaluate('window.__playing=false;true');await film('Stop: return to resting height',5);await save('autonomous-floating')
   await seed(true);await film('Mouse center: neutral orthographic composition',1)
   for(const [label,x,y]of [['Left',5,450],['Right',1435,450],['Up',720,5],['Down',720,895],['Upper-left',5,5],['Lower-right',1435,895]]){
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await film('Pointer '+label+': bounded view; horizon and reflections retained',1.5)
   }
   await evaluate("document.querySelector('canvas').dispatchEvent(new PointerEvent('pointerleave'));true");await film('Pointer leave: smooth neutral return',1.5)
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:450});await film('Pointer left',1)
   await evaluate("window.dispatchEvent(new Event('blur'));true");await film('Window blur event: neutral return',1.5)
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1435,y:5});await film('Reduced motion: pointer ignored; continuous float suppressed',2);await save('mouse-parallax')
 }else{
   if(group!=='water'){
   await seed(true);await film('Trails rest: all six energies = 0',1)
   await energy({lowMids:.141});await film('ROSE body paths: low mids .141; mint and upper-detail lanes idle',2)
   await hit('lowMids','mid');await film('ROSE body onset .424: independently traveling downhill pulses',2.5)
   await energy({highMids:.141});await film('MINT body paths: high mids .141; rose releases',2)
   await hit('highMids','mid');await film('MINT body onset .424: independently traveling downhill pulses',2.5)
   await energy({presence:.141,air:.141});await film('Upper-detail paths: presence and air .141',2)
   await hit('presence','high');await hit('air','high');await film('Presence / air attacks .424: separate detail-route pulses',2.5);await save('mountain-trails')
   await seed(true);await film('Aurora rest: no musical excess',1)
   await energy({bass:.141},.5);await film('Moderate bass .141 / context .5: local surface illumination',3)
   await energy({bass:.424},.9);await film('Strong bass .424 / context .9: mountains, stone, haze and lake',4)
   await energy();await film('Silence: natural release without global brightness lift',3);await save('aurora-surfaces')
   await seed(true);await film('Beam rest: narrow restrained seam',1)
   await energy({highMids:.141});await film('High mids .141: sustained core and recessed stone spill',2)
   await hit('highMids','mid');await film('High-mid attack .424: brief seam accent above baseline',2)
   await energy({highMids:.141});await film('Return to sustained baseline',1.5)
   await energy();await film('Silence: beam returns to restrained rest',2.5);await save('monolith-beam')
   }
   await seed(true);await film('Water resting: subtle intrinsic ripples',1)
   await hit('bass','low');await film('Isolated bass onset .424: expanded high-contrast ring below stone',2.8)
   await energy();await pause(200);await hit('bass','low');await film('Fresh bass onset: new expanding ring, stable origin',2.8);await save('water-ripples')
   await seed();await film('Complete scene: resting',1.5);await evaluate('window.__playing=true;true')
   await energy({subBass:.04,bass:.141,lowMids:.141,highMids:.141,presence:.1,air:.08},.5);await film('Complete scene: moderate calibrated six-band mix',5)
   await energy({subBass:.141,bass:.424,lowMids:.424,highMids:.424,presence:.3,air:.25},.9);await film('Complete scene: energetic sustained mix',3)
   await energy();await pause(200);await hit('bass','low');await hit('lowMids','mid');await hit('highMids','mid');await hit('presence','high');await hit('air','high');await film('Complete scene: fresh qualified attacks and release',3)
   await energy();await film('Quiet passage: light releases; floating continues',3);await save('complete-scene')
   await energy({bass:.424,lowMids:.424,highMids:.424,presence:.3,air:.25},.9)
   for(let n=0;n<3;n++){await evaluate('window.__bl02Frames=[];window.__bl02Benchmark=true;true');await pause(5000);await evaluate('window.__bl02Benchmark=false;true');const rows=await evaluate('window.__bl02Frames.map(r=>({dt:r.dt,cost:r.cost}))'),ms=rows.map(r=>r.dt*1000).sort((a,b)=>a-b);report.performance.push({frames:rows.length,median:ms[Math.floor(ms.length*.5)],p95:ms[Math.floor(ms.length*.95)],max:ms.at(-1),cost:rows.at(-1).cost})}
 }
 assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status='BL07 perceptibility motion captured';console.log(report.status)
}catch(e){report.failure=String(e);throw e}finally{await writeFile(join(output,'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,(process.env.ECHO_BLOOM_DEMO??'effects')+'-capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

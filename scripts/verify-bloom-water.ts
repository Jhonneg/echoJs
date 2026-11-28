// Isolated production builds; generated audio only. Runtime probes never ship.
import {spawn,spawnSync} from 'node:child_process'
import {cp,mkdir,mkdtemp,readFile,readdir,symlink,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:net'
import assert from 'node:assert/strict'

const repository=process.cwd(),baseline=process.env.ECHO_BLOOM_BASELINE==='1',smoke=process.env.ECHO_BL06_SMOKE==='1'
const evidence='docs/evidence/bloom/water-3d'
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
if(baseline)for(const f of ['BloomScene.tsx','reflection.ts'])await cp(join(repository,evidence,'baseline',f+'.txt'),join(root,'src/scenes/bloom',f))
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
      delivered:{stoneAurora:stone.current!.auroraStrength.value,stoneSeam:stone.current!.seamLevel.value,seam:seam.current!.uniforms.seamLevel.value,water:Object.fromEntries(Object.entries(lake.current!.uniforms).map(([k,v])=>[k,v.value?.isTexture?{texture:true,width:v.value.image?.width,height:v.value.image?.height}:v.value?.toArray?v.value.toArray():v.value])),trails:Object.fromEntries(Object.entries(trails.current!.uniforms).map(([k,v])=>[k,v.value?.isTexture?{texture:true,width:v.value.image?.width,height:v.value.image?.height}:v.value?.toArray?v.value.toArray():v.value]))},
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
      const v:Record<string,any>={version:1,session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:0,sampleRate:48000,fftSize:2048,energy:{low:0,mid:0,high:0,overall:0,six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:c.intensity??0,brightness:.5,brightnessValid:true,activity:c.intensity??0},events:[]} as any
      const names=['subBass','bass','lowMids','highMids','presence','air']
      for(let i=0;i<360;i++){
        v.frame=i;v.updatedAtSeconds=i/60
        names.forEach((n,j)=>v.energy.six[n]=c.bands[j])
        if(c.attack!==undefined&&i>=350){v.energy.six[names[c.attack]]=.424;if(i>=354){v.sequence=1;v.events=[{session:1,sequence:1,band:c.broad,strength:.424,timeSeconds:350/60,emittedAtSeconds:354/60}]}}
        updateBloomMusic(response.current,{read:()=>v},1/60,i/60,1,false)
      }
      v.updatedAtSeconds=6;w.__bl06Override=v;w.__bl06Fresh=false;w.__playing=!!c.playing
      Object.assign(floating.current,{amount:c.playing?1:0,velocity:0,elapsed:12,phase:0,oscillation:1})
      w.__reviewHold=true;w.__reviewCase=null
    }`)
sceneText=sceneText.replace('response.current, reviewReader, delta, now / 1000', 'response.current, reviewReader, w.__reviewHold?0:delta, w.__reviewHold?6:now / 1000')
sceneText=sceneText.replace('??playing,reducedMotion,delta,state.bands', '??playing,reducedMotion,w.__reviewHold?0:delta,state.bands')
sceneText=sceneText.replace('    skyMaterial.current.uniforms.atmosphere.value=out.atmosphere', `
    skyMaterial.current.uniforms.atmosphere.value=out.atmosphere
    if(w.__reviewMute==='mountains')for(const m of surfaces.current??surfaces)m.auroraStrength.value=0
    if(w.__reviewMute==='stone')stone.current!.auroraExcess.value=0
    if(w.__reviewMute==='haze')fog.current!.color.copy(colors.baseFog).lerp(colors.light,state.ambient.strength*.12)
    if(w.__reviewMute==='lake')lake.current.uniforms.auroraStrength.value=state.ambient.strength
`)
if(!baseline){
sceneText=sceneText.replace("import { WATER_VIEW }", "import { waterField, sampleWater, WATER_VIEW }")
sceneText=sceneText.replace("const float=updateFloat", "if(w.__waterDemo){floating.current.elapsed=w.__waterDemo.floatTime??12;floating.current.phase=floating.current.elapsed*Math.PI/3;}\n    const float=updateFloat")
sceneText=sceneText.replace('    skyMaterial.current.uniforms.atmosphere.value=out.atmosphere', `
    const demo=w.__waterDemo
    if(demo){lake.current.uniforms.time.value=demo.time;lake.current.uniforms.ringAge.value=demo.age??3;lake.current.uniforms.ringStrength.value=demo.strength??0}
    skyMaterial.current.uniforms.atmosphere.value=out.atmosphere`)
sceneText=sceneText.replace('    w.__bl02Latest={', `
    const lakeMesh=scene.getObjectByName('bloom-water-3d') as any,mat=lakeMesh.material
    w.__waterMaterial??=mat.fragmentShader
    if((w.__waterMode??'normal')!==mat.userData.mode){
      mat.userData.mode=w.__waterMode??'normal';mat.wireframe=w.__waterMode==='wire'
      mat.fragmentShader=w.__waterMode==='neutral'?w.__waterMaterial.replace('gl_FragColor=vec4(color,1.0);','gl_FragColor=vec4(vec3(.15)+vec3(.8)*max(dot(n,normalize(vec3(-.4,.12,.5))),0.0),1.0);'):w.__waterMaterial
      mat.needsUpdate=true
    }
    if(!w.__waterProbeInstalled){
      w.__waterProbeInstalled=true;const original=gl.render.bind(gl),ext=ctx.getExtension('EXT_disjoint_timer_query_webgl2');let depth=0,current:any=null,pending:any[]=[]
      for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
        const raw=(ctx as any)[method].bind(ctx);(ctx as any)[method]=(...args:any[])=>{if(current){current.calls++;const count=args[method.startsWith('drawElements')?1:2],instances=method.endsWith('Instanced')?args[method.startsWith('drawElements')?4:3]:1;current.triangles+=args[0]===ctx.TRIANGLES?count/3*instances:0}return raw(...args)}
      }
      gl.render=((...args:any[])=>{
        const outer=depth++===0,start=performance.now();let query:any=null
        if(outer&&w.__waterPerf){current={calls:0,triangles:0};if(ext&&pending.length<8){query=ctx.createQuery();ctx.beginQuery(ext.TIME_ELAPSED_EXT,query)}}
        try{return original(...args as [any,any])}finally{
          depth--;
          if(outer&&w.__waterValues){
            const l=scene.getObjectByName('bloom-water-3d') as any,virtual=l.getReflectionCamera(args[1]),source=hero.current!.position.clone(),expected=source.clone()
            expected.y=-.04-expected.y;expected.project(args[1]);source.project(virtual)
            w.__waterValues.alignmentError=Math.hypot(source.x+expected.x,source.y-expected.y)
          }
          if(outer&&w.__waterPerf){const row={...current,cpuMs:performance.now()-start,now:performance.now(),gpuMs:null};if(query){ctx.endQuery(ext.TIME_ELAPSED_EXT);pending.push({query,row})}(w.__waterPerfRows??=[]).push(row);current=null
          while(pending.length&&ctx.getQueryParameter(pending[0].query,ctx.QUERY_RESULT_AVAILABLE)){const p=pending.shift();if(!ctx.getParameter(ext.GPU_DISJOINT_EXT))p.row.gpuMs=ctx.getQueryParameter(p.query,ctx.QUERY_RESULT)/1e6;ctx.deleteQuery(p.query)}}
        }
      }) as any
      const reflection=lakeMesh.onBeforeRender;lakeMesh.userData.originalReflection=reflection
      lakeMesh.onBeforeRender=(...args:any[])=>{if(!w.__noReflection)reflection(...args)}
      w.__waterTimer=!!ext
    }
    // Quality replacement creates another lake; attach its disable probe too.
    if(!lakeMesh.userData.originalReflection){const reflection=lakeMesh.onBeforeRender;lakeMesh.userData.originalReflection=reflection;lakeMesh.onBeforeRender=(...args:any[])=>{if(!w.__noReflection)reflection(...args)}}
    w.__waterField=waterField
    const field=sampleWater(.7,3,mat.uniforms.time.value,mat.uniforms.ringAge.value,mat.uniforms.ringStrength.value)
    const virtual=lakeMesh.getReflectionCamera(camera),mirrored=hero.current!.position.clone();mirrored.y=2*${'-0.02'}-mirrored.y
    const actual=hero.current!.position.clone().project(virtual),expected=mirrored.project(camera)
    w.__waterValues={field,timer:!!w.__waterTimer,alignmentError:Math.hypot(actual.x+expected.x,actual.y-expected.y),target:[lakeMesh.getRenderTarget().width,lakeMesh.getRenderTarget().height],vertices:lakeMesh.geometry.attributes.position.count,triangles:lakeMesh.geometry.index.count/3}
    w.__bl02Latest={`)
}
// Final material references, not React props or copied controller output.
sceneText=sceneText.replace('stoneAurora:stone.current!', "mountains:scene.children.filter((m:any)=>m.name==='bloom-left-bank'||m.name==='bloom-right-bank').map((m:any)=>({strength:m.material.auroraStrength?.value,color:m.material.auroraColor?.value.toArray()})),fragments:fragmentsRef.current.map((m:any)=>({position:m.position.toArray(),rotation:m.rotation.toArray(),screen:m.position.clone().project(camera).toArray()})),stoneAurora:stone.current!")
assert.ok(sceneText.includes('reviewReader')&&sceneText.includes('__bl02Latest'));await writeFile(scene,sceneText)
const music=join(root,'src/scenes/bloom/music.ts');await writeFile(music,(await readFile(music,'utf8')).replace('updateAurora(state.ambient, dt, reduced)', 'updateAurora(state.ambient, dt, reduced || !!(window as any).__bl06Freeze)').replace('const ambient = updateAurora', 'if((window as any).__bl06Freeze)state.ambient.time=58.90486225480862\n  const ambient = updateAurora'))
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
 const wait=async expression=>{for(let i=0;i<600;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out '+expression)}
 const select=async(id,value)=>{await evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));true`);await pause(250)}
 const snapshot=async name=>{const row=await evaluate('window.__bl02Latest');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));report.screenshots.push({name,row});return row}
 await send('Runtime.enable');await send('Page.enable');await send('DOM.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__bl06Freeze=true;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__bl02Audio=this;return play.apply(this,args)}`})
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${httpPort}/`)).ok)break}catch{}await pause(100)}
 await send('Page.navigate',{url:`http://127.0.0.1:${httpPort}/`});await wait('!!window.__bl02Latest');await pause(400)

 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
 const cases=[['resting',0,0,false],['moderate',.141,.5,true],['energetic',.424,.9,true]]
 for(const [name,energy,intensity,playing] of cases){
   await evaluate(`window.__reviewCase=${JSON.stringify({bands:Array(6).fill(energy),intensity,playing})};true`);await pause(150);await snapshot(name)
 }
 for(const [name,width,height]of [['wide',1920,810],['portrait',390,844]] as const){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(200);await snapshot(name)
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await select('graphics-quality','low');await snapshot('low')


 if(!baseline){
  report.gpuField=await evaluate(`(()=>{
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=1
    const g=canvas.getContext('webgl2');if(!g||!g.getExtension('EXT_color_buffer_float'))return {available:false}
    const shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s}
    const vertex=shader(g.VERTEX_SHADER,'#version 300 es\\nprecision highp float;precision highp int;in vec2 point;out vec3 field;'+window.__waterField+'\\nvoid main(){field=waterField(point);gl_Position=vec4((float(gl_VertexID)+.5)/32.*2.-1.,0.,0.,1.);gl_PointSize=1.;}')
    const fragment=shader(g.FRAGMENT_SHADER,'#version 300 es\\nprecision highp float;in vec3 field;out vec4 color;void main(){color=vec4(field,1.);}')
    const program=g.createProgram();g.attachShader(program,vertex);g.attachShader(program,fragment);g.linkProgram(program);if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(program));g.useProgram(program)
    const points=new Float32Array(64);for(let i=0;i<32;i++){points[i*2]=-4+i*.31;points[i*2+1]=i%2?.2+i*.19:10+i*2.3}
    const buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,points,g.STATIC_DRAW);const location=g.getAttribLocation(program,'point');g.enableVertexAttribArray(location);g.vertexAttribPointer(location,2,g.FLOAT,false,0,0)
    const texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,texture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA32F,32,1,0,g.RGBA,g.FLOAT,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST)
    const fb=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,fb);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,texture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Float framebuffer incomplete')
    g.viewport(0,0,32,1);const rows:any[]=[]
    for(const time of [0,.5,2.7,13.2])for(const strength of [0,.8]){
      for(const [name,value]of Object.entries({time,ringAge:.6,ringStrength:strength,anchorX:.6,waveStrength:1}))g.uniform1f(g.getUniformLocation(program,name),value)
      g.drawArrays(g.POINTS,0,32);const pixels=new Float32Array(128);g.readPixels(0,0,32,1,g.RGBA,g.FLOAT,pixels)
      rows.push({time,strength,points:Array.from(points),pixels:Array.from(pixels)})
    }
    g.deleteFramebuffer(fb);g.deleteTexture(texture);g.deleteBuffer(buffer);g.deleteProgram(program);g.deleteShader(vertex);g.deleteShader(fragment);g.getExtension('WEBGL_lose_context')?.loseContext();return {available:true,rows}
  })()`)
  if(report.gpuField.available){
    const {sampleWater}=await import(join(repository,'src/scenes/bloom/water.ts'));let error=0
    for(const r of report.gpuField.rows)for(let i=0;i<32;i++){
      const expected=sampleWater(r.points[i*2],r.points[i*2+1],r.time,.6,r.strength)
      for(const [j,key]of ['height','dx','dz'].entries())error=Math.max(error,Math.abs(expected[key]-r.pixels[i*4+j]))
    }
    report.gpuField.maxAbsoluteError=error;assert.ok(error<.0001,'GPU displacement/gradients agree with CPU reference')
  }
 }

 if(smoke){
  const frames=join(output,'frames');await mkdir(frames,{recursive:true});report.hoverMotion=[]
  await evaluate('window.__reviewCase={bands:[.424,.424,.424,.424,.424,.424],intensity:.9,playing:true};true');await pause(100)
  for(let frame=0;frame<48;frame++){
    const t=frame/8;await evaluate(`window.__waterDemo={time:${6+t},floatTime:${12+t},age:3,strength:0};true`);await pause(40)
    const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:86});await writeFile(join(frames,String(frame).padStart(4,'0')+'.jpg'),Buffer.from(shot.data,'base64'))
    report.hoverMotion.push({elapsed:t,values:await evaluate('window.__waterValues'),row:await evaluate('window.__bl02Latest')})
  }
  const movie=spawnSync('ffmpeg',['-y','-framerate','8','-i',join(frames,'%04d.jpg'),'-c:v','libx264','-crf','21','-pix_fmt','yuv420p',join(output,'moving-monolith-reflections.mp4')],{encoding:'utf8'});assert.equal(movie.status,0,movie.stderr)
  const heights=report.hoverMotion.map(r=>r.row.hero.position[1]);report.hoverSpan=Math.max(...heights)-Math.min(...heights);assert.ok(report.hoverSpan>.21)
  const fs=await import('node:fs/promises');await fs.rm(frames,{recursive:true})
 }
 if(!baseline&&!smoke){
  await select('graphics-quality','standard');await pause(300)
  const fs=await import('node:fs/promises');const filmDir=join(output,'frames');await mkdir(filmDir,{recursive:true})
  await evaluate(`window.__reviewCase={bands:[0,0,0,0,0,0],intensity:0,playing:true,attack:1,broad:'low'};true`);await pause(100)
  report.qualifiedLow=await snapshot('qualified-low-event');assert.ok(report.qualifiedLow.delivered.water.ringStrength>0)
  report.motion=[]
  const segments=[['Gentle ambient water',0,3,0,'normal'],['Strong aurora reflections',.424,3,0,'normal'],['Expanding musical ripple',.424,0,1,'normal'],['Neutral shading: displaced geometry',0,3,0,'neutral'],['Wireframe: displaced geometry',0,3,0,'wire']]
  let index=0
  for(const [label,energy,age,strength,mode]of segments){
   await evaluate(`window.__reviewCase=${JSON.stringify({bands:Array(6).fill(energy),intensity:energy? .9:0,playing:true})};window.__waterMode=${JSON.stringify(mode)};true`);await pause(80)
   for(let frame=0;frame<36;frame++){
    const t=frame/12;await evaluate(`window.__waterDemo={time:${6+t},age:${age===0?t:age},strength:${strength},floatTime:${12+t}};true`);await pause(25)
    const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:86});await writeFile(join(filmDir,String(index++).padStart(4,'0')+'.jpg'),Buffer.from(shot.data,'base64'))
    if(label==='Expanding musical ripple'&&[6,12,20].includes(frame))await snapshot('ripple-'+frame)
    if(frame%12===0)report.motion.push({label,elapsed:t,values:await evaluate('window.__waterValues'),row:await evaluate('window.__bl02Latest')})
   }
   await snapshot(['ambient-motion','aurora-motion','ripple','neutral-geometry','wireframe-geometry'][segments.findIndex(x=>x[0]===label)])
  }
  const ass=`[Script Info]\nScriptType: v4.00+\nPlayResX:1440\nPlayResY:900\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,BackColour,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV\nStyle: Default,DejaVu Sans,24,&H00FFFFFF,&H90000000,3,1,0,8,20,20,85\n[Events]\nFormat: Layer,Start,End,Style,Text\n`+segments.map(([name],i)=>`Dialogue: 0,0:00:${String(i*3).padStart(2,'0')}.00,0:00:${String((i+1)*3).padStart(2,'0')}.00,Default,${name} — controlled test signals; fixed camera`).join('\n')
  await writeFile(join(output,'labels.ass'),ass)
  const movie=spawnSync('ffmpeg',['-y','-framerate','12','-i',join(filmDir,'%04d.jpg'),'-vf',`ass=${join(output,'labels.ass')}`,'-c:v','libx264','-crf','21','-pix_fmt','yuv420p',join(output,'water-demonstration.mp4')],{encoding:'utf8'});assert.equal(movie.status,0,movie.stderr)
  await fs.rm(filmDir,{recursive:true})
  await evaluate(`window.__waterMode='normal';window.__waterDemo=null;true`);await pause(250)
  await mkdir(filmDir,{recursive:true})

  report.parallaxMotion=[]
  for(let frame=0;frame<72;frame++){
    const t=frame/12,phase=t/6*Math.PI*2,x=720+700*Math.sin(phase),y=450+430*Math.sin(phase*2)
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await evaluate(`window.__waterDemo={time:${6+t},age:3,strength:0,floatTime:${12+t}};true`);await pause(40)
    const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:86});await writeFile(join(filmDir,String(frame).padStart(4,'0')+'.jpg'),Buffer.from(shot.data,'base64'))
    if(frame%12===0)report.parallaxMotion.push({elapsed:t,values:await evaluate('window.__waterValues'),row:await evaluate('window.__bl02Latest')})
  }
  const parallaxMovie=spawnSync('ffmpeg',['-y','-framerate','12','-i',join(filmDir,'%04d.jpg'),'-c:v','libx264','-crf','21','-pix_fmt','yuv420p',join(output,'mouse-parallax.mp4')],{encoding:'utf8'});assert.equal(parallaxMovie.status,0,parallaxMovie.stderr)
  await fs.rm(filmDir,{recursive:true});await evaluate('window.__waterDemo=null;true')
  report.views=[]
  for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]] as const){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
    for(const [label,x,y]of [['left-top',2,2],['right-bottom',width-2,height-2],['left-bottom',2,height-2],['right-top',width-2,2]] as const){
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(700)
      report.views.push({name,label,values:await evaluate('window.__waterValues'),row:await snapshot(name+'-'+label)})
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await evaluate(`document.querySelector('canvas').dispatchEvent(new PointerEvent('pointerleave'));true`);await pause(700)
  report.neutralReturn=await evaluate('window.__bl02Latest.parallax')
  report.performance=[]
  for(const quality of ['standard','low']){
    await select('graphics-quality',quality);await pause(300)
    for(const disabled of [false,true]){
      await evaluate(`window.__noReflection=${disabled};window.__waterPerf=true;true`);await pause(500)
      for(let run=0;run<3;run++){
        await evaluate('window.__waterPerfRows=[];true');await pause(2000)
        const rows=await evaluate('window.__waterPerfRows'),values=await evaluate('window.__waterValues'),row=await evaluate('window.__bl02Latest')
        const stats=a=>{a=a.filter(x=>Number.isFinite(x)).sort((a,b)=>a-b);return {n:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]}}
        report.performance.push({quality,reflection:!disabled,run,values,renderer:row.renderer,cost:row.cost,cpuMs:stats(rows.map(x=>x.cpuMs)),gpuMs:stats(rows.filter(x=>x.gpuMs!==null).map(x=>x.gpuMs)),frameMs:stats(rows.slice(1).map((x,i)=>x.now-rows[i].now)),calls:stats(rows.map(x=>x.calls)),triangles:stats(rows.map(x=>x.triangles))})
      }
    }
  }
  await evaluate('window.__waterPerf=false;window.__noReflection=false;true')

  await mkdir(filmDir,{recursive:true})
  for(let frame=0;frame<36;frame++){
    await evaluate(`window.__waterDemo={time:${6+frame/12},age:${frame/12},strength:.8,floatTime:${12+frame/12}};true`);await pause(30)
    const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:86});await writeFile(join(filmDir,String(frame).padStart(4,'0')+'.jpg'),Buffer.from(shot.data,'base64'))
  }
  const lowMovie=spawnSync('ffmpeg',['-y','-framerate','12','-i',join(filmDir,'%04d.jpg'),'-c:v','libx264','-crf','21','-pix_fmt','yuv420p',join(output,'low-water.mp4')],{encoding:'utf8'});assert.equal(lowMovie.status,0,lowMovie.stderr)
  await fs.rm(filmDir,{recursive:true});await evaluate('window.__waterDemo=null;true')
  report.resources=[]
  for(let cycle=0;cycle<4;cycle++)for(const quality of ['standard','low']){await select('graphics-quality',quality);await pause(120);report.resources.push({cycle,quality,cost:await evaluate('window.__bl02Latest.cost')})}
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await evaluate('window.__reviewHold=false;window.__bl06Override=null;window.__waterDemo=null;true');await pause(300)
  const reducedA=await evaluate('window.__bl02Latest');await pause(800);const reducedB=await evaluate('window.__bl02Latest')
  report.reduced={a:reducedA.response.time,b:reducedB.response.time,parallax:reducedB.parallax};assert.equal(report.reduced.a,report.reduced.b)
  assert.ok(report.views.every(v=>v.values.alignmentError<1e-9),'world reflection projection matches mirrored hero')
  assert.ok(report.motion.some(v=>Math.abs(v.values.field.height)>.001))
  report.sceneReplacement=[]
  for(let cycle=0;cycle<3;cycle++){
    await select('scene-select','nocturne');await evaluate('window.__bl02Latest=null;true');await select('scene-select','bloom');await wait('!!window.__bl02Latest');await pause(400)
    report.sceneReplacement.push({cycle,cost:await evaluate('window.__bl02Latest.cost')})
  }
  assert.ok(report.sceneReplacement.every(r=>r.cost.geometries===9&&r.cost.textures===2),'scene remount releases water resources')

 }
 assert.deepEqual(report.errors,[])
 report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(await manifest());assert.ok(report.sourceUnchanged)
 report.status='Bloom water visual, geometry, reflection, performance and reduced-motion checks passed';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,baseline?'capture-source-manifest.json':'source-manifest.json'),JSON.stringify(before,null,2));await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill()}

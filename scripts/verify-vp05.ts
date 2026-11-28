// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const root=process.env.ECHO_VP05_ROOT||process.cwd()
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp05-'+(process.env.ECHO_VP05_LABEL||'final')+''))
const freePort = () => new Promise<any>(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors:any[]=[], evidence:Record<string,any>={ date:'2026-11-22', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
try {
  let pages
  for(let i=0;i<80;i++){try{pages=await(await fetch(`http://127.0.0.1:${browserPort}/json`)).json();break}catch{}await pause(100)}
  assert.ok(pages)
  ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
  let id=0;const pending=new Map()
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
  const send=(method,params={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
  const set=options=>evaluate(`window.__mi05.set(${JSON.stringify(options)})`),read=()=>evaluate('window.__mi05.read()')
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  evidence.label=process.env.ECHO_VP05_LABEL||'final';evidence.mode=process.env.ECHO_VP05_MODE||'comparison';evidence.root=root
  if(evidence.mode==='tones'){
    evidence.tones=[]
    for(const [frequency,band] of [[110,'bass'],[469,'lowMids'],[1500,'highMids'],[4000,'presence'],[8000,'air']] as const)for(const amplitude of [.04,.24]){
      await evaluate(`window.__mi05.tone(${frequency},${amplitude})`);await wait('window.__mi05.read().reviewTime>1.1');const state=await read(),six=state.features
      assert.equal(Object.entries<any>(six).sort((a,b)=>b[1]-a[1])[0][0],band)
      evidence.tones.push({frequency,band,amplitude,six,sun:state.sun,scale:state.scale,contours:state.contours,pulse:state.pulse})
      if(amplitude===.24){const result=await send('Page.captureScreenshot');const file='tone-'+frequency+'.jpg';await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));evidence.screenshots.push(file)}
    }
    for(const band of ['bass','lowMids','highMids','presence','air']){const cases=evidence.tones.filter(t=>t.band===band);assert.ok(cases[1].six[band]>cases[0].six[band]*2)}
    await evaluate('window.__mi05.stopReview()');evidence.checks=['Five actual generated frequencies at two amplitudes through unchanged production analysis','Dominant fixed band and soft/loud ordering; real FFT overlap retained']
  }else{
    await evaluate('window.__mi05.review(false,false,true)');evidence.fixture=[];const clip:any[]=[];let next=0;const times=[1,4,9,14,17.3,20]
    for(let i=0;i<230;i++){
      await pause(100);const state=await read(),time=state.reviewTime;if(time===null)continue
      assert.deepEqual(state.camera,{x:0,y:3.5,z:24,type:'PerspectiveCamera'});assert.ok(state.geometries<=7)
      evidence.fixture.push({time,camera:state.camera,distance:state.distance,scale:state.scale,sun:state.sun,pulse:state.pulse,features:state.features,contours:state.contours})
      if(time>=8&&time<10){const file='clip-'+String(clip.length).padStart(3,'0')+'.jpg';const result=await send('Page.captureScreenshot',{format:'jpeg',quality:92});await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));clip.push({file,time})}
      if(next<times.length&&time>=times[next]){const result=await send('Page.captureScreenshot');const file='fixed-'+times[next]+'.png';await writeFile(join(temporary,file),Buffer.from(result.data,'base64'));evidence.screenshots.push(file);next++}
      if(time>=20.8)break
    }
    assert.equal(next,times.length);assert.ok(clip.length>5)
    const concat=clip.map((f,i)=>`file '${join(temporary,f.file)}'\nduration ${i<clip.length-1?clip[i+1].time-f.time:.1}`).join('\n');await writeFile(join(temporary,'comparison.txt'),concat)
    const converted=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'comparison.txt'),'-vf','fps=30','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(temporary,'comparison.mp4')],{encoding:'utf8'});assert.equal(converted.status,0,converted.stderr)
    evidence.clip=clip;await evaluate('window.__mi05.stopReview()')
    await writeFile(join(temporary,'verification-partial.json'),JSON.stringify(evidence,null,2))
    for(const quality of ['standard','low']){
      await set({profile:'candidate',quality,stationary:true,moving:true,repeatEvents:true,energy:.3,activity:.7,intensity:.7,lowMids:.25,highMids:.2,presence:.3,air:.3});await pause(1500);await evaluate('window.__mi05.trial(true)');await pause(5000)
      const frames=await evaluate('window.__mi05.trial(false)');frames.sort((a,b)=>a-b);const state=await read();assert.ok(state.geometries<=7)
      evidence.performance.push({quality,samples:frames.length,p95:frames[Math.floor(frames.length*.95)],dpr:state.dpr,camera:state.camera})
    }
    evidence.authored=await evaluate('window.__mi05.authored()');assert.ok(evidence.authored.every(g=>g.positions&&g.normals&&!g.deforms))
    evidence.checks=['Same VP00 generated PCM with fixed1440x810 camera and comparable source timestamps','Composited busy-section video and screenshots; matched5-second quality cadence samples']
  }
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VP05 ${evidence.label} ${evidence.mode}: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

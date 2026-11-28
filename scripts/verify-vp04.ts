// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp04-'))
const freePort = () => new Promise<any>(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
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
  await set({profile:'candidate',stationary:true,moving:true,repeatEvents:false,energy:0,intensity:0,activity:0,lowMids:0,highMids:0,presence:0,air:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(1000)
  const shot=async file=>{const r=await send('Page.captureScreenshot',{format:'jpeg',quality:92});await writeFile(join(temporary,file),Buffer.from(r.data,'base64'));evidence.screenshots.push(file)}
  evidence.sweeps=[]
  for(const energy of [.03,.1,.3]){
    await set({energy});await evaluate('window.__mi05.reset()');await pause(3000)
    const sustained=await read();assert.equal(sustained.pulse,0);assert.ok(sustained.valleyWaves.every((v,i)=>i%4!==1||v===0))
    assert.ok(Math.abs(sustained.scale-(1+.15*Math.min(1,energy/.35)))<.001)
    await shot('sustain-'+energy+'.jpg');await evaluate(`window.__mi05.event(${energy})`);await pause(65);const attack=await read();assert.ok(attack.scale>sustained.scale&&attack.scale<=1.2)
    assert.ok(attack.corona>0&&attack.corona<=attack.pulse);await shot('attack-'+energy+'.jpg');evidence.sweeps.push({energy,sustained,attack})
  }
  assert.ok(evidence.sweeps[2].attack.scale>evidence.sweeps[0].attack.scale)
  await set({stationary:false,energy:.3});await evaluate('window.__mi05.reset()');await pause(400)
  const start=Date.now(),frames:any[]=[];await evaluate('window.__mi05.event(.3)')
  for(let i=0;i<=20;i++){
    await pause(Math.max(0,start+i*100-Date.now()));const state=await read();const file='one-event-'+String(i).padStart(3,'0')+'.jpg';await shot(file);frames.push({file,elapsed:(Date.now()-start)/1000,state})
  }
  const concat=frames.map((frame,i)=>`file '${join(temporary,frame.file)}'\nduration ${i<frames.length-1?frames[i+1].elapsed-frame.elapsed:.1}`).join('\n');await writeFile(join(temporary,'one-event.txt'),concat)
  const converted=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,'one-event.txt'),'-vf','fps=30','-t','2','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(temporary,'one-event.mp4')],{encoding:'utf8'});assert.equal(converted.status,0,converted.stderr)
  evidence.oneEvent=frames;assert.ok(frames.some(f=>f.state.pulse>.2));assert.ok(frames.some(f=>f.elapsed>1&&f.state.pulse<.02&&f.state.valleyWaves.some((v,i)=>i%4===1&&v>.1)))
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait('window.__mi05?.read()?.chunks===4');await evaluate('window.__mi05.review(false,true,true)');evidence.mixed=[]
  let next=0;const times=[1,4,9,14,17.3,20]
  for(let i=0;i<230;i++){
    await pause(100);const state=await read();if(state.reviewTime!==null){evidence.mixed.push(state);assert.ok(state.scale<=1.2&&state.pulse<=1&&state.calls<=7&&state.geometries<=7)
      if(next<times.length&&state.reviewTime>=times[next]){await shot('mixed-'+times[next]+'.jpg');next++}
      if(state.reviewTime>=20.8)break
    }
  }
  assert.equal(next,times.length)
  const quiet=evidence.mixed.filter(s=>s.reviewTime>=2&&s.reviewTime<7),busy=evidence.mixed.filter(s=>s.reviewTime>=7&&s.reviewTime<13),sustain=evidence.mixed.filter(s=>s.reviewTime>=14&&s.reviewTime<15.5)
  const peak=(rows,key)=>Math.max(...rows.map(s=>s[key]));evidence.sections={quiet:{sun:peak(quiet,'sun'),scale:peak(quiet,'scale')},busy:{sun:peak(busy,'sun'),scale:peak(busy,'scale')},sustainPulse:peak(sustain,'pulse')}
  assert.ok(evidence.sections.busy.sun>evidence.sections.quiet.sun);assert.ok(evidence.sections.busy.scale>evidence.sections.quiet.scale);assert.ok(evidence.sections.sustainPulse<.05)
  await evaluate('window.__mi05.stopReview()');await set({profile:'candidate',energy:.3,moving:true,repeatEvents:true,lowMids:.2,highMids:0,presence:.3,air:.3})
  evidence.viewports=[]
  for(const quality of ['standard','low'])for(const [width,height] of [[1440,810],[810,1440],[1920,810]] as const){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality});await pause(400);const file=quality+'-'+width+'x'+height+'.jpg';await shot(file);evidence.viewports.push({quality,width,height,file})}
  evidence.checks=['Ordered quiet/strong sustained body and separate onset accent within20% cap','One low event: immediate sun accent and later independently traveling ground wave','Generated production-analysis quiet/busy/sustain/mixed sections; six quality/viewports']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VP04 balance verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

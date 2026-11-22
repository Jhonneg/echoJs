// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vp02-'))
const freePort = () => new Promise(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors=[], evidence={ date:'2026-11-22', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
try {
  let pages
  for(let i=0;i<80;i++){try{pages=await(await fetch(`http://127.0.0.1:${browserPort}/json`)).json();break}catch{}await pause(100)}
  assert.ok(pages)
  ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}))
  let id=0;const pending=new Map()
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '))})
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error(`${method} timed out`))},30000).unref()})
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error(`Timed out ${expression}`)}
  const set=options=>evaluate(`window.__mi05.set(${JSON.stringify(options)})`),read=()=>evaluate('window.__mi05.read()')
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  await set({profile:'candidate',stationary:true,moving:false,repeatEvents:false,energy:0,activity:0,intensity:0,lowMids:0,highMids:0,presence:0,air:0});await evaluate('window.__mi05.reset()');await wait('window.__mi05.read().weight===1');await pause(1500)
  const shot=async file=>{const r=await send('Page.captureScreenshot',{format:'jpeg',quality:92});await writeFile(join(temporary,file),Buffer.from(r.data,'base64'))}
  evidence.streaks=[]
  await set({lowMids:.25,highMids:0});await pause(2000);assert.ok(Math.abs((await read()).contours.light-.25)<.005);assert.equal((await read()).contours.streak,0)
  await shot('low-mids.jpg');await set({lowMids:0});await pause(3000)
  for(const [mode,strength] of [['stationary-weak',.06],['stationary-strong',.22],['moving-strong',.22]]) {
    const moving=mode.startsWith('moving');await set({stationary:!moving,moving,energy:moving?.35:0,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await pause(200)
    const start=Date.now(),frames=[];await set({highMids:strength})
    for(let i=0;i<=20;i++){
      await pause(Math.max(0,start+i*100-Date.now()));const state=await read();const file=mode+'-'+String(i).padStart(3,'0')+'.jpg';await shot(file);frames.push({file,elapsed:(Date.now()-start)/1000,state})
      assert.ok(state.geometries<=7&&state.geometries>=6);assert.ok(state.chunks<=4&&state.chunks>=3)
    }
    const concat=frames.map((frame,i)=>`file '${join(temporary,frame.file)}'\nduration ${i<frames.length-1?frames[i+1].elapsed-frame.elapsed:.1}`).join('\n');await writeFile(join(temporary,mode+'.txt'),concat)
    const converted=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',join(temporary,mode+'.txt'),'-vf','fps=30','-t','2','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(temporary,mode+'.mp4')],{encoding:'utf8'});assert.equal(converted.status,0,converted.stderr)
    assert.ok(frames.some(f=>f.state.contours.streak>0));assert.equal(frames.at(-1).state.contours.streak,0)
    if(!moving)for(const f of frames)assert.deepEqual(f.state.camera,{x:0,y:3.5,z:24,type:'PerspectiveCamera'})
    evidence.streaks.push({mode,strength,frames});await set({highMids:0,moving:false,energy:0});await pause(1500)
  }
  const weak=Math.max(...evidence.streaks[0].frames.map(f=>f.state.contours.streak)),strong=Math.max(...evidence.streaks[1].frames.map(f=>f.state.contours.streak));assert.ok(strong>weak);evidence.peakStreak={weak,strong}
  await set({energy:1,moving:true,highMids:0});await pause(1500);assert.equal((await read()).contours.streak,0);assert.equal((await read()).contours.light,0)
  await set({energy:0,highMids:.4,gain:0});await pause(200);assert.equal((await read()).contours.streak,0);await set({gain:1});await pause(200);assert.equal((await read()).contours.streak,0)
  await set({highMids:0});await pause(300);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await set({highMids:.4});await pause(150);assert.equal((await read()).contours.streak,0);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await set({highMids:0,lowMids:0,moving:false});await pause(400)
  evidence.viewports=[]
  for(const quality of ['standard','low'])for(const [width,height] of [[1440,810],[810,1440],[1920,810]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality,highMids:0});await pause(400);await set({highMids:.22});await pause(350);const file=quality+'-'+width+'x'+height+'.jpg';await shot(file);evidence.viewports.push({quality,width,height,file})}
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait('window.__mi05?.read()?.chunks===4');await evaluate('window.__mi05.review(false,true,true)');evidence.fixture=[]
  for(const time of [4,9,14,17.3,20]){await wait(`window.__mi05.read().reviewTime>=${time}`);const state=await read();const file='moving-fixture-'+time+'.jpg';await shot(file);evidence.fixture.push({time,actual:state.reviewTime,file,camera:state.camera,distance:state.distance})}
  await evaluate('window.__mi05.stopReview()')
  await writeFile(join(temporary,'verification-partial.json'),JSON.stringify(evidence,null,2))
  evidence.performance=[]
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  for(const quality of ['standard','low']){await set({quality,stationary:false,moving:true,repeatEvents:true,energy:.35});await pause(800);await evaluate('window.__mi05.trial(true)');await pause(5000);const frames=await evaluate('window.__mi05.trial(false)');frames.sort((a,b)=>a-b);evidence.performance.push({quality,samples:frames.length,p95:frames[Math.floor(frames.length*.95)]})}
  evidence.checks=['Low-mid sustained light and separate weak/strong high-mid traveling heads; two-second fixed/moving composited proof','Bass isolation and sustain/no retrigger; zero/reduced/no replay','Same VP00 source, six quality/viewports and bounded resources']
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='generated checks passed; owner appearance/music review pending'
  console.log(`PASS VP02 verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

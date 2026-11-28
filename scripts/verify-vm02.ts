// Generated features/audio only. Never invokes native capture or opens private files.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-vm02-'))
const freePort = () => new Promise<any>(resolve => { const s = createServer(); s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p))}) })
const [port, browserPort] = await Promise.all([freePort(),freePort()])
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'})
const browser=spawn(process.env.ECHO_BROWSER||'brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${join(temporary,'profile')}`,`--remote-debugging-port=${browserPort}`,'about:blank'],{stdio:'ignore'})
let ws
const errors:any[]=[], evidence:Record<string,any>={ date:'2026-11-21', generatedOnly:true, checks:[], screenshots:[], performance:[], errors }
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
  const screenshot=async name=>{const r=await send('Page.captureScreenshot');await writeFile(join(temporary,name+'.png'),Buffer.from(r.data,'base64'));return join(temporary,name+'.png')}
  const pixels=path=>{const r=spawnSync('magick',[path,'-depth','8','RGB:-'],{maxBuffer:10000000});assert.equal(r.status,0);return r.stdout}
  const lightStats=(path,baseline)=>{
    const data=pixels(path);let luminance=0,x=0,y=0,changed=0,sky=0
    const linear=v=>v/255<=.04045?v/255/12.92:((v/255+.055)/1.055)**2.4
    for(let i=0;i<data.length;i+=3){const at=i/3,px=at%1440,py=Math.floor(at/1440),difference=Math.max(0,.2126*(linear(data[i])-linear(baseline[i]))+.7152*(linear(data[i+1])-linear(baseline[i+1]))+.0722*(linear(data[i+2])-linear(baseline[i+2])))
      if(difference>.0001){changed++;if(py<200)sky++;luminance+=difference;x+=px*difference;y+=py*difference}}
    return {luminance,changed,coverage:changed/(1440*810),centroid:[x/Math.max(luminance,1e-12),y/Math.max(luminance,1e-12)],sky}
  }
  await send('Runtime.enable');await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/src/dev/mi05/index.html`});await wait(`window.__mi05?.read()?.chunks===4`)
  await set({profile:'candidate',energy:0,moving:false,stationary:true,lowMids:0,highMids:0});await evaluate('window.__mi05.reset()');await pause(800)
  evidence.authored=await evaluate('window.__mi05.authored()');assert.ok(evidence.authored.every(x=>x.positions&&x.normals&&!x.deforms))
  const pose=(await read()).camera
  const resting=await screenshot('resting'),baseline=pixels(resting);evidence.brightness={low:[],high:[]}
  for(const level of [.1,.3,.6,1]) {
    await set({fixedLight:level,fixedStreak:0,fixedProgress:.3});await pause(100)
    const low=await screenshot('low-'+level);evidence.brightness.low.push({level,...lightStats(low,baseline)})
    await set({fixedLight:0,fixedStreak:level,fixedProgress:.3});await pause(100)
    const high=await screenshot('high-'+level);evidence.brightness.high.push({level,...lightStats(high,baseline)})
    assert.deepEqual((await read()).camera,pose)
  }
  for(const band of ['low','high']){const rows=evidence.brightness[band];for(let i=1;i<rows.length;i++)assert.ok(rows[i].luminance>rows[i-1].luminance);assert.ok(rows.at(-1).luminance/rows[0].luminance>2);assert.ok(rows.at(-1).coverage<.08);assert.equal(rows.at(-1).sky,0)}
  await set({fixedLight:0,fixedStreak:.8,fixedProgress:.15});await pause(100);const a=await screenshot('streak-head-a')
  await set({fixedProgress:.6});await pause(100);const b=await screenshot('streak-head-b')
  evidence.movement={a:lightStats(a,baseline),b:lightStats(b,baseline),camera:pose};assert.ok(Math.hypot(...evidence.movement.a.centroid.map((v,i)=>v-evidence.movement.b.centroid[i]))>25)
  assert.deepEqual((await read()).camera,pose)
  await set({fixedLight:null,fixedStreak:null,fixedProgress:null})
  // Actual generated PCM through unchanged production analysis, still with fixture-only stationary camera.
  await evaluate('window.__mi05.review(false)');await wait(`window.__mi05.read().reviewTime>1.5`)
  const sample=async(time,label)=>{await wait(`window.__mi05.read().reviewTime>=${time}`);const state=await read();assert.deepEqual(state.camera,pose);evidence[label]=state;await screenshot(label);return state}
  const silence=await sample(1.6,'silence');assert.ok(silence.contours.light<.001&&silence.contours.streak===0)
  const low=await sample(5.8,'low-mids-only');assert.ok(low.features.lowMids>.1&&low.contours.light>.1&&low.contours.streak===0)
  const weak=await sample(8.68,'high-weak');assert.ok(weak.contours.streak>0)
  const strong=await sample(10.18,'high-strong');assert.ok(strong.contours.streak>weak.contours.streak*1.5)
  const bass=await sample(13,'bass-only');assert.ok(bass.features.bass>.1&&bass.contours.streak===0&&bass.contours.light<.005)
  const mixed=await sample(18,'mixed-generated-music');assert.ok(mixed.features.lowMids>.05&&mixed.contours.light>.05)
  await evaluate('window.__mi05.stopReview()')
  evidence.checks.push('Stationary-camera silence, low-mid-only, high-mid-only weak/strong, bass-only and generated mixed musical PCM through unchanged analysis')
  // Requested recording: generated scene only, with timeline labels. No capture picker/private input.
  const recording=await evaluate('window.__mi05.review(true)');await writeFile(join(temporary,'vm02-stationary-review.webm'),Buffer.from(recording,'base64'))
  evidence.recording={file:'vm02-stationary-review.webm',generatedOnly:true,videoOnly:true,nominalFps:30,seconds:21,phases:'rest, low-mid quiet/strong sustain, return, high-mid weak/strong transient, bass-only, generated mixed music'}
  for(const quality of ['standard','low'])for(const [width,height,label] of [[1440,810,'desktop'],[390,844,'portrait'],[1920,810,'wide']] as const){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await set({quality,fixedLight:.35,fixedStreak:.8,fixedProgress:.4});await pause(150);await screenshot(quality+'-'+label)
    const state=await read();assert.equal(state.calls,7);assert.equal(state.geometries,7);assert.ok(state.buffers.every(b=>b.positions===0&&b.normals===0))
  }
  await set({fixedLight:null,fixedStreak:null,fixedProgress:null,energy:0,lowMids:.4,highMids:0});await pause(300);await set({highMids:.8});await wait(`window.__mi05.read().contours.streak>0`)
  await set({gain:0});await pause(100);assert.equal((await read()).contours.streak,0);assert.equal((await read()).contours.light,0)
  await set({gain:1});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300);assert.equal((await read()).contours.streak,0)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await set({ticking:false});await pause(300);assert.equal((await read()).contours.streak,0)
  evidence.checks.push('Measured rendered energy/brightness ordering, restricted contour coverage, moving head at identical camera pose, authored buffers/resources, quality/responsive, zero/reduced/stale')
  evidence.environment={browser:await evaluate('navigator.userAgent'),renderer:(await read()).renderer}
  assert.deepEqual(errors,[]);evidence.status='IMPLEMENTED — AWAITING REVIEW'
  console.log(`PASS VM02 refinement verification: ${temporary}`)
} catch(error) { evidence.failure=String(error);throw error }
finally {await writeFile(join(temporary,'verification.json'),JSON.stringify(evidence,null,2));ws?.close();browser.kill();server.kill()}

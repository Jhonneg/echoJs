// Synthetic-only browser verification. Run after npm run build. Uses installed Brave/CDP;
// Repeatable CDP runner; Playwright may also smoke-test the lab. Never opens a capture picker or user file.
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-mi01-'))
const freePort = () => new Promise<any>((resolve, reject) => { const socket = createServer(); socket.on('error', reject); socket.listen(0, '127.0.0.1', () => { const port = (socket.address() as {port:number}).port; socket.close(() => resolve(port)) }) })
const [port, browserPort] = await Promise.all([freePort(), freePort()])
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
const browser = spawn(process.env.ECHO_BROWSER || 'brave', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', `--user-data-dir=${join(temporary, 'profile')}`, `--remote-debugging-port=${browserPort}`, 'about:blank'], { stdio: 'ignore' })
let ws
const errors:any[]=[], downloads:any[]=[], downloadEvents:any[]=[]
try {
  let pages
  for (let i = 0; i < 80; i++) { try { pages = await (await fetch(`http://127.0.0.1:${browserPort}/json`)).json(); break } catch {} await pause(100) }
  assert.ok(pages, 'Browser must start')
  ws = new WebSocket(pages[0].webSocketDebuggerUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let id = 0; const pending = new Map()
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message) }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value || a.description).join(' '))
    if(message.method==='Browser.downloadWillBegin'||message.method==='Browser.downloadProgress')downloadEvents.push({method:message.method,...message.params})
    if (message.method === 'Browser.downloadProgress' && message.params.state === 'completed') downloads.push(message.params.guid)
  })
  const send = (method, params = {}) => new Promise<any>((resolve, reject) => {
    const request = ++id
    pending.set(request, message => message.error ? reject(Error(JSON.stringify(message.error))) : resolve(message.result))
    ws.send(JSON.stringify({ id: request, method, params }))
    setTimeout(() => { if (pending.delete(request)) reject(Error(`${method} timed out`)) }, 30000).unref()
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description)
    return result.result.value
  }
  const waitFor = async (expression, timeout = 180000) => {
    const end = Date.now() + timeout
    while (Date.now() < end) { if (await evaluate(expression)) return; await pause(100) }
    throw Error(`Timed out: ${expression}`)
  }
  const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`)
  const select = (id, value) => evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)}`)
  const screenshot = async name => { const result = await send('Page.captureScreenshot'); await writeFile(join(temporary, `${name}.png`), Buffer.from(result.data, 'base64')) }
  await send('Runtime.enable'); await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const NativeAudio=window.Audio;window.__labElements=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.__labElements.push(this)}};const NativeContext=window.AudioContext;window.__labContexts=[];window.AudioContext=class extends NativeContext{constructor(...args){super(...args);window.__labContexts.push(this)}};const revoke=URL.revokeObjectURL;window.__labRevoked=[];URL.revokeObjectURL=value=>{window.__labRevoked.push(value);return revoke.call(URL,value)}})()`})
  await send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: temporary, eventsEnabled: true })
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/audio-lab.html` })
  await waitFor(`!!document.getElementById('play')`)
  // Keep output low; the browser is headless. Volume affects analyser input and is recorded.
  await select('volume', '0.25'); await evaluate(`document.getElementById('volume').dispatchEvent(new Event('input'))`)
  await select('fixture', 'sustain'); await click('play')
  await waitFor(`document.getElementById('format').textContent.includes('isPlaying true')`)
  await pause(1000)
  const live = await evaluate(`document.getElementById('format').textContent`)
  assert.ok(/RMS 0\.\d+/.test(live)); await screenshot('live')
  assert.equal(await evaluate(`document.querySelectorAll('#onset-meters tr').length`),3)
  assert.equal(await evaluate(`document.querySelectorAll('#context-meters tr').length`),3)
  assert.ok(await evaluate(`Number(document.querySelector('#context-meters td').textContent)>0`))
  const localContextTargets=await evaluate(`Array.from(document.querySelectorAll('#context-meters tr'),row=>Number(row.querySelectorAll('td')[1].textContent))`)
  const beforeSeek=await evaluate(`document.getElementById('onset-state').textContent`)
  await evaluate(`window.__labElements.at(-1).currentTime=2.12345`)
  await waitFor(`!window.__labElements.at(-1).seeking`)
  await pause(350)
  const afterSeek=await evaluate(`document.getElementById('onset-state').textContent`)
  assert.ok(Number(afterSeek.match(/Session (\d+)/)[1])>Number(beforeSeek.match(/Session (\d+)/)[1]))
  assert.ok(afterSeek.includes('latest sequence 0'))
  assert.ok(await evaluate(`document.getElementById('context-state').textContent.includes('0/256')`))

  await click('pause')
  await waitFor(`document.getElementById('status').textContent.includes('Playback paused') && document.getElementById('format').textContent.includes('inactive')`,10000)
  await click('stop')
  await waitFor(`document.getElementById('format').textContent.includes('idle / reset') && document.getElementById('format').textContent.includes('RMS 0.000000')`,10000)
  for (const [width, height] of [[390, 844], [1440, 900]] as const) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  }
  // Chromium may finish download checks after all Blob bytes arrive; allow 30 s.
  const run = async (button = 'baseline') => {
    await click(button)
    await waitFor(`document.getElementById('progress').textContent.startsWith('Completed:')`,['onset-baseline','context-baseline'].includes(button)?360000:180000)
    assert.ok((await evaluate(`document.getElementById('progress').textContent`)).includes('0 unavailable/failed'))
    const before = downloads.length; await click('json')
    await waitFor(`true`, 1000)
    for (let i = 0; downloads.length === before && i < 600; i++) await pause(50)
    if(downloads.length!==before+1){const state=await evaluate(`({progress:document.getElementById('progress').textContent,jsonDisabled:document.getElementById('json').disabled,buttons:Array.from(document.querySelectorAll('button'),b=>({id:b.id,disabled:b.disabled})),results:document.getElementById('results').textContent})`);await writeFile(join(temporary,'download-failure.json'),JSON.stringify({button,state,errors,downloadEvents},null,2));throw Error(`Synthetic export failed; diagnostics: ${temporary}/download-failure.json`)}
    return JSON.parse(await readFile(join(temporary, downloads.at(-1)), 'utf8'))
  }
  const selectReviewFile=async(invalid=false)=>evaluate(`(async()=>{
    const {fixtures,generateFixture,wav}=await import('/src/dev/audioLab/fixtures.ts');
    const original=fixtures.find(f=>f.id==='sustain');const f={...original,duration:20,tones:original.tones.map(t=>({...t,end:19}))};
    const file=${invalid?"new File(['generated invalid audio'],'generated-invalid.wav',{type:'audio/wav'})":"wav(generateFixture(f,48000),48000)"};
    const transfer=new DataTransfer();transfer.items.add(file);const input=document.getElementById('review-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`)
  const reviewScreenshot=async name=>{
    // A viewport capture preserves the actual scrollbar/layout width. Element
    // clips beyond the viewport can reflow narrow text while Chromium captures.
    await evaluate(`document.getElementById('review-canvas').scrollIntoView({block:'start'})`);await pause(100)
    await screenshot(name)
  }
  const verifyReview=async(hasReport)=>{
    await selectReviewFile()
    assert.equal(await evaluate(`window.__labElements.at(-1).paused`),true,'Selection must not start playback')
    assert.equal(await evaluate(`document.getElementById('json').disabled&&document.getElementById('csv').disabled`),true)
    await click('file-play');await waitFor(`document.getElementById('format').textContent.includes('file / running')&&document.getElementById('format').textContent.includes('isPlaying true')`)
    await pause(800)
    const before=await evaluate(`({elements:window.__labElements.length,contexts:window.__labContexts.length,time:window.__labElements.at(-1).currentTime,contextState:window.__labContexts.at(-1).state,onsetSession:document.getElementById('onset-state').textContent.match(/Session (\\d+)/)[1],src:window.__labElements.at(-1).src,volume:window.__labElements.at(-1).volume})`)
    const modes:any[]=[]
    for(const mode of ['legacy','candidate','compare']){
      await select('review-mode',mode);await evaluate(`document.getElementById('review-mode').dispatchEvent(new Event('change'))`);await pause(250)
      const current=await evaluate(`({elements:window.__labElements.length,contexts:window.__labContexts.length,time:window.__labElements.at(-1).currentTime,contextState:window.__labContexts.at(-1).state,onsetSession:document.getElementById('onset-state').textContent.match(/Session (\\d+)/)[1],src:window.__labElements.at(-1).src,volume:window.__labElements.at(-1).volume,paused:window.__labElements.at(-1).paused,label:document.getElementById('review-state').textContent})`)
      assert.equal(current.contextState,'running');assert.equal(current.onsetSession,before.onsetSession);assert.equal(current.elements,before.elements);assert.equal(current.contexts,before.contexts);assert.equal(current.src,before.src);assert.equal(current.volume,before.volume);assert.equal(current.paused,false);assert.ok(current.time>before.time);assert.ok(current.label.includes(`View ${mode}`));modes.push({mode,time:current.time})
    }
    const downloadCount=downloadEvents.length
    // Exercise handler guards as well as disabled buttons with a retained report.
    await evaluate(`document.getElementById('json').onclick();document.getElementById('csv').onclick()`);await pause(200)
    assert.equal(downloadEvents.length,downloadCount)
    if(!hasReport){
      await reviewScreenshot('g1-desktop')
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(250)
      assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true)
      assert.equal(await evaluate(`document.getElementById('review-canvas').height`),880)
      const tops=await evaluate(`(async()=>{const values:any[]=[];for(let i=0;i<8;i++){const r=document.getElementById('review-canvas').getBoundingClientRect();values.push(r.top+scrollY);await new Promise(resolve=>setTimeout(resolve,100))}return values})()`)
      assert.ok(Math.max(...tops)-Math.min(...tops)<1,'Portrait chart must not jump with changing readouts')
      await reviewScreenshot('g1-portrait')
      await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
    }
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250)
    assert.ok((await evaluate(`document.getElementById('review-state').textContent`)).includes('brief markers hidden'))
    await send('Emulation.setEmulatedMedia',{features:[]})
    await click('pause');await waitFor(`document.getElementById('format').textContent.includes('inactive')`)
    await click('file-play');await waitFor(`!window.__labElements.at(-1).paused`);await pause(250)
    assert.equal(await evaluate(`window.__labElements.length`),before.elements);assert.equal(await evaluate(`window.__labContexts.length`),before.contexts)
    await click('stop');await waitFor(`document.getElementById('format').textContent.includes('idle / reset')`)
    assert.equal(await evaluate(`document.getElementById('review-file').value`),'')
    assert.equal(await evaluate(`window.__labRevoked.includes(${JSON.stringify(before.src)})`),true)
    assert.ok((await evaluate(`document.getElementById('review-state').textContent`)).includes('band events 0/0/0'))
    if(hasReport)assert.equal(await evaluate(`document.getElementById('json').disabled||document.getElementById('csv').disabled`),false)
    if(!hasReport){await selectReviewFile(true);await click('file-play');await waitFor(`document.getElementById('status').textContent.includes('could not be played')`);assert.equal(await evaluate(`document.getElementById('review-file').value`),'');await click('stop')}
    return {hasRetainedReport:hasReport,selectionWaited:true,modes,elementAndContextPreserved:true,onsetSessionPreserved:true,volume:before.volume,exportsBlocked:true,reducedMotionLabel:true,resumeAndStop:true}
  }
  console.log('Checking generated G1 review controls before native matrices…')
  const g1Early=await verifyReview(false)

  let first, second, energyFirst, energySecond, rangeFirst, rangeSecond, onsetFirst, onsetSecond
  if(process.env.ECHO_AUDIO_LAB_RESUME) {
    // Resume only completed generated numeric matrices after an interrupted long run.
    // Native/source/UI tests below always run again. Never accepts media or live captures.
    const cached:any[]=[]
    for(const name of await readdir(process.env.ECHO_AUDIO_LAB_RESUME)) {
      try { const report=JSON.parse(await readFile(join(process.env.ECHO_AUDIO_LAB_RESUME,name),'utf8'));if(report.complete&&Array.isArray(report.rows)&&['MI01','MI02a','MI02b','MI03'].includes(report.task))cached.push(report) } catch { /* not a numeric JSON report */ }
    }
    const pair=(task,count)=>{const rows=cached.filter(report=>report.task===task);assert.equal(rows.length,2,`${task}: exactly two complete cached reports required`);assert.equal(rows[0].rows.length,count);assert.deepEqual(rows[0].rows,rows[1].rows);assert.deepEqual(rows[0].assessment,rows[1].assessment);assert.deepEqual(rows[0].metadata,rows[1].metadata);assert.ok(rows.every(report=>!report.errors?.length));return rows}
    ;[first,second]=pair('MI01',216);[energyFirst,energySecond]=pair('MI02a',432);[rangeFirst,rangeSecond]=pair('MI02b',81);[onsetFirst,onsetSecond]=pair('MI03',783)
    assert.ok(first.rows.every(row=>row.resetZero));assert.equal(onsetFirst.assessment.pass,true)
    assert.equal(energyFirst.assessment.calibrationPass,true);assert.ok(Object.values(energyFirst.assessment.curves.find(c=>c.curve==='linear').checks).every(Boolean))
    console.log('Validated complete repeated generated MI01–MI03 reports from interrupted run; resuming MI04 and integration…')
  } else {
  console.log('Running baseline twice for reproducibility…')
  first = await run(); second = await run()
  assert.equal(first.complete, true); assert.deepEqual(first.rows, second.rows); assert.deepEqual(first.metadata, second.metadata)
  assert.ok(first.rows.every(row => row.resetZero))
  await screenshot('baseline')
  const beforeCsv = downloads.length; await click('csv')
  for (let i = 0; downloads.length === beforeCsv && i < 600; i++) await pause(50)
  const csv = await readFile(join(temporary, downloads.at(-1)), 'utf8')
  assert.ok(csv.startsWith('fixture,rate,fft,cadence,band,'))
  assert.equal(csv.split('\n').length, first.rows.length * 3 + 1)
  console.log('Running MI02a energy comparison twice…')
  energyFirst = await run('energy-baseline'); energySecond = await run('energy-baseline')
  assert.equal(energyFirst.complete,true); assert.equal(energyFirst.rows.length,432)
  assert.deepEqual(energyFirst.rows,energySecond.rows); assert.deepEqual(energyFirst.assessment,energySecond.assessment)
  assert.equal(energyFirst.assessment.targets.loudContrast,.15)
  assert.ok(energyFirst.rows.every(row=>row.finiteAndBounded))
  assert.equal(energyFirst.assessment.calibrationPass,true)
  assert.ok(Object.values(energyFirst.assessment.curves.find(c=>c.curve==='linear').checks).every(Boolean))
  assert.ok(energyFirst.assessment.curves.every(curve=>curve.checks.silence&&curve.checks.noise))
  assert.ok((await evaluate(`document.getElementById('energy-assessment').textContent`)).includes('linear: PASS'))
  await screenshot('energy')
  const beforeEnergyCsv=downloads.length;await click('csv')
  for(let i=0;downloads.length===beforeEnergyCsv&&i<600;i++)await pause(50)
  const energyCsv=await readFile(join(temporary,downloads.at(-1)),'utf8')
  assert.ok(energyCsv.startsWith('fixture,rate,fft,cadence,hz,peakDbfs,sixBand,'))

  console.log('Running MI02b range/noise comparison twice…')
  rangeFirst=await run('range-baseline');rangeSecond=await run('range-baseline')
  assert.equal(rangeFirst.complete,true);assert.equal(rangeFirst.rows.length,81)
  assert.deepEqual(rangeFirst.rows,rangeSecond.rows);assert.deepEqual(rangeFirst.assessment,rangeSecond.assessment)
  assert.equal(rangeFirst.assessment.settings.maxGain,2)
  assert.equal(rangeFirst.assessment.settings.holdSeconds,2)
  assert.equal(rangeFirst.assessment.targets.loudGraceSeconds,1)
  assert.ok((await evaluate(`document.getElementById('range-assessment').textContent`)).includes(rangeFirst.assessment.pass?'PASS':'FAIL'))
  const beforeRangeCsv=downloads.length;await click('csv')
  for(let i=0;downloads.length===beforeRangeCsv&&i<600;i++)await pause(50)
  const rangeCsv=await readFile(join(temporary,downloads.at(-1)),'utf8')
  assert.ok(rangeCsv.startsWith('fixture,rate,fft,cadence,gainMin,gainMax,'))
  assert.equal(rangeCsv.split('\n').length,82)
  assert.equal(await evaluate(`document.querySelectorAll('#range-meters tr').length`),9)

  console.log('Running MI03 core/stress matrix twice; numerical failures remain reported…')
  onsetFirst=await run('onset-baseline');onsetSecond=await run('onset-baseline')
  assert.equal(onsetFirst.complete,true);assert.equal(onsetFirst.rows.length,783)
  assert.deepEqual(onsetFirst.rows,onsetSecond.rows);assert.deepEqual(onsetFirst.assessment,onsetSecond.assessment)
  assert.equal(onsetFirst.assessment.targets.emissionDelaySeconds,.15)
  assert.equal(onsetFirst.assessment.settings.attackWindowSeconds,.04)
  assert.ok(onsetFirst.rows.every(row=>row.observations.every(o=>o.event.emittedAtSeconds-o.event.timeSeconds>=.04-1e-9)))
  assert.ok((await evaluate(`document.getElementById('onset-assessment').textContent`)).includes(onsetFirst.assessment.pass?'MI03 core: PASS':'MI03 core: FAIL'))
  const beforeOnsetCsv=downloads.length;await click('csv')
  for(let i=0;downloads.length===beforeOnsetCsv&&i<600;i++)await pause(50)
  const onsetCsv=await readFile(join(temporary,downloads.at(-1)),'utf8')
  assert.ok(onsetCsv.startsWith('fixture,category,stress,phaseSeconds,'));assert.equal(onsetCsv.split('\n').length,784)

  assert.equal(onsetFirst.assessment.pass,true,'Accepted MI03 quality must not regress')
  }
  console.log('Running MI04 context matrix twice; quality verdict remains separate…')
  const contextFirst=await run('context-baseline'),contextSecond=await run('context-baseline')
  assert.equal(contextFirst.complete,true);assert.equal(contextFirst.rows.length,324)
  assert.deepEqual(contextFirst.rows,contextSecond.rows);assert.deepEqual(contextFirst.assessment,contextSecond.assessment)
  assert.ok((await evaluate(`document.getElementById('context-assessment').textContent`)).includes(contextFirst.assessment.pass?'MI04 context: PASS':'MI04 context: FAIL'))
  await writeFile(join(temporary,'context.json'),JSON.stringify(contextFirst))
  const beforeContextCsv=downloads.length;await click('csv')
  for(let i=0;downloads.length===beforeContextCsv&&i<600;i++)await pause(50)
  const contextCsv=await readFile(join(temporary,downloads.at(-1)),'utf8')
  assert.ok(contextCsv.startsWith('fixture,rate,fft,cadence,window,intensity,'))
  assert.equal(contextCsv.split('\n').length,1+contextFirst.rows.reduce((sum,row)=>sum+Math.max(1,row.windows.length),0))
  await evaluate(`document.getElementById('context-state').scrollIntoView({block:'start'})`);await screenshot('context')

  const g1Retained=await verifyReview(true)
  // Mock the capture API with generated audio only. This does not exercise or bypass
  // native permissions; the browser picker remains a separate owner/manual check.
  await evaluate(`(()=>{
    window.__labCaptureMode='tone'; window.__labCaptureRequests=0; window.__labCaptureContexts=[];
    window.__labMakeStream=()=>{const ctx=new AudioContext(); const osc=ctx.createOscillator();osc.frequency.value=100;
      const gain=ctx.createGain();gain.gain.value=.25*10**(-12/20);
      const output=ctx.createMediaStreamDestination();osc.connect(gain);gain.connect(output);osc.start();void ctx.resume();
      window.__labCaptureContexts.push(ctx);return output.stream;};
    Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:()=>{
      window.__labCaptureRequests++;
      if(window.__labCaptureMode==='pending')return new Promise<any>(resolve=>{window.__labResolveCapture=resolve});
      if(window.__labCaptureMode==='denied')return Promise.reject(new DOMException('synthetic denial','NotAllowedError'));
      if(window.__labCaptureMode==='noaudio')return Promise.resolve(new MediaStream());
      window.__labStream=window.__labMakeStream();return Promise.resolve(window.__labStream);
    }});
  })()`)
  await click('share-tab')
  await waitFor(`document.getElementById('format').textContent.includes('tab / running') && document.getElementById('format').textContent.includes('isPlaying true')`)
  assert.equal(await evaluate(`Number(document.querySelector('#energy-meters tr td').textContent)>0`),true)
  assert.equal(await evaluate(`document.getElementById('json').disabled && document.getElementById('csv').disabled && document.getElementById('volume').disabled`),true)
  await waitFor(`Number(document.querySelector('#context-meters td').textContent)>0`)
  // Let the FFT window and the next 5 Hz UI paint contain steady generated audio.
  await pause(350)
  const mockContextTargets=await evaluate(`Array.from(document.querySelectorAll('#context-meters tr'),row=>Number(row.querySelectorAll('td')[1].textContent))`)
  assert.ok(Math.abs(localContextTargets[0]-mockContextTargets[0])<=.002,`Generated local/mock intensity targets ${localContextTargets[0]} / ${mockContextTargets[0]}`)
  assert.ok(Math.abs(localContextTargets[1]-mockContextTargets[1])<=.03,`Generated local/mock brightness targets ${localContextTargets[1]} / ${mockContextTargets[1]}`)
  const beforeLiveExport=downloads.length; await click('json'); await click('csv'); await pause(100)
  assert.equal(downloads.length,beforeLiveExport)
  await click('play')
  await waitFor(`document.getElementById('format').textContent.includes('fixture / running')`)
  assert.equal(await evaluate(`window.__labStream.getTracks().every(t=>t.readyState==='ended')`),true)
  await click('share-tab')
  await evaluate(`window.__labStream.getTracks()[0].dispatchEvent(new Event('ended'))`)
  await waitFor(`document.getElementById('status').textContent.includes('Browser sharing ended')`)
  await waitFor(`document.getElementById('format').textContent.includes('idle / reset') && document.getElementById('format').textContent.includes('RMS 0.000000')`,10000)
  for(const mode of ['denied','noaudio']) {
    await evaluate(`window.__labCaptureMode=${JSON.stringify(mode)}`);await click('share-tab')
    await waitFor(`!document.getElementById('share-tab').disabled`)
    const status=await evaluate(`document.getElementById('status').textContent`)
    assert.match(status,mode==='denied'?/cancelled or denied/:/No audio track/)
  }
  await evaluate(`window.__labCaptureMode='pending'`);await click('share-tab')
  assert.equal(await evaluate(`document.getElementById('disconnect-tab').textContent`),'Cancel sharing')
  await click('disconnect-tab');await click('play')
  await evaluate(`window.__labLateStream=window.__labMakeStream(); window.__labResolveCapture(window.__labLateStream)`)
  await waitFor(`window.__labLateStream.getTracks().every(t=>t.readyState==='ended')`)
  await waitFor(`document.getElementById('format').textContent.includes('fixture / running')`)
  await click('stop')
  await evaluate(`window.__labCaptureMode='pending'`);await click('share-tab');await selectReviewFile()
  assert.equal(await evaluate(`window.__labElements.at(-1).paused`),true)
  await evaluate(`window.__labFileLateStream=window.__labMakeStream();window.__labResolveCapture(window.__labFileLateStream)`)
  await waitFor(`window.__labFileLateStream.getTracks().every(t=>t.readyState==='ended')`)
  assert.equal(await evaluate(`document.getElementById('file-play').disabled`),false)
  await click('file-play');await waitFor(`document.getElementById('format').textContent.includes('file / running')`);await click('stop')
  await evaluate(`Promise.all(window.__labCaptureContexts.map(ctx=>ctx.close()))`)
  await click('context-baseline');await click('cancel')
  await waitFor(`document.getElementById('progress').textContent.startsWith('Cancelled:')`)
  assert.ok((await evaluate(`document.getElementById('context-assessment').textContent`)).includes('incomplete'))
  const beforeContextPartial=downloads.length;await click('json')
  for(let i=0;downloads.length===beforeContextPartial&&i<600;i++)await pause(50)
  assert.equal(JSON.parse(await readFile(join(temporary,downloads.at(-1)),'utf8')).complete,false)
  // A cancellation is partial evidence and may never claim a complete report.
  await click('baseline'); await click('cancel')
  await waitFor(`document.getElementById('progress').textContent.startsWith('Cancelled:')`)
  const beforePartial = downloads.length; await click('json')
  for (let i = 0; downloads.length === beforePartial && i < 600; i++) await pause(50)
  const partial = JSON.parse(await readFile(join(temporary, downloads.at(-1)), 'utf8'))
  assert.equal(partial.complete,false)
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` })
  await waitFor(`!!document.getElementById('scene-select')`)
  await evaluate(`(async()=>{
    const nativeAudio = window.Audio; window.__mi01Elements = [];
    window.Audio = class extends nativeAudio { constructor(...args){super(...args); window.__mi01Elements.push(this)} };
    const {generateFixture, fixtures, wav} = await import('/src/dev/audioLab/fixtures.ts');
    const input = document.querySelector('input[type=file]');
    const transfer = new DataTransfer();
    const sustain=fixtures.find(f=>f.id==='sustain');
    transfer.items.add(wav(generateFixture({...sustain,duration:30,tones:sustain.tones.map(t=>({...t,end:29}))},48000),48000));
    input.files = transfer.files; input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`)
  await waitFor(`!!document.querySelector('.scene-player button')`)
  await evaluate(`document.querySelector('.scene-player button').click()`)
  await waitFor(`window.__mi01Elements.length===1 && !window.__mi01Elements[0].paused`)
  const scenes = await evaluate(`Array.from(document.querySelector('#scene-select').options,o=>o.value)`)
  assert.equal(scenes.length,4)
  let previousTime = 0
  for (const scene of scenes) {
    await evaluate(`(()=>{const s=document.getElementById('scene-select');if(Array.from(s.options).some(o=>o.value===${JSON.stringify(scene)})){s.value=${JSON.stringify(scene)};s.dispatchEvent(new Event('change',{bubbles:true}));}})()`)
    await pause(300)
    const playback = await evaluate(`({count:window.__mi01Elements.length,time:window.__mi01Elements[0].currentTime,paused:window.__mi01Elements[0].paused,selected:document.querySelector('#scene-select').value})`)
    assert.equal(playback.count,1); assert.equal(playback.paused,false); assert.equal(playback.selected,scene)
    assert.ok(playback.time>previousTime); previousTime=playback.time
  }
  assert.equal(await evaluate(`!!document.getElementById('baseline')`), false)
  const assets = await readdir('dist/assets')
  for (const asset of assets.filter(name => name.endsWith('.js'))) {
    const contents = await readFile(join('dist/assets', asset), 'utf8')
    for (const marker of ['rmsDbfs', 'createDiagnosticObserver', 'echo-synthetic.wav', 'noise-60db-peak', 'excursionDelayMs', 'estimatedBroadRms', 'MI02a · Energy comparison', 'extraClippingAfterGraceSeconds', 'MI02b · Range and noise comparison', 'MI03 · Onset events', 'MI04 · Musical context', 'G1 · Feature-quality review', 'MI05 · Crimson pilot', 'Open Crimson preview', 'mountCrimsonPreview', 'Play / resume local audio', 'Choose a browser tab and enable Share tab audio. Sound stays in the source tab.']) assert.equal(contents.includes(marker), false, `${asset}: ${marker}`)
  }
  assert.equal((await readdir('dist')).includes('audio-lab.html'), false)
  assert.deepEqual(errors, [])
  await writeFile(join(temporary, 'onsets.json'),JSON.stringify(onsetFirst))
  await writeFile(join(temporary, 'range.json'),JSON.stringify(rangeFirst))
  await writeFile(join(temporary, 'energy.json'),JSON.stringify(energyFirst))
  await writeFile(join(temporary, 'baseline.json'), JSON.stringify(first))
  await writeFile(join(temporary, 'verification.json'), JSON.stringify({ browser: first.browser,resumedGeneratedMatrices:process.env.ECHO_AUDIO_LAB_RESUME||null, live,g1:{early:g1Early,retained:g1Retained,lateTabReplacement:true,manualReview:'pending'}, contextSourceParity:{localContextTargets,mockContextTargets,intensityTolerance:.002,brightnessTolerance:.03,note:'Generated inputs; raw targets only. Envelopes have different live timelines; identical-timeline equality is unit tested.'},contextCases:contextFirst.rows.length,contextAssessment:contextFirst.assessment,onsetCases:onsetFirst.rows.length,onsetAssessment:onsetFirst.assessment,seek:{before:beforeSeek,after:afterSeek},rows: first.rows.length, rangeRows:rangeFirst.rows.length,rangeAssessment:rangeFirst.assessment,energyRows: energyFirst.rows.length, energyAssessment: energyFirst.assessment, repeatedExactly: true, partialExportComplete: partial.complete, checks: ['fixture playback/pause/reset', 'synthetic capture-API mock: live meters, export lock, switching, native-end callback, denial, missing audio, late resolution', 'responsive UI', 'JSON/CSV exports', 'full baseline repeated exactly', 'partial cancellation', 'same synthetic player advances across all four landscapes', 'production asset exclusion'], errors }, null, 2))
  console.log(`PASS ${first.rows.length} baseline rows and ${energyFirst.rows.length} energy rows and ${rangeFirst.rows.length} range rows and ${onsetFirst.rows.length} onset rows and ${contextFirst.rows.length} context rows repeated (check onsetAssessment/contextAssessment for quality); screenshots, numeric baseline and verification: ${temporary}`)
} finally { ws?.close(); browser.kill(); server.kill() }

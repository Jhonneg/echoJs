// Synthetic-only browser verification. Run after npm run build. Uses installed Brave/CDP;
// Playwright is not available in this workspace. Never opens a capture picker or user file.
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
const temporary = await mkdtemp(join(tmpdir(), 'echo-mi01-'))
const freePort = () => new Promise((resolve, reject) => { const socket = createServer(); socket.on('error', reject); socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)) }) })
const [port, browserPort] = await Promise.all([freePort(), freePort()])
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
const browser = spawn(process.env.ECHO_BROWSER || 'brave', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', `--user-data-dir=${join(temporary, 'profile')}`, `--remote-debugging-port=${browserPort}`, 'about:blank'], { stdio: 'ignore' })
let ws
const errors = [], downloads = []
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
    if (message.method === 'Browser.downloadProgress' && message.params.state === 'completed') downloads.push(message.params.guid)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
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
  await click('pause'); await pause(200)
  assert.ok((await evaluate(`document.getElementById('format').textContent`)).includes('inactive'))
  await click('stop'); await pause(200)
  assert.ok((await evaluate(`document.getElementById('format').textContent`)).includes('RMS 0.000000'))
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  }
  const run = async () => {
    await click('baseline')
    await waitFor(`document.getElementById('progress').textContent.startsWith('Completed:')`)
    assert.ok((await evaluate(`document.getElementById('progress').textContent`)).includes('0 unavailable/failed'))
    const before = downloads.length; await click('json')
    await waitFor(`true`, 1000)
    for (let i = 0; downloads.length === before && i < 100; i++) await pause(50)
    assert.equal(downloads.length, before + 1)
    return JSON.parse(await readFile(join(temporary, downloads.at(-1)), 'utf8'))
  }
  console.log('Running baseline twice for reproducibility…')
  const first = await run(), second = await run()
  assert.equal(first.complete, true); assert.deepEqual(first.rows, second.rows); assert.deepEqual(first.metadata, second.metadata)
  assert.ok(first.rows.every(row => row.resetZero))
  await screenshot('baseline')
  const beforeCsv = downloads.length; await click('csv')
  for (let i = 0; downloads.length === beforeCsv && i < 100; i++) await pause(50)
  const csv = await readFile(join(temporary, downloads.at(-1)), 'utf8')
  assert.ok(csv.startsWith('fixture,rate,fft,cadence,band,'))
  assert.equal(csv.split('\n').length, first.rows.length * 3 + 1)
  // Mock the capture API with generated audio only. This does not exercise or bypass
  // native permissions; the browser picker remains a separate owner/manual check.
  await evaluate(`(()=>{
    window.__labCaptureMode='tone'; window.__labCaptureRequests=0; window.__labCaptureContexts=[];
    window.__labMakeStream=()=>{const ctx=new AudioContext(); const osc=ctx.createOscillator();osc.frequency.value=100;
      const output=ctx.createMediaStreamDestination();osc.connect(output);osc.start();void ctx.resume();
      window.__labCaptureContexts.push(ctx);return output.stream;};
    Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{configurable:true,value:()=>{
      window.__labCaptureRequests++;
      if(window.__labCaptureMode==='pending')return new Promise(resolve=>{window.__labResolveCapture=resolve});
      if(window.__labCaptureMode==='denied')return Promise.reject(new DOMException('synthetic denial','NotAllowedError'));
      if(window.__labCaptureMode==='noaudio')return Promise.resolve(new MediaStream());
      window.__labStream=window.__labMakeStream();return Promise.resolve(window.__labStream);
    }});
  })()`)
  await click('share-tab')
  await waitFor(`document.getElementById('format').textContent.includes('tab / running') && document.getElementById('format').textContent.includes('isPlaying true')`)
  assert.equal(await evaluate(`document.getElementById('json').disabled && document.getElementById('csv').disabled && document.getElementById('volume').disabled`),true)
  const beforeLiveExport=downloads.length; await click('json'); await click('csv'); await pause(100)
  assert.equal(downloads.length,beforeLiveExport)
  await click('play')
  await waitFor(`document.getElementById('format').textContent.includes('fixture / running')`)
  assert.equal(await evaluate(`window.__labStream.getTracks().every(t=>t.readyState==='ended')`),true)
  await click('share-tab')
  await evaluate(`window.__labStream.getTracks()[0].dispatchEvent(new Event('ended'))`)
  await waitFor(`document.getElementById('status').textContent.includes('Browser sharing ended')`)
  await pause(250)
  assert.equal(await evaluate(`document.getElementById('format').textContent.includes('RMS 0.000000')`),true)
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
  await evaluate(`Promise.all(window.__labCaptureContexts.map(ctx=>ctx.close()))`)
  // A cancellation is partial evidence and may never claim a complete report.
  await click('baseline'); await click('cancel')
  await waitFor(`document.getElementById('progress').textContent.startsWith('Cancelled:')`)
  const beforePartial = downloads.length; await click('json')
  for (let i = 0; downloads.length === beforePartial && i < 100; i++) await pause(50)
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
    for (const marker of ['rmsDbfs', 'createDiagnosticObserver', 'echo-synthetic.wav', 'noise-60db-peak', 'excursionDelayMs', 'Choose a browser tab and enable Share tab audio. Sound stays in the source tab.']) assert.equal(contents.includes(marker), false, `${asset}: ${marker}`)
  }
  assert.equal((await readdir('dist')).includes('audio-lab.html'), false)
  assert.deepEqual(errors, [])
  await writeFile(join(temporary, 'baseline.json'), JSON.stringify(first))
  await writeFile(join(temporary, 'verification.json'), JSON.stringify({ browser: first.browser, live, rows: first.rows.length, repeatedExactly: true, partialExportComplete: partial.complete, checks: ['fixture playback/pause/reset', 'synthetic capture-API mock: live meters, export lock, switching, native-end callback, denial, missing audio, late resolution', 'responsive UI', 'JSON/CSV exports', 'full baseline repeated exactly', 'partial cancellation', 'same synthetic player advances across all four landscapes', 'production asset exclusion'], errors }, null, 2))
  console.log(`PASS ${first.rows.length} rows × 2; screenshots, numeric baseline and verification: ${temporary}`)
} finally { ws?.close(); browser.kill(); server.kill() }

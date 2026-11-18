import { createAnalysis } from '../../audio/analysis'
import { createLabSources, type LabSourceState } from './sources'
import { BAND_NAMES, SIX_BAND_NAMES } from '../../audio/signal'
import { ACTIVITY_THRESHOLD, EXCURSION_THRESHOLD, SATURATION_THRESHOLD, createSnapshot, type DiagnosticSnapshot } from './diagnostics'
import { FIXTURE_SEED, fixtures, generateFixture, wav } from './fixtures'
import { analyseFixture, summarize, type BaselineRow } from './baseline'
import './style.css'

const root = document.querySelector<HTMLElement>('#lab')!
root.innerHTML = `<h1>ECHO · Audio lab</h1><p>Development only · live tab diagnostics and synthetic baselines</p>
<p>Live tab measurements stay in memory and cannot be exported. Peak dBFS describes synthetic fixture amplitude; RMS is measured separately. Six-band slow/transient/flux features do not exist.</p>
<section aria-label="Tab capture controls"><button id="share-tab">Share a tab</button><button id="disconnect-tab" disabled>Disconnect tab</button><button id="resume-tab" disabled>Resume analysis</button></section>
<p id="tab-help">Choose a browser tab and enable Share tab audio. Sound stays in the source tab. Cancelling here does not close the native picker.</p>
<section aria-label="Fixture controls"><label>Fixture <select id="fixture">${fixtures.map(f => `<option>${f.id}</option>`).join('')}</select></label>
<label>Generated source rate <select id="rate"><option>44100</option><option selected>48000</option><option>96000</option></select> Hz</label>
<button id="play">Play synthetic fixture</button><button id="pause">Pause</button><button id="stop">Stop / reset</button><label>Fixture output volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.25"></label></section>
<p id="status" role="status">Ready</p><pre id="format"></pre>
<label>Graph band <select id="graph-band"><option>bass</option><option>midrange</option><option>treble</option><option>subBass (six)</option><option>bass (six)</option><option>lowMids (six)</option><option>highMids (six)</option><option>presence (six)</option><option>air (six)</option></select></label><canvas id="plot" width="1100" height="200" aria-label="Last 30 seconds of selected band features"></canvas><p>History: RMS white · raw yellow · level green · fast magenta · slow blue · transient cyan · flux violet. Vertical scale grows above 1 for raw magnitudes.</p>
<div class="scroll"><table><thead><tr><th>Band</th><th>Raw magnitude</th><th>Level</th><th>Fast</th><th>Slow</th><th>Transient</th><th>Flux</th><th>Flux L1/L2</th><th>Active*</th></tr></thead><tbody id="meters"></tbody></table></div>
<p>*Active: fast &gt; ${ACTIVITY_THRESHOLD}. This diagnostic flag is independent of scene-specific hysteresis.</p>
<section><button id="baseline">Run all offline baselines</button><button id="cancel" disabled>Cancel after current fixture</button><button id="json" disabled>Export synthetic JSON</button><button id="csv" disabled>Export synthetic CSV</button></section>
<p id="progress" role="status">Offline: 44.1/48/96 kHz × 30/60/120 updates/s. No audible output.</p><pre id="results"></pre>`
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
let latest: DiagnosticSnapshot = createSnapshot(), lastPaint = 0
const history: { time: number, values: number[] }[] = []
el('graph-band').onchange = () => { history.length = 0 }
const analysis = createAnalysis({ diagnostics: snapshot => {
  latest = snapshot
  if (snapshot.state === 'reset') history.length = 0
} })
let sourceState: LabSourceState = { mode: 'idle', captureStatus: 'disconnected', message: 'Ready' }
const sources = createLabSources(analysis, state => {
  sourceState = state
  el('status').textContent = state.message
  updateControls()
})
el('share-tab').onclick = () => { if (!running) void sources.share() }
el('disconnect-tab').onclick = () => sources.stop()
el('resume-tab').onclick = () => sources.resume()
el('play').onclick = async () => {
  if (running) return
  const fixture = fixtures.find(f => f.id === el<HTMLSelectElement>('fixture').value)!
  const rate = Number(el<HTMLSelectElement>('rate').value)
  await sources.play(wav(generateFixture(fixture, rate), rate))
}
el('pause').onclick = () => sources.pause()
el('stop').onclick = () => sources.stop()
el('volume').oninput = () => sources.setVolume(Number(el<HTMLInputElement>('volume').value))
let rows: BaselineRow[] = [], metadata: unknown[] = [], errors: { fixture: string, requestedRate: number, message: string }[] = []
let cancelled = false, running = false
let runMetrics = { offlineWallMs: 0, replayWallMs: 0, maxTraceBytes: 0 }
function updateControls() {
  const tab = sourceState.mode === 'tab'
  const pending = sourceState.captureStatus === 'connecting'
  el<HTMLButtonElement>('share-tab').disabled = running || tab
  el<HTMLButtonElement>('disconnect-tab').disabled = !tab
  el('disconnect-tab').textContent = pending ? 'Cancel sharing' : 'Disconnect tab'
  el<HTMLButtonElement>('resume-tab').disabled = !tab || pending
  el<HTMLButtonElement>('pause').disabled = sourceState.mode !== 'fixture'
  el<HTMLInputElement>('volume').disabled = tab || running
  el<HTMLButtonElement>('json').disabled = tab || running || rows.length === 0
  el<HTMLButtonElement>('csv').disabled = tab || running || rows.length === 0
}
updateControls()
el('cancel').onclick = () => { cancelled = true }
el('baseline').onclick = async () => {
  if (running) return
  running = true; cancelled = false; rows = []; metadata = []; errors = []
  sources.stop()
  runMetrics = { offlineWallMs: 0, replayWallMs: 0, maxTraceBytes: 0 }
  el<HTMLButtonElement>('baseline').disabled = true; el<HTMLButtonElement>('play').disabled = true
  el<HTMLButtonElement>('cancel').disabled = false
  el<HTMLButtonElement>('json').disabled = true; el<HTMLButtonElement>('csv').disabled = true
  const start = performance.now()
  try {
    for (const requestedRate of [44100, 48000, 96000]) {
      for (const fixture of fixtures) {
        if (cancelled) break
        el('progress').textContent = `Measuring ${fixture.id} at requested ${requestedRate} Hz… (${rows.length} cadence rows)`
        try {
          const offlineStart = performance.now()
          const trace = await analyseFixture(fixture, requestedRate)
          runMetrics.offlineWallMs += performance.now() - offlineStart
          runMetrics.maxTraceBytes = Math.max(runMetrics.maxTraceBytes, trace.frames.reduce((sum, frame) => sum + frame.bins.byteLength, 0))
          metadata.push({ fixture: fixture.id, requestedRate, actualRate: trace.rate, fft: trace.fft, seed: FIXTURE_SEED, inputRms: trace.inputRms, inputPeak: trace.peak, pcm: 'mono Float32 offline / PCM16 live', duration: fixture.duration })
          const replayStart = performance.now()
          for (const cadence of [30, 60, 120]) rows.push(summarize(fixture, trace.rate, trace.fft, trace.frames, cadence))
          runMetrics.replayWallMs += performance.now() - replayStart
        } catch (error) {
          errors.push({ fixture: fixture.id, requestedRate, message: error instanceof Error ? error.message : String(error) })
        }
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      if (cancelled) break
    }
  } finally {
    running = false
    el<HTMLButtonElement>('baseline').disabled = false; el<HTMLButtonElement>('play').disabled = false
    el<HTMLButtonElement>('cancel').disabled = true
    updateControls()
    el('progress').textContent = `${cancelled ? 'Cancelled' : 'Completed'}: ${rows.length} cadence rows; ${errors.length} unavailable/failed cases; ${((performance.now() - start) / 1000).toFixed(1)} s. Results describe legacy envelopes, not detected musical onsets.`
    el('results').textContent = JSON.stringify({ rows: rows.length, errors, example: rows.find(r => r.fixture === 'tone-100hz--12db') }, null, 2)
  }
}
function report() {
  return { task: 'MI01', version: 1, generatedAt: new Date().toISOString(), browser: navigator.userAgent, complete: !cancelled && errors.length === 0 && rows.length === fixtures.length * 9,
    thresholds: { activity: ACTIVITY_THRESHOLD, excursion: EXCURSION_THRESHOLD, saturation: SATURATION_THRESHOLD, attackWindowSeconds: 0.3 },
    caveats: ['Synthetic numeric aggregates only; no media or FFT buffers.', 'Excursions are continuous-envelope threshold crossings, not onset events.', 'Offline context rates are not proof of live capture/source rates.', 'Latency is relative to fixture time, not end-to-end capture latency.', 'No quality tolerances or production algorithm changes.'], runMetrics, metadata, errors, rows }
}
function download(text: string, extension: string) {
  const url = URL.createObjectURL(new Blob([text], { type: extension === 'json' ? 'application/json' : 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = `echo-mi01-baseline.${extension}`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
el('json').onclick = () => {
  if (sourceState.mode !== 'tab' && !running && rows.length) download(JSON.stringify(report(), null, 2), 'json')
}
el('csv').onclick = () => {
  if (sourceState.mode === 'tab' || running || !rows.length) return
  const header = ['fixture', 'rate', 'fft', 'cadence', 'band', 'rawPeak', 'levelPeak', 'fastPeak', 'transientPeak', 'fluxPeak', 'saturationPercent', 'excursions']
  const lines = rows.flatMap(r => BAND_NAMES.map(b => [r.fixture, r.rate, r.fft, r.cadence, b, r.rawPeak[b], r.levelPeak[b], r.fastPeak[b], r.transientPeak[b], r.fluxPeak[b], r.saturationPercent[b], r.excursions[b]].join(',')))
  download([header.join(','), ...lines].join('\n'), 'csv')
}
function paint(now: number) {
  if (now - lastPaint >= 200) {
    lastPaint = now
    const s = latest.signal
    const age = latest.timestamp ? Math.max(0, now - latest.timestamp) : null
    el('format').textContent = `${sourceState.mode} / ${latest.state} · context ${latest.sampleRate || '—'} Hz / FFT ${latest.fftSize || '—'} · window ${latest.windowMs.toFixed(2)} ms\nRMS ${latest.rms.toFixed(6)} (${latest.rmsDbfs?.toFixed(2) ?? '−∞'} dBFS) · update ${s.updateHz.toFixed(1)} Hz · feature age ${age?.toFixed(1) ?? '—'} ms · audio time ${latest.audioTime.toFixed(3)} s\nAtmosphere ${s.atmosphere.toFixed(4)} · isPlaying ${s.isPlaying} · context is not original media sample rate`
    const n = (v: number) => v.toFixed(5)
    el('meters').innerHTML = BAND_NAMES.map(b => `<tr><th>${b}</th>${[latest.raw[b], s.levels[b], s.fast[b], s.slow[b], s.transient[b], s.flux[b]].map(v => `<td>${n(v)}</td>`).join('')}<td>${n(latest.fluxL1[b])}/${n(latest.fluxL2[b])}</td><td>${latest.active[b]}</td></tr>`).join('') + SIX_BAND_NAMES.map(b => `<tr><th>${b} (six)</th><td>${n(latest.sixRaw[b])}</td><td>—</td><td>${n(s.sixBands[b])}</td><td colspan="4">not available</td><td>${Number(s.sixBands[b] > ACTIVITY_THRESHOLD)}</td></tr>`).join('')
    const chosen = el<HTMLSelectElement>('graph-band').value
    const six = chosen.endsWith(' (six)')
    const key = chosen.replace(' (six)', '')
    const b = key as typeof BAND_NAMES[number], sixKey = key as typeof SIX_BAND_NAMES[number]
    history.push({ time: now, values: six
      ? [latest.rms, latest.sixRaw[sixKey], 0, s.sixBands[sixKey], 0, 0, 0]
      : [latest.rms, latest.raw[b], s.levels[b], s.fast[b], s.slow[b], s.transient[b], s.flux[b]] })
    while (history.length > 151 || history[0]?.time < now - 30000) history.shift()
    const canvas = el<HTMLCanvasElement>('plot'), ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = Math.max(1, ...history.flatMap(p => p.values))
    for (const [i, color] of ['#fff', '#ffe477', '#76f097', '#ff44b7', '#609bff', '#3ffff4', '#b27aff'].entries()) {
      ctx.strokeStyle = color; ctx.beginPath()
      history.forEach((p, j) => { const x = canvas.width * (1 - (now - p.time) / 30000), y = canvas.height * (1 - p.values[i] / scale); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
      ctx.stroke()
    }
  }
  requestAnimationFrame(paint)
}
requestAnimationFrame(paint)
window.addEventListener('pagehide', () => { cancelled = true; sources.dispose() })

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'
import { fixtures, generateFixture, wav } from '../src/dev/audioLab/fixtures.ts'
import { rms, dbfs, createDiagnosticObserver, type DiagnosticSnapshot } from '../src/dev/audioLab/diagnostics.ts'
import { createReplay, summarize } from '../src/dev/audioLab/baseline.ts'
import { silentSignal, emptyBands } from '../src/audio/signal.ts'

test('fixtures have deterministic unclipped PCM, labeled timing, peak dBFS and valid WAV', async () => {
  for (const fixture of fixtures) {
    const a = generateFixture(fixture, 48000), b = generateFixture(fixture, 48000)
    assert.deepEqual(a, b)
    for (const value of a) assert.ok(Number.isFinite(value) && Math.abs(value) < 1)
    for (const event of fixture.events) assert.ok(event.time >= 0.5 && event.time < fixture.duration)
  }
  const samples = generateFixture(fixtures.find(f => f.id === 'tone-1000hz--12db')!, 48000)
  assert.ok(Math.abs(dbfs(rms(samples.slice(48000, 96000)))! - (-12 - 3.0103)) < 0.001)
  const file = wav(samples, 48000), view = new DataView(await file.arrayBuffer())
  assert.equal(view.getUint32(24, true), 48000)
  assert.equal(view.getUint32(40, true), samples.length * 2)
  assert.equal(dbfs(0), null)
})

test('replay uses time-domain metadata, preserves priming, deterministic cadence and reset', () => {
  const frames = Array.from({ length: 240 }, (_, i) => {
    const bins = new Float32Array(1024).fill(-Infinity)
    if (i >= 60 && i < 180) bins[4] = -30
    return { time: (i + 1) / 120, bins, rms: i >= 60 && i < 180 ? .1 : 0 }
  })
  const fixture:any={ id: 'test', tones: [], duration: 2, events: [{ time: .5, band: 'bass' }] }
  for (const hz of [30, 60, 120]) {
    const a = summarize(fixture, 48000, 2048, frames, hz)
    assert.deepEqual(a, summarize(fixture, 48000, 2048, frames, hz))
    assert.equal(a.count, hz * 2)
    assert.equal(a.resetZero, true)
    assert.equal(a.rawPeak.midrange, 0)
    assert.equal(a.rawPeak.treble, 0)
    assert.equal(a.excursions.bass, 1)
  }
  const replay = createReplay(44100, 2048), reference = replay.signal.fast
  replay.step(frames[70]); replay.reset()
  assert.equal(replay.signal.fast, reference)
  assert.deepEqual(replay.signal, silentSignal())
})

test('diagnostic reset clears numeric scratch and isolates consumer failures', () => {
  let snapshot!: DiagnosticSnapshot
  const observer = createDiagnosticObserver(value => { snapshot = structuredClone(value); throw Error('consumer') })
  const analyser = { fftSize: 2048, context: { sampleRate: 48000, currentTime: 1 }, getFloatTimeDomainData: (values: Float32Array) => values.fill(.5) } as unknown as AnalyserNode
  observer.read(analyser, new Float32Array(1024).fill(-20), silentSignal(), { bass: 1, midrange: 2, treble: 3 }, undefined, true, 1000, .016)
  assert.equal(snapshot.rms, .5)
  observer.reset()
  assert.deepEqual(snapshot.raw, emptyBands())
  assert.equal(snapshot.rms, 0)
  assert.equal(snapshot.rmsDbfs, null)
  assert.equal(snapshot.timestamp, 0)
  assert.equal(snapshot.context.intensity, 0)
  assert.equal(snapshot.context.brightness, 0)
  assert.equal(snapshot.context.activity, 0)
  assert.equal(snapshot.context.eventCount, 0)
})

// Run the actual analysis module with only Vite's build constant and module URLs resolved.
const source = (await readFile(new URL('../src/audio/analysis.ts', import.meta.url), 'utf8'))
  .replaceAll('import.meta.env.DEV', 'true')
  .replace(/from '([^']+)'/g, (_, relative) => `from '${pathToFileURL(new URL(`../src/audio/${relative}.ts`, import.meta.url).pathname).href}'`)
const { createAnalysis }: typeof import('../src/audio/analysis.ts') = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(source))}`)
test('live observer enabled/disabled yields identical legacy output and no extra reads when off', () => {
  let next = 0, reads = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  globalThis.requestAnimationFrame = fn => { callbacks.set(++next, fn); return next }
  globalThis.cancelAnimationFrame = id => callbacks.delete(id)
  ;(globalThis as any).AudioContext = class {
    sampleRate = 96000; state = 'running'; currentTime = 0; destination = {}
    resume() { return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
    createMediaElementSource() { return { connect() {}, disconnect() {} } }
    createAnalyser() { return { context: this, fftSize: 4096, frequencyBinCount: 2048,
      connect() {}, disconnect() {}, getFloatFrequencyData(bins: Float32Array) { bins.fill(-Infinity); bins[4] = -30 },
      getFloatTimeDomainData(time: Float32Array) { reads++; time.fill(.1) } } }
  }
  let snapshot!: DiagnosticSnapshot
  const off = createAnalysis(), on = createAnalysis({ diagnostics: value => { snapshot = structuredClone(value) } }), candidate = createAnalysis({ musicIntelligence: true })
  const features = candidate.musicFeatures
  assert.ok(features)
  // Only listeners and the paused/ended flags are used.
  const element = Object.assign(new EventTarget(), { paused: false, ended: false }) as unknown as HTMLAudioElement
  off.prepare(); on.prepare(); candidate.prepare(); off.startElement(element); on.startElement(element); candidate.startElement(element)
  // Both contexts use performance.now at startup; establish an identical prior tick first.
  const step = (now: number) => { const queue = [...callbacks.values()]; callbacks.clear(); queue.forEach(fn => fn(now)) }
  step(1000); step(1100)
  // Reset both, then control the startup clock for exact parity.
  off.stop(); on.stop(); candidate.stop()
  const original = performance.now; performance.now = () => 0
  try {
    off.prepare(); on.prepare(); candidate.prepare(); off.startElement(element); on.startElement(element); candidate.startElement(element)
    step(10); step(30); step(100); step(200)
    assert.deepEqual(off.signal, on.signal)
    assert.deepEqual(off.signal, candidate.signal)
    assert.equal(features.read().status, 'active')
    const replay = createReplay(96000, 4096)
    const bins = new Float32Array(2048).fill(-Infinity); bins[4] = -30
    for (const time of [.01, .03, .1, .2]) replay.step({ time, bins, rms: .1 })
    for (const key of ['levels', 'fast', 'slow', 'transient', 'flux', 'sixBands'] as const) {
      const live: Record<string, number> = off.signal[key], replayed: Record<string, number> = replay.signal[key]
      for (const band of Object.keys(live)) assert.ok(Math.abs(live[band] - replayed[band]) < 1e-14, key)
    }
    assert.equal(reads, 6)
    assert.equal(snapshot.sampleRate, 96000)
    const beforeSeek = structuredClone(on.signal), session = snapshot.onsets.session
    const contextSession = snapshot.context.session
    const candidateSession = features.read().session
    assert.ok(snapshot.context.intensity > 0)
    element.dispatchEvent(new Event('seeking'))
    assert.ok(snapshot.onsets.session > session)
    assert.ok(features.read().session > candidateSession)
    assert.equal(features.read().events.length, 0)
    assert.equal(features.read().status, 'inactive')
    assert.ok(snapshot.context.session > contextSession)
    assert.equal(snapshot.context.intensity, 0)
    assert.equal(snapshot.context.activity, 0)
    assert.deepEqual(on.signal, beforeSeek)
    assert.equal(snapshot.onsets.events.length, 0)
    const ref = on.signal.fast
    off.stop(); on.stop(); candidate.stop()
    assert.equal(on.signal.fast, ref)
    assert.deepEqual(on.signal, silentSignal())
    assert.equal(snapshot.state, 'reset')
    assert.equal(features.read().status, 'inactive')
    assert.deepEqual(snapshot.raw, emptyBands())
    const stoppedSession = snapshot.onsets.session
    element.dispatchEvent(new Event('seeked'))
    assert.equal(snapshot.onsets.session, stoppedSession, 'seek listeners removed on stop')
  } finally { performance.now = original }
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSpectralFlux } from '../src/audio/flux.ts'
import { emptyBands, silentSignal } from '../src/audio/signal.ts'
import { updateSignalFeatures } from '../src/audio/features.ts'

const ranges = { bass: [0, 2], midrange: [2, 4], treble: [4, 6] } as const
const db = (magnitudes) => new Float32Array(magnitudes.map((m) => m > 0 ? 20 * Math.log10(m) : -Infinity))
test('bin-first flux finds an attack hidden by constant aggregate energy', () => {
  const processor = createSpectralFlux(6, ranges), out = emptyBands(), signal = silentSignal()
  const before = db([0, 0, 0.04, 0, 0, 0]), after = db([0, 0, Math.sqrt(0.0012), 0.02, 0, 0])
  for (let i = 0; i < 400; i++) {
    processor.update(before, 0.01, true, out)
    updateSignalFeatures(signal, { bass: 0, midrange: 0.04, treble: 0 }, 0.01, i * 10)
  }
  processor.update(after, 0.01, true, out)
  updateSignalFeatures(signal, { bass: 0, midrange: 0.04, treble: 0 }, 0.01, 4000)
  assert.ok(signal.transient.midrange < 0.00001)
  assert.ok(out.midrange > 0.35)
  assert.ok(Math.abs(processor.l2.midrange - 0.02) < 1e-7)
  assert.equal(out.bass, 0)
  assert.equal(out.treble, 0)
})
test('L1 vs L2: distributed changes do not scale the L2 path by bin count', () => {
  const processor = createSpectralFlux(6, ranges), out = emptyBands()
  processor.update(db([0, 0, 0, 0, 0, 0]), 0.01, true, out)
  processor.update(db([0.01, 0.01, 0, 0, 0, 0]), 0.01, true, out)
  assert.ok(Math.abs(processor.l1.bass - 0.02) < 1e-7)
  assert.ok(Math.abs(processor.l2.bass - Math.sqrt(2) * 0.01) < 1e-7)
})
test('weak attacks survive a sustained neighbour; steady tones and decay add no flux', () => {
  const processor = createSpectralFlux(6, ranges), out = emptyBands()
  processor.update(db([0, 0, 0.08, 0.01, 0, 0]), 0.01, true, out)
  const held = db([0, 0, 0.08, 0.03, 0, 0])
  processor.update(held, 0.01, true, out)
  assert.ok(out.midrange > 0.35)
  for (let i = 0; i < 300; i++) processor.update(held, 0.01, true, out)
  assert.ok(out.midrange < 0.00001)
  processor.update(db([0, 0, 0.04, 0.01, 0, 0]), 0.01, true, out)
  assert.equal(processor.l2.midrange, 0)
})
test('quiet/loud ordering, silence floor and pitch migration tradeoff', () => {
  const results = [0.001, 0.01, 0.1, 0.4].map((m) => {
    const p = createSpectralFlux(6, ranges), out = emptyBands()
    p.update(db([0, 0, 0, 0, 0, 0]), 0.01, true, out)
    p.update(db([m, 0, 0, 0, 0, 0]), 0.01, true, out)
    return out.bass
  })
  for (let i = 1; i < results.length; i++) assert.ok(results[i] > results[i - 1] && results[i] < 1)
  const p = createSpectralFlux(6, ranges), out = emptyBands()
  p.update(new Float32Array(6).fill(-100), 0.01, true, out)
  p.update(new Float32Array(6).fill(-90), 0.01, true, out)
  assert.deepEqual(out, emptyBands())
  p.update(db([0.02, 0, 0, 0, 0, 0]), 0.01, true, out)
  p.update(db([0, 0.02, 0, 0, 0, 0]), 0.01, true, out)
  assert.ok(p.l2.bass > 0.019) // Flux also detects pitch migration; not beat recognition.
})
test('pause, source reset and stalled updates prime history without false resume attacks', () => {
  const p = createSpectralFlux(6, ranges), out = emptyBands(), loud = db([0.1, 0, 0, 0, 0, 0])
  p.update(loud, 0.01, true, out)
  assert.deepEqual(out, emptyBands())
  p.update(loud, 0.01, false, out)
  p.update(loud, 0.01, true, out)
  assert.equal(p.l2.bass, 0)
  p.update(db([0.4, 0, 0, 0, 0, 0]), 0.5, true, out)
  assert.equal(p.l2.bass, 0)
  p.reset()
  assert.deepEqual(p.l1, emptyBands())
  assert.deepEqual(p.l2, emptyBands())
})
test('a resolved attack/release shape stays comparable across update cadences', () => {
  const measurements = [30, 60, 120].map((fps) => {
    const p = createSpectralFlux(6, ranges), out = emptyBands()
    let peak = 0, area = 0
    for (let i = 0; i < fps * 2; i++) {
      const time = i / fps
      const amplitude = time < 0.3 ? 0 : time < 0.4 ? (time - 0.3) * 0.3 : 0.03 * Math.exp(-(time - 0.4) / 0.15)
      p.update(db([amplitude, 0, 0, 0, 0, 0]), 1 / fps, true, out)
      peak = Math.max(peak, out.bass)
      area += out.bass / fps
    }
    return { peak, area }
  })
  for (const key of ['peak', 'area']) {
    const values = measurements.map((m) => m[key])
    assert.ok(Math.max(...values) / Math.min(...values) < 1.2, JSON.stringify(measurements))
  }
})

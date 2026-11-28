import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bandMagnitude, emptyBands, resetSignal, silentSignal, type AudioSignal, type BandValues } from '../src/audio/signal.ts'
import { FEATURE_SETTINGS, updateSignalFeatures } from '../src/audio/features.ts'

function feed(signal: AudioSignal, raw: BandValues, seconds: number, fps = 100, settings = FEATURE_SETTINGS) {
  for (let i = 0; i < Math.round(seconds * fps); i++) updateSignalFeatures(signal, raw, 1 / fps, (i + 1) * 1000 / fps, settings)
}
test('integrated band magnitude accounts for distributed energy without early clipping', () => {
  const bins = new Float32Array(4).fill(-30)
  const one = bandMagnitude(bins, 0, 1), four = bandMagnitude(bins, 0, 4)
  assert.ok(Math.abs(four - one * 2) < 1e-8)
  assert.ok(bandMagnitude(new Float32Array([0, 0]), 0, 2) > 1)
  assert.equal(bandMagnitude(new Float32Array([-Infinity, NaN, -80]), 0, 3), 0)
})
test('short hits survive the fast path and remain isolated by band', () => {
  for (const band of ['bass', 'midrange', 'treble'] as const) {
    const signal = silentSignal(), raw = { ...emptyBands(), [band]: 0.025 }
    updateSignalFeatures(signal, raw, 0.01, 10)
    assert.ok(signal.fast[band] > signal.levels[band] * 0.7)
    assert.ok(signal.transient[band] > 0.1)
    for (const other of (['bass', 'midrange', 'treble'] as const).filter((b) => b !== band)) {
      assert.equal(signal.fast[other], 0)
      assert.equal(signal.transient[other], 0)
    }
  }
})
test('sustained tone retains energy and atmosphere while transient returns near zero', () => {
  const signal = silentSignal(), raw = { bass: 0.025, midrange: 0, treble: 0 }
  feed(signal, raw, 3)
  assert.ok(signal.fast.bass > 0.4)
  assert.ok(signal.slow.bass > 0.4)
  assert.ok(signal.transient.bass < 0.001)
  assert.ok(signal.atmosphere > 0.1)
  assert.equal(signal.bass, signal.fast.bass)
  assert.equal(signal.intensity, signal.atmosphere)
})
test('quiet/loud attacks retain ordering, and levels do not clip at the old reference', () => {
  let previousLevel = 0, previousTransient = 0
  for (const amplitude of [0.001, 0.01, 0.03, 0.1, 0.4]) {
    const signal = silentSignal()
    feed(signal, { bass: amplitude, midrange: 0, treble: 0 }, 0.02)
    assert.ok(signal.levels.bass > previousLevel && signal.levels.bass < 1)
    assert.ok(signal.transient.bass > previousTransient)
    previousLevel = signal.levels.bass
    previousTransient = signal.transient.bass
  }
})
test('repeated hits over sustained bass produce accents without a tempo detector', () => {
  const signal = silentSignal(), base = { bass: 0.01, midrange: 0, treble: 0 }
  feed(signal, base, 3)
  assert.ok(signal.transient.bass < 0.001)
  for (let hit = 0; hit < 5; hit++) {
    feed(signal, { ...base, bass: 0.08 }, 0.03)
    assert.ok(signal.transient.bass > 0.25)
    feed(signal, base, 0.47)
    assert.ok(signal.transient.bass < 0.025)
  }
})
test('per-band sensitivity is independent and slow atmosphere has a separate release', () => {
  const a = silentSignal(), b = silentSignal(), raw = { bass: 0.01, midrange: 0.01, treble: 0.01 }
  const changed = { ...FEATURE_SETTINGS, bass: { ...FEATURE_SETTINGS.bass, sensitivity: 8 } }
  feed(a, raw, 1)
  feed(b, raw, 1, 100, changed)
  assert.ok(b.fast.bass > a.fast.bass)
  assert.equal(b.fast.midrange, a.fast.midrange)
  assert.equal(b.fast.treble, a.fast.treble)
  feed(a, emptyBands(), 0.5)
  assert.ok(a.atmosphere > a.fast.bass * 5)
})
test('elapsed-time envelopes agree across frame rates and reset preserves stable objects', () => {
  const a = silentSignal(), b = silentSignal(), raw = { bass: 0.03, midrange: 0.03, treble: 0.03 }
  feed(a, raw, 1, 30)
  feed(b, raw, 1, 120)
  assert.ok(Math.abs(a.fast.bass - b.fast.bass) < 1e-8)
  assert.ok(Math.abs(a.slow.midrange - b.slow.midrange) < 1e-8)
  assert.ok(Math.abs(a.transient.bass - b.transient.bass) < 0.015)
  const fast = a.fast, slow = a.slow, transient = a.transient
  resetSignal(a)
  assert.equal(a.fast, fast)
  assert.equal(a.slow, slow)
  assert.equal(a.transient, transient)
  assert.deepEqual(a, silentSignal())
})

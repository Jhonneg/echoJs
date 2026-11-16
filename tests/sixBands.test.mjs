import test from 'node:test'
import assert from 'node:assert/strict'
import { SIX_BAND_NAMES, silentSignal, resetSignal, binRange } from '../src/audio/signal.ts'
import { createSixBandAnalysis, SIX_BAND_SETTINGS } from '../src/audio/sixBands.ts'
import { createLayerMotion, updateLayerMotion } from '../src/scenes/lavender-peaks/motion.ts'

const frequencies = [47, 141, 469, 1500, 4000, 10000]

test('six isolated FFT tones reach only their mountain across supported sample rates', () => {
  for (const sampleRate of [16000, 44100, 48000, 96000]) {
    const fftSize = sampleRate > 48000 ? 4096 : 2048
    for (let band = 0; band < 6; band++) {
      if (frequencies[band] >= sampleRate / 2) continue
      const signal = silentSignal()
      const processor = createSixBandAnalysis(sampleRate, fftSize)
      const bins = new Float32Array(fftSize / 2).fill(-Infinity)
      bins[Math.round(frequencies[band] * fftSize / sampleRate)] = -30
      processor.update(bins, 0.1, signal.sixBands)
      for (let mountain = 0; mountain < 6; mountain++) {
        const motion = createLayerMotion()
        updateLayerMotion(motion, signal, mountain, 1, false, 1 / 60)
        assert.equal(motion.offset > 0, mountain === band)
      }
      assert.equal(signal.fast.bass, 0) // Parallel analysis leaves Bloom's features alone.
    }
  }
})

test('half-open ranges meet without overlaps, and stop at Nyquist', () => {
  for (const sampleRate of [16000, 44100, 48000, 96000]) {
    const ranges = SIX_BAND_NAMES.map(name => {
      const { low, high } = SIX_BAND_SETTINGS[name]
      return binRange(low, high, sampleRate, 4096)
    })
    for (let i = 1; i < 6; i++) assert.equal(ranges[i - 1][1], ranges[i][0])
    assert.ok(ranges[5][1] <= 2048)
  }
})

test('energy is bounded, ordered with magnitude, and decays after pause/silence', () => {
  const processor = createSixBandAnalysis(48000, 2048)
  for (const name of SIX_BAND_NAMES) {
    const signal = silentSignal()
    const { low, high } = SIX_BAND_SETTINGS[name]
    const [start, end] = binRange(low, high, 48000, 2048)
    const bins = new Float32Array(1024).fill(-Infinity)
    const bin = Math.floor((start + end) / 2)
    bins[bin] = -50
    processor.update(bins, 1, signal.sixBands)
    const quiet = signal.sixBands[name]
    bins[bin] = -20
    processor.update(bins, 1, signal.sixBands)
    assert.ok(signal.sixBands[name] > quiet && signal.sixBands[name] <= 1)
    bins.fill(-Infinity)
    processor.update(bins, 3, signal.sixBands)
    assert.ok(signal.sixBands[name] < 0.00001)
  }
})

test('teardown resets six bands in place and silence/invalid bins stay at zero', () => {
  const signal = silentSignal(), reference = signal.sixBands
  for (const name of SIX_BAND_NAMES) signal.sixBands[name] = 1
  resetSignal(signal)
  assert.equal(signal.sixBands, reference)
  assert.deepEqual(signal, silentSignal())
  const bins = new Float32Array(1024).fill(-80)
  bins[12] = NaN
  createSixBandAnalysis(48000, 2048).update(bins, 0.1, signal.sixBands)
  assert.deepEqual(signal, silentSignal())
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { binRange, bandLevel, smooth } from '../src/audio/signal.ts'

test('bin mapping respects sample rate, half-open bands and Nyquist', () => {
  assert.deepEqual(binRange(250, 4000, 48000, 2048), [11, 171])
  assert.deepEqual(binRange(4000, 20000, 16000, 2048), [512, 1024])
  assert.deepEqual(binRange(20000, 40000, 16000, 2048), [1024, 1024])
  assert.deepEqual(binRange(-20, 20, 48000, 2048), [0, 1])
  assert.deepEqual(binRange(20, 10, 48000, 2048), [0, 0])
})
test('synthetic FFT isolates low/mid/high tones across sample rates', () => {
  for (const sampleRate of [16000, 44100, 48000]) {
    for (const [frequency, expected] of [[100, 0], [1000, 1], [6000, 2]]) {
      const bins = new Float32Array(1024).fill(-Infinity)
      bins[Math.round(frequency * 2048 / sampleRate)] = -30
      const levels = [[20, 250], [250, 4000], [4000, 20000]].map(([a, b]) => bandLevel(bins, ...binRange(a, b, sampleRate, 2048)))
      levels.forEach((value, i) => assert.equal(value > 0, i === expected))
    }
  }
})
test('normalization is bounded, amplitude-based and silent at floor', () => {
  const value = (db: number) => bandLevel(new Float32Array([db]), 0, 1)
  assert.equal(value(-Infinity), 0)
  assert.equal(value(NaN), 0)
  assert.equal(value(-80), 0)
  assert.ok(Math.abs(value(-40) - 0.1) < 1e-6)
  assert.equal(value(-20), 1)
  assert.equal(value(20), 1)
  assert.equal(bandLevel(new Float32Array(), 0, 10), 0)
})
test('smoothing uses elapsed time, bounded attack and decay toward silence', () => {
  let fine = 0
  for (let i = 0; i < 60; i++) fine = smooth(fine, 1, 1 / 60)
  assert.ok(Math.abs(fine - smooth(0, 1, 1)) < 1e-10)
  assert.ok(smooth(0, 1, 0.1) > 0.6)
  assert.ok(smooth(1, 0, 3) < 0.001)
  assert.equal(smooth(0, 1, 0), 0)
})

test('96 kHz with larger FFT preserves low-frequency bin coverage', () => {
  for (const [low, high] of [[20, 250], [250, 4000], [4000, 20000]]) {
    assert.deepEqual(binRange(low, high, 96000, 4096), binRange(low, high, 48000, 2048))
  }
  const bins = new Float32Array(2048).fill(-Infinity)
  bins[Math.round(50 * 4096 / 96000)] = -30
  assert.ok(bandLevel(bins, ...binRange(20, 250, 96000, 4096)) > 0)
  assert.equal(bandLevel(bins, ...binRange(250, 4000, 96000, 4096)), 0)
})

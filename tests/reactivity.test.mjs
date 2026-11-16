import assert from 'node:assert/strict'
import { test } from 'node:test'
import { silentSignal } from '../src/audio/signal.ts'
import { createBloomResponse, updateBloomResponse } from '../src/scenes/bloom/reactivity.ts'

test('scene maps fast energy and transient accents separately without another envelope', () => {
  const signal = silentSignal(), response = createBloomResponse()
  signal.fast.bass = 0.5
  signal.transient.bass = 0.75
  signal.atmosphere = 0.3
  updateBloomResponse(response, signal, 1)
  assert.ok(Math.abs(response.bass - 0.7) < 1e-12)
  assert.equal(response.midrange, 0)
  assert.equal(response.treble, 0)
  assert.equal(response.glow, 0.3)
  signal.fast.bass = signal.transient.bass = 0
  updateBloomResponse(response, signal, 1)
  assert.equal(response.bass, 0)
})
test('zero Reactivity removes reactive amplitude; volume is not involved', () => {
  const signal = silentSignal(), response = createBloomResponse()
  for (const bands of [signal.fast, signal.transient]) Object.assign(bands, { bass: 1, midrange: 1, treble: 1 })
  signal.atmosphere = 1
  updateBloomResponse(response, signal, 1)
  assert.deepEqual(response, { bass: 1, midrange: 1, treble: 1, glow: 1 })
  updateBloomResponse(response, signal, 0)
  assert.ok(Object.values(response).every((value) => value === 0))
})
test('sustained bands give modest motion; new attacks produce stronger accents', () => {
  const signal = silentSignal(), sustained = createBloomResponse(), hit = createBloomResponse()
  Object.assign(signal.fast, { bass: 0.5, midrange: 0.5, treble: 0.5 })
  updateBloomResponse(sustained, signal, 1)
  Object.assign(signal.transient, { bass: 0.5, midrange: 0.5, treble: 0.5 })
  updateBloomResponse(hit, signal, 1)
  for (const band of ['bass', 'midrange', 'treble']) assert.ok(hit[band] > sustained[band] * 3)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { silentSignal } from '../src/audio/signal.ts'
import { createBloomResponse, defaultBloomDebug, updateBloomResponse, updateFragmentResponse } from '../src/scenes/bloom/reactivity.ts'

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
test('flux comparison preserves the accepted path and combined mode does not add accents twice', () => {
  const signal = silentSignal(), response = createBloomResponse()
  signal.fast.midrange = 0.2
  signal.transient.midrange = 0.3
  signal.flux.midrange = 0.6
  updateBloomResponse(response, signal, 1, { ...defaultBloomDebug, accent: 'energy' })
  assert.ok(Math.abs(response.midrange - 0.275) < 1e-12)
  updateBloomResponse(response, signal, 1)
  assert.ok(Math.abs(response.midrange - 0.5) < 1e-12)
  updateBloomResponse(response, signal, 1, { ...defaultBloomDebug, accent: 'flux' })
  assert.ok(Math.abs(response.midrange - 0.5) < 1e-12)
  signal.transient.midrange = 0.8
  updateBloomResponse(response, signal, 1)
  assert.ok(Math.abs(response.midrange - 0.65) < 1e-12)
})
test('visual isolation leaves live audio features unchanged and optionally suppresses atmosphere', () => {
  const signal = silentSignal(), response = createBloomResponse()
  Object.assign(signal.fast, { bass: 0.5, midrange: 0.5, treble: 0.5 })
  signal.atmosphere = 0.4
  const original = structuredClone(signal)
  for (const band of ['bass', 'midrange', 'treble']) {
    updateBloomResponse(response, signal, 1, { ...defaultBloomDebug, band, ambient: false })
    assert.ok(response[band] > 0)
    for (const other of ['bass', 'midrange', 'treble'].filter((b) => b !== band)) assert.equal(response[other], 0)
    assert.equal(response.glow, 0)
  }
  assert.deepEqual(signal, original)
})
test('synthetic pulse works without audio and obeys isolation, decay and Reactivity zero', () => {
  const signal = silentSignal(), response = createBloomResponse()
  const debug = { ...defaultBloomDebug, band: 'midrange', synthetic: true, pulseAt: 1000 }
  updateBloomResponse(response, signal, 1, debug, 1000)
  assert.deepEqual(response, { bass: 0, midrange: 1, treble: 0, glow: 0 })
  updateBloomResponse(response, signal, 1, debug, 1240)
  assert.ok(Math.abs(response.midrange - Math.exp(-2)) < 1e-12)
  updateBloomResponse(response, signal, 0, debug, 1000)
  assert.ok(Object.values(response).every((v) => v === 0))
  assert.deepEqual(signal, silentSignal())
})
test('mid movement varies by fragment; treble only drives localized highlights', () => {
  const a = { x: 0, y: 0, rotation: 0, highlight: 0 }, b = { ...a }
  updateFragmentResponse(a, 0, 0, 1, 0)
  updateFragmentResponse(b, 0, 1, 1, 0)
  assert.ok(a.y > 0 && b.y < 0)
  assert.ok(a.rotation > 0 && b.rotation < 0)
  assert.equal(a.highlight, 0)
  updateFragmentResponse(a, 0, 0, 0, 1)
  updateFragmentResponse(b, 0, 1, 0, 1)
  assert.ok(a.x === 0 && a.y === 0 && a.rotation === 0)
  assert.ok(a.highlight > 0)
  assert.equal(b.highlight, 0)
  updateFragmentResponse(a, 0, 0, 0, 0)
  assert.ok(Object.values(a).every((v) => v === 0))
})

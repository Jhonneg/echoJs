import test from 'node:test'
import assert from 'node:assert/strict'
import { silentSignal, smooth } from '../src/audio/signal.ts'
import { createNocturneResponse, updateNocturneResponse } from '../src/scenes/nocturne/reactivity.ts'
const manual = { magenta: 0.2, cyan: 0.5, violet: 0.9 }
const fresh = () => Object.assign(silentSignal(), { isPlaying: true, updatedAt: 1000 })
function advance(state, signal, seconds = 2, gain = 1, reduced = false, hz = 60) {
  for (let i = 0; i < seconds * hz; i++) {
    signal.updatedAt = 1000 + i * 1000 / hz
    updateNocturneResponse(state, signal, 'audio', manual, gain, reduced, 1 / hz, signal.updatedAt)
  }
}
test('each band rises smoothly but faster than the first N05 envelope', () => {
  for (const [band, group, originalAttack] of [['bass', 'magenta', 0.045], ['midrange', 'cyan', 0.065], ['treble', 'violet', 0.035]]) {
    const signal = fresh(), state = createNocturneResponse()
    signal.fast[band] = 1;signal.flux[band] = 1
    updateNocturneResponse(state, signal, 'audio', manual, 1, false, 1 / 60, 1000)
    assert.ok(state[group] > smooth(0, 1, 1 / 60, originalAttack))
    assert.ok(state[group] < 1, 'first frame must not jump to full brightness')
    const first = state[group]
    advance(state, signal, 0.1)
    assert.ok(state[group] > first && state[group] > 0.94)
    for (const name of ['magenta', 'cyan', 'violet']) if (name !== group) assert.equal(state[name], 0)
  }
})
test('sustained energy stays illuminated without flash timers, while accents add brightness', () => {
  const signal = fresh(), state = createNocturneResponse()
  signal.fast.bass = 0.7;advance(state, signal)
  const sustained = state.magenta
  assert.ok(sustained > 0.3)
  advance(state, signal, 3);assert.ok(state.magenta >= sustained)
  signal.flux.bass = 1;advance(state, signal);assert.ok(state.magenta > sustained && state.magenta <= 1)
  signal.fast.bass = 0;advance(state, signal);assert.equal(state.magenta, 0)
})
test('reactivity scales all illumination and zero immediately clears output', () => {
  const states = [0.25, 0.5, 1].map(gain => {
    const signal = fresh(), state = createNocturneResponse()
    signal.fast.bass = signal.flux.bass = signal.atmosphere = 1
    advance(state, signal, 2, gain);return state
  })
  assert.ok(Math.abs(states[0].magenta * 4 - states[2].magenta) < 1e-9)
  updateNocturneResponse(states[2], fresh(), 'audio', manual, 0, false, 0, 1000)
  assert.deepEqual(states[2], createNocturneResponse())
})
test('pause, disconnect, stale and invalid timestamps fade smoothly to exact zero', () => {
  for (const kind of ['pause', 'stale', 'empty', 'future', 'nan']) {
    const signal = fresh(), state = { magenta: 1, cyan: 1, violet: 1, atmosphere: 1 }
    signal.fast.bass = signal.fast.midrange = signal.fast.treble = signal.atmosphere = 1
    if (kind === 'pause') signal.isPlaying = false
    if (kind === 'empty') signal.updatedAt = 0
    if (kind === 'future') signal.updatedAt = 2000
    if (kind === 'nan') signal.updatedAt = NaN
    const now = kind === 'stale' ? 1300 : 1000
    updateNocturneResponse(state, signal, 'audio', manual, 1, false, 1 / 60, now)
    assert.ok(state.magenta > 0 && state.magenta < 1)
    for (let i = 0; i < 300; i++) updateNocturneResponse(state, signal, 'audio', manual, 1, false, 1 / 60, now)
    assert.deepEqual(state, createNocturneResponse(), kind)
  }
})
test('cadence, slower reduced motion, quiet targets and invalid values remain bounded', () => {
  const outputs = [30, 60, 120].map(hz => {
    const signal = fresh(), state = createNocturneResponse()
    signal.fast.bass = 0.6;signal.atmosphere = 0.7
    advance(state, signal, 1, 1, false, hz);return state
  })
  assert.ok(Math.abs(outputs[0].magenta - outputs[2].magenta) < 1e-9)
  const signal = fresh(), normal = createNocturneResponse(), reduced = createNocturneResponse()
  signal.fast.bass = 0.6;signal.atmosphere = 0.01
  advance(normal, signal, 0.1);advance(reduced, signal, 0.1, 1, true)
  assert.ok(reduced.magenta > 0 && reduced.magenta < normal.magenta)
  assert.ok(reduced.atmosphere > 0)
  signal.fast.bass = NaN;signal.transient.bass = Infinity
  advance(normal, signal, 5);assert.equal(normal.magenta, 0)
  updateNocturneResponse(normal, signal, 'audio', manual, NaN, false, Infinity, 1000)
  assert.deepEqual(normal, createNocturneResponse())
})
test('manual isolation ignores playback/reactivity and switching to Audio releases it', () => {
  const state = createNocturneResponse(), signal = silentSignal()
  updateNocturneResponse(state, signal, 'manual', manual, 0, true, 0, 0)
  assert.deepEqual(state, { ...manual, atmosphere: 0 })
  advance(state, signal, 5);assert.deepEqual(state, createNocturneResponse())
})

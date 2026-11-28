import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import {
  CYAN_WINDOW_EMISSION_CAP, CYAN_WINDOW_EMISSION_GAIN, GATE_FLOOR, calibrateNocturneLevel, createNocturneVisualState, updateNocturneVisualState,
} from '../src/scenes/nocturne/visualState.ts'

// Audio through the real Nocturne visual state (as in nocturneEffects.test.ts).
function run(seconds: number, { six = {}, intensity, mode = 'audio', manual = { magenta: 1, cyan: 1, cyanPanel: 1, violet: 1 } }: { six?: object, intensity?: number, mode?: 'audio' | 'manual', manual?: { magenta: number, cyan: number, cyanPanel: number, violet: number } } = {}) {
  const store = createMusicFeatureStore(), state = createNocturneVisualState(), reader = store.reader
  const input:any={ session: 1, status: 'active', sampleRate: 48000, fftSize: 2048, events: [], sequence: 0, updatedAtSeconds: 1,
    energy: { low: 0, mid: 0, high: 0, overall: 0, six: { ...emptySixBands(), ...six } },
    context: { intensity: intensity ?? (Object.keys(six).length ? 0.7 : 0), brightness: 0, brightnessValid: false, activity: 0 } }
  let time = 1
  for (let i = 0; i < seconds * 60; i++) {
    time += 1 / 60; input.updatedAtSeconds = time; store.publish(input)
    updateNocturneVisualState(state, reader, mode, manual, 1, false, 1 / 60, time)
  }
  return state
}
const mids = { lowMids: 0.35, highMids: 0.35 }

test('NT18: in Audio the cyan windows glow brighter, capped below clipping, while their spill is unchanged', () => {
  const state = run(4, { six: mids })
  const base = state.midrange.windowBody
  assert.ok(base > 0.1, `window body ${base}`)
  const level = calibrateNocturneLevel(base)
  for (const value of state.instances.cyanWindows) {
    assert.ok(Math.abs(value - Math.max(level, Math.min(CYAN_WINDOW_EMISSION_CAP, level * CYAN_WINDOW_EMISSION_GAIN))) < 1e-9, `${value}`)
    assert.ok(value > level, 'boosted')
  }
  // The cap keeps the untonemapped pane (emissive intensity 1.3, blue 1) below clipping.
  assert.ok(CYAN_WINDOW_EMISSION_CAP * 1.3 < 1)
  // Spill and the channel level follow the unboosted level, as in NT13.
  assert.ok(Math.abs(state.channels.cyanWindows.level - calibrateNocturneLevel(base)) < 1e-9)
  assert.ok(state.spill.cyanWindows <= Math.min(1, 2 * calibrateNocturneLevel(base)) + 1e-9)
})

test('NT18: silence keeps the windows dark; Manual is unchanged', () => {
  const silent = run(3)
  assert.deepEqual([...silent.instances.cyanWindows], [0, 0, 0, 0, 0])
  const manual = run(1, { mode: 'manual', manual: { magenta: 0, cyan: 0.4, cyanPanel: 0, violet: 0 } })
  assert.deepEqual([...manual.instances.cyanWindows], [0.4, 0.4, 0.4, 0.4, 0.4])
})

test('NT18: the gate keeps a constant floor in every mode, and the music lifts it as before', () => {
  for (const options of [{}, { mode: 'manual', manual: { magenta: 0, cyan: 0, cyanPanel: 0, violet: 0 } }] as const) {
    const state = run(3, options)
    assert.equal(state.atmosphere.level, GATE_FLOOR)
    assert.ok(Math.abs(state.atmosphere.cyan - GATE_FLOOR * 0.85) < 1e-12)
    assert.ok(Math.abs(state.atmosphere.magenta - GATE_FLOOR * 0.24) < 1e-12)
    assert.ok(Math.abs(state.atmosphere.violet - GATE_FLOOR * 0.16) < 1e-12)
    // The floor lights the gate only: no depth light, fog unchanged.
    assert.equal(state.environment.depthLight, 0)
    assert.equal(state.atmosphere.fogFar, 74)
  }
  const loud = run(6, { intensity: 1 })
  assert.ok(loud.atmosphere.level > 0.59 && loud.atmosphere.level < 0.65, `${loud.atmosphere.level}`)
})

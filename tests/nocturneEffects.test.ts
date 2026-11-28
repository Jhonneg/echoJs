import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import { GATE_FLOOR, createNocturneVisualState, updateNocturneVisualState } from '../src/scenes/nocturne/visualState.ts'
import {
  GLOW, GLOW_BLUR_WEIGHTS, GLOW_IDLE, GLOW_SOURCE_GAIN, GLOW_THRESHOLD, HAZE, STREAK, hazeLevels, isGlowSource, sceneLightLevel, streakGlsl, streakWeights,
} from '../src/scenes/nocturne/effects.ts'

// Silent or loud audio through the real Nocturne visual state.
function run(seconds: number, six = {}, mode: 'audio' | 'manual' = 'audio') {
  const store = createMusicFeatureStore(), state = createNocturneVisualState(), reader = store.reader
  const input:any={ session: 1, status: 'active', sampleRate: 48000, fftSize: 2048, events: [], sequence: 0, updatedAtSeconds: 1,
    energy: { low: 0, mid: 0, high: 0, overall: 0, six: { ...emptySixBands(), ...six } },
    context: { intensity: Object.keys(six).length ? 0.7 : 0, brightness: 0, brightnessValid: false, activity: 0 } }
  let time = 1
  for (let i = 0; i < seconds * 60; i++) {
    time += 1 / 60; input.updatedAtSeconds = time; store.publish(input)
    updateNocturneVisualState(state, reader, mode, { magenta: 1, cyan: 1, cyanPanel: 1, violet: 1 }, 1, false, 1 / 60, time)
  }
  return state
}

test('NT16/NT18: in silence only the gate floor glows; the fixtures and their haze stay off', () => {
  const state = run(3)
  // NT18 replaced the fully dark idle with a faint, constant gate glow (owner-approved).
  assert.equal(sceneLightLevel(state), GATE_FLOOR)
  assert.ok(GATE_FLOOR >= GLOW_IDLE)
  const haze = hazeLevels(state)
  assert.equal(haze.gate, GATE_FLOOR)
  for (const name of ['magenta', 'cyan', 'bridge']) assert.equal(haze[name], 0, name)
  assert.equal(sceneLightLevel(createNocturneVisualState()), 0)
})

test('NT16: with music the glow runs and each haze follows its own fixture', () => {
  const loud = run(3, { subBass: 0.4, bass: 0.4, lowMids: 0.3, highMids: 0.3, presence: 0.2, air: 0.2 })
  assert.ok(sceneLightLevel(loud) > GLOW_IDLE)
  const haze = hazeLevels(loud)
  assert.ok(haze.magenta > 0 && haze.gate > 0, JSON.stringify(haze))
  assert.ok(Math.abs(haze.magenta - loud.channels.magentaMain.level) < 1e-12)
  assert.ok(Math.abs(haze.cyan - loud.channels.cyanPanel.level) < 1e-12)
  // Manual all-on lights everything (the lighting preview).
  assert.ok(sceneLightLevel(run(2, {}, 'manual')) > 0.5)
  // Levels are clamped to 0–1 and bad values count as off.
  const odd = createNocturneVisualState(); odd.channels.magentaMain.level = 4; odd.channels.cyanPanel.level = Number.NaN
  assert.equal(hazeLevels(odd).magenta, 1); assert.equal(hazeLevels(odd).cyan, 0)
})

test('NT16 glow: only light sources glow, close to each light, and cheaper on Low', () => {
  assert.equal(isGlowSource('nocturne-gate-light', { r: 0, g: 0, b: 0 }), true)
  assert.equal(isGlowSource('nocturne-metal-building', { r: 0, g: 0, b: 0 }), false)
  assert.equal(isGlowSource('nocturne-magenta', { r: 1, g: 0, b: 0.36 }), true)
  assert.equal(isGlowSource('nocturne-cable', undefined), false)
  assert.ok(GLOW.low.scale < GLOW.standard.scale && GLOW.standard.scale <= 0.5)
  assert.ok(GLOW_THRESHOLD > 0, 'faint fog on unlit fixtures must not glow')
  for (let i = 1; i < GLOW_BLUR_WEIGHTS.length; i++) assert.ok(GLOW_BLUR_WEIGHTS[i] < GLOW_BLUR_WEIGHTS[i - 1], 'wider blurs weigh less')
  assert.ok(GLOW_BLUR_WEIGHTS.at(-1)! <= 0.05)
  // The main magenta panel glows at a reduced level (owner: its glare was too high).
  for (const gain of Object.values(GLOW_SOURCE_GAIN)) assert.ok(gain > 0 && gain < 1)
})

test('NT16 streaks: normalised, symmetric weights; fewer taps on Low', () => {
  for (const taps of [1, 7, 13, 8]) {
    const w = streakWeights(taps)
    assert.equal(w.length % 2, 1, 'odd tap count')
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-12)
    for (let i = 0; i < w.length; i++) assert.ok(Math.abs(w[i] - w[w.length - 1 - i]) < 1e-12)
    assert.equal(Math.max(...w), w[(w.length - 1) / 2], 'strongest at the reflection point')
  }
  assert.ok(STREAK.low.taps < STREAK.standard.taps)
  const glsl = streakGlsl(STREAK.standard.taps)
  assert.equal((glsl.match(/texture2D/g) ?? []).length, STREAK.standard.taps)
  assert.match(glsl, /^vec3 streak\(vec2 uv, float step\)/)
})

test('NT16 haze: the original gate halo is kept; added layers are fainter toward the camera', () => {
  assert.equal(HAZE.gateLayers[0].strength, 0.28, 'the existing halo strength')
  for (let i = 1; i < HAZE.gateLayers.length; i++) {
    assert.ok(HAZE.gateLayers[i].z > HAZE.gateLayers[i - 1].z && HAZE.gateLayers[i].strength < HAZE.gateLayers[i - 1].strength)
  }
  for (const f of Object.values(HAZE.fixtures)) assert.ok(f.strength > 0 && f.strength <= 0.15)
})

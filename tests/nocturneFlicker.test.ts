import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import { applyNocturneVisualState, createNocturneVisualState, updateNocturneVisualState } from '../src/scenes/nocturne/visualState.ts'
import { FLICKER, FLICKER_DURATION, createFlickerState, flickerFactor, updateFlicker } from '../src/scenes/nocturne/flicker.ts'

// The real Nocturne visual state, with treble onset events published like the analysis does.
function scene({ mode = 'audio', reactivity = 1, reduced = false }: { mode?: 'audio' | 'manual', reactivity?: number, reduced?: boolean } = {}) {
  const store = createMusicFeatureStore(), state = createNocturneVisualState(), reader = store.reader
  const input:any={ session: 1, status: 'active', sampleRate: 48000, fftSize: 2048, events: [], sequence: 0, updatedAtSeconds: 1,
    energy: { low: 0, mid: 0, high: 0.3, overall: 0.3, six: { ...emptySixBands(), presence: 0.3, air: 0.3 } },
    context: { intensity: 0.6, brightness: 0, brightnessValid: false, activity: 0 } }
  let time = 1, sequence = 0, minFactor = 1
  const step = (seconds = 1 / 60) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      time += 1 / 60; input.updatedAtSeconds = time; store.publish(input); input.events = []
      updateNocturneVisualState(state, reader, mode, { magenta: 1, cyan: 1, cyanPanel: 1, violet: 1 }, reactivity, reduced, 1 / 60, time)
      minFactor = Math.min(minFactor, state.flicker.factor)
    }
  }
  const hit = (strength = 0.35, band = 'high') => {
    sequence++; input.sequence = sequence
    input.events = [{ session: 1, sequence, band, strength, timeSeconds: time, emittedAtSeconds: time }]
    step()
  }
  return { state, step, hit, lowest: () => minFactor, resetLowest: () => { minFactor = 1 } }
}

test('NT22: a strong accepted treble hit starts one stutter, then the strip is exactly steady again', () => {
  const s = scene()
  s.step(1)
  assert.equal(s.lowest(), 1, 'no stutter without a hit')
  s.hit(0.35)
  assert.ok(s.state.violet.startedAt > 0, 'the violet response accepted the hit')
  s.step(0.5)
  assert.ok(s.lowest() < 0.5, `stuttered (lowest ${s.lowest()})`)
  assert.ok(s.lowest() >= 0.2 - 1e-9, 'never below 20%')
  assert.equal(s.state.flicker.factor, 1, 'steady again afterwards')
  // A weak hit, or another band, starts none.
  const w = scene(); w.step(1); w.hit(0.05); w.step(0.5)
  assert.equal(w.lowest(), 1)
  const m = scene(); m.step(1); m.hit(0.35, 'low'); m.hit(0.35, 'mid'); m.step(0.5)
  assert.equal(m.lowest(), 1)
})

test('NT22: stutters are at least 10 s apart, however many treble hits arrive', () => {
  const s = scene()
  s.step(1); s.hit(0.35); s.step(0.5)
  const first = s.state.flicker.startedAt
  s.resetLowest()
  for (let i = 0; i < 18; i++) { s.hit(0.35); s.step(0.45) } // a hit every ~0.47 s for ~8.5 s
  assert.equal(s.state.flicker.startedAt, first, 'no second stutter inside the cooldown')
  assert.equal(s.lowest(), 1)
  s.step(2); s.hit(0.35); s.step(0.5)
  assert.ok(s.state.flicker.startedAt > first, 'a new stutter after 10 s')
  assert.ok(s.state.flicker.startedAt - first >= FLICKER.cooldown)
})

test('NT22: no stutter in Manual, at Reactivity 0 or with reduced motion; switching stops one at once', () => {
  for (const options of [{ mode: 'manual' }, { reactivity: 0 }, { reduced: true }] as const) {
    const s = scene(options)
    s.step(1); s.hit(0.35); s.step(0.5)
    assert.equal(s.lowest(), 1, JSON.stringify(options))
  }
  const f = createFlickerState()
  updateFlicker(f, 5, 0.32, 5, true)
  updateFlicker(f, 5, 0.32, 5.05, true)
  assert.ok(f.factor < 1)
  updateFlicker(f, 5, 0.32, 5.06, false)
  assert.equal(f.factor, 1)
  updateFlicker(f, 5, 0.32, 5.07, true)
  assert.equal(f.factor, 1, 'the same hit is not replayed')
})

test('NT22: the pattern is soft, short and never a strobe', () => {
  assert.equal(flickerFactor(-0.01), 1)
  assert.equal(flickerFactor(FLICKER_DURATION), 1)
  assert.ok(FLICKER_DURATION < 0.5)
  // Sample finely: the floor holds, changes are gradual, and there are at most 3 dips a second.
  let dips = 0, falling = false, previous = 1
  for (let t = 0; t <= 1; t += 0.001) {
    const f = flickerFactor(t)
    assert.ok(f >= 0.2 - 1e-9 && f <= 1)
    assert.ok(Math.abs(f - previous) < 0.04, `smooth at ${t}`)
    if (f < previous - 1e-9 && !falling) { dips++; falling = true }
    if (f > previous + 1e-9) falling = false
    previous = f
  }
  assert.ok(dips <= 3, `${dips} dips in a second`)
})

test('NT22: the far-left strip follows its group, times the flicker factor', () => {
  const s = scene()
  s.step(1); s.hit(0.35); s.step(4 / 60)
  const material = { emissiveIntensity: 0 }, group = { emissiveIntensity: 0 }
  applyNocturneVisualState({ emitters: [{ channel: 'violetSecondary', flicker: true, material }, { channel: 'violetSecondary', material: group }], lights: [] }, s.state)
  assert.ok(Math.abs(material.emissiveIntensity - group.emissiveIntensity * s.state.flicker.factor) < 1e-12)
  s.step(1)
  applyNocturneVisualState({ emitters: [{ channel: 'violetSecondary', flicker: true, material }, { channel: 'violetSecondary', material: group }], lights: [] }, s.state)
  assert.equal(material.emissiveIntensity, group.emissiveIntensity)
})

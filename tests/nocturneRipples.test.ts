import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import { createNocturneVisualState, updateNocturneVisualState } from '../src/scenes/nocturne/visualState.ts'
import { RIPPLE, createRippleState, rippleRing, updateRipples } from '../src/scenes/nocturne/ripples.ts'

// The real Nocturne visual state, with bass onset events published like the analysis does.
function scene({ mode = 'audio', reactivity = 1, reduced = false }: { mode?: 'audio' | 'manual', reactivity?: number, reduced?: boolean } = {}) {
  const store = createMusicFeatureStore(), state = createNocturneVisualState(), reader = store.reader
  const input:any={ session: 1, status: 'active', sampleRate: 48000, fftSize: 2048, events: [], sequence: 0, updatedAtSeconds: 1,
    energy: { low: 0.3, mid: 0, high: 0, overall: 0.3, six: { ...emptySixBands(), bass: 0.3, subBass: 0.3 } },
    context: { intensity: 0.6, brightness: 0, brightnessValid: false, activity: 0 } }
  let time = 1, sequence = 0
  const step = (seconds = 1 / 60) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      time += 1 / 60; input.updatedAtSeconds = time; store.publish(input); input.events = []
      updateNocturneVisualState(state, reader, mode, { magenta: 1, cyan: 1, cyanPanel: 1, violet: 1 }, reactivity, reduced, 1 / 60, time)
    }
  }
  const hit = (strength = 0.35, band = 'low') => {
    sequence++; input.sequence = sequence
    input.events = [{ session: 1, sequence, band, strength, timeSeconds: time, emittedAtSeconds: time }]
    step()
  }
  const active = () => [...Array(RIPPLE.slots).keys()].filter(i => state.ripples.out[i * 4 + 3] > 0).length
  return { state, step, hit, active }
}

test('NT20: an accepted bass hit starts rings at the listed spots, in time with the magenta pulse', () => {
  const s = scene()
  s.step(1)
  assert.equal(s.active(), 0, 'nothing before a hit')
  s.hit(0.35)
  assert.ok(s.state.magenta.mainAccent > 0, 'the magenta accent fired')
  s.step(0.2)
  assert.equal(s.active(), 3, 'a strong hit starts three rings')
  // The shader output is Float32, so compare with a tolerance.
  for (let i = 0; i < RIPPLE.slots; i++) {
    const [x, z] = [s.state.ripples.out[i * 4], s.state.ripples.out[i * 4 + 1]]
    if (s.state.ripples.out[i * 4 + 3] > 0) assert.ok(RIPPLE.spots.some(([sx, sz]) => Math.abs(sx - x) < 1e-6 && Math.abs(sz - z) < 1e-6), `${x},${z}`)
  }
  // A medium hit starts two; a weak one (below minHit) starts none.
  const w = scene(); w.step(1); w.hit(0.17); w.step(0.2)
  assert.equal(w.active(), 2)
  const weak = scene(); weak.step(1); weak.hit(0.05); weak.step(0.2)
  assert.equal(weak.active(), 0)
  // Weak hits after a strong one leave its rings running.
  const k = scene(); k.step(1); k.hit(0.35); k.step(0.1)
  for (let i = 0; i < 4; i++) { k.hit(0.03); k.step(0.05) }
  assert.equal(k.active(), 3)
  // Other bands don't start rings.
  const m = scene(); m.step(1); m.hit(0.35, 'mid'); m.hit(0.35, 'high'); m.step(0.2)
  assert.equal(m.active(), 0)
})

test('NT20: rings expire, and the pool keeps at most six', () => {
  const s = scene()
  s.step(1)
  for (let i = 0; i < 5; i++) { s.hit(0.35); s.step(0.1) }
  assert.ok(s.active() <= RIPPLE.slots)
  s.step(RIPPLE.life + 0.5)
  assert.equal(s.active(), 0)
  assert.equal(s.state.ripples.active, false)
})

test('NT20: no rings in Manual, at Reactivity 0 or with reduced motion', () => {
  for (const options of [{ mode: 'manual' }, { reactivity: 0 }, { reduced: true }] as const) {
    const s = scene(options)
    s.step(1); s.hit(0.35); s.step(0.2)
    assert.equal(s.active(), 0, JSON.stringify(options))
  }
  // Switching to Manual clears rings already running.
  const r = createRippleState()
  updateRipples(r, 5, 0.42, 1, 5, true)
  updateRipples(r, 5, 0.42, 1, 5.1, true)
  assert.equal(r.active, true)
  updateRipples(r, 5, 0.42, 1, 5.2, false)
  assert.equal(r.active, false)
  // The same hit is never replayed when re-enabled.
  updateRipples(r, 5, 0.42, 1, 5.3, true)
  assert.equal(r.active, false)
})

test('NT20: a ring grows to its full radius and fades out; the spot rotation is fixed', () => {
  assert.deepEqual(rippleRing(-0.1, 1), { radius: 0, amplitude: 0 })
  assert.deepEqual(rippleRing(RIPPLE.life, 1), { radius: 0, amplitude: 0 })
  let radius = -1, amplitude = 2
  for (const age of [0, 0.2, 0.5, 0.9, 1.15]) {
    const ring = rippleRing(age, 1)
    assert.ok(ring.radius > radius && ring.radius <= RIPPLE.maxRadius && ring.amplitude < amplitude)
    radius = ring.radius; amplitude = ring.amplitude
  }
  const a = createRippleState(), b = createRippleState()
  for (const state of [a, b]) for (let h = 1; h <= 4; h++) updateRipples(state, h, 0.42, 1, h, true)
  assert.deepEqual([...a.rings], [...b.rings])
})

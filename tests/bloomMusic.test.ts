import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LIMITS, RIVER_PULSE_SECONDS, bloomMusicOutputs, createBloomMusic, knee, updateBloomMusic } from '../src/scenes/bloom/music.ts'
import { PARALLAX, parallaxStep, pointerTarget } from '../src/scenes/bloom/parallax.ts'
import type { OnsetBand } from '../src/audio/musicFeatures.ts'
import type { SixBandValues } from '../src/audio/signal.ts'

type StepOptions = { energy?: Partial<SixBandValues>, event?: OnsetBand, strength?: number, gain?: number, reduced?: boolean, playing?: boolean, fresh?: boolean, dt?: number, intensity?: number }

const names = ['subBass', 'bass', 'lowMids', 'highMids', 'presence', 'air'] as const

// A hand-driven analysis view, stepped at 60 Hz.
function fixture() {
  const s = createBloomMusic(), six = Object.fromEntries(names.map(n => [n, 0]))
  const view:any={ version: 1, session: 1, frame: 0, sequence: 0, status: 'active', updatedAtSeconds: 1, sampleRate: 48000, fftSize: 2048,
    energy: { low: 0, mid: 0, high: 0, overall: 0, six }, context: { intensity: 0, brightness: 0, brightnessValid: false, activity: 0 }, events: [] }
  let time = 1
  const step = ({ energy, event, strength = 0.6, gain = 1, reduced = false, playing = false, fresh = true, dt = 1 / 60, intensity }: StepOptions = {}) => {
    time += dt; view.frame++
    if (fresh) view.updatedAtSeconds = time
    if (energy) Object.assign(six, energy)
    if (intensity !== undefined) view.context.intensity = intensity
    view.events = event ? [{ session: view.session, sequence: ++view.sequence, band: event, strength, timeSeconds: time, emittedAtSeconds: time }] : []
    updateBloomMusic(s, view, time, dt, gain, reduced, playing)
  }
  const run = (n: number, o?: StepOptions) => { for (let i = 0; i < n; i++) step(o); return s }
  step()
  return { s, view, step, run, silence: () => Object.assign(six, Object.fromEntries(names.map(n => [n, 0]))) }
}

test('BR8/BR9: each band drives only its own elements', () => {
  // BR9: the seam follows the bass (it used to follow the high mids).
  const cases:Record<string,string[]>={ bass: ['aurora', 'seam'], subBass: ['aurora', 'seam'], highMids: [], presence: ['shimmer'], air: ['shimmer'] }
  for (const [band, elements] of Object.entries(cases)) {
    const f = fixture(); f.run(240, { energy: { [band]: 0.3 } })
    for (const other of ['aurora', 'seam', 'shimmer']) {
      // Shimmer averages presence and air, so one of them alone reaches about half.
      if (elements.includes(other)) assert.ok(f.s[other] > (other === 'shimmer' ? 0.3 : 0.5), `${band} should drive ${other}`)
      else assert.ok(f.s[other] < 1e-9, `${band} must not drive ${other} (${f.s[other]})`)
    }
  }
  // Rivers follow the mids (both low and high mids), not bass or highs.
  const f = fixture(); f.run(240, { energy: { lowMids: 0.3 } })
  assert.ok(f.s.river > 0.3 && f.s.aurora < 1e-9 && f.s.seam < 1e-9)
  const g = fixture(); g.run(240, { energy: { bass: 0.4, presence: 0.4 } })
  assert.ok(g.s.river < 1e-9)
})

test('BR9: bass hits ring the water and flash the seam; mid hits pulse the rivers', () => {
  const a = fixture(); a.step({ event: 'low', strength: 0.8 })
  assert.equal(a.s.ringAge < 0.05, true); assert.ok(Math.abs(a.s.ringStrength - 0.8) < 1e-9)
  assert.ok(a.s.seamAccent > 0.7); assert.equal(a.s.pulseStrength, 0)
  // Mid hits go to the rivers whichever mids rose (BR8 sent high-mid hits to the seam).
  const b = fixture(); b.run(10); b.run(4, { energy: { highMids: 0.4 } }); b.step({ event: 'mid' })
  assert.equal(b.s.seamAccent, 0); assert.ok(b.s.pulseStrength > 0.5)
  const c = fixture(); c.run(10, { energy: { highMids: 0.2 } }); c.run(4, { energy: { lowMids: 0.4 } }); c.step({ event: 'mid' })
  assert.ok(c.s.pulseStrength > 0.5 && c.s.pulseAlong < 0.05); assert.equal(c.s.seamAccent, 0)
  // The river pulse runs from source to mouth in RIVER_PULSE_SECONDS, then ends.
  c.run(Math.round(RIVER_PULSE_SECONDS * 60))
  assert.ok(Math.abs(c.s.pulseAlong - 1) < 0.05)
  c.run(60); assert.equal(c.s.pulseStrength, 0) // ends 0.3 past the mouth
})

test('BR8: hits fire only once, only when fresh, and never from another or an earlier session', () => {
  const f = fixture(); f.step({ event: 'low' }); f.run(120)
  const age = f.s.ringAge
  updateBloomMusic(f.s, f.view, f.view.updatedAtSeconds, 0, 1, false, false) // same events seen again
  assert.equal(f.s.ringAge, age, 'an already-seen hit must not retrigger')
  const stale = fixture(); stale.view.events = [{ session: 1, sequence: 99, band: 'low', strength: 1, timeSeconds: 0, emittedAtSeconds: 0 }]
  stale.view.sequence = 99; updateBloomMusic(stale.s, stale.view, stale.view.updatedAtSeconds, 1 / 60, 1, false, false)
  assert.equal(stale.s.ringStrength, 0, 'a hit older than 0.5 s is ignored')
  // New source: the first view's events are history, not new hits.
  const n = fixture(); n.view.session = 2; n.view.sequence = 5
  n.view.events = [{ session: 2, sequence: 5, band: 'low', strength: 1, timeSeconds: 2, emittedAtSeconds: n.view.updatedAtSeconds }]
  updateBloomMusic(n.s, n.view, n.view.updatedAtSeconds, 1 / 60, 1, false, false)
  assert.equal(n.s.ringStrength, 0); assert.equal(n.s.session, 2)
})

test('BR8: responses stay within their limits under sustained loud music and repeated hits', () => {
  const f = fixture()
  for (let i = 0; i < 1800; i++) f.step({ energy: Object.fromEntries(names.map(n => [n, 1])), intensity: 1, playing: true, event: (['low', 'mid', 'high'] as const)[i % 3], strength: 1 })
  const o = bloomMusicOutputs(f.s)
  assert.ok(o.auroraFactor <= 1 + LIMITS.aurora + 1e-9)
  assert.ok(o.seamGain <= 1 + LIMITS.seam + LIMITS.seamAccent + 1e-9)
  assert.ok(o.riverGain <= 1 + LIMITS.river + 1e-9)
  assert.ok(o.lightLift <= LIMITS.lightLift + 1e-9 && o.sparkle <= 1)
  assert.ok(o.liftFraction <= LIMITS.playLift * 1.05 + 1e-9)
  assert.ok(o.mood <= 1 && o.fog <= 1 && o.swell <= 1 && Math.abs(o.hue) <= LIMITS.hue && o.seamWarmth <= 1)
})

test('BR8: silence, stale audio and Reactivity 0 all settle back to the calm scene', () => {
  const loud = () => { const f = fixture(); f.run(300, { energy: Object.fromEntries(names.map(n => [n, 0.5])), intensity: 0.8 }); return f }
  const calm = s => ['aurora', 'seam', 'river', 'shimmer', 'intensity'].every(k => s[k] < 0.01)
  const a = loud(); a.silence(); a.run(60 * 20, { intensity: 0 }); assert.ok(calm(a.s), 'silence')
  const b = loud(); b.run(60 * 20, { fresh: false }); assert.ok(calm(b.s), 'stale')
  const c = loud(); c.run(60 * 20, { gain: 0 }); assert.ok(calm(c.s), 'reactivity 0')
  const d = fixture(); d.step({ event: 'low', gain: 0 }); assert.equal(d.s.ringStrength, 0)
})

test('BR8: reduced motion keeps slow light changes but no hits, pulses or movement', () => {
  const f = fixture()
  f.run(240, { energy: { bass: 0.4, highMids: 0.4 }, reduced: true, playing: true })
  assert.ok(f.s.aurora > 0.5 && f.s.seam > 0.5)
  f.step({ event: 'low', reduced: true }); f.step({ event: 'mid', reduced: true })
  assert.equal(f.s.ringStrength, 0); assert.equal(f.s.seamAccent, 0); assert.equal(f.s.pulseStrength, 0)
  assert.equal(bloomMusicOutputs(f.s).liftFraction, 0)
})

test('BR8: playback raises the monolith smoothly (~4 s) and returns it to the approved idle pose', () => {
  const f = fixture()
  assert.equal(bloomMusicOutputs(f.s).liftFraction, 0, 'idle is the approved pose')
  f.run(60 * 4, { playing: true }); const up = bloomMusicOutputs(f.s).liftFraction
  assert.ok(up > LIMITS.playLift * 0.85 && up <= LIMITS.playLift * 1.05)
  f.run(60 * 6, { playing: false }); assert.ok(bloomMusicOutputs(f.s).liftFraction < LIMITS.playLift * 0.05)
  assert.equal(knee(0), 0); assert.equal(knee(Number.NaN), 0)
})

test('BR8: the production analysis turns generated tones into the right Bloom response', async () => {
  const { createMusicAnalysis } = await import('../src/audio/music/analysis.ts')
  for (const [label, frequency, element] of [['bass', 140.625, 'aurora'], ['highMids', 1500, 'river']] as const) {
    const engine = createMusicAnalysis(), s = createBloomMusic(), bins = new Float32Array(1024)
    let peak = 0, other = 0
    for (let i = 1; i <= 420; i++) {
      bins.fill(-Infinity)
      if ((i >= 180 && i < 240) || (i >= 300 && i < 360)) {
        const k = Math.round((frequency * 2048) / 48000)
        for (let off = -2; off <= 2; off++) bins[k + off] = 20 * Math.log10(0.1 * [0.02, 0.125, 0.21, 0.125, 0.02][off + 2])
      }
      const now = i / 60
      engine.update(bins, 48000, 2048, now * 1000, true)
      updateBloomMusic(s, engine.reader.read(), now, 1 / 60, 1, false, false)
      peak = Math.max(peak, s[element]); other = Math.max(other, s[element === 'aurora' ? 'river' : 'aurora'])
    }
    assert.ok(peak > 0.15, `${label}: ${element} peaked at ${peak.toFixed(3)}`)
    assert.ok(other < peak * 0.25, `${label}: the other element reached ${other.toFixed(3)}`)
  }
})

test('BR8 parallax: follows the mouse within ±2.5° / ±1.2° and returns to centre', () => {
  let o = { yaw: 0, pitch: 0 }
  for (let i = 0; i < 120; i++) o = parallaxStep(o, pointerTarget(1920, 0, 1920, 1080), 1 / 60)
  assert.ok(Math.abs(o.yaw + PARALLAX.maxYaw) < 1e-4 && Math.abs(o.pitch - PARALLAX.maxPitch) < 1e-4)
  for (let i = 0; i < 120; i++) o = parallaxStep(o, { x: 0, y: 0 }, 1 / 60)
  assert.ok(Math.abs(o.yaw) < 1e-4 && Math.abs(o.pitch) < 1e-4)
  assert.deepEqual(pointerTarget(5, 5, 0, 0), { x: 0, y: 0 })
  const far = parallaxStep({ yaw: 0, pitch: 0 }, { x: 50, y: -50 }, 10)
  assert.ok(Math.abs(far.yaw) <= PARALLAX.maxYaw + 1e-12 && Math.abs(far.pitch) <= PARALLAX.maxPitch + 1e-12)
})

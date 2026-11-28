import assert from 'node:assert/strict'
import { test } from 'node:test'
import { STRUCTURE, createStructure, updateStructure } from '../src/scenes/bloom/structure.ts'
import { BURST, HUE_CENTRE, LIMITS, bloomMusicOutputs, createBloomMusic, updateBloomMusic } from '../src/scenes/bloom/music.ts'
import { HUE_SHIFT, hueShift } from '../src/scenes/bloom/sky.ts'
import { waterFragmentShader } from '../src/scenes/bloom/water.ts'

const DT = 1 / 60
type Levels = { bass?: number, mids?: number, highs?: number, live?: boolean }
type Row = { t: number, section: number, build: number, drop: number, drops: number }
// Drive the structure layer directly with kneed levels from fn(t) → { bass, mids, highs, live }.
function run(seconds: number, fn: (t: number) => Levels, st = createStructure(), from = 0) {
  const rows: Row[] = []
  for (let i = 0; i < seconds * 60; i++) {
    const t = from + i * DT, x = fn(t)
    updateStructure(st, x.bass ?? 0, x.mids ?? 0, x.highs ?? 0, x.live ?? true, DT, t)
    rows.push({ t, section: st.section, build: st.build, drop: st.drop, drops: st.drops })
  }
  return { st, rows }
}
// A pulse on every beat (120 bpm) so levels move like music rather than a flat tone.
const beat = (t: number, level: number) => level * (0.91 + 0.09 * Math.cos(2 * Math.PI * 2 * t))
// The kneed levels the real analysis gave for the BR9 browser song (scripts/verify-bloom-br9.ts):
// intro 0–14 s (pads and a soft bass note), build 14–30 s (riser: highs and mids rising), drop
// at 30 s (kicks and bass) until 46 s, then a breakdown.
const song = (t: number): Levels => t < 14 ? { bass: 0.23, mids: 0.12, highs: 0 }
  : t < 30 ? { bass: 0.24, mids: 0.12 + 0.05 * (t - 14) / 16, highs: 0.25 * (t - 14) / 16 }
  : t < 46 ? { bass: beat(t, 0.41), mids: 0.15, highs: 0.08 }
  : { bass: 0.12, mids: 0.1, highs: 0 }

test('BR9 structure: an intro, build and drop are found, once each, at the right moments', () => {
  const { rows } = run(60, song)
  const at = (s: number) => rows[Math.round(s * 60) - 1]
  assert.ok(Math.max(...rows.filter(r => r.t < 14).map(r => r.build)) < 0.1, 'no build in the intro')
  assert.ok(at(29).build > 0.5, `build late in the build (${at(29).build})`)
  assert.equal(at(60).drops, 1, 'exactly one drop')
  const first = rows.find(r => r.drops === 1)
  assert.ok(first)
  assert.ok(first.t >= 30 && first.t < 31.5, `drop detected within 1.5 s of 30 s (at ${first.t.toFixed(2)})`)
  assert.ok(first.drop > 0.65 + 0.6 * 0.3, 'a drop after a build lands harder')
  assert.ok(Math.max(...rows.filter(r => r.t > 33 && r.t < 46).map(r => r.build)) < 0.15, 'the build ends at the drop')
  assert.ok(at(44).section > 0.5 && at(44).section > at(28).section && at(12).section < 0.2, 'the drop section is the loudest')
  assert.ok(at(58).section < at(44).section * 0.6, 'the breakdown is quieter')
})

test('BR9 structure: steady music never drops or builds, however loud', () => {
  for (const level of [0.2, 0.4, 0.8]) {
    const { rows } = run(90, t => ({ bass: beat(t, level), mids: level * 0.4, highs: level * 0.3 }))
    assert.equal(rows.at(-1)!.drops, 0, `no drop at ${level}`)
    assert.ok(Math.max(...rows.filter(r => r.t > 30).map(r => r.build)) < 0.2, `no build at ${level}`)
  }
})

test('BR9 structure: no drop in the first seconds, and at most one per cooldown', () => {
  const early = run(12, t => t < 3 ? {} : t < 6 ? { bass: 0.1, mids: 0.1 } : { bass: beat(t, 0.45), mids: 0.2, highs: 0.1 })
  assert.equal(early.st.drops, 0, 'no drop in the warm-up')
  // Bass alternating quiet/loud every 4 s: never two drops closer than the cooldown.
  const { rows } = run(60, t => ((t / 4) | 0) % 2 ? { bass: beat(t, 0.45), mids: 0.2, highs: 0.1 } : { bass: 0.1, mids: 0.12, highs: 0.02 })
  const times: number[] = []; rows.forEach((r, i) => { if (i && r.drops > rows[i - 1].drops) times.push(r.t) })
  assert.ok(times.length >= 2, 'drops are found')
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= STRUCTURE.dropCooldown - 1e-9)
})

test('BR9 structure: silence or a gap settles everything and restarts the warm-up', () => {
  const loud = run(50, song)
  const { st } = run(40, () => ({ live: false }), loud.st, 50)
  assert.ok(st.section < 0.01 && st.build < 0.01 && st.drop < 0.01, JSON.stringify(st))
  assert.equal(st.since, 0)
})

// The full controller, fed analysis views.
function fixture() {
  const s = createBloomMusic(), six = { subBass: 0, bass: 0, lowMids: 0, highMids: 0, presence: 0, air: 0 }
  const view:any={ version: 1, session: 1, frame: 0, sequence: 0, status: 'active', updatedAtSeconds: 0, sampleRate: 48000, fftSize: 2048,
    energy: { low: 0, mid: 0, high: 0, overall: 0, six }, context: { intensity: 0, brightness: 0.55, brightnessValid: true, activity: 0 }, events: [] }
  let time = 0
  type StepOptions = { gain?: number, reduced?: boolean, fresh?: boolean, brightness?: number, valid?: boolean }
  const step = ({ gain = 1, reduced = false, fresh = true, brightness, valid = true }: StepOptions = {}, level = song(time)) => {
    time += DT; view.frame++
    if (fresh) view.updatedAtSeconds = time
    Object.assign(six, { subBass: level.bass ?? 0, bass: level.bass ?? 0, lowMids: level.mids ?? 0, highMids: level.mids ?? 0, presence: level.highs ?? 0, air: level.highs ?? 0 })
    if (brightness !== undefined) view.context.brightness = brightness
    view.context.brightnessValid = valid
    updateBloomMusic(s, view, time, DT, gain, reduced, true)
    return bloomMusicOutputs(s)
  }
  const play = (seconds: number, o: StepOptions, level?: (t: number) => Levels) => { let out = bloomMusicOutputs(s); for (let i = 0; i < seconds * 60; i++) out = step(o, level?.(time)); return out }
  return { s, view, step, play }
}
// Raw band energies that knee() turns into roughly the song's levels.
const raw = (k: number) => k / (1 - k) * 0.18
const rawSong = (t: number): Levels => Object.fromEntries(Object.entries(song(t)).map(([k, v]) => [k, raw(Math.min(0.97, v as number))]))

test('BR9 response: idle is the approved look; loud sections and builds darken it; a drop clears the fog and bursts rings', () => {
  const f = fixture()
  const idle = bloomMusicOutputs(f.s)
  for (const k of ['mood', 'fog', 'swell', 'hue', 'seamWarmth'] as const) assert.equal(idle[k], 0, `${k} is 0 at idle`)
  const late = f.play(29.5, {}, rawSong)
  assert.ok(late.fog > 0.3, `fog thickens in the build (${late.fog})`)
  assert.ok(late.mood > 0.2, `mood rises in the build (${late.mood})`)
  const dropped = f.play(3, {}, rawSong)
  assert.ok(f.s.drops === 1 && dropped.burst.strength > 0.5 && dropped.burst.age < 2.6, 'one ring burst at the drop (at 30–30.6 s)')
  assert.ok(dropped.fog < late.fog * 0.5, 'the drop clears the fog')
  const swell = Math.max(...Array.from({ length: 30 }, () => f.step({}, rawSong(33)).swell))
  assert.ok(swell > 0.3 && swell <= 1, `one soft sky swell (${swell})`)
  const loud = f.play(12, {}, rawSong)
  assert.ok(loud.mood > late.mood, 'the loud drop section is the darkest')
  // The drop section's mood fades back after the music stops.
  const after = f.play(40, { fresh: false }, rawSong)
  assert.ok(after.mood < 0.02 && after.fog < 0.01 && after.swell < 0.01)
  assert.equal(BURST.rings, 3)
  assert.match(waterFragmentShader, /uRingBurst/)
})

test('BR9 response: reduced motion keeps the slow mood and hue but no swell, burst or throb', () => {
  const f = fixture()
  const out = f.play(36, { reduced: true }, rawSong)
  assert.ok(f.s.drops === 1, 'the drop is still detected')
  assert.equal(out.swell, 0); assert.equal(f.s.burstStrength, 0)
  assert.ok(out.mood > 0.2, 'mood still follows the song')
  // The seam follows the bass slowly instead of throbbing on each beat.
  // Over one second of the drop section (two beats), after settling into it.
  const beats = (g: ReturnType<typeof fixture>, reduced: boolean) => { g.play(6, { reduced }, rawSong); return Array.from({ length: 60 }, (_, i) => g.step({ reduced }, rawSong(42 + i / 60)).seamWarmth) }
  const calm = beats(f, true), throb = beats(fixture(), false)
  assert.ok(Math.max(...calm) - Math.min(...calm) < 0.05, `no per-beat throb (${Math.max(...calm) - Math.min(...calm)})`)
  assert.ok(Math.max(...throb) - Math.min(...throb) > 0.1, 'the seam throbs with the beat otherwise')
})

test('BR9 response: Reactivity 0 or a new source returns everything to the approved look', () => {
  const f = fixture(); const out = f.play(45, { gain: 0 }, rawSong)
  for (const k of ['mood', 'fog', 'swell', 'hue', 'seamWarmth'] as const) assert.equal(out[k], 0, k)
  const g = fixture(); g.play(36, {}, rawSong); g.view.session = 2; g.view.sequence = 0
  g.step({}, {})
  assert.equal(g.s.structure.drops, 0); assert.equal(g.s.burstStrength, 0)
})

test('BR9 aurora hue: brighter music leans pink, duller green, within limits; idle and invalid stay approved', () => {
  const lean = (brightness: number, valid = true) => fixture().play(15, { brightness, valid }, () => ({ bass: raw(0.4), mids: raw(0.4), highs: raw(0.3) })).hue
  assert.ok(lean(0.8) > 0.9, 'bright → pink'); assert.ok(lean(0.3) < -0.9, 'dull → green')
  assert.ok(Math.abs(lean(HUE_CENTRE)) < 1e-6); assert.ok(Math.abs(lean(0.9, false)) < 1e-6, 'no valid brightness → no shift')
  assert.deepEqual(hueShift(0), { toward: HUE_SHIFT.pink, mix: 0 })
  assert.equal(hueShift(1).toward, HUE_SHIFT.pink); assert.equal(hueShift(-1).toward, HUE_SHIFT.green)
  for (const h of [-5, -1, 0.5, 5, Number.NaN]) assert.ok(hueShift(h).mix <= HUE_SHIFT.amount + 1e-12 && hueShift(h).mix >= 0)
  assert.ok(HUE_SHIFT.amount < 0.5, 'each side keeps its own colour'); assert.equal(LIMITS.hue, 1)
})

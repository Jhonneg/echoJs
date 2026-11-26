// BR9: song structure. What the music is doing over seconds rather than beats: how loud the
// current section is, whether it is building, and when it drops. Pure and testable; fed by the
// BR8 controller with kneed band levels (0–1). Modelled on the owner's Monolith Lake sketch.
//
// Levels from the shared analysis vary a lot between songs, so loudness and drops are judged
// against the song itself: section loudness relative to the loudest section so far (with a
// floor so quiet music never counts as loud), and a drop as a sharp bass jump that comes close
// to the song's loudest bass so far. Calibrated on generated songs through the real analysis.

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)
const ema = (v: number, target: number, dt: number, tau: number) => v + (target - v) * (1 - Math.exp(-dt / tau))
const smoothstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }

export const STRUCTURE = {
  sectionTau: 9, // section loudness responds over ~9 s
  trendTau: 2.5, // the short average a build is measured against the section with
  // Section loudness: share of the loudest section so far (that reference starts at a typical
  // loud level, rises within seconds, and relaxes over a minute), times an absolute floor.
  sectionShare: [0.5, 1] as const, sectionFloor: [0.06, 0.14] as const,
  loudSeed: 0.3, loudRise: 3, loudFall: 60,
  buildRise: 0.06, // rise (short minus section average) that counts as a full build
  buildMinEnergy: 0.08, buildWarmup: [4, 10] as const, // no build before 4 s, full by 10 s
  buildUp: 2, buildDown: 1, // build follows its target over these times (s)
  // Drop: the bass jumps well above its last ~3 s (about eight times its per-beat wobble) and
  // reaches near the song's loudest bass so far; the overall level must rise with it.
  // The ratio test keeps a slow rise from counting once the reference has nearly caught up.
  dropRefTau: 3, dropFastTau: 0.4, dropJump: 0.06, dropRatio: 1.25, dropNearPeak: 0.8, dropEnergyJump: 0.01,
  bassSeed: 0.35, bassFall: 60,
  dropWarmup: 8, dropCooldown: 6, dropDecay: 2.6,
  silence: 0.02, // below this level the music counts as not playing (nothing to measure)
}

export function createStructure() {
  return {
    since: 0, // seconds of live, audible music since the last reset or gap
    energy: 0, short: 0, sectionAvg: 0, highShort: 0, highSection: 0, loud: STRUCTURE.loudSeed,
    bassFast: 0, bassRef: 0, bassPeak: STRUCTURE.bassSeed, energyFast: 0, energyRef: 0,
    section: 0, build: 0, drop: 0, lastDrop: -Infinity, drops: 0,
  }
}
export type Structure = ReturnType<typeof createStructure>

export function resetStructure(st: Structure) { Object.assign(st, createStructure()) }

// bass, mids, highs: kneed levels 0–1. live: fresh audio with Reactivity above 0. Silence or a
// gap feeds zeros, so everything settles back; `since` restarts so no drop fires on resume.
export function updateStructure(st: Structure, bass: number, mids: number, highs: number, live: boolean, dt: number, now: number) {
  const S = STRUCTURE
  const b = live ? clamp01(bass) : 0, m = live ? clamp01(mids) : 0, h = live ? clamp01(highs) : 0
  const level = 0.5 * b + 0.3 * m + 0.2 * h
  const audible = live && level > S.silence
  // Music starting (or resuming after a gap): start the averages at the current level, so the
  // opening of a song doesn't read as a rise from silence.
  if (audible && st.since === 0) Object.assign(st, { energy: level, short: level, sectionAvg: level, highShort: h, highSection: h,
    bassFast: b, bassRef: b, energyFast: level, energyRef: level })
  st.since = audible ? st.since + dt : 0

  // A drop starts a new section: for the cooldown after it, the section average catches up
  // quickly (and no build is read), so the louder section isn't mistaken for another rise.
  const settling = now - st.lastDrop < S.dropCooldown
  const sectionTau = settling ? S.trendTau : S.sectionTau
  st.energy = ema(st.energy, level, dt, 0.3)
  st.short = ema(st.short, st.energy, dt, S.trendTau)
  st.sectionAvg = ema(st.sectionAvg, st.energy, dt, sectionTau)
  st.highShort = ema(st.highShort, h, dt, S.trendTau)
  st.highSection = ema(st.highSection, h, dt, sectionTau)
  st.loud = st.sectionAvg > st.loud ? ema(st.loud, st.sectionAvg, dt, S.loudRise) : Math.max(S.loudSeed * 0.5, ema(st.loud, st.sectionAvg, dt, S.loudFall))
  st.section = smoothstep(S.sectionShare[0], S.sectionShare[1], st.sectionAvg / st.loud) * smoothstep(S.sectionFloor[0], S.sectionFloor[1], st.sectionAvg)

  st.bassFast = ema(st.bassFast, b, dt, S.dropFastTau)
  st.bassRef = ema(st.bassRef, b, dt, S.dropRefTau)
  st.bassPeak = Math.max(st.bassFast, S.bassSeed * 0.5, st.bassPeak * Math.exp(-dt / S.bassFall))
  st.energyFast = ema(st.energyFast, st.energy, dt, S.dropFastTau)
  st.energyRef = ema(st.energyRef, st.energy, dt, S.dropRefTau)
  if (audible && st.since > S.dropWarmup && !settling
    && st.bassFast - st.bassRef > S.dropJump && st.bassFast > S.dropRatio * st.bassRef && st.bassFast >= S.dropNearPeak * st.bassPeak
    && st.energyFast - st.energyRef > S.dropEnergyJump) {
    st.lastDrop = now; st.drops++
    st.drop = clamp01(0.65 + st.build * 0.6) // a drop after a build lands harder
  }
  st.drop *= Math.exp(-dt / S.dropDecay)
  if (st.drop < 1e-4) st.drop = 0

  // Build: energy and highs rising above the section average; not while a drop settles.
  const rise = (st.short - st.sectionAvg) * 0.6 + (st.highShort - st.highSection) * 0.4
  const warm = clamp01((st.since - S.buildWarmup[0]) / (S.buildWarmup[1] - S.buildWarmup[0]))
  const target = settling ? 0 : (st.short > S.buildMinEnergy ? clamp01(rise / S.buildRise) : 0) * (1 - clamp01(st.drop * 1.5)) * warm
  st.build = ema(st.build, target, dt, target > st.build ? S.buildUp : S.buildDown)
}

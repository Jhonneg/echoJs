// BR8: Bloom's music response. One controller reads the shared music analysis once per frame
// and turns it into smoothed, bounded values for the existing shaders. Each element answers to
// one part of the music; accents fire only on fresh detected hits; silence, stale audio and
// a new source all settle back to the approved calm scene. Pure and testable (no three.js).
// BR9 adds song structure (structure.ts): loud sections and builds darken the scene toward a
// night mood and thicken the fog; a drop clears it with one soft sky swell and a burst of
// rings. The seam now throbs warm with the bass, and the aurora's hue follows the music's
// brightness.
// Level bars (owner request, 2026-11-28): while music plays, the seam fills from the bottom
// with the overall level, with a peak cap, and the crystals rise with the bass (left) and the
// highs (right). At rest the seam is fully lit and the crystals sit in place, the approved look.
// Bass flash (owner request, 2026-11-28): each fresh bass hit floods the whole landscape and the
// rivers with aurora light for about half a second; the rivers also follow the mids much more.
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'
import { createStructure, resetStructure, updateStructure } from './structure.ts'

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)
// Fixed knee: quiet music already shows, loud music saturates gently. No per-song normalising.
export const knee = (energy: number) => { const e = clamp01(energy); return e / (e + 0.18) }
const approach = (current: number, target: number, dt: number, rise: number, fall: number) =>
  current + (target - current) * (1 - Math.exp(-dt / (target > current ? rise : fall)))

// Upper limits of each response (multipliers above the calm scene, or absolute amounts).
export const LIMITS = {
  aurora: 0.4, // aurora and its light: up to +40%
  seam: 0.6, seamAccent: 1.2, // seam brightness: sustained and hit flash
  river: 2.5, riverFlow: 0.5, // river brightness (was 0.8 before the bass flash) and flow-pulse speed
  riverWidth: 1, // river halo widens by up to this much with the mids (2×)
  flashCurtain: 0.4, // a bass flash brightens the curtains and their light by up to 40%
  shimmer: 0.8, // aurora shimmer speed
  lightLift: 0.12, // whole-scene light as music builds
  playLift: 0.03, // monolith rise while playing, as a fraction of its height
  hue: 1, // aurora hue shift, -1 (greener) … 1 (pinker); the shaders set how far that goes
}
// BR9 timings (seconds). Mood and hue change slowly; the fog clears quickly on a drop.
export const MOOD_TIMES = { moodUp: 3, moodDown: 6, fogUp: 2, fogDown: 0.6, hue: 3, swellUp: 0.25, swellDown: 0.4 }
export const BURST = { rings: 3, spacing: 0.14 } // a drop's ring burst: three rings 0.14 s apart
// Brightness (0 = 100 Hz centroid, 1 = 10 kHz; ~0.55 ≈ 1.6 kHz) that leaves the hue unchanged,
// and the distance from it that gives the full shift.
export const HUE_CENTRE = 0.55, HUE_RANGE = 0.2
export const RIVER_SENSITIVITY = 2
export const RIVER_PULSE_SECONDS = 2.5 // a mid hit's pulse runs source → mouth in this time
// Level bars: fast rise, slower fall (seconds); the peak cap holds, then falls at `peakFall`/s.
// Reduced motion uses slow envelopes, a smaller crystal travel and no cap.
// Bass flash: rises with a ~0.04 s time constant toward the hit, which fades over ~0.3 s.
// Detected hit strengths run low (a solid generated kick reads ~0.35), so the flash doubles them.
export const FLASH = { rise: 0.04, decay: 0.3, sensitivity: 2 }
export const BAR = { rise: 0.03, fall: 0.25, slowRise: 0.8, slowFall: 2.5, mode: 0.6, peakHold: 0.6, peakFall: 0.5, reducedCrystal: 1 / 3 }
const EVENT_MAX_AGE = 0.5 // ignore hits older than this (seconds) — no replays after a gap

export function createBloomMusic() {
  return {
    session: -1, lastSequence: 0,
    aurora: 0, seam: 0, river: 0, shimmer: 0, intensity: 0,
    seamAccent: 0,
    ringAge: Infinity, ringStrength: 0, // bass-hit ring on the water
    pulseAlong: Infinity, pulseStrength: 0, // mid-hit pulse running down the rivers
    lift: 0, liftVelocity: 0, // 0 = approved idle pose, 1 = raised while playing
    auroraClock: 0, riverClock: 0, // clocks that run faster with the music
    structure: createStructure(), // BR9 song structure
    mood: 0, fog: 0, swell: 0, hue: 0, // night mood, build fog, drop sky swell, aurora hue
    burstAge: Infinity, burstStrength: 0, // a drop's ring burst
    drops: 0,
    barMode: 0, // 0 = seam fully lit (rest), 1 = seam shows the level bar
    barLevel: 0, peak: 0, peakHeld: 0, // seam bar fill, its peak cap and how long the cap has held
    crystalLevels: [0, 0], // left: bass, right: highs
    flashKick: 0, bassFlash: 0, // bass flash: the latest hit's fading strength, and the light it gives
  }
}
export type BloomMusic = ReturnType<typeof createBloomMusic>

export function updateBloomMusic(s: BloomMusic, view: MusicFeaturesV1, nowSeconds: number, delta: number,
  reactivity: number, reducedMotion: boolean, playing: boolean) {
  const dt = Number.isFinite(delta) ? Math.min(0.1, Math.max(0, delta)) : 0
  const gain = clamp01(reactivity)
  const live = gain > 0 && musicFeaturesFresh(view, nowSeconds)
  // A new source: start fresh. Earlier hits are never replayed.
  if (view.session !== s.session) {
    s.session = view.session; s.lastSequence = view.sequence
    s.seamAccent = 0; s.flashKick = 0; s.bassFlash = 0; s.ringAge = Infinity; s.ringStrength = 0; s.pulseAlong = Infinity; s.pulseStrength = 0
    resetStructure(s.structure); s.burstAge = Infinity; s.burstStrength = 0; s.drops = 0
  }
  const six = view.energy.six
  // Hits: only fresh, new, same-session events; none at all under reduced motion.
  if (live && !reducedMotion) {
    for (const e of view.events) {
      if (e.session !== view.session || e.sequence <= s.lastSequence) continue
      if (view.updatedAtSeconds - e.emittedAtSeconds > EVENT_MAX_AGE) continue
      const strength = clamp01(e.strength) * gain
      // BR9: bass hits ring the water and flash the seam; mid hits pulse the rivers.
      if (e.band === 'low') { s.ringAge = 0; s.ringStrength = strength; s.seamAccent = Math.max(s.seamAccent, strength); s.flashKick = Math.max(s.flashKick, Math.min(1, FLASH.sensitivity * strength)) }
      else if (e.band === 'mid') { s.pulseAlong = 0; s.pulseStrength = strength }
    }
  }
  s.lastSequence = Math.max(s.lastSequence, view.sequence)
  // Sustained responses: zero when silent, stale or turned off, so the scene settles to calm.
  const t = (v: number) => (live ? knee(v) * gain : 0)
  s.aurora = approach(s.aurora, t(Math.max(six.subBass, six.bass)), dt, 0.8, 2.5)
  // BR9: the seam throbs with the bass (fast attack, ~0.2 s release); reduced motion keeps it slow.
  const bassLevel = Math.max(six.subBass, six.bass)
  s.seam = reducedMotion ? approach(s.seam, t(bassLevel), dt, 0.8, 2.5) : approach(s.seam, t(bassLevel), dt, 0.03, 0.18)
  // Rivers follow the louder of the two mid bands, quickly and at double sensitivity (mids
  // measure low: a strong generated chord reads ~0.06 raw, which only reached ~0.25).
  s.river = approach(s.river, t(Math.min(1, RIVER_SENSITIVITY * Math.max(six.lowMids, six.highMids))), dt, 0.15, 0.6)
  s.shimmer = approach(s.shimmer, t((six.presence + six.air) / 2), dt, 0.6, 1.8)
  s.intensity = approach(s.intensity, live ? clamp01(view.context.intensity) * gain : 0, dt, 2.4, 3.8)
  // Accents decay smoothly; rings and pulses travel on.
  s.seamAccent *= Math.exp(-dt / 0.35)
  if (s.seamAccent < 1e-4) s.seamAccent = 0
  s.bassFlash = approach(s.bassFlash, s.flashKick, dt, FLASH.rise, FLASH.rise)
  s.flashKick *= Math.exp(-dt / FLASH.decay)
  if (s.flashKick < 1e-4) s.flashKick = 0
  if (s.flashKick === 0 && s.bassFlash < 1e-4) s.bassFlash = 0
  s.ringAge += dt
  s.pulseAlong += dt / RIVER_PULSE_SECONDS
  if (s.pulseAlong > 1.3) s.pulseStrength = 0
  // Level bars. The seam shows a bar only while music plays; otherwise it eases back to fully lit.
  // Overall level, weighted toward the loudest band so a strong beat reaches high on the bar.
  const bands = [six.subBass, six.bass, six.lowMids, six.highMids, six.presence, six.air]
  const overall = 0.6 * Math.max(...bands) + 0.4 * bands.reduce((sum, v) => sum + v, 0) / bands.length
  const [rise, fall] = reducedMotion ? [BAR.slowRise, BAR.slowFall] : [BAR.rise, BAR.fall]
  s.barMode = approach(s.barMode, live && playing ? 1 : 0, dt, BAR.mode, BAR.mode)
  s.barLevel = approach(s.barLevel, t(overall), dt, rise, fall)
  if (reducedMotion) { s.peak = 0; s.peakHeld = 0 }
  else if (s.barLevel >= s.peak) { s.peak = s.barLevel; s.peakHeld = 0 }
  else if ((s.peakHeld += dt) > BAR.peakHold) s.peak = Math.max(s.barLevel, s.peak - BAR.peakFall * dt)
  const crystalTargets = [t(bassLevel), t(Math.max(six.presence, six.air))]
  s.crystalLevels = s.crystalLevels.map((v, i) => approach(v, crystalTargets[i], dt, rise, fall))
  // Playback lift: critically damped, ~4 s to settle. Reduced motion holds the approved pose.
  const target = playing && !reducedMotion ? 1 : 0, omega = 1.6
  const accel = omega * omega * (target - s.lift) - 2 * omega * s.liftVelocity
  s.liftVelocity += accel * dt; s.lift += s.liftVelocity * dt
  if (reducedMotion) { s.lift = 0; s.liftVelocity = 0 }
  // Clocks: aurora shimmer and river flow run a little faster with the music.
  s.auroraClock += dt * (1 + LIMITS.shimmer * s.shimmer)
  s.riverClock += dt * (1 + LIMITS.riverFlow * s.river)

  // BR9 song structure: sections, builds and drops, from the same kneed levels.
  const st = s.structure
  updateStructure(st, knee(bassLevel), knee((six.lowMids + six.highMids) / 2), knee((six.presence + six.air) / 2), live, dt, nowSeconds)
  if (st.drops !== s.drops) {
    s.drops = st.drops
    if (!reducedMotion) { s.burstAge = 0; s.burstStrength = st.drop * gain }
  }
  s.burstAge += dt
  if (s.burstAge > 8) s.burstStrength = 0
  const T = MOOD_TIMES
  s.mood = approach(s.mood, Math.min(1, 0.75 * st.section + 0.5 * st.build) * gain, dt, T.moodUp, T.moodDown)
  s.fog = approach(s.fog, st.build * gain * (1 - Math.min(1, st.drop * 2)), dt, T.fogUp, T.fogDown)
  s.swell = reducedMotion ? 0 : approach(s.swell, st.drop * gain, dt, T.swellUp, T.swellDown)
  const bright = view.context.brightnessValid ? view.context.brightness : HUE_CENTRE
  const hueTarget = live ? Math.max(-1, Math.min(1, (bright - HUE_CENTRE) / HUE_RANGE)) * gain : 0
  s.hue = approach(s.hue, hueTarget, dt, T.hue, T.hue)
}

// Shader-facing values derived from the controller.
export function bloomMusicOutputs(s: BloomMusic) {
  return {
    auroraFactor: 1 + LIMITS.aurora * s.aurora + LIMITS.flashCurtain * clamp01(s.bassFlash),
    seamGain: 1 + LIMITS.seam * s.seam + LIMITS.seamAccent * s.seamAccent,
    riverGain: 1 + LIMITS.river * s.river,
    riverWidth: 1 + LIMITS.riverWidth * clamp01(s.river),
    flash: clamp01(s.bassFlash), // bass flash on the land and rivers (0 at rest)
    lightLift: LIMITS.lightLift * s.intensity,
    sparkle: s.shimmer,
    ring: { age: s.ringAge, strength: s.ringStrength },
    pulse: { along: s.pulseAlong, strength: s.pulseStrength },
    liftFraction: LIMITS.playLift * Math.min(1.05, Math.max(0, s.lift)),
    // BR9 (all 0 at idle, so the calm scene is the approved look)
    seamWarmth: Math.min(1, s.seam * 1.2),
    mood: clamp01(s.mood), fog: clamp01(s.fog), swell: clamp01(s.swell), hue: Math.max(-LIMITS.hue, Math.min(LIMITS.hue, s.hue)),
    burst: { age: s.burstAge, strength: s.burstStrength },
    // Level bars: at rest (barMode 0) the fill is 1, so the seam keeps its approved look.
    seamFill: 1 + (clamp01(s.barLevel) - 1) * clamp01(s.barMode),
    seamPeak: 1 + (clamp01(s.peak) - 1) * clamp01(s.barMode),
    seamPeakShow: s.peak > 0 ? clamp01(s.barMode) : 0,
    crystalLift: s.crystalLevels.map(clamp01),
  }
}

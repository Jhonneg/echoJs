// BR8: Bloom's music response. One controller reads the shared music analysis once per frame
// and turns it into smoothed, bounded values for the existing shaders. Each element answers to
// one part of the music; accents fire only on fresh detected hits; silence, stale audio and
// a new source all settle back to the approved calm scene. Pure and testable (no three.js).
import { musicFeaturesFresh, type MusicFeaturesV1 } from '../../audio/musicFeatures.ts'

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)
// Fixed knee: quiet music already shows, loud music saturates gently. No per-song normalising.
export const knee = (energy: number) => { const e = clamp01(energy); return e / (e + 0.18) }
const approach = (current: number, target: number, dt: number, rise: number, fall: number) =>
  current + (target - current) * (1 - Math.exp(-dt / (target > current ? rise : fall)))

// Upper limits of each response (multipliers above the calm scene, or absolute amounts).
export const LIMITS = {
  aurora: 0.4, // aurora and its light: up to +40%
  seam: 0.6, seamAccent: 1.2, // seam brightness: sustained and hit flash
  river: 0.8, riverFlow: 0.5, // river brightness and flow-pulse speed
  shimmer: 0.8, // aurora shimmer speed
  lightLift: 0.12, // whole-scene light as music builds
  playLift: 0.03, // monolith rise while playing, as a fraction of its height
}
export const RIVER_PULSE_SECONDS = 2.5 // a mid hit's pulse runs source → mouth in this time
const EVENT_MAX_AGE = 0.5 // ignore hits older than this (seconds) — no replays after a gap
const RISE_WINDOW = 0.12 // look-back for deciding whether a mid hit was high-mid or low-mid

export function createBloomMusic() {
  return {
    session: -1, lastSequence: 0,
    history: [] as { t: number, lowMids: number, highMids: number }[],
    aurora: 0, seam: 0, river: 0, shimmer: 0, intensity: 0,
    seamAccent: 0,
    ringAge: Infinity, ringStrength: 0, // bass-hit ring on the water
    pulseAlong: Infinity, pulseStrength: 0, // mid-hit pulse running down the rivers
    lift: 0, liftVelocity: 0, // 0 = approved idle pose, 1 = raised while playing
    auroraClock: 0, riverClock: 0, // clocks that run faster with the music
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
    s.session = view.session; s.lastSequence = view.sequence; s.history.length = 0
    s.seamAccent = 0; s.ringAge = Infinity; s.ringStrength = 0; s.pulseAlong = Infinity; s.pulseStrength = 0
  }
  const six = view.energy.six
  if (live) {
    s.history.push({ t: view.updatedAtSeconds, lowMids: six.lowMids, highMids: six.highMids })
    while (s.history.length > 2 && view.updatedAtSeconds - s.history[0].t > 0.6) s.history.shift()
  }
  // Hits: only fresh, new, same-session events; none at all under reduced motion.
  if (live && !reducedMotion) {
    for (const e of view.events) {
      if (e.session !== view.session || e.sequence <= s.lastSequence) continue
      if (view.updatedAtSeconds - e.emittedAtSeconds > EVENT_MAX_AGE) continue
      const strength = clamp01(e.strength) * gain
      if (e.band === 'low') { s.ringAge = 0; s.ringStrength = strength }
      else if (e.band === 'mid') {
        const past = s.history.find(h => h.t >= view.updatedAtSeconds - RISE_WINDOW) ?? s.history[0]
        const highRise = six.highMids - (past?.highMids ?? 0), lowRise = six.lowMids - (past?.lowMids ?? 0)
        if (highRise >= lowRise) s.seamAccent = Math.max(s.seamAccent, strength)
        else { s.pulseAlong = 0; s.pulseStrength = strength }
      }
    }
  }
  s.lastSequence = Math.max(s.lastSequence, view.sequence)
  // Sustained responses: zero when silent, stale or turned off, so the scene settles to calm.
  const t = (v: number) => (live ? knee(v) * gain : 0)
  s.aurora = approach(s.aurora, t(Math.max(six.subBass, six.bass)), dt, 0.8, 2.5)
  s.seam = approach(s.seam, t(six.highMids), dt, 0.3, 1.2)
  s.river = approach(s.river, t((six.lowMids + six.highMids) / 2), dt, 0.5, 1.5)
  s.shimmer = approach(s.shimmer, t((six.presence + six.air) / 2), dt, 0.6, 1.8)
  s.intensity = approach(s.intensity, live ? clamp01(view.context.intensity) * gain : 0, dt, 2.4, 3.8)
  // Accents decay smoothly; rings and pulses travel on.
  s.seamAccent *= Math.exp(-dt / 0.35)
  if (s.seamAccent < 1e-4) s.seamAccent = 0
  s.ringAge += dt
  s.pulseAlong += dt / RIVER_PULSE_SECONDS
  if (s.pulseAlong > 1.3) s.pulseStrength = 0
  // Playback lift: critically damped, ~4 s to settle. Reduced motion holds the approved pose.
  const target = playing && !reducedMotion ? 1 : 0, omega = 1.6
  const accel = omega * omega * (target - s.lift) - 2 * omega * s.liftVelocity
  s.liftVelocity += accel * dt; s.lift += s.liftVelocity * dt
  if (reducedMotion) { s.lift = 0; s.liftVelocity = 0 }
  // Clocks: aurora shimmer and river flow run a little faster with the music.
  s.auroraClock += dt * (1 + LIMITS.shimmer * s.shimmer)
  s.riverClock += dt * (1 + LIMITS.riverFlow * s.river)
}

// Shader-facing values derived from the controller.
export function bloomMusicOutputs(s: BloomMusic) {
  return {
    auroraFactor: 1 + LIMITS.aurora * s.aurora,
    seamGain: 1 + LIMITS.seam * s.seam + LIMITS.seamAccent * s.seamAccent,
    riverGain: 1 + LIMITS.river * s.river,
    lightLift: LIMITS.lightLift * s.intensity,
    sparkle: s.shimmer,
    ring: { age: s.ringAge, strength: s.ringStrength },
    pulse: { along: s.pulseAlong, strength: s.pulseStrength },
    liftFraction: LIMITS.playLift * Math.min(1.05, Math.max(0, s.lift)),
  }
}

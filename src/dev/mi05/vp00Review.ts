// Repeatable generated PCM only; no private/captured media or source adapters.
import { wav } from '../audioLab/fixtures'
export const VP00_FIXTURE = 'vp00-48k-21s-v1'
export function vp00Label(t: number) {
  if (t < 2) return 'REST · silence'
  if (t < 7) return 'QUIET · mixed attacks'
  if (t < 13) return 'BUSY · stronger mixed attacks'
  if (t < 16) return 'SUSTAIN · bass only'
  if (t < 19) return 'REPEATED · bass attacks'
  return 'RELEASE · silence'
}
export function createVP00ReviewAudio() {
  const rate = 48000, samples = new Float32Array(rate * 21)
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate, phase = (t - 2) % .65
    const burst = Math.max(0, Math.min(1, phase / .012, (.28 - phase) / .05))
    let sample = 0
    if (t >= 2 && t < 13) {
      const level = t < 7 ? .035 : .13
      for (const frequency of [110, 469, 1500, 4000, 8000]) sample += level * burst * Math.sin(2 * Math.PI * frequency * t)
    } else if (t >= 13 && t < 16) {
      const envelope = Math.min(1, (t - 13) / .012, (16 - t) / .04)
      sample = .32 * envelope * Math.sin(2 * Math.PI * 110 * t)
    } else if (t >= 16 && t < 19) sample = .32 * burst * Math.sin(2 * Math.PI * 110 * t)
    samples[i] = sample
  }
  return wav(samples, rate)
}

// VP05 generated band-isolation input; original VP00 comparison PCM above stays unchanged.
export function createVP05Tone(frequency: number, amplitude: number) {
  const rate = 48000, samples = new Float32Array(rate * 3.4)
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate
    const envelope = t < .5 || t >= 2.5 ? 0 : Math.max(0, Math.min(1, (t - .5) / .012, (2.5 - t) / .035))
    samples[i] = Math.min(.5, Math.max(0, amplitude)) * envelope * Math.sin(2 * Math.PI * frequency * t)
  }
  return wav(samples, rate)
}

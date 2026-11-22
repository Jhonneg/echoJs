// Generated review material only. No file picker, native sharing or private playback input.
import { wav } from '../audioLab/fixtures'
export const REVIEW_SECONDS = 21
export function createVM02ReviewAudio() {
  const rate = 48000, samples = new Float32Array(rate * REVIEW_SECONDS)
  const burst = (t: number, start: number, duration: number) => t < start || t > start + duration ? 0 : Math.max(0, Math.min(1, (t - start) / .008, (start + duration - t) / .035))
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate
    let low = t >= 2.5 && t < 4.5 ? .12 : t >= 4.5 && t < 6.5 ? .32 : 0
    let high = .12 * burst(t, 8.5, .2) + .4 * burst(t, 10, .2)
    let bass = t >= 12 && t < 14 ? .3 : 0
    if (t >= 15) {
      low = .1 + .08 * (1 + Math.sin(t * 2.4))
      bass = .22 * burst((t - 15) % .5, 0, .18)
      high = .32 * burst((t - 15) % .8, .16, .18)
    }
    samples[i] = low * Math.sin(2 * Math.PI * 469 * t) + high * Math.sin(2 * Math.PI * 1500 * t) + bass * Math.sin(2 * Math.PI * 110 * t)
  }
  return wav(samples, rate)
}
export function reviewLabel(seconds: number) {
  if (seconds < 2.5) return 'RESTING · silence'
  if (seconds < 4.5) return 'LOW MIDS · quieter sustain'
  if (seconds < 6.5) return 'LOW MIDS · stronger sustain'
  if (seconds < 8.5) return 'RETURN TO REST · smooth release'
  if (seconds < 10) return 'HIGH MIDS · weak transient'
  if (seconds < 12) return 'HIGH MIDS · strong transient + fading trail'
  if (seconds < 14) return 'BASS ONLY · contours stay at rest'
  if (seconds < 15) return 'RESTING · silence'
  return 'MIXED · generated musical fixture'
}
// Records only this fixture's generated WebGL surface, with explanatory labels. Video only.
export async function recordVM02Review(source: HTMLCanvasElement, start: () => Promise<void>, read: () => { time: number; light: number; streak: number; low: number; high: number }, valley = false) {
  const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 810
  const ctx = canvas.getContext('2d')!
  const stream = canvas.captureStream(30), chunks: Blob[] = []
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type))
  if (!mimeType) { stream.getTracks().forEach(track => track.stop()); throw Error('WebM recording unavailable') }
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 })
  let animation = 0
  const draw = () => {
    const state = read()
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(8, 6, 17, .88)';ctx.fillRect(0, 710, 1440, 100)
    ctx.fillStyle = '#f7c7d8';ctx.font = '24px sans-serif';ctx.fillText(valley ? vm03Label(state.time) : reviewLabel(state.time), 28, 747)
    ctx.fillStyle = '#c3a7be';ctx.font = '17px sans-serif'
    ctx.fillText(`${valley ? 'VM03 · MOVING CAMERA' : 'VM02 · STATIONARY CAMERA'} · GENERATED AUDIO INPUT · ${state.time.toFixed(1)}s`, 28, 778)
    if (!valley) ctx.fillText(`Low mids ${state.low.toFixed(2)} · light ${state.light.toFixed(2)} · high mids ${state.high.toFixed(2)} · streak ${state.streak.toFixed(2)}`, 700, 778)
    animation = requestAnimationFrame(draw)
  }
  const complete = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    recorder.onerror = () => reject(Error('Generated review recording failed'))
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })
  try {
    draw();recorder.start(500);await start()
    await new Promise(resolve => setTimeout(resolve, REVIEW_SECONDS * 1000 + 100))
    recorder.stop()
    const blob = await complete
    return await new Promise<string>((resolve, reject) => { const reader = new FileReader();reader.onload = () => resolve(String(reader.result).split(',')[1]);reader.onerror = reject;reader.readAsDataURL(blob) })
  } finally { cancelAnimationFrame(animation);if (recorder.state !== 'inactive') recorder.stop();stream.getTracks().forEach(track => track.stop()) }
}

function vm03Label(t: number) {
  if (t < 2) return 'RESTING · silence'
  if (t < 5) return 'LOW ONSET · quiet wave'
  if (t < 8) return 'LOW ONSET · stronger wave'
  if (t < 13) return 'SUSTAINED BASS · one attack, restrained ground glow'
  if (t < 18) return 'REPEATED ATTACKS · separate traveling waves'
  return 'SILENCE · waves expire'
}
export function createVM03ReviewAudio() {
  const rate = 48000, samples = new Float32Array(rate * REVIEW_SECONDS)
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate
    let level = 0
    for (const [start, duration, amplitude] of [[2, .25, .12], [5, .25, .65], [8, 4, .4], [13, .25, .5], [14.5, .25, .5], [16, .25, .5]]) {
      if (t >= start && t < start + duration) level = amplitude * Math.min(1, (t-start)/.008, (start+duration-t)/.03)
    }
    samples[i] = level * Math.sin(2 * Math.PI * 110 * t)
  }
  return wav(samples, rate)
}

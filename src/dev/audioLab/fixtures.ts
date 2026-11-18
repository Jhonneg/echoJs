export interface Tone { hz: number; db: number; start: number; end: number; edge?: number }
export interface Fixture { id: string; duration: number; tones: Tone[]; events: { time: number; band: 'bass' | 'midrange' | 'treble' }[]; noise?: number }
const band = (hz: number) => hz < 250 ? 'bass' as const : hz < 4000 ? 'midrange' as const : 'treble' as const
const tone = (hz: number, db = -12, start = 0.5, end = 3.5): Tone => ({ hz, db, start, end, edge: 0.002 })
const make = (id: string, tones: Tone[], duration = 4.5): Fixture => ({ id, duration, tones, events: tones.map(t => ({ time: t.start, band: band(t.hz) })) })
export const FIXTURE_SEED = 0x4543484f
export const fixtures: Fixture[] = [
  make('silence', []), { ...make('noise-60db-peak', []), noise: -60 },
  ...[100, 1000, 8000].flatMap(hz => [-36, -24, -12, -6].map(db => make(`tone-${hz}hz-${db}db`, [tone(hz, db)]))),
  ...[100, 1000, 8000].map(hz => make(`steps-${hz}hz`, [-36, -24, -12, -6].map((db, i) => tone(hz, db, 0.5 + i * 3, 3.5 + i * 3)), 13.5)),
  ...[20, 50, 100].map(ms => make(`burst-${ms}ms`, [tone(100, -12, 0.5, 0.5 + ms / 1000)])),
  make('sustain', [tone(100, -12, 0.5, 5.5)], 6.5),
  make('hits-over-sustain', [tone(100, -36, 0.5, 5.5), ...Array.from({ length: 5 }, (_, i) => tone(100, -12, 2 + i * 0.5, 2.05 + i * 0.5))], 6.5),
  make('mixture', [100, 1000, 8000].map(hz => tone(hz, -18))),
  make('high-attack', [tone(8000, -6, 0.5, 0.55)]),
]
export function generateFixture(fixture: Fixture, sampleRate: number) {
  const samples = new Float32Array(Math.ceil(fixture.duration * sampleRate))
  let seed = FIXTURE_SEED
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    let value = 0
    if (fixture.noise !== undefined) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
      value = ((seed >>> 0) / 0xffffffff * 2 - 1) * 10 ** (fixture.noise / 20)
    }
    for (const tone of fixture.tones) {
      if (t < tone.start || t >= tone.end) continue
      const edge = tone.edge ?? 0.002
      const envelope = Math.min(1, (t - tone.start) / edge, (tone.end - t) / edge)
      value += 10 ** (tone.db / 20) * envelope * Math.sin(2 * Math.PI * tone.hz * (t - tone.start))
    }
    samples[i] = value
  }
  return samples
}
export function wav(samples: Float32Array, rate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), data = new DataView(buffer)
  const label = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) data.setUint8(offset + i, value.charCodeAt(i)) }
  label(0, 'RIFF'); data.setUint32(4, buffer.byteLength - 8, true); label(8, 'WAVE'); label(12, 'fmt ')
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true)
  data.setUint32(24, rate, true); data.setUint32(28, rate * 2, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true)
  label(36, 'data'); data.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) data.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true)
  return new File([buffer], 'echo-synthetic.wav', { type: 'audio/wav' })
}

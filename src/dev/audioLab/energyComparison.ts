import { BAND_NAMES, SIX_BAND_NAMES, emptyBands, emptySixBands, type BandName, type SixBandName } from '../../audio/signal.ts'
import { createReplay, type Frame } from './baseline.ts'
import { fixtures, type Fixture } from './fixtures.ts'
import { createEnergy, createEnergyMeter, ENERGY_REFERENCE_RMS, ENERGY_TARGETS } from './energy.ts'

export const energyFixtures: Fixture[] = [...fixtures, ...[47, 141, 469, 1500, 4000, 10000].flatMap(hz =>
  [-36, -24, -12, -6].map(db => ({ id: `calibration-${hz}hz-${db}db`, duration: 4.5,
    tones: [{ hz, db, start: 0.5, end: 3.5, edge: 0.002 }],
    events: [{ time: 0.5, band: hz < 250 ? 'bass' as const : hz < 4000 ? 'midrange' as const : 'treble' as const }],
  })))]
const sixBand = (hz: number): SixBandName => hz < 80 ? 'subBass' : hz < 250 ? 'bass' : hz < 800 ? 'lowMids' : hz < 2500 ? 'highMids' : hz < 6000 ? 'presence' : 'air'
export function compareEnergy(fixture: Fixture, rate: number, fft: number, frames: Frame[], cadence: number) {
  const energy = createEnergy(), meter = createEnergyMeter(rate, fft), legacy = createReplay(rate, fft)
  const broadPeak = { linear: emptyBands(), softKnee: emptyBands() }, sixPeak = { linear: emptySixBands(), softKnee: emptySixBands() }
  const tone = fixture.tones.length === 1 && fixture.tones[0].end - fixture.tones[0].start >= 3 ? fixture.tones[0] : undefined
  const band: BandName = !tone || tone.hz < 250 ? 'bass' : tone.hz < 4000 ? 'midrange' : 'treble'
  const six = sixBand(tone?.hz ?? 100)
  let count = 0, total = 0, finiteAndBounded = true
  const sums = { estimatedBroadRms: 0, estimatedSixRms: 0, linearBroad: 0, softBroad: 0, linearSix: 0, softSix: 0, legacyBroad: 0, legacySix: 0, inputWindowRms: 0 }
  for (let i = 120 / cadence - 1; i < frames.length; i += 120 / cadence) {
    const frame = frames[i]; total++
    legacy.step(frame); meter.update(frame.bins, energy)
    for (const curve of ['linear', 'softKnee'] as const) {
      for (const b of BAND_NAMES) {
        const value = energy[curve][b]
        finiteAndBounded &&= Number.isFinite(value) && value >= 0 && value <= 1
        broadPeak[curve][b] = Math.max(broadPeak[curve][b], value)
      }
      for (const b of SIX_BAND_NAMES) {
        const value = energy.six[curve][b]
        finiteAndBounded &&= Number.isFinite(value) && value >= 0 && value <= 1
        sixPeak[curve][b] = Math.max(sixPeak[curve][b], value)
      }
    }
    if (tone && frame.time >= tone.end - 0.25 && frame.time < tone.end - 0.005) {
      count++
      sums.estimatedBroadRms += energy.rms[band]; sums.estimatedSixRms += energy.six.rms[six]
      sums.linearBroad += energy.linear[band]; sums.softBroad += energy.softKnee[band]
      sums.linearSix += energy.six.linear[six]; sums.softSix += energy.six.softKnee[six]
      sums.legacyBroad += legacy.signal.levels[band]; sums.legacySix += legacy.signal.sixBands[six]
      sums.inputWindowRms += frame.rms
    }
  }
  const expectedRms = tone ? 10 ** (tone.db / 20) / Math.SQRT2 : 0
  const mean = Object.fromEntries(Object.entries(sums).map(([k, value]) => [k, count ? value / count : 0])) as typeof sums
  return { fixture: fixture.id, rate, fft, cadence, updates: total, finiteAndBounded, broadPeak, sixPeak,
    steady: tone && count ? { hz: tone.hz, peakDbfs: tone.db, band, sixBand: six, count, expectedRms, ...mean,
      broadBoundary: tone.hz === 4000,
      broadErrorDb: 20 * Math.log10(mean.estimatedBroadRms / expectedRms),
      sixErrorDb: 20 * Math.log10(mean.estimatedSixRms / expectedRms) } : null }
}
export type EnergyRow = ReturnType<typeof compareEnergy>
export function assessEnergy(rows: EnergyRow[]) {
  const steady = rows.filter(r => r.steady), noise = rows.filter(r => r.fixture === 'noise-60db-peak'), silence = rows.filter(r => r.fixture === 'silence')
  const errors = steady.flatMap(r => r.steady!.broadBoundary ? [Math.abs(r.steady!.sixErrorDb)] : [Math.abs(r.steady!.sixErrorDb), Math.abs(r.steady!.broadErrorDb)])
  const curves = (['linear', 'softKnee'] as const).map(curve => {
    const prefix = curve === 'linear' ? 'linear' : 'soft'
    const contrasts: { hz: number, rate: number, cadence: number, range: string, difference: number }[] = []
    let monotonic = true, groups = 0
    for (const rate of [44100, 48000, 96000]) for (const cadence of [30, 60, 120]) for (const hz of [47, 100, 141, 469, 1000, 1500, 4000, 8000, 10000]) {
      const levels = [-36, -24, -12, -6].map(db => steady.find(r => r.rate === rate && r.cadence === cadence && r.steady!.hz === hz && r.steady!.peakDbfs === db)?.steady)
      if (!levels.every(Boolean)) { monotonic = false; continue }
      groups++
      for (const range of ['Broad', 'Six'] as const) {
        if (range === 'Broad' && hz === 4000) continue // tone straddles the unchanged broad boundary
        const values = levels.map(s => s![`${prefix}${range}`])
        monotonic &&= values.every((v, i) => i === 0 || v > values[i - 1])
        contrasts.push({ hz, rate, cadence, range, difference: values[3] - values[2] })
      }
    }
    const peaks = (rs: EnergyRow[]) => rs.flatMap(r => [...Object.values(r.broadPeak[curve]), ...Object.values(r.sixPeak[curve])])
    const noiseMax = Math.max(0, ...peaks(noise)), silenceMax = Math.max(0, ...peaks(silence))
    const worst = contrasts.reduce<(typeof contrasts)[number] | null>((a, b) => !a || b.difference < a.difference ? b : a, null)
    return { curve, referenceRms: ENERGY_REFERENCE_RMS, groups, monotonic, noiseMax, silenceMax, smallestContrast: worst,
      checks: { bounded: rows.length > 0 && rows.every(r => r.finiteAndBounded), monotonic: monotonic && groups === 81,
        silence: silence.length === 9 && silenceMax === 0, noise: noise.length === 9 && noiseMax <= ENERGY_TARGETS.noise,
        contrast: contrasts.length > 0 && contrasts.every(c => c.difference >= ENERGY_TARGETS.loudContrast) } }
  })
  const maxCalibrationErrorDb = Math.max(0, ...errors)
  return { targets: ENERGY_TARGETS, maxCalibrationErrorDb, calibrationPass: errors.length > 0 && maxCalibrationErrorDb <= ENERGY_TARGETS.calibrationDb, curves }
}

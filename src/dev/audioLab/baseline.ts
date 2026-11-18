import { BAND_NAMES, SIX_BAND_NAMES, bandMagnitude, binRange, emptyBands, emptySixBands, resetSignal, silentSignal, type BandValues } from '../../audio/signal.ts'
import { updateSignalFeatures } from '../../audio/features.ts'
import { SIX_BAND_SETTINGS, createSixBandAnalysis } from '../../audio/sixBands.ts'
import { createSpectralFlux } from '../../audio/flux.ts'
import { EXCURSION_THRESHOLD, SATURATION_THRESHOLD, dbfs, rms } from './diagnostics.ts'
import { generateFixture, type Fixture } from './fixtures.ts'

export interface Frame { time: number; bins: Float32Array; rms: number }
export const rangesFor = (rate: number, fft: number) => ({ bass: binRange(20, 250, rate, fft), midrange: binRange(250, 4000, rate, fft), treble: binRange(4000, 20000, rate, fft) })
// Harness orchestration only; every feature calculation uses the unchanged legacy modules.
export function createReplay(rate: number, fft: number) {
  const signal = silentSignal(), raw = emptyBands(), ranges = rangesFor(rate, fft)
  const six = createSixBandAnalysis(rate, fft), flux = createSpectralFlux(fft / 2, ranges)
  let previous = 0
  return {
    signal, raw, flux,
    step(frame: Frame) {
      const delta = frame.time - previous
      previous = frame.time
      for (const band of BAND_NAMES) raw[band] = bandMagnitude(frame.bins, ...ranges[band])
      updateSignalFeatures(signal, raw, delta, frame.time * 1000)
      six.update(frame.bins, delta, signal.sixBands)
      flux.update(frame.bins, delta, true, signal.flux)
      signal.isPlaying = true // equivalent to running, unpaused synthetic local playback
      return delta
    },
    reset() { resetSignal(signal); flux.reset(); for (const band of BAND_NAMES) raw[band] = 0; previous = 0 },
  }
}

export async function analyseFixture(fixture: Fixture, requestedRate: number) {
  const samples = generateFixture(fixture, requestedRate)
  const context = new OfflineAudioContext(1, samples.length, requestedRate)
  const rate = context.sampleRate
  const fft = rate > 48000 ? 4096 : 2048
  const analyser = context.createAnalyser()
  analyser.fftSize = fft; analyser.smoothingTimeConstant = 0
  const buffer = context.createBuffer(1, samples.length, requestedRate)
  buffer.copyToChannel(samples, 0)
  const source = context.createBufferSource(); source.buffer = buffer
  source.connect(analyser); analyser.connect(context.destination); source.start()
  const frames: Frame[] = []
  const stops = Array.from({ length: Math.floor(fixture.duration * 120) - 1 }, (_, i) => context.suspend((i + 1) / 120))
  const rendering = context.startRendering()
  const timeData = new Float32Array(fft)
  for (const stop of stops) {
    await stop
    const bins = new Float32Array(fft / 2)
    analyser.getFloatFrequencyData(bins); analyser.getFloatTimeDomainData(timeData)
    frames.push({ time: context.currentTime, bins, rms: rms(timeData) })
    await context.resume()
  }
  await rendering
  source.disconnect(); analyser.disconnect()
  return { rate, fft, frames, inputRms: rms(samples), peak: samples.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0) }
}

export function summarize(fixture: Fixture, rate: number, fft: number, frames: Frame[], cadence: number) {
  const engine = createReplay(rate, fft), stride = 120 / cadence
  const rawPeak = emptyBands(), levelPeak = emptyBands(), fastPeak = emptyBands(), slowPeak = emptyBands()
  const transientPeak = emptyBands(), fluxPeak = emptyBands(), saturatedSeconds = emptyBands()
  const sixPeak = emptySixBands(), sixRawPeak = emptySixBands(), fluxL2Peak = emptyBands()
  const sixRanges = SIX_BAND_NAMES.map(b => binRange(SIX_BAND_SETTINGS[b].low, SIX_BAND_SETTINGS[b].high, rate, fft))
  const excursionObservations: { time: number; band: string; raw: number; transient: number; flux: number; fluxL2: number }[] = []
  const crossings: Record<keyof BandValues, number[]> = { bass: [], midrange: [], treble: [] }
  const high = emptyBands()
  const segments = fixture.tones.map(t => ({ hz: t.hz, peakDbfs: t.db, start: t.start, end: t.end, count: 0, rawMean: 0, levelMean: 0 }))
  let maxRms = 0, count = 0, minDelta = Infinity, maxDelta = 0, duration = 0
  for (let i = stride - 1; i < frames.length; i += stride) {
    const frame = frames[i], delta = engine.step(frame), s = engine.signal
    count++; duration += delta; minDelta = Math.min(minDelta, delta); maxDelta = Math.max(maxDelta, delta)
    maxRms = Math.max(maxRms, frame.rms)
    for (const band of BAND_NAMES) {
      rawPeak[band] = Math.max(rawPeak[band], engine.raw[band]); levelPeak[band] = Math.max(levelPeak[band], s.levels[band])
      fastPeak[band] = Math.max(fastPeak[band], s.fast[band]); slowPeak[band] = Math.max(slowPeak[band], s.slow[band])
      transientPeak[band] = Math.max(transientPeak[band], s.transient[band]); fluxPeak[band] = Math.max(fluxPeak[band], s.flux[band])
      fluxL2Peak[band] = Math.max(fluxL2Peak[band], engine.flux.l2[band])
      if (s.levels[band] >= SATURATION_THRESHOLD) saturatedSeconds[band] += delta
      const above = Math.max(s.transient[band], s.flux[band]) >= EXCURSION_THRESHOLD
      if (above && !high[band]) {
        crossings[band].push(frame.time)
        excursionObservations.push({ time: frame.time, band, raw: engine.raw[band], transient: s.transient[band], flux: s.flux[band], fluxL2: engine.flux.l2[band] })
      }
      high[band] = above ? 1 : 0
    }
    for (const [index, band] of SIX_BAND_NAMES.entries()) {
      sixPeak[band] = Math.max(sixPeak[band], s.sixBands[band])
      sixRawPeak[band] = Math.max(sixRawPeak[band], bandMagnitude(frame.bins, ...sixRanges[index]))
    }
    for (const segment of segments) {
      if (frame.time >= Math.max(segment.start, segment.end - 0.25) && frame.time < segment.end - 0.005) {
        const band = segment.hz < 250 ? 'bass' : segment.hz < 4000 ? 'midrange' : 'treble'
        segment.count++; segment.rawMean += engine.raw[band]; segment.levelMean += s.levels[band]
      }
    }
  }
  const attacks = fixture.events.map(event => {
    const match = crossings[event.band].find(time => time >= event.time && time <= event.time + 0.3)
    return { ...event, excursionDelayMs: match === undefined ? null : (match - event.time) * 1000 }
  })
  const outsideLabeledWindows = Object.fromEntries(BAND_NAMES.map(band => [band, crossings[band].filter(time => !fixture.events.some(e => e.band === band && time >= e.time && time <= e.time + 0.3)).length]))
  engine.reset()
  return { fixture: fixture.id, rate, fft, windowMs: fft / rate * 1000, cadence, count,
    actualHz: count / duration, minDeltaMs: minDelta * 1000, maxDeltaMs: maxDelta * 1000,
    maxRms, maxRmsDbfs: dbfs(maxRms), rawPeak, levelPeak, fastPeak, slowPeak, transientPeak, fluxPeak, fluxL2Peak, sixPeak, sixRawPeak, excursionObservations,
    saturationPercent: Object.fromEntries(BAND_NAMES.map(b => [b, saturatedSeconds[b] / duration * 100])),
    excursions: Object.fromEntries(BAND_NAMES.map(b => [b, crossings[b].length])), outsideLabeledWindows, attacks,
    segments: segments.map(s => ({ ...s, rawMean: s.count ? s.rawMean / s.count : null, levelMean: s.count ? s.levelMean / s.count : null })),
    resetZero: Object.values(engine.signal.fast).every(v => v === 0) && Object.values(engine.signal.flux).every(v => v === 0),
  }
}
export type BaselineRow = ReturnType<typeof summarize>

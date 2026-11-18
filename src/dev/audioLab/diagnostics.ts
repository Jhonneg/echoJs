import { BAND_NAMES, SIX_BAND_NAMES, bandMagnitude, binRange, emptyBands, emptySixBands, resetSignal, silentSignal, type AudioSignal, type BandValues } from '../../audio/signal.ts'
import { createEnergy, createEnergyMeter, resetEnergy } from './energy.ts'
import { createAdaptiveScaling, createAdaptiveView, applyAdaptive, resetAdaptiveView } from './adaptive.ts'
import { SIX_BAND_SETTINGS } from '../../audio/sixBands.ts'

export function rms(samples: Float32Array) {
  let sum = 0
  for (const value of samples) sum += value * value
  return Math.sqrt(sum / Math.max(1, samples.length))
}
// null represents clean silence in JSON; never serialize -Infinity as a number.
export const dbfs = (value: number) => value > 0 ? 20 * Math.log10(value) : null
export const ACTIVITY_THRESHOLD = 0.001
export const EXCURSION_THRESHOLD = 0.1
export const SATURATION_THRESHOLD = 0.95
export function createSnapshot() {
  return { state: 'reset', sampleRate: 0, fftSize: 0, windowMs: 0, audioTime: 0, timestamp: 0, delta: 0,
    rms: 0, rmsDbfs: null as number | null, raw: emptyBands(), sixRaw: emptySixBands(),
    energy: createEnergy(), adaptive: createAdaptiveView(), fluxL1: emptyBands(), fluxL2: emptyBands(), active: emptyBands(), signal: silentSignal() }
}
export type DiagnosticSnapshot = ReturnType<typeof createSnapshot>
// Reused numeric view, overwritten on each read. Copy when retaining history. No graph nodes or media buffers.
export type DiagnosticSink = (snapshot: Readonly<DiagnosticSnapshot>) => void

export function fillSnapshot(view: DiagnosticSnapshot, bins: Float32Array, signal: AudioSignal,
  raw: BandValues, sampleRate: number, fftSize: number) {
  view.sampleRate = sampleRate
  view.fftSize = fftSize
  view.windowMs = fftSize / sampleRate * 1000
  for (const band of BAND_NAMES) {
    view.raw[band] = raw[band]
    view.active[band] = signal.fast[band] > ACTIVITY_THRESHOLD ? 1 : 0
    for (const key of ['levels', 'fast', 'slow', 'transient', 'flux'] as const) view.signal[key][band] = signal[key][band]
    view.signal[band] = signal[band]
  }
  for (const band of SIX_BAND_NAMES) {
    const config = SIX_BAND_SETTINGS[band]
    view.sixRaw[band] = bandMagnitude(bins, ...binRange(config.low, config.high, sampleRate, fftSize))
    view.signal.sixBands[band] = signal.sixBands[band]
  }
  for (const key of ['intensity', 'atmosphere', 'updatedAt', 'updateHz'] as const) view.signal[key] = signal[key]
  view.signal.isPlaying = signal.isPlaying
}

export function createDiagnosticObserver(sink: DiagnosticSink) {
  const view = createSnapshot()
  const scaling = createAdaptiveScaling()
  let time = new Float32Array(0)
  let meter: ReturnType<typeof createEnergyMeter> | undefined
  // A broken diagnostic consumer must never interrupt production feature processing.
  const publish = () => { try { sink(view) } catch { /* observer failure is isolated */ } }
  return {
    read(analyser: AnalyserNode, bins: Float32Array, signal: AudioSignal, raw: BandValues,
      flux: { l1: BandValues, l2: BandValues } | undefined, active: boolean, now: number, delta: number) {
      if (time.length !== analyser.fftSize) time = new Float32Array(analyser.fftSize)
      if (active) analyser.getFloatTimeDomainData(time)
      else time.fill(0)
      fillSnapshot(view, bins, signal, raw, analyser.context.sampleRate, analyser.fftSize)
      if (meter?.sampleRate !== analyser.context.sampleRate || meter.fftSize !== analyser.fftSize) {
        meter = createEnergyMeter(analyser.context.sampleRate, analyser.fftSize)
        scaling.reset()
      }
      meter.update(bins, view.energy)
      view.state = active ? 'running' : 'inactive'
      view.timestamp = now
      view.delta = delta
      view.audioTime = analyser.context.currentTime
      view.rms = rms(time)
      view.rmsDbfs = dbfs(view.rms)
      applyAdaptive(view.energy, scaling.update(view.rms, delta, active), view.adaptive)
      for (const band of BAND_NAMES) {
        view.fluxL1[band] = flux?.l1[band] ?? 0
        view.fluxL2[band] = flux?.l2[band] ?? 0
      }
      publish()
    },
    reset() {
      resetSignal(view.signal)
      resetEnergy(view.energy)
      scaling.reset()
      resetAdaptiveView(view.adaptive)
      meter = undefined
      for (const group of [view.raw, view.sixRaw, view.fluxL1, view.fluxL2, view.active]) {
        for (const key of Object.keys(group)) (group as Record<string, number>)[key] = 0
      }
      view.rms = view.sampleRate = view.fftSize = view.windowMs = view.audioTime = view.timestamp = view.delta = 0
      view.rmsDbfs = null
      view.state = 'reset'
      time.fill(0)
      publish()
    },
  }
}

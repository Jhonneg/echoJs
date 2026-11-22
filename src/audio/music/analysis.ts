import { createMusicFeatureStore } from '../musicFeatures.ts'
import { createEnergy, createEnergyMeter, resetEnergy } from './energy.ts'
import { createOnsetDetector } from './onsets.ts'
import { createMusicalContext } from './context.ts'

// Same validated MI02–MI04 calculations, fed once by the existing analyser/clock.
// No diagnostic snapshots, time-domain reads, raw-media histories or new scheduler.
export function createMusicAnalysis() {
  const store = createMusicFeatureStore(), energy = createEnergy()
  let meter: ReturnType<typeof createEnergyMeter> | undefined
  let detector: ReturnType<typeof createOnsetDetector> | undefined
  let context: ReturnType<typeof createMusicalContext> | undefined
  let quietUntil = 0
  const emptyEvents = Object.freeze([])
  function reset(quietSeconds = 0) {
    quietUntil = quietSeconds > 0 ? performance.now() / 1000 + quietSeconds : 0
    detector?.reset(); context?.reset(); resetEnergy(energy); meter = undefined
    store.publish({ session: detector?.view.session ?? store.reader.read().session + 1, updatedAtSeconds: 0, status: 'inactive', sampleRate: 0, fftSize: 0,
      energy: { low: 0, mid: 0, high: 0, overall: 0, six: energy.six.linear }, sequence: 0, events: emptyEvents,
      context: { intensity: 0, brightness: 0, brightnessValid: false, activity: 0 } })
  }
  return { reader: store.reader, reset,
    update(bins: Float32Array, sampleRate: number, fftSize: number, nowMs: number, active: boolean) {
      if (meter?.sampleRate !== sampleRate || meter.fftSize !== fftSize) {
        meter = createEnergyMeter(sampleRate, fftSize)
        detector = createOnsetDetector(sampleRate, fftSize, detector?.view.session ?? store.reader.read().session)
        context = createMusicalContext(sampleRate, fftSize, context?.view.session ?? 0)
      }
      meter.update(bins, energy)
      const now = nowMs / 1000, enabled = active && now >= quietUntil
      const onsets = detector!.update(bins, energy.rms, now, enabled)
      const slow = context!.update(bins, energy.rms, onsets, now, enabled)
      store.publish({ session: onsets.session, updatedAtSeconds: now,
        status: !active ? 'inactive' : onsets.primed && slow.primed ? 'active' : 'priming', sampleRate, fftSize,
        energy: { low: energy.linear.bass, mid: energy.linear.midrange, high: energy.linear.treble,
          overall: slow.intensityTarget, six: energy.six.linear }, sequence: onsets.sequence, events: onsets.events,
        context: slow })
    },
  }
}

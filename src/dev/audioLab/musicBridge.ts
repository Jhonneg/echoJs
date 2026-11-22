import { createMusicFeatureStore } from '../../audio/musicFeatures.ts'
import type { DiagnosticSnapshot } from './diagnostics.ts'

// Copies validated controls once at the existing observer publication. No DSP or scheduler.
export function createMusicBridge() {
  const store = createMusicFeatureStore()
  return { reader: store.reader, publish(snapshot: Readonly<DiagnosticSnapshot>) {
    store.publish({ session: snapshot.onsets.session, updatedAtSeconds: snapshot.timestamp / 1000,
      status: snapshot.state !== 'running' ? 'inactive' : snapshot.onsets.primed && snapshot.context.primed ? 'active' : 'priming',
      sampleRate: snapshot.sampleRate, fftSize: snapshot.fftSize,
      energy: { low: snapshot.energy.linear.bass, mid: snapshot.energy.linear.midrange,
        high: snapshot.energy.linear.treble, overall: snapshot.context.intensityTarget, six: snapshot.energy.six.linear },
      sequence: snapshot.onsets.sequence, events: snapshot.onsets.events, context: snapshot.context })
  } }
}

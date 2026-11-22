import type { SixBandValues } from './signal.ts'

export type OnsetBand = 'low' | 'mid' | 'high'
export interface OnsetEvent {
  readonly session: number; readonly sequence: number; readonly band: OnsetBand
  readonly timeSeconds: number; readonly emittedAtSeconds: number; readonly strength: number
}
export interface MusicFeaturesV1 {
  readonly version: 1; readonly session: number; readonly frame: number
  readonly updatedAtSeconds: number; readonly status: 'inactive' | 'priming' | 'active'
  readonly sampleRate: number; readonly fftSize: number
  readonly energy: Readonly<{ low: number; mid: number; high: number; overall: number; six: Readonly<SixBandValues> }>
  readonly sequence: number; readonly events: readonly OnsetEvent[]
  readonly context: Readonly<{ intensity: number; brightness: number; brightnessValid: boolean; activity: number }>
}
export interface MusicFeatureReader { read(): MusicFeaturesV1 }
// A borrowed, reused scalar view. Only the producer can publish; events are already immutable.
export function createMusicFeatureStore() {
  const view = { version: 1 as const, session: 0, frame: 0, updatedAtSeconds: 0, status: 'inactive' as MusicFeaturesV1['status'],
    sampleRate: 0, fftSize: 0, energy: { low: 0, mid: 0, high: 0, overall: 0,
      six: { subBass: 0, bass: 0, lowMids: 0, highMids: 0, presence: 0, air: 0 } as SixBandValues },
    sequence: 0, events: [] as readonly OnsetEvent[], context: { intensity: 0, brightness: 0, brightnessValid: false, activity: 0 } }
  const reader: MusicFeatureReader = { read: () => view }
  return { reader, publish(input: Omit<MusicFeaturesV1, 'version' | 'frame'>) {
    view.frame = input.session === view.session ? view.frame + 1 : 1
    view.session = input.session; view.updatedAtSeconds = input.updatedAtSeconds; view.status = input.status
    view.sampleRate = input.sampleRate; view.fftSize = input.fftSize
    Object.assign(view.energy, input.energy); Object.assign(view.context, input.context)
    view.sequence = input.sequence; view.events = input.events
  } }
}
export function musicFeaturesFresh(view: MusicFeaturesV1, nowSeconds: number) {
  const age = nowSeconds - view.updatedAtSeconds
  return view.status === 'active' && age >= 0 && age <= .25
}

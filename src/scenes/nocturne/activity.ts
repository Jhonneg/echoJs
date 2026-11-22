import { musicFeaturesFresh, type MusicFeatureReader } from '../../audio/musicFeatures.ts'

// Source adapters own connected/paused/ended status. MI only answers receiving vs silent.
export function nocturneHasSignal(reader: MusicFeatureReader | undefined, nowSeconds: number) {
  if (!reader) return false
  const view = reader.read()
  return musicFeaturesFresh(view, nowSeconds) && Math.max(view.energy.low, view.energy.mid, view.energy.high) > .001
}

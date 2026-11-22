import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { AudioSignal } from '../../audio/signal'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import CrimsonPreview from './CrimsonPreview'
export function mountCrimsonPreview(container: HTMLElement, signal: AudioSignal, reader: MusicFeatureReader) {
  const root = createRoot(container)
  root.render(createElement(CrimsonPreview, { signal, reader }))
  return () => root.unmount()
}

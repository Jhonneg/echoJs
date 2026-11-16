import { defaultBloomDebug, type BloomDebug } from '../scenes/bloom/reactivity'

export function BloomDebugControls({ debug, setDebug }: { debug: BloomDebug, setDebug: (debug: BloomDebug) => void }) {
  return (
    <details className="bloom-debug">
      <summary>Frequency-band visual debug</summary>
      <p>Isolate visual responses without filtering audible playback. Diagnostics continue to show all live bands. Synthetic pulses test motion only.</p>
      <div className="controls">
        <label>Visual band <select value={debug.band} onChange={(event) => setDebug({ ...debug, band: event.currentTarget.value as BloomDebug['band'] })}>
          <option value="all">All</option><option value="bass">Bass</option><option value="midrange">Mids</option><option value="treble">Treble</option>
        </select></label>
        <label>Accent method <select value={debug.accent} onChange={(event) => setDebug({ ...debug, accent: event.currentTarget.value as BloomDebug['accent'] })}>
          <option value="combined">Combined</option><option value="energy">Energy transient</option><option value="flux">Spectral flux</option>
        </select></label>
        <label><input type="checkbox" checked={debug.ambient} onChange={(event) => setDebug({ ...debug, ambient: event.currentTarget.checked })} /> Ambient motion and glow</label>
        <label><input type="checkbox" checked={debug.synthetic} onChange={(event) => setDebug({ ...debug, synthetic: event.currentTarget.checked, pulseAt: null })} /> Synthetic visual input</label>
        <button disabled={!debug.synthetic || debug.band === 'all'} onClick={() => {
          setDebug({ ...debug, pulseAt: performance.now() })
          document.querySelector('.bloom-stage')?.scrollIntoView({ block: 'start' })
        }}>Pulse selected band</button>
        <button onClick={() => setDebug({ ...defaultBloomDebug })}>Reset visual debug</button>
      </div>
      <p>Reactivity and reduced-motion preferences still apply. Mids move and rotate fragments; bass changes overall size; treble accents selected surfaces. Use default settings for performance measurements.</p>
    </details>
  )
}

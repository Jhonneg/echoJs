import { useEffect, useState } from 'react'
import type { PerformanceMeasurement } from '../engine/performance'
import type { createAnalysis } from '../audio/analysis'

export function PerformancePanel({ measurement, analysis, source }: {
  measurement: PerformanceMeasurement, analysis: ReturnType<typeof createAnalysis>, source: string
}) {
  const [snapshot, setSnapshot] = useState(() => measurement.snapshot)
  useEffect(() => {
    const hidden = () => { if (document.hidden) measurement.invalidate('Page was hidden. Keep it visible for the whole run.') }
    document.addEventListener('visibilitychange', hidden)
    const timer = window.setInterval(() => setSnapshot(measurement.snapshot), 500)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hidden) }
  }, [measurement])
  useEffect(() => { measurement.invalidate('Audio source or playback state changed. Repeat the run.') }, [measurement, source])
  const active = snapshot.phase === 'warming' || snapshot.phase === 'measuring'
  const result = snapshot.result
  return (
    <section aria-labelledby="performance-heading">
      <h2 id="performance-heading">Performance measurement</h2>
      <p>5-second warm-up, then 30 seconds measuring scene frame cadence. Keep this page visible and keep the source, viewport and settings unchanged. Starting returns to the scene; return here after 35 seconds for results. This measures frame timing, not GPU execution time.</p>
      <p>Current source: {source}. Production preview is recommended.</p>
      <div className="controls">
        <button disabled={!snapshot.ready || active} onClick={() => {
          if (document.hidden) return
          measurement.start({
            browser: navigator.userAgent, logicalCores: navigator.hardwareConcurrency,
            build: import.meta.env.PROD ? 'production' : 'development',
            source, sampleRate: analysis.format.sampleRate, fftSize: analysis.format.fftSize,
          }, performance.now())
          setSnapshot(measurement.snapshot)
          document.querySelector('.bloom-stage')?.scrollIntoView({ block: 'start' })
        }}>Measure performance</button>
        <button disabled={!active} onClick={() => {
          measurement.invalidate('Run cancelled.')
          setSnapshot(measurement.snapshot)
        }}>Cancel measurement</button>
      </div>
      <p role="status">{active ? `${snapshot.phase}: ${snapshot.elapsedSeconds.toFixed(0)} / ${snapshot.phase === 'warming' ? 5 : 30} seconds` : snapshot.phase === 'invalid' ? snapshot.reason : snapshot.phase === 'complete' ? 'Measurement complete.' : 'Ready when the scene is loaded.'}</p>
      {result && <>
        <dl>
          <div><dt>Graphics quality / render DPR</dt><dd>{result.environment.quality === 'low' ? 'Low' : 'Standard'} / {result.environment.renderDpr.toFixed(2)}</dd></div>
          <div><dt>Average FPS</dt><dd>{result.fps.toFixed(1)}</dd></div>
          <div><dt>Median / p95 frame time</dt><dd>{result.p50FrameMs.toFixed(2)} / {result.p95FrameMs.toFixed(2)} ms</dd></div>
          <div><dt>Longest frame interval</dt><dd>{result.maxFrameMs.toFixed(2)} ms</dd></div>
        </dl>
        <p>Copy this result with your physical CPU/GPU model for the evaluation. Results stay on this page; nothing is uploaded or saved automatically.</p>
        <pre className="performance-result" aria-label="Performance result">{JSON.stringify(result, null, 2)}</pre>
      </>}
    </section>
  )
}

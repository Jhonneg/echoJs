import { useEffect, useRef, useState } from 'react'
import { BAND_NAMES } from '../audio/signal'
import type { createAnalysis } from '../audio/analysis'

type Analysis = ReturnType<typeof createAnalysis>

export function SignalDiagnostics({ analysis }: { analysis: Analysis }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  function readTelemetry() {
    const signal = analysis.signal
    return {
      ...signal, levels: { ...signal.levels }, fast: { ...signal.fast },
      slow: { ...signal.slow }, transient: { ...signal.transient },
      ...analysis.format, renderAgeMs: analysis.timing.renderAgeMs, message: analysis.message,
    }
  }
  const [telemetry, setTelemetry] = useState(readTelemetry)
  useEffect(() => {
    const timer = window.setInterval(() => {
      const signal = analysis.signal
      setTelemetry({ ...signal, levels: { ...signal.levels }, fast: { ...signal.fast }, slow: { ...signal.slow },
        transient: { ...signal.transient }, ...analysis.format, renderAgeMs: analysis.timing.renderAgeMs, message: analysis.message })
    }, 200)
    let frame = 0
    const drawing = canvas.current?.getContext('2d')
    function draw() {
      if (drawing) {
        drawing.clearRect(0, 0, 640, 120)
        drawing.fillStyle = '#b4ccff'
        analysis.spectrum.forEach((value, i) => drawing.fillRect(i * 20, 120 - value * 120, 16, value * 120))
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => { clearInterval(timer); cancelAnimationFrame(frame) }
  }, [analysis])

  return (
    <div>
      <p>Analysis: {telemetry.message}</p>
      <dl>
        <div><dt>Analysis sample rate</dt><dd>{telemetry.sampleRate ? `${telemetry.sampleRate.toLocaleString('en-US')} Hz` : 'Not active'}</dd></div>
        <div><dt>Feature updates/s (1 s window)</dt><dd>{telemetry.updateHz > 0 ? telemetry.updateHz.toFixed(1) : 'Not measured'}</dd></div>
        <div><dt>Signal age at render</dt><dd>{telemetry.renderAgeMs !== null ? `${telemetry.renderAgeMs.toFixed(1)} ms` : 'Not active'}</dd></div>
        <div><dt>FFT size</dt><dd>{telemetry.fftSize ?? 'Not active'}</dd></div>
        {(['bass', 'midrange', 'treble', 'intensity'] as const).map((band) => (
          <div key={band}><dt>{band}</dt><dd>{telemetry[band].toFixed(3)} <meter aria-label={band} min="0" max="1" value={telemetry[band]} /></dd></div>
        ))}
      </dl>
      <p>{telemetry.usingDefaultRate
        ? '96 kHz was not supported; using the browser default analysis rate.'
        : 'Analysis requests 96 kHz. This does not change the source recording or capture rate.'}</p>
      <p>Bands below show independent normalized level, fast envelope, slow baseline and transient accent. Intensity is the slow atmosphere. These values are not kick/beat labels.</p>
      <table className="signal-features">
        <caption>Audio feature envelopes</caption>
        <thead><tr><th scope="col">Band</th><th scope="col">Level</th><th scope="col">Fast</th><th scope="col">Slow</th><th scope="col">Transient</th></tr></thead>
        <tbody>{BAND_NAMES.map((band) => <tr key={band}><th scope="row">{band}</th>
          <td>{telemetry.levels[band].toFixed(3)}</td><td>{telemetry.fast[band].toFixed(3)}</td>
          <td>{telemetry.slow[band].toFixed(3)}</td><td>{telemetry.transient[band].toFixed(3)}</td></tr>)}</tbody>
      </table>
      <canvas ref={canvas} width="640" height="120" aria-label="Live spectrum, low to high frequency" role="img" />
      <p>Levels are normalized visual magnitudes, not calibrated loudness.
        Silence does not mean sharing ended. Shared tabs retain their own playback; local files play through ECHO.</p>
      <button onClick={analysis.resume}>Resume analysis</button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { createAnalysis } from '../audio/analysis'

type Analysis = ReturnType<typeof createAnalysis>

export function SignalDiagnostics({ analysis }: { analysis: Analysis }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [telemetry, setTelemetry] = useState(() => ({ ...analysis.signal, message: analysis.message }))
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTelemetry({ ...analysis.signal, message: analysis.message })
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
        {(['bass', 'midrange', 'treble', 'intensity'] as const).map((band) => (
          <div key={band}><dt>{band}</dt><dd>{telemetry[band].toFixed(3)} <meter aria-label={band} min="0" max="1" value={telemetry[band]} /></dd></div>
        ))}
      </dl>
      <canvas ref={canvas} width="640" height="120" aria-label="Live spectrum, low to high frequency" role="img" />
      <p>Levels are normalized visual magnitudes, not calibrated loudness.
        Silence does not mean sharing ended. Shared tabs retain their own playback; local files play through ECHO.</p>
      <button onClick={analysis.resume}>Resume analysis</button>
    </div>
  )
}

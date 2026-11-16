import { useEffect, useRef, useState } from 'react'
import { createAnalysis } from './audio/analysis'
import { SignalDiagnostics } from './components/SignalDiagnostics'
import { createTabCapture, type CaptureState } from './audio/tabCapture'

export default function App() {
  const [capture, setCapture] = useState<CaptureState>({
    status: 'disconnected', audioTracks: 0, message: 'Choose a permitted browser tab to share.',
  })
  const [analysis] = useState(createAnalysis)
  const controller = useRef<ReturnType<typeof createTabCapture> | null>(null)
  useEffect(() => {
    const active = createTabCapture(setCapture, analysis)
    controller.current = active
    return () => {
      active.dispose()
      controller.current = null
    }
  }, [analysis])

  return (
    <main>
      <header>
        <p className="eyebrow">Proof of concept</p>
        <h1>ECHO</h1>
        <p>Your music. Another world.</p>
      </header>
      <section aria-labelledby="diagnostics-heading">
        <h2 id="diagnostics-heading">Audio diagnostics</h2>
        <dl>
          <div><dt>Source</dt><dd>{capture.status === 'connected' ? 'Shared browser source' : 'None selected'}</dd></div>
          <div><dt>Connection</dt><dd>{capture.status}</dd></div>
          <div><dt>Audio tracks</dt><dd>{capture.audioTracks}</dd></div>

        </dl>
        <SignalDiagnostics analysis={analysis} />
        <p>Choose a browser tab in the native picker and enable Share tab audio.
          The browser also shares video; ECHO does not read or display it.</p>
        <div className="controls">
          <button onClick={() => void controller.current?.connect()}
            disabled={capture.status === 'connecting' || capture.status === 'connected'}>Connect</button>
          <button onClick={() => controller.current?.disconnect()}
            disabled={capture.status !== 'connecting' && capture.status !== 'connected'}>Disconnect</button>
        </div>
        <p role="status">{capture.message}</p>
        <p>Disconnect while the picker is open cancels ECHO's request; close the native picker yourself.
          Any stream returned afterwards is immediately stopped.</p>
        <p><a href="/tone-fixture.html" target="_blank" rel="noreferrer">Open permitted test tone tab</a></p>
      </section>
    </main>
  )
}

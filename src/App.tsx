import { createPerformanceMeasurement } from './engine/performance'
import { PerformancePanel } from './components/PerformancePanel'
import BloomScene from './scenes/bloom/BloomScene'
import { useEffect, useRef, useState } from 'react'
import { createLocalFile, type LocalFileState } from './audio/localFile'
import { createAnalysis } from './audio/analysis'
import { SignalDiagnostics } from './components/SignalDiagnostics'
import { createTabCapture, type CaptureState } from './audio/tabCapture'

export default function App() {
  const [capture, setCapture] = useState<CaptureState>({
    status: 'disconnected', audioTracks: 0, message: 'Choose a permitted browser tab to share.',
  })
  const [local, setLocal] = useState<LocalFileState>({ status: 'empty', name: '', message: 'Select a permitted local audio file.' })
  const [source, setSource] = useState<'tab' | 'file'>('tab')
  const localController = useRef<ReturnType<typeof createLocalFile> | null>(null)
  const [measurement] = useState(createPerformanceMeasurement)
  const [analysis] = useState(createAnalysis)
  const controller = useRef<ReturnType<typeof createTabCapture> | null>(null)
  useEffect(() => {
    const active = createTabCapture(setCapture, analysis)
    controller.current = active
    const file = createLocalFile(setLocal, analysis)
    localController.current = file
    return () => {
      active.dispose()
      file.dispose()
      localController.current = null
      controller.current = null
    }
  }, [analysis])

  return (
    <>
      <BloomScene signal={analysis.signal} onRenderTime={analysis.recordRenderTime} measurement={measurement} />
      <main>
      <header>
        <p className="eyebrow">Proof of concept</p>
        <h1>ECHO</h1>
        <p>Your music. Another world.</p>
      </header>
      <section aria-labelledby="diagnostics-heading">
        <h2 id="diagnostics-heading">Audio diagnostics</h2>
        <dl>
          <div><dt>Source</dt><dd>{source === 'file' ? 'Local file' : capture.status === 'connected' ? 'Shared browser source' : 'None selected'}</dd></div>
          <div><dt>Connection</dt><dd>{source === 'file' ? local.status : capture.status}</dd></div>
          <div><dt>Audio tracks</dt><dd>{source === 'file' ? '—' : capture.audioTracks}</dd></div>

        </dl>
        <SignalDiagnostics analysis={analysis} />
        <p>Choose a browser tab in the native picker and enable Share tab audio.
          The browser also shares video; ECHO does not read or display it.</p>
        <div className="controls">
          <button onClick={() => {
            if (source === 'file') localController.current?.clear()
            setSource('tab')
            void controller.current?.connect()
          }}
            disabled={capture.status === 'connecting' || capture.status === 'connected'}>Connect</button>
          <button onClick={() => {
            if (source === 'file') localController.current?.clear()
            else controller.current?.disconnect()
          }}
            disabled={source === 'file' ? local.status === 'empty' : capture.status !== 'connecting' && capture.status !== 'connected'}>Disconnect</button>
        </div>
        <p role="status">{source === 'file' ? local.message : capture.message}</p>
        <fieldset>
          <legend>Local audio (stays on this device)</legend>
          <label>Audio file <input type="file" accept="audio/*" onChange={(event) => {
            const selected = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (!selected) return
            controller.current?.disconnect()
            setSource('file')
            localController.current?.select(selected)
          }} /></label>
          <p>{local.name || 'No local file selected'}</p>
          <div className="controls">
            <button disabled={source !== 'file' || local.status === 'empty' || local.status === 'error' || local.status === 'playing'} onClick={() => void localController.current?.play()}>Play</button>
            <button disabled={source !== 'file' || local.status !== 'playing'} onClick={() => localController.current?.pause()}>Pause</button>
            <label>Volume <input type="range" min="0" max="1" step="0.01" defaultValue="0.5" onChange={(event) => localController.current?.setVolume(Number(event.currentTarget.value))} /></label>
          </div>
        </fieldset>
        <p>Disconnect while the picker is open cancels ECHO's request; close the native picker yourself.
          Any stream returned afterwards is immediately stopped.</p>
        <p><a href="/tone-fixture.html" target="_blank" rel="noreferrer">Open permitted test tone tab</a></p>
      </section>
        <PerformancePanel measurement={measurement} analysis={analysis} source={source === 'file' ? `local file / ${local.status}` : `tab / ${capture.status}`} />
      </main>
    </>
  )
}

import { createPerformanceMeasurement } from './engine/performance'
import { PerformancePanel } from './components/PerformancePanel'
import BloomScene from './scenes/bloom/BloomScene'
import { useEffect, useRef, useState } from 'react'
import { createLocalFile, type LocalFileState } from './audio/localFile'
import { createAnalysis } from './audio/analysis'
import { SignalDiagnostics } from './components/SignalDiagnostics'
import { createTabCapture, type CaptureState } from './audio/tabCapture'
import { AudioControls } from './components/AudioControls'
import { BloomDebugControls } from './components/BloomDebugControls'
import { defaultBloomDebug, type BloomDebug } from './scenes/bloom/reactivity'
import { FullscreenControls } from './components/FullscreenControls'
import type { GraphicsQuality } from './engine/quality'

export default function App() {
  const [capture, setCapture] = useState<CaptureState>({
    status: 'disconnected', audioTracks: 0, message: 'Choose a permitted browser tab to share.',
  })
  const [local, setLocal] = useState<LocalFileState>({ status: 'empty', name: '', message: 'Select a permitted local audio file.' })
  const [source, setSource] = useState<'tab' | 'file'>('tab')
  const [reactivity, setReactivity] = useState(1)
  const [quality, setQuality] = useState<GraphicsQuality>('standard')
  const [volume, setVolume] = useState(0.5)
  const [debug, setDebug] = useState<BloomDebug>({ ...defaultBloomDebug })
  const localController = useRef<ReturnType<typeof createLocalFile> | null>(null)
  const [measurement] = useState(createPerformanceMeasurement)
  const [analysis] = useState(createAnalysis)
  const controller = useRef<ReturnType<typeof createTabCapture> | null>(null)
  const experience = useRef<HTMLElement>(null)
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
      <a className="skip-link" href="#audio-controls">Skip to audio controls</a>
      <main className="experience" ref={experience}>
        <h1 className="sr-only">ECHO — Your music. Another world.</h1>
        <BloomScene signal={analysis.signal} onRenderTime={analysis.recordRenderTime} measurement={measurement} reactivity={reactivity} debug={debug} quality={quality} />
        <AudioControls source={source} capture={capture} local={local} analysis={analysis}
          fullscreenControl={<FullscreenControls target={experience} onChange={() => measurement.invalidate('Fullscreen changed. Repeat the performance measurement.')} />}
          reactivity={reactivity} volume={volume} onReactivity={setReactivity}
          quality={quality} onQuality={(value) => {
            measurement.invalidate('Graphics quality changed. Repeat the performance measurement.')
            setQuality(value)
          }}
          onShare={() => {
            if (source === 'file') localController.current?.clear()
            setSource('tab')
            void controller.current?.connect()
          }}
          onFile={(selected) => {
            controller.current?.disconnect()
            setSource('file')
            localController.current?.select(selected)
          }}
          onDisconnect={() => {
            if (source === 'file') localController.current?.clear()
            else controller.current?.disconnect()
          }}
          onPlay={() => { void localController.current?.play() }}
          onPause={() => localController.current?.pause()}
          onVolume={(value) => { setVolume(value); localController.current?.setVolume(value) }} />
      </main>
      <div className="tools-container">
        <details id="audio-tools" className="developer-tools">
          <summary>Diagnostics &amp; development tools</summary>
          <p>Optional inspection tools. Your source and playback controls stay above.</p>
          <section aria-labelledby="diagnostics-heading">
            <h2 id="diagnostics-heading">Audio diagnostics</h2>
            <dl>
              <div><dt>Source</dt><dd>{source === 'file' ? 'Local file' : capture.status === 'connected' ? 'Shared browser source' : 'None selected'}</dd></div>
              <div><dt>Connection</dt><dd>{source === 'file' ? local.status : capture.status}</dd></div>
              <div><dt>Audio tracks</dt><dd>{source === 'file' ? '—' : capture.audioTracks}</dd></div>
            </dl>
            <SignalDiagnostics analysis={analysis} />
            <p>Choose a browser tab and enable Share tab audio. The browser also shares video; ECHO does not read or display it.</p>
            <p><a href="/tone-fixture.html" target="_blank" rel="noreferrer">Open permitted test tone tab</a></p>
          </section>
          <BloomDebugControls debug={debug} setDebug={setDebug} />
          <PerformancePanel measurement={measurement} analysis={analysis} source={source === 'file' ? `local file / ${local.status}` : `tab / ${capture.status}`} />
        </details>
      </div>
    </>
  )
}

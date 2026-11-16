import BloomScene from './scenes/bloom/BloomScene'
import LavenderPeaksScene from './scenes/lavender-peaks/LavenderPeaksScene'
import CrimsonHorizonScene from './scenes/crimson-horizon/CrimsonHorizonScene'
import type { SceneId } from './scenes/scene'
import { useEffect, useRef, useState } from 'react'
import { createLocalFile, type LocalFileState } from './audio/localFile'
import { createAnalysis } from './audio/analysis'
import { createTabCapture, type CaptureState } from './audio/tabCapture'
import { AudioControls } from './components/AudioControls'
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
  const [scene, setScene] = useState<SceneId>('bloom')
  const [volume, setVolume] = useState(0.5)
  const localController = useRef<ReturnType<typeof createLocalFile> | null>(null)
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
      <main className="experience" ref={experience}>
        <h1 className="sr-only">ECHO — Your music. Another world.</h1>
        {scene === 'bloom'
          ? <BloomScene signal={analysis.signal} onRenderTime={analysis.recordRenderTime} reactivity={reactivity} quality={quality} />
          : scene === 'lavender-peaks'
            ? <LavenderPeaksScene quality={quality} signal={analysis.signal} reactivity={reactivity} />
            : <CrimsonHorizonScene quality={quality} signal={analysis.signal} reactivity={reactivity} />}
        <AudioControls source={source} capture={capture} local={local} analysis={analysis}
          scene={scene} onScene={setScene}
          fullscreenControl={<FullscreenControls target={experience} />}
          reactivity={reactivity} volume={volume} onReactivity={setReactivity}
          quality={quality} onQuality={setQuality}
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

    </>
  )
}

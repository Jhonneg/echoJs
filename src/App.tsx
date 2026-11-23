import { NOCTURNE_ALL_ON, type NocturneLightingMode } from './scenes/nocturne/lighting'
import NocturneScene from './scenes/nocturne/NocturneScene'
import BloomScene from './scenes/bloom/BloomScene'
import LavenderPeaksScene from './scenes/lavender-peaks/LavenderPeaksScene'
import CrimsonHorizonScene from './scenes/crimson-horizon/CrimsonHorizonScene'
import { sceneNames, type SceneId } from './scenes/scene'
import { useEffect, useRef, useState } from 'react'
import { createLocalFile, type LocalFileState } from './audio/localFile'
import { createAnalysis } from './audio/analysis'
import { createTabCapture, type CaptureState } from './audio/tabCapture'
import { AudioControls } from './components/AudioControls'
import type { GraphicsQuality } from './engine/quality'

export default function App() {
  const [capture, setCapture] = useState<CaptureState>({
    status: 'disconnected', audioTracks: 0, message: 'Choose a permitted browser tab to share.',
  })
  const [local, setLocal] = useState<LocalFileState>({ status: 'empty', name: '', message: 'Select a permitted local audio file.' })
  const [source, setSource] = useState<'tab' | 'file'>('tab')
  const [bloomFloating, setBloomFloating] = useState(true)
  const reactivity = 1
  const [quality, setQuality] = useState<GraphicsQuality>('standard')
  const [nocturneLightingMode, setNocturneLightingMode] = useState<NocturneLightingMode>('audio')
  const [nocturneLighting, setNocturneLighting] = useState(NOCTURNE_ALL_ON)
  const [scene, setScene] = useState<SceneId>('bloom')
  const [volume, setVolume] = useState(0.5)
  const localController = useRef<ReturnType<typeof createLocalFile> | null>(null)
  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))
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
      <main className="experience">
        <h1 className="sr-only">{sceneNames[scene]} — music visualizer</h1>
        {scene === 'bloom'
          ? <BloomScene playing={source === 'file' ? local.status === 'playing' : capture.status === 'connected' && bloomFloating} musicFeatures={analysis.musicFeatures!} onRenderTime={analysis.recordRenderTime} reactivity={reactivity} quality={quality} />
          : scene === 'lavender-peaks'
            ? <LavenderPeaksScene quality={quality} musicFeatures={analysis.musicFeatures!} reactivity={reactivity} />
            : scene === 'nocturne'
              ? <NocturneScene musicFeatures={analysis.musicFeatures!} quality={quality} lighting={nocturneLighting} lightingMode={nocturneLightingMode} reactivity={reactivity} />
              : <CrimsonHorizonScene pilot={analysis.musicFeatures ? { reader: analysis.musicFeatures, profile: 'candidate' } : undefined} quality={quality} signal={analysis.signal} reactivity={reactivity} />}
        <AudioControls bloomFloating={bloomFloating} onBloomFloating={setBloomFloating} source={source} capture={capture} local={local} analysis={analysis}
          scene={scene} onScene={setScene}
          nocturneLightingMode={nocturneLightingMode} onNocturneLightingMode={setNocturneLightingMode}
          nocturneLighting={nocturneLighting} onNocturneLighting={setNocturneLighting}
          volume={volume}
          quality={quality} onQuality={setQuality}
          onShare={() => {
            setBloomFloating(true)
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

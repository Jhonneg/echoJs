import { NOCTURNE_ALL_ON, type NocturneLightingMode } from './scenes/nocturne/lighting'
// Bloom is the first landscape, so it stays in the main bundle; the others load on demand.
import BloomScene from './scenes/bloom/BloomScene'
import type NocturneSceneType from './scenes/nocturne/NocturneScene'
import type LavenderPeaksSceneType from './scenes/lavender-peaks/LavenderPeaksScene'
import type CrimsonHorizonSceneType from './scenes/crimson-horizon/CrimsonHorizonScene'
import { sceneNames, type SceneId } from './scenes/scene'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { afterFirstDraw, renderHealth } from './engine/renderHealth'
import { LandscapeBoundary, SceneStatus } from './components/SceneStatus'
import { createLocalFile, probeAudioFile, type LocalFileState } from './audio/localFile'
import { createAnalysis } from './audio/analysis'
import { createTabCapture, type CaptureState } from './audio/tabCapture'
import { AudioControls } from './components/AudioControls'
import type { SwitchNotice } from './components/audioFeedback'
import type { GraphicsQuality } from './engine/quality'

type LoadedScenes = {
  bloom: typeof BloomScene
  nocturne?: typeof NocturneSceneType
  'lavender-peaks'?: typeof LavenderPeaksSceneType
  'crimson-horizon'?: typeof CrimsonHorizonSceneType
}
type DeferredScene = Exclude<SceneId, 'bloom'>
const sceneLoaders: { [K in DeferredScene]: () => Promise<{ default: NonNullable<LoadedScenes[K]> }> } = {
  nocturne: () => import('./scenes/nocturne/NocturneScene'),
  'lavender-peaks': () => import('./scenes/lavender-peaks/LavenderPeaksScene'),
  'crimson-horizon': () => import('./scenes/crimson-horizon/CrimsonHorizonScene'),
}

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
  const [loaded, setLoaded] = useState<LoadedScenes>({ bloom: BloomScene })
  // A landscape that is still loading or failed to load; the current one stays on screen.
  const [pending, setPending] = useState<{ id: DeferredScene, status: 'loading' | 'error' } | null>(null)
  const sceneToken = useRef(0)
  // Bumped to rebuild the landscape (and its canvas) after a crash or a lost context.
  const [attempt, setAttempt] = useState(0)
  const graphics = useSyncExternalStore(renderHealth.subscribe, renderHealth.get)
  const requestScene = (id: SceneId) => {
    const token = ++sceneToken.current
    if (id === 'bloom' || loaded[id]) {
      setPending(null)
      setScene(id)
      return
    }
    setPending({ id, status: 'loading' })
    sceneLoaders[id]().then((module) => {
      setLoaded((current) => ({ ...current, [id]: module.default }))
      if (token !== sceneToken.current) return
      setPending(null)
      setScene(id)
    }, () => {
      if (token === sceneToken.current) setPending({ id, status: 'error' })
    })
  }
  // Once the first landscape is up, fetch the others while the browser is idle so a later
  // switch is immediate. Failures are ignored here and retried on demand.
  useEffect(() => {
    let cancelled = false
    const preload = () => {
      for (const id of Object.keys(sceneLoaders) as DeferredScene[]) {
        sceneLoaders[id]().then((module) => {
          if (!cancelled) setLoaded((current) => current[id] ? current : { ...current, [id]: module.default })
        }, () => {})
      }
    }
    // The page goes idle while the first canvas is still being set up, so wait until a
    // landscape has actually drawn before asking for idle time.
    let idle: number | undefined, timer: number | undefined
    const stopWaiting = afterFirstDraw(() => {
      if (cancelled) return
      if (window.requestIdleCallback) idle = window.requestIdleCallback(preload, { timeout: 4000 })
      else timer = window.setTimeout(preload, 1000)
    })
    return () => {
      cancelled = true
      stopWaiting()
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [])
  const [volume, setVolume] = useState(0.5)
  const localController = useRef<ReturnType<typeof createLocalFile> | null>(null)
  const [analysis] = useState(() => createAnalysis({ musicIntelligence: true }))
  const controller = useRef<ReturnType<typeof createTabCapture> | null>(null)
  // Each Share/Open request takes a token; a slower earlier request must not undo a later one.
  const switchToken = useRef(0)
  // A notice describes the source state it was written for and hides once that state changes.
  const [notice, setNotice] = useState<SwitchNotice & { key: string } | null>(null)
  const sourceKey = `${source}|${capture.status}|${local.status}`
  // A file released for a pending share, put back if sharing does not connect.
  const pendingRestore = useRef<{ token: number, file: File, time: number } | null>(null)
  const restoreFile = (token: number, reason: string) => {
    const saved = pendingRestore.current
    if (!saved || saved.token !== token || token !== switchToken.current) return
    pendingRestore.current = null
    setSource('file')
    localController.current?.select(saved.file, { time: saved.time,
      message: `${reason} ${saved.file.name} is loaded again. Press Play to continue.` })
  }
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

  const { nocturne: NocturneScene, 'lavender-peaks': LavenderPeaksScene, 'crimson-horizon': CrimsonHorizonScene } = loaded

  return (
    <>
      <main className="experience">
        <h1 className="sr-only">{sceneNames[scene]} — music visualizer</h1>
        <LandscapeBoundary key={`${scene}:${attempt}`} name={sceneNames[scene]} onRestart={() => setAttempt((n) => n + 1)}>
        {scene === 'bloom'
          ? <BloomScene playing={source === 'file' ? local.status === 'playing' : capture.status === 'connected' && bloomFloating} musicFeatures={analysis.musicFeatures!} onRenderTime={analysis.recordRenderTime} reactivity={reactivity} quality={quality} />
          : scene === 'lavender-peaks'
            ? LavenderPeaksScene && <LavenderPeaksScene quality={quality} musicFeatures={analysis.musicFeatures!} reactivity={reactivity} />
            : scene === 'nocturne'
              ? NocturneScene && <NocturneScene musicFeatures={analysis.musicFeatures!} quality={quality} lighting={nocturneLighting} lightingMode={nocturneLightingMode} reactivity={reactivity} />
              : CrimsonHorizonScene && <CrimsonHorizonScene pilot={analysis.musicFeatures ? { reader: analysis.musicFeatures, profile: 'candidate' } : undefined} quality={quality} signal={analysis.signal} reactivity={reactivity} />}
        </LandscapeBoundary>
        <SceneStatus pending={pending && { name: sceneNames[pending.id], status: pending.status }}
          graphicsLost={graphics.status === 'lost'} lossEpisode={graphics.episode} sceneName={sceneNames[scene]}
          onRetryLoad={() => { if (pending) requestScene(pending.id) }}
          onDismissLoad={() => { sceneToken.current++; setPending(null) }}
          onRestart={() => setAttempt((n) => n + 1)} />
        <AudioControls bloomFloating={bloomFloating} onBloomFloating={setBloomFloating} source={source} capture={capture} local={local} analysis={analysis}
          scene={scene} requestedScene={pending?.id ?? null} onScene={requestScene}
          nocturneLightingMode={nocturneLightingMode} onNocturneLightingMode={setNocturneLightingMode}
          nocturneLighting={nocturneLighting} onNocturneLighting={setNocturneLighting}
          volume={volume}
          notice={notice?.key === sourceKey ? notice : null}
          quality={quality} onQuality={setQuality}
          onShare={() => {
            const token = ++switchToken.current
            setNotice(null)
            setBloomFloating(true)
            // Analysis can only own one input, so the file is released before the picker opens.
            // If sharing does not connect, the same file is reloaded at the same position.
            const saved = source === 'file' ? localController.current?.snapshot() : null
            pendingRestore.current = saved ? { token, ...saved } : null
            if (source === 'file') localController.current?.clear()
            setSource('tab')
            void controller.current?.connect().then((result) => {
              if (result.status === 'connected') pendingRestore.current = null
              else restoreFile(token, result.message)
            })
          }}
          onFile={(selected) => {
            const token = ++switchToken.current
            pendingRestore.current = null
            const active = source === 'tab' ? capture.status === 'connected' : local.status !== 'empty' && local.status !== 'error'
            const replace = () => {
              setNotice(null)
              controller.current?.disconnect()
              setSource('file')
              localController.current?.select(selected)
            }
            if (!active) return replace()
            // Keep the working source until the browser confirms it can open the new file.
            const current = source === 'tab' ? 'your shared tab is still connected' : `${local.name} is still loaded`
            setNotice({ text: `Opening ${selected.name}…`, tone: 'neutral', key: sourceKey })
            void probeAudioFile(selected).then((ok) => {
              if (token !== switchToken.current) return
              if (ok) return replace()
              setNotice({ tone: 'error', key: sourceKey,
                text: `${selected.name} could not be played, so ${current}. Choose a browser-supported file, such as WAV or MP3, to switch.` })
            })
          }}
          onDisconnect={() => {
            setNotice(null)
            if (source === 'file') localController.current?.clear()
            else {
              // Cancelling ECHO's request does not close the browser picker, so restore now.
              const cancelling = capture.status === 'connecting'
              controller.current?.disconnect()
              if (cancelling) restoreFile(switchToken.current, 'Tab sharing was cancelled.')
            }
          }}
          onPlay={() => { void localController.current?.play() }}
          onPause={() => localController.current?.pause()}
          onVolume={(value) => { setVolume(value); localController.current?.setVolume(value) }} />
      </main>

    </>
  )
}

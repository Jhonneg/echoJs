// Generated feature fixture only. No file/tab/audio nodes and no live-media inspector.
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { createMusicFeatureStore, type OnsetEvent } from '../../audio/musicFeatures'
import { silentSignal, SIX_BAND_NAMES } from '../../audio/signal'
import CrimsonHorizonScene, { type CrimsonPilotInput } from '../../scenes/crimson-horizon/CrimsonHorizonScene'
import type { CrimsonProfile } from '../../scenes/crimson-horizon/musicPilot'
import type { GraphicsQuality } from '../../engine/quality'
import { createTerrainChunk } from '../../scenes/crimson-horizon/terrain'
import './style.css'
const store = createMusicFeatureStore(), signal = silentSignal()
let profile: CrimsonProfile = 'legacy', quality: GraphicsQuality = 'standard', gain = 1
let energy = .3, moving = true, ticking = true, sequence = 0, session = 1, events: OnsetEvent[] = [], nextEvent = 0
let change = () => {}, inspect: Parameters<NonNullable<CrimsonPilotInput['inspect']>> | undefined
let frames: number[] = [], previous = performance.now()
let lowMids: number | null = null, highMids: number | null = null
let fixedLight: number | null = null, fixedStreak: number | null = null, fixedProgress: number | null = null
let trial = false
let peakScale = 1, peakGlow = 1, peakPulse = 0
const workers = new Set<Worker>()
const NativeWorker = window.Worker
window.Worker = class extends NativeWorker {
  constructor(url: string | URL, options?: WorkerOptions) { super(url, options); workers.add(this) }
  terminate() { workers.delete(this); super.terminate() }
}
function publish() {
  const now = performance.now() / 1000
  if (ticking) {
    if (now >= nextEvent) {
      nextEvent = now + .8
      for (const band of ['low', 'mid', 'high'] as const) events.push(Object.freeze({ session, sequence: ++sequence, band,
        timeSeconds: now - .04, emittedAtSeconds: now, strength: energy }))
      if (events.length > 256) events = events.slice(-256)
    }
    signal.isPlaying = true; signal.updatedAt = now * 1000
    signal.fast.bass = energy; signal.transient.bass = now > nextEvent - .7 ? 0 : energy
    for (const band of SIX_BAND_NAMES) signal.sixBands[band] = moving ? energy : 0
    const six = { ...signal.sixBands, lowMids: lowMids ?? energy, highMids: highMids ?? energy }
    store.publish({ session, updatedAtSeconds: now, status: 'active', sampleRate: 48000, fftSize: 2048,
      energy: { low: energy, mid: energy, high: energy, overall: moving ? energy : 0, six },
      sequence, events, context: { intensity: energy, brightness: .7, brightnessValid: true, activity: energy } })
  }
  requestAnimationFrame(publish)
}
requestAnimationFrame(publish)
export default function App() {
  const [, update] = useState(0)
  useEffect(() => { change = () => update(value => value + 1); return () => { change = () => {} } }, [])
  return <CrimsonHorizonScene signal={signal} reactivity={gain} quality={quality} pilot={{ reader: store.reader, profile,
    inspect: (...args) => { inspect = args;
      for (const object of args[2].children) if (object.name.startsWith('crimson-chunk-')) {
        const material = (object as import('three').Mesh<import('three').BufferGeometry, import('three').ShaderMaterial>).material
        if (fixedLight !== null) material.uniforms.contourLight.value = fixedLight
        if (fixedStreak !== null) material.uniforms.contourStreak.value = fixedStreak
        if (fixedProgress !== null) material.uniforms.contourProgress.value = fixedProgress
      }
      peakScale = Math.max(peakScale, args[2].getObjectByName('crimson-sun')?.scale.x ?? 1); peakGlow = Math.max(peakGlow, args[2].getObjectByName('crimson-glow')?.scale.x ?? 1); peakPulse = Math.max(peakPulse, args[0].sunPulse); const now = performance.now(); if (trial && frames.length < 10000) frames.push(now - previous); previous = now } }} />
}
function read() {
  if (!inspect) return null
  const [journey, music, scene, camera, renderer] = inspect
  const sun = scene.getObjectByName('crimson-sun'), glow = scene.getObjectByName('crimson-glow')
  const meshes = scene.children.filter(object => object.name.startsWith('crimson-chunk-'))
  const extension = renderer.getContext().getExtension('WEBGL_debug_renderer_info')
  return { profile, quality, gain, distance: journey.distance, speed: journey.speed, blocked: journey.blocked,
    sun: journey.sun, pulse: journey.sunPulse, scale: sun?.scale.x, glow: glow?.scale.x, weight: music.weight,
    low: music.low, mid: music.mid, high: music.high, contours: music.contours, haze: music.haze,
    camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z, type: camera.type },
    buffers: meshes.map(object => { const g = (object as import('three').Mesh).geometry; return { id: g.uuid,
      positions: (g.attributes.position as import('three').BufferAttribute).version, normals: (g.attributes.normal as import('three').BufferAttribute).version,
      minY: g.boundingBox?.min.y, maxY: g.boundingBox?.max.y, radius: g.boundingSphere?.radius } }),
    workerCount: workers.size, chunks: meshes.length, meshIds: meshes.map(mesh => mesh.uuid),
    uniforms: meshes.length ? Object.fromEntries(Object.entries((meshes[0] as import('three').Mesh<import('three').BufferGeometry, import('three').ShaderMaterial>).material.uniforms).filter(([, value]) => typeof value.value === 'number').map(([key, value]) => [key, value.value])) : {},
    calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    dpr: renderer.getPixelRatio(), renderer: extension ? renderer.getContext().getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unavailable',
    samples: frames.length }
}
const api = { authored() {
  if (!inspect) return []
  return inspect[2].children.filter(object => object.name.startsWith('crimson-chunk-')).map(object => {
    const mesh = object as import('three').Mesh<import('three').BufferGeometry, import('three').ShaderMaterial>
    const original = createTerrainChunk(Number(object.name.slice('crimson-chunk-'.length)))
    const positions = mesh.geometry.attributes.position.array, normals = mesh.geometry.attributes.normal.array
    return { name: object.name, positions: positions.every((value, i) => value === original.positions[i]),
      normals: normals.every((value, i) => value === original.normals[i]), deforms: mesh.material.vertexShader.includes('deformation') }
  })
}, read, peaks(reset = false) { const result = { peakScale, peakGlow, peakPulse }; if (reset) { peakScale = peakGlow = 1; peakPulse = 0 }; return result }, set(options: { profile?: CrimsonProfile; quality?: GraphicsQuality; gain?: number; energy?: number; moving?: boolean; ticking?: boolean; lowMids?: number | null; highMids?: number | null; fixedLight?: number | null; fixedStreak?: number | null; fixedProgress?: number | null }) {
  if (options.profile !== undefined) profile = options.profile
  if (options.quality !== undefined) quality = options.quality
  if (options.gain !== undefined) gain = options.gain
  if (options.energy !== undefined) energy = options.energy
  if (options.moving !== undefined) moving = options.moving
  if (options.ticking !== undefined) ticking = options.ticking
  if (options.lowMids !== undefined) lowMids = options.lowMids
  if (options.highMids !== undefined) highMids = options.highMids
  if (options.fixedLight !== undefined) fixedLight = options.fixedLight
  if (options.fixedStreak !== undefined) fixedStreak = options.fixedStreak
  if (options.fixedProgress !== undefined) fixedProgress = options.fixedProgress
  change()
}, reset() { if (inspect) { inspect[0].distance = 0; inspect[0].speed = 0 }; session++; events = []; sequence = 0; nextEvent = 0 },
  trial(start: boolean) { trial = start; if (start) { frames = []; previous = performance.now() }; return frames.slice() } }
Object.assign(window, { __mi05: api })
createRoot(document.getElementById('root')!).render(<App />)

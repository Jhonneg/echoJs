import type { SpatialChannel } from './spatial'
import { BRIDGE_SEGMENTS } from './bridge'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog, InstancedBufferAttribute, Mesh, MeshStandardMaterial, PointLight, ShaderMaterial, type Object3D } from 'three'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { NOCTURNE_LIGHT_COLORS, type NocturneLighting, type NocturneLightingMode } from './lighting'
import {
  applyNocturneVisualState, createNocturneVisualState, updateNocturneVisualState,
  type NocturneVisualChannel, type NocturneVisualTargets,
} from './visualState'
import { GLOW_IDLE, glowActivity, hazeLevels, sceneLightLevel } from './effects'
import { rippleField } from './ripples'

type FixtureHaze = { material: ShaderMaterial, color: Color }
type LightingTargets = NocturneVisualTargets & { gate: MeshStandardMaterial, haze: ShaderMaterial, fog: Fog, depth: PointLight,
  fixtureHaze: Record<'magenta' | 'cyan' | 'bridge', FixtureHaze>, hazeMeshes: Object3D[] }
const emitterChannels = [
  ['magenta', 'magentaMain'], ['magentaSecondary', 'magentaSecondary'], ['cyan', 'cyanWindows'], ['cyanDetails', 'cyanDetails'], ['cyanPanel', 'cyanPanel'], ['violet', 'violet'], ['violetSecondary', 'violetSecondary'],
] as const

export function LightingDriver({ musicFeatures, mode, manual, reactivity, reducedMotion }: {
  musicFeatures: MusicFeatureReader, mode: NocturneLightingMode, manual: NocturneLighting, reactivity: number, reducedMotion: boolean,
}) {
  const scene = useThree(state => state.scene)
  const visual = useRef(createNocturneVisualState())
  const palette = useMemo(() => ({
    magenta: new Color(NOCTURNE_LIGHT_COLORS.magenta), cyan: new Color(NOCTURNE_LIGHT_COLORS.cyan), violet: new Color(NOCTURNE_LIGHT_COLORS.violet),
    glow: new Color(), scratch: new Color(), baseline: new Color('#05070b'),
  }), [])
  const targets = useRef<LightingTargets | null>(null)
  useLayoutEffect(() => {
    const lights: { channel: NocturneVisualChannel, light: PointLight, full: number }[] = []
    for (const [group, channel] of emitterChannels) {
      scene.getObjectByName('nocturne-light-spill')?.traverse(object => {
        if (object instanceof PointLight && object.name.startsWith(`${group}-`)) {
          const lightChannel = object.name === 'magenta-bridge-spill' ? 'bridge'
            : object.name === 'cyan-panel-spill' ? 'cyanDetails'
            : object.name === 'violet-far-spill' ? 'violetSecondary' : channel
          lights.push({ channel: lightChannel, light: object, full: object.intensity })
        }
      })
    }
    targets.current = {
      emitters: [
        ...emitterChannels.map(([group, channel]) => {
          const mesh = scene.getObjectByName(`nocturne-${group}`) as Mesh
          const attribute = mesh.geometry.getAttribute('nocturneLevel') as InstancedBufferAttribute | undefined
          return { channel, material: mesh.material as MeshStandardMaterial,
            instances: attribute ? { channel: channel as SpatialChannel, indices: mesh.userData.nocturneSpatialIndices as Uint8Array,
              attribute: attribute as InstancedBufferAttribute & { array: Float32Array } } : undefined }
        }),
        { channel: 'bridge', material: (scene.getObjectByName('nocturne-steel') as Mesh).material as MeshStandardMaterial,
          instances: { channel: 'bridge', scale: .16,
            indices: scene.getObjectByName('nocturne-steel')!.userData.nocturneSpatialIndices as Uint8Array,
            attribute: (scene.getObjectByName('nocturne-steel') as Mesh).geometry.getAttribute('nocturneLevel') as InstancedBufferAttribute & { array: Float32Array } } },
        ...Array.from({ length: BRIDGE_SEGMENTS }, (_, segment) => ({ channel: 'bridge' as const, segment,
          material: (scene.getObjectByName(`nocturne-bridge${segment}`) as Mesh).material as MeshStandardMaterial })),
      ],
      lights,
      depth: scene.getObjectByName('nocturne-depth-spill') as PointLight,
      gate: (scene.getObjectByName('nocturne-gate-light') as Mesh).material as MeshStandardMaterial,
      haze: (scene.getObjectByName('nocturne-gate-haze') as Mesh).material as ShaderMaterial,
      fog: scene.fog as Fog,
      // NT16 fixture haze: each glow follows its own fixture's level.
      fixtureHaze: Object.fromEntries((['magenta', 'cyan', 'bridge'] as const).map(name => {
        const mesh = scene.getObjectByName(`nocturne-haze-${name}`) as Mesh
        return [name, { material: mesh.material as ShaderMaterial, color: mesh.userData.hazeColor as Color }]
      })) as LightingTargets['fixtureHaze'],
      hazeMeshes: [] as Object3D[],
    }
    scene.traverse(object => { if (object.name.startsWith('nocturne-haze-')) targets.current!.hazeMeshes.push(object) })
    return () => { targets.current = null }
  }, [scene])
  useFrame((_, delta) => {
    const bound = targets.current
    if (!bound) return
    const state = visual.current
    updateNocturneVisualState(state, musicFeatures, mode, manual, reactivity, reducedMotion, delta, performance.now() / 1000)
    applyNocturneVisualState(bound, state)
    const { glow, scratch } = palette
    glow.copy(palette.magenta).multiplyScalar(state.atmosphere.magenta)
    glow.add(scratch.copy(palette.cyan).multiplyScalar(state.atmosphere.cyan))
    glow.add(scratch.copy(palette.violet).multiplyScalar(state.atmosphere.violet))
    bound.gate.emissive.copy(glow)
    bound.haze.uniforms.glow.value.copy(glow)
    bound.depth.intensity = 18 * state.environment.depthLight
    bound.fog.near = state.atmosphere.fogNear
    bound.fog.far = state.atmosphere.fogFar
    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)
    glowActivity.level = sceneLightLevel(state)
    rippleField.rings.set(state.ripples.out)
    rippleField.active = state.ripples.active
    // NT16 haze adds nothing while every light is off; skip drawing it then.
    const hazeOn = glowActivity.level >= GLOW_IDLE
    for (const mesh of bound.hazeMeshes) Object.assign(mesh, { visible: hazeOn })
    const haze = hazeLevels(state)
    for (const name of ['magenta', 'cyan', 'bridge'] as const) {
      const target = bound.fixtureHaze[name]
      target.material.uniforms.glow.value.copy(target.color).multiplyScalar(haze[name])
    }
  }, -1) // Update before the main camera/render and its planar reflection pass.
  return null
}

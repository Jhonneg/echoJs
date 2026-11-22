import { BRIDGE_SEGMENTS } from './bridge'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog, Mesh, MeshStandardMaterial, PointLight, ShaderMaterial } from 'three'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import { NOCTURNE_LIGHT_COLORS, type NocturneLighting, type NocturneLightingMode } from './lighting'
import {
  applyNocturneVisualState, createNocturneVisualState, updateNocturneVisualState,
  type NocturneVisualChannel, type NocturneVisualTargets,
} from './visualState'

type LightingTargets = NocturneVisualTargets & { gate: MeshStandardMaterial, haze: ShaderMaterial, fog: Fog }
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
        ...emitterChannels.map(([group, channel]) => ({ channel, material: (scene.getObjectByName(`nocturne-${group}`) as Mesh).material as MeshStandardMaterial })),
        ...Array.from({ length: BRIDGE_SEGMENTS }, (_, segment) => ({ channel: 'bridge' as const, segment,
          material: (scene.getObjectByName(`nocturne-bridge${segment}`) as Mesh).material as MeshStandardMaterial })),
      ],
      lights,
      gate: (scene.getObjectByName('nocturne-gate-light') as Mesh).material as MeshStandardMaterial,
      haze: (scene.getObjectByName('nocturne-gate-haze') as Mesh).material as ShaderMaterial,
      fog: scene.fog as Fog,
    }
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
    bound.fog.near = state.atmosphere.fogNear
    bound.fog.far = state.atmosphere.fogFar
    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)
  }, -1) // Update before the main camera/render and its planar reflection pass.
  return null
}

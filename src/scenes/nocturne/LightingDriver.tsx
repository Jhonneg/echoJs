import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog, Mesh, MeshStandardMaterial, PointLight, ShaderMaterial } from 'three'
import type { AudioSignal } from '../../audio/signal'
import { NOCTURNE_LIGHT_COLORS, type NocturneLighting, type NocturneLightingMode } from './lighting'
import { createNocturneResponse, updateNocturneResponse, type NocturneResponse } from './reactivity'

type LightingTargets = {
  emitters: { group: keyof NocturneLighting, material: MeshStandardMaterial }[],
  lights: { group: keyof NocturneLighting, light: PointLight, full: number }[],
  gate: MeshStandardMaterial, haze: ShaderMaterial, fog: Fog,
}
function applyLevels(targets: LightingTargets, response: NocturneResponse) {
  for (const { group, material } of targets.emitters) material.emissiveIntensity = response[group] * 1.3
  for (const { group, light, full } of targets.lights) light.intensity = response[group] * full
}

export function LightingDriver({ signal, mode, manual, reactivity, reducedMotion }: {
  signal: AudioSignal, mode: NocturneLightingMode, manual: NocturneLighting, reactivity: number, reducedMotion: boolean,
}) {
  const scene = useThree(state => state.scene)
  const response = useRef(createNocturneResponse())
  const palette = useMemo(() => ({
    magenta: new Color(NOCTURNE_LIGHT_COLORS.magenta), cyan: new Color(NOCTURNE_LIGHT_COLORS.cyan), violet: new Color(NOCTURNE_LIGHT_COLORS.violet),
    glow: new Color(), scratch: new Color(), baseline: new Color('#05070b'),
  }), [])
  const targets = useRef<LightingTargets | null>(null)
  useLayoutEffect(() => {
    const groups = ['magenta', 'cyan', 'violet'] as const
    const lights: { group: keyof NocturneLighting, light: PointLight, full: number }[] = []
    for (const group of groups) {
      scene.getObjectByName('nocturne-light-spill')?.traverse(object => {
        if (object instanceof PointLight && object.name.startsWith(group)) lights.push({ group, light: object, full: object.intensity })
      })
    }
    targets.current = {
      emitters: groups.map(group => ({ group, material: (scene.getObjectByName(`nocturne-${group}`) as Mesh).material as MeshStandardMaterial })),
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
    const state = response.current
    updateNocturneResponse(state, signal, mode, manual, reactivity, reducedMotion, delta, performance.now())
    applyLevels(bound, state)
    const { glow, scratch } = palette
    const magenta = mode === 'manual' ? state.magenta : state.atmosphere
    const cyan = mode === 'manual' ? state.cyan : state.atmosphere
    const violet = mode === 'manual' ? state.violet : state.atmosphere
    glow.copy(palette.magenta).multiplyScalar(magenta * 0.24)
    glow.add(scratch.copy(palette.cyan).multiplyScalar(cyan * 0.85))
    glow.add(scratch.copy(palette.violet).multiplyScalar(violet * 0.16))
    bound.gate.emissive.copy(glow)
    bound.haze.uniforms.glow.value.copy(glow)
    bound.fog.color.copy(glow).multiplyScalar(0.018).add(palette.baseline)
  }, -1) // Update before the main camera/render and its planar reflection pass.
  return null
}

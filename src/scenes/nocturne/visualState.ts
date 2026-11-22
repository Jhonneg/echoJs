import type { MusicFeatureReader } from '../../audio/musicFeatures.ts'
import { clampSignal } from '../../audio/signal.ts'
import type { NocturneLighting, NocturneLightingMode } from './lighting.ts'
import { createNocturneResponse, updateNocturneResponse } from './reactivity.ts'
import { createCyanPanelResponse, updateCyanPanelResponse } from './cyanPanel.ts'
import { createMagentaResponse, updateMagentaResponse } from './magenta.ts'
import { createAtmosphereResponse, updateAtmosphereResponse } from './atmosphereResponse.ts'
import { createVioletResponse, updateVioletResponse } from './violet.ts'
import { createBridgeResponse, updateBridgeResponse } from './bridge.ts'
import { createMidrangeResponse, updateMidrangeResponse } from './midrange.ts'

export const NOCTURNE_VISUAL_CHANNELS = [
  'magentaMain', 'magentaSecondary', 'cyanWindows', 'cyanDetails', 'cyanPanel', 'violet', 'violetSecondary', 'bridge',
] as const
export type NocturneVisualChannel = typeof NOCTURNE_VISUAL_CHANNELS[number]
export type NocturneVisualEnvelope = { sustainTarget: number, accent: number, level: number }
export type NocturneVisualState = {
  context: ReturnType<typeof createAtmosphereResponse>,
  broad: ReturnType<typeof createNocturneResponse>,
  panel: ReturnType<typeof createCyanPanelResponse>,
  magenta: ReturnType<typeof createMagentaResponse>,
  violet: ReturnType<typeof createVioletResponse>,
  bridge: ReturnType<typeof createBridgeResponse>,
  midrange: ReturnType<typeof createMidrangeResponse>,
  channels: Record<NocturneVisualChannel, NocturneVisualEnvelope>,
  // Derived source-light levels. The existing planar reflection renders the real fixtures.
  reflections: Record<NocturneVisualChannel, number>,
  atmosphere: { level: number, magenta: number, cyan: number, violet: number, fogNear: number, fogFar: number },
}
export function createNocturneVisualState(): NocturneVisualState {
  return {
    context: createAtmosphereResponse(), broad: createNocturneResponse(), panel: createCyanPanelResponse(), magenta: createMagentaResponse(), midrange: createMidrangeResponse(), bridge: createBridgeResponse(), violet: createVioletResponse(),
    channels: Object.fromEntries(NOCTURNE_VISUAL_CHANNELS.map(name => [name, { sustainTarget: 0, accent: 0, level: 0 }])) as NocturneVisualState['channels'],
    reflections: Object.fromEntries(NOCTURNE_VISUAL_CHANNELS.map(name => [name, 0])) as NocturneVisualState['reflections'],
    atmosphere: { level: 0, magenta: 0, cyan: 0, violet: 0, fogNear: 17, fogFar: 74 },
  }
}

const violetChannels = ['violet', 'violetSecondary'] as const
export function updateNocturneVisualState(state: NocturneVisualState, reader: MusicFeatureReader,
  mode: NocturneLightingMode, manual: NocturneLighting, reactivity: number, reducedMotion: boolean,
  deltaSeconds: number, nowSeconds: number) {
  // Borrow for this update only. Controllers retain copied scalar history, never the view.
  const view = reader.read()
  updateNocturneResponse(state.broad, view, mode, manual, reactivity, reducedMotion, deltaSeconds, nowSeconds)
  updateCyanPanelResponse(state.panel, view, deltaSeconds, nowSeconds, mode === 'manual' ? 0 : reactivity, reducedMotion)
  updateVioletResponse(state.violet, view, deltaSeconds, nowSeconds, reactivity, reducedMotion, mode === 'manual')
  for (let i = 0; i < violetChannels.length; i++) {
    const output = state.channels[violetChannels[i]]
    output.sustainTarget = state.violet.target
    output.accent = state.violet.accents[i]
    output.level = mode === 'manual' ? clampSignal(manual.violet) : state.violet.levels[i]
  }
  updateMagentaResponse(state.magenta, view, deltaSeconds, nowSeconds, reactivity, reducedMotion, mode === 'manual')
  const main = state.channels.magentaMain, secondary = state.channels.magentaSecondary
  main.sustainTarget = state.magenta.mainTarget
  main.accent = state.magenta.mainAccent
  main.level = mode === 'manual' ? clampSignal(manual.magenta) : clampSignal(state.magenta.mainBody + main.accent)
  secondary.sustainTarget = state.magenta.secondaryTarget
  secondary.accent = 0
  secondary.level = mode === 'manual' ? clampSignal(manual.magenta) : state.magenta.secondaryBody
  updateMidrangeResponse(state.midrange, view, deltaSeconds, nowSeconds, reactivity, reducedMotion, mode === 'manual')
  const windows = state.channels.cyanWindows, details = state.channels.cyanDetails
  windows.sustainTarget = state.midrange.windowTarget
  windows.accent = 0
  windows.level = mode === 'manual' ? clampSignal(manual.cyan) : state.midrange.windowBody
  details.sustainTarget = state.midrange.detailTarget
  details.accent = state.midrange.detailAccent
  details.level = mode === 'manual' ? clampSignal(manual.cyan) : clampSignal(state.midrange.detailBody + details.accent)
  updateBridgeResponse(state.bridge, view, nowSeconds, reactivity, reducedMotion, mode === 'manual')
  const bridge = state.channels.bridge
  bridge.sustainTarget = 0
  bridge.accent = state.bridge.level
  bridge.level = mode === 'manual' ? clampSignal(manual.magenta) : state.bridge.level
  if (mode === 'manual') state.bridge.levels.fill(bridge.level)
  const panel = state.channels.cyanPanel
  panel.sustainTarget = state.panel.sustainTarget
  panel.accent = state.panel.accent
  panel.level = mode === 'manual' ? clampSignal(manual.cyanPanel) : state.panel.level
  for (const name of NOCTURNE_VISUAL_CHANNELS) state.reflections[name] = state.channels[name].level
  const atmosphere = state.atmosphere, manualMode = mode === 'manual'
  updateAtmosphereResponse(state.context, view, deltaSeconds, nowSeconds, reactivity, reducedMotion, manualMode)
  const { level, density, tint } = state.context
  atmosphere.level = level
  atmosphere.magenta = manualMode ? state.broad.magenta * .24 : level * (.24 - .04 * tint)
  atmosphere.cyan = manualMode ? state.broad.cyan * .85 : level * (.85 + .03 * tint)
  atmosphere.violet = manualMode ? state.broad.violet * .16 : level * (.16 + .04 * tint)
  atmosphere.fogNear = 17
  atmosphere.fogFar = 74 - 8 * density
  return state
}

// This adapter writes final values only; it has no audio or browser-capture dependencies.
export type NocturneVisualTargets = {
  emitters: readonly { channel: NocturneVisualChannel, segment?: number, material: { emissiveIntensity: number } }[],
  lights: readonly { channel: NocturneVisualChannel, light: { intensity: number }, full: number }[],
}
export function applyNocturneVisualState(targets: NocturneVisualTargets, state: NocturneVisualState) {
  for (const { channel, segment, material } of targets.emitters) material.emissiveIntensity = (segment === undefined ? state.channels[channel].level : state.bridge.levels[segment]) * 1.3
  for (const { channel, light, full } of targets.lights) light.intensity = state.channels[channel].level * full
}

import { createSpatialResponse, updateSpatialResponse, SPATIAL_COUNTS, SPATIAL_CHANNELS, type SpatialChannel } from './spatial.ts'
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
import { createRippleState, updateRipples } from './ripples.ts'

export const NOCTURNE_VISUAL_CHANNELS = [
  'magentaMain', 'magentaSecondary', 'cyanWindows', 'cyanDetails', 'cyanPanel', 'violet', 'violetSecondary', 'bridge',
] as const
export type NocturneVisualChannel = typeof NOCTURNE_VISUAL_CHANNELS[number]
export type NocturneVisualEnvelope = { sustainTarget: number, accent: number, level: number }
export type NocturneVisualState = {
  environment: { depthLight: number },
  spatial: ReturnType<typeof createSpatialResponse>,
  instances: Record<SpatialChannel, Float64Array>,
  context: ReturnType<typeof createAtmosphereResponse>,
  broad: ReturnType<typeof createNocturneResponse>,
  panel: ReturnType<typeof createCyanPanelResponse>,
  magenta: ReturnType<typeof createMagentaResponse>,
  violet: ReturnType<typeof createVioletResponse>,
  bridge: ReturnType<typeof createBridgeResponse>,
  midrange: ReturnType<typeof createMidrangeResponse>,
  // NT20: puddle rings started by accepted bass hits.
  ripples: ReturnType<typeof createRippleState>,
  channels: Record<NocturneVisualChannel, NocturneVisualEnvelope>,
  // Derived source-light levels. The existing planar reflection renders the real fixtures.
  reflections: Record<NocturneVisualChannel, number>,
  // Final normalized point-light delivery, distinct from emitter/reflection-source levels.
  spill: Record<NocturneVisualChannel, number>,
  atmosphere: { level: number, magenta: number, cyan: number, violet: number, fogNear: number, fogFar: number },
}
export function createNocturneVisualState(): NocturneVisualState {
  return {
    environment: { depthLight: 0 },
    spatial: createSpatialResponse(),
    instances: { magentaSecondary: new Float64Array(5), cyanWindows: new Float64Array(5), cyanDetails: new Float64Array(6) },
    context: createAtmosphereResponse(), broad: createNocturneResponse(), panel: createCyanPanelResponse(), magenta: createMagentaResponse(), midrange: createMidrangeResponse(), ripples: createRippleState(), bridge: createBridgeResponse(), violet: createVioletResponse(),
    channels: Object.fromEntries(NOCTURNE_VISUAL_CHANNELS.map(name => [name, { sustainTarget: 0, accent: 0, level: 0 }])) as NocturneVisualState['channels'],
    reflections: Object.fromEntries(NOCTURNE_VISUAL_CHANNELS.map(name => [name, 0])) as NocturneVisualState['reflections'],
    spill: Object.fromEntries(NOCTURNE_VISUAL_CHANNELS.map(name => [name, 0])) as NocturneVisualState['spill'],
    atmosphere: { level: 0, magenta: 0, cyan: 0, violet: 0, fogNear: 17, fogFar: 74 },
  }
}

// Scene-local display calibration: lift modest signals without a floor or hard knee.
// Zero stays off; full output stays full; controllers retain their original timing.
export function calibrateNocturneLevel(level: number) {
  const x = clampSignal(level)
  return 2 * x / (1 + x)
}

const audioSpillGains: Partial<Record<NocturneVisualChannel, number>> = { magentaMain: 1.5, cyanWindows: 2, cyanDetails: 2 }
// NT18 (owner-approved change to the NT13 balance): in Audio the cyan window grids glow brighter,
// capped just below where the untonemapped cyan clips (1.3 x level x blue > 1), so near panes keep
// their shading and grid. A level already above the cap is left as it was. Only their own emission
// rises: their spill, timing and response are unchanged.
export const CYAN_WINDOW_EMISSION_GAIN = 2
export const CYAN_WINDOW_EMISSION_CAP = .7
// NT18: the gate keeps a faint, constant glow in every mode, so the resting view has a lit
// focal point. The music raises it exactly as before; the colour is the gate's usual cool mix.
export const GATE_FLOOR = .08
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
  // NT20: the magenta response's accepted bass hits also start puddle ripples.
  updateRipples(state.ripples, state.magenta.emittedAt, state.magenta.peak, reactivity, nowSeconds,
    mode !== 'manual' && !reducedMotion && clampSignal(reactivity) > 0)
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
  updateSpatialResponse(state.spatial, view, state.midrange, state.panel, nowSeconds, reactivity, reducedMotion, mode === 'manual')
  for (const name of SPATIAL_CHANNELS) {
    const output = state.channels[name], values = state.instances[name], accents = state.spatial.groups[name].accents
    const body = name === 'magentaSecondary' ? state.magenta.secondaryBody : name === 'cyanWindows' ? state.midrange.windowBody : state.midrange.detailBody
    let total = 0, accentTotal = 0
    for (let i = 0; i < SPATIAL_COUNTS[name]; i++) {
      const level = mode === 'manual' ? output.level : calibrateNocturneLevel(body + accents[i])
      values[i] = mode !== 'manual' && name === 'cyanWindows' ? Math.max(level, Math.min(CYAN_WINDOW_EMISSION_CAP, level * CYAN_WINDOW_EMISSION_GAIN)) : level
      total += level; accentTotal += accents[i]
    }
    if (mode !== 'manual') output.level = total / values.length
    output.accent = accentTotal / values.length
  }
  if (mode !== 'manual') {
    for (const name of NOCTURNE_VISUAL_CHANNELS) {
      if (name !== 'bridge' && !SPATIAL_CHANNELS.includes(name as SpatialChannel)) state.channels[name].level = calibrateNocturneLevel(state.channels[name].level)
    }
    // Calibrate the actual section sources, then derive their shared spill mean.
    for (let i = 0; i < state.bridge.levels.length; i++) state.bridge.levels[i] = calibrateNocturneLevel(state.bridge.levels[i])
    bridge.level = state.bridge.levels.reduce((sum, value) => sum + value, 0) / state.bridge.levels.length
  }
  for (const name of NOCTURNE_VISUAL_CHANNELS) {
    const final = state.channels[name].level
    state.reflections[name] = final
    state.spill[name] = clampSignal(final * (mode === 'manual' ? 1 : audioSpillGains[name] ?? 1))
  }
  const atmosphere = state.atmosphere, manualMode = mode === 'manual'
  updateAtmosphereResponse(state.context, view, deltaSeconds, nowSeconds, reactivity, reducedMotion, manualMode)
  const { level, density, tint } = state.context
  atmosphere.level = Math.max(level, GATE_FLOOR)
  atmosphere.magenta = Math.max(GATE_FLOOR * .24, manualMode ? state.broad.magenta * .24 : level * (.24 - .04 * tint))
  atmosphere.cyan = Math.max(GATE_FLOOR * .85, manualMode ? state.broad.cyan * .85 : level * (.85 + .03 * tint))
  atmosphere.violet = Math.max(GATE_FLOOR * .16, manualMode ? state.broad.violet * .16 : level * (.16 + .04 * tint))
  atmosphere.fogNear = 17
  atmosphere.fogFar = 74 - 8 * density
  state.environment.depthLight = manualMode ? .65 * Math.max(clampSignal(manual.magenta), clampSignal(manual.cyan), clampSignal(manual.violet)) : level
  return state
}

// This adapter writes final values only; it has no audio or browser-capture dependencies.
export type NocturneVisualTargets = {
  emitters: readonly { channel: NocturneVisualChannel, segment?: number, instances?: { channel: SpatialChannel | 'bridge', scale?: number, indices: Uint8Array, attribute: { array: Float32Array, needsUpdate: boolean } }, material: { emissiveIntensity: number } }[],
  lights: readonly { channel: NocturneVisualChannel, light: { intensity: number }, full: number }[],
}
export function applyNocturneVisualState(targets: NocturneVisualTargets, state: NocturneVisualState) {
  for (const { channel, segment, material, instances } of targets.emitters) {
    material.emissiveIntensity = instances ? 1.3 : (segment === undefined ? state.channels[channel].level : state.bridge.levels[segment]) * 1.3
    if (instances) {
      const levels = instances.channel === 'bridge' ? state.bridge.levels : state.instances[instances.channel]
      for (let i = 0; i < instances.indices.length; i++) {
        const index = instances.indices[i]
        instances.attribute.array[i] = index === 255 ? 0 : levels[index] * (instances.scale ?? 1)
      }
      instances.attribute.needsUpdate = true
    }
  }
  for (const { channel, light, full } of targets.lights) light.intensity = state.spill[channel] * full
}

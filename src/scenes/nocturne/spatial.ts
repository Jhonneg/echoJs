import { clampSignal } from '../../audio/signal.ts'
import { musicFeaturesFresh, type MusicFeaturesV1, type OnsetEvent } from '../../audio/musicFeatures.ts'

export const SPATIAL_COUNTS = { magentaSecondary: 5, cyanWindows: 5, cyanDetails: 6 } as const
export type SpatialChannel = keyof typeof SPATIAL_COUNTS
export const SPATIAL_CHANNELS = Object.keys(SPATIAL_COUNTS) as SpatialChannel[]
type History = { count: number, cursor: number, times: Float64Array, rises: Float32Array }
const settings = {
  magentaSecondary: { step: .18, tail: .3, peak: .16 },
  cyanWindows: { step: .14, tail: .28, peak: .2 },
  cyanDetails: { step: .12, tail: .24, peak: .14 },
} as const
export function createSpatialResponse() {
  return { session: -1, sequence: 0, groups: {
    magentaSecondary: createGroup(5), cyanWindows: createGroup(5), cyanDetails: createGroup(6),
  } }
}
function createGroup(count: number) {
  return { startedAt: -Infinity, nextAt: -Infinity, peak: 0, first: 0, accents: new Float64Array(count) }
}
export type SpatialResponse = ReturnType<typeof createSpatialResponse>
function riseAt(history: History, event: OnsetEvent) {
  let rise = 0
  for (let i = 0; i < history.count; i++) {
    const index = (history.cursor - 1 - i + history.times.length) % history.times.length
    if (Math.abs(history.times[index] - event.timeSeconds) <= .09) rise = Math.max(rise, history.rises[index])
  }
  return rise
}
export function spatialPulse(age: number, tail: number) {
  if (!Number.isFinite(age) || age <= 0 || age >= tail) return 0
  if (age < .025) { const t = age / .025; return t * t * (3 - 2 * t) }
  if (age < .07) return 1
  const t = (age - .07) / (tail - .07)
  return (1 - t) * (1 - t)
}
// One finite sequence per role; no queues/restarts, and no retained feature view.
export function updateSpatialResponse(state: SpatialResponse, view: MusicFeaturesV1,
  lowMids: History, highMids: History, now: number, gain: number, reduced: boolean, manual: boolean) {
  const reset = state.session !== view.session
  const enabled = musicFeaturesFresh(view, now) && gain > 0 && !reduced && !manual
  if (reset || !enabled) {
    state.session = view.session; state.sequence = view.sequence
    for (const name of SPATIAL_CHANNELS) {
      const group = state.groups[name]
      group.startedAt = group.nextAt = -Infinity; group.peak = 0; group.accents.fill(0)
    }
    return
  }
  for (const event of view.events) {
    if (event.session !== view.session || event.sequence <= state.sequence) continue
    state.sequence = event.sequence
    const age = now - event.emittedAtSeconds
    if (!Number.isFinite(age) || age < 0 || age > .25 || !Number.isFinite(event.strength) || event.strength < .04) continue
    const lowRise = event.band === 'mid' ? riseAt(lowMids, event) : 0
    const highRise = event.band === 'mid' ? riseAt(highMids, event) : 0
    for (const name of SPATIAL_CHANNELS) {
      const isBass = name === 'magentaSecondary', rise = Math.max(lowRise, highRise)
      if (isBass ? event.band !== 'low' : event.band !== 'mid' || rise < .02) continue
      const group = state.groups[name], config = settings[name]
      if (now < group.nextAt) continue
      // High-mid detail echoes begin beyond the approved left panel (z=-7.3),
      // while low-mid attacks start at the nearest architectural panel.
      group.first = name === 'cyanDetails' && highRise >= .02 && lowRise < .02 ? 1 : 0
      group.startedAt = now + (isBass ? .1 : name === 'cyanDetails' ? .1 : 0)
      group.nextAt = group.startedAt + (group.accents.length - 1) * config.step + config.tail + .12
      group.peak = config.peak * clampSignal(event.strength / .15) * (isBass ? 1 : clampSignal(rise / .1))
    }
  }
  state.sequence = Math.max(state.sequence, view.sequence)
  for (const name of SPATIAL_CHANNELS) {
    const group = state.groups[name], config = settings[name]
    for (let i = 0; i < group.accents.length; i++) {
      group.accents[i] = i < group.first ? 0 : group.peak * clampSignal(gain) * spatialPulse(now - group.startedAt - (i - group.first) * config.step, config.tail)
    }
    if (now - group.startedAt >= (group.accents.length - 1) * config.step + config.tail) group.peak = 0
  }
}

import { clampSignal } from '../../audio/signal.ts'
import type { LavenderResponse } from './response.ts'
import type { createLayerMotion } from './motion.ts'
import { TERRAIN_PERIOD } from './motion.ts'

// Far to near, matching RIDGE_BANDS. Positions are world x at emission.
export const TRACE_ROLES = [
  { direction: -1, start: 2.6, duration: .85, distance: 5.2, delay: .18, tail: .75 },
  { direction: 1, start: -2.6, duration: .95, distance: 5, delay: .18, tail: .85 },
  { direction: 1, start: -1.5, duration: 1.15, distance: 5.6, delay: .10, tail: 1.05 },
  { direction: -1, start: 2.8, duration: 1.25, distance: 5.6, delay: .10, tail: 1.10 },
  { direction: 1, start: -1.2, duration: 1.40, distance: 4, delay: 0, tail: 1.25 },
  { direction: -1, start: 3.6, duration: 1.50, distance: 4.5, delay: 0, tail: 1.35 },
] as const
const GROUPS = [[4, 5], [3, 2], [1, 0]] as const
export const wrapTrace = (x: number) => ((x + 12) % TERRAIN_PERIOD + TERRAIN_PERIOD) % TERRAIN_PERIOD - 12
const ease = (x: number) => { const t = clampSignal(x); return t * t * (3 - 2 * t) }
export function createTraces() {
  return { session: -1, nextStart: 0, seen: new Float64Array(6),
    slots: Array.from({ length: 3 }, () => ({ active: false, ridge: -1, sequence: 0,
      startsAt: 0, startLocal: 0, strength: 0, direction: 1, duration: 1, distance: 0, tail: 1, head: 0, opacity: 0 })) }
}
export type Traces = ReturnType<typeof createTraces>

export function updateTraces(state: Traces, response: LavenderResponse,
  motion: readonly ReturnType<typeof createLayerMotion>[], nowSeconds: number, reactivity: number, reducedMotion: boolean) {
  const enabled = response.fresh && clampSignal(reactivity) > 0 && !reducedMotion && Number.isFinite(nowSeconds) && nowSeconds >= 0
  if (state.session !== response.session || !enabled) {
    state.session = response.session; state.nextStart = Number.isFinite(nowSeconds) ? nowSeconds : 0
    for (let i = 0; i < 6; i++) state.seen[i] = response.ridges[i].onsetSequence
    for (const slot of state.slots) { slot.active = false; slot.opacity = 0 }
    return state
  }
  for (const slot of state.slots) if (slot.active && nowSeconds >= slot.startsAt + slot.duration) {
    slot.active = false; slot.opacity = 0
  }
  for (const group of GROUPS) {
    let recipient = -1
    for (const index of group) {
      const notice = response.ridges[index], unseen = notice.onsetSequence > 0 && notice.onsetSequence !== state.seen[index]
      state.seen[index] = notice.onsetSequence
      const age = nowSeconds - notice.onsetTimeSeconds
      if (!unseen || !Number.isFinite(age) || age < 0 || age > .25 || clampSignal(notice.onsetStrength) === 0) continue
      if (recipient < 0 || notice.onsetSequence > response.ridges[recipient].onsetSequence ||
        (notice.onsetSequence === response.ridges[recipient].onsetSequence && notice.onsetStrength > response.ridges[recipient].onsetStrength)) recipient = index
    }
    if (recipient < 0 || state.slots.some(slot => slot.active && slot.ridge === recipient)) continue
    const slot = state.slots.find(candidate => !candidate.active)
    if (!slot) continue
    const notice = response.ridges[recipient], role = TRACE_ROLES[recipient]
    slot.active = true; slot.ridge = recipient; slot.sequence = notice.onsetSequence
    slot.startsAt = Math.max(nowSeconds, notice.onsetTimeSeconds + role.delay, state.nextStart)
    state.nextStart = slot.startsAt + .12
    slot.startLocal = role.start - motion[recipient].offset
    slot.strength = clampSignal(notice.onsetStrength)
    slot.direction = role.direction; slot.duration = role.duration; slot.distance = role.distance; slot.tail = role.tail
  }
  for (const slot of state.slots) {
    if (!slot.active) continue
    const age = nowSeconds - slot.startsAt, progress = clampSignal(age / slot.duration)
    slot.head = wrapTrace(slot.startLocal + slot.direction * slot.distance * progress)
    slot.opacity = .45 * clampSignal(slot.strength * 2.5) * ease(age / .07) * ease((slot.duration - age) / .22)
  }
  return state
}

export const traceFragment = `
uniform float traceHead;
uniform float traceOpacity;
uniform float traceDirection;
uniform float traceTail;
vec3 illuminateTrace(vec3 color, vec2 localPosition) {
  float width = max(0.035, fwidth(localPosition.y) * 0.8);
  if (traceOpacity <= 0.0) return color;
  float along = mod((localPosition.x - traceHead) * traceDirection + 12.0, 24.0) - 12.0;
  if (along < -traceTail || along > 0.35) return color;
  float belowEdge = max(0.0, profileHeight(localPosition.x, ridgeIndex) - localPosition.y);
  float edge = exp(-pow(belowEdge / width, 2.0));
  float head = exp(-pow(along / 0.13, 2.0));
  float tail = exp(min(0.0, along) / (traceTail * 0.4))
    * smoothstep(-traceTail, -traceTail + 0.2, along) * (1.0 - smoothstep(0.0, 0.12, along));
  float alpha = traceOpacity * max(head, tail * 0.5) * edge;
  return mix(color, vec3(1.0, 0.90, 0.84), min(0.45, alpha));
}
`

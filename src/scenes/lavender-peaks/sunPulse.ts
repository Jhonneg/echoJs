import { clampSignal, smooth } from '../../audio/signal.ts'
import type { LavenderResponse } from './response.ts'

export const createSunPulse = () => ({ session: -1, value: 0 })

// Restore the original 20% body / 80% attack blend and 40ms / 220ms timing,
// using already gain-scaled MI ridge targets and qualified low-band attacks.
export function updateSunPulse(state: ReturnType<typeof createSunPulse>, response: LavenderResponse,
  delta: number, reactivity: number, reducedMotion: boolean) {
  if (state.session !== response.session) {
    state.session = response.session
    state.value = 0
  }
  if (reducedMotion || clampSignal(reactivity) === 0) return state.value = 0
  const low = response.ridges[4], sub = response.ridges[5]
  const target = response.fresh
    ? clampSignal(.2 * Math.max(low.target, sub.target) + .8 * Math.max(low.accent, sub.accent)) : 0
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  state.value = smooth(state.value, target, dt, .04, .22)
  if (target === 0 && state.value < .0001) state.value = 0
  return state.value
}

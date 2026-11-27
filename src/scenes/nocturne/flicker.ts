// NT22: a rare, soft failing-neon stutter on one minor strip (the far-left violet strip, owner's
// choice). Pure state (testable without three.js). It starts only on a treble hit the violet
// response has already accepted (violet.ts: fresh high onsets, gated by Reactivity, Manual and
// reduced motion), so it adds no new music mapping. Never a strobe: three soft dips over about
// a third of a second, never below 20% brightness, at least 10 s apart.

export const FLICKER = {
  cooldown: 10, // seconds from one stutter's start to the next
  // The violet accent's peak (0–0.32) must be at least a quarter strength. The generated test
  // song's clear hi-hats peak at 0.04–0.12, so half strength never fired; the cooldown keeps it rare.
  minPeak: 0.08,
  // Each dip: start (seconds into the stutter) and depth (fraction of brightness removed).
  dips: [{ at: 0, depth: 0.8 }, { at: 0.13, depth: 0.5 }, { at: 0.26, depth: 0.75 }] as const,
  dipLength: 0.09, // seconds; each dip eases down and back up
} as const
export const FLICKER_DURATION = FLICKER.dips[FLICKER.dips.length - 1].at + FLICKER.dipLength

// Brightness factor (0.2–1) at a given time into the stutter; exactly 1 outside it.
export function flickerFactor(age: number) {
  if (!Number.isFinite(age) || age < 0 || age >= FLICKER_DURATION) return 1
  let dip = 0
  for (const d of FLICKER.dips) {
    const x = (age - d.at) / FLICKER.dipLength
    if (x > 0 && x < 1) dip = Math.max(dip, d.depth * Math.sin(Math.PI * x) ** 2)
  }
  return 1 - dip
}

export function createFlickerState() {
  return { lastAccepted: -Infinity, startedAt: -Infinity, factor: 1 }
}
export type FlickerState = ReturnType<typeof createFlickerState>

// `acceptedAt` / `peak`: the violet response's last accepted treble hit (startedAt) and its peak.
// With `enabled` false (Manual, reduced motion, Reactivity 0) any stutter stops at once.
export function updateFlicker(state: FlickerState, acceptedAt: number, peak: number, nowSeconds: number, enabled: boolean) {
  if (!enabled) {
    state.lastAccepted = acceptedAt
    state.startedAt = -Infinity
  } else if (Number.isFinite(acceptedAt) && acceptedAt !== state.lastAccepted) {
    state.lastAccepted = acceptedAt
    const rested = !Number.isFinite(state.startedAt) || nowSeconds - state.startedAt >= FLICKER.cooldown
    if (rested && Number.isFinite(peak) && peak >= FLICKER.minPeak) state.startedAt = nowSeconds
  }
  state.factor = flickerFactor(nowSeconds - state.startedAt)
}

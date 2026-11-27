// NT20: puddle ripples on bass hits. Pure state (testable without three.js). A ripple starts only
// on a bass hit that the main magenta response has already accepted (magenta.ts: fresh low
// onsets, gated by Reactivity, Manual and reduced motion), so it adds no new music mapping and
// lands in time with the magenta pulse. Each hit spawns a few rings at floor spots in a fixed
// rotation; WetGround bends the reflection around each ring (only where the floor is wet).

export const RIPPLE = {
  slots: 6, // most rings at once; a new ring replaces the oldest
  life: 1.2, // seconds
  maxRadius: 1, // metres reached at the end of its life
  // Floor spots (x, z) on the reflections of the four nearest wall fixtures, so a ring has light
  // to bend. Those reflections lie near x = ±1, 4–17 m ahead of the camera (at z = 5); farther
  // floor is seen too flat (about 5 degrees) for a ring to read. One spot sits on the gate's.
  spots: [[-1, -1], [1, -3], [-0.95, -3.5], [1.05, -6], [-1.05, -6.5], [1, -9.5], [-0.95, -10], [0, -12]] as const,
  // Rings per hit: 2, or 3 for a strong hit; each starts a little after the one before.
  stagger: 0.09,
  strongHit: 0.6,
  // Weaker hits (a bass line's small onsets) start no rings, so they can't push a kick's rings
  // out of the pool with near-invisible ones.
  minHit: 0.35,
  maxPeak: 0.42, // the magenta accent's full-strength peak (magenta.ts)
} as const

export function createRippleState() {
  return { lastHit: -Infinity, cursor: 0, slot: 0,
    // Per slot: x, z, start time (seconds), strength 0–1.
    rings: new Float64Array(RIPPLE.slots * 4).fill(0).map((_, i) => (i % 4 === 2 ? -Infinity : 0)),
    // Shader output per slot: x, z, current radius, current amplitude (0 when idle).
    out: new Float32Array(RIPPLE.slots * 4), active: false }
}
export type RippleState = ReturnType<typeof createRippleState>

// A ring's radius and amplitude at a given age: it eases outward and fades with a squared falloff.
export function rippleRing(age: number, strength: number) {
  if (!Number.isFinite(age) || age < 0 || age >= RIPPLE.life || !(strength > 0)) return { radius: 0, amplitude: 0 }
  const t = age / RIPPLE.life
  return { radius: RIPPLE.maxRadius * (1 - (1 - t) * (1 - t)), amplitude: Math.min(1, strength) * (1 - t) * (1 - t) }
}

// `hitAt` / `peak`: the magenta response's last accepted bass hit (emittedAt) and its peak.
// `gain`: Reactivity. With `enabled` false (Manual, reduced motion, Reactivity 0) every ring clears.
export function updateRipples(state: RippleState, hitAt: number, peak: number, gain: number, nowSeconds: number, enabled: boolean) {
  if (!enabled) {
    for (let i = 0; i < RIPPLE.slots; i++) state.rings[i * 4 + 3] = 0
    state.lastHit = hitAt
  } else if (Number.isFinite(hitAt) && hitAt !== state.lastHit) {
    state.lastHit = hitAt
    const strength = Math.max(0, Math.min(1, (Number.isFinite(peak) ? peak : 0) / RIPPLE.maxPeak)) * Math.max(0, Math.min(1, gain))
    const count = strength >= RIPPLE.strongHit ? 3 : 2
    for (let k = 0; k < count && strength >= RIPPLE.minHit; k++) {
      const [x, z] = RIPPLE.spots[state.cursor]
      state.cursor = (state.cursor + 1) % RIPPLE.spots.length
      const o = state.slot * 4
      state.rings[o] = x; state.rings[o + 1] = z; state.rings[o + 2] = nowSeconds + k * RIPPLE.stagger; state.rings[o + 3] = strength
      state.slot = (state.slot + 1) % RIPPLE.slots
    }
  }
  state.active = false
  for (let i = 0; i < RIPPLE.slots; i++) {
    const o = i * 4, ring = rippleRing(nowSeconds - state.rings[o + 2], state.rings[o + 3])
    state.out[o] = state.rings[o]; state.out[o + 1] = state.rings[o + 1]
    state.out[o + 2] = ring.radius; state.out[o + 3] = ring.amplitude
    if (ring.amplitude > 0) state.active = true
  }
}

// Written by LightingDriver each frame, read by WetGround (as glowActivity is in effects.ts).
export const rippleField = { rings: new Float32Array(RIPPLE.slots * 4), active: false }

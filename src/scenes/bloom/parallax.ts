// BR8: mouse parallax. The camera turns very slightly toward the mouse so near ranges,
// monolith and crystals shift against the distant mountains and sky. Pure helpers; the
// scene decides when it is on (fine pointer with hover, motion allowed) and feeds the target.

const DEG = Math.PI / 180
export const PARALLAX = { maxYaw: 2.5 * DEG, maxPitch: 1.2 * DEG, follow: 0.25 }

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : 0)

// Pointer position in the window → normalised target in -1…1 (0 = centre).
export function pointerTarget(clientX: number, clientY: number, width: number, height: number) {
  if (!(width > 0 && height > 0)) return { x: 0, y: 0 }
  return { x: clamp((clientX / width) * 2 - 1, -1, 1), y: clamp((clientY / height) * 2 - 1, -1, 1) }
}

// Smoothly follow the target; returns the yaw/pitch offsets (radians) to add to the camera.
// Mouse right turns the view right; mouse up tilts it up.
export function parallaxStep(current: { yaw: number, pitch: number }, target: { x: number, y: number }, delta: number) {
  const dt = Number.isFinite(delta) ? Math.min(0.1, Math.max(0, delta)) : 0
  const k = 1 - Math.exp(-dt / PARALLAX.follow)
  const yaw = -clamp(target.x, -1, 1) * PARALLAX.maxYaw, pitch = -clamp(target.y, -1, 1) * PARALLAX.maxPitch
  return { yaw: current.yaw + (yaw - current.yaw) * k, pitch: current.pitch + (pitch - current.pitch) * k }
}

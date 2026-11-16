export const createViewMotion = () => ({ x: 0, y: 0 })
export const VIEW_LIMITS = { x: 1.6, y: 0.85 }
export function updateViewMotion(view: ReturnType<typeof createViewMotion>, target: { x: number, y: number }, delta: number, reducedMotion: boolean) {
  const dt = Math.max(0, Math.min(Number.isFinite(delta) ? delta : 0, 0.05))
  const clamp = (value: number) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0
  const mix = 1 - Math.exp(-dt / 0.18)
  view.x = reducedMotion ? 0 : view.x + (clamp(target.x) * VIEW_LIMITS.x - view.x) * mix
  view.y = reducedMotion ? 0 : view.y + (clamp(target.y) * VIEW_LIMITS.y - view.y) * mix
}

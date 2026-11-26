// Low-rate rendering health shared by the canvas host and the app shell.
// Changes only when the WebGL context is lost or restored, never per frame.
export interface RenderHealth {
  status: 'ok' | 'lost'
  // Increments on each loss so the shell can restart its "still lost" timer.
  episode: number
}

let current: RenderHealth = { status: 'ok', episode: 0 }
const listeners = new Set<() => void>()

export const renderHealth = {
  get: () => current,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  set(status: RenderHealth['status']) {
    if (status === current.status) return
    current = { status, episode: current.episode + (status === 'lost' ? 1 : 0) }
    listeners.forEach((listener) => listener())
  },
}

// One-time signal that some landscape has drawn a frame. Used to defer non-urgent work,
// such as preloading other landscapes, until the first view is actually on screen.
let drawn = false
const drawWaiters = new Set<() => void>()
export function markDrawn() {
  if (drawn) return
  drawn = true
  drawWaiters.forEach((waiter) => waiter())
  drawWaiters.clear()
}
export function afterFirstDraw(callback: () => void): () => void {
  if (drawn) { callback(); return () => {} }
  drawWaiters.add(callback)
  return () => { drawWaiters.delete(callback) }
}

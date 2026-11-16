import { CHUNK_LENGTH, type TerrainData } from './terrain.ts'

export type TerrainWorkerReply = { index: number, data: TerrainData } | { index: number, error: true }
export type TerrainEntry = { index: number, data: TerrainData }
export type TerrainSnapshot = { chunks: TerrainEntry[], error: boolean, ready: boolean }
type WorkerPort = {
  postMessage(message: { index: number }): void
  terminate(): void
  onmessage: ((event: MessageEvent<TerrainWorkerReply>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
}
export const chunkIndexAt = (distance: number) => Math.floor(distance / CHUNK_LENGTH)
export const localCameraZ = (distance: number) => 24 - (distance - chunkIndexAt(distance) * CHUNK_LENGTH)
export const chunkRenderZ = (index: number, distance: number) => -(index - chunkIndexAt(distance)) * CHUNK_LENGTH

export function createTerrainStream(worker: WorkerPort, changed: (snapshot: TerrainSnapshot) => void) {
  const chunks = new Map<number, TerrainData>(), pending = new Set<number>()
  let currentIndex = -Infinity, wanted = new Set<number>(), disposed = false, error = false
  function notify() {
    if (!disposed) changed({ chunks: [...chunks].map(([index, data]) => ({ index, data })), error,
      ready: [...wanted].every(index => chunks.has(index)) && wanted.size === 4 })
  }
  function fail() {
    if (disposed || error) return
    error = true
    pending.clear()
    worker.onmessage = null
    worker.onerror = null
    worker.terminate()
    notify()
  }
  worker.onmessage = event => {
    if (disposed || error) return
    const reply = event.data
    pending.delete(reply.index)
    if ('error' in reply) { fail(); return }
    if (wanted.has(reply.index)) { chunks.set(reply.index, reply.data); notify() }
  }
  worker.onerror = fail
  function requestWindow(index: number) {
    if (disposed || error || currentIndex === index) return
    currentIndex = index
    wanted = new Set([index - 1, index, index + 1, index + 2])
    for (const key of chunks.keys()) if (!wanted.has(key)) chunks.delete(key)
    for (const key of pending) if (!wanted.has(key)) pending.delete(key)
    try {
      for (const key of wanted) {
        if (!chunks.has(key) && !pending.has(key)) {
          pending.add(key)
          worker.postMessage({ index: key })
        }
      }
    } catch { fail(); return }
    notify()
  }
  requestWindow(0)
  return {
    requestWindow,
    get failed() { return error },
    distanceLimit(distance: number) {
      if (error || !chunks.has(currentIndex - 1) || !chunks.has(currentIndex)) return distance
      let farthest = currentIndex
      while (chunks.has(farthest + 1)) farthest++
      // Geometry always extends beyond the material's full haze distance (108).
      return Math.max(distance, 24 + (farthest + 1) * CHUNK_LENGTH - 112)
    },
    dispose() {
      disposed = true
      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
      chunks.clear()
      pending.clear()
    },
  }
}

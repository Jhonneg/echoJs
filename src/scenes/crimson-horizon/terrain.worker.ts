import { createTerrainChunk } from './terrain'
import type { TerrainWorkerReply } from './terrainStream'

// This module owns only CPU-generated procedural geometry, never audio/media.
const port = self as unknown as {
  onmessage: ((event: MessageEvent<{ index: number }>) => void) | null
  postMessage(message: TerrainWorkerReply, transfer?: Transferable[]): void
}
port.onmessage = event => {
  const index = event.data.index
  try {
    const data = createTerrainChunk(index)
    port.postMessage({ index, data }, [data.positions.buffer, data.normals.buffer, data.features.buffer, data.folds.buffer])
  } catch {
    port.postMessage({ index, error: true })
  }
}

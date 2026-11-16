import { gradientNoise, ridgedMultifractal } from './noise.ts'

export const CHUNK_LENGTH = 48
export const CHUNK_WIDTH = 128
export const CHUNK_COLUMNS = 128
export const CHUNK_ROWS = 64
const smoothstep = (low: number, high: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

// Unbounded logical coordinates; no chunk-local caps, folds or valley closure.
export function sampleTerrain(x: number, z: number) {
  const center = gradientNoise(z * 0.018, 8.3, 71) * 0.8
  const halfWidth = 4.8 + gradientNoise(z * 0.022, 3.1, 97) * 0.6
  const distance = Math.abs(x - center)
  const bank = smoothstep(halfWidth, halfWidth + 7.5, distance)
  const seed = x < center ? 3157 : 9283
  const wx = x + gradientNoise(x * 0.025, z * 0.025, seed + 11) * 2.2
  const wz = z + gradientNoise(x * 0.023 + 8, z * 0.023, seed + 29) * 3
  const ridge = ridgedMultifractal(wx * 0.045 + wz * 0.012 + 2.73, wz * 0.055 - wx * 0.009 + 7.19, seed)
  const depthVariation = 0.78 + 0.22 * gradientNoise(z * 0.025, x < center ? 1.7 : 9.3, seed + 37)
  const outerFalloff = 1 - smoothstep(24, 36, distance) * 0.35
  const mountains = bank * (1.3 + ridge.height * 8.5) * depthVariation * outerFalloff
  const fold = gradientNoise(x * 0.04 + 4.7, z * 0.035 + 8.9, 101)
  const floor = 0.12 + gradientNoise(x * 0.055, z * 0.04, 41) * 0.16
    + Math.pow(1 - Math.abs(fold), 8) * 0.7
  const selection = smoothstep(-0.1, 0.35, gradientNoise(wx * 0.065 + 15, wz * 0.04 + 21, seed + 53))
  return { height: floor + mountains, primary: ridge.primary, secondary: ridge.secondary, bank, selection, fold }
}
export function terrainHeight(x: number, z: number) { return sampleTerrain(x, z).height }

export function sampleNormal(x: number, z: number): [number, number, number] {
  const epsilon = 0.3
  const dx = -(terrainHeight(x + epsilon, z) - terrainHeight(x - epsilon, z)) / (2 * epsilon)
  const dz = -(terrainHeight(x, z + epsilon) - terrainHeight(x, z - epsilon)) / (2 * epsilon)
  const length = Math.hypot(dx, 1, dz)
  return [dx / length, 1 / length, dz / length]
}

export function createTerrainChunk(index: number) {
  const vertices = []
  for (let row = 0; row <= CHUNK_ROWS; row++) {
    for (let column = 0; column <= CHUNK_COLUMNS; column++) {
      const x = -CHUNK_WIDTH / 2 + column * CHUNK_WIDTH / CHUNK_COLUMNS
      const localZ = -row * CHUNK_LENGTH / CHUNK_ROWS
      const z = -index * CHUNK_LENGTH + localZ
      const sample = sampleTerrain(x, z)
      vertices.push({ position: [x, sample.height, localZ], normal: sampleNormal(x, z),
        feature: [sample.primary, sample.secondary, sample.bank, sample.selection], fold: sample.fold })
    }
  }
  const positions: number[] = [], normals: number[] = [], features: number[] = [], folds: number[] = []
  for (let row = 0; row < CHUNK_ROWS; row++) {
    for (let column = 0; column < CHUNK_COLUMNS; column++) {
      const a = row * (CHUNK_COLUMNS + 1) + column, b = a + 1, c = a + CHUNK_COLUMNS + 1, d = c + 1
      const triangles = (row + column) % 2 ? [a, b, d, a, d, c] : [a, b, c, b, d, c]
      for (const vertexIndex of triangles) {
        const vertex = vertices[vertexIndex]
        positions.push(...vertex.position)
        normals.push(...vertex.normal)
        features.push(...vertex.feature)
        folds.push(vertex.fold)
      }
    }
  }
  // No longitudinal end walls: adjacent chunks form one continuous surface.
  return { positions: new Float32Array(positions), normals: new Float32Array(normals),
    features: new Float32Array(features), folds: new Float32Array(folds) }
}
export type TerrainData = ReturnType<typeof createTerrainChunk>

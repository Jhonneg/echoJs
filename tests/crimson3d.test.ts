import test from 'node:test'
import assert from 'node:assert/strict'
import { createTerrainChunk, terrainHeight, sampleTerrain, CHUNK_LENGTH, CHUNK_WIDTH } from '../src/scenes/crimson-horizon/terrain.ts'
import { gradientNoise, ridgedMultifractal } from '../src/scenes/crimson-horizon/noise.ts'
import { createViewMotion, updateViewMotion, VIEW_LIMITS } from '../src/scenes/crimson-horizon/cameraMotion.ts'

test('terrain chunks are finite three-dimensional meshes with open matching ends', () => {
  const { positions, features, normals, folds } = createTerrainChunk(0)
  assert.equal(positions.length / 3 * 4, features.length)
  assert.equal(positions.length, normals.length)
  assert.equal(folds.length, positions.length / 3)
  assert.ok(positions.length / 9 < 20000)
  assert.ok(positions.every(Number.isFinite) && normals.every(Number.isFinite))
  assert.ok(features.every(Number.isFinite))
  const bounds = Array.from({ length: 3 }, () => [Infinity, -Infinity])
  const edges = new Map()
  for (let triangle = 0; triangle < positions.length; triangle += 9) {
    const vertices=[]
    for (let offset = 0; offset < 9; offset += 3) {
      const vertex = Array.from(positions.slice(triangle + offset, triangle + offset + 3))
      vertices.push(vertex.join(','))
      for (let axis = 0; axis < 3; axis++) {
        bounds[axis][0] = Math.min(bounds[axis][0], vertex[axis])
        bounds[axis][1] = Math.max(bounds[axis][1], vertex[axis])
      }
      assert.ok(Math.abs(Math.hypot(...normals.slice(triangle + offset, triangle + offset + 3)) - 1) < 1e-6)
    }
    for (let side = 0; side < 3; side++) {
      const key = [vertices[side], vertices[(side + 1) % 3]].sort().join('|')
      edges.set(key, (edges.get(key) ?? 0) + 1)
    }
  }
  assert.equal(bounds[0][1] - bounds[0][0], CHUNK_WIDTH)
  assert.ok(bounds[1][1] - bounds[1][0] > 3)
  assert.equal(bounds[2][1] - bounds[2][0], CHUNK_LENGTH)
  for (const [edge, count] of edges) {
    assert.ok(count === 1 || count === 2)
    if (count === 1) {
      const [a, b] = edge.split('|').map((point: string) => point.split(',').map(Number))
      assert.ok((a[0] === b[0] && Math.abs(a[0]) === CHUNK_WIDTH / 2)
        || (a[2] === b[2] && [0, -CHUNK_LENGTH].includes(a[2])), 'only outer boundaries may be open')
    }
  }
})

test('a broad quiet valley remains between irregular mountain banks', () => {
  for (const z of [-7, -20, -34, -46]) {
    for (const x of [-4, 0, 4]) assert.ok(terrainHeight(x, z) < 1)
    for (const side of [-1, 1]) {
      const bank = [11, 14, 17, 20].map(x => terrainHeight(x * side, z))
      assert.ok(Math.max(...bank) > terrainHeight(0, z) + 2)
    }
  }
})

test('seeded ridged noise is bounded, coherent and repeatable in world coordinates', () => {
  let asymmetric = 0
  for (let i = -40; i < 40; i++) {
    const x = i * 0.17, z = i * 0.31 + 0.39
    const noise = gradientNoise(x, z, 3157)
    assert.ok(noise >= -1 && noise <= 1)
    assert.equal(noise, gradientNoise(x, z, 3157))
    assert.ok(Math.abs(gradientNoise(x + 0.00001, z, 3157) - noise) < 0.0002)
    const ridge = ridgedMultifractal(x, z)
    assert.ok(ridge.height >= 0 && ridge.height <= 1)
    assert.notEqual(ridge.height, ridgedMultifractal(x, z, 9283).height)
    const sample = sampleTerrain(x * 2, z * 2)
    assert.ok(Object.values(sample).every(Number.isFinite))
    assert.ok(sample.bank >= 0 && sample.bank <= 1 && sample.selection >= 0 && sample.selection <= 1)
    if (Math.abs(terrainHeight(14, z * 2) - terrainHeight(-14, z * 2)) > 0.5) asymmetric++
  }
  assert.ok(asymmetric > 20)
})

test('pointer movement is smooth, bounded and independent of frame cadence', () => {
  const results=[]
  for (const hz of [30, 60, 120]) {
    const view = createViewMotion()
    updateViewMotion(view, { x: 1, y: 1 }, 1 / hz, false)
    assert.ok(view.x > 0 && view.x < VIEW_LIMITS.x)
    for (let i = 1; i < hz; i++) updateViewMotion(view, { x: 1, y: 1 }, 1 / hz, false)
    results.push({ ...view })
    for (let i = 0; i < hz * 2; i++) updateViewMotion(view, { x: 0, y: 0 }, 1 / hz, false)
    assert.ok(Math.abs(view.x) < 0.0001 && Math.abs(view.y) < 0.0001)
    for (let i = 0; i < hz; i++) updateViewMotion(view, { x: 99, y: -99 }, 1 / hz, false)
    assert.ok(view.x <= VIEW_LIMITS.x && view.y >= -VIEW_LIMITS.y)
    updateViewMotion(view, { x: 1, y: 1 }, 1 / hz, true)
    assert.deepEqual(view, createViewMotion())
  }
  assert.ok(Math.abs(results[0].x - results[2].x) < 1e-10)
})


test('neighboring chunk boundaries share exact height, normals and shader features', () => {
  function boundary(data: ReturnType<typeof createTerrainChunk>, z: number) {
    const result = new Map()
    for (let vertex = 0; vertex < data.positions.length / 3; vertex++) {
      const i = vertex * 3
      if (data.positions[i + 2] === z) result.set(data.positions[i], [data.positions[i + 1],
        ...data.normals.slice(i, i + 3), ...data.features.slice(vertex * 4, vertex * 4 + 4), data.folds[vertex]])
    }
    return result
  }
  for (const index of [-1, 0, 10]) {
    const end = boundary(createTerrainChunk(index), -CHUNK_LENGTH)
    const start = boundary(createTerrainChunk(index + 1), 0)
    assert.deepEqual(end, start)
  }
})

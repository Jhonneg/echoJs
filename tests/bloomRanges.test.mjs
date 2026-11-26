import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CAMERA_HEIGHT, CAMERA_Z, HORIZON_FRACTION, RANGES, projectToScreen, rangeTop } from '../src/scenes/bloom/composition.ts'
import { buildRange, crestFraction, rangeCells } from '../src/scenes/bloom/ranges.ts'

const meshes = quality => RANGES.map((layer, i) => buildRange(layer, rangeCells(i, quality)))

test('BR2: every vertex is finite, indices are in range, and the front edge sinks under the water', () => {
  for (const m of meshes('standard')) {
    assert.ok(m.positions.every(Number.isFinite) && m.rise.every(Number.isFinite))
    const count = m.positions.length / 3
    assert.ok(m.indices.every(i => i < count))
    for (let i = 0; i < m.columns; i++) assert.ok(m.positions[(i * m.rows + m.rows - 1) * 3 + 1] < 0)
  }
})

test('BR2: no point rises above the line of sight to its crest, so the silhouette is the crest', () => {
  for (const m of meshes('standard')) for (let i = 0; i < m.columns; i++) {
    const crest = i * m.rows, cy = m.positions[crest * 3 + 1], cd = CAMERA_Z - m.positions[crest * 3 + 2]
    const sight = (cy - CAMERA_HEIGHT) / cd
    for (let j = 1; j < m.rows; j++) {
      const k = i * m.rows + j, y = m.positions[k * 3 + 1], d = CAMERA_Z - m.positions[k * 3 + 2]
      assert.ok((y - CAMERA_HEIGHT) / d <= sight + 1e-9)
      assert.ok(m.rise[k] <= 1 + 1e-6)
    }
  }
})

test('BR2: seen from the camera, each crest follows the approved BR1 outline', () => {
  for (const [index, m] of meshes('standard').entries()) {
    let worst = 0
    for (let i = 0; i < m.columns; i += 4) {
      const k = i * m.rows, p = projectToScreen(m.positions[k * 3], m.positions[k * 3 + 1], m.positions[k * 3 + 2], 16 / 9)
      if (p.x < 0 || p.x > 1) continue
      const u = p.x * 2 - 1, target = Math.min(rangeTop(RANGES[index], u), HORIZON_FRACTION)
      worst = Math.max(worst, Math.abs(p.y - target))
    }
    assert.ok(worst < 0.035, `range ${index}: crest deviates ${worst.toFixed(4)} of screen height`)
  }
})

test('BR2: crest detail only adds small craggy variation', () => {
  for (const layer of RANGES) for (let u = -1.6; u <= 1.6; u += 0.01) {
    assert.ok(Math.abs(crestFraction(layer, u) - rangeTop(layer, u)) <= layer.jag * 1.4 + 1e-9)
  }
})

test('BR2: triangle budgets — about 250k on Standard, about 60k on Low; mesh build stays fast', () => {
  const tris = list => list.reduce((n, m) => n + m.indices.length / 3, 0)
  const start = performance.now(), standard = meshes('standard'), buildMs = performance.now() - start
  assert.ok(tris(standard) <= 260000, `standard ${tris(standard)}`)
  assert.ok(tris(meshes('low')) <= 70000, `low ${tris(meshes('low'))}`)
  assert.ok(buildMs < 1500, `building all ranges took ${buildMs.toFixed(0)} ms`)
})

test('BR2: snow lines rise toward nearer ranges; the nearest foothills have none', () => {
  for (let i = 1; i < RANGES.length; i++) assert.ok(RANGES[i].snow > RANGES[i - 1].snow)
  assert.ok(RANGES.at(-1).snow > 1)
})

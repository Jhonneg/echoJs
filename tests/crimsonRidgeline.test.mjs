import test from 'node:test'
import assert from 'node:assert/strict'
import { RIDGE, SUN, discCoverage, ridgeHeight, ridgeStrip, toRidgePlane } from '../src/scenes/crimson-horizon/ridgeline.ts'

test('sun cut: the ridge covers 20-30% of the visible disc and leaves its top half clear', () => {
  const coverage = discCoverage()
  assert.ok(coverage >= 0.2 && coverage <= 0.3, `coverage ${coverage}`)
  for (let x = -SUN.radius; x <= SUN.radius; x += 0.05) assert.ok(ridgeHeight(x) < SUN.y, `height ${ridgeHeight(x)} at ${x}`)
  // A V where the valley opens: the outline dips lowest near the centre of the disc.
  const centre = Math.min(...[-1, -0.5, 0, 0.5, 1].map(ridgeHeight))
  assert.ok(centre < 1.5, `centre ${centre}`)
  assert.ok(ridgeHeight(-5.6) > 4 && ridgeHeight(7.6) > 4, 'peaks overlap both sides of the disc')
})

test('sun cut: the ridge is in front of the sun, and its ends drop to meet the side mountains', () => {
  assert.ok(RIDGE.distance < SUN.distance - SUN.radius, 'in front of the sun sphere')
  const first = RIDGE.peaks[0], last = RIDGE.peaks[RIDGE.peaks.length - 1]
  assert.ok(first.y <= 1.5 && last.y <= 1.5, 'low at both ends')
  assert.ok(-first.x > SUN.radius * 2.5 && last.x > SUN.radius * 2.5, 'wide enough to tuck behind the side mountains')
  for (let i = 1; i < RIDGE.peaks.length; i++) assert.ok(RIDGE.peaks[i].x > RIDGE.peaks[i - 1].x, 'peaks in order')
})

test('sun cut: the strip is closed, the same every time, and projects onto the outline', () => {
  const a = ridgeStrip(), b = ridgeStrip()
  assert.deepEqual([...a.positions], [...b.positions])
  assert.equal(a.positions.length / 3, a.edges.length)
  assert.equal(a.index.length % 6, 0)
  for (const i of a.index) assert.ok(i >= 0 && i < a.edges.length)
  // Top vertices (edge 0) lie on the projected outline; bottom vertices below the valley floor.
  for (let v = 0; v < a.edges.length; v += 2) {
    assert.equal(a.edges[v], 0)
    assert.ok(a.edges[v + 1] > 0)
    assert.ok(a.positions[(v + 1) * 3 + 1] < 0, 'bottom below the floor')
  }
  const peak = RIDGE.peaks[5], projected = toRidgePlane(peak.x, peak.y)
  assert.ok([...Array(a.edges.length / 2).keys()].some(k => Math.abs(a.positions[k * 6] - projected.x) < 1e-4 && Math.abs(a.positions[k * 6 + 1] - projected.y) < 1e-4), 'every peak stays sharp')
})

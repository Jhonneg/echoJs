import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CAMERA_HEIGHT, CAMERA_Z, CRYSTALS, HORIZON_FRACTION, MONOLITH, RANGES, projectToScreen, rangeOutline, rangeTop } from '../src/scenes/bloom/composition.ts'

const aspects = { desktop: 1440 / 900, wide: 1920 / 810, portrait: 390 / 844 }
// Box corners, turned by the monolith's yaw about its own centre.
const corners = () => {
  const [cx, cy, cz] = MONOLITH.center, hw = MONOLITH.width / 2, hh = MONOLITH.height / 2, hd = MONOLITH.depth / 2
  const c = Math.cos(MONOLITH.yaw), s = Math.sin(MONOLITH.yaw), out: [number, number, number][] = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * hw, z = sz * hd
    out.push([cx + x * c + z * s, cy + sy * hh, cz - x * s + z * c])
  }
  return out
}

test('BR1: monolith is fully visible and horizontally centred at desktop, wide and portrait', () => {
  for (const [name, aspect] of Object.entries(aspects)) {
    const points = corners().map(([x, y, z]) => projectToScreen(x, y, z, aspect))
    for (const p of points) {
      assert.ok(p.x > 0 && p.x < 1, `${name}: monolith x ${p.x} out of frame`)
      assert.ok(p.y > 0 && p.y < 1, `${name}: monolith y ${p.y} out of frame`)
    }
    const xs = points.map(p => p.x)
    assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 0.5) < 0.02, `${name}: not centred`)
  }
})

test('BR1/BR4: the turned monolith matches the reference framing in a 16:9 frame', () => {
  const points = corners().map(([x, y, z]) => projectToScreen(x, y, z, 16 / 9))
  const xs = points.map(p => p.x), ys = points.map(p => p.y)
  const top = Math.min(...ys), bottom = Math.max(...ys), width = Math.max(...xs) - Math.min(...xs)
  assert.ok(Math.abs(top - 0.064) < 0.025, `top ${top}`)
  assert.ok(Math.abs(bottom - 0.627) < 0.025, `bottom ${bottom}`)
  assert.ok(Math.abs(width - 0.09) < 0.015, `width ${width}`)
  assert.ok(MONOLITH.yaw < 0, 'right side face should turn toward the camera')
  assert.ok(MONOLITH.bottom > 0.2, 'monolith must hover above the water')
})

test('BR1: horizon sits at the reference height and the base stays above it', () => {
  const far = projectToScreen(0, 0, CAMERA_Z - 1e6, 16 / 9)
  assert.ok(Math.abs(far.y - HORIZON_FRACTION) < 1e-3, `horizon ${far.y}`)
  assert.ok(projectToScreen(0, MONOLITH.bottom, 0, 16 / 9).y < far.y)
  assert.ok(CAMERA_HEIGHT < MONOLITH.bottom)
})

test('BR1: ranges are ordered far to near, rise toward the edges and keep a central valley', () => {
  for (let i = 1; i < RANGES.length; i++) assert.ok(RANGES[i].distance < RANGES[i - 1].distance)
  for (const layer of RANGES) {
    assert.ok(rangeTop(layer, 0) > rangeTop(layer, 0.85), 'edge should be higher (smaller fraction) than the valley')
    assert.ok(rangeTop(layer, 0) <= HORIZON_FRACTION)
    for (const [x, y] of rangeOutline(layer)) assert.ok(Number.isFinite(x) && Number.isFinite(y) && y >= 0)
  }
  // The big snowy left peak of the reference reaches high into the sky.
  assert.ok(Math.min(...[-0.7, -0.64, -0.6].map(u => rangeTop(RANGES[1], u))) < 0.2)
})

test('BR1: crystals sit left-high and right-low of the monolith, inside portrait framing', () => {
  const [left, right] = CRYSTALS.map(c => projectToScreen(...c.position, 16 / 9))
  assert.ok(left.x < 0.5 && right.x > 0.5)
  assert.ok(left.y < right.y)
  for (const c of CRYSTALS) {
    const p = projectToScreen(...c.position, aspects.portrait)
    assert.ok(p.x > 0 && p.x < 1, `crystal outside portrait: ${p.x}`)
  }
})

import { CAMERA_PITCH, FOV_DEGREES, cameraFor, projectForAspect } from '../src/scenes/bloom/composition.ts'

const shapes = { portrait: 390 / 844, tabletPortrait: 768 / 1024, square: 1, tablet: 1024 / 768, desktop: 1440 / 900, reference: 16 / 9, shortLaptop: 1440 / 700, wide: 1920 / 810 }

test('BR7: desktop, 16:9 and wide keep the approved framing exactly', () => {
  for (const aspect of [shapes.desktop, shapes.reference, shapes.shortLaptop, shapes.wide]) {
    const view = cameraFor(aspect)
    assert.ok(Math.abs(view.fovDegrees - FOV_DEGREES) < 1e-9, `fov ${view.fovDegrees} at ${aspect}`)
    assert.ok(Math.abs(view.pitch - CAMERA_PITCH) < 1e-9)
  }
})

test('BR7: every screen shape shows the whole monolith, centred, with the horizon below it', () => {
  for (const [name, aspect] of Object.entries(shapes)) {
    const points = corners().map(([x, y, z]) => projectForAspect(x, y, z, aspect))
    for (const p of points) assert.ok(p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.98, `${name}: ${JSON.stringify(p)}`)
    const xs = points.map(p => p.x)
    assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 0.5) < 0.02, `${name}: not centred`)
    const horizon = projectForAspect(0, 0, CAMERA_Z - 1e6, aspect).y
    assert.ok(Math.abs(horizon - cameraFor(aspect).horizon) < 1e-3, `${name}: horizon ${horizon}`)
    assert.ok(Math.max(...points.map(p => p.y)) < horizon, `${name}: monolith base below the horizon`)
  }
})

test('BR7: portrait shrinks the monolith to about half and opens water above the controls', () => {
  const height = (aspect: number) => { const ys = corners().map(([x, y, z]) => projectForAspect(x, y, z, aspect).y); return Math.max(...ys) - Math.min(...ys) }
  const ratio = height(shapes.portrait) / height(shapes.desktop)
  assert.ok(ratio > 0.4 && ratio < 0.65, `portrait monolith is ${ratio.toFixed(2)} of desktop`)
  assert.ok(cameraFor(shapes.portrait).horizon <= 0.54, 'horizon raised for water above the controls')
  // Narrower screens never show less of the reference width than the portrait target.
  let previous = Infinity
  for (const aspect of [0.4, 0.46, 0.6, 0.75, 1, 1.3, 1.6, 2.4]) {
    const fov = cameraFor(aspect).fovDegrees
    assert.ok(fov <= previous + 1e-9, 'field of view must not grow as screens get wider')
    previous = fov
  }
})

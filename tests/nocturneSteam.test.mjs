import test from 'node:test'
import assert from 'node:assert/strict'
import { STEAM, VENT, plumeBase, plumeShape, steamScroll, steamTime, ventZ } from '../src/scenes/nocturne/steam.ts'

test('NT21: plumes rise from existing vents, inside the alley and the visible range', () => {
  // The vents of ArchitectureDetails.tsx: bays at z = -2 - 10 n (left) and -4 - 10 n (right), vent at bay + 3.1.
  assert.equal(ventZ(-1, 1), -8.9)
  assert.equal(ventZ(1, 2), -20.9)
  assert.ok(STEAM.plumes.length >= 2 && STEAM.plumes.length <= 4)
  for (const plume of STEAM.plumes) {
    const base = plumeBase(plume)
    assert.ok(Math.abs(base.x) + STEAM.size.width / 2 * 0.3 < VENT.faceX, 'the visible plume stays off the wall')
    assert.ok(Math.sign(base.x) === plume.side)
    assert.ok(base.y - STEAM.size.height / 2 < VENT.y, 'starts at the vent')
    assert.ok(base.z < 0 && base.z > -STEAM.fade.end + 5, 'in front of the camera, before the distance fade')
  }
  assert.equal(new Set(STEAM.plumes.map(p => `${p.side}:${p.bay}`)).size, STEAM.plumes.length, 'one plume per vent')
})

test('NT21: the plume outline fades to zero at its bottom, top and sides', () => {
  for (const v of [0, 1, -0.2, 1.3]) for (const u of [-0.3, 0, 0.3]) assert.equal(plumeShape(u, v), 0)
  for (const v of [0.1, 0.4, 0.8]) {
    assert.equal(plumeShape(0.5, v), 0)
    assert.equal(plumeShape(-0.5, v), 0)
  }
  // Dense along its centreline, which still leans toward the wall at mid-height.
  assert.ok(plumeShape(0.28 * 0.6 * 0.6, 0.4) > 0.5)
  assert.ok(plumeShape(0, 0.99) < 0.01)
  // Near the vent the plume leans toward the wall, then straightens as it rises.
  assert.ok(plumeShape(0.2, 0.12, 1) > plumeShape(-0.2, 0.12, 1))
  assert.ok(Math.abs(plumeShape(0.1, 0.9, 1) - plumeShape(-0.1, 0.9, 1)) < 0.05)
})

test('NT21: the drift wraps to the noise period, and freezes with reduced motion', () => {
  let previous = steamScroll(0)
  for (let t = 1 / 60; t < 600; t += 1 / 60) {
    const s = steamScroll(t)
    assert.ok(s >= 0 && s < STEAM.period)
    // Continuous, except where it wraps by exactly one period (seamless: the noise repeats).
    const step = s - previous
    assert.ok(Math.abs(step) < 0.01 || Math.abs(step + STEAM.period) < 0.01, `step ${step} at ${t}`)
    previous = s
  }
  assert.ok(steamScroll(3600 * 5) >= 0 && steamScroll(3600 * 5) < STEAM.period)
  assert.equal(steamTime(12.3, true), STEAM.frozenTime)
  assert.equal(steamTime(99, true), steamTime(1, true))
  assert.equal(steamTime(12.3, false), 12.3)
  assert.equal(steamTime(Number.NaN, false), STEAM.frozenTime)
})

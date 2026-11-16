import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPerformanceMeasurement } from '../src/engine/performance.ts'
const render = { width: 1440, height: 900, renderDpr: 1, deviceDpr: 1, renderer: 'Test renderer', reactivity: 1, reducedMotion: false }
const environment = { browser: 'Test browser', logicalCores: 8, build: 'production', source: 'tab / disconnected', sampleRate: null, fftSize: null }
function ready() { const run = createPerformanceMeasurement(); run.setRenderEnvironment(render); return run }

test('warm-up is excluded and a 30-second run reports correct FPS and percentiles', () => {
  const run = ready()
  run.start(environment, 0)
  run.frame(4999)
  assert.equal(run.snapshot.phase, 'warming')
  run.frame(5000)
  for (let i = 1; i <= 1800; i++) run.frame(5000 + i * 1000 / 60)
  const result = run.snapshot.result
  assert.equal(run.snapshot.phase, 'complete')
  assert.equal(result.frames, 1800)
  assert.equal(result.seconds, 30)
  assert.equal(result.fps, 60)
  assert.ok(Math.abs(result.p95FrameMs - 1000 / 60) < 1e-8)
  assert.equal(result.environment.renderer, render.renderer)
  assert.equal(result.environment.build, 'production')
})
test('long frames are retained rather than capped or discarded', () => {
  const run = ready()
  run.start(environment, 0)
  run.frame(5000)
  for (let i = 1; i <= 290; i++) run.frame(5000 + i * 100)
  run.frame(35000)
  const result = run.snapshot.result
  assert.equal(result.maxFrameMs, 1000)
  assert.equal(result.frames, 291)
  assert.equal(result.fps, 291 / 30)
  assert.equal(result.p50FrameMs, 100)
})
test('invalidation prevents results and new runs reset cleanly', () => {
  const run = ready()
  run.start(environment, 0)
  run.frame(5000)
  run.invalidate('Page hidden')
  run.frame(35000)
  assert.equal(run.snapshot.phase, 'invalid')
  assert.equal(run.snapshot.result, null)
  assert.equal(run.snapshot.reason, 'Page hidden')
  run.start(environment, 40000)
  assert.equal(run.snapshot.phase, 'warming')
  assert.equal(run.snapshot.reason, '')
})
test('resize or changed scene settings invalidate, identical settings do not', () => {
  const run = ready()
  run.start(environment, 0)
  run.setRenderEnvironment({ ...render })
  assert.equal(run.snapshot.phase, 'warming')
  run.setRenderEnvironment({ ...render, width: 390 })
  assert.equal(run.snapshot.phase, 'invalid')
})
test('cannot measure before renderer is ready', () => {
  const run = createPerformanceMeasurement()
  run.start(environment, 0)
  run.frame(5000)
  assert.equal(run.snapshot.phase, 'idle')
})

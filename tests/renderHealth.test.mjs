import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderHealth } from '../src/engine/renderHealth.ts'

test('APP03: render health notifies only on change and counts each loss', () => {
  let calls = 0
  const stop = renderHealth.subscribe(() => calls++)
  const start = renderHealth.get()
  assert.equal(start.status, 'ok')
  renderHealth.set('ok')
  assert.equal(calls, 0)
  assert.equal(renderHealth.get(), start, 'unchanged snapshot must keep identity')
  renderHealth.set('lost')
  renderHealth.set('lost')
  assert.equal(calls, 1)
  assert.equal(renderHealth.get().episode, start.episode + 1)
  renderHealth.set('ok')
  renderHealth.set('lost')
  assert.equal(renderHealth.get().episode, start.episode + 2)
  stop()
  renderHealth.set('ok')
  assert.equal(calls, 3)
})

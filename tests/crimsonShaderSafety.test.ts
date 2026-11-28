import test from 'node:test'
import assert from 'node:assert/strict'
import { terrainFragment } from '../src/scenes/crimson-horizon/material.ts'

// pow() of a negative number is NaN on GPUs. The bank value (vFeatures.z) is 0 on the valley floor
// and interpolation can dip just below it, which drew dark dotted lines along the floor's edges.
// Every pow() in the terrain shader must take an input that can't be negative.
const NON_NEGATIVE = new Set(['channelDistance / .18']) // channelDistance is an abs()

test('Crimson terrain shader: every pow() input is clamped or non-negative', () => {
  const code = terrainFragment.replace(/\/\/.*$/gm, '') // ignore comments
  const calls = [...code.matchAll(/pow\(([^,]+),/g)].map(m => m[1].trim())
  assert.ok(calls.length >= 3, `found ${calls.length} pow() calls`)
  for (const input of calls) assert.ok(input.startsWith('max(') || NON_NEGATIVE.has(input), `unguarded pow(${input}, …)`)
  assert.ok(!/pow\(vFeatures\.z/.test(code), 'the bank value is never raised to a power unclamped')
})

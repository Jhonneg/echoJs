import test from 'node:test'
import assert from 'node:assert/strict'
import { GRAIN, grainMix, grainFragment } from '../src/scenes/lavender-peaks/grain.ts'
import { CORONA_SETTINGS, coronaFragment } from '../src/scenes/lavender-peaks/corona.ts'

test('grain: faint, centred on zero, mostly soft blotches, static and screen-fixed', () => {
  assert.ok(GRAIN.amplitude > 0 && GRAIN.amplitude <= 2, 'at most 2 output levels')
  assert.equal(grainMix(0, 0), -1)
  assert.equal(grainMix(1, 1), 1)
  assert.equal(grainMix(0.5, 0.5), 0, 'no overall brightening or darkening')
  assert.ok(GRAIN.blotch > 0.5, 'blotches dominate, like the reference mottle')
  assert.ok(grainFragment.includes('gl_FragCoord'), 'fixed to the screen')
  assert.ok(!/time|Time/.test(grainFragment), 'static: no time input')
  assert.ok(grainFragment.includes((GRAIN.amplitude / 255).toFixed(3)))
})

test('corona softening: a fainter, wider glow at rest only; music restores the approved strands', () => {
  // Approved music-time values are unchanged; only the rest look is dimmed and widened.
  assert.equal(CORONA_SETTINGS.restingOpacity, 0.16)
  assert.equal(CORONA_SETTINGS.maximumOpacity, 0.46)
  assert.ok(CORONA_SETTINGS.restingDim > 0 && CORONA_SETTINGS.restingDim < 1, 'fainter at rest')
  assert.ok(CORONA_SETTINGS.restingSoftness > 0, 'wider at rest')
  assert.ok(CORONA_SETTINGS.softeningRelease >= 2, 'modest activity fully restores the crisp strands')
  assert.ok(coronaFragment.includes(`${CORONA_SETTINGS.restingSoftness.toFixed(3)} * (1.0 - activity)`), 'softness fades out with activity')
  assert.ok(coronaFragment.includes(`mix(${CORONA_SETTINGS.restingDim.toFixed(3)}, 1.0, activity)`), 'dimming fades out with activity')
})

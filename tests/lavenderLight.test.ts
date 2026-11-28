import test from 'node:test'
import assert from 'node:assert/strict'
import { ridges } from '../src/scenes/lavender-peaks/terrain.ts'
import { WARM_LIGHT, mistWarmth, warmSkyHalo, warmSkyColor, atmosphereRidge } from '../src/scenes/lavender-peaks/atmosphere.ts'

// Relative luminance (0–1) of a '#rrggbb' sRGB colour.
const luma = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

test('front layers: paler than before, but the front ridge stays darkest and each farther ridge steps paler', () => {
  for (const key of ['upper', 'lower'] as const) for (let i = 1; i < ridges.length; i++) {
    assert.ok(luma(ridges[i][key]) < luma(ridges[i - 1][key]), `ridge ${i} ${key} darker than ridge ${i - 1}`)
  }
  const front = ridges[ridges.length - 1]
  assert.ok(luma(front.upper) > luma('#7d70a5') && luma(front.lower) > luma('#9b84ad'), 'front ridge lighter than the old #7d70a5 / #9b84ad')
  assert.ok(luma(front.upper) < luma(ridges[ridges.length - 2].upper) * 0.85, 'front ridge still a clearly stronger silhouette')
})

test('warm light: a wide low-sky glow, and warmth across the whole mist width, strongest toward the sun', () => {
  assert.ok(WARM_LIGHT.sky.width > 5.8 * 1.5, 'sky glow at least 1.5 times its former width')
  assert.ok(WARM_LIGHT.sky.width > WARM_LIGHT.sky.height, 'it spreads sideways more than upward')
  const [r, g, b] = WARM_LIGHT.sky.color
  assert.ok(r >= g && g > b, 'peach, not lavender')
  assert.ok(warmSkyHalo.includes(WARM_LIGHT.sky.width.toFixed(3)) && warmSkyColor.startsWith('vec3('))
  assert.ok(mistWarmth(1.6) > mistWarmth(-10) && mistWarmth(1.6) > mistWarmth(12), 'warmest at the sun')
  for (const x of [-20, -12, 0, 12, 20]) {
    assert.ok(mistWarmth(x) >= WARM_LIGHT.mist.base && mistWarmth(x) <= WARM_LIGHT.mist.base + WARM_LIGHT.mist.peak + 1e-12)
  }
  assert.ok(mistWarmth(12) > 0.2 * 0.9, 'the far sides of the mist stay warm')
  assert.ok(atmosphereRidge.includes(WARM_LIGHT.mist.width.toFixed(3)), 'the ridge shader uses the shared mist warmth')
})

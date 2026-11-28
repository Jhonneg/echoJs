import test from 'node:test'
import assert from 'node:assert/strict'
import { FOLD_FREQUENCY, sampleTerrain, terrainHeight } from '../src/scenes/crimson-horizon/terrain.ts'

test('foreground: the valley floor stays under 1 m with the broader folds', () => {
  for (let z = -2; z > -400; z -= 1.7) for (let x = -4; x <= 4; x += 0.5) {
    const h = terrainHeight(x, z)
    assert.ok(h < 1, `floor ${h} at ${x}, ${z}`)
  }
})

test('foreground: fold crests run mainly along the valley (leading lines toward the sun)', () => {
  // The fold value changes much faster across the valley than along it, so its zero line (the crest)
  // runs mostly along z, converging toward the sun in perspective.
  let across = 0, along = 0
  for (let z = -5; z > -300; z -= 3.1) for (let x = -4; x <= 4; x += 0.9) {
    const e = 0.05
    across += Math.abs(sampleTerrain(x + e, z).fold - sampleTerrain(x - e, z).fold)
    along += Math.abs(sampleTerrain(x, z + e).fold - sampleTerrain(x, z - e).fold)
  }
  assert.ok(across > along * 3, `across ${across.toFixed(2)} vs along ${along.toFixed(2)}`)
  assert.ok(FOLD_FREQUENCY.x > FOLD_FREQUENCY.z * 4)
})

test('foreground: folds are the same every time and there are crests on the floor to draw', () => {
  assert.deepEqual(sampleTerrain(1.3, -27.4), sampleTerrain(1.3, -27.4))
  // Within the floor (|x| <= 4) the fold value crosses zero somewhere along most stretches of valley.
  let stretches = 0, withCrest = 0
  for (let z = -5; z > -300; z -= 10) {
    stretches++
    let previous = sampleTerrain(-4, z).fold
    for (let x = -3.8; x <= 4; x += 0.2) {
      const fold = sampleTerrain(x, z).fold
      if (Math.sign(fold) !== Math.sign(previous)) { withCrest++; break }
      previous = fold
    }
  }
  assert.ok(withCrest / stretches > 0.4, `${withCrest} of ${stretches} stretches have a crest`)
})

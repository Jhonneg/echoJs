// Original deterministic 2D gradient noise; no external noise/runtime dependency.
function hash(x: number, z: number, seed: number) {
  let value = Math.imul(x ^ seed, 374761393) ^ Math.imul(z, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}
function gradient(x: number, z: number, dx: number, dz: number, seed: number) {
  const diagonal = Math.SQRT1_2
  switch (hash(x, z, seed) & 7) {
    case 0: return dx
    case 1: return -dx
    case 2: return dz
    case 3: return -dz
    case 4: return (dx + dz) * diagonal
    case 5: return (dx - dz) * diagonal
    case 6: return (-dx + dz) * diagonal
    default: return (-dx - dz) * diagonal
  }
}
const fade = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount
export function gradientNoise(x: number, z: number, seed = 3157) {
  const ix = Math.floor(x), iz = Math.floor(z)
  const dx = x - ix, dz = z - iz, sx = fade(dx), sz = fade(dz)
  const low = mix(gradient(ix, iz, dx, dz, seed), gradient(ix + 1, iz, dx - 1, dz, seed), sx)
  const high = mix(gradient(ix, iz + 1, dx, dz - 1, seed), gradient(ix + 1, iz + 1, dx - 1, dz - 1, seed), sx)
  return Math.max(-1, Math.min(1, mix(low, high, sz) * 1.6))
}

// Ridged octaves feed their strength into the next octave, rather than simply
// summing absolute noise. Dominant crests survive while fine detail is bounded.
export function ridgedMultifractal(x: number, z: number, seed = 3157) {
  let weight = 1, amplitude = 1, sum = 0, normalization = 0
  let primary = 0, secondary = 0
  for (let octave = 0; octave < 4; octave++) {
    const value = gradientNoise(x, z, seed + octave * 1013)
    if (octave === 0) primary = value
    if (octave === 1) secondary = value
    let ridge = 1 - Math.abs(value)
    ridge = ridge * ridge * weight
    sum += ridge * amplitude
    normalization += amplitude
    weight = Math.max(0, Math.min(1, ridge * 1.9))
    amplitude *= 0.5
    x *= 2
    z *= 2
  }
  return { height: sum / normalization, primary, secondary }
}

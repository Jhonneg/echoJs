// Grain pass (owner review item 7): a faint, static, screen-fixed mottle over the sky and ridges,
// like the reference's paper/film texture. Applied to the final sRGB output, before dithering.
// Static by owner choice: no flicker, nothing for reduced motion to hold.
export const GRAIN = {
  amplitude: 1.8, // largest change, in 0–255 output levels
  cell: 6.0, // blotch size in device pixels
  blotch: 0.75, // share of soft blotches; the rest is per-pixel fine grain
} as const

// The grain value (−1..1, before amplitude) for a pixel, from its blotch and fine parts (mirrors
// the shader's mix), so tests can check its range and balance.
export const grainMix = (blotch: number, fine: number) =>
  (GRAIN.blotch * blotch + (1 - GRAIN.blotch) * fine) * 2 - 1

const f = (v: number) => v.toFixed(3)
export const grainFragment = `
float grainHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float grainBlotch(vec2 p) {
  vec2 cell = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  return mix(mix(grainHash(cell), grainHash(cell + vec2(1.0, 0.0)), t.x),
    mix(grainHash(cell + vec2(0.0, 1.0)), grainHash(cell + vec2(1.0, 1.0)), t.x), t.y);
}
// Add to gl_FragColor.rgb after the colour-space conversion; weight 0 leaves a pixel untouched.
vec3 grain(float weight) {
  vec2 p = gl_FragCoord.xy;
  float value = ${f(GRAIN.blotch)} * grainBlotch(p / ${f(GRAIN.cell)}) + ${f(1 - GRAIN.blotch)} * grainHash(floor(p) + 0.5);
  return vec3((value * 2.0 - 1.0) * ${f(GRAIN.amplitude / 255)} * weight);
}
`

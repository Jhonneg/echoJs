// BR2: real 3D mountain ranges. Each range is a height-map band that rises from below the
// water to its crest at the layer's distance. Every point stays below the camera's line of
// sight to its column's crest, so the silhouette seen from the camera is the approved BR1
// outline (plus fine crest detail); ridges and gullies only add relief beneath it.
// Pure maths (no three.js) so it can be tested; the shader strings live here too.
import type { GraphicsQuality } from '../../engine/quality'
import { CAMERA_HEIGHT, CAMERA_Z, heightForScreen, rangeTop, xForScreen, type RangeLayer } from './composition.ts'
import { riverGlsl } from './rivers.ts'

export const RANGE_REACH = 1.7 // |u| covered, beyond the 16:9 frame for ultra-wide screens

// Cells across × down the slope, far to near. Low halves each axis.
const CELLS: readonly (readonly [number, number])[] = [[300, 40], [360, 56], [400, 64], [400, 72], [400, 80]]
export const rangeCells = (index: number, quality: GraphicsQuality): [number, number] => {
  const [nx, nt] = CELLS[index]
  return quality === 'low' ? [nx >> 1, nt >> 1] : [nx, nt]
}

// Value noise with a fixed hash: deterministic, no dependency.
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
// Ridged fractal: sharp crests where noise crosses its midpoint. Returns 0..1 (1 = ridge line).
export function ridged(x: number, y: number, octaves = 4) {
  let sum = 0, amp = 0.5, norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * (1 - Math.abs(2 * noise(x, y) - 1)) ** 2
    norm += amp; x *= 2.07; y *= 2.07; amp *= 0.5
  }
  return sum / norm
}

// Crest top for column u: the BR1 profile, made craggier with fine ridged detail.
export function crestFraction(layer: RangeLayer, u: number) {
  return rangeTop(layer, u) - layer.jag * 1.4 * (ridged(u * 38 + layer.seed * 7.3, layer.seed, 3) - 0.35)
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface RangeMesh {
  positions: Float32Array // x, y, z per vertex
  rise: Float32Array // height relative to the column's crest (≈1 at crest, ≤0 under water)
  indices: Uint32Array
  columns: number // nx + 1
  rows: number // nt + 1
}

// Column u of a range: crest height, line-of-sight slope to it, world x and face steepness.
export function rangeColumn(layer: RangeLayer, u: number) {
  const d = layer.distance
  const crest = heightForScreen(Math.min(crestFraction(layer, u), 0.661), d)
  return {
    crest, sight: (crest - CAMERA_HEIGHT) / d, x: xForScreen((u + 1) / 2, d),
    steep: 0.75 + 0.5 * ridged(u * 3 + layer.seed, 11.3, 2), // some faces drop faster
  }
}

// Surface point at column u and down-slope position t (0 = crest, 1 = front edge under water).
export function rangePoint(layer: RangeLayer, column: ReturnType<typeof rangeColumn>, u: number, t: number) {
  const distance = layer.distance * (1 - layer.band * t)
  // Ridges run down the slope: fine across x, stretched along t.
  const ridge = ridged(u * 26 + layer.seed * 3.1, t * 2.4 + layer.seed, 4)
  const fall = Math.min(1, Math.pow(t, 0.85) * column.steep)
  // Sideways ruggedness turns faces steep (rock) instead of uniformly upward (snow).
  const rugged = ridged(u * 64 + layer.seed * 5.7, t * 5 + layer.seed * 2.3, 3)
  const g = (1 - fall * (1 - 0.6 * ridge)) * (1 - 0.22 * Math.sqrt(t) * (1 - rugged)) // ≤ 1, = 1 at the crest
  const sink = smoothstep(0.72, 1, t) // the front edge runs under the water
  const y = (CAMERA_HEIGHT + distance * column.sight * g) * (1 - sink) - 1.5 * sink
  return { x: column.x, y, z: CAMERA_Z - distance }
}

export function buildRange(layer: RangeLayer, cells: [number, number]): RangeMesh {
  const [nx, nt] = cells, columns = nx + 1, rows = nt + 1
  const positions = new Float32Array(columns * rows * 3), rise = new Float32Array(columns * rows)
  for (let i = 0; i < columns; i++) {
    const u = -RANGE_REACH + (2 * RANGE_REACH * i) / nx
    const column = rangeColumn(layer, u)
    for (let j = 0; j < rows; j++) {
      const point = rangePoint(layer, column, u, j / nt), k = i * rows + j
      positions[k * 3] = point.x; positions[k * 3 + 1] = point.y; positions[k * 3 + 2] = point.z
      rise[k] = column.crest > 0 ? point.y / column.crest : 0
    }
  }
  const indices = new Uint32Array(nx * nt * 6)
  let n = 0
  for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) {
    const a = i * rows + j, b = (i + 1) * rows + j
    // Counter-clockwise seen from above: normals point up and toward the camera.
    indices[n++] = a; indices[n++] = a + 1; indices[n++] = b
    indices[n++] = b; indices[n++] = a + 1; indices[n++] = b + 1
  }
  return { positions, rise, indices, columns, rows }
}

export const rangeVertexShader = /* glsl */`
attribute float rise;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vRise;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vRise = rise;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

// Snow on high, gentle ground and ridge lines; violet rock on steep faces; key light from the
// upper right with a lavender sky/ground fill; haze grows with distance and near the water.
export const rangeFragmentShader = /* glsl */`
uniform vec3 uRockDark, uRockLit, uSnow, uHaze, uSkyFill, uGroundFill, uKeyColor, uKeyDir;
uniform float uSnowLine, uHazeNear, uHazeFar, uHazeMax, uMistHeight;
uniform vec3 uAuroraLeft, uAuroraRight;
uniform float uAuroraGain;
${riverGlsl}
varying vec3 vNormal;
varying vec3 vWorld;
varying float vRise;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < OCTAVES; i++) { sum += amp * noise(p); p *= 2.03; amp *= 0.5; }
  return sum;
}
void main() {
  vec3 n = normalize(vNormal);
  float scale = 0.6 / max(1.0, length(vWorld - cameraPosition) * 0.02);
  float detail = fbm(vec2(vWorld.x, vWorld.y * 1.6 + vWorld.z * 0.3) * scale);
  float level = n.y + (detail - 0.5) * 0.35;
  float high = vRise + (detail - 0.5) * 0.22;
  // Snow clings to high ground; steep faces keep less, but crests still catch it.
  float snow = smoothstep(uSnowLine - 0.06, uSnowLine + 0.06, high) * smoothstep(0.62, 0.84, level + smoothstep(0.93, 1.0, vRise) * 0.25);
  float key = max(dot(n, normalize(uKeyDir)), 0.0);
  vec3 fill = mix(uGroundFill, uSkyFill, n.y * 0.5 + 0.5);
  vec3 rock = mix(uRockDark, uRockLit, smoothstep(0.25, 0.75, detail));
  vec3 color = mix(rock, uSnow, snow) * (fill + key * uKeyColor);
  float dist = length(vWorld - cameraPosition);
  // Haze stops short of the sky colour so the farthest ranges stay readable as pale shapes.
  float haze = smoothstep(uHazeNear, uHazeFar, dist) * uHazeMax;
  // Nearer ranges hide the lower slopes of those behind, so only the top of each range
  // shows. Mist starts just below the crests (uMistHeight = rise where it is full), so peaks
  // rise out of luminous mist and each range separates from the one behind it.
  float mist = 1.0 - smoothstep(uMistHeight, uMistHeight + 0.28, vRise + (detail - 0.5) * 0.12);
  vec3 hazed = mix(color, uHaze, haze);
  vec3 lit = mix(hazed, uHaze * 1.12, mist * mist * 0.75);
  // Aurora light (BR3): green from the left curtains, pink from the right, by screen side.
  // Snow and mist catch it most; bare rock only a little.
  float fx = 0.5 + 0.5 * vWorld.x / (max(1.0, ${CAMERA_Z.toFixed(3)} - vWorld.z) * cos(PITCH) * TAN_HALF_FOV * REF_ASPECT);
  vec3 aurora = mix(uAuroraLeft, uAuroraRight, smoothstep(0.3, 0.72, fx));
  lit += aurora * (0.025 + 0.14 * snow + 0.1 * mist) * uAuroraGain;
  // Rivers (BR6): screen position from world position with the fixed camera, so the mirrored
  // pass puts them on the same terrain. They glow through the mist, a little dimmed.
  vec3 rel = vWorld - vec3(0.0, ${CAMERA_HEIGHT.toFixed(3)}, ${CAMERA_Z.toFixed(3)});
  float cp = cos(PITCH), sp = sin(PITCH);
  float depth = rel.y * sp - rel.z * cp;
  vec2 f = vec2(rel.x / depth / (TAN_HALF_FOV * REF_ASPECT), (rel.y * cp + rel.z * sp) / depth / TAN_HALF_FOV);
  f = vec2((f.x + 1.0) * 0.5, (1.0 - f.y) * 0.5);
  // Embedded in the valleys: dimmer on steep faces, broken up by the surface detail.
  float embed = (0.45 + 0.55 * smoothstep(0.15, 0.65, n.y)) * (0.65 + 0.35 * smoothstep(0.3, 0.7, detail));
  lit += riverGlow(f) * embed * (1.0 - 0.45 * mist);
  gl_FragColor = vec4(lit, 1.0);
  #include <colorspace_fragment>
}`

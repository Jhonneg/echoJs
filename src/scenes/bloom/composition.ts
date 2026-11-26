// Bloom layout, measured from the Resonant Monolith reference (references/bloom/e9db88c2…png,
// 1672×941). Positions are screen fractions of a 16:9 frame (0 = top/left, 1 = bottom/right),
// converted to world space for a fixed, slightly upward-pitched perspective camera.
// Pure maths only, so framing can be tested without WebGL.

export const REFERENCE_ASPECT = 16 / 9
export const FOV_DEGREES = 40
const HALF_FOV = (FOV_DEGREES * Math.PI) / 360

// Camera just above the water, so the hovering monolith's base sits above the horizon.
export const CAMERA_HEIGHT = 0.3
export const HORIZON_FRACTION = 0.661
// Looking up lowers the horizon from screen centre to HORIZON_FRACTION.
export const CAMERA_PITCH = Math.atan((2 * HORIZON_FRACTION - 1) * Math.tan(HALF_FOV))
export const CAMERA_Z = 14

const fracToNdcY = (frac: number) => 1 - 2 * frac
const fracToNdcX = (frac: number) => 2 * frac - 1

// World height whose projection at `distance` ahead of the camera lands at `frac` of the screen.
export function heightForScreen(frac: number, distance: number) {
  const t = fracToNdcY(frac) * Math.tan(HALF_FOV)
  return CAMERA_HEIGHT + distance * Math.tan(CAMERA_PITCH + Math.atan(t))
}

// World x at `distance` for a horizontal screen fraction of the 16:9 reference frame.
// Other aspects show more or less width around the same centre.
export function xForScreen(frac: number, distance: number) {
  return fracToNdcX(frac) * distance * Math.cos(CAMERA_PITCH) * Math.tan(HALF_FOV) * REFERENCE_ASPECT
}

// Project a world point to screen fractions for a given aspect (used by tests and evidence).
export function projectToScreen(x: number, y: number, z: number, aspect: number) {
  const dy = y - CAMERA_HEIGHT, dz = z - CAMERA_Z
  const cy = dy * Math.cos(CAMERA_PITCH) + dz * Math.sin(CAMERA_PITCH)
  const depth = dy * Math.sin(CAMERA_PITCH) - dz * Math.cos(CAMERA_PITCH)
  const ndcX = x / depth / (Math.tan(HALF_FOV) * aspect)
  const ndcY = cy / depth / Math.tan(HALF_FOV)
  return { x: (ndcX + 1) / 2, y: (1 - ndcY) / 2 }
}

// BR7: the actual camera adapts to the screen shape. Landscape screens keep the reference
// framing above (fixed vertical field of view). Narrower screens widen the view so at least
// `coverage` of the reference's width stays visible, and raise the horizon so open water
// shows above the controls. Sky, aurora, rivers and reflections are tied to the world (they
// map through the fixed reference camera above), so they stay correct whatever the camera.
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const ADAPTIVE = { coverage: 0.5, portraitHorizon: 0.53 }
export function cameraFor(aspect: number) {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : REFERENCE_ASPECT
  const tanRef = Math.tan(HALF_FOV)
  // Widen only when the screen would show less than `coverage` of the reference width
  // (narrower than about 0.89:1); smooth and never wider as the screen widens.
  const tanHalf = Math.max(tanRef, (tanRef * REFERENCE_ASPECT * ADAPTIVE.coverage) / a)
  // Raise the horizon only as far as the view has widened, so there is room above the monolith.
  const widened = smooth01(1, (REFERENCE_ASPECT * ADAPTIVE.coverage) / 0.46, tanHalf / tanRef) // 1 at a phone
  const horizon = HORIZON_FRACTION - (HORIZON_FRACTION - ADAPTIVE.portraitHorizon) * widened
  return { fovDegrees: (Math.atan(tanHalf) * 360) / Math.PI, tanHalf, pitch: Math.atan((2 * horizon - 1) * tanHalf), horizon }
}

// Project a world point to screen fractions for the actual camera at a given aspect.
export function projectForAspect(x: number, y: number, z: number, aspect: number) {
  const cam = cameraFor(aspect)
  const dy = y - CAMERA_HEIGHT, dz = z - CAMERA_Z
  const cy = dy * Math.cos(cam.pitch) + dz * Math.sin(cam.pitch)
  const depth = dy * Math.sin(cam.pitch) - dz * Math.cos(cam.pitch)
  return { x: (x / depth / (cam.tanHalf * aspect) + 1) / 2, y: (1 - cy / depth / cam.tanHalf) / 2 }
}

// Monolith: centred, top 6.4% / bottom 62.7%, 9% of the frame wide including the side face
// that shows because the slab is turned (BR4). Sized at its front (world z = 0); the box
// extends back from there and turns about its own centre.
const MONOLITH_DISTANCE = CAMERA_Z
export const MONOLITH_YAW = -0.39 // negative turns the right side face toward the camera (~22% of its width, as in the reference)
const MONOLITH_DEPTH_RATIO = 0.68
export const MONOLITH = (() => {
  const bottom = heightForScreen(0.627, MONOLITH_DISTANCE)
  const top = heightForScreen(0.064, MONOLITH_DISTANCE)
  const span = 2 * xForScreen(0.545, MONOLITH_DISTANCE)
  // Turned, the visible width is width·cos + depth·sin: shrink so the total stays 9%.
  const width = span / (Math.cos(MONOLITH_YAW) + MONOLITH_DEPTH_RATIO * Math.abs(Math.sin(MONOLITH_YAW)))
  const depth = width * MONOLITH_DEPTH_RATIO
  return { width, height: top - bottom, depth, bottom, yaw: MONOLITH_YAW, center: [0, (top + bottom) / 2, -depth / 2] as const }
})()
// Seam: a thin bright line down the front face, a little left of centre (fraction across).
export const SEAM = { u: 0.44, halfWidth: 0.012, top: 0.035, bottom: 0.965 }

// Two small crystals: left at mid height, right lower, slightly in front of the monolith.
export const CRYSTALS = [
  { distance: 13, x: 0.43, y: 0.367, size: 0.16 },
  { distance: 13.5, x: 0.574, y: 0.507, size: 0.11 },
].map(c => ({ size: c.size, position: [xForScreen(c.x, c.distance), heightForScreen(c.y, c.distance), CAMERA_Z - c.distance] as const }))

// Mountain ranges, far to near. Tops are screen fractions of the 16:9 frame: low in the
// central valley behind the monolith, rising to jagged peaks towards the edges.
export interface RangeLayer {
  distance: number
  band: number // depth of the 3D band in front of the crest, as a fraction of distance
  snow: number // snow line, as a fraction of the crest height (>1: no snow)
  valley: number // top fraction at the centre
  edge: number // top fraction towards the sides
  peaks: readonly (readonly [u: number, rise: number, width: number])[] // extra height, as screen fraction
  jag: number // small irregularity, as screen fraction
  seed: number
}
export const RANGES: readonly RangeLayer[] = [
  { distance: 190, band: 0.3, snow: 0.78, valley: 0.565, edge: 0.44, peaks: [[-0.35, 0.05, 0.12], [0.42, 0.06, 0.14]], jag: 0.008, seed: 1 },
  { distance: 125, band: 0.32, snow: 0.82, valley: 0.6, edge: 0.34, peaks: [[-0.64, 0.17, 0.16], [-0.42, 0.08, 0.1], [0.68, 0.1, 0.14], [0.88, 0.11, 0.1]], jag: 0.016, seed: 2 },
  { distance: 85, band: 0.36, snow: 0.87, valley: 0.62, edge: 0.42, peaks: [[-0.78, 0.06, 0.12], [0.6, 0.07, 0.12]], jag: 0.014, seed: 3 },
  { distance: 52, band: 0.4, snow: 0.94, valley: 0.645, edge: 0.5, peaks: [[-0.9, 0.05, 0.14], [0.82, 0.05, 0.14]], jag: 0.01, seed: 4 },
  { distance: 33, band: 0.42, snow: 1.5, valley: 0.66, edge: 0.58, peaks: [], jag: 0.006, seed: 5 },
]

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
// Deterministic jagged detail: a few incommensurate sines, so ridges are irregular but stable.
const jagged = (u: number, seed: number) =>
  Math.sin(u * 23.1 + seed * 1.7) * 0.5 + Math.sin(u * 47.3 + seed * 3.1) * 0.3 + Math.abs(Math.sin(u * 91.7 + seed)) * 0.4 - 0.2

// Top of a range at u (-1 left edge … 1 right edge of the 16:9 frame; wider aspects use |u| > 1).
export function rangeTop(layer: RangeLayer, u: number) {
  let top = layer.valley - (layer.valley - layer.edge) * smoothstep(0.12, 0.8, Math.abs(u))
  for (const [center, rise, width] of layer.peaks) top -= rise * Math.exp(-(((u - center) / width) ** 2))
  top -= layer.jag * jagged(u, layer.seed)
  return Math.min(top, HORIZON_FRACTION)
}

// Silhouette outline in world units (x, y), for |u| up to `reach` (covers ultra-wide screens).
export function rangeOutline(layer: RangeLayer, samples = 160, reach = 1.7): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const u = -reach + (2 * reach * i) / samples
    points.push([xForScreen((u + 1) / 2, layer.distance), heightForScreen(rangeTop(layer, u), layer.distance)])
  }
  return points
}

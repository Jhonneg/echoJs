// Sun-cut pass: a distant ridge in front of the sun. Pure profile and geometry helpers (testable
// without three.js). The sun stays 88 m ahead of the camera while the terrain streams past, so the
// far valley floor cut the disc with a straight line. This ridge travels with the camera like the
// sun, 75 m ahead, and its peaks overlap the disc's lower part irregularly, with a V where the
// valley opens (owner option b: about 20-30% of the visible disc).

export const SUN = { distance: 88, y: 6, radius: 9.2 }
export const CAMERA_Y = 3.5
export const RIDGE = {
  distance: 75,
  bottom: -4, // below the valley floor, so no gap shows under it
  // Peaks in sun-plane units (x across, y height): where they appear against the sun's disc.
  // A V at the centre, a few overlapping peaks on each side, lower towards the ends.
  peaks: [
    { x: -30, y: 1.0 }, { x: -22, y: 3.2 }, { x: -16, y: 2.1 }, { x: -11.5, y: 5.6 }, { x: -8.2, y: 3.9 },
    { x: -5.6, y: 5.5 }, { x: -3.1, y: 3.0 }, { x: -0.8, y: 0.9 }, { x: 1.2, y: 1.3 }, { x: 3.4, y: 4.4 },
    { x: 5.3, y: 3.2 }, { x: 7.6, y: 5.7 }, { x: 10.4, y: 4.6 }, { x: 13.8, y: 6.1 }, { x: 18.5, y: 2.6 },
    { x: 24, y: 3.6 }, { x: 31, y: 1.0 },
  ],
  // The far floor's line against the sun today (sun-plane y): the disc is visible above it.
  floorLine: -0.1,
} as const

// Sun-plane height of the ridge outline at x (sun-plane units): straight segments between peaks,
// like the faceted mountains; flat at the outermost peaks' height beyond them.
export function ridgeHeight(x: number) {
  const p = RIDGE.peaks
  if (x <= p[0].x) return p[0].y
  for (let i = 1; i < p.length; i++) {
    if (x <= p[i].x) {
      const t = (x - p[i - 1].x) / (p[i].x - p[i - 1].x)
      return p[i - 1].y + (p[i].y - p[i - 1].y) * t
    }
  }
  return p[p.length - 1].y
}

// From the sun's plane to the ridge's plane, as seen from the camera (on the axis, at CAMERA_Y).
export function toRidgePlane(x: number, y: number) {
  const k = RIDGE.distance / SUN.distance
  return { x: x * k, y: CAMERA_Y + (y - CAMERA_Y) * k }
}

// Share of the currently visible disc (above the floor line) that the ridge covers.
export function discCoverage(samples = 400) {
  let visible = 0, covered = 0
  for (let i = 0; i < samples; i++) for (let j = 0; j < samples; j++) {
    const x = -SUN.radius + (i + 0.5) * 2 * SUN.radius / samples
    const y = SUN.y - SUN.radius + (j + 0.5) * 2 * SUN.radius / samples
    if (Math.hypot(x, y - SUN.y) > SUN.radius || y < RIDGE.floorLine) continue
    visible++
    if (y < ridgeHeight(x)) covered++
  }
  return covered / visible
}

// The ridge as a strip in its own plane: for each outline point, a top vertex and a bottom vertex.
// `edge` is the height below the outline (0 on top), for the rim and base glow in the shader.
export function ridgeStrip(step = 0.25) {
  const first = RIDGE.peaks[0].x, last = RIDGE.peaks[RIDGE.peaks.length - 1].x
  const xs: number[] = []
  for (let x = first; x < last; x += step) xs.push(x)
  for (const p of RIDGE.peaks) xs.push(p.x) // keep every peak sharp
  xs.push(last)
  const sorted = [...new Set(xs.map(x => Math.round(x * 1000) / 1000))].sort((a, b) => a - b)
  const positions: number[] = [], edges: number[] = [], index: number[] = []
  sorted.forEach((x, i) => {
    const top = toRidgePlane(x, ridgeHeight(x)), bottom = toRidgePlane(x, RIDGE.bottom)
    positions.push(top.x, top.y, 0, bottom.x, bottom.y, 0)
    edges.push(0, top.y - bottom.y)
    if (i > 0) { const a = (i - 1) * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  })
  return { positions: new Float32Array(positions), edges: new Float32Array(edges), index }
}

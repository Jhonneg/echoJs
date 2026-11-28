// BR6: glowing rivers winding down the valleys. Each river is a path in the reference's 16:9
// screen fractions; the mountain shader (ranges.ts) makes whichever terrain surface shows at
// that spot glow. A river can therefore flow across several ranges, vanish behind a ridge,
// and nothing can cut through it. The screen position is computed from world position with
// the fixed camera, so the BR5 mirrored pass shows the rivers on the same terrain, reflected.

const TAU = Math.PI * 2

export interface River {
  path: readonly (readonly [x: number, y: number])[] // source to mouth, screen fractions
  color: string
  strength: number
  period: number // flow pulse loop, seconds
  lowQuality: boolean // kept on Low
}

// Measured from the reference: pink snaking down the left ranges, teal winding down from the
// right peaks, and a fainter violet one lower and further right.
export const RIVERS: readonly River[] = [
  { path: [[0.08, 0.425], [0.14, 0.445], [0.2, 0.47], [0.25, 0.5], [0.29, 0.53], [0.33, 0.56], [0.32, 0.59], [0.35, 0.62]], color: '#f49ad2', strength: 1.3, period: 11, lowQuality: true },
  { path: [[0.86, 0.34], [0.83, 0.38], [0.81, 0.415], [0.78, 0.44], [0.75, 0.465], [0.72, 0.49], [0.69, 0.515]], color: '#7fe8d8', strength: 1, period: 14, lowQuality: true },
  { path: [[0.9, 0.48], [0.85, 0.505], [0.8, 0.53], [0.75, 0.555], [0.71, 0.585]], color: '#b98cf0', strength: 0.7, period: 17, lowQuality: false },
]

export const RIVER_POINTS = 28 // per river, after smoothing and meander
import { REFERENCE_ASPECT } from './composition.ts'

// Catmull-Rom through the control points, sampled to a fixed count, then meandered: a
// sideways S-wave (in aspect-correct screen space) that fades out at both ends.
export const MEANDER = { amplitude: 0.011, cycles: 3 }
export function riverPath(river: River, samples = RIVER_POINTS): [number, number][] {
  const smooth = curve(river.path, samples)
  return smooth.map(([x, y], i) => {
    const a = smooth[Math.max(0, i - 1)], b = smooth[Math.min(samples - 1, i + 1)]
    const tx = (b[0] - a[0]) * REFERENCE_ASPECT, ty = b[1] - a[1], len = Math.hypot(tx, ty) || 1
    const s = i / (samples - 1), taper = Math.sin(Math.PI * s)
    const w = MEANDER.amplitude * taper * Math.sin(s * MEANDER.cycles * TAU + river.period)
    return [x - (ty / len) * w / REFERENCE_ASPECT, y + (tx / len) * w]
  })
}
function curve(points: River['path'], samples: number): [number, number][] {
  const out: [number, number][] = []
  for (let s = 0; s < samples; s++) {
    const f = (s / (samples - 1)) * (points.length - 1), i = Math.min(points.length - 2, Math.floor(f)), t = f - i
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)]
    const c = (k: 0 | 1) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)
    out.push([c(0), c(1)])
  }
  return out
}

// Screen bounding box per river (min x, min y, max x, max y) grown by a margin wider than the
// glow's halo (BR7): the shader skips a river entirely for pixels outside it.
export const RIVER_BOX_MARGIN = 0.035
export function riverBox(river: River): [number, number, number, number] {
  const path = riverPath(river), xs = path.map(p => p[0]), ys = path.map(p => p[1])
  const mx = RIVER_BOX_MARGIN / REFERENCE_ASPECT, my = RIVER_BOX_MARGIN
  return [Math.min(...xs) - mx, Math.min(...ys) - my, Math.max(...xs) + mx, Math.max(...ys) + my]
}

// Flow pulse phase per river; reduced motion holds a steady glow.
export const RIVER_STILL_TIME = 3
export function riverPhases(seconds: number, reducedMotion: boolean) {
  const t = reducedMotion || !Number.isFinite(seconds) ? RIVER_STILL_TIME : seconds
  return RIVERS.map(r => ((t % r.period + r.period) % r.period) / r.period * TAU)
}

// GLSL added to the mountain shader: glow for the terrain fragment at screen position f.
// Bright core plus soft halo, soft pulses drifting downstream, faded at both ends.
export const riverGlsl = /* glsl */`
uniform vec2 uRiverPts[${RIVERS.length * RIVER_POINTS}];
uniform vec3 uRiverColor[${RIVERS.length}];
uniform vec3 uRiverStrength;
uniform vec3 uRiverPhase;
uniform vec4 uRiverBox[${RIVERS.length}];
uniform float uRiverGain; // BR8: brighter with the mids
uniform vec2 uRiverPulse; // BR8 mid hit: position along the rivers (0 source … 1 mouth), strength
uniform float uRiverWidth, uRiverFlash; // halo widening with the mids (1–2); bass flash (0–1)
vec3 riverGlow(vec2 f) {
  vec3 glowSum = vec3(0.0);
  for (int r = 0; r < RIVER_COUNT; r++) {
    vec4 box = uRiverBox[r];
    if (f.x < box.x || f.y < box.y || f.x > box.z || f.y > box.w) continue; // far from this river
    float best = 1e3, along = 0.0, total = 0.0, at = 0.0;
    for (int i = 0; i < ${RIVER_POINTS - 1}; i++) {
      vec2 a = uRiverPts[r * ${RIVER_POINTS} + i], b = uRiverPts[r * ${RIVER_POINTS} + i + 1];
      vec2 ab = (b - a) * vec2(REF_ASPECT, 1.0), ap = (f - a) * vec2(REF_ASPECT, 1.0);
      float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
      float d = length(ap - ab * h);
      if (d < best) { best = d; at = total + h * length(ab); }
      total += length(ab);
    }
    along = at / max(total, 1e-4);
    float w = mix(0.0022, 0.0048, along); // thin at the source, wider toward the mouth
    float core = exp(-pow(best / (w * mix(1.0, uRiverWidth, 0.35)), 2.0));
    float glow = core * 1.15 + exp(-pow(best / (w * 3.2 * uRiverWidth), 2.0)) * 0.3;
    float flow = 0.72 + 0.28 * sin(along * 22.0 - uRiverPhase[r]);
    float ends = smoothstep(0.0, 0.08, along) * smoothstep(1.0, 0.8, along);
    float pd = (along - uRiverPulse.x) / 0.08;
    float pulse = exp(-pd * pd) * uRiverPulse.y * core * 3.5;
    glowSum += uRiverColor[r] * (glow * (flow * uRiverGain + 2.0 * uRiverFlash) + pulse) * ends * uRiverStrength[r];
  }
  return glowSum;
}`

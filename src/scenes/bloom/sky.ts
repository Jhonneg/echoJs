// BR3: sky dome and aurora curtains, placed from the Resonant Monolith reference in the same
// 16:9 screen fractions as composition.ts. The dome shader works from the view direction, so
// a mirrored camera (BR5 reflections) sees a correct mirrored sky for free.
import { CAMERA_PITCH, FOV_DEGREES, REFERENCE_ASPECT } from './composition.ts'

// A curtain: its bright lower edge runs from (x0, y0) to (x1, y1) in screen fractions and the
// rays rise `height` above it. Colours are sRGB hex; `strength` is relative brightness.
export interface Curtain {
  x0: number, y0: number, x1: number, y1: number
  height: number, color: string, strength: number, period: number
  side: 'left' | 'right'
  lowQuality: boolean // kept on Low quality
}
export const CURTAINS: readonly Curtain[] = [
  { x0: -0.25, y0: 0.12, x1: 0.44, y1: 0.36, height: 0.26, color: '#79f0c6', strength: 1, period: 41, side: 'left', lowQuality: true },
  { x0: -0.2, y0: 0.02, x1: 0.32, y1: 0.16, height: 0.16, color: '#62d8c0', strength: 0.55, period: 29, side: 'left', lowQuality: false },
  { x0: 0.57, y0: 0.44, x1: 0.76, y1: 0.33, height: 0.4, color: '#b48cf0', strength: 0.75, period: 53, side: 'right', lowQuality: false },
  { x0: 0.7, y0: 0.32, x1: 1.25, y1: 0.18, height: 0.34, color: '#f29ad6', strength: 1, period: 37, side: 'right', lowQuality: true },
]

// Pose shown with reduced motion: a fixed moment of the loop.
export const STILL_TIME = 12

// Phase (radians, wrapped) for each curtain at `seconds`. Wrapping keeps the shader's sin/cos
// continuous, so the motion loops seamlessly; reduced motion holds the still pose.
export function curtainPhases(seconds: number, reducedMotion: boolean) {
  const t = reducedMotion || !Number.isFinite(seconds) ? STILL_TIME : seconds
  return CURTAINS.map(c => ((t / c.period) % 1) * Math.PI * 2)
}

// Overall aurora brightness: a slow breathing between 0.85 and 1, shared with the light the
// aurora casts on the mountains so sky and land stay in sync.
export function auroraGain(phases: readonly number[]) {
  return 0.925 + 0.075 * Math.sin(phases[0] * 2 + 0.6)
}

// Shader constants derived from the camera, so the dome lines up with the layout.
export const SKY_DEFINES = {
  TAN_HALF_FOV: Math.tan((FOV_DEGREES * Math.PI) / 360).toFixed(6),
  REF_ASPECT: REFERENCE_ASPECT.toFixed(6),
  PITCH: CAMERA_PITCH.toFixed(6),
}

export const skyVertexShader = /* glsl */`
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

// Curtains are evaluated in reference screen fractions (fx, fy: 0 = left/top) of the fixed
// camera, computed from the world view direction.
export const skyFragmentShader = /* glsl */`
uniform vec3 uTop, uMid, uHorizon, uHorizonPink;
uniform vec3 uColor[4];
uniform vec4 uEdge[4]; // x0, y0, x1, y1
uniform vec2 uShape[4]; // height, strength
uniform vec4 uPhase;
uniform float uGain;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < RAY_OCTAVES; i++) { sum += amp * noise(p); p *= 2.1; amp *= 0.5; }
  return sum;
}
float curtain(vec2 f, int i, float phase) {
  vec4 e = uEdge[i];
  float along = clamp((f.x - e.x) / (e.z - e.x), 0.0, 1.0);
  // Folds: large slow S-curves plus small ripples along the lower edge.
  float edge = mix(e.y, e.w, along) + 0.045 * sin(along * 6.2 + phase) + 0.012 * sin(f.x * 29.0 - phase * 2.0);
  float above = edge - f.y; // > 0 above the lower edge
  float fade = above > 0.0 ? exp(-above / uShape[i].x * 2.6) : exp(above * 70.0);
  float ends = smoothstep(0.0, 0.15, along) * smoothstep(1.0, 0.8, along);
  // Fine streaks leaning with the fold, drifting on a circle in noise space (seamless loop).
  vec2 drift = vec2(cos(phase), sin(phase)) * 0.28; // small circle: gentle shimmer
  float slant = f.x + above * 0.45 + 0.03 * sin(above * 12.0 + phase);
  float rays = fbm(vec2(slant * 150.0, above * 3.0) + drift);
  float soft = fbm(vec2(slant * 18.0, above * 1.5) - drift);
  rays = smoothstep(0.35, 0.8, rays) * 0.3 + smoothstep(0.38, 0.68, soft) * 0.7;
  return fade * ends * (0.12 + 1.15 * rays) * uShape[i].y;
}
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  // Reflections (BR5) see the dome from below; use the mirrored direction there.
  d.y = abs(d.y);
  float cp = cos(PITCH), sp = sin(PITCH);
  float cy = d.y * cp + d.z * sp, depth = d.y * sp - d.z * cp;
  vec2 f = vec2(d.x / depth / (TAN_HALF_FOV * REF_ASPECT), cy / depth / TAN_HALF_FOV);
  f = vec2((f.x + 1.0) * 0.5, (1.0 - f.y) * 0.5);
  float elevation = clamp(1.0 - f.y / 0.661, 0.0, 1.0); // 0 at the horizon, 1 at the top
  vec3 horizon = mix(uHorizon, uHorizonPink, smoothstep(0.35, 1.1, f.x));
  vec3 sky = mix(horizon, uMid, smoothstep(0.0, 0.45, elevation));
  sky = mix(sky, uTop, smoothstep(0.4, 1.0, elevation));
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    #if LOW_QUALITY
    if (i == 1 || i == 2) continue;
    #endif
    glow += uColor[i] * curtain(f, i, uPhase[i]);
  }
  gl_FragColor = vec4(sky + glow * uGain * 0.85, 1.0);
  #include <colorspace_fragment>
}`

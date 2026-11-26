// BR4: the monolith and its two crystals. Pure motion helpers (testable) and shaders.
// Lit by a key from the right plus the shared BR3 aurora light, so they stay in sync with the sky.
import { MONOLITH, SEAM } from './composition.ts'

const TAU = Math.PI * 2
const wrap = (t: number, period: number) => ((t % period) + period) % period / period * TAU

// Gentle hover: about 1% of the monolith's height over ~9 s, with a faint yaw sway.
// Reduced motion (or a bad clock) returns the exact rest pose, which is the approved layout.
export const HOVER = { lift: MONOLITH.height * 0.01, period: 9, sway: 0.006, swayPeriod: 23 }
export function monolithHover(seconds: number, reducedMotion: boolean) {
  if (reducedMotion || !Number.isFinite(seconds)) return { y: 0, yaw: 0 }
  return { y: HOVER.lift * Math.sin(wrap(seconds, HOVER.period)), yaw: HOVER.sway * Math.sin(wrap(seconds, HOVER.swayPeriod)) }
}

// Crystals bob and turn slowly, each on its own timing.
const CRYSTAL_MOTION = [{ bob: 0.05, period: 7.3, spin: 31, phase: 0.4 }, { bob: 0.035, period: 5.9, spin: 23, phase: 2.1 }]
export function crystalPose(index: number, seconds: number, reducedMotion: boolean) {
  const m = CRYSTAL_MOTION[index], rest = { y: 0, spin: m.phase }
  if (reducedMotion || !Number.isFinite(seconds)) return rest
  return { y: m.bob * Math.sin(wrap(seconds, m.period) + m.phase), spin: wrap(seconds, m.spin) + m.phase }
}

export const monolithVertexShader = /* glsl */`
varying vec3 vLocal;
varying vec3 vLocalNormal;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vLocal = position;
  vLocalNormal = normal;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

// Dark varied stone with fine cracks, one long diagonal crack on the right face and worn,
// lighter edges. The seam is drawn here with derivative antialiasing and a soft glow.
export const monolithFragmentShader = /* glsl */`
uniform vec3 uSize; // width, height, depth
uniform vec3 uStoneDark, uStoneLight, uKeyColor, uKeyDir, uAmbient, uSeam, uAuroraLeft, uAuroraRight;
uniform float uAuroraGain;
uniform float uSeamGain, uLightLift; // BR8 seam brightness (BR9: follows the bass); scene light lift
uniform vec3 uSeamWarm; uniform float uSeamWarmth, uMood; // BR9: warm throbbing seam; night mood
varying vec3 vLocal;
varying vec3 vLocalNormal;
varying vec3 vNormal;
varying vec3 vWorld;
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + 1.0), u.x), u.y), u.z);
}
float fbm(vec3 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < OCTAVES; i++) { sum += amp * noise(p); p *= 2.07; amp *= 0.5; }
  return sum;
}
float crackLine(float d, float width) {
  float aa = fwidth(d) + 1e-4;
  return 1.0 - smoothstep(width - aa, width + aa, abs(d));
}
void main() {
  vec3 n = normalize(vNormal), ln = normalize(vLocalNormal);
  vec3 q = vLocal / uSize + 0.5; // 0..1 across the box
  // Face coordinates: (across, up) on the face this fragment belongs to.
  vec2 uv = abs(ln.z) > 0.5 ? q.xy : abs(ln.x) > 0.5 ? vec2(q.z, q.y) : q.xz;
  float grain = fbm(vLocal * vec3(3.2, 1.4, 3.2));
  float fine = fbm(vLocal * 11.0 + 7.0);
  vec3 stone = mix(uStoneDark, uStoneLight, smoothstep(0.25, 0.8, grain) * 0.45 + fine * 0.55);
  // Fine cracks: thin lines where ridged noise peaks.
  float r = 1.0 - abs(2.0 * noise(vLocal * vec3(5.0, 1.6, 5.0) + 3.0) - 1.0);
  float cracks = smoothstep(0.975, 0.995, r) * 0.35;
  // One long diagonal crack across the right face, as in the reference.
  if (ln.x > 0.5) {
    float wiggle = 0.02 * sin(uv.y * 40.0) + 0.012 * sin(uv.y * 97.0);
    cracks = max(cracks, crackLine(uv.x - (0.15 + uv.y * 0.55) + wiggle, 0.012) * smoothstep(0.25, 0.35, uv.y) * smoothstep(0.85, 0.75, uv.y));
  }
  stone *= 1.0 - cracks;
  // Worn, slightly lighter edges.
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  stone += (1.0 - smoothstep(0.0, 0.05, edge)) * 0.05 * (0.5 + fine);
  // Light: key from the right, aurora green from the left and pink from the right.
  float key = max(dot(n, normalize(uKeyDir)), 0.0);
  float fromLeft = max(dot(n, normalize(vec3(-1.0, 0.35, 0.4))), 0.0);
  float fromRight = max(dot(n, normalize(vec3(1.0, 0.4, 0.3))), 0.0);
  vec3 light = uAmbient + key * uKeyColor + (uAuroraLeft * fromLeft + uAuroraRight * fromRight) * 0.22 * uAuroraGain;
  vec3 color = stone * light * (1.0 + uLightLift) * (1.0 - 0.2 * uMood);
  // Seam: thin bright core with smooth edges, a soft glow on the stone, faded at the ends.
  if (ln.z > 0.5) {
    float d = (uv.x - SEAM_U) * uSize.x;
    float aa = fwidth(d) + 1e-4;
    float core = 1.0 - smoothstep(SEAM_HALF - aa, SEAM_HALF + aa, abs(d));
    float glow = exp(-abs(d) / 0.045);
    float ends = smoothstep(SEAM_TOP, SEAM_TOP + 0.02, uv.y) * smoothstep(SEAM_BOTTOM, SEAM_BOTTOM - 0.02, uv.y);
    vec3 seam = mix(uSeam, uSeamWarm, uSeamWarmth);
    color += seam * (core * 1.6 + glow * 0.2 * uSeamGain) * ends * mix(1.0, uSeamGain, 0.6);
  }
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

export const MONOLITH_DEFINES = {
  SEAM_U: SEAM.u.toFixed(4), SEAM_HALF: SEAM.halfWidth.toFixed(4),
  SEAM_TOP: SEAM.top.toFixed(4), SEAM_BOTTOM: SEAM.bottom.toFixed(4),
}

export const crystalVertexShader = /* glsl */`
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

// Flat-lit facets with a cool tint and a faint aurora rim.
export const crystalFragmentShader = /* glsl */`
uniform vec3 uBase, uKeyColor, uKeyDir, uAmbient, uAuroraLeft, uAuroraRight;
uniform float uAuroraGain;
uniform float uSparkle; // BR8: faint edge sparkle with the highs
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 n = normalize(vNormal), view = normalize(cameraPosition - vWorld);
  float key = max(dot(n, normalize(uKeyDir)), 0.0);
  float rim = pow(1.0 - abs(dot(n, view)), 2.0);
  vec3 aurora = mix(uAuroraLeft, uAuroraRight, step(0.0, vWorld.x)) * uAuroraGain;
  vec3 color = uBase * (uAmbient + key * uKeyColor) + aurora * rim * 0.35 * (1.0 + uSparkle * 2.0);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

import { SUN_CENTER_GLSL, SUN_SHAPE } from './corona.ts'
import { clampSignal, smooth } from '../../audio/signal.ts'
import type { Corona } from './corona.ts'

const HISTORY = 256
export const GLINT_DELAYS = [0, .18, .34, .5, 0, 0] as const
export const createIllumination = () => ({ session: -1, time: 0, coronaLight: 0, mist: 0,
  glints: new Float64Array(6), times: new Float64Array(HISTORY), levels: new Float64Array(HISTORY), cursor: 0, count: 0 })
export type Illumination = ReturnType<typeof createIllumination>

function sample(state: Illumination, time: number) {
  let newerTime = state.time, newerLevel = state.coronaLight
  for (let i = 0; i < state.count; i++) {
    const index = (state.cursor - 1 - i + HISTORY) % HISTORY
    const olderTime = state.times[index], olderLevel = state.levels[index]
    if (olderTime <= time) {
      const span = newerTime - olderTime
      return span > 0 ? olderLevel + (newerLevel - olderLevel) * Math.min(1, (time - olderTime) / span) : olderLevel
    }
    newerTime = olderTime; newerLevel = olderLevel
  }
  // Before the oldest sample, assume its level was held. Treating unknown
  // prehistory as black would invent a glint when a steady source resumes.
  return newerLevel
}

// Visual propagation of the approved corona, not another onset/audio detector.
export function updateIllumination(state: Illumination, corona: Corona, fresh: boolean,
  delta: number, reactivity: number, reducedMotion: boolean) {
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  const gain = clampSignal(reactivity)
  if (state.session !== corona.session || gain === 0) {
    state.session = corona.session; state.coronaLight = state.mist = 0
    state.count = state.cursor = 0; state.glints.fill(0)
  }
  state.time += dt
  if (gain === 0) return state
  // Corona channels already include gain and their release; no second gain scaling.
  const target = clampSignal(.55 * corona.envelope + .30 * corona.detail + .35 * Math.max(corona.lowAccent, corona.midAccent, corona.highAccent))
  state.coronaLight = smooth(state.coronaLight, target, dt, reducedMotion ? .8 : .12, reducedMotion ? 1.5 : .7)
  if (target === 0 && state.coronaLight < .0001) state.coronaLight = 0
  state.mist = smooth(state.mist, state.coronaLight, dt, reducedMotion ? .8 : .45, 1.1)
  if (state.coronaLight === 0 && state.mist < .0001) state.mist = 0
  if (!fresh || reducedMotion) {
    state.glints.fill(0); state.count = state.cursor = 0
    return state
  }
  if (dt > 0) {
    state.times[state.cursor] = state.time; state.levels[state.cursor] = state.coronaLight
    state.cursor = (state.cursor + 1) % HISTORY; state.count = Math.min(HISTORY, state.count + 1)
  }
  for (let i = 0; i < state.glints.length; i++) {
    const delay = GLINT_DELAYS[i]
    const rise = delay > 0 ? clampSignal((sample(state, state.time - delay) - sample(state, state.time - delay - .09)) * 4) : 0
    state.glints[i] = smooth(state.glints[i], rise, dt, .025, .22)
    if (rise === 0 && state.glints[i] < .0001) state.glints[i] = 0
  }
  return state
}

export const skyIllumination = `
uniform float coronaLight;
float coronaSkyMask(vec2 position) {
  vec2 p = (position - ${SUN_CENTER_GLSL}) / (vec2(3.8, 2.7) * ${SUN_SHAPE.lightReach.toFixed(3)});
  float radius = length(p);
  float emitter = coronaSunRadius * coronaRadiusRatio;
  float outsideEmitter = smoothstep(emitter, emitter + 0.3, length(position - ${SUN_CENTER_GLSL}));
  return exp(-dot(p,p) * 1.8) * (1.0 - smoothstep(0.95, 1.35, radius)) * outsideEmitter;
}
`

export const ridgeIllumination = `
uniform sampler2D terrainProfiles;
uniform float ridgeIndex;
uniform float terrainOffset;
uniform float nextOffset;
uniform float coronaLight;
uniform float mistLight;
uniform float glintLight;

float profileHeight(float x, float row) {
  float at = mod(x + 12.0, 24.0) * 8.0;
  float first = floor(at);
  float a = texture2D(terrainProfiles, vec2((first + 0.5) / 193.0, (row + 0.5) / 6.0)).r;
  float b = texture2D(terrainProfiles, vec2((first + 1.5) / 193.0, (row + 0.5) / 6.0)).r;
  return mix(a, b, fract(at));
}
vec3 illuminateRidge(vec3 color, vec2 localPosition) {
  if (ridgeIndex > 3.5 || coronaLight + mistLight + glintLight <= 0.0) return color;
  vec2 position = vec2(localPosition.x + terrainOffset, localPosition.y);
  vec2 p = (position - ${SUN_CENTER_GLSL}) / (vec2(3.8, 4.8) * ${SUN_SHAPE.lightReach.toFixed(3)});
  float radius = length(p);
  float field = exp(-dot(p,p) * 1.25) * (1.0 - smoothstep(1.1, 1.5, radius));
  if (field <= 0.0) return color;
  float belowEdge = max(0.0, profileHeight(localPosition.x, ridgeIndex) - position.y);
  float depthWeight = exp(-ridgeIndex * 0.65);
  float slope = exp(-belowEdge / 0.75);
  float edge = exp(-belowEdge / 0.065);
  float direct = coronaLight * depthWeight * field * (0.22 * slope + 0.30 * edge);
  float glint = glintLight * field * edge * 0.28;
  color = mix(color, vec3(1.0, 0.85, 0.78), min(0.36, direct + glint));
  // Mist is painted just behind the next authored ridge's low valleys.
  if (ridgeIndex < 1.5) {
    float nextHeight = profileHeight(position.x - nextOffset, ridgeIndex + 1.0);
    float valley = 1.0 - smoothstep(-0.5, 0.9, nextHeight);
    float band = exp(-pow((position.y - nextHeight - 0.12) / 0.30, 2.0));
    float mist = mistLight * field * valley * band * 0.20;
    color = mix(color, vec3(0.96, 0.83, 0.89), min(0.14, mist));
  }
  return color;
}
`

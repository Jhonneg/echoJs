import { clampSignal, smooth } from '../../audio/signal.ts'
import type { LavenderResponse } from './response.ts'

export const CORONA_SETTINGS = {
  sunRadius: .75, maximumRadiusRatio: 1.65, strandRadiusScale: 1.15,
  baseAmplitude: .018, maximumAmplitude: .22,
  bassReference: .45, onsetReference: .22, onsetDuration: .65,
  restingOpacity: .16, maximumOpacity: .46, reducedOpacity: .10,
  sustainSensitivity: 1, accentSensitivity: 2.5,
  // Softening (owner review item 6), at rest only: wider, fainter strands so the resting ring reads
  // as a soft halo. Music activity quickly restores the approved crisp, full-strength strands.
  restingSoftness: .05, restingDim: .45, softeningRelease: 4,
} as const
// Angular advection and periodic noise time both join continuously at this wrap.
export const CORONA_TIME_PERIOD = Math.PI * 2 * 100
export const createCorona = () => ({ session: -1, time: 0, envelope: 0, detail: 0,
  lowAccent: 0, midAccent: 0, highAccent: 0, motion: 1, lastBassSequence: 0,
  pulses: Array.from({ length: 3 }, () => ({ age: 1, strength: 0, sequence: 0 })),
  pulseUniforms: new Float32Array(6) })
export type Corona = ReturnType<typeof createCorona>

export function updateCorona(state: Corona, response: LavenderResponse, delta: number,
  reactivity: number, reducedMotion: boolean) {
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  if (!reducedMotion) state.time = (state.time + dt) % CORONA_TIME_PERIOD
  state.motion = reducedMotion ? 0 : 1
  const reset = state.session !== response.session
  if (reset) {
    state.session = response.session
    state.envelope = state.detail = state.lowAccent = state.midAccent = state.highAccent = 0
    state.lastBassSequence = Math.max(response.ridges[4].onsetSequence, response.ridges[5].onsetSequence)
    for (const pulse of state.pulses) { pulse.strength = 0; pulse.age = 1 }
  }
  const gain = clampSignal(reactivity), enabled = response.fresh && gain > 0
  const r = response.ridges, sensitivity = CORONA_SETTINGS.sustainSensitivity
  // Ridge inputs already include Reactivity: do not multiply gain a second time.
  const envelope = enabled ? clampSignal((.65 * r[4].target + .35 * r[5].target) * sensitivity / CORONA_SETTINGS.bassReference) : 0
  const detail = enabled ? clampSignal((.65 * r[2].sustained + .2 * r[1].sustained + .15 * r[0].sustained) * sensitivity) : 0
  state.envelope = gain === 0 ? 0 : smooth(state.envelope, envelope, dt, reducedMotion ? .8 : .08, reducedMotion ? 1.5 : .45)
  state.detail = gain === 0 ? 0 : smooth(state.detail, detail, dt, reducedMotion ? .8 : .12, reducedMotion ? 1.5 : .5)
  if (envelope === 0 && state.envelope < .0001) state.envelope = 0
  if (detail === 0 && state.detail < .0001) state.detail = 0
  const accents = enabled && !reducedMotion ? CORONA_SETTINGS.accentSensitivity : 0
  for (const pulse of state.pulses) pulse.age += dt
  if (!enabled || reducedMotion) {
    state.lastBassSequence = Math.max(r[4].onsetSequence, r[5].onsetSequence)
    for (const pulse of state.pulses) pulse.strength = 0
  } else if (!reset) {
    // Process oldest first, deduplicating the same broad-low event across both bands.
    const first = r[4].onsetSequence <= r[5].onsetSequence ? 4 : 5
    for (let i = 0; i < 2; i++) {
      const notice = r[i === 0 ? first : 9 - first]
      if (notice.onsetSequence <= state.lastBassSequence) continue
      const other = r[i === 0 ? 9 - first : first]
      const strength = other.onsetSequence === notice.onsetSequence
        ? Math.max(notice.onsetStrength, other.onsetStrength) : notice.onsetStrength
      state.lastBassSequence = notice.onsetSequence
      const age = response.sampleTime - notice.onsetTimeSeconds
      // Producer emission may follow the feature timestamp by one analysis hop.
      if (!Number.isFinite(age) || age < -.25 || age > .25 || clampSignal(strength) === 0) continue
      const pulse = state.pulses.find(p => p.strength === 0 || p.age >= CORONA_SETTINGS.onsetDuration)
        ?? state.pulses.reduce((a, b) => a.age >= b.age ? a : b)
      pulse.age = 0; pulse.sequence = notice.onsetSequence
      pulse.strength = clampSignal(strength / CORONA_SETTINGS.onsetReference)
    }
  }
  state.lowAccent = 0
  for (let i = 0; i < state.pulses.length; i++) {
    const pulse = state.pulses[i], progress = clampSignal(pulse.age / CORONA_SETTINGS.onsetDuration)
    const attack = clampSignal(pulse.age / .04)
    const strength = pulse.strength * attack * attack * (3 - 2 * attack) * (1 - progress) ** 2
    state.pulseUniforms[i * 2] = 2.35 + .15 * Math.sin(pulse.sequence * 2.4) - 1.4 * progress
    state.pulseUniforms[i * 2 + 1] = strength
    state.lowAccent = Math.max(state.lowAccent, strength)
  }
  state.midAccent = clampSignal(r[2].accent * accents)
  state.highAccent = clampSignal(Math.max(r[0].accent, r[1].accent) * accents)
  return state
}

// Drawn in the existing background plane: all opaque authored ridges occlude it.
export const coronaFragment = `
uniform vec2 coronaBassPulses[3];
uniform float coronaTime;
uniform float coronaEnvelope;
uniform float coronaDetail;
uniform float coronaLowAccent;
uniform float coronaMidAccent;
uniform float coronaHighAccent;
uniform float coronaMotion;
uniform float coronaSunRadius;
uniform float coronaRadiusRatio;
uniform float coronaBaseAmplitude;
uniform float coronaMaxAmplitude;
uniform float coronaBaseOpacity;
uniform float coronaMaxOpacity;

// Periodic 2D value noise: quintic interpolation is continuous through lattice cells.
// Return value and angular derivative so strand width stays soft on steep lobes.
float coronaHash(vec2 cell, float seed) {
  return fract(sin(dot(cell, vec2(127.1, 311.7)) + seed) * 43758.5453) * 2.0 - 1.0;
}
vec2 coronaNoise(float angle, float time, float cells, float seed) {
  vec2 p = vec2((angle + time * 0.2) * cells / 6.28318530718, time * ${256 / (Math.PI * 2 * 100)});
  vec2 grid = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float dx = 30.0 * f.x * f.x * (f.x - 1.0) * (f.x - 1.0);
  float a = coronaHash(mod(grid, vec2(cells, 256.0)), seed);
  float b = coronaHash(mod(grid + vec2(1.0, 0.0), vec2(cells, 256.0)), seed);
  float c = coronaHash(mod(grid + vec2(0.0, 1.0), vec2(cells, 256.0)), seed);
  float d = coronaHash(mod(grid + vec2(1.0, 1.0), vec2(cells, 256.0)), seed);
  return vec2(mix(mix(a,b,u.x), mix(c,d,u.x), u.y), mix(b-a,d-c,u.y) * dx * cells / 6.28318530718);
}

vec3 applyCorona(vec3 color, vec2 offset, float radius, float antialias) {
  float limit = coronaSunRadius * coronaRadiusRatio;
  // The center has no strand coverage; avoid the undefined atan(0,0) case.
  if (radius >= limit || radius < coronaSunRadius * 0.4) return color;
  float angle = atan(offset.y, offset.x);
  float t = coronaTime;
  float midLobe = pow(0.5 + 0.5 * cos(angle - 1.55 - 0.2 * sin(t * 0.15)), 6.0);
  float highLobe = pow(max(0.0, cos(angle - 2.35 - 0.15 * sin(t * 0.12))), 12.0);
  float amplitude = min(coronaMaxAmplitude, coronaBaseAmplitude + coronaMotion *
    (0.202 * coronaEnvelope + 0.045 * coronaDetail));
  float activity = clamp((coronaEnvelope + coronaDetail + coronaLowAccent) * ${CORONA_SETTINGS.softeningRelease.toFixed(1)}, 0.0, 1.0);
  float width = 0.01 + ${CORONA_SETTINGS.restingSoftness.toFixed(3)} * (1.0 - activity) + antialias * 0.65;
  float sum = 0.0;
  float sumDerivative = 0.0;
  for (int j = 0; j < 3; j++) {
    float difference = atan(sin(angle - coronaBassPulses[j].x), cos(angle - coronaBassPulses[j].x));
    float lobe = exp(-pow(difference / 0.28, 2.0)) * coronaBassPulses[j].y;
    sum += lobe;
    sumDerivative += lobe * (-2.0 * difference / (0.28 * 0.28));
  }
  float denominator = sqrt(1.0 + sum * sum);
  float localized = 0.09 * sum / denominator;
  float strands = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    float phase = layer * 2.1;
    vec2 wave = 0.7 * coronaNoise(angle + phase, t, 5.0 + layer * 2.0, 11.0 + layer * 7.0)
      + 0.3 * coronaNoise(angle - phase, t, 11.0 + layer * 2.0, 29.0 + layer * 9.0);
    float upperAccent = 0.081 * coronaMidAccent * midLobe + 0.117 * coronaHighAccent * highLobe;
    float weight = 0.65 + layer * 0.175;
    float displacement = amplitude * wave.x * weight + coronaMotion * (localized + upperAccent);
    float base = coronaSunRadius * (1.025 + layer * 0.05) * ${CORONA_SETTINGS.strandRadiusScale};
    // Smooth bounded compression preserves waves instead of clipping flat crests.
    float room = displacement >= 0.0 ? limit - 0.045 - base : base - coronaSunRadius - 0.025;
    float compression = sqrt(1.0 + pow(displacement / room, 2.0));
    float edge = base + displacement / compression;
    float derivative = (amplitude * wave.y * weight + coronaMotion * 0.09 * sumDerivative / pow(denominator, 3.0)) / pow(compression, 3.0);
    float strandWidth = width * sqrt(1.0 + pow(derivative / max(edge, 0.1), 2.0));
    float distanceToEdge = (radius - edge) / strandWidth;
    strands += exp(-distanceToEdge * distanceToEdge) * (0.8 - layer * 0.12);
  }
  float opacity = coronaBaseOpacity * mix(${CORONA_SETTINGS.restingDim.toFixed(3)}, 1.0, activity) + 0.25 * coronaEnvelope + 0.14 * coronaDetail
    + 0.15 * coronaLowAccent + 0.18 * coronaMidAccent * midLobe + 0.2 * coronaHighAccent * highLobe;
  // A longer outer fade, so the softened rest glow has no visible boundary (item 6).
  float fade = 1.0 - smoothstep(limit - 0.12, limit, radius);
  float alpha = min(coronaMaxOpacity, strands * opacity) * fade;
  return mix(color, vec3(1.0, 0.91, 0.87), alpha);
}
`

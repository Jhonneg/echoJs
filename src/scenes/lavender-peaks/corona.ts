import { clampSignal, smooth } from '../../audio/signal.ts'
import type { LavenderResponse } from './response.ts'

export const CORONA_SETTINGS = {
  sunRadius: .75, maximumRadiusRatio: 1.35,
  baseAmplitude: .018, maximumAmplitude: .11,
  restingOpacity: .16, maximumOpacity: .46, reducedOpacity: .10,
  sustainSensitivity: 1, accentSensitivity: 2.5,
} as const
// All shader time frequencies are integer hundredths: this wrap is phase-continuous.
export const CORONA_TIME_PERIOD = Math.PI * 2 * 100
export const createCorona = () => ({ session: -1, time: 0, envelope: 0, detail: 0,
  lowAccent: 0, midAccent: 0, highAccent: 0, motion: 1 })
export type Corona = ReturnType<typeof createCorona>

export function updateCorona(state: Corona, response: LavenderResponse, delta: number,
  reactivity: number, reducedMotion: boolean) {
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  if (!reducedMotion) state.time = (state.time + dt) % CORONA_TIME_PERIOD
  state.motion = reducedMotion ? 0 : 1
  if (state.session !== response.session) {
    state.session = response.session
    state.envelope = state.detail = state.lowAccent = state.midAccent = state.highAccent = 0
  }
  const gain = clampSignal(reactivity), enabled = response.fresh && gain > 0
  const r = response.ridges, sensitivity = CORONA_SETTINGS.sustainSensitivity
  // Ridge inputs already include Reactivity: do not multiply gain a second time.
  const envelope = enabled ? clampSignal((.65 * r[4].sustained + .35 * r[5].sustained) * sensitivity) : 0
  const detail = enabled ? clampSignal((.65 * r[2].sustained + .2 * r[1].sustained + .15 * r[0].sustained) * sensitivity) : 0
  state.envelope = gain === 0 ? 0 : smooth(state.envelope, envelope, dt, reducedMotion ? .8 : .3, reducedMotion ? 1.5 : .9)
  state.detail = gain === 0 ? 0 : smooth(state.detail, detail, dt, reducedMotion ? .8 : .12, reducedMotion ? 1.5 : .5)
  if (envelope === 0 && state.envelope < .0001) state.envelope = 0
  if (detail === 0 && state.detail < .0001) state.detail = 0
  const accents = enabled && !reducedMotion ? CORONA_SETTINGS.accentSensitivity : 0
  state.lowAccent = clampSignal(Math.max(r[4].accent, r[5].accent) * accents)
  state.midAccent = clampSignal(r[2].accent * accents)
  state.highAccent = clampSignal(Math.max(r[0].accent, r[1].accent) * accents)
  return state
}

// Drawn in the existing background plane: all opaque authored ridges occlude it.
export const coronaFragment = `
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

vec3 applyCorona(vec3 color, vec2 offset, float radius, float antialias) {
  float limit = coronaSunRadius * coronaRadiusRatio;
  // The center has no strand coverage; avoid the undefined atan(0,0) case.
  if (radius >= limit || radius < coronaSunRadius * 0.4) return color;
  float angle = atan(offset.y, offset.x);
  float t = coronaTime;
  float midLobe = pow(0.5 + 0.5 * cos(angle - 1.55 - 0.2 * sin(t * 0.15)), 6.0);
  float highLobe = pow(max(0.0, cos(angle - 2.35 - 0.15 * sin(t * 0.12))), 12.0);
  float amplitude = min(coronaMaxAmplitude, coronaBaseAmplitude + coronaMotion *
    (0.04 * coronaEnvelope + 0.035 * coronaDetail));
  float width = 0.01 + antialias * 0.65;
  float strands = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    float phase = layer * 2.1;
    float wave = 0.52 * sin(angle * 3.0 + t * 0.55 + phase)
      + 0.30 * sin(angle * 5.0 - t * 0.31 + phase * 0.7)
      + 0.18 * sin(angle * 9.0 + t * 0.24 + 0.8 * sin(angle - t * 0.2) + phase);
    float edge = coronaSunRadius * (1.025 + layer * 0.05) + amplitude * wave;
    edge += coronaMotion * (0.025 * coronaLowAccent * sin(angle * 2.0 - t * 0.35)
      + 0.045 * coronaMidAccent * midLobe + 0.065 * coronaHighAccent * highLobe);
    float distanceToEdge = (radius - edge) / width;
    strands += exp(-distanceToEdge * distanceToEdge) * (0.8 - layer * 0.12);
  }
  float opacity = coronaBaseOpacity + 0.25 * coronaEnvelope + 0.14 * coronaDetail
    + 0.15 * coronaLowAccent + 0.18 * coronaMidAccent * midLobe + 0.2 * coronaHighAccent * highLobe;
  float fade = 1.0 - smoothstep(limit - 0.035, limit, radius);
  float alpha = min(coronaMaxOpacity, strands * opacity) * fade;
  return mix(color, vec3(1.0, 0.91, 0.87), alpha);
}
`

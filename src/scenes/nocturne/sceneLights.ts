import { Color, Mesh, PointLight, Vector3, type MeshStandardMaterial, type Object3D } from 'three'

// Shared by the NT19 rain and the NT21 steam: both are lit in their own shaders by the scene's
// fixture spill lights plus the gate, with three.js's point-light falloff (rain.ts,
// rainLightFalloff). Up to `max` lights; the last slot is the gate.
export type SceneLightUniforms = {
  lightPosition: { value: Vector3[] }, lightColor: { value: Color[] }, lightRange: { value: number[] },
}
export type GateLight = { position: readonly [number, number, number], intensity: number, distance: number }
export type SceneLights = { points: PointLight[], gate: MeshStandardMaterial | null }

export function createSceneLightUniforms(max: number): SceneLightUniforms {
  return {
    lightPosition: { value: Array.from({ length: max }, () => new Vector3()) },
    lightColor: { value: Array.from({ length: max }, () => new Color(0, 0, 0)) },
    lightRange: { value: new Array<number>(max).fill(0) },
  }
}
export function findSceneLights(scene: Object3D, max: number): SceneLights {
  const points: PointLight[] = []
  scene.getObjectByName('nocturne-light-spill')?.traverse(object => { if (object instanceof PointLight) points.push(object) })
  return {
    points: points.slice(0, max - 1),
    gate: ((scene.getObjectByName('nocturne-gate-light') as Mesh | undefined)?.material as MeshStandardMaterial | undefined) ?? null,
  }
}
// Each frame: current position, colour x intensity and range of every light, then the gate.
export function updateSceneLightUniforms(uniforms: SceneLightUniforms, lights: SceneLights, gate: GateLight) {
  const positions = uniforms.lightPosition.value, colors = uniforms.lightColor.value, ranges = uniforms.lightRange.value
  lights.points.forEach((light, i) => {
    light.getWorldPosition(positions[i])
    colors[i].copy(light.color).multiplyScalar(light.intensity)
    ranges[i] = light.distance
  })
  const g = lights.points.length
  positions[g].set(...gate.position)
  if (lights.gate) colors[g].copy(lights.gate.emissive).multiplyScalar(gate.intensity)
  ranges[g] = gate.distance
}
// GLSL: the uniforms and `vec3 sceneLight(vec3 p)`, the summed light at p times `gain`.
export function sceneLightGlsl(max: number, gain: number) {
  return `uniform vec3 lightPosition[${max}];
  uniform vec3 lightColor[${max}]; // colour x current intensity
  uniform float lightRange[${max}];
  vec3 sceneLight(vec3 p) {
    vec3 lit = vec3(0.0);
    for (int i = 0; i < ${max}; i++) {
      float d = distance(p, lightPosition[i]);
      float cut = max(0.0, 1.0 - pow(d / max(lightRange[i], 1e-3), 4.0));
      lit += lightColor[i] * cut * cut / (1.0 + d * d);
    }
    return lit * ${gain.toFixed(5)};
  }`
}

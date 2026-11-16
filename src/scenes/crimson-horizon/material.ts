export const nightshade = `vec3 nightColor(vec3 ray) {
  float horizon = 1.0 - smoothstep(0.0, 0.65, ray.y);
  return mix(vec3(0.0052, 0.0044, 0.0144), vec3(0.016, 0.0103, 0.032), horizon);
}`
export const terrainVertex = `attribute vec4 terrainFeatures;
attribute float terrainFold;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vFeatures;
varying float vFold;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vFeatures = terrainFeatures;
  vFold = terrainFold;
  gl_Position = projectionMatrix * viewMatrix * world;
}`
export const terrainFragment = `uniform vec3 sunPosition;
uniform float activity;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vFeatures;
varying float vFold;
${nightshade}
float ridgeLine(float value) {
  float width = max(fwidth(value) * 0.65, 0.00005);
  return 1.0 - smoothstep(width, width * 2.0, abs(value));
}
void main() {
  vec3 normal = normalize(vNormal);
  float facing = dot(normal, normalize(sunPosition - vWorld));
  float directional = floor(clamp(facing, 0.0, 0.999) * 3.0) / 2.0;
  vec3 color = vec3(0.022, 0.006, 0.012) + vec3(0.045, 0.008, 0.016) * directional;
  // A restrained warm fill keeps upward slopes readable without washing them gray.
  color += vec3(0.006, 0.002, 0.005) * smoothstep(0.0, 1.0, normal.y);
  float crests = clamp(ridgeLine(vFeatures.x) + ridgeLine(vFeatures.y) * 0.3, 0.0, 1.0);
  float slopes = 0.4 + 0.6 * smoothstep(0.05, 0.55, 1.0 - abs(normal.y));
  float highlights = crests * pow(vFeatures.z, 1.5) * vFeatures.w * slopes;
  highlights *= 0.35 + 0.65 * smoothstep(-0.15, 0.7, facing);
  float foreground = ridgeLine(vFold) * (1.0 - vFeatures.z) * 0.12;
  color += vec3(0.8, 0.004, 0.038) * (highlights + foreground) * (0.85 + activity * 0.15);
  vec3 ray = normalize(vWorld - cameraPosition);
  float depth = distance(cameraPosition, vWorld);
  float haze = (1.0 - exp(-depth * 0.018)) * smoothstep(25.0, 85.0, depth);
  haze *= exp(-abs(vWorld.x - sunPosition.x) * 0.045) * 0.35 * (0.2 + activity * 0.8);
  color = mix(color, vec3(0.065, 0.0015, 0.012), haze);
  // Full nightshade fade is reached before the streamed window's far boundary.
  color = mix(color, nightColor(ray), smoothstep(70.0, 108.0, depth));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

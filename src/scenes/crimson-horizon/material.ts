export const nightshade = `vec3 nightColor(vec3 ray) {
  float horizon = 1.0 - smoothstep(0.0, 0.65, ray.y);
  return mix(vec3(0.0052, 0.0044, 0.0144), vec3(0.016, 0.0103, 0.032), horizon);
}
vec3 atmosphericNight(vec3 ray, float density, float warmth) {
  float elevation = (ray.y - .015) / .18;
  float horizon = exp(-elevation * elevation);
  return nightColor(ray) + horizon * (vec3(.014, .003, .009) * density + vec3(.008, .003, .001) * warmth);
}`
export const terrainVertex = `attribute vec4 terrainFeatures;
attribute float terrainFold;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vFeatures;
varying float vFold;
uniform float valleyOrigin;
varying vec2 vGround;
uniform float contourOrigin;
varying float vContourCoordinate;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vGround = vec2(position.z, position.z * .08 + valleyOrigin);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vContourCoordinate = position.x * .065 + position.z * .045 + contourOrigin;
  vFeatures = terrainFeatures;
  vFold = terrainFold;
  gl_Position = projectionMatrix * viewMatrix * world;
}`
export const terrainFragment = `uniform float atmosphereDensity;
uniform float atmosphereWarmth;
uniform float presenceAccent;
uniform vec4 valleyWaves[4];
uniform float valleyGlow;
varying vec2 vGround;
uniform vec3 sunPosition;
uniform float activity;
uniform float musicWeight;
uniform float contourLight;
uniform float contourStreak;
uniform float contourProgress;
uniform float musicHaze;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vFeatures;
varying float vFold;
varying float vContourCoordinate;
${nightshade}
float ridgeLine(float value) {
  float width = max(fwidth(value) * 0.65, 0.00005);
  return 1.0 - smoothstep(width, width * 2.0, abs(value));
}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 ray = normalize(vWorld - cameraPosition);
  float depth = distance(cameraPosition, vWorld);
  float facing = dot(normal, normalize(sunPosition - vWorld));
  float directional = floor(clamp(facing, 0.0, 0.999) * 3.0) / 2.0;
  vec3 color = vec3(0.022, 0.006, 0.012) + vec3(0.045, 0.008, 0.016) * directional;
  // A restrained warm fill keeps upward slopes readable without washing them gray.
  color += vec3(0.006, 0.002, 0.005) * smoothstep(0.0, 1.0, normal.y);
  // Static bank tones separate middle-distance facets from the dark near valley.
  float middleDistance = smoothstep(12.0, 35.0, depth) * (1.0 - smoothstep(55.0, 95.0, depth));
  float bankFill = middleDistance * vFeatures.z * (0.4 + 0.6 * max(normal.y, 0.0));
  color += vec3(.012, .0035, .013) * bankFill;
  color = mix(color, vec3(.028, .013, .04), smoothstep(40.0, 95.0, depth) * vFeatures.z * .32);
  float crests = clamp(ridgeLine(vFeatures.x) + ridgeLine(vFeatures.y) * 0.3, 0.0, 1.0);
  float slopes = 0.4 + 0.6 * smoothstep(0.05, 0.55, 1.0 - abs(normal.y));
  // The bank value is 0 on the valley floor; interpolation can dip a hair below 0 there, and pow()
  // of a negative number is NaN on GPUs (dark dotted lines). Clamp before every pow.
  float highlights = crests * pow(max(vFeatures.z, 0.0), 1.5) * vFeatures.w * slopes;
  highlights *= 0.35 + 0.65 * smoothstep(-0.15, 0.7, facing);
  float foreground = ridgeLine(vFold) * (1.0 - vFeatures.z) * 0.12;
  vec3 legacyContours = vec3(0.8, 0.004, 0.038) * (highlights + foreground) * (0.85 + activity * 0.15);
  color += legacyContours * (1.0 - musicWeight);
  float haze = (1.0 - exp(-depth * 0.018)) * smoothstep(25.0, 85.0, depth);
  haze *= exp(-abs(vWorld.x - sunPosition.x) * 0.045) * 0.35 * (0.2 + mix(activity, musicHaze, musicWeight) * 0.8);
  color = mix(color, vec3(0.065, 0.0015, 0.012), haze);
  // Slow context changes only distant depth separation, before reactive emission.
  float atmosphereDepth = smoothstep(25.0, 85.0, depth);
  color = mix(color, vec3(.04, .011, .034) + vec3(.012, .004, .001) * atmosphereWarmth,
    atmosphereDepth * (.08 + atmosphereDensity * .22));
  // Selected primary contours carry the light; secondary details mostly stay resting.
  float bankMask = pow(max(vFeatures.z, 0.0), 1.5) * slopes * (0.35 + 0.65 * smoothstep(-0.15, 0.7, facing));
  float primarySelection = smoothstep(0.55, 0.85, vFeatures.w);
  float secondarySelection = smoothstep(0.88, 0.99, vFeatures.w) * 0.12;
  float selectedCore = (ridgeLine(vFeatures.x) * primarySelection + ridgeLine(vFeatures.y) * secondarySelection) * bankMask;
  float primaryWidth = max(fwidth(vFeatures.x) * 0.65, 0.00005);
  float secondaryWidth = max(fwidth(vFeatures.y) * 0.65, 0.00005);
  float primaryDistance = abs(vFeatures.x) / primaryWidth;
  float secondaryDistance = abs(vFeatures.y) / secondaryWidth;
  float primaryHalo = exp(-primaryDistance * primaryDistance * 0.12) * (1.0 - smoothstep(4.0, 7.0, primaryDistance));
  float secondaryHalo = exp(-secondaryDistance * secondaryDistance * 0.12) * (1.0 - smoothstep(4.0, 7.0, secondaryDistance));
  float selectedHalo = (primaryHalo * primarySelection + secondaryHalo * secondarySelection) * bankMask;
  // A moving bright head and one-sided, short fading trail, in logical terrain coordinates.
  float wrapped = fract(vContourCoordinate - contourProgress);
  float headDistance = min(wrapped, 1.0 - wrapped);
  float headMask = 1.0 - smoothstep(0.018, 0.06, headDistance);
  float behindHead = fract(contourProgress - vContourCoordinate);
  float trailMask = exp(-behindHead / 0.04) * (1.0 - smoothstep(0.075, 0.14, behindHead));
  vec3 litContours = vec3(0.32, 0.002, 0.018) * (highlights * 0.12 + foreground * 0.06);
  litContours += vec3(0.72, 0.008, 0.045) * contourLight * (selectedCore * 4.8 + selectedHalo * 0.75);
  litContours += vec3(1.0, 0.32, 0.46) * contourStreak * headMask * (selectedCore * 5.2 + selectedHalo * 1.6);
  litContours += vec3(0.8, 0.025, 0.09) * contourStreak * trailMask * (selectedCore * .95 + selectedHalo * .25);
  color += musicWeight * litContours;
  // One narrow continuous path on the authored valley surface. No extra geometry/pass.
  float channelDistance = abs(vWorld.x - sin(vGround.y) * 1.2);
  float channel = exp(-pow(channelDistance / .18, 2.0));
  float floorMask = 1.0 - smoothstep(.02, .3, vFeatures.z);
  float waveHeadLight = 0.0;
  float waveTailLight = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 wave = valleyWaves[i];
    // A finite curved front spans the valley floor; the existing channel stays faint.
    float span = 1.3 + wave.z * .65;
    float across = channelDistance / span;
    float footprint = exp(-across * across * across * across);
    float behind = wave.x - vGround.x + channelDistance * channelDistance * .16;
    float headDistance = behind / wave.z;
    float head = exp(-headDistance * headDistance);
    float tail = smoothstep(0.0, wave.z, behind) * exp(-max(0.0, behind) / wave.w);
    waveHeadLight = max(waveHeadLight, wave.y * head * footprint);
    waveTailLight = max(waveTailLight, wave.y * tail * footprint);
  }
  vec3 groundLight = vec3(.35, .002, .025) * channel * (.012 + valleyGlow * .09);
  groundLight += vec3(1.0, .12, .29) * waveHeadLight * 3.5;
  groundLight += vec3(.7, .018, .09) * waveTailLight * .65;
  color += musicWeight * floorMask * groundLight;
  float glintCell = floor(vContourCoordinate * 24.0);
  float glintPick = fract(sin(glintCell * 127.1 + floor(vWorld.x * .45) * 311.7) * 43758.5453);
  float glint = step(.97, glintPick) * (selectedCore + selectedHalo * .65) * smoothstep(28.0, 45.0, depth) * (1.0 - smoothstep(65.0, 90.0, depth));
  color += vec3(1.0, .35, .58) * glint * presenceAccent * musicWeight * 3.5;
  // Full nightshade fade is reached before the streamed window's far boundary.
  color = mix(color, atmosphericNight(ray, atmosphereDensity, atmosphereWarmth), smoothstep(70.0, 108.0, depth));
  // Sun glow pass: far slopes seen just around the sun's base catch a hot magenta light (after the
  // night fade, which would otherwise hide it). A wide, flat ellipse around the base in view
  // direction; present at rest, stronger with the sun's activity; never on the foreground.
  vec3 toBase = normalize(sunPosition - vec3(0.0, 8.5, 0.0) - cameraPosition);
  vec2 offset = vec2(ray.x / -ray.z - toBase.x / -toBase.z, ray.y / -ray.z - toBase.y / -toBase.z);
  float baseGlow = exp(-(offset.x * offset.x / 0.02 + offset.y * offset.y / 0.002)) * step(ray.z, -0.01)
    * smoothstep(45.0, 85.0, depth) * (0.12 + activity * 0.5);
  color += vec3(0.9, 0.06, 0.3) * baseGlow;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

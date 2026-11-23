import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { GraphicsQuality } from '../../engine/quality'

// Sample the existing rendered triangles, not the smoother height function.
// Closures are excluded by winding; this runs only while creating geometry.
export function terrainHeight(geometry: BufferGeometry, x: number, z: number) {
  const p = geometry.getAttribute('position'), indices = geometry.index!
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i), b = indices.getX(i + 1), c = indices.getX(i + 2)
    const ax = p.getX(a), az = p.getZ(a), bx = p.getX(b), bz = p.getZ(b), cx = p.getX(c), cz = p.getZ(c)
    const denominator = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
    if (denominator >= -1e-8) continue
    const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / denominator
    const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / denominator
    if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6) return u * p.getY(a) + v * p.getY(b) + (1 - u - v) * p.getY(c)
  }
  throw new Error('Bloom trail is outside the mountain surface')
}

export function trailRoute(lane: number, t: number): {x:number,z:number} {
  const bank=lane%2, voice=Math.floor(lane/2)
  const u = .09 + .91 * t
  // Separate drainage catchments, not offsets of the same projected crest.
  // Each tuple is [startX,endX,startZ,endZ]; terrain buffers stay untouched.
  if (voice > 0) {
    const routes = bank === 0
      ? [[-3.5,-2.2,-5.9,-4],[-5.9,-6.5,-6.25,-3.35],[-4.8,-2.8,-5.4,-4.4],[-7.2,-8.1,-6.5,-3.4]]
      : [[3.8,2.8,-7,-5.5],[6.4,6.8,-6.7,-3.5],[4.8,3.2,-5.6,-3.9],[7.2,8.3,-6.8,-3.4]]
    const [a,b,c,d] = routes[voice - 1]
    return { x: a+(b-a)*t+.025*Math.sin(t*Math.PI*4+voice)*Math.sin(t*Math.PI), z: c+(d-c)*t }
  }
  return bank === 0
    ? { x: -4.7 + 2.65 * u + .07 * Math.sin(u * Math.PI * 4), z: -6.1 + 1.25 * u + .12 * Math.sin(u * Math.PI) }
    : { x: 4.75 - 2.05 * t + .06 * Math.sin(t * Math.PI * 5), z: -5.9 + 1.4 * t }
}

export const TRAIL_PERIOD = 80
export const createTrailState = () => ({ time: 0 })
export function updateTrailState(state: ReturnType<typeof createTrailState>, delta: number, reduced: boolean) {
  if (!reduced) state.time = (state.time + Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0))) % TRAIL_PERIOD
  return state
}

export function createTrailGeometry(banks: readonly BufferGeometry[], quality: GraphicsQuality) {
  const segments = quality === 'low' ? 40 : 80, lanes = quality === 'low' ? 6 : 10
  const positions: number[] = [], uvs: number[] = [], laneIds: number[] = [], indices: number[] = []
  for (let lane = 0; lane < lanes; lane++) {
    const start = positions.length / 3
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, point = trailRoute(lane, t)
      const before = trailRoute(lane, Math.max(0, t - .001)), after = trailRoute(lane, Math.min(1, t + .001))
      const dx = after.x - before.x, dz = after.z - before.z, length = Math.hypot(dx, dz)
      for (const side of [-1, 1]) {
        const x = point.x - side * dz / length * (.085/(1+Math.floor(lane/2)*.15)), z = point.z + side * dx / length * (.085/(1+Math.floor(lane/2)*.15))
        positions.push(x, terrainHeight(banks[lane%2], x, z) + .012, z)
        uvs.push((side + 1) / 2, t); laneIds.push(lane%2+Math.floor(lane/2)*2)
      }
      if (i < segments) { const a = start + i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('lane', new Float32BufferAttribute(laneIds, 1))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

export const trailVertex = `
attribute float lane;
varying vec2 trailUv;
varying float trailLane;
void main(){trailUv=uv;trailLane=lane;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`
export const trailFragment = `
uniform vec2 trailPhases;
uniform vec2 trailLevels;
uniform vec2 trailShimmer;
uniform vec4 trailPulseProgress;
uniform vec4 trailPulseStrength;
uniform vec4 trailPulseDetail;
varying vec2 trailUv;
varying float trailLane;
void main(){
  float voice=floor(trailLane/2.0), bank=mod(trailLane,2.0);
  float across=abs(trailUv.x*2.0-1.0);
  float coreWidth=max(0.15,fwidth(trailUv.x*2.0-1.0)*0.65);
  float core=exp(-pow(across/coreWidth,2.0));
  float halo=exp(-across*across*5.0)*0.40;
  float phase=fract(mix(trailPhases.x,trailPhases.y,bank)*(1.0+voice)+voice*0.19-trailUv.y);
  float distanceToPulse=min(phase,1.0-phase);
  float pulse=exp(-pow(distanceToPulse/0.075,2.0));
  float ends=smoothstep(0.0,0.08,trailUv.y)*(1.0-smoothstep(0.86,1.0,trailUv.y));
  vec3 color=mix(vec3(0.80,0.34,0.52),vec3(0.34,0.80,0.70),bank);
  float attack=0.0;
  for(int i=0;i<4;i++){
    float lane=step(1.5,float(i));
    float sameLane=1.0-abs(lane-bank);
    float detailVoice=step(1.5,voice);
    float compatible=voice>3.5?0.6:1.0-abs(detailVoice-trailPulseDetail[i]);
    float progress=trailPulseProgress[i]*(1.0-voice*0.055)-voice*0.025;
    attack+=sameLane*compatible*trailPulseStrength[i]*exp(-pow((trailUv.y-progress)/0.065,2.0));
  }
  float level=mix(trailLevels.x,trailLevels.y,bank);
  float shimmer=mix(trailShimmer.x,trailShimmer.y,bank);
  if(voice>1.5){level=1.0+shimmer*10.0;}
  float rest=voice<0.5?0.12:0.025;
  float activity=max(0.0,level-1.0);
  float light=((rest+activity*(0.70+0.65*pulse))+1.25*attack+shimmer*core)*(core+halo)*ends;
  light=min(light,0.95);
  gl_FragColor=vec4(color,light);
  #include <colorspace_fragment>
}
`

import { BRIDGE_SEGMENTS } from './bridge'
import { NOCTURNE_LIGHT_COLORS } from './lighting'
import { useLayoutEffect, useRef } from 'react'
import { CatmullRomCurve3, DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Object3D, Vector3, type WebGLProgramParametersWithUniforms } from 'three'

type Triple = [number, number, number]
type Part = { position: Triple, size: Triple, rotation?: Triple }
type BridgeFinish = `bridge${number}`
const bridgeFinishes = Array.from({ length: BRIDGE_SEGMENTS }, (_, i) => `bridge${i}` as BridgeFinish)
type Finish = BridgeFinish | 'steel' | 'frame' | 'recess' | 'cyan' | 'cyanDetails' | 'cyanPanel' | 'magenta' | 'magentaSecondary' | 'violet' | 'violetSecondary' | 'violetFlicker' | 'asphalt'
const finishes: Record<Finish, { color: string, roughness: number, metalness: number }> = {
  steel: { color: '#343e46', roughness: 0.72, metalness: 0.45 },
  frame: { color: '#222c34', roughness: 0.8, metalness: 0.35 },
  recess: { color: '#090e13', roughness: 0.95, metalness: 0.1 },
  cyan: { color: '#1c303a', roughness: 0.42, metalness: 0.25 },
  cyanDetails: { color: '#1c303a', roughness: 0.42, metalness: 0.25 },
  cyanPanel: { color: '#1c303a', roughness: 0.42, metalness: 0.25 },
  magenta: { color: '#30343c', roughness: 0.6, metalness: 0.35 },
  magentaSecondary: { color: '#30343c', roughness: 0.6, metalness: 0.35 },
  ...Object.fromEntries(bridgeFinishes.map(name => [name, { color: '#30343c', roughness: .6, metalness: .35 }])),
  violet: { color: '#13121a', roughness: 0.7, metalness: 0.1 },
  violetSecondary: { color: '#13121a', roughness: 0.7, metalness: 0.1 },
  violetFlicker: { color: '#13121a', roughness: 0.7, metalness: 0.1 },
  asphalt: { color: '#151c21', roughness: 0.98, metalness: 0 },
}
// All repeated facade parts share a unit box and one material per finish.
const parts: Record<Finish, Part[]> = { steel: [], frame: [], recess: [], cyan: [], cyanDetails: [], cyanPanel: [], magenta: [], magentaSecondary: [], ...Object.fromEntries(bridgeFinishes.map(name => [name, []])), violet: [], violetSecondary: [], violetFlicker: [], asphalt: [] }
function box(finish: Finish, position: Triple, size: Triple, rotation?: Triple) {
  parts[finish].push({ position, size, rotation })
}
function wall(side: number, finish: Finish, depth: number, y: number, z: number, size: Triple) {
  box(finish, [side * (3 - depth), y, z], size)
}
for (const side of [-1, 1]) {
  for (let bay = 0; bay < 5; bay++) {
    const z = -2 - bay * 10 + (side === 1 ? -2 : 0)
    // Raised jambs and a deep, dark inset leaf create a recessed service doorway.
    wall(side, 'recess', 0.035, 1.5, z, [0.06, 3, 1.7])
    for (const edge of [-0.94, 0.94]) wall(side, 'steel', 0.19, 1.55, z + edge, [0.38, 3.1, 0.18])
    wall(side, 'steel', 0.19, 3.16, z, [0.38, 0.2, 2.06])
    wall(side, 'frame', 0.1, 0.08, z, [0.2, 0.16, 1.7])
    wall(side, 'steel', 0.12, 1.35, z - side * 0.52, [0.12, 0.35, 0.055])
    // Shutter slats sit behind the projecting frame.
    if (bay % 2 === 0) for (let slat = 0; slat < 13; slat++) {
      wall(side, 'frame', 0.075, 0.3 + slat * 0.2, z, [0.08, 0.055, 1.6])
    }
    // Window matrices are offset on opposite facades.
    for (const y of [6.2, 10.5, 14.5]) {
      const windowZ = z + (side === -1 ? 2.1 : -1.9)
      const building = Math.round((2 - windowZ) / 10)
      const height = [18, 22, 16, 20, 14, 19][(building + (side === 1 ? 2 : 0)) % 6]
      if (y + 1.1 > height) continue
      wall(side, 'recess', 0.035, y, windowZ, [0.06, 2.1, 3.2])
      for (let column = 0; column < 4; column++) for (let row = 0; row < 3; row++) {
        wall(side, 'cyan', 0.08, y - 0.64 + row * 0.64, windowZ - 1.12 + column * 0.75, [0.08, 0.54, 0.63])
      }
      for (const edge of [-1.64, 1.64]) wall(side, 'steel', 0.16, y, windowZ + edge, [0.18, 2.2, 0.09])
      for (const edge of [-1.08, 1.08]) wall(side, 'steel', 0.16, y + edge, windowZ, [0.18, 0.09, 3.36])
    }
    // Sparse louvered vent beside each service bay.
    const ventZ = z + 3.1
    wall(side, 'steel', 0.18, 1.6, ventZ, [0.35, 1.3, 1.5])
    wall(side, 'recess', 0.37, 1.6, ventZ, [0.04, 1.1, 1.3])
    for (let slat = 0; slat < 7; slat++) wall(side, 'frame', 0.4, 1.12 + slat * 0.16, ventZ, [0.12, 0.07, 1.3])
    // Junction boxes and wall conduit, offset from the doors.
    wall(side, 'frame', 0.15, 3.75, z + 2.8, [0.3, 0.62, 0.48])
    wall(side, 'steel', 0.1, 4.1, z, [0.13, 0.11, 8.7])
    // Construction detail is concentrated in the first three bays. Farther bays keep their
    // simple silhouettes; all hardware joins the existing non-emitting instance batches.
    if (bay < 3) {
      // Sheet behind the shutter ribs, or a recessed two-panel service door.
      wall(side, 'frame', 0.052, 1.5, z, [0.025, 2.72, 1.53])
      if (bay % 2 === 1) {
        for (const y of [0.8, 2.1]) {
          wall(side, 'steel', 0.078, y, z, [0.025, 1.06, 1.31])
          wall(side, 'frame', 0.094, y, z, [0.018, 0.93, 1.18])
        }
      }
      // Hinges sit on the projecting jamb; the latch has a backplate and a return grip.
      for (const y of [0.55, 1.55, 2.65]) {
        wall(side, 'frame', 0.39, y, z + side * 0.94, [0.03, 0.25, 0.16])
        wall(side, 'steel', 0.42, y, z + side * 0.94, [0.065, 0.18, 0.055])
      }
      wall(side, 'steel', 0.145, 1.35, z - side * 0.52, [0.025, 0.38, 0.15])
      wall(side, 'recess', 0.161, 1.25, z - side * 0.52, [0.012, 0.055, 0.035])
      for (const y of [1.34, 1.49]) wall(side, 'steel', 0.21, y, z - side * 0.52, [0.13, 0.035, 0.045])
      wall(side, 'steel', 0.27, 1.415, z - side * 0.52, [0.035, 0.19, 0.045])
      wall(side, 'steel', 0.12, 0.23, z, [0.035, 0.22, 1.47])
      // Header seam and jamb fixings catch small highlights without outlining the whole door.
      wall(side, 'frame', 0.396, 3.17, z, [0.018, 0.035, 1.82])
      for (const edge of [-0.94, 0.94]) for (const y of [0.27, 2.93]) {
        wall(side, 'steel', 0.395, y, z + edge, [0.04, 0.065, 0.065])
      }
      // Folded vent rim, angled louver lips and four screw heads.
      for (const edge of [-0.7, 0.7]) wall(side, 'steel', 0.405, 1.6, ventZ + edge, [0.07, 1.3, 0.065])
      for (const y of [0.98, 2.22]) wall(side, 'steel', 0.405, y, ventZ, [0.09, 0.065, 1.47])
      for (let slat = 0; slat < 7; slat++) {
        box('steel', [side * 2.55, 1.13 + slat * 0.16, ventZ], [0.09, 0.025, 1.27], [0, 0, side * 0.35])
      }
      for (const edge of [-0.69, 0.69]) for (const y of [1.06, 2.14]) {
        wall(side, 'frame', 0.452, y, ventZ + edge, [0.025, 0.055, 0.055])
      }
      // Junction-box lid, gasket, hinge tabs, latch and a short feed into the existing conduit.
      wall(side, 'recess', 0.307, 3.75, z + 2.8, [0.018, 0.55, 0.41])
      wall(side, 'steel', 0.326, 3.75, z + 2.8, [0.025, 0.5, 0.36])
      wall(side, 'frame', 0.35, 3.72, z + 2.91, [0.03, 0.13, 0.045])
      for (const y of [3.57, 3.93]) wall(side, 'steel', 0.33, y, z + 2.59, [0.045, 0.09, 0.07])
      wall(side, 'steel', 0.13, 4.13, z + 2.8, [0.08, 0.18, 0.08])
      for (const dz of [-3.7, -1.8, 0.6, 3.8]) {
        wall(side, 'frame', 0.085, 4.1, z + dz, [0.17, 0.27, 0.11])
        wall(side, 'steel', 0.18, 4.1, z + dz, [0.035, 0.15, 0.09])
      }
    }
  }
  // Large fixture bodies, panel housings and thin strip channels for N03.
  for (const z of (side === 1 ? [-3, -18, -34] : [-13, -29, -44])) {
    wall(side, 'frame', 0.22, 2.75, z, [0.44, 3.3, 1.25])
    wall(side, side === 1 && z === -3 ? 'magenta' : 'magentaSecondary', 0.46, 2.75, z, [0.06, 2.95, 0.96])
    // NT17: the treble strips run about 5 m (were 3.05 m) and are wider, so they read with the glow.
    wall(side, 'steel', 0.08, 5.9, z - 1.3, [0.16, 5.15, 0.14])
    // NT22: the far-left strip has its own material so it alone can stutter (flicker.ts).
    wall(side, side === 1 ? 'violet' : z === -29 ? 'violetFlicker' : 'violetSecondary', 0.17, 5.9, z - 1.3, [0.04, 5, 0.09])
    // NT17: a short angled neon accent between the window rows, on the same channel.
    const tilt = (z % 2 === 0 ? 1 : -1) * side * 0.6
    box('steel', [side * 2.92, 8.35, z + 1.6], [0.12, 1.45, 0.13], [tilt, 0, 0])
    box(side === 1 ? 'violet' : 'violetSecondary', [side * 2.85, 8.35, z + 1.6], [0.04, 1.35, 0.09], [tilt, 0, 0])
    wall(side, side === 1 ? 'violet' : 'violetSecondary', 0.13, 0.32, z, [0.04, 0.045, 2.1])
    wall(side, 'frame', 0.18, 4.75, z + 3, [0.36, 0.7, 1.6])
    wall(side, 'cyanDetails', 0.38, 4.75, z + 3, [0.05, 0.5, 1.35])
  }
  // Drain slots and curb joints.
  for (let i = 0; i < 28; i++) {
    box('recess', [side * 2.72, 0.245, 3 - i * 2], [0.19, 0.012, 0.5])
    box('frame', [side * 2.85, 0.245, 4 - i * 2], [0.3, 0.012, 0.035])
    if (i < 10) {
      // Narrow crossbars bridge the dark drain opening; keep the central wet lane clear.
      for (let bar = 0; bar < 5; bar++) box('steel', [side * 2.72, 0.256, 2.8 - i * 2 + bar * 0.1], [0.18, 0.018, 0.025])
      box('frame', [side * 2.635, 0.256, 3 - i * 2], [0.025, 0.018, 0.52])
    }
  }
  // Pipe saddle plates and paired bolts. These support the existing downpipes and collars.
  for (const z of [-4.8, -24.8]) for (const y of [0.8, 3.5, 6.5]) {
    wall(side, 'frame', 0.13, y, z, [0.24, 0.32, 0.44])
    wall(side, 'steel', 0.29, y, z, [0.09, 0.1, 0.36])
    for (const dz of [-0.17, 0.17]) wall(side, 'steel', 0.26, y, z + dz, [0.04, 0.065, 0.065])
  }
}
// One slim, recessed left fixture. Its lower position brings the wet ground into the spill.
wall(-1, 'recess', 0.12, 2.65, -7.3, [0.07, 2.05, 0.78])
wall(-1, 'frame', 0.2, 2.65, -7.3, [0.25, 1.95, 0.7])
wall(-1, 'cyanPanel', 0.38, 2.65, -7.3, [0.05, 1.75, 0.5])
// Subtle asphalt repair seams, without reflective puddles or texture assets.
for (let i = 0; i < 16; i++) {
  box('asphalt', [Math.sin(i * 2.7) * 1.5, 0.003, 3 - i * 3.3], [1.1 + (i % 3) * 0.3, 0.006, 0.75 + (i % 2) * 0.3], [0, i * 0.61, 0])
}
// Broken repair joints beneath the wet film, close to the curbs rather than across the vista.
for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
  const z = 3 - i * 1.85
  box('recess', [side * (2.3 + Math.sin(i * 2.1) * 0.08), 0.009, z], [0.022, 0.008, 1.15], [0, side * (0.08 + Math.sin(i) * 0.1), 0])
  if (i % 3 === 0) box('asphalt', [side * 2.15, 0.01, z - 0.35], [0.44, 0.006, 0.025], [0, side * 0.6, 0])
}
// Bridge underside ribs, fasteners and unlit luminaire housings.
for (let i = 0; i < 9; i++) box('steel', [-2.8 + i * 0.7, 4.39, -8], [0.09, 0.22, 1.8])
// Flanged front beam, bolted splice plates and rail footings. Keep the six light segments clear.
for (const y of [4.59, 4.92]) box('steel', [0, y, -6.93], [6.15, 0.045, 0.11])
for (const x of [-2.8, -1.4, 0, 1.4, 2.8]) {
  box('frame', [x, 4.755, -6.915], [0.23, 0.28, 0.065])
  for (const dx of [-0.065, 0.065]) for (const y of [4.68, 4.83]) box('steel', [x + dx, y, -6.87], [0.045, 0.045, 0.035])
}
for (const x of [-3, -2, -1, 0, 1, 2, 3]) {
  box('steel', [x, 5.015, -7.04], [0.2, 0.13, 0.16])
  box('frame', [x, 5.2, -6.995], [0.14, 0.24, 0.025])
}
for (const side of [-1, 1]) {
  // Bracing only in the two outer rail bays leaves the central view open.
  box('steel', [side * 2.5, 5.56, -7.06], [0.045, 1.22, 0.045], [0, 0, side * 0.79])
  box('frame', [side * 2.88, 4.2, -8], [0.24, 0.4, 1.6])
  for (const z of [-8.6, -7.4]) wall(side, 'steel', 0.26, 4.2, z, [0.055, 0.09, 0.09])
}
// NT17: the two diffusers are longer (2.6 m each, were 1.15 m), still split into thirds so the
// bridge travel runs left to right as before.
for (const x of [-1.5, 1.5]) {
  box('frame', [x, 4.22, -7.1], [2.8, 0.14, 0.36])
  for (let j = 0; j < 3; j++) box(bridgeFinishes[(x < 0 ? 0 : 3) + j],
    [x - 2.6 / 2 + (j + .5) * 2.6 / 3, 4.13, -7.1], [2.6 / 3, .035, .22])
}
// NT17: a thin tube along the bridge's front edge, in the same six sections.
for (let j = 0; j < BRIDGE_SEGMENTS; j++) box(bridgeFinishes[j], [-3 + (j + .5) * 1, 4.47, -6.92], [.96, .04, .04])
// Slender metal gate bars retain the distant focal opening.
for (let i = 0; i < 10; i++) box('steel', [-1.02 + i * 0.226, 1.9, -51.25], [0.035, 3.65, 0.055])

// Preserve each authored instance/matrix and material; vary emission with one float.
function spatialFixtureShader(shader: WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float nocturneLevel;\nvarying float vNocturneLevel;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNocturneLevel = nocturneLevel;')
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vNocturneLevel;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vNocturneLevel;')
}
const spatialShaderKey = () => 'nocturne-spatial-emission-v1'

function Boxes({ finish }: { finish: Finish }) {
  const mesh = useRef<InstancedMesh>(null)
  const items = parts[finish]
  const spatial = finish === 'steel' || finish === 'magentaSecondary' || finish === 'cyan' || finish === 'cyanDetails'
  useLayoutEffect(() => {
    if (!mesh.current) return
    if (spatial) {
      const depths = [...new Set(items.map(part => part.position[2]))].sort((a, b) => b - a)
      const indices = Uint8Array.from(items, part => finish === 'steel'
        ? part.position[1] === 4.39 && part.position[2] === -8 && part.size[0] === .09
          ? Math.round((part.position[0] + 2.8) / .7 * 5 / 8) : 255
        : finish === 'cyan' ? Math.round(((part.position[0] < 0 ? .1 : -5.9) - part.position[2]) / 10)
          : depths.indexOf(part.position[2]))
      mesh.current.userData.nocturneSpatialIndices = indices
      mesh.current.geometry.setAttribute('nocturneLevel', new InstancedBufferAttribute(new Float32Array(items.length), 1).setUsage(DynamicDrawUsage))
    }
    const transform = new Object3D()
    items.forEach((part, index) => {
      transform.position.set(...part.position)
      transform.scale.set(...part.size)
      transform.rotation.set(...(part.rotation ?? [0, 0, 0]))
      transform.updateMatrix()
      mesh.current!.setMatrixAt(index, transform.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingBox()
    mesh.current.computeBoundingSphere()
  }, [items, spatial, finish])
  // NT18: window panes are black under their glow, so magenta spill no longer tints them pink.
  const group = finish === 'magenta' || finish === 'cyan' || finish === 'violet' ? finish : finish === 'cyanPanel' || finish === 'cyanDetails' ? 'cyan' : finish === 'magentaSecondary' || finish.startsWith('bridge') ? 'magenta' : finish === 'violetSecondary' || finish === 'violetFlicker' ? 'violet' : null
  return <instancedMesh name={`nocturne-${finish}`} ref={mesh} args={[undefined, undefined, items.length]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial {...finishes[finish]} {...(spatial ? { onBeforeCompile: spatialFixtureShader, customProgramCacheKey: spatialShaderKey } : {})} color={finish === 'cyan' ? '#000000' : group ? '#070a0f' : finishes[finish].color}
      metalness={group ? 0 : finishes[finish].metalness} roughness={group ? 0.95 : finishes[finish].roughness} emissive={group ? NOCTURNE_LIGHT_COLORS[group] : finish === 'steel' ? NOCTURNE_LIGHT_COLORS.magenta : '#000000'}
      emissiveIntensity={0} toneMapped={!group} />
  </instancedMesh>
}
const cables = [0, 1, 2].map(i => new CatmullRomCurve3([
  new Vector3(-2.9, 10 + i * 0.3, -5 - i * 0.2),
  new Vector3(-1, 8.6 + i * 0.3, -6),
  new Vector3(1, 8.4 + i * 0.3, -6.8),
  new Vector3(2.9, 9.6 + i * 0.3, -8),
]))
export function ArchitectureDetails() {
  return <group name="nocturne-static-details">
    {(Object.keys(finishes) as Finish[]).map(finish => <Boxes key={finish} finish={finish} />)}
    {[-1, 1].map(side => <group key={side}>
      {[-4.8, -24.8, -44.8].map(z => <group key={z}>
        <mesh position={[side * 2.72, 4, z]}>
          <cylinderGeometry args={[0.09, 0.09, 8, 8]} />
          <meshStandardMaterial {...finishes.steel} />
        </mesh>
        {[0.8, 3.5, 6.5].map(y => <mesh key={y} position={[side * 2.72, y, z]}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 8]} />
          <meshStandardMaterial {...finishes.frame} />
        </mesh>)}
      </group>)}
    </group>)}
    {cables.map((curve, index) => <mesh key={index}>
      <tubeGeometry args={[curve, 20, 0.028, 5, false]} />
      <meshStandardMaterial color="#0b1015" roughness={0.9} />
    </mesh>)}
  </group>
}

import { BRIDGE_SEGMENTS } from './bridge'
import { NOCTURNE_LIGHT_COLORS } from './lighting'
import { useLayoutEffect, useRef } from 'react'
import { CatmullRomCurve3, InstancedMesh, Object3D, Vector3 } from 'three'

type Triple = [number, number, number]
type Part = { position: Triple, size: Triple, rotation?: Triple }
type BridgeFinish = `bridge${number}`
const bridgeFinishes = Array.from({ length: BRIDGE_SEGMENTS }, (_, i) => `bridge${i}` as BridgeFinish)
type Finish = BridgeFinish | 'steel' | 'frame' | 'recess' | 'cyan' | 'cyanDetails' | 'cyanPanel' | 'magenta' | 'magentaSecondary' | 'violet' | 'violetSecondary' | 'asphalt'
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
  asphalt: { color: '#151c21', roughness: 0.98, metalness: 0 },
}
// All repeated facade parts share a unit box and one material per finish.
const parts: Record<Finish, Part[]> = { steel: [], frame: [], recess: [], cyan: [], cyanDetails: [], cyanPanel: [], magenta: [], magentaSecondary: [], ...Object.fromEntries(bridgeFinishes.map(name => [name, []])), violet: [], violetSecondary: [], asphalt: [] }
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
  }
  // Large fixture bodies, panel housings and thin strip channels for N03.
  for (const z of (side === 1 ? [-3, -18, -34] : [-13, -29, -44])) {
    wall(side, 'frame', 0.22, 2.75, z, [0.44, 3.3, 1.25])
    wall(side, side === 1 && z === -3 ? 'magenta' : 'magentaSecondary', 0.46, 2.75, z, [0.06, 2.95, 0.96])
    wall(side, 'steel', 0.08, 5.7, z - 1.3, [0.16, 3.2, 0.1])
    wall(side, side === 1 ? 'violet' : 'violetSecondary', 0.17, 5.7, z - 1.3, [0.025, 3.05, 0.045])
    wall(side, side === 1 ? 'violet' : 'violetSecondary', 0.13, 0.32, z, [0.04, 0.045, 2.1])
    wall(side, 'frame', 0.18, 4.75, z + 3, [0.36, 0.7, 1.6])
    wall(side, 'cyanDetails', 0.38, 4.75, z + 3, [0.05, 0.5, 1.35])
  }
  // Drain slots and curb joints.
  for (let i = 0; i < 28; i++) {
    box('recess', [side * 2.72, 0.245, 3 - i * 2], [0.19, 0.012, 0.5])
    box('frame', [side * 2.85, 0.245, 4 - i * 2], [0.3, 0.012, 0.035])
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
// Bridge underside ribs, fasteners and unlit luminaire housings.
for (let i = 0; i < 9; i++) box('steel', [-2.8 + i * 0.7, 4.39, -8], [0.09, 0.22, 1.8])
for (const x of [-1.8, 1.8]) {
  box('frame', [x, 4.22, -7.1], [1.35, 0.14, 0.36])
  // Contiguous thirds retain the existing diffuser footprint and its two housings.
  for (let j = 0; j < 3; j++) box(bridgeFinishes[(x < 0 ? 0 : 3) + j],
    [x - 1.15 / 2 + (j + .5) * 1.15 / 3, 4.13, -7.1], [1.15 / 3, .035, .22])
}
// Slender metal gate bars retain the distant focal opening.
for (let i = 0; i < 10; i++) box('steel', [-1.02 + i * 0.226, 1.9, -51.25], [0.035, 3.65, 0.055])

function Boxes({ finish }: { finish: Finish }) {
  const mesh = useRef<InstancedMesh>(null)
  const items = parts[finish]
  useLayoutEffect(() => {
    if (!mesh.current) return
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
  }, [items])
  const group = finish === 'magenta' || finish === 'cyan' || finish === 'violet' ? finish : finish === 'cyanPanel' || finish === 'cyanDetails' ? 'cyan' : finish === 'magentaSecondary' || finish.startsWith('bridge') ? 'magenta' : finish === 'violetSecondary' ? 'violet' : null
  return <instancedMesh name={`nocturne-${finish}`} ref={mesh} args={[undefined, undefined, items.length]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial {...finishes[finish]} color={group ? '#070a0f' : finishes[finish].color}
      metalness={group ? 0 : finishes[finish].metalness} roughness={group ? 0.95 : finishes[finish].roughness} emissive={group ? NOCTURNE_LIGHT_COLORS[group] : '#000000'}
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

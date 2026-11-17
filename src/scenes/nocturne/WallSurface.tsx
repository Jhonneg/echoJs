import { useEffect, useMemo } from 'react'
import { BoxGeometry, DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three'

type Finish = 'metal' | 'concrete'
type Maps = { color: DataTexture, surface: DataTexture }
type WallSurfaces = Record<Finish, Maps>
const SIZE = 512
const PERIOD = 4 // metres per repeat, independent of building size

function createMaps(finish: Finish): Maps {
  const color = new Uint8Array(SIZE * SIZE * 4)
  const surface = new Uint8Array(color.length)
  let seed = finish === 'metal' ? 8171 : 4319
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const columns = finish === 'metal' ? 4 : 2
  const rows = finish === 'metal' ? 2 : 1
  const panelValues = Array.from({ length: columns * rows }, () => random())
  const streaks = Array.from({ length: SIZE }, () => random())
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE * columns, v = y / SIZE * rows
    const edge = Math.min(u % 1, 1 - u % 1, v % 1, 1 - v % 1)
    const seam = Math.max(0, 1 - edge / (finish === 'metal' ? 0.014 : 0.009))
    const panel = panelValues[Math.floor(v) * columns + Math.floor(u)]
    const grain = random() - 0.5
    const streak = streaks[x] * 0.5 + streaks[(x + 1) % SIZE] * 0.3 + streaks[(x + 2) % SIZE] * 0.2
    const value = 0.83 + panel * 0.1 + grain * 0.055 - seam * 0.3 - streak * 0.045
    const i = (y * SIZE + x) * 4
    color[i] = color[i + 1] = color[i + 2] = Math.round(value * 255)
    color[i + 3] = 255
    // Red is bump height; green is the standard material roughness channel.
    surface[i] = Math.round((0.55 - seam * 0.25 + grain * (finish === 'metal' ? 0.07 : 0.2)) * 255)
    surface[i + 1] = Math.round((finish === 'metal' ? 0.52 + panel * 0.2 + streak * 0.08 : 0.86 + panel * 0.1 + grain * 0.04) * 255)
    surface[i + 2] = 0
    surface[i + 3] = 255
  }
  const make = (data: Uint8Array, isColor: boolean) => {
    const texture = new DataTexture(data, SIZE, SIZE)
    texture.name = `nocturne-wall-${finish}-${isColor ? 'color' : 'surface'}`
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.magFilter = LinearFilter
    texture.minFilter = LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.anisotropy = 4
    if (isColor) texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }
  return { color: make(color, true), surface: make(surface, false) }
}

function IndustrialBuilding({ position, size, color, finish, surfaces }: {
  position: [number, number, number], size: [number, number, number], color: string, finish: Finish, surfaces: WallSurfaces | null,
}) {
  const maps = surfaces?.[finish]
  const worldUVs = (geometry: BoxGeometry) => {
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal'), uv = geometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + position[0], y = positions.getY(i) + position[1], z = positions.getZ(i) + position[2]
      if (Math.abs(normals.getX(i)) > 0.5) uv.setXY(i, z / PERIOD, y / PERIOD)
      else if (Math.abs(normals.getY(i)) > 0.5) uv.setXY(i, x / PERIOD, z / PERIOD)
      else uv.setXY(i, x / PERIOD, y / PERIOD)
    }
    uv.needsUpdate = true
  }
  return <mesh name={`nocturne-${finish}-building`} position={position}>
    <boxGeometry args={size} onUpdate={worldUVs} />
    <meshStandardMaterial color={color} map={maps?.color ?? null} bumpMap={maps?.surface ?? null}
      bumpScale={finish === 'metal' ? 0.028 : 0.018} roughnessMap={maps?.surface ?? null}
      roughness={1} metalness={finish === 'metal' ? 0.38 : 0.03} />
  </mesh>
}

export function IndustrialBuildings() {
  const surfaces = useMemo<WallSurfaces>(() => ({ metal: createMaps('metal'), concrete: createMaps('concrete') }), [])
  useEffect(() => () => {
    for (const maps of Object.values(surfaces)) { maps.color.dispose(); maps.surface.dispose() }
  }, [surfaces])
  return <group name="nocturne-industrial-buildings">
    {[-1, 1].flatMap(side => [0, 1, 2, 3, 4, 5].map(index => {
      const height = [18, 22, 16, 20, 14, 19][(index + (side === 1 ? 2 : 0)) % 6]
      return <IndustrialBuilding key={`${side}-${index}`} position={[side * 6, height / 2, 2 - index * 10]} size={[6, height, 9.8]}
        color={index % 2 ? '#303940' : '#263037'} finish={(index + (side === 1 ? 1 : 0)) % 3 === 0 ? 'concrete' : 'metal'} surfaces={surfaces} />
    }))}
  </group>
}

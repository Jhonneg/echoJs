import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, ShapeUtils, Vector2, type Color } from 'three'

// One authored resting pose; shared by the solid and its analytic lake image.
export const MONOLITH = {
  x: .6, y: 2.25, width: 1.2, height: 3.6, depth: .65, yaw: -.38,
  seamX: -.24, seamWidth: .024, seamHeight: 3.15, seamZ: .283,
  waterY: -.02, reflectionCompression: .82,
} as const

export const STONE_FRAGMENTS = [
  { x: -.55, y: 2.4, width: .22, height: .38, depth: .20, lean: .18 },
  { x: 1.83, y: 1.12, width: .14, height: .23, depth: .13, lean: -.3 },
] as const

type Point = [number, number, number]
function geometryFromTriangles(triangles: Point[][]) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(triangles.flat(2), 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

// Chamfered cross sections include a real shallow V-sided groove. Duplicated
// face vertices retain stone facets rather than smoothing away the bevels.
export function createMonolithGeometry() {
  const m = MONOLITH, x = m.width / 2, z = m.depth / 2, b = .035
  const ring = [
    [-x + b, z], [m.seamX - .045, z], [m.seamX - .019, m.seamZ - .004],
    [m.seamX + .019, m.seamZ - .004], [m.seamX + .045, z], [x - b, z],
    [x, z - b], [x, -z + b], [x - b, -z], [-x + b, -z], [-x, -z + b], [-x, z - b],
  ]
  const levels = [-1.8, -1.76, -1.2, -.6, 0, .6, 1.2, 1.76, 1.8]
  const rows = levels.map((y, row) => ring.map(([px, pz], i): Point => {
    const end = row === 0 || row === levels.length - 1
    const shrink = end ? .028 : 0
    const chip = i >= 5 || i === 0 ? .004 * Math.sin(row * 2.3 + i * 1.7) : 0
    return [px - Math.sign(px) * shrink + chip, y, pz - Math.sign(pz) * shrink]
  }))
  const triangles: Point[][] = []
  for (let r = 0; r < rows.length - 1; r++) for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length, a = rows[r][i], b = rows[r][j], c = rows[r + 1][i], d = rows[r + 1][j]
    triangles.push([a, b, c], [b, d, c])
  }
  for (const row of [0, rows.length - 1]) {
    const cap = rows[row]
    for (const face of ShapeUtils.triangulateShape(cap.map(p => new Vector2(p[0], p[2])), [])) {
      const [a, b, c] = face.map(i => cap[i])
      const normalY = (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2])
      triangles.push(normalY * (row === 0 ? -1 : 1) > 0 ? [a,b,c] : [a,c,b])
    }
  }
  return geometryFromTriangles(triangles)
}

export function createStoneFragmentGeometry(index: number) {
  const f = STONE_FRAGMENTS[index], w = f.width / 2, h = f.height / 2, d = f.depth / 2
  const points: Point[] = [[f.lean * h, h, 0], [-f.lean * h * .5, -h, 0],
    [-w, .025, d * .1], [w * .8, -.02, d * .2], [0, .01, d], [.02, -.01, -d]]
  const faces = [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
    [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]]
  // Faces above are outward for this asymmetric octahedral construction.
  return geometryFromTriangles(faces.map(face => face.map(i => points[i])))
}

const stoneNoise = `
varying vec3 stonePosition;
varying vec3 stoneNormal;
uniform vec3 stoneAuroraColor;
uniform float stoneAuroraStrength;
uniform float stoneSeamLevel;
float stoneHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float stoneNoise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(stoneHash(i),stoneHash(i+vec3(1,0,0)),f.x),
    mix(stoneHash(i+vec3(0,1,0)),stoneHash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(stoneHash(i+vec3(0,0,1)),stoneHash(i+vec3(1,0,1)),f.x),
    mix(stoneHash(i+vec3(0,1,1)),stoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`

// Built-in directional lighting/fog stays intact. A bounded, stone-only right
// fill reveals depth without altering the approved light on terrain or auroras.
export function createStoneMaterial(auroraColor: Color, auroraStrength: { value: number }) {
  const material = Object.assign(new MeshStandardMaterial({ color: '#373441', roughness: .97, metalness: 0 }), { seamLevel: { value: 1 }, auroraStrength: { value: auroraStrength.value } })
  material.onBeforeCompile = shader => {
    shader.uniforms.stoneAuroraColor = { value: auroraColor }
    shader.uniforms.stoneAuroraStrength = material.auroraStrength
    shader.uniforms.stoneSeamLevel = material.seamLevel
    shader.vertexShader = 'varying vec3 stonePosition; varying vec3 stoneNormal;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nstonePosition=position;stoneNormal=normalize(mat3(modelMatrix)*normal);')
    shader.fragmentShader = stoneNoise + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float broad=stoneNoise(stonePosition*vec3(7.0,3.5,7.0));
      float grain=stoneNoise(stonePosition*85.0);
      float fissure=1.0-smoothstep(0.015,0.055,abs(sin(stonePosition.y*4.8+stonePosition.x*7.0+broad*8.0)));
      float stoneValue=0.66+broad*0.45+grain*0.12-fissure*0.13;
      diffuseColor.rgb*=stoneValue;
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
      #include <normal_fragment_maps>
      float relief=stoneNoise(stonePosition*30.0)*0.003;
      vec3 qx=dFdx(-vViewPosition),qy=dFdy(-vViewPosition);
      vec3 rx=cross(qy,normal),ry=cross(normal,qx);
      float det=dot(qx,rx);
      normal=normalize(abs(det)*normal-sign(det)*(dFdx(relief)*rx+dFdy(relief)*ry));
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      float rightFace=pow(max(dot(normalize(stoneNormal),normalize(vec3(0.85,0.25,0.35))),0.0),2.0);
      totalEmissiveRadiance+=(vec3(0.065,0.045,0.075)+stoneAuroraColor*stoneAuroraStrength*0.13)*rightFace*stoneValue;
      float seamFalloff=exp(-abs(stonePosition.x+0.24)*45.0/stoneSeamLevel);
      float seamEnd=1.0-smoothstep(1.49,1.64,abs(stonePosition.y));
      float frontFace=smoothstep(0.27,0.32,stonePosition.z);
      totalEmissiveRadiance+=vec3(0.36,0.10,0.19)*seamFalloff*seamEnd*frontFace*stoneSeamLevel;
    `)
  }
  material.customProgramCacheKey = () => 'bloom-stone-v2'
  return material
}

export interface MonolithProjection { left: number; frontRight: number; right: number; seamX: number; seamWidth: number; bottom: number; top: number; seamBottom: number; seamTop: number }
export function monolithProjection(y: number = MONOLITH.y, yaw: number = MONOLITH.yaw, target = {} as MonolithProjection) {
  const m = MONOLITH, c = Math.cos(yaw), s = Math.sin(yaw), half = c * m.width / 2
  target.left = m.x + s * m.depth / 2 - half
  target.frontRight = m.x + s * m.depth / 2 + half
  target.right = m.x + half - s * m.depth / 2
  target.seamX = m.x + c * m.seamX + s * m.seamZ; target.seamWidth = c * m.seamWidth
  target.bottom = (y - m.height / 2 - m.waterY) * m.reflectionCompression
  target.top = (y + m.height / 2 - m.waterY) * m.reflectionCompression
  target.seamBottom = (y - m.seamHeight / 2 - m.waterY) * m.reflectionCompression
  target.seamTop = (y + m.seamHeight / 2 - m.waterY) * m.reflectionCompression
  return target
}

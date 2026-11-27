import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, InstancedMesh, Object3D } from 'three'
import { SKYLINE, SKYLINE_TOWERS, skylineWindows } from './skyline'

// NT17 distant skyline (see skyline.ts). Static: no music response and no per-frame work.
const glowVertex = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const glowFragment = `uniform vec3 glow;
  uniform float strength;
  uniform float centerV;
  varying vec2 vUv;
  void main() {
    float up = max(0.0, vUv.y - centerV);
    float down = max(0.0, centerV - vUv.y);
    float sky = exp(-up * 6.0) * exp(-down * 14.0);
    sky *= 1.0 - smoothstep(0.25, 0.5, abs(vUv.x - 0.5));
    gl_FragColor = vec4(glow * strength, sky);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

export function Skyline() {
  const windows = useRef<InstancedMesh>(null)
  const { lit } = useMemo(() => skylineWindows(), [])
  const glow = useMemo(() => ({
    glow: { value: new Color(SKYLINE.glow.color) },
    strength: { value: SKYLINE.glow.strength },
    // The glow's brightest line sits at the skyline (in the plane's 0–1 height).
    centerV: { value: (SKYLINE.glow.brightestY - (SKYLINE.glow.centerY - SKYLINE.glow.height / 2)) / SKYLINE.glow.height },
  }), [])
  useLayoutEffect(() => {
    const mesh = windows.current
    if (!mesh) return
    const transform = new Object3D(), tints = SKYLINE.tints.map(tint => new Color(tint))
    lit.forEach((window, index) => {
      transform.position.set(window.x, window.y, window.z)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
      mesh.setColorAt(index, tints[window.tint])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [lit])
  return <group name="nocturne-skyline">
    <mesh name="nocturne-skyline-glow" position={[0, SKYLINE.glow.centerY, SKYLINE.glow.z]}>
      <planeGeometry args={[SKYLINE.glow.width, SKYLINE.glow.height]} />
      <shaderMaterial uniforms={glow} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={AdditiveBlending} />
    </mesh>
    {SKYLINE_TOWERS.map((tower, index) => <mesh key={index} name="nocturne-skyline-tower" position={[tower.x, tower.height / 2, tower.z]}>
      <boxGeometry args={[tower.width, tower.height, tower.depth]} />
      <meshBasicMaterial color={SKYLINE.towerColor} fog={false} />
    </mesh>)}
    <instancedMesh name="nocturne-skyline-windows" ref={windows} args={[undefined, undefined, lit.length]}>
      <planeGeometry args={[SKYLINE.window.width, SKYLINE.window.height]} />
      <meshBasicMaterial fog={false} />
    </instancedMesh>
  </group>
}

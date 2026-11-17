import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { PlaneGeometry, ShaderMaterial, Vector2 } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import type { GraphicsQuality } from '../../engine/quality'

const wetShader = {
  name: 'NocturneWetGround',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    texel: { value: new Vector2(1 / 512, 1 / 512) },
  },
  vertexShader: `uniform mat4 textureMatrix;
    varying vec4 vReflection;
    varying vec3 vWorld;
    void main() {
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      vReflection = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `uniform sampler2D tDiffuse;
    uniform vec2 texel;
    varying vec4 vReflection;
    varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }
    void main() {
      vec2 p = vWorld.xz;
      float pools = noise(p * vec2(1.1, 0.65)) * 0.7 + noise(p * 3.1) * 0.3;
      float puddle = smoothstep(0.44, 0.59, pools);
      float edges = 1.0 - smoothstep(2.35, 2.66, abs(p.x));
      float breakup = noise(p * vec2(9.0, 17.0));
      vec2 uv = vReflection.xy / vReflection.w;
      // Static surface irregularity: no water animation or temporal jitter.
      uv.x += (noise(p * vec2(3.0, 12.0)) - 0.5) * 0.0025;
      uv.y += (breakup - 0.5) * 0.001;
      vec2 spread = texel * mix(1.8, 0.65, puddle);
      vec3 reflected = texture2D(tDiffuse, uv).rgb * 0.4;
      reflected += texture2D(tDiffuse, uv + vec2(spread.x, 0)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv - vec2(spread.x, 0)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv + vec2(0, spread.y)).rgb * 0.15;
      reflected += texture2D(tDiffuse, uv - vec2(0, spread.y)).rgb * 0.15;
      float facing = max(normalize(cameraPosition - vWorld).y, 0.0);
      float fresnel = 0.1 + 0.9 * pow(1.0 - facing, 4.0);
      float wetness = mix(0.09, 0.86, puddle) * edges;
      float strength = wetness * (0.32 + 0.65 * fresnel) * mix(0.65, 1.0, breakup);
      gl_FragColor = vec4(reflected * 0.9, strength);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}

export function WetGround({ quality }: { quality: GraphicsQuality }) {
  const { scene, size } = useThree()
  const reflector = useRef<Reflector | null>(null)
  // Allocate in the effect so StrictMode setup/cleanup owns every GPU resource.
  useLayoutEffect(() => {
    const geometry = new PlaneGeometry(5.36, 60)
    const floor = new Reflector(geometry, { shader: wetShader, textureWidth: 1, textureHeight: 1, clipBias: 0.003, multisample: 0 })
    floor.name = 'nocturne-wet-ground'
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0.016, -23)
    const material = floor.material as ShaderMaterial
    material.transparent = true
    material.depthWrite = false
    scene.add(floor)
    reflector.current = floor
    return () => {
      reflector.current = null
      scene.remove(floor)
      floor.dispose()
      geometry.dispose()
    }
  }, [scene])
  useLayoutEffect(() => {
    const floor = reflector.current
    if (!floor) return
    const cap = quality === 'low' ? 512 : 1024
    const scale = Math.min(quality === 'low' ? 0.4 : 0.7, cap / Math.max(size.width, size.height, 1))
    const width = Math.max(128, Math.floor(size.width * scale))
    const height = Math.max(128, Math.floor(size.height * scale))
    floor.getRenderTarget().setSize(width, height)
    const material = floor.material as ShaderMaterial
    material.uniforms.texel.value.set(1 / width, 1 / height)
  }, [quality, size.width, size.height])
  return null
}

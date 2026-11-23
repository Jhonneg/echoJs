import { Color, MeshStandardMaterial } from 'three'

// Material-local aurora fill: existing vertex colors, directional shading and fog
// remain intact. Only exposed upper faces receive musical excess above ambient.
export function createMountainMaterial() {
  const material = Object.assign(new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), {
    auroraStrength: { value: 0 }, auroraColor: { value: new Color() },
  })
  material.onBeforeCompile = shader => {
    shader.uniforms.surfaceAurora = material.auroraStrength
    shader.uniforms.surfaceColor = material.auroraColor
    shader.vertexShader = 'varying vec3 surfaceNormal; varying vec3 surfacePosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nsurfaceNormal=normalize(mat3(modelMatrix)*normal);surfacePosition=position;')
    shader.fragmentShader = 'varying vec3 surfaceNormal; varying vec3 surfacePosition; uniform float surfaceAurora; uniform vec3 surfaceColor;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      float exposed=pow(max(dot(normalize(surfaceNormal),normalize(vec3(-0.15,0.85,0.5))),0.0),2.0);
      float highFace=smoothstep(-0.1,0.7,surfacePosition.y);
      float curtain=0.65+0.35*sin(surfacePosition.x*0.85+surfacePosition.z*0.4);
      totalEmissiveRadiance+=surfaceColor*surfaceAurora*0.12*exposed*highFace*curtain;
    `)
  }
  material.customProgramCacheKey = () => 'bloom-mountain-aurora-v1'
  return material
}

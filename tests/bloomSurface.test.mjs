import test from 'node:test'
import assert from 'node:assert/strict'
import {createMountainMaterial} from '../src/scenes/bloom/surface.ts'

test('compiled mountain surfaces borrow their own live uniforms across frame updates and recompilation',()=>{
 const material=createMountainMaterial(),other=createMountainMaterial()
 const compile=()=>{
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <emissivemap_fragment>'}
  material.onBeforeCompile(shader,null);return shader
 }
 const first=compile();material.auroraStrength.value=.45;material.auroraColor.value.set('#9CD7C8')
 assert.equal(first.uniforms.surfaceAurora.value,.45)
 assert.equal(first.uniforms.surfaceColor.value,material.auroraColor.value)
 assert.equal(compile().uniforms.surfaceAurora,first.uniforms.surfaceAurora)
 assert.equal(other.auroraStrength.value,0,'separate material instances cannot retain stale shared props')
 material.dispose();other.dispose()
})

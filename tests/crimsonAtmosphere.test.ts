import test from 'node:test'
import assert from 'node:assert/strict'
import { createAtmosphere, updateAtmosphere } from '../src/scenes/crimson-horizon/atmosphere.ts'
test('slow atmospheric context is proportional, bounded, cadence-independent and validity gated',()=>{
  for(const hz of [30,60,120]){
    const s=createAtmosphere();for(let i=0;i<hz*4;i++)updateAtmosphere(s,.8,.4,.5,true,true,1/hz,1,false)
    assert.ok(Math.abs(s.density-(.65*.8+.35*.4)*(1-Math.exp(-2)))<1e-12)
    assert.ok(Math.abs(s.warmth-.4*(1-Math.exp(-2)))<1e-12)
    const before=s.warmth;updateAtmosphere(s,1,1,1,false,true,1/hz,1,false);assert.ok(s.warmth<before)
  }
})
test('atmosphere fades to rest when disabled/gain zero; reduced ramps slower; short hits cannot flash',()=>{
  const normal=createAtmosphere(),reduced=createAtmosphere()
  for(let i=0;i<6;i++){updateAtmosphere(normal,1,1,1,true,true,1/60,1,false);updateAtmosphere(reduced,1,1,1,true,true,1/60,1,true)}
  assert.ok(normal.density<.05);assert.ok(reduced.density<normal.density)
  for(let i=0;i<3000;i++)updateAtmosphere(normal,1,1,1,true,false,1/60,1,false)
  assert.deepEqual(normal,createAtmosphere())
  for(let i=0;i<3000;i++)updateAtmosphere(reduced,1,1,1,true,true,1/60,0,true)
  assert.deepEqual(reduced,createAtmosphere())
})

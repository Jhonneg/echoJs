import test from 'node:test'
import assert from 'node:assert/strict'
import {createAurora,updateAurora,AURORA_PERIOD} from '../src/scenes/bloom/aurora.ts'
test('autonomous light stays bounded and evolves slowly without audio',()=>{
 const s=createAurora();let maximumStep=0,previous=s.strength
 for(let i=0;i<12000;i++){updateAurora(s,1/60,false);maximumStep=Math.max(maximumStep,Math.abs(s.strength-previous));previous=s.strength;assert.ok(s.strength>=.18&&s.strength<=.3);assert.ok(s.hue>=.15&&s.hue<=.85)}
 assert.ok(maximumStep<.0001);assert.ok(s.time>0)
})
test('reduced motion freezes phase, hue and illumination; invalid deltas cannot jump',()=>{
 const s=createAurora();updateAurora(s,1,false);const before={...s}
 for(let i=0;i<120;i++)updateAurora(s,1/60,true)
 assert.deepEqual(s,before)
 for(const dt of [NaN,Infinity,-1])updateAurora(s,dt,false)
 assert.deepEqual(s,before)
})
test('cadence and phase wrap stay coherent',()=>{
 const values=[]
 for(const hz of [30,60,120]){const s=createAurora();for(let i=0;i<hz*3;i++)updateAurora(s,1/hz,false);values.push(s.time)}
 assert.ok(Math.max(...values)-Math.min(...values)<1e-10)
 const a=createAurora(),b=createAurora();a.time=AURORA_PERIOD-.01;updateAurora(a,.02,false);updateAurora(b,.01,false)
 assert.ok(Math.abs(a.strength-b.strength)<1e-12);assert.ok(Math.abs(a.hue-b.hue)<1e-12)
 for(const rate of [.03,.04,.05,.08])assert.ok(Math.abs(Math.sin(rate*AURORA_PERIOD))<1e-10)
})

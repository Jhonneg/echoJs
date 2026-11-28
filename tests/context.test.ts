import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createMusicalContext,CONTEXT_SETTINGS} from '../src/dev/audioLab/context.ts'
import {contextFixtures,assessContext} from '../src/dev/audioLab/contextComparison.ts'
const bins=()=>new Float32Array(1024).fill(-Infinity)
const rms=(bass=0,midrange=0,treble=0)=>({bass,midrange,treble})
function harness(){const engine=createMusicalContext(48000,2048),spectrum=bins(),onsets:any={session:1,sequence:0,events:[]};let time=0;engine.update(spectrum,rms(),onsets,time);return {engine,spectrum,onsets,step(level=rms(),dt=1/60,active=true){time+=dt;return engine.update(spectrum,level,onsets,time,active)}}}
test('intensity follows the analytical continuous exponential and preserves fixed contrast',()=>{
  const x=harness();let elapsed=0
  for(let i=0;i<180;i++){elapsed+=1/60;const v=x.step(rms(.25));assert.ok(Math.abs(v.intensity-.5*(1-Math.exp(-elapsed/.75)))<1e-12)}
  const peak=x.engine.view.intensity;elapsed=0
  for(let i=0;i<600;i++){elapsed+=1/60;assert.ok(Math.abs(x.step().intensity-peak*Math.exp(-elapsed/1.5))<1e-12)}
  assert.ok(x.engine.view.intensity<=.005)
})
test('centroid uses bin power, brightness is level-invariant and confidence does not gate quiet intensity',()=>{
  const values:any[]=[]
  for(const db of [-36,-24,-12,-6]){const x=harness();x.spectrum[40]=db;x.spectrum[80]=db-6
    for(let i=0;i<360;i++)x.step(rms(0,.1))
    const expected=(40*48000/2048+80*48000/2048*10**(-.6))/(1+10**(-.6))
    assert.ok(Math.abs(x.engine.view.centroidHz!-expected)<1e-9);values.push(x.engine.view.brightness)
  }
  assert.ok(Math.max(...values)-Math.min(...values)<1e-12)
  const x=harness();x.spectrum[43]=-100
  for(let i=0;i<360;i++)x.step(rms(0,.001))
  assert.equal(x.engine.view.brightnessValid,false);assert.equal(x.engine.view.centroidHz,null)
  assert.equal(x.engine.view.brightness,0);assert.ok(x.engine.view.intensity>0)
})
test('accepted event rate matches an independent timestamp-window oracle without duplicate consumption',()=>{
  const x=harness(),events:{timeSeconds:number,strength:number}[]=[]
  for(let i=1;i<900;i++){
    const time=i/60
    if(i%13===0){const e=Object.freeze({session:1,sequence:++x.onsets.sequence,band:'mid' as const,timeSeconds:time-.01,emittedAtSeconds:time,strength:(i%3+1)/4});events.push(e);x.onsets.events.push(e)}
    const v=x.step(),eligible=events.filter(e=>e.timeSeconds>v.time-4)
    assert.equal(v.eventCount,eligible.length);assert.ok(Math.abs(v.strengthRate-eligible.reduce((s,e)=>s+e.strength,0)/4)<1e-12)
    assert.equal(v.overflow,false)
  }
  assert.ok(x.engine.view.eventCount<x.onsets.events.length)
})
test('activity increases with event frequency and strength without using BPM',()=>{
  function activity(interval,strength){const x=harness();for(let i=1;i<900;i++){if(i%interval===0)x.onsets.events.push({session:1,sequence:++x.onsets.sequence,band:'mid' as const,timeSeconds:i/60,emittedAtSeconds:i/60,strength});x.step()}return x.engine.view.activity}
  const slow=activity(60,.25),fast=activity(30,.25),strong=activity(30,.5)
  assert.ok(slow<fast&&fast<strong&&strong<1)
})
test('activity expires exactly on the open four-second boundary and all controls decay in silence',()=>{
  const engine=createMusicalContext(48000,2048),spectrum=bins(),onsets:any={session:1,sequence:0,events:[]}
  spectrum[43]=-12;engine.update(spectrum,rms(0,.5),onsets,0)
  onsets.sequence=1;onsets.events.push({session:1,sequence:1,band:'mid' as const,timeSeconds:.125,emittedAtSeconds:.125,strength:1})
  for(let i=1;i<=32;i++){const v=engine.update(spectrum,rms(0,.5),onsets,i*.125);assert.equal(v.countRate,.25);assert.equal(v.strengthRate,.25)}
  engine.update(spectrum,rms(0,.5),onsets,4.125);assert.equal(engine.view.eventCount,0)
  spectrum.fill(-Infinity)
  for(let i=34;i<=114;i++)engine.update(spectrum,rms(),onsets,i*.125)
  assert.ok(engine.view.intensity<=.005&&engine.view.brightness<=.005&&engine.view.activity<=.005)
})
test('source/session/seek reset, inactivity, invalid input and gaps clear context without replay',()=>{
  const x=harness();for(let i=0;i<60;i++)x.step(rms(.2))
  const before=x.engine.view.session;x.onsets.session++;x.step(rms(.2));assert.equal(x.engine.view.intensity,0);assert.ok(x.engine.view.session>before)
  x.step(rms(.2));x.engine.reset();assert.equal(x.engine.view.intensity,0);assert.equal(x.engine.view.eventCount,0)
  x.step(rms(.2));assert.equal(x.engine.view.intensity,0)
  x.step(rms(.2),.5);assert.equal(x.engine.view.intensity,0)
  x.step(rms(.2),1/60,false);assert.equal(x.engine.view.primed,false)
  x.step(rms(NaN));assert.equal(x.engine.view.primed,false)
  const a=createMusicalContext(48000,2048),b=createMusicalContext(48000,2048),empty={session:7,sequence:0,events:[]}
  for(let i=0;i<100;i++)assert.deepEqual(a.update(bins(),rms(.1),empty,i/60),b.update(bins(),rms(.1),empty,i/60))
})
test('capacity overflow is visible and reset clears it; manifest and empty verdict are honest',()=>{
  const x=harness();x.onsets.events=Array.from({length:300},(_,i)=>({session:1,sequence:i+1,band:'mid' as const,timeSeconds:.01,emittedAtSeconds:.01,strength:.1}));x.onsets.sequence=300
  x.step();assert.equal(x.engine.view.overflow,true);assert.equal(x.engine.view.eventCount,256)
  x.engine.reset();assert.equal(x.engine.view.overflow,false)
  assert.equal(contextFixtures.length,36);assert.equal(new Set(contextFixtures.map(f=>f.specimen)).size,12)
  assert.ok(contextFixtures.every(f=>f.duration-f.phaseSeconds<=20))
  assert.equal(assessContext([]).pass,false);assert.equal(CONTEXT_SETTINGS.activityWindow,4)
})

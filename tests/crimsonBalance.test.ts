import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { silentSignal, emptySixBands } from '../src/audio/signal.ts'
import { createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { createJourney, updateJourney } from '../src/scenes/crimson-horizon/journey.ts'
import { createValley, updateValley, writeValleyUniforms } from '../src/scenes/crimson-horizon/valley.ts'
function run(energy,strength,hz=60){
  const store=createMusicFeatureStore(),pilot=createMusicPilot(),journey=createJourney(),valley=createValley(),signal=silentSignal(),out=new Float32Array(16)
  let now=1,events:any[]=[],sequence=0
  const step=()=>{now+=1/hz;const six=emptySixBands();six.bass=energy
    store.publish({session:1,updatedAtSeconds:now,status:'active',sampleRate:48000,fftSize:2048,energy:{low:energy,mid:0,high:0,overall:energy,six},sequence,events,context:{intensity:0,brightness:0,brightnessValid:false,activity:0}})
    signal.isPlaying=true;signal.updatedAt=now*1000
    updateMusicPilot(pilot,store.reader,'candidate',1/hz,now,1,false)
    updateValley(valley,store.reader,true,journey.distance,now,1/hz,1,false)
    updateJourney(journey,signal,1,false,1/hz,now*1000,Infinity,pilot)
    writeValleyUniforms(valley,0,now,1,out)
    const scale=1+.15*pilot.body+.05*pilot.low
    assert.ok(scale>=1&&scale<=1.2);assert.ok(pilot.low>=0&&pilot.low<=1);assert.ok(journey.speed<=24)
    return {scale,pulse:pilot.low,waveAmplitude:out[1],wavePosition:out[0],body:pilot.body}
  }
  for(let i=0;i<hz*5;i++)step()
  const sustained=step()
  events=[Object.freeze({session:1,sequence:++sequence,band:'low',timeSeconds:now,emittedAtSeconds:now,strength})]
  const frames:any[]=[];for(let i=0;i<hz*5;i++)frames.push(step())
  return {sustained,frames,launched:valley.launched}
}
test('quiet/loud sun states remain ordered at multiple cadences and sustained input does not repeat accents',()=>{
  for(const hz of [30,60,120]){
    const soft=run(.03,.03,hz),loud=run(.3,.3,hz)
    assert.ok(loud.sustained.scale>soft.sustained.scale)
    assert.ok(Math.max(...loud.frames.map(f=>f.scale))>Math.max(...soft.frames.map(f=>f.scale)))
    assert.equal(soft.launched,1);assert.equal(loud.launched,1)
    assert.equal(loud.frames.at(-1).pulse,0);assert.equal(loud.frames.at(-1).waveAmplitude,0)
  }
})
test('one low event gives an immediate sun accent followed by independently traveling ground light',()=>{
  const result=run(.1,.1),early=result.frames.slice(0,6),late=result.frames[77]
  assert.ok(Math.max(...early.map(f=>f.pulse))>.39)
  assert.ok(late.pulse<.01);assert.ok(late.waveAmplitude>.1)
  assert.ok(late.wavePosition>early[0].wavePosition+30)
  assert.equal(result.launched,1)
})

test('maximum sustained bass plus a full attack reaches the approved20% cap without overshoot',()=>{
  const full=run(1,1)
  assert.ok(Math.abs(full.sustained.scale-1.15)<1e-9)
  assert.ok(Math.abs(Math.max(...full.frames.map(f=>f.scale))-1.2)<1e-9)
})

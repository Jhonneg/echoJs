import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { createMusicPilot, updateMusicPilot, upperAccentEnvelope, onsetEnvelope } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { emptySixBands } from '../src/audio/signal.ts'
test('upper accents require high onsets and own energy; proportional and no sustain retrigger',()=>{
  for(const band of ['presence','air'] as const)for(const strength of [.2,.8]){
    const state=createMusicPilot(),store=createMusicFeatureStore();let now=1,sequence=0,events:any[]=[]
    const step=(gain=1,reduced=false)=>{now+=1/60;const six=emptySixBands();six[band]=1
      store.publish({session:1,updatedAtSeconds:now,status:'active',sampleRate:48000,fftSize:2048,energy:{low:1,mid:1,high:1,overall:1,six},sequence,events,context:{intensity:1,brightness:1,brightnessValid:true,activity:1}})
      updateMusicPilot(state,store.reader,'candidate',1/60,now,gain,reduced)}
    step();assert.equal(state[band],0)
    events=[{session:1,sequence:++sequence,band:'high',timeSeconds:now,emittedAtSeconds:now,strength}]
    for(let i=0;i<3;i++)step()
    assert.ok(Math.abs(state[band]-strength)<1e-8);assert.equal(state[band==='air'?'presence':'air'],0)
    for(let i=0;i<180;i++)step()
    assert.equal(state[band],0)
    events=[{session:1,sequence:++sequence,band:'high',timeSeconds:now,emittedAtSeconds:now,strength}];step(0);step();assert.equal(state[band],0)
    events=[{session:1,sequence:++sequence,band:'high',timeSeconds:now,emittedAtSeconds:now,strength}];step(1,true);step();assert.equal(state[band],0)
  }
})

test('upper accent fade stays readable longer while preserving finite expiration and proportional response',()=>{
  assert.equal(upperAccentEnvelope(-1),0);assert.equal(upperAccentEnvelope(1.8),0)
  assert.equal(upperAccentEnvelope(.05),1)
  assert.ok(upperAccentEnvelope(.4)>onsetEnvelope(.4)*1.5)
  assert.ok(upperAccentEnvelope(.8)<upperAccentEnvelope(.4))
})

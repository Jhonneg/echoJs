import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { emptySixBands } from '../src/audio/signal.ts'
test('body is proportional to fixed bass, independent of onsets/activity/other bands; silence and gain release',()=>{
  for(const bass of [0,.2,.8,1]){
    const state=createMusicPilot(),store=createMusicFeatureStore();let now=1
    const step=(bass,gain=1)=>{now+=1/60;const six=emptySixBands();six.bass=bass;six.highMids=1
      store.publish({session:1,updatedAtSeconds:now,status:'active',sampleRate:48000,fftSize:2048,energy:{low:1,mid:1,high:1,overall:1,six},sequence:0,events:[],context:{intensity:1,brightness:1,brightnessValid:true,activity:1}})
      updateMusicPilot(state,store.reader,'candidate',1/60,now,gain,false)}
    for(let i=0;i<300;i++)step(bass)
    assert.ok(Math.abs(state.body-bass)<1e-9);assert.equal(state.low,0)
    for(let i=0;i<600;i++)step(bass,0)
    assert.equal(state.body,0)
  }
})

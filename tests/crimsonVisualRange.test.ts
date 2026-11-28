import test from 'node:test'
import assert from 'node:assert/strict'
import { crimsonVisualDrive, createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
test('Crimson brightness retains ordering and gain while travel target is constant',()=>{
  const store=createMusicFeatureStore(),state=createMusicPilot()
  let previous=-1
  for(const energy of [0,.035,.1,.2,.35,.7,1]) {
    const six=emptySixBands();six.bass=energy
    store.publish({session:1,updatedAtSeconds:1,status:'active',sampleRate:48000,fftSize:2048,energy:{low:energy,mid:energy,high:energy,overall:energy,six},sequence:0,events:[],context:{intensity:energy,brightness:0,brightnessValid:false,activity:0}})
    updateMusicPilot(state,store.reader,'candidate',1/60,1,1,false)
    assert.ok(state.sun>=previous);previous=state.sun
    assert.equal(state.sun,crimsonVisualDrive(energy));assert.equal(state.speed,24)
    if(energy>=.35){assert.equal(state.sun,1);assert.equal(state.speed,24)}
    updateMusicPilot(state,store.reader,'candidate',1/60,1,.5,false)
    assert.equal(state.sun,crimsonVisualDrive(energy)*.5)
    updateMusicPilot(state,store.reader,'candidate',1/60,1,0,false);assert.equal(state.sun,0);assert.equal(state.speed,24)
  }
  updateMusicPilot(state,store.reader,'candidate',1/60,2,1,false);assert.equal(state.sun,0);assert.equal(state.speed,24)
})

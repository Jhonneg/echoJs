import test from 'node:test'
import assert from 'node:assert/strict'
import { crimsonLowAccentDrive, CRIMSON_MAX_SPEED } from '../src/scenes/crimson-horizon/response.ts'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { createValley, updateValley } from '../src/scenes/crimson-horizon/valley.ts'
import { emptySixBands } from '../src/audio/signal.ts'
test('modest low attacks get bounded ordered scene gain, preserving zero/full scale and travel cap',()=>{
  let previous=-1
  for(const strength of [0,.01,.03,.1,.25,.5,1]){const drive=crimsonLowAccentDrive(strength);assert.ok(drive>previous&&drive<=1);previous=drive}
  assert.equal(crimsonLowAccentDrive(0),0);assert.equal(crimsonLowAccentDrive(1),1)
  assert.ok(Math.abs(crimsonLowAccentDrive(.1)-.4)<1e-12)
  assert.equal(CRIMSON_MAX_SPEED,24)
})
test('sun and valley interpret the same low event without changing the shared event or retriggering sustain',()=>{
  const store=createMusicFeatureStore(),pilot=createMusicPilot(),valley=createValley();let now=1,events=[],sequence=0
  const step=()=>{now+=1/60;const six=emptySixBands();six.bass=.1
    store.publish({session:1,updatedAtSeconds:now,status:'active',sampleRate:48000,fftSize:2048,energy:{low:.1,mid:0,high:0,overall:.1,six},sequence,events,context:{intensity:0,brightness:0,brightnessValid:false,activity:0}})
    updateMusicPilot(pilot,store.reader,'candidate',1/60,now,1,false);updateValley(valley,store.reader,true,0,now,1/60,1,false)}
  step();const event=Object.freeze({session:1,sequence:++sequence,band:'low',timeSeconds:now,emittedAtSeconds:now,strength:.1});events=[event]
  for(let i=0;i<3;i++)step()
  assert.ok(Math.abs(pilot.low-.4)<1e-12);assert.ok(Math.abs(valley.waves[0].strength-.4)<1e-12);assert.equal(event.strength,.1)
  assert.equal(pilot.speed,24)
  for(let i=0;i<600;i++)step()
  assert.equal(valley.launched,1);assert.equal(pilot.low,0);assert.ok(Math.abs(pilot.body-.1/.35)<1e-10)
})

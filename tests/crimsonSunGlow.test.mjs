import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { emptySixBands } from '../src/audio/signal.ts'
function harness(gain=1,reduced=false) {
  const store=createMusicFeatureStore(),state=createMusicPilot();let now=1
  return {state,step(activity=0,energy=0,active=true) {
    now+=1/60;store.publish({session:1,updatedAtSeconds:now,status:active?'active':'inactive',sampleRate:48000,fftSize:2048,
      energy:{low:energy,mid:energy,high:energy,overall:energy,six:emptySixBands()},sequence:0,events:[],
      context:{intensity:energy,brightness:.5,brightnessValid:true,activity}})
    updateMusicPilot(state,store.reader,'candidate',1/60,now,gain,reduced)
  },stale(){now+=1;updateMusicPilot(state,store.reader,'candidate',1/60,now,gain,reduced)}}
}
test('sun halo follows context activity proportionally, independently of sustained band energy',()=>{
  let previous=-1
  for(const activity of [0,.1,.3,.6,1]) {
    const h=harness(),half=harness(.5)
    for(let i=0;i<180;i++){h.step(activity);half.step(activity)}
    assert.ok(Math.abs(h.state.glowActivity-activity)<1e-9)
    assert.ok(h.state.glowActivity>previous);previous=h.state.glowActivity
    assert.ok(Math.abs(half.state.glowActivity-h.state.glowActivity*.5)<1e-12)
    assert.equal(h.state.sun,0);assert.equal(h.state.low,0)
  }
  const h=harness();for(let i=0;i<180;i++)h.step(0,1)
  assert.equal(h.state.glowActivity,0);assert.equal(h.state.sun,1)
})
test('halo ramps smoothly, returns to idle on stop/stale, and respects zero/reduced motion',()=>{
  const h=harness();h.step(1);assert.ok(h.state.glowActivity>0&&h.state.glowActivity<1)
  for(let i=0;i<180;i++)h.step(1)
  h.stale();assert.ok(h.state.glowActivity<1&&h.state.glowActivity>0)
  for(let i=0;i<360;i++)h.step(0,0,false)
  assert.equal(h.state.glowActivity,0)
  const off=harness(0);off.step(1);assert.equal(off.state.glowActivity,0)
  const reduced=harness(1,true),normal=harness()
  for(let i=0;i<30;i++){reduced.step(1);normal.step(1)}
  assert.ok(reduced.state.glowActivity>0&&reduced.state.glowActivity<normal.state.glowActivity*.5)
})

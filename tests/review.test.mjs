import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createReviewState} from '../src/dev/audioLab/review.ts'
import {createOnsetView} from '../src/dev/audioLab/onsets.ts'
const event=(sequence,band='low',emittedAtSeconds=1)=>Object.freeze({session:7,sequence,band,timeSeconds:emittedAtSeconds-.05,emittedAtSeconds,strength:.4})
function onsets(){const v=createOnsetView();v.session=7;v.primed=true;return v}
test('review consumes immutable events once, holds from actual emission, and ignores stale events',()=>{
  const state=createReviewState(),input=onsets();input.sequence=1;input.events.push(event(1))
  const saved=structuredClone(input),v=state.update(input,1.1,true)
  assert.equal(v.bands[0].count,1);assert.equal(v.bands[0].pulseUntil,1.2)
  state.update(input,1.15,true);assert.equal(v.bands[0].count,1)
  state.update(input,1.21,true);assert.equal(v.bands[0].pulseUntil,-Infinity)
  input.sequence=2;input.events.push(event(2,'mid',1.1));state.update(input,2,true)
  assert.equal(v.bands[1].count,1);assert.equal(v.bands[1].pulseUntil,-Infinity)
  assert.deepEqual(input.events[0],saved.events[0])
})
test('presentation changes retain counts but never reveal old hidden events as fresh markers',()=>{
  const state=createReviewState(),input=onsets();input.events.push(event(1));input.sequence=1
  state.update(input,1.01,true);state.setMode('legacy',input,1.02,true)
  input.events.push(event(2,'low',1.03));input.sequence=2;state.update(input,1.04,true)
  assert.equal(state.view.bands[0].count,2);assert.equal(state.view.bands[0].pulseUntil,-Infinity)
  // An event between paints is consumed before the new presentation is revealed.
  input.events.push(event(3,'low',1.05));input.sequence=3
  const saved=structuredClone(input);state.setMode('candidate',input,1.06,true);state.update(input,1.07,true)
  assert.equal(state.view.bands[0].count,3);assert.equal(state.view.bands[0].pulseUntil,-Infinity)
  assert.deepEqual(input,saved)
  input.events.push(event(4,'low',1.08));input.sequence=4;state.update(input,1.09,true)
  assert.equal(state.view.bands[0].count,4);assert.ok(state.view.bands[0].pulseUntil>1.09)
})
test('reduced motion keeps counts without pulse replay; reset/inactive clears source display',()=>{
  const state=createReviewState(),input=onsets();input.events.push(event(1));input.sequence=1
  state.update(input,1.01,true,true);assert.equal(state.view.bands[0].count,1);assert.equal(state.view.bands[0].pulseUntil,-Infinity)
  state.update(input,1.02,true,false);assert.equal(state.view.bands[0].pulseUntil,-Infinity)
  state.update(input,1.03,false);assert.equal(state.view.bands[0].count,0)
  state.update(input,1.04,true);assert.equal(state.view.bands[0].count,0)
  input.session++;input.sequence=0;input.events=[];state.update(input,1.05,true)
  assert.equal(state.view.session,8);assert.equal(state.view.sequence,0);assert.equal(state.view.bands[0].strength,0)
})

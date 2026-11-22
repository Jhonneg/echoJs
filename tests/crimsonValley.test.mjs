import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { createValley, updateValley, writeValleyUniforms, valleyOrigin } from '../src/scenes/crimson-horizon/valley.ts'
function harness() {
  const store=createMusicFeatureStore(),state=createValley(),out=new Float32Array(16)
  let now=1,sequence=0,session=1,events=[]
  const step=(dt=1/60,{gain=1,reduced=false,candidate=true,distance=0,bass=0,active=true}={})=>{
    now+=dt;store.publish({session,updatedAtSeconds:now,status:active?'active':'inactive',sampleRate:48000,fftSize:2048,
      energy:{low:bass,mid:0,high:0,overall:bass,six:{subBass:0,bass,lowMids:0,highMids:0,presence:0,air:0}},sequence,events,
      context:{intensity:0,brightness:0,brightnessValid:false,activity:0}})
    updateValley(state,store.reader,candidate,distance,now,dt,gain,reduced);writeValleyUniforms(state,0,now,gain,out)
  }
  step()
  return {state,out,step,event(strength=1,band='low'){events.push({session,sequence:++sequence,band,timeSeconds:now,emittedAtSeconds:now,strength})},reset(){session++;step()},at(index){const a=new Float32Array(16);writeValleyUniforms(state,index,now,1,a);return a}}
}
test('valley consumes each low onset once; sustain and other bands cannot retrigger',()=>{
  const h=harness();h.event(.5);h.step();assert.equal(h.state.launched,1)
  for(let i=0;i<300;i++)h.step(1/60,{bass:1})
  assert.equal(h.state.launched,1);assert.equal(h.out[1],0);assert.ok(h.state.glow>.9)
  h.event(1,'mid');h.event(1,'high');h.step();assert.equal(h.state.launched,1)
})
test('strength controls brightness width and decay; logical travel survives rebasing',()=>{
  const weak=harness(),strong=harness();weak.event(.2);strong.event(.8)
  weak.step(.1);strong.step(.1)
  assert.ok(strong.out[1]>weak.out[1]);assert.ok(strong.out[2]>weak.out[2]);assert.ok(strong.out[3]>weak.out[3])
  const z=strong.out[0];strong.step(.1,{distance:500});assert.ok(Math.abs(strong.out[0]-z-2.6)<1e-5)
  assert.ok(Math.abs(strong.at(1)[0]-strong.out[0]-48)<1e-5)
  for(const index of [-2,0,1,10000]) assert.ok(Math.abs(Math.sin(-48*.08+valleyOrigin(index))-Math.sin(valleyOrigin(index+1)))<1e-10)
})
test('pool bounded; session, profile, zero, stale and reduced consume without replay',()=>{
  for(const options of [{gain:0},{reduced:true},{active:false},{candidate:false}]) {
    const h=harness();h.event();h.step();h.event();h.step(1/60,options)
    assert.equal(h.out[1],0);h.step();assert.equal(h.state.launched,1)
  }
  const h=harness();for(let i=0;i<100;i++){h.event();h.step()};assert.equal(h.state.waves.length,4)
  h.reset();assert.ok(h.state.waves.every(w=>w.start===-Infinity))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {createMusicFeatureStore} from '../src/audio/musicFeatures.ts'
import {emptySixBands} from '../src/audio/signal.ts'
import {createNocturneVisualState,updateNocturneVisualState,applyNocturneVisualState} from '../src/scenes/nocturne/visualState.ts'
const manual={magenta:.3,cyan:.4,cyanPanel:.5,violet:.2}
function fixture(hz=120){
 const store=createMusicFeatureStore(),state=createNocturneVisualState()
 let now=1,sequence=0
 const input={session:1,status:'active',updatedAtSeconds:now,sampleRate:48000,fftSize:2048,sequence:0,events:[],energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},context:{intensity:0,activity:0,brightness:0,brightnessValid:false}}
 function step(options={}){now+=1/hz;input.updatedAtSeconds=now;store.publish(input);updateNocturneVisualState(state,store.reader,options.manual?'manual':'audio',manual,options.gain??1,options.reduced??false,1/hz,options.stale?now+1:now)}
 function advance(seconds,options){for(let i=0;i<seconds*hz;i++)step(options)}
 function event(band='low',strength=.3){input.sequence=++sequence;input.events.push({session:input.session,sequence,band,strength,timeSeconds:now,emittedAtSeconds:now})}
 step();return {state,input,step,advance,event}
}
for(const [role,band,energy] of [['magentaSecondary','low','bass'],['cyanWindows','mid','lowMids'],['cyanDetails','mid','lowMids']]){
 test(`${role} moves near to far once at30/60/120Hz and expires`,()=>{
  for(const hz of [30,60,120]){
   const f=fixture(hz),storage=f.state.instances[role],peaks=Array(storage.length).fill(0),times=Array(storage.length).fill(0)
   f.input.energy.six[energy]=.2;f.advance(.06);f.event(band)
   for(let i=0;i<2*hz;i++){f.step();f.state.spatial.groups[role].accents.forEach((v,j)=>{if(v>peaks[j]){peaks[j]=v;times[j]=i/hz}})}
   assert.ok(peaks.every(x=>x>.03));assert.ok(times.every((x,i)=>i===0||x>times[i-1]+.06))
   assert.ok(f.state.spatial.groups[role].accents.every(x=>x===0));assert.equal(f.state.instances[role],storage)
  }
 })
}
test('high-mid echo starts downstream, low-mid attacks do not accent approved panel, held energy has no fake sequence',()=>{
 const f=fixture();f.input.energy.six.highMids=.2;f.advance(.06);f.event('mid');f.advance(.18)
 assert.equal(f.state.spatial.groups.cyanDetails.first,1);assert.equal(f.state.spatial.groups.cyanDetails.accents[0],0)
 assert.ok(f.state.spatial.groups.cyanDetails.accents[1]>0)
 f.advance(3);f.event('mid');f.advance(.2)
 assert.ok(f.state.spatial.groups.cyanWindows.accents.every(x=>x===0))
 const low=fixture();low.input.energy.six.highMids=.2;low.advance(2);low.input.energy.six.lowMids=.25;low.advance(.06);low.event('mid');low.advance(.18)
 assert.equal(low.state.panel.accent,0);assert.ok(low.state.spatial.groups.cyanDetails.accents[0]>0)
})
test('event storms do not restart or queue a sequence; lifecycle changes consume suppressed onsets',()=>{
 const dense=fixture(),single=fixture();dense.event();single.event()
 for(let i=0;i<100;i++){if(i%6===0&&i>0)dense.event('low',1);dense.step();single.step();assert.deepEqual(dense.state.instances.magentaSecondary,single.state.instances.magentaSecondary)}
 dense.advance(2);assert.ok(dense.state.spatial.groups.magentaSecondary.accents.every(x=>x===0))
 for(const options of [{gain:0},{reduced:true},{manual:true},{stale:true}]){
  const f=fixture();f.event();f.advance(.2);assert.ok(f.state.spatial.groups.magentaSecondary.accents.some(x=>x>0))
  f.event();f.step(options);assert.ok(f.state.spatial.groups.magentaSecondary.accents.every(x=>x===0));f.advance(.2);assert.ok(f.state.spatial.groups.magentaSecondary.accents.every(x=>x===0))
 }
 const f=fixture();f.input.session++;f.event();f.advance(.3);assert.ok(f.state.spatial.groups.magentaSecondary.accents.every(x=>x===0))
})
test('instance adapter delivers bounded per-fixture values, exact Manual and zero; points use final mean',()=>{
 const f=fixture(),attribute={array:new Float32Array(5),needsUpdate:false},indices=new Uint8Array([0,1,2,3,4]),material={emissiveIntensity:0},light={intensity:0}
 const targets={emitters:[{channel:'magentaSecondary',material,instances:{channel:'magentaSecondary',indices,attribute}}],lights:[{channel:'magentaSecondary',full:12,light}]}
 f.event();f.advance(.2);applyNocturneVisualState(targets,f.state)
 assert.equal(material.emissiveIntensity,1.3);assert.ok(attribute.array[0]>attribute.array[4]);assert.ok(attribute.needsUpdate)
 attribute.array.forEach((v,i)=>assert.ok(Math.abs(v-f.state.instances.magentaSecondary[i])<1e-7))
 assert.equal(light.intensity,f.state.channels.magentaSecondary.level*12)
 f.step({manual:true});applyNocturneVisualState(targets,f.state);assert.ok(attribute.array.every(x=>Math.abs(x-.3)<1e-7));assert.equal(light.intensity,.3*12)
 f.step({gain:0});applyNocturneVisualState(targets,f.state);assert.ok(attribute.array.every(x=>x===0));assert.equal(light.intensity,0)
})

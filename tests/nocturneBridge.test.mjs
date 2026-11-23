import test from 'node:test'
import assert from 'node:assert/strict'
import {createBridgeResponse,updateBridgeResponse,BRIDGE_SEGMENTS,BRIDGE_DURATION} from '../src/scenes/nocturne/bridge.ts'
import {applyNocturneVisualState,createNocturneVisualState,updateNocturneVisualState} from '../src/scenes/nocturne/visualState.ts'
import {emptySixBands} from '../src/audio/signal.ts'
function fixture(){
 const state=createBridgeResponse(),view={session:1,sequence:0,status:'active',updatedAtSeconds:1,events:[],energy:{six:emptySixBands()}}
 let time=1
 function step({dt=1/120,gain=1,reduced=false,manual=false,now}={}){time+=dt;view.updatedAtSeconds=time;updateBridgeResponse(state,view,now??time,gain,reduced,manual)}
 function event(strength=.2,band='high',extra={}){view.events.push({session:view.session,sequence:++view.sequence,band,strength,emittedAtSeconds:time,timeSeconds:time,...extra})}
 function advance(seconds,options={}){for(let i=0;i<Math.ceil(seconds/(options.dt??1/120));i++)step(options)}
 step();return{state,view,step,event,advance}
}
test('isolated event traverses six sections left to right once, then becomes exactly dark',()=>{
 const f=fixture(),storage=f.state.levels,peakTimes=Array(6).fill(0),peaks=Array(6).fill(0)
 f.event(.3)
 for(let i=0;i<150;i++){f.step();f.state.levels.forEach((x,j)=>{if(x>peaks[j]){peaks[j]=x;peakTimes[j]=i/120}})}
 assert.ok(peaks.every(x=>x>.4));assert.ok(peakTimes.every((x,i)=>i===0||x>peakTimes[i-1]+.1))
 assert.equal(f.state.level,0);assert.deepEqual([...storage],Array(6).fill(0));assert.equal(f.state.levels,storage)
 f.advance(3);assert.equal(f.state.level,0)
})
test('sustained energy and intensity never start a sweep without an event',()=>{
 const f=fixture();f.view.energy.six.bass=1;f.view.context={intensity:1};f.advance(4)
 assert.equal(f.state.level,0);assert.equal(f.state.peak,0)
})
test('strength and Reactivity remain proportional; peak stable at30/60/120Hz',()=>{
 const peak=(strength,gain=1,dt=1/120)=>{const f=fixture();f.event(strength);let p=0;for(let i=0;i<2/dt;i++){f.step({dt,gain});p=Math.max(p,...f.state.levels)}return p}
 assert.ok(Math.abs(peak(.2)-2*peak(.1))<1e-10)
 assert.ok(Math.abs(peak(.2,.5)-peak(.1))<1e-10)
 assert.ok(peak(1)<=.48)
 const peaks=[30,60,120].map(hz=>peak(.2,1,1/hz));assert.ok(Math.max(...peaks)-Math.min(...peaks)<.001)
})
test('dense events neither restart nor stack, dropped events are not queued',()=>{
 const dense=fixture(),single=fixture();dense.event(.3);single.event(.3)
 for(let i=0;i<120;i++){if(i%8===0&&i>0)dense.event(1);dense.step();single.step();assert.deepEqual(dense.state.levels,single.state.levels)}
 dense.advance(.5);assert.equal(dense.state.level,0)
 dense.event(.1);dense.advance(.1);assert.ok(dense.state.level>0)
 for(let i=0;i<1200;i++){if(i%6===0)dense.event(1);dense.step();assert.ok([...dense.state.levels].every(x=>x<=.48));assert.ok(dense.state.level<=.48)}
 dense.advance(2);assert.equal(dense.state.level,0)
})
test('mid/low/subthreshold/malformed/wrong session/stale/future events are ignored',()=>{
 for(const [band,strength,extra] of [['mid',1,{}],['high',1,{}],['high',.039,{}],['high',NaN,{}],['high',1,{session:9}],['high',1,{emittedAtSeconds:0}],['high',1,{emittedAtSeconds:100}]]){
  const f=fixture();f.event(strength,band,extra);f.advance(1);assert.equal(f.state.peak,0)
 }
})
test('Manual/zero/reduced/stale/inactive reset and consume without replay; session skips retained events',()=>{
 for(const options of [{manual:true},{gain:0},{reduced:true},{now:100}]){
  const f=fixture();f.event(.3);f.advance(.2);assert.ok(f.state.level>0)
  f.event(1);f.step(options);assert.equal(f.state.level,0);f.advance(1);assert.equal(f.state.level,0)
 }
 const f=fixture();f.event(1);f.view.status='inactive';f.step();f.view.status='active';f.advance(1);assert.equal(f.state.level,0)
 f.view.session++;f.event(1);f.advance(1);assert.equal(f.state.level,0)
 f.event(1);f.advance(.1);assert.ok(f.state.level>0)
})
test('segment materials receive individual values; shared spill receives their mean; Manual is uniform',()=>{
 const state=createNocturneVisualState(),f=fixture(),manual={magenta:.4,cyan:0,cyanPanel:0,violet:0}
 f.view.energy={low:0,mid:0,high:0,overall:0,six:emptySixBands()};f.view.context={intensity:0}
 const reader={read:()=>f.view}
 const emitters=Array.from({length:BRIDGE_SEGMENTS},(_,segment)=>({channel:'bridge',segment,material:{emissiveIntensity:0}})),lights=[{channel:'bridge',full:40,light:{intensity:0}}]
 updateNocturneVisualState(state,reader,'audio',manual,1,false,1/60,f.view.updatedAtSeconds)
 f.event(.3);f.advance(.15)
 updateNocturneVisualState(state,reader,'audio',manual,1,false,1/60,f.view.updatedAtSeconds)
 f.advance(.15);updateNocturneVisualState(state,reader,'audio',manual,1,false,1/60,f.view.updatedAtSeconds)
 applyNocturneVisualState({emitters,lights},state)
 emitters.forEach((e,i)=>assert.equal(e.material.emissiveIntensity,state.bridge.levels[i]*1.3))
 assert.ok(Math.abs(lights[0].light.intensity-state.bridge.levels.reduce((a,b)=>a+b,0)/6*40)<1e-12)
 updateNocturneVisualState(state,reader,'manual',manual,1,false,1/60,f.view.updatedAtSeconds)
 applyNocturneVisualState({emitters,lights},state)
 assert.ok(emitters.every(e=>e.material.emissiveIntensity===.4*1.3));assert.equal(lights[0].light.intensity,16)
 assert.ok(BRIDGE_DURATION<1)
})

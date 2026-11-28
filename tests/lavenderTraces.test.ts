import test from 'node:test'
import assert from 'node:assert/strict'
import {createTraces,updateTraces,TRACE_ROLES,wrapTrace} from '../src/scenes/lavender-peaks/traces.ts'
import {createLavenderResponse,updateLavenderResponse,RIDGE_BANDS} from '../src/scenes/lavender-peaks/response.ts'
import {createLayerMotion} from '../src/scenes/lavender-peaks/motion.ts'
import type {OnsetBand} from '../src/audio/musicFeatures.ts'
import type {SixBandValues} from '../src/audio/signal.ts'

type StepOptions={energy?:Partial<SixBandValues>,event?:OnsetBand,gain?:number,reduced?:boolean,strength?:number}

function fixture(){
 const response=createLavenderResponse(),traces=createTraces(),motion=RIDGE_BANDS.map(()=>createLayerMotion())
 const view:any={version:1,session:1,sequence:0,frame:0,updatedAtSeconds:1,status:'active',context:{intensity:0,brightness:0,brightnessValid:false,activity:0},energy:{six:Object.fromEntries(RIDGE_BANDS.map(x=>[x,0]))},events:[]}
 const reader={read:()=>view};let time=1
 function step({energy={},event,gain=1,reduced=false,strength=1}:StepOptions={}){
  time+=1/60;view.frame++;view.updatedAtSeconds=time;Object.assign(view.energy.six,energy)
  view.events=event?[{session:view.session,sequence:++view.sequence,band:event,strength,timeSeconds:time,emittedAtSeconds:time}]:[]
  updateLavenderResponse(response,reader,1/60,time,gain,reduced);updateTraces(traces,response,motion,time,gain,reduced)
 }
 function run(n:number,options?:StepOptions){for(let i=0;i<n;i++)step(options)}
 step();return {response,traces,motion,view,step,run,now:()=>time}
}
const active=(f:ReturnType<typeof fixture>)=>f.traces.slots.filter(x=>x.active)

test('all six actual qualified notices route to their assigned ridge and move in its direction',()=>{
 for(let ridge=0;ridge<6;ridge++){
  const f=fixture();f.run(12);f.run(4,{energy:{[RIDGE_BANDS[ridge]]:.4}})
  f.step({event:(['high','high','mid','mid','low','low'] as const)[ridge]})
  assert.equal(active(f).length,1);const slot=active(f)[0];assert.equal(slot.ridge,ridge);assert.equal(slot.direction,TRACE_ROLES[ridge].direction)
  const before=slot.head;f.run(30);assert.ok(slot.opacity>0&&slot.opacity<=.45)
  assert.ok(wrapTrace(slot.head-before)*slot.direction>0)
  f.run(150);assert.equal(active(f).length,0)
 }
})
test('sustained energy and overall context do not manufacture traces',()=>{
 const f=fixture();f.view.context={intensity:1};f.run(300,{energy:Object.fromEntries(RIDGE_BANDS.map(x=>[x,.7]))})
 assert.equal(active(f).length,0)
})
test('low-mid attacks cannot trigger a high-mid trace beside a held high-mid baseline',()=>{
 const f=fixture();f.run(180,{energy:{highMids:.4}});f.run(4,{energy:{lowMids:.4}});f.step({event:'mid'})
 assert.equal(active(f).length,1);assert.equal(active(f)[0].ridge,3);assert.equal(f.response.ridges[2].onsetSequence,0)
})
test('one broad event with multiple rising narrow bands chooses the strongest recipient once',()=>{
 const f=fixture();f.run(12);f.run(4,{energy:{bass:.4,subBass:.08}});f.step({event:'low'})
 assert.equal(active(f).length,1);assert.equal(active(f)[0].ridge,4)
})
test('duplicates, held notices and busy-ridge attacks never restart or stack a stroke',()=>{
 const f=fixture();f.run(12);f.run(4,{energy:{highMids:.4}});f.step({event:'mid'})
 const slot=active(f)[0],startsAt=slot.startsAt;f.run(12);assert.equal(slot.startsAt,startsAt)
 f.response.ridges[2].onsetSequence++;f.response.ridges[2].onsetTimeSeconds=f.now()
 updateTraces(f.traces,f.response,f.motion,f.now(),1,false)
 assert.equal(active(f).length,1);assert.equal(slot.startsAt,startsAt)
})
test('global pool stays at3, one stroke per ridge, and simultaneous events start staggered',()=>{
 const f=fixture()
 for(const i of [4,2,0])Object.assign(f.response.ridges[i],{onsetSequence:i+1,onsetTimeSeconds:f.now(),onsetStrength:.5})
 updateTraces(f.traces,f.response,f.motion,f.now(),1,false)
 assert.equal(active(f).length,3);const starts=active(f).map(x=>x.startsAt).sort((a,b)=>a-b)
 assert.ok(starts[1]-starts[0]>=.119&&starts[2]-starts[1]>=.119)
 for(let n=0;n<20;n++){for(let i=0;i<6;i++)Object.assign(f.response.ridges[i],{onsetSequence:100+n,onsetTimeSeconds:f.now(),onsetStrength:.5});updateTraces(f.traces,f.response,f.motion,f.now(),1,false)}
 assert.equal(active(f).length,3);assert.equal(new Set(active(f).map(x=>x.ridge)).size,3)
})
test('strength orders opacity without changing geometry or saturating quiet input',()=>{
 const values=[]
 for(const strength of [.1,.4,1]){
  const f=fixture();f.run(12);f.run(4,{energy:{bass:.4}});f.step({event:'low',strength});f.run(8)
  values.push(active(f)[0].opacity)
 }
 assert.ok(values[0]>0&&values[1]>values[0]&&values[2]>=values[1]);assert.ok(values[2]<=.45)
})
test('stale, gain0, reduced, session changes and controller re-entry consume old notices',()=>{
 for(const mode of ['stale','gain0','reduced','session'] as const){
  const f=fixture();f.run(12);f.run(4,{energy:{bass:.4}});f.step({event:'low'});assert.equal(active(f).length,1)
  if(mode==='stale')f.response.fresh=false
  if(mode==='session')f.response.session++
  updateTraces(f.traces,f.response,f.motion,f.now(),mode==='gain0'?0:1,mode==='reduced')
  assert.equal(active(f).length,0)
  f.response.fresh=true;updateTraces(f.traces,f.response,f.motion,f.now()+.01,1,false);assert.equal(active(f).length,0)
  const reentry=createTraces();updateTraces(reentry,f.response,f.motion,f.now()+.02,1,false);assert.ok(reentry.slots.every(x=>!x.active))
 }
})
test('expired/future notices are rejected and long time gaps expire active strokes safely',()=>{
 for(const time of [-1,999,NaN]){
  const f=fixture();Object.assign(f.response.ridges[2],{onsetSequence:1,onsetTimeSeconds:time,onsetStrength:.5})
  updateTraces(f.traces,f.response,f.motion,f.now(),1,false);assert.equal(active(f).length,0)
 }
 const f=fixture();f.run(12);f.run(4,{energy:{highMids:.4}});f.step({event:'mid'})
 updateTraces(f.traces,f.response,f.motion,f.now()+10,1,false);assert.equal(active(f).length,0)
})
test('a real response session reset accepts its first new sequence1 on the same ridge',()=>{
 const f=fixture();f.run(12);f.run(4,{energy:{bass:.4}});f.step({event:'low'})
 assert.equal(active(f).length,1)
 f.view.session++;f.view.sequence=0;f.run(12,{energy:{bass:0}})
 assert.equal(active(f).length,0);assert.equal(f.response.ridges[4].onsetSequence,0)
 f.run(4,{energy:{bass:.4}});f.step({event:'low'})
 assert.equal(active(f).length,1);assert.equal(active(f)[0].sequence,1);assert.equal(active(f)[0].ridge,4)
})
test('head/tail phase is periodic across terrain wrapping and independent of render cadence',()=>{
 const f=fixture();f.motion[4].offset=23.98;f.run(12);f.run(4,{energy:{bass:.4}});f.step({event:'low'})
 const slot=active(f)[0],local=slot.startLocal,startsAt=slot.startsAt
 f.motion[4].offset=.02;updateTraces(f.traces,f.response,f.motion,startsAt+.5,1,false);assert.equal(slot.startLocal,local)
 const head=slot.head;updateTraces(f.traces,f.response,f.motion,startsAt+.5,1,false);assert.equal(slot.head,head)
 for(const x of [-12.001,-12,11.999,12,35.999])assert.ok(Math.abs(wrapTrace(x)-wrapTrace(x+24))<1e-10)
})

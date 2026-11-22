import test from 'node:test'
import assert from 'node:assert/strict'
import { emptySixBands } from '../src/audio/signal.ts'
import { createMagentaResponse,updateMagentaResponse,magentaAccentEnvelope } from '../src/scenes/nocturne/magenta.ts'
function fixture(){
 const state=createMagentaResponse(),view={session:1,frame:1,sequence:0,status:'active',updatedAtSeconds:1,
  energy:{six:emptySixBands()},events:[]}
 let time=1
 function step({hz=60,gain=1,reduced=false,manual=false,now}={}){time+=1/hz;view.frame++;view.updatedAtSeconds=time;updateMagentaResponse(state,view,1/hz,now??time,gain,reduced,manual)}
 function advance(seconds=2,options={}){for(let i=0;i<seconds*(options.hz??60);i++)step(options)}
 function event(strength=.2,band='low',extra={}){view.events.push({session:view.session,sequence:++view.sequence,band,strength,timeSeconds:time,emittedAtSeconds:time,...extra})}
 step();return{state,view,step,advance,event}
}
test('quiet/loud sustain is proportional and secondary lamps have lower, slower glow',()=>{
 const f=fixture();f.view.energy.six.bass=.1;f.advance(3)
 const quiet=f.state.mainBody,secondary=f.state.secondaryBody
 assert.ok(quiet>.1&&quiet<.12)
 assert.ok(secondary>0&&secondary<quiet*.5)
 f.view.energy.six.bass=.3;f.advance(3)
 assert.ok(Math.abs(f.state.mainBody-3*quiet)<.001)
 assert.ok(f.state.mainBody<=.5&&f.state.secondaryBody<=.24)
 f.view.energy.six.bass=0;f.advance(.5)
 assert.ok(f.state.mainBody>0&&f.state.secondaryBody>0)
 f.advance(6);assert.equal(f.state.mainBody,0);assert.equal(f.state.secondaryBody,0)
})
test('sub-bass supports both glows without activating a full-strength main lamp',()=>{
 const f=fixture();f.view.energy.six.subBass=.2;f.advance(3)
 assert.ok(f.state.mainBody>0&&f.state.mainBody<.1)
 assert.ok(f.state.secondaryBody>0&&f.state.secondaryBody<f.state.mainBody)
})
test('a low event punches above sustain once, scales with strength and expires',()=>{
 const peaks=[.05,.15,.3].map(strength=>{
  const f=fixture();f.view.energy.six.bass=.1;f.advance(2)
  const baseline=f.state.mainBody;f.event(strength);f.step();f.step()
  const peak=f.state.mainAccent;assert.ok(peak>0)
  assert.ok(f.state.mainBody+peak>baseline)
  f.advance(2);assert.equal(f.state.mainAccent,0)
  assert.ok(Math.abs(f.state.mainBody-baseline)<.001)
  return peak
 })
 assert.ok(peaks[0]<peaks[1]&&peaks[1]<peaks[2])
})
test('mid/high and invalid low events never trigger a main accent',()=>{
 for(const [band,strength,extra] of [['mid',1,{}],['high',1,{}],['low',NaN,{}],['low',0,{}],['low',1,{session:2}],['low',1,{emittedAtSeconds:99}],['low',1,{emittedAtSeconds:0}]]){
  const f=fixture();f.event(strength,band,extra);f.step();f.step();assert.equal(f.state.mainAccent,0)
 }
 const f=fixture();f.view.energy.six.highMids=f.view.energy.six.lowMids=1;f.advance()
 assert.equal(f.state.mainBody,0);assert.equal(f.state.secondaryBody,0)
})
test('Manual/zero/reduced/stale/inactive consume events and prevent replay',()=>{
 for(const options of [{manual:true},{gain:0},{reduced:true},{now:100}]){
  const f=fixture();f.event(1);f.step(options);f.step();assert.equal(f.state.mainAccent,0)
 }
 const f=fixture();f.view.energy.six.bass=.3;f.advance();f.event(1)
 f.view.status='inactive';f.advance(6);assert.equal(f.state.mainBody,0)
 f.view.status='active';f.step();assert.equal(f.state.mainAccent,0)
 f.view.session++;f.event(1);f.step();assert.equal(f.state.mainAccent,0)
})
test('dense repeated events stay below the main .92 and secondary .24 caps',()=>{
 const f=fixture();f.view.energy.six.bass=f.view.energy.six.subBass=1
 for(let i=0;i<600;i++){
  if(i%8===0)f.event(1)
  f.step();assert.ok(f.state.mainBody+f.state.mainAccent<=.92000001)
  assert.ok(f.state.secondaryBody<=.24)
 }
 f.advance(2);assert.equal(f.state.mainAccent,0)
 assert.ok(Math.abs(f.state.mainBody-.5)<1e-6)
})
test('accent peak and steady sustain are stable at30/60/120Hz; gain and reduced are bounded',()=>{
 const results=[30,60,120].map(hz=>{
  const f=fixture();f.view.energy.six.bass=.2;f.advance(3,{hz});f.event(.2)
  let peak=0;for(let i=0;i<hz;i++){f.step({hz});peak=Math.max(peak,f.state.mainAccent)}
  return{peak,body:f.state.mainBody}
 })
 assert.ok(Math.max(...results.map(x=>x.peak))-Math.min(...results.map(x=>x.peak))<.001)
 assert.ok(Math.abs(results[0].body-results[2].body)<.001)
 const normal=fixture(),reduced=fixture();normal.view.energy.six.bass=reduced.view.energy.six.bass=.3
 normal.advance(.1);reduced.advance(.1,{reduced:true});assert.ok(reduced.state.mainBody<normal.state.mainBody)
 const f=fixture();f.view.energy.six.bass=.2;f.advance(3,{gain:.5});assert.ok(Math.abs(f.state.mainBody-results[0].body*.5)<.001)
 assert.equal(magentaAccentEnvelope(1.2),0)
})

test('a weak overlapping attack preserves the old tail through its short rise',()=>{
 const f=fixture();f.event(.3);f.advance(.1)
 const previous=f.state.mainAccent
 f.event(.02);f.step()
 assert.ok(f.state.mainAccent>=previous*Math.exp(-(1/60)/.2)-1e-12)
 f.advance(2);assert.equal(f.state.mainAccent,0)
})

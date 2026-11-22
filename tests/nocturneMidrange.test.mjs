import test from 'node:test'
import assert from 'node:assert/strict'
import {emptySixBands} from '../src/audio/signal.ts'
import {createMidrangeResponse,updateMidrangeResponse} from '../src/scenes/nocturne/midrange.ts'
function fixture(){
 const state=createMidrangeResponse(),view={session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,energy:{six:emptySixBands()},events:[]}
 let time=1
 function step({hz=60,gain=1,reduced=false,manual=false,now,publish=true}={}){time+=1/hz;if(publish){view.frame++;view.updatedAtSeconds=time}updateMidrangeResponse(state,view,1/hz,now??time,gain,reduced,manual)}
 function advance(seconds=3,options={}){for(let i=0;i<seconds*(options.hz??60);i++)step(options)}
 function event(strength=.2,extra={}){view.events.push({session:view.session,sequence:++view.sequence,band:'mid',strength,timeSeconds:time,emittedAtSeconds:time,...extra})}
 step();return {state,view,step,advance,event}
}
test('low mids drive distinct architectural levels; high mids support windows gently',()=>{
 const f=fixture();f.view.energy.six.lowMids=.2;f.advance()
 assert.ok(Math.abs(f.state.detailBody-.16)<.001)
 assert.ok(Math.abs(f.state.windowBody-.072)<.001)
 f.view.energy.six.lowMids=0;f.view.energy.six.highMids=.2;f.advance(5)
 assert.equal(f.state.detailBody,0)
 assert.ok(Math.abs(f.state.windowBody-.030857)<.001)
})
test('quiet/loud sustained energy stays proportional, without self-generated events',()=>{
 const f=fixture();f.view.energy.six.lowMids=.08;f.advance(3)
 const quiet=f.state.detailBody;f.view.energy.six.lowMids=.24;f.advance(3)
 assert.ok(Math.abs(f.state.detailBody-quiet*3)<.001)
 assert.equal(f.state.detailAccent,0)
 f.view.energy.six.lowMids=1;f.advance();assert.ok(f.state.detailBody<=.28&&f.state.windowBody<=.18)
})
test('fresh low-mid rise qualifies a finite accent; duplicate event cannot retrigger',()=>{
 const f=fixture();f.advance(.3);f.view.energy.six.lowMids=.25
 for(let i=0;i<4;i++)f.step()
 f.event(.25);f.step();assert.ok(f.state.detailAccent>.07)
 f.advance(2);assert.equal(f.state.detailAccent,0)
})
test('high-mid attack over stationary low-mid sustain does not borrow an old rise',()=>{
 const f=fixture();f.view.energy.six.lowMids=.2;f.advance()
 f.view.energy.six.highMids=.5;f.event(1);f.step()
 assert.equal(f.state.detailAccent,0)
})
test('bass, high-only, wrong-band/session and invalid-time events do not create detail accents',()=>{
 for(const extra of [{band:'low'},{band:'high'},{session:2},{emittedAtSeconds:99},{emittedAtSeconds:0},{emittedAtSeconds:NaN}]){
  const f=fixture();f.advance(.3);f.view.energy.six.lowMids=.3;f.step();f.event(1,extra);f.step();assert.equal(f.state.detailAccent,0)
 }
 const f=fixture();f.view.energy.six.bass=f.view.energy.six.air=1;f.advance()
 assert.equal(f.state.windowBody,0);assert.equal(f.state.detailBody,0)
})
test('Manual/zero/reduced/stale suppression, session reset and bounded frame history',()=>{
 for(const options of [{manual:true},{gain:0},{reduced:true},{now:100}]){
  const f=fixture();f.advance(.3);f.view.energy.six.lowMids=.3;f.step();f.event(1);f.step(options);f.step();assert.equal(f.state.detailAccent,0)
 }
 const f=fixture();f.view.energy.six.lowMids=.2;f.advance()
 const count=f.state.count
 for(let i=0;i<10;i++)f.step({hz:120,publish:false})
 assert.equal(f.state.count,count);assert.ok(f.state.count<=64);assert.equal(f.state.times.length,64)
 f.view.status='inactive';f.advance(8);assert.equal(f.state.detailBody,0);assert.equal(f.state.windowBody,0);assert.equal(f.state.count,0)
 f.view.session++;f.view.status='active';f.event(1);f.step();assert.equal(f.state.detailAccent,0)
})
test('30/60/120Hz sustain settles equally and reduced motion is slower',()=>{
 const outputs=[30,60,120].map(hz=>{const f=fixture();f.view.energy.six.lowMids=.2;f.advance(3,{hz});return[f.state.windowBody,f.state.detailBody]})
 assert.ok(Math.abs(outputs[0][0]-outputs[2][0])<1e-9)
 assert.ok(Math.abs(outputs[0][1]-outputs[2][1])<1e-9)
 const a=fixture(),b=fixture();a.view.energy.six.lowMids=b.view.energy.six.lowMids=.3
 a.advance(.1);b.advance(.1,{reduced:true});assert.ok(b.state.detailBody<a.state.detailBody)
})

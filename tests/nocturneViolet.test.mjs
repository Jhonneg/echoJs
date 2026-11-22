import test from 'node:test'
import assert from 'node:assert/strict'
import {emptySixBands} from '../src/audio/signal.ts'
import {createVioletResponse,updateVioletResponse,violetAccentEnvelope} from '../src/scenes/nocturne/violet.ts'
function fixture(){
 const state=createVioletResponse(),view={session:1,sequence:0,status:'active',updatedAtSeconds:1,events:[],energy:{six:emptySixBands()}}
 let time=1
 function step({hz=120,gain=1,reduced=false,manual=false,now}={}){time+=1/hz;view.updatedAtSeconds=time;updateVioletResponse(state,view,1/hz,now??time,gain,reduced,manual)}
 function advance(seconds,options={}){for(let i=0;i<seconds*(options.hz??120);i++)step(options)}
 function event(strength=.2,band='high',extra={}){view.events.push({session:view.session,sequence:++view.sequence,band,strength,timeSeconds:time,emittedAtSeconds:time,...extra})}
 step();return{state,view,step,advance,event}
}
test('presence/air glow is proportional and restrained, holds without accents, settles in silence',()=>{
 const f=fixture(),accents=f.state.accents,levels=f.state.levels
 f.view.energy.six.presence=.1;f.advance(2);const quiet=f.state.body
 assert.ok(Math.abs(quiet-.032)<1e-8);assert.deepEqual([...f.state.levels],[quiet,quiet])
 f.view.energy.six.presence=.3;f.advance(2);assert.ok(Math.abs(f.state.body-3*quiet)<1e-8)
 f.view.energy.six.presence=0;f.view.energy.six.air=.1;f.advance(2);assert.ok(Math.abs(f.state.body-.16*.03/.35)<1e-6)
 assert.deepEqual([...accents],[0,0]);assert.equal(levels,f.state.levels)
 f.view.energy.six.air=0;f.advance(.1);assert.ok(f.state.body>0);f.advance(2);assert.equal(f.state.body,0)
})
test('one high event accents one side briefly, next accepted event alternates side',()=>{
 const f=fixture();f.view.energy.six.presence=.1;f.advance(1);const baseline=f.state.body
 f.event(.3);f.advance(.04);assert.ok(f.state.levels[0]>baseline+.2);assert.equal(f.state.accents[1],0)
 f.advance(.3);assert.deepEqual([...f.state.accents],[0,0]);assert.ok(Math.abs(f.state.body-baseline)<1e-8)
 f.advance(.1);f.event(.3);f.advance(.04);assert.ok(f.state.accents[1]>.2);assert.equal(f.state.accents[0],0)
 f.advance(1);assert.deepEqual([...f.state.accents],[0,0])
})
test('quiet/loud attacks and gain are proportional, peaks stable at30/60/120Hz',()=>{
 const peak=(strength,gain=1,hz=120)=>{const f=fixture();f.event(strength);let p=0;for(let i=0;i<hz;i++){f.step({gain,hz});p=Math.max(p,...f.state.accents)}return p}
 assert.ok(Math.abs(peak(.2)-2*peak(.1))<1e-10);assert.ok(Math.abs(peak(.2,.5)-peak(.1))<1e-10)
 const peaks=[30,60,120].map(hz=>peak(.2,1,hz));assert.ok(Math.max(...peaks)-Math.min(...peaks)<.001)
 assert.equal(violetAccentEnvelope(.24),0)
})
test('dense high events have one bounded accent, no restart/stack or queued late flash',()=>{
 const f=fixture();f.view.energy.six.presence=f.view.energy.six.air=1
 let last=-Infinity,starts=0
 for(let i=0;i<1200;i++){
  if(i%6===0)f.event(1)
  f.step()
  if(f.state.startedAt!==last){assert.ok(f.state.startedAt-last>=.4-1e-9);last=f.state.startedAt;starts++}
  assert.ok(f.state.accents.filter(x=>x>0).length<=1);assert.ok([...f.state.levels].every(x=>x<=.48000001))
 }
 assert.ok(starts<=26)
 f.advance(1);assert.deepEqual([...f.state.accents],[0,0]);assert.ok(f.state.body<=.16)
})
test('bass/low-mid/high-mid energy, overall intensity and non-high/invalid events do not create violet',()=>{
 const f=fixture();for(const band of ['subBass','bass','lowMids','highMids'])f.view.energy.six[band]=1
 f.view.context={intensity:1};f.advance(2);assert.equal(f.state.body,0)
 for(const [band,strength,extra] of [['low',1,{}],['mid',1,{}],['high',.039,{}],['high',NaN,{}],['high',1,{session:2}],['high',1,{emittedAtSeconds:99}],['high',1,{emittedAtSeconds:0}]]){
  f.event(strength,band,extra);f.step();assert.equal(f.state.peak,0)
 }
})
test('Manual/zero/reduced/stale consume events; pause/session reset suppress replay',()=>{
 for(const options of [{manual:true},{gain:0},{reduced:true},{now:100}]){
  const f=fixture();f.event(1);f.advance(.04);assert.ok(f.state.accents[0]>0)
  f.event(1);f.step(options);assert.deepEqual([...f.state.accents],[0,0]);f.advance(.5);assert.deepEqual([...f.state.accents],[0,0])
 }
 const f=fixture();f.view.energy.six.presence=.3;f.advance(1);f.view.status='inactive';f.event(1);f.advance(3);assert.equal(f.state.body,0)
 f.view.status='active';f.step();assert.equal(f.state.peak,0)
 f.view.session++;f.event(1);f.step();assert.equal(f.state.peak,0);assert.equal(f.state.nextBank,0)
 f.event(1);f.advance(.04);assert.ok(f.state.accents[0]>0)
})
test('reduced motion uses a slow body with zero accents; zero gain clears every output',()=>{
 const normal=fixture(),reduced=fixture();normal.view.energy.six.air=reduced.view.energy.six.air=.3
 normal.advance(.1);reduced.event(1);reduced.advance(.1,{reduced:true});assert.ok(normal.state.body>reduced.state.body*3)
 reduced.advance(2,{reduced:true});assert.deepEqual([...reduced.state.accents],[0,0]);assert.ok(reduced.state.body>0)
 reduced.step({gain:0});assert.deepEqual([...reduced.state.levels],[0,0]);assert.equal(reduced.state.target,0)
})

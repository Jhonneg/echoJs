import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtmosphereResponse,updateAtmosphereResponse} from '../src/scenes/nocturne/atmosphereResponse.ts'
function fixture(){
 const state=createAtmosphereResponse(),view={session:1,status:'active',updatedAtSeconds:1,context:{intensity:0,activity:0,brightness:.5,brightnessValid:true}}
 let time=1
 function step({hz=60,gain=1,reduced=false,manual=false,now}={}){time+=1/hz;view.updatedAtSeconds=time;updateAtmosphereResponse(state,view,1/hz,now??time,gain,reduced,manual)}
 function advance(seconds,options={}){for(let i=0;i<seconds*(options.hz??60);i++)step(options)}
 step();return{state,view,step,advance}
}
test('quiet/energetic/quiet transitions are slow, capped and settle to the original rest',()=>{
 const f=fixture();f.advance(2);assert.equal(f.state.level,0)
 f.view.context.intensity=1;f.advance(.1);assert.ok(f.state.level>0&&f.state.level<.04)
 f.advance(8);assert.ok(f.state.level>.63&&f.state.level<=.65)
 const loud=f.state.level;f.view.context.intensity=0;f.advance(1);assert.ok(f.state.level>loud*.7)
 f.advance(30);assert.equal(f.state.level,0);assert.equal(f.state.density,0);assert.equal(f.state.tint,0)
})
test('activity affects depth independently at held intensity, and cannot hold fog during silence',()=>{
 const f=fixture();f.view.context.intensity=.5;f.advance(12);const level=f.state.level
 f.view.context.activity=1;f.advance(12);assert.ok(Math.abs(f.state.level-level)<.001);assert.ok(f.state.density>.49&&f.state.density<=.5)
 f.view.context.intensity=0;f.advance(35);assert.equal(f.state.level,0);assert.equal(f.state.density,0)
})
test('valid brightness changes only bounded color balance; invalid/NaN returns smoothly neutral',()=>{
 const f=fixture();f.view.context.intensity=1;f.view.context.brightness=1;f.advance(20);assert.ok(f.state.tint>.99)
 f.view.context.brightnessValid=false;f.step();assert.equal(f.state.tintTarget,0);assert.ok(f.state.tint>.9)
 f.advance(35);assert.equal(f.state.tint,0)
 f.view.context.brightnessValid=true;f.view.context.brightness=0;f.advance(20);assert.ok(f.state.tint<-.99)
 f.view.context.brightness=NaN;f.step();assert.equal(f.state.tintTarget,0)
 assert.ok(Number.isFinite(f.state.level)&&Number.isFinite(f.state.tint))
})
test('one short context spike cannot flash, reduced motion is slower and gains are proportional',()=>{
 const normal=fixture(),reduced=fixture(),half=fixture()
 for(const f of [normal,reduced,half]){f.view.context.intensity=f.view.context.activity=f.view.context.brightness=1}
 normal.advance(1);reduced.advance(1,{reduced:true});half.advance(1,{gain:.5})
 assert.ok(normal.state.level>reduced.state.level*1.5);assert.ok(Math.abs(normal.state.level/2-half.state.level)<1e-10)
 assert.ok(Math.abs(normal.state.density/2-half.state.density)<1e-10)
 assert.ok(Math.abs(normal.state.tint/2-half.state.tint)<1e-10)
})
test('manual/zero reset immediately; stale/inactive release; session clears prior context',()=>{
 for(const options of [{manual:true},{gain:0}]){const f=fixture();f.view.context.intensity=1;f.advance(5);f.step(options);assert.equal(f.state.level,0);assert.equal(f.state.levelTarget,0)}
 for(const inactive of [true,false]){const f=fixture();f.view.context.intensity=1;f.advance(5);if(inactive)f.view.status='inactive';f.advance(35,inactive?{}:{now:100});assert.equal(f.state.level,0)}
 const f=fixture();f.view.context.intensity=f.view.context.activity=1;f.advance(5);f.view.session++;f.view.context.intensity=f.view.context.activity=0;f.step();assert.equal(f.state.level,0);assert.equal(f.state.density,0)
})
test('30/60/120Hz agree; malformed deltas cannot jump, and outputs stay bounded',()=>{
 const states=[30,60,120].map(hz=>{const f=fixture();f.view.context.intensity=f.view.context.activity=f.view.context.brightness=1;f.advance(5,{hz});return f.state})
 for(const field of ['level','density','tint'])assert.ok(Math.abs(states[0][field]-states[2][field])<1e-10)
 const f=fixture();f.view.context.intensity=f.view.context.activity=9
 updateAtmosphereResponse(f.state,f.view,NaN,f.view.updatedAtSeconds,1,false,false);assert.equal(f.state.level,0)
 updateAtmosphereResponse(f.state,f.view,100,f.view.updatedAtSeconds,1,false,false);assert.ok(f.state.level<.02)
 f.advance(60);assert.ok(f.state.level<=.65&&f.state.density<=1&&Math.abs(f.state.tint)<=1)
})

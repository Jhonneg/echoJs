import test from 'node:test'
import assert from 'node:assert/strict'
import {createBloomMusic,updateBloomMusic} from '../src/scenes/bloom/music.ts'
function fixture(){
 const state=createBloomMusic(),view={version:1,session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,
  energy:{six:{subBass:0,bass:0,lowMids:0,highMids:0,presence:0,air:0}},context:{intensity:0,activity:0,brightness:0,brightnessValid:false},events:[]}
 let time=1;const reader={read:()=>view}
 function step({energy,event,strength=.424,gain=1,reduced=false,dt=1/60}={}){
  time+=dt;view.frame++;view.updatedAtSeconds=time;if(energy)Object.assign(view.energy.six,energy)
  view.events=event?[{session:view.session,sequence:++view.sequence,band:event,strength,timeSeconds:time,emittedAtSeconds:time}]:[]
  return updateBloomMusic(state,reader,dt,time,gain,reduced)
 }
 const run=(n,o)=>{for(let i=0;i<n;i++)step(o);return state};step();return{state,view,step,run}
}

test('environment evolves slowly while seam attacks remain independent and immediate',()=>{
 const f=fixture();f.view.context.intensity=1;f.run(60)
 assert.ok(Math.abs(f.state.context.intensity-(1-Math.exp(-1/2.4)))<1e-8)
 assert.equal(f.state.output.seamLevel,1)
 f.run(3,{energy:{highMids:.424}});f.step({event:'mid'})
 assert.ok(f.state.output.seamLevel>1.8)
 const start=f.state.context.intensity;f.view.context.intensity=0;f.run(60)
 assert.ok(Math.abs(f.state.context.intensity/start-Math.exp(-1/3.8))<1e-8)
})
test('trail bodies preserve band separation with distinct musical travel rates and shared idle speed',()=>{
 const f=fixture();f.run(60,{energy:{lowMids:.141,highMids:.141}})
 const [a,b]=f.state.trails
 assert.equal(a.level,b.level);assert.ok(b.phase-.43>a.phase+.005)
 const idle=fixture();idle.run(60);assert.ok(Math.abs(idle.state.trails[0].phase-.125)<.003)
 assert.ok(Math.abs(idle.state.trails[1].phase-.43-idle.state.trails[0].phase)<1e-10)
})
test('a fresh quiet low hit cannot inherit a previous strong ring amplitude',()=>{
 const f=fixture();f.run(12);f.run(3,{energy:{bass:.424}});f.step({event:'low'})
 const strong=f.state.ringStrength;assert.ok(strong>.65)
 f.run(24,{energy:{bass:0}});f.run(3,{energy:{bass:.0424}});f.step({event:'low',strength:.0424})
 assert.ok(f.state.ringStrength>0&&f.state.ringStrength<strong*.3)
 assert.ok(f.state.ringAge<.04)
})

test('mid-body and upper-detail onsets remain separately addressable in fixed trail slots',()=>{
 const f=fixture();f.run(12);f.run(3,{energy:{lowMids:.424}});f.step({event:'mid'})
 const body=f.state.trails[0].pulses.find(p=>p.strength>0)
 assert.equal(body.detail,0);assert.ok(body.strength>.6)
 f.run(12);f.run(3,{energy:{presence:.424}});f.step({event:'high'})
 const detail=f.state.trails[0].pulses.find(p=>p.detail===1&&p.strength>0)
 assert.ok(detail.strength>.4);assert.equal(f.state.trails[0].pulses.length,2)
 assert.ok(f.state.trails[1].pulses.every(p=>p.strength===0))
})

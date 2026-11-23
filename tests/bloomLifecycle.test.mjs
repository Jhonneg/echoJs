import test from 'node:test'
import assert from 'node:assert/strict'
import {createFloat,updateFloat,FLOAT_REST,FLOAT_HEIGHT,createParallax,updateParallax} from '../src/scenes/bloom/lifecycle.ts'
test('playback awakens and suspends the stone independent of musical amplitude',()=>{
 const s=createFloat();for(let i=0;i<600;i++)updateFloat(s,false,false,1/60);assert.equal(s.y,FLOAT_REST)
 for(let i=0;i<240;i++)updateFloat(s,true,false,1/60);assert.ok(s.amount>.98)
 const values=[];for(let i=0;i<420;i++){updateFloat(s,true,false,1/60);values.push(s.y)}
 assert.ok(Math.max(...values)-Math.min(...values)>.20);assert.ok(Math.min(...values)>FLOAT_REST+FLOAT_HEIGHT*.7)
 let prev=s.y;for(let i=0;i<120;i++){updateFloat(s,false,false,1/60);assert.ok(Math.abs(s.y-prev)<.02);prev=s.y}
 const before=s.y;updateFloat(s,true,false,1/60);assert.ok(Math.abs(s.y-before)<.02)
 for(let i=0;i<420;i++)updateFloat(s,false,false,1/60);assert.ok(Math.abs(s.y-FLOAT_REST)<.005)
})
test('reduced motion suppresses oscillation, and fragments have independent trajectories',()=>{
 const s=createFloat();for(let i=0;i<600;i++)updateFloat(s,true,true,1/60);const y=s.y
 for(let i=0;i<360;i++)updateFloat(s,true,true,1/60);assert.ok(Math.abs(s.y-y)<.001)
 assert.notEqual(s.fragments[0].z,s.fragments[1].z)
 const a=createFloat();for(let i=0;i<420;i++)updateFloat(a,true,false,1/60);assert.notEqual(a.fragments[0].x,a.fragments[1].x)
})
test('parallax converges smoothly and returns to neutral when disabled',()=>{
 const p=createParallax();p.targetX=1;p.targetY=-1
 for(let i=0;i<120;i++)updateParallax(p,1/60,true);assert.ok(p.x>.99&&p.y<-.99)
 for(let i=0;i<180;i++)updateParallax(p,1/60,false);assert.ok(Math.abs(p.x)<.0001)
})

test('qualified narrow-band impulses are bounded, independently addressed and suppressed at rest/reduced motion',()=>{
 const a=createFloat(),b=createFloat()
 for(let i=0;i<360;i++){updateFloat(a,true,false,1/60);updateFloat(b,true,false,1/60)}
 for(let i=0;i<6;i++){updateFloat(a,true,false,1/60,.8,0);updateFloat(b,true,false,1/60)}
 assert.ok(a.fragments[0].y>b.fragments[0].y+.01);assert.equal(a.fragments[1].y,b.fragments[1].y)
 assert.ok(a.fragments[0].impulse<=.04)
 for(let i=0;i<120;i++)updateFloat(a,true,true,1/60,1,1)
 assert.ok(a.fragments.every(f=>f.impulse<1e-8))
 const rest=createFloat();for(let i=0;i<120;i++)updateFloat(rest,false,false,1/60,1,1)
 assert.ok(rest.fragments.every(f=>f.impulse===0))
})

test('suspended fragments visibly traverse independent orbits without changing the monolith float',()=>{
 const s=createFloat(),ranges=[[],[]]
 for(let i=0;i<1200;i++){
  updateFloat(s,true,false,1/60)
  if(i>=360)s.fragments.forEach((f,j)=>ranges[j].push({...f}))
 }
 for(const rows of ranges){
  const span=key=>Math.max(...rows.map(r=>r[key]))-Math.min(...rows.map(r=>r[key]))
  assert.ok(span('x')>.25&&span('y')>.28&&span('z')>.25&&span('rotation')>.70)
 }
 assert.notEqual(ranges[0][100].rotation,ranges[1][100].rotation)
})

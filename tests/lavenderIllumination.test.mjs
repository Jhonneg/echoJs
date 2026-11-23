import test from 'node:test'
import assert from 'node:assert/strict'
import {createIllumination,updateIllumination,GLINT_DELAYS} from '../src/scenes/lavender-peaks/illumination.ts'
import {createCorona} from '../src/scenes/lavender-peaks/corona.ts'
import {createTerrainProfiles,PROFILE_WIDTH} from '../src/scenes/lavender-peaks/terrainProfiles.ts'
import {ridgeHeight,TERRAIN_PERIOD} from '../src/scenes/lavender-peaks/motion.ts'
import {ridges} from '../src/scenes/lavender-peaks/terrain.ts'

function fixture(){const corona=createCorona();corona.session=1;return {corona,state:createIllumination()}}
function run(f,n=180,{gain=1,reduced=false,fresh=true,hz=60}={}){for(let i=0;i<n;i++)updateIllumination(f.state,f.corona,fresh,1/hz,gain,reduced);return f.state}

test('quiet adds no light; source strength proportionally controls bounded sky/slopes/mist',()=>{
 const zero=fixture();run(zero);assert.equal(zero.state.coronaLight+zero.state.mist,0)
 const a=fixture(),b=fixture();a.corona.envelope=.1;b.corona.envelope=.5;run(a);run(b)
 assert.ok(b.state.coronaLight>a.state.coronaLight*4.9);assert.ok(b.state.mist>a.state.mist*4.9)
 b.corona.envelope=b.corona.detail=b.corona.midAccent=1;run(b);assert.ok(b.state.coronaLight<=1&&b.state.mist<=1)
})
test('rises propagate in selected depth order, while held energy expires as a glint',()=>{
 const f=fixture();run(f,60);f.corona.midAccent=.8
 const first=Array(6).fill(null)
 for(let frame=0;frame<120;frame++){
  run(f,1)
  f.state.glints.forEach((x,i)=>{if(x>.005&&first[i]===null)first[i]=frame/60})
 }
 assert.equal(first[0],null);assert.equal(first[4],null);assert.equal(first[5],null)
 for(let i=1;i<=3;i++){assert.ok(first[i]>=GLINT_DELAYS[i]-.02);if(i>1)assert.ok(first[i]>first[i-1])}
 run(f,300);assert.ok(f.state.glints.every(x=>x===0))
})
test('mist follows shared light smoothly rather than flashing instantaneously',()=>{
 const f=fixture();f.corona.envelope=.8;run(f,1)
 assert.ok(f.state.mist>0&&f.state.mist<f.state.coronaLight)
 run(f,180);const before=f.state.mist;f.corona.envelope=0;run(f,1)
 assert.ok(f.state.mist>0&&f.state.mist<=before+.001)
 run(f,1800);assert.equal(f.state.coronaLight+f.state.mist,0)
})
test('zero gain/session reset clears histories and late glints; source does not get gain twice',()=>{
 const a=fixture(),b=fixture();a.corona.envelope=b.corona.envelope=.4;run(a,180,{gain:.5});run(b);assert.equal(a.state.coronaLight,b.state.coronaLight)
 run(a,1,{gain:0});assert.equal(a.state.coronaLight+a.state.mist+a.state.count,0);assert.ok(a.state.glints.every(x=>x===0))
 b.corona.session++;b.corona.envelope=0;run(b,1);assert.equal(b.state.coronaLight+b.state.mist,0);assert.ok(b.state.count<=1)
})
test('stale/reduced modes cannot replay rising-edge glints, while slow light can fade',()=>{
 for(const options of [{fresh:false},{reduced:true}]){
  const f=fixture();run(f,60);f.corona.highAccent=.8;run(f,120,options)
  assert.ok(f.state.glints.every(x=>x===0));assert.equal(f.state.count,0)
 }
})

test('fresh recovery of a held source does not manufacture a history-edge glint',()=>{
 const f=fixture();f.corona.envelope=.4
 run(f,600,{fresh:false})
 for(let frame=0;frame<120;frame++){run(f,1);assert.ok(f.state.glints.every(x=>x===0))}
})
test('bounded storage, invalid-delta safety and comparable sustained levels at30/60/120Hz',()=>{
 const values=[]
 for(const hz of [30,60,120]){const f=fixture();f.corona.envelope=.4;run(f,hz*3,{hz});values.push(f.state.coronaLight);assert.ok(f.state.count<=256);assert.equal(f.state.levels.length,256)}
 assert.ok(Math.max(...values)-Math.min(...values)<1e-10)
 const f=fixture();for(const dt of [NaN,Infinity,-1])updateIllumination(f.state,f.corona,true,dt,1,false)
 assert.equal(f.state.time,0);updateIllumination(f.state,f.corona,true,100,1,false);assert.equal(f.state.time,.05)
})
test('shared texture samples exactly match every unchanged authored profile and repeat endpoint',()=>{
 const data=createTerrainProfiles();assert.equal(PROFILE_WIDTH,193);assert.equal(data.byteLength,4632)
 for(let row=0;row<6;row++){
  const r=ridges[row]
  for(let x=0;x<PROFILE_WIDTH;x++)assert.ok(Math.abs(data[row*PROFILE_WIDTH+x]-ridgeHeight(x/8-12,r.peaks,r.base,r.detail,row))<3e-7)
  assert.equal(data[row*PROFILE_WIDTH],data[row*PROFILE_WIDTH+192])
 }
 // Manual nearest-texture interpolation matches actual straight outline segments at every tile.
 for(let row=0;row<6;row++)for(const x of [-24.03,-12.01,-.03,0,11.99,24.07]){
  const wrapped=((x+12)%24+24)%24,at=wrapped*8,index=Math.floor(at),fraction=at-index
  const sample=data[row*PROFILE_WIDTH+index]*(1-fraction)+data[row*PROFILE_WIDTH+index+1]*fraction
  const r=ridges[row],left=Math.floor(x*8)/8,t=(x-left)*8
  const expected=ridgeHeight(left,r.peaks,r.base,r.detail,row)*(1-t)+ridgeHeight(left+.125,r.peaks,r.base,r.detail,row)*t
  assert.ok(Math.abs(sample-expected)<3e-7);assert.equal(TERRAIN_PERIOD,24)
 }
})

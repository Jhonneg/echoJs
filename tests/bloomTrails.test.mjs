import test from 'node:test'
import assert from 'node:assert/strict'
import {createMountainGeometry} from '../src/scenes/bloom/mountains.ts'
import {terrainHeight,trailRoute,createTrailGeometry,createTrailState,updateTrailState,TRAIL_PERIOD} from '../src/scenes/bloom/trails.ts'

test('trail ribbons are deterministic and remain attached to each actual quality mesh',()=>{
 for(const quality of ['standard','low']){
  const banks=[createMountainGeometry(-1,quality),createMountainGeometry(1,quality)]
  const snapshots=banks.map(g=>[g.getAttribute('position').array.slice(),g.index.array.slice()])
  const g=createTrailGeometry(banks,quality),again=createTrailGeometry(banks,quality)
  assert.deepEqual(g.getAttribute('position').array,again.getAttribute('position').array)
  const p=g.getAttribute('position'),uv=g.getAttribute('uv'),lane=g.getAttribute('lane'),index=g.index
  assert.equal(index.count/3,quality==='low'?480:1600)
  const lanes=new Set()
  for(let i=0;i<p.count;i++){
   const l=lane.getX(i);lanes.add(l)
   assert.ok([...p.array.slice(i*3,i*3+3),uv.getX(i),uv.getY(i)].every(Number.isFinite))
   assert.ok(Math.abs(p.getY(i)-terrainHeight(banks[l%2],p.getX(i),p.getZ(i))-.012)<3e-6)
   assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1)
  }
  assert.equal(lanes.size,quality==='low'?6:10)
  for(let i=0;i<index.count;i+=3){
   const [a,b,c]=[0,1,2].map(j=>index.getX(i+j))
   const normalY=(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a))-(p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a))
   assert.ok(normalY>0,'ribbon faces out from the terrain')
  }
  banks.forEach((bank,i)=>{assert.deepEqual(bank.getAttribute('position').array,snapshots[i][0]);assert.deepEqual(bank.index.array,snapshots[i][1]);bank.dispose()})
  g.dispose();again.dispose()
 }
})

test('routes progress downhill in the rendered surface with unequal paths and no hero crossing',()=>{
 for(const quality of ['standard','low'])for(let lane=0;lane<(quality==='low'?6:10);lane++){
  const bank=createMountainGeometry(lane%2?1:-1,quality)
  const values=[]
  for(let i=0;i<=160;i++){
   const point=trailRoute(lane,i/160),height=terrainHeight(bank,point.x,point.z)
   assert.ok(lane%2?point.x>2.6:point.x<-2)
   values.push(height)
  }
  assert.ok(values[0]-values.at(-1)>.4)
  assert.ok(Math.max(...values.slice(1).map((v,i)=>v-values[i]))<.008,'no perceptible uphill pulse segments')
  bank.dispose()
 }
})

test('autonomous trail clock freezes for reduced motion, is cadence independent and bounds bad deltas',()=>{
 const frozen=createTrailState();frozen.time=3.4
 updateTrailState(frozen,.04,true);assert.equal(frozen.time,3.4)
 for(const dt of [NaN,Infinity,-1]){updateTrailState(frozen,dt,false);assert.equal(frozen.time,3.4)}
 const times=[]
 for(const hz of [30,60,120]){const state=createTrailState();for(let i=0;i<hz*10;i++)updateTrailState(state,1/hz,false);times.push(state.time)}
 assert.ok(Math.max(...times)-Math.min(...times)<1e-9)
 const state={time:TRAIL_PERIOD-.01};updateTrailState(state,.02,false);assert.ok(Math.abs(state.time-.01)<1e-10)
 assert.equal(TRAIL_PERIOD*.125%1,0,'travel shader phase is continuous across clock wrapping')
})

// Equal x/z offsets previously collapsed into nearly identical screen crests.
test('distinct drainage catchments retain projected separation in both qualities',()=>{
 for(const quality of ['standard','low']){
  const banks=[createMountainGeometry(-1,quality),createMountainGeometry(1,quality)],count=quality==='low'?6:10
  for(let a=0;a<count;a++)for(let b=a+2;b<count;b+=2){
   let separation=0
   for(let i=0;i<=20;i++){
    const p=trailRoute(a,i/20),q=trailRoute(b,i/20)
    separation+=Math.hypot(p.x-q.x,terrainHeight(banks[a%2],p.x,p.z)-terrainHeight(banks[b%2],q.x,q.z))
   }
   assert.ok(separation/21>.3,`routes ${a}/${b} should read as separate paths`)
  }
  banks.forEach(g=>g.dispose())
 }
})

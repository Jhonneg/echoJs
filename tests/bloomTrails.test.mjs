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
  assert.equal(index.count/3,quality==='low'?80:320)
  const lanes=new Set()
  for(let i=0;i<p.count;i++){
   const l=lane.getX(i);lanes.add(l)
   assert.ok([...p.array.slice(i*3,i*3+3),uv.getX(i),uv.getY(i)].every(Number.isFinite))
   assert.ok(Math.abs(p.getY(i)-terrainHeight(banks[l],p.getX(i),p.getZ(i))-.012)<3e-7)
   assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1)
  }
  assert.equal(lanes.size,quality==='low'?1:2)
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
 for(const quality of ['standard','low'])for(const lane of [0,1]){
  const bank=createMountainGeometry(lane?1:-1,quality)
  const values=[]
  for(let i=0;i<=160;i++){
   const point=trailRoute(lane,i/160),height=terrainHeight(bank,point.x,point.z)
   assert.ok(lane?point.x>2.6:point.x<-2)
   values.push(height)
  }
  assert.ok(values[0]-values.at(-1)>1.5)
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

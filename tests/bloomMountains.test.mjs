import test from 'node:test'
import assert from 'node:assert/strict'
import {createMountainGeometry,bankInnerEdge,sampleMountainHeight} from '../src/scenes/bloom/mountains.ts'

test('both qualities produce finite closed solids with normalized normals and bounded triangle counts',()=>{
 for(const [quality,budget]of [['standard',5000],['low',1500]]){
  let triangles=0
  for(const side of [-1,1]){
   const g=createMountainGeometry(side,quality),p=g.getAttribute('position'),n=g.getAttribute('normal'),index=g.index.array
   triangles+=index.length/3
   const edges=new Map();let volume=0
   for(let i=0;i<index.length;i+=3){
    const [a,b,c]=index.slice(i,i+3)
    for(const [v,w]of [[a,b],[b,c],[c,a]]){const key=[Math.min(v,w),Math.max(v,w)].join(':');edges.set(key,(edges.get(key)??0)+1)}
    const ax=p.getX(a),ay=p.getY(a),az=p.getZ(a),bx=p.getX(b),by=p.getY(b),bz=p.getZ(b),cx=p.getX(c),cy=p.getY(c),cz=p.getZ(c)
    const cross=[(by-ay)*(cz-az)-(bz-az)*(cy-ay),(bz-az)*(cx-ax)-(bx-ax)*(cz-az),(bx-ax)*(cy-ay)-(by-ay)*(cx-ax)]
    assert.ok(Math.hypot(...cross)>1e-8)
    volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6
   }
   assert.ok([...edges.values()].every(x=>x===2));assert.ok(volume>0)
   for(let i=0;i<p.count;i++){
    assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite))
    assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-6)
    assert.ok(p.getX(i)>=-20&&p.getX(i)<=20&&p.getZ(i)>=-8&&p.getZ(i)<=2)
   }
   g.dispose()
  }
  assert.ok(triangles<=budget)
 }
})
test('terrain has real depth and height variation, keeping the hero/lake corridor open',()=>{
 for(const z of [-8,-6,-3,0,2]){
  assert.ok(bankInnerEdge(z,-1)<-.5);assert.ok(bankInnerEdge(z,1)>1.7)
  assert.ok(Math.abs((bankInnerEdge(z,-1)+bankInnerEdge(z,1))/2-.6)<1e-10)
  for(const side of [-1,1])assert.ok(sampleMountainHeight(bankInnerEdge(z,side),z)<-11)
 }
 assert.ok(bankInnerEdge(2,1)>bankInnerEdge(-8,1))
 assert.ok(sampleMountainHeight(-6,-8)>sampleMountainHeight(-6,2)+5)
 assert.ok(sampleMountainHeight(-6,-2)<-3.8)
})
test('mountain generation is deterministic across remount and quality replacement',()=>{
 const a=createMountainGeometry(-1,'standard'),low=createMountainGeometry(-1,'low'),b=createMountainGeometry(-1,'standard')
 assert.deepEqual(a.getAttribute('position').array,b.getAttribute('position').array)
 assert.deepEqual(a.index.array,b.index.array);assert.ok(low.index.count<a.index.count)
 a.dispose();low.dispose();b.dispose()
})
test('shoulders have continuous slopes and shoreline rises from a shallow submerged toe',()=>{
 const z=-8,peak=-5.8,epsilon=.001
 const left=(sampleMountainHeight(peak,z)-sampleMountainHeight(peak-epsilon,z))/epsilon
 const right=(sampleMountainHeight(peak+epsilon,z)-sampleMountainHeight(peak,z))/epsilon
 assert.ok(Math.abs(left-right)<.05)
 const edge=bankInnerEdge(z,1)
 assert.ok(sampleMountainHeight(edge+.3,z)>-.4&&sampleMountainHeight(edge+.3,z)<0)
 assert.ok(sampleMountainHeight(edge+.9,z)>0)
 let maximumSlope=0
 for(let d=.4;d<1.6;d+=.05)maximumSlope=Math.max(maximumSlope,Math.abs((sampleMountainHeight(edge+d+.01,z)-sampleMountainHeight(edge+d,z))/.01))
 assert.ok(maximumSlope<3)
})
test('inner shoulders fit portrait world bounds and rock colors remain bounded and nonuniform',()=>{
 assert.ok(sampleMountainHeight(-2.65,-8)>.8)
 assert.ok(sampleMountainHeight(3.2,-8)>sampleMountainHeight(3.4,-8))
 for(const quality of ['standard','low']){
  const g=createMountainGeometry(1,quality),c=g.getAttribute('color')
  assert.ok([...c.array].every(v=>Number.isFinite(v)&&v>=0&&v<=1))
  const p=g.getAttribute('position'),columns=quality==='low'?32:64,row=2,start=row*(columns+1)
  const visible=[]
  for(let i=start;i<start+columns;i++)if(p.getY(i)>.1)visible.push(c.getX(i))
  assert.ok(Math.max(...visible)-Math.min(...visible)>.001)
  g.dispose()
 }
})
test('middle crests overlap the lower far slopes rather than tracing the same wall',()=>{
 for(const x of [-4.7,4.7]){
  assert.ok(sampleMountainHeight(x,-6)>sampleMountainHeight(x,-8)+.1)
  assert.ok(sampleMountainHeight(x,-6)>sampleMountainHeight(x,-3)+.5)
 }
})

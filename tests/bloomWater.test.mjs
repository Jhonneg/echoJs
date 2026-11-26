import test from 'node:test'
import assert from 'node:assert/strict'
import {sampleWater,waterNoise,createWaterGeometry,WATER_VIEW,WATER_BOUNDS} from '../src/scenes/bloom/water.ts'
import {AURORA_PERIOD} from '../src/scenes/bloom/aurora.ts'
import {Vector3,OrthographicCamera} from 'three'

test('wave/ripple gradients agree with independently sampled central differences',()=>{
 const e=1e-5
 for(const t of [0,.4,2.7,13.2])for(const [x,z]of [[-5,1],[.7,4],[7,23],[-13,67],[12,143]])for(const strength of [0,.7]){
  const age=.6,v=sampleWater(x,z,t,age,strength)
  const dx=(sampleWater(x+e,z,t,age,strength).height-sampleWater(x-e,z,t,age,strength).height)/(2*e)
  const dz=(sampleWater(x,z+e,t,age,strength).height-sampleWater(x,z-e,t,age,strength).height)/(2*e)
  assert.ok(Math.abs(v.dx-dx)<1e-7);assert.ok(Math.abs(v.dz-dz)<1e-7)
 }
})
test('noise remains continuous across lattice boundaries, including negative coordinates',()=>{
 for(const x of [-12,-1,0,1,7])for(const z of [-8,-1,0,3]){
  const a=waterNoise(x-1e-6,z+.3),b=waterNoise(x+1e-6,z+.3)
  assert.ok(Math.abs(a.height-b.height)<1e-8);assert.ok(Math.abs(a.dx-b.dx)<1e-8);assert.ok(Math.abs(a.dz-b.dz)<1e-8)
 }
})
test('surface moves geometrically, stays bounded and phase-continuous at the existing clock wrap',()=>{
 let max=0,span=0
 for(let x=-15;x<=15;x+=.75)for(let z=0;z<200;z+=1.2){
  const a=sampleWater(x,z,0),b=sampleWater(x,z,2),c=sampleWater(x,z,AURORA_PERIOD)
  max=Math.max(max,Math.abs(a.height),Math.abs(b.height));span=Math.max(span,Math.abs(a.height-b.height))
  assert.ok([a.height,a.dx,a.dz].every(Number.isFinite));assert.ok(Math.abs(a.height-c.height)<1e-11)
 }
 assert.ok(max<.08&&max>.05);assert.ok(span>.08)
 for(const t of [0,1,8])assert.equal(sampleWater(4,0,t).height,0,'stable mean horizon')
})
test('fresh ring travels from the water foot and fades before the existing three-second cap',()=>{
 const center=.6
 for(const age of [.5,1,2]){
  const r=age*1.575,near=sampleWater(center+r+.1,0,0,age,.8,center,0)
  assert.ok(Math.abs(near.height)>.001)
  const far=sampleWater(center+r+3,0,0,age,.8,center,0)
  assert.ok(Math.abs(far.height)<1e-10)
 }
 assert.equal(sampleWater(2,0,0,3,1,center,0).height,0)
 assert.ok(Math.abs(sampleWater(5.425,0,0,2.999,1,center,0).height)<1e-6)
})
test('both quality levels have bounded genuine meshes; approved view sees their depth',()=>{
 for(const [quality,triangles]of [['standard',65536],['low',36864]]){
  const g=createWaterGeometry(quality);assert.equal(g.index.count/3,triangles);assert.ok(g.getAttribute('position').count>6000)
  g.dispose()
 }
 const c=new OrthographicCamera(-8,8,5,-5,.1,WATER_VIEW.far),p=WATER_VIEW.pitch
 c.position.set(0,WATER_VIEW.distance*Math.sin(p),WATER_VIEW.distance*Math.cos(p));c.lookAt(0,0,0);c.updateMatrixWorld()
 const far=new Vector3(0,-.02,0).project(c),front=new Vector3(0,-.02,50).project(c)
 assert.ok(far.y-front.y>.5);assert.ok(WATER_BOUNDS.front<WATER_VIEW.distance)
})

test('water covers all lower viewport rays without exposed side/front edges',()=>{
 for(const [width,height]of [[1440,900],[1920,810],[390,844]])for(const yaw of [-2.5,0,2.5])for(const pitch of [-1.2,0,1.2]){
  const zoom=Math.min(height/10,width/6.8),camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,WATER_VIEW.far)
  camera.zoom=zoom;camera.updateProjectionMatrix();const y=yaw*Math.PI/180,p=WATER_VIEW.pitch+pitch*Math.PI/180
  camera.position.set(WATER_VIEW.distance*Math.sin(y)*Math.cos(p),WATER_VIEW.distance*Math.sin(p),WATER_VIEW.distance*Math.cos(y)*Math.cos(p));camera.lookAt(0,0,0);camera.updateMatrixWorld()
  for(const x of [-1,0,1])for(const y of [-1,-.5,0]){
   const a=new Vector3(x,y,-1).unproject(camera),b=new Vector3(x,y,1).unproject(camera),direction=b.sub(a)
   const point=a.clone().addScaledVector(direction,(-.02-a.y)/direction.y)
   assert.ok(Math.abs(point.x)<WATER_BOUNDS.width/2)
   assert.ok(point.z>WATER_BOUNDS.back&&point.z<WATER_BOUNDS.front)
  }
 }
})

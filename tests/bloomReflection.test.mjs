import test from 'node:test'
import assert from 'node:assert/strict'
import {Matrix4,Vector3,OrthographicCamera,PlaneGeometry,Scene} from 'three'
import {Reflector} from 'three/addons/objects/Reflector.js'
import {createMonolithGeometry,createStoneFragmentGeometry,MONOLITH} from '../src/scenes/bloom/monolith.ts'
import {WATER_VIEW} from '../src/scenes/bloom/water.ts'

test('actual reflection camera matches mirrored source triangles across pointer angles and hover heights',()=>{
 const camera=new OrthographicCamera(-8,8,5,-5,.1,WATER_VIEW.far),lake=new Reflector(new PlaneGeometry(64,360),{multisample:0})
 lake.rotation.x=-Math.PI/2;lake.position.set(0,MONOLITH.waterY,172);lake.updateMatrixWorld()
 const renderer={xr:{enabled:false},shadowMap:{autoUpdate:false},autoClear:true,state:{buffers:{depth:{setMask(){}}}},getRenderTarget:()=>null,setRenderTarget(){},render(){}}
 const geometries=[createMonolithGeometry(),createStoneFragmentGeometry(0),createStoneFragmentGeometry(1)]
 for(const yaw of [-2.5,0,2.5])for(const pitch of [-1.2,0,1.2]){
  const y=yaw*Math.PI/180,p=WATER_VIEW.pitch+pitch*Math.PI/180
  camera.position.set(WATER_VIEW.distance*Math.sin(y)*Math.cos(p),WATER_VIEW.distance*Math.sin(p),WATER_VIEW.distance*Math.cos(y)*Math.cos(p));camera.lookAt(0,0,0);camera.updateMatrixWorld()
  lake.onBeforeRender(renderer,new Scene(),camera)
  const virtual=lake.getReflectionCamera(camera)
  for(const geometry of geometries)for(const height of [1.78,2.32,2.54]){
   const world=new Matrix4().makeRotationY(-.38);world.setPosition(.6,height,.2)
   const positions=geometry.getAttribute('position')
   for(let i=0;i<positions.count;i++){
    const source=new Vector3().fromBufferAttribute(positions,i).applyMatrix4(world),actual=source.clone().project(virtual)
    source.y=2*MONOLITH.waterY-source.y;const expected=source.project(camera)
    // A reflected camera reverses horizontal handedness; the water texture
    // projector has the same reversal, so source and sampling remain aligned.
    assert.ok(Math.abs(actual.x+expected.x)<1e-10)
    assert.ok(Math.abs(actual.y-expected.y)<1e-10)
   }
  }
 }
 let disposed=0;lake.material.addEventListener('dispose',()=>disposed++);lake.getRenderTarget().addEventListener('dispose',()=>disposed++)
 lake.dispose();assert.equal(disposed,2);lake.geometry.dispose();geometries.forEach(g=>g.dispose())
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {Matrix4,Vector3,OrthographicCamera} from 'three'
import {createMonolithGeometry,createStoneFragmentGeometry} from '../src/scenes/bloom/monolith.ts'
import {reflectedVertex} from '../src/scenes/bloom/reflection.ts'
test('actual beveled body and facet vertices mirror coherently at every pointer corner and hover height',()=>{
 const camera=new OrthographicCamera(-8,8,5,-5,.1,60),source=new Vector3(),mirror=new Vector3()
 for(const yaw of [-2.5,0,2.5])for(const pitch of [-1.2,0,1.2]){
  const y=yaw*Math.PI/180,p=pitch*Math.PI/180
  camera.position.set(20*Math.sin(y)*Math.cos(p),20*Math.sin(p),20*Math.cos(y)*Math.cos(p));camera.lookAt(0,0,0);camera.updateMatrixWorld()
  for(const geometry of [createMonolithGeometry(),createStoneFragmentGeometry(0),createStoneFragmentGeometry(1)])for(const height of [1.78,2.32,2.54]){
   const world=new Matrix4().makeRotationY(-.38);world.setPosition(.6,height,.2)
   const positions=geometry.getAttribute('position')
   for(let i=0;i<positions.count;i++){
    const local=new Vector3().fromBufferAttribute(positions,i)
    source.copy(local).applyMatrix4(world).applyMatrix4(camera.matrixWorldInverse)
    reflectedVertex(mirror,local,world,camera)
    assert.ok(Math.abs(source.x-mirror.x)<1e-12)
    assert.ok(Math.abs(mirror.y-(-.02-(source.y+.02)*.82))<1e-12)
   }
   geometry.dispose()
  }
 }
})

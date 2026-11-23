import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {MONOLITH as m,monolithProjection} from '../src/scenes/bloom/monolith.ts'

test('reflection footprint matches the yawed solid corners and recessed seam',()=>{
 const p=monolithProjection(),xs=[]
 for(const x of [-m.width/2,m.width/2])for(const z of [-m.depth/2,m.depth/2])xs.push(m.x+Math.cos(m.yaw)*x+Math.sin(m.yaw)*z)
 assert.ok(Math.abs(p.left-Math.min(...xs))<1e-12);assert.ok(Math.abs(p.right-Math.max(...xs))<1e-12)
 assert.ok(p.frontRight>p.left&&p.frontRight<p.right);assert.ok(p.seamX>p.left&&p.seamX<p.frontRight)
 assert.ok(p.bottom>0&&p.top<5);assert.ok(p.seamBottom>p.bottom&&p.seamTop<p.top)
 assert.ok(Math.abs(p.top-p.bottom-m.height*m.reflectionCompression)<1e-12)
})
test('static monolith replaces ring geometry and reflection without inherited bass motion',()=>{
 const source=readFileSync('src/scenes/bloom/BloomScene.tsx','utf8')
 assert.doesNotMatch(source,/torusGeometry|haloOffset|haloScale|haloRotation|distanceToRing|updateBassMotion|updateFragmentResponse/)
 assert.match(source,/name="bloom-monolith"/);assert.match(source,/monolithProjection\(\)/)
 assert.match(source,/cameraTilt=\{false\}/)
 assert.doesNotMatch(source,/monolith.*\.position\.set|monolith.*\.scale\.set/)
})

test('stone geometry is deterministic, finite, closed and within the bounded silhouette',async()=>{
 const {createMonolithGeometry,createStoneFragmentGeometry}=await import('../src/scenes/bloom/monolith.ts')
 for(const create of [createMonolithGeometry,()=>createStoneFragmentGeometry(0),()=>createStoneFragmentGeometry(1)]){
  const g=create(),again=create(),p=g.getAttribute('position'),n=g.getAttribute('normal')
  assert.deepEqual(p.array,again.getAttribute('position').array)
  assert.ok(p.count/3<300)
  assert.ok([...p.array,...n.array].every(Number.isFinite))
  const edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(6)).join(',')
  for(let i=0;i<p.count;i+=3){
   const normalLength=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));assert.ok(Math.abs(normalLength-1)<1e-5)
   for(const [a,b]of [[i,i+1],[i+1,i+2],[i+2,i]]){const edge=[key(a),key(b)].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1)}
  }
  assert.ok([...edges.values()].every(count=>count===2),'every solid edge has exactly two faces')
  g.dispose();again.dispose()
 }
 const body=createMonolithGeometry(),bounds=body.boundingBox
 assert.ok(bounds.max.x-bounds.min.x<m.width*1.02)
 assert.ok(Math.abs(bounds.max.y-bounds.min.y-m.height)<1e-6)
 assert.ok(Math.abs(bounds.max.z-bounds.min.z-m.depth)<1e-6)
 const p=body.getAttribute('position'),n=body.getAttribute('normal')
 for(let i=0;i<p.count;i+=3){
  const y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3
  if(Math.abs(y)>m.height/2-1e-5)assert.ok(y*n.getY(i)>0,'caps face outwards')
 }
 body.dispose()
})

test('seam is behind stone lips but in front of the groove floor; fragments stay subordinate',async()=>{
 const {createMonolithGeometry,STONE_FRAGMENTS}=await import('../src/scenes/bloom/monolith.ts')
 const g=createMonolithGeometry(),p=g.getAttribute('position')
 const groove=[]
 for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-m.seamX)<.021&&Math.abs(p.getY(i))<1.6)groove.push(p.getZ(i))
 assert.ok(groove.length>0)
 assert.ok(Math.max(...groove)<m.seamZ&&m.seamZ<m.depth/2)
 assert.ok(m.seamWidth<.04)
 const [left,right]=STONE_FRAGMENTS
 assert.ok(left.x<m.x-m.width/2&&right.x>m.x+m.width/2)
 assert.ok(left.y>right.y&&left.height>right.height)
 for(const f of STONE_FRAGMENTS)assert.ok(f.width<m.width*.2&&f.height<m.height*.12)
 g.dispose()
})

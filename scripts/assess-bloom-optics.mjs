import{readFile,writeFile}from'node:fs/promises'
import{spawnSync}from'node:child_process'
import{Matrix4,Vector3,Quaternion}from'three'
import assert from'node:assert/strict'
const root=process.env.ECHO_BLOOM_EVIDENCE?process.env.ECHO_BLOOM_EVIDENCE+'/current':'docs/evidence/bloom/bl07-optics/current',report=JSON.parse(await readFile(root+'/capture.json'))
assert.ok(!report.failure);assert.deepEqual(report.errors,[]);assert.ok(report.sourceUnchanged)
const results=[]
for(const s of report.screenshots.filter(x=>x.name.startsWith('mask-'))){
 const width=1440,height=900,mask=new Uint8Array(width*height),row=s.row
 const inverse=new Matrix4().compose(new Vector3().fromArray(row.camera.position),new Quaternion().fromArray(row.camera.quaternion),new Vector3(1,1,1)).invert()
 const zoom=row.camera.zoom
 for(const shape of row.reflectionSources){
  const world=new Matrix4().fromArray(shape.sourceMatrix),positions=shape.positions,offset=new Vector3().fromArray(shape.offset),points=[]
  for(let i=0;i<positions.length;i+=3){const p=new Vector3(positions[i],positions[i+1],positions[i+2]).add(offset).applyMatrix4(world).applyMatrix4(inverse);points.push([720+p.x*zoom,450-(-.02-(p.y+.02)*.82)*zoom])}
  const ordered=shape.beam?[0,2,1,2,3,1].map(i=>points[i]):points
  for(let i=0;i<ordered.length;i+=3){const [a,b,c]=ordered.slice(i,i+3),area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-6)continue
   const x0=Math.max(500,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(949,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(453,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(799,Math.ceil(Math.max(a[1],b[1],c[1])))
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b[0]-x-.5)*(c[1]-y-.5)-(b[1]-y-.5)*(c[0]-x-.5))/area,v=((c[0]-x-.5)*(a[1]-y-.5)-(c[1]-y-.5)*(a[0]-x-.5))/area;if(u>=0&&v>=0&&u+v<=1)mask[y*width+x]=1}
  }
 }
 const decode=spawnSync('ffmpeg',['-v','error','-i',root+'/'+s.name+'.png','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:6e6});assert.equal(decode.status,0)
 const pixels=decode.stdout,gpu=new Uint8Array(width*height)
 for(let y=453;y<800;y++)for(let x=500;x<950;x++){const at=(y*width+x)*3;gpu[y*width+x]=pixels[at]>80&&pixels[at+1]>80&&pixels[at+2]>80?1:0}
 const nearby=(m,x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(m[(y+dy)*width+x+dx])return true;return false}
 let missing=0,extra=0,expected=0
 for(let y=454;y<799;y++)for(let x=501;x<949;x++){const at=y*width+x;if(mask[at]){expected++;if(!nearby(gpu,x,y))missing++}if(gpu[at]&&!nearby(mask,x,y))extra++}
 assert.ok(expected>10000);assert.ok(missing===0&&extra===0,`${s.name}: missing${missing} extra${extra}`)
 results.push({view:s.name,expectedPixels:expected,missingBeyond1px:missing,extraBeyond1px:extra})
}
await writeFile(root+'/silhouette-assessment.json',JSON.stringify({method:'CPU rasterization of actual source triangles at recorded final world/camera matrices versus isolated GPU reflection masks; no water distortion in masks only; 1px antialias tolerance.',results,limits:'Checks silhouette alignment of body, beam and both faceted fragments; material aesthetics/native hardware remain owner review.'},null,2))
console.log(JSON.stringify(results))

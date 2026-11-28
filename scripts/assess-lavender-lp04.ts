// Optical evidence: actual on/off renders, independently bounded in screen space.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {ridges} from '../src/scenes/lavender-peaks/terrain.ts'
import {ridgeHeight} from '../src/scenes/lavender-peaks/motion.ts'
import {CORONA_SETTINGS} from '../src/scenes/lavender-peaks/corona.ts'

export async function assessLavenderLP04(){
 const base='docs/evidence/lavender-peaks/lp04/current/',width=1440,height=810,zoom=67.5
 const decode=name=>{const r=spawnSync('ffmpeg',['-v','error','-i',base+name,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());assert.equal(r.stdout.length,width*height*3);return r.stdout}
 const tops=Array.from({length:width},(_,x)=>ridges.map((ridge,i)=>{
  const local=(x+.5-width/2)/zoom,left=Math.floor(local*8)/8,t=(local-left)*8
  const a=ridgeHeight(left,ridge.peaks,ridge.base,ridge.detail,i),b=ridgeHeight(left+.125,ridge.peaks,ridge.base,ridge.detail,i)
  return a+(b-a)*t
 }))
 function difference(left,right,{low=false}={}){
  const a=decode(left),b=decode(right),limit=CORONA_SETTINGS.sunRadius*CORONA_SETTINGS.maximumRadiusRatio
  let changed=0,sum=0,max=0,outside=0,leaks=0,radiusMax=0,white=0
  const bbox=[width,height,0,0]
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const at=(y*width+x)*3,dx=(x+.5-width/2)/zoom-1.6,worldY=(height/2-y-.5)/zoom,dy=worldY-1.9
   const radius=Math.hypot(dx,dy),d=Math.max(...[0,1,2].map(c=>Math.abs(a[at+c]-b[at+c])))
   if(!d)continue
   changed++;max=Math.max(max,d);for(let c=0;c<3;c++)sum+=Math.abs(a[at+c]-b[at+c])
   bbox[0]=Math.min(bbox[0],x);bbox[1]=Math.min(bbox[1],y);bbox[2]=Math.max(bbox[2],x);bbox[3]=Math.max(bbox[3],y)
   radiusMax=Math.max(radiusMax,radius)
   if(radius>limit+(low?2:1)/zoom)outside++
   const covered=tops[x].some(top=>worldY<top-3/zoom)
   if(covered&&d>1)leaks++
   if(b[at]>=254&&b[at+1]>=254&&b[at+2]>=254)white++
  }
  assert.ok(changed>10,'Corona must affect actual pixels')
  assert.equal(outside,0,'No corona changes outside its bounded footprint plus raster tolerance')
  assert.equal(leaks,0,'Opaque mountain interiors must fully occlude the corona')
  assert.equal(white,0,'Corona must not create clipped white pixels')
  return {changedPixels:changed,totalAbsoluteChannelDifference:sum,maxChannelDifference:max,bbox,maximumVisibleRadius:radiusMax,maximumVisibleRadiusRatio:radiusMax/CORONA_SETTINGS.sunRadius,outsideFootprintPixels:outside,mountainInteriorLeaks:leaks,clippedWhitePixels:white}
 }
 const cases:Record<string,any>={}
 for(const name of ['rest','strong','isolated-bass','isolated-low-mid','isolated-high-mid','isolated-air','qualified-mid-accent','low-quality'])cases[name]=difference(name+'-off.png',name+'-on.png',{low:name==='low-quality'})
 assert.ok(cases.strong.totalAbsoluteChannelDifference>cases.rest.totalAbsoluteChannelDifference*1.2,'Strong music must visibly modulate the resting corona')
 assert.equal(cases['isolated-low-mid'].totalAbsoluteChannelDifference,cases.rest.totalAbsoluteChannelDifference,'Low mids alone retain only the intrinsic resting corona')
 const midAccent=difference('qualified-mid-baseline.png','qualified-mid-accent-on.png')
 const preview=JSON.parse(await readFile(base+'preview-trace.json','utf8'))
 const temporal={}
 for(const mode of ['rest','strong']){
  const samples=preview[mode]
  assert.ok(samples.length>25);assert.ok(samples.at(-1).skyUniforms.coronaTime>samples[0].skyUniforms.coronaTime+7)
  assert.ok(samples.every(x=>x.positions.every(p=>p===0)))
  temporal[mode]={samples:samples.length,seconds:samples.at(-1).skyUniforms.coronaTime-samples[0].skyUniforms.coronaTime,firstPhase:samples[0].skyUniforms.coronaTime,lastPhase:samples.at(-1).skyUniforms.coronaTime}
 }
 const report:Record<string,any>={status:'passed bounded visible corona, mountain occlusion, dynamic range and separate mid accent',method:'Actual paired on/off PNGs; fixed offsets/time; pixel footprint from fixed orthographic framing and independently sampled authored profiles.1px Standard/2px Low tolerance;3px mountain-edge exclusion. Changes in projected ridge interiors must stay zero apart from1level roundoff.',cases,midAccent,temporal}
 await writeFile(base+'optical-assessment.json',JSON.stringify(report,null,2))
 const capture=JSON.parse(await readFile(base+'capture.json','utf8'))
 capture.opticalAssessment='optical-assessment.json'
 capture.status='LP04 generated and optical verification passed; explicit owner corona approval required before LP05'
 await writeFile(base+'capture.json',JSON.stringify(capture,null,2))
 return report
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await assessLavenderLP04();console.log(r.status);console.log(JSON.stringify({rest:r.cases.rest,strong:r.cases.strong,midAccent:r.midAccent,temporal:r.temporal},null,2))}

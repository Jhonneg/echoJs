import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {ridges} from '../src/scenes/lavender-peaks/terrain.ts'
import {ridgeHeight} from '../src/scenes/lavender-peaks/motion.ts'

export async function assessLavenderLP05(){
 const base='docs/evidence/lavender-peaks/lp05/current/',width=1440,height=810,zoom=67.5
 const decode=name=>{const r=spawnSync('ffmpeg',['-v','error','-i',base+name,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());assert.equal(r.stdout.length,width*height*3);return r.stdout}
 function topsFor(offsets){return Array.from({length:width},(_,x)=>ridges.map((r,i)=>{const local=(x+.5-width/2)/zoom-offsets[i],left=Math.floor(local*8)/8,t=(local-left)*8;return ridgeHeight(left,r.peaks,r.base,r.detail,i)*(1-t)+ridgeHeight(left+.125,r.peaks,r.base,r.detail,i)*t}))}
 function difference(left,right,{offsets=Array(6).fill(0),glints=false,skyOnly=false,mistOnly=false,low=false}={}){
  const a=decode(left),b=decode(right),tops=topsFor(offsets)
  const layers=Array.from({length:7},()=>({pixels:0,changed:0,totalDifference:0,maxDifference:0,luma:0}))
  let outside=0,protectedEmitter=0,emitterRoundingPixels=0,wideGlint=0,wrongMist=0,white=0,total=0
  for(let y=130;y<650;y++)for(let x=0;x<width;x++){
   const worldX=(x+.5-width/2)/zoom,worldY=(height/2-y-.5)/zoom,dx=worldX-1.6,dy=worldY-1.9
   if(tops[x].some(top=>Math.abs(top-worldY)<3/zoom))continue
   let layer=6;for(let i=5;i>=0;i--)if(worldY<tops[x][i]){layer=i;break}
   const at=(y*width+x)*3,d=Math.max(Math.abs(a[at]-b[at]),Math.abs(a[at+1]-b[at+1]),Math.abs(a[at+2]-b[at+2]))
   const stat=layers[layer];stat.pixels++;stat.luma+=.2126*b[at]+.7152*b[at+1]+.0722*b[at+2]
   if(!d)continue
   stat.changed++;stat.maxDifference=Math.max(stat.maxDifference,d)
   for(let c=0;c<3;c++){const value=Math.abs(a[at+c]-b[at+c]);stat.totalDifference+=value;total+=value}
   const radius=Math.hypot(dx/3.8,dy/(skyOnly?2.7:4.8)),limit=skyOnly?1.35:1.5
   if(radius>limit+(low?3:2)/(Math.min(3.8,skyOnly?2.7:4.8)*zoom))outside++
   if(layer===6&&Math.hypot(dx,dy)<1.0125-1/zoom){if(d>1)protectedEmitter++;else emitterRoundingPixels++}
   if(glints&&layer<6&&tops[x][layer]-worldY>.45&&d>1)wideGlint++
   if(mistOnly&&(layer>1||(Math.abs(worldY-tops[x][layer+1]-.12)>.9)||(tops[x][layer+1]>.92))&&d>1)wrongMist++
   if(b[at]>=254&&b[at+1]>=254&&b[at+2]>=254)white++
  }
  for(const stat of layers){stat.meanDisplayLuma=stat.luma/stat.pixels;stat.meanAbsoluteChannelDifference=stat.totalDifference/(stat.pixels*3)}
  assert.equal(outside,0,'Illumination stays anchored to the bounded sun field')
  assert.equal(protectedEmitter,0,'Approved sky corona/core pixels are preserved')
  assert.equal(white,0,'No clipped white exposure')
  assert.ok(layers[4].maxDifference<=1&&layers[5].maxDifference<=1,'Foreground band shading stays independent of environmental spill')
  if(skyOnly)assert.ok(layers.slice(0,6).every(x=>x.maxDifference<=1),'Sky wash cannot change mountain interiors')
  if(mistOnly)assert.equal(wrongMist,0,'Mist stays in the selected valley bands')
  if(glints){assert.equal(wideGlint,0,'Glints must hug the authored contours');assert.ok(layers[0].maxDifference<=1);assert.ok(layers[6].maxDifference<=1)}
  return {layers,totalAbsoluteChannelDifference:total,outsideFieldPixels:outside,protectedEmitterChanges:protectedEmitter,emitterRoundingPixels,wideGlintPixels:wideGlint,wrongMistPixels:wrongMist,clippedWhitePixels:white}
 }
 const cases={
  rest:difference('rest-off.png','rest-on.png'),
  strong:difference('strong-off.png','strong-on.png'),
  sky:difference('strong-off.png','strong-sky-only.png',{skyOnly:true}),
  slopes:difference('strong-off.png','strong-slopes-only.png'),
  mist:difference('strong-off.png','strong-mist-only.png',{mistOnly:true}),
  glints:difference('delayed-glint-off.png','delayed-glint-only.png',{glints:true}),
  shifted:difference('shifted-field-off.png','shifted-field-on.png',{offsets:[3.2,6.4,1.7,12.1,4.2,8.6]}),
  low:difference('low-quality-off.png','low-quality-on.png',{low:true}),
 }
 assert.equal(cases.rest.totalAbsoluteChannelDifference,0,'Quiet keeps the approved LP04 composition')
 assert.ok(cases.sky.layers[6].changed>100,'Sky wash must be perceptible in actual pixels')
 assert.ok(cases.slopes.layers[0].changed>100,'Adjacent mountain slope must receive light')
 assert.ok(cases.mist.layers[0].changed+cases.mist.layers[1].changed>20,'At least one valley mist band must receive light')
 assert.ok(cases.glints.layers[1].changed+cases.glints.layers[2].changed+cases.glints.layers[3].changed>10,'Delayed glints reach selected farther contours')
 const luma=cases.strong.layers.map(x=>x.meanDisplayLuma),depth={far:(luma[0]+luma[1])/2,middle:(luma[2]+luma[3])/2,near:(luma[4]+luma[5])/2}
 assert.ok(depth.far>depth.middle&&depth.middle>depth.near,'Pastel depth hierarchy survives shared light')
 const report={status:'passed localized sky/slopes/mist, delayed contour glints, emitter protection and world anchoring',method:'Actual held on/off/component renders classified by unchanged sampled profiles.3px silhouette exclusion;1channel interior roundoff. Mixed offsets and full-period render checks complement CPU periodicity tests.',depth,cases}
 await writeFile(base+'optical-assessment.json',JSON.stringify(report,null,2))
 const capture=JSON.parse(await readFile(base+'capture.json'));capture.opticalAssessment='optical-assessment.json';capture.status='LP05 generated and optical checks passed; owner checkpoint review pending';await writeFile(base+'capture.json',JSON.stringify(capture,null,2))
 return report
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await assessLavenderLP05();console.log(r.status);console.log(JSON.stringify({depth:r.depth,cases:Object.fromEntries(Object.entries(r.cases).map(([k,v])=>[k,{totalDifference:v.totalAbsoluteChannelDifference,changed:v.layers.map(x=>x.changed),outside:v.outsideFieldPixels}]))},null,2))}

// Independent rendered-pixel attribution using the unchanged authored silhouettes.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {ridges} from '../src/scenes/lavender-peaks/terrain.ts'
import {ridgeHeight} from '../src/scenes/lavender-peaks/motion.ts'

export async function assessLavenderLP03(){
 const base='docs/evidence/lavender-peaks/lp03/',width=1440,height=810,zoom=67.5
 const decode=name=>{const r=spawnSync('ffmpeg',['-v','error','-i',base+name,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());assert.equal(r.stdout.length,width*height*3);return r.stdout}
 // Use exactly the piecewise-linear curve sampled by ShapeGeometry, not an ideal smooth ridge.
 const tops=Array.from({length:width},(_,x)=>ridges.map((ridge,i)=>{
  const local=(x+.5-width/2)/zoom,left=Math.floor(local*8)/8,t=(local-left)*8
  const a=ridgeHeight(left,ridge.peaks,ridge.base,ridge.detail,i),b=ridgeHeight(left+.125,ridge.peaks,ridge.base,ridge.detail,i)
  return a+(b-a)*t
 }))
 const masks=Array.from({length:6},()=>[])
 for(let y=130;y<650;y++)for(let x=0;x<width;x++){
  const world=(height/2-y-.5)/zoom
  if(tops[x].some(top=>Math.abs(top-world)<3/zoom))continue // Exclude anti-aliased edges.
  for(let i=5;i>=0;i--)if(world<tops[x][i]){masks[i].push((y*width+x)*3);break}
 }
 const controlled=JSON.parse(await readFile(base+'controlled-bands.json'))
 const cases=controlled.map(({band,label,level,state})=>{
  const a=decode(`band-${band}-${label}-baseline.png`),b=decode(`band-${band}-${label}.png`)
  const layers=masks.map(indices=>{
   let difference=0,max=0,changed=0,brightness=0
   for(const at of indices){let pixelChange=false;for(let c=0;c<3;c++){const d=Math.abs(a[at+c]-b[at+c]);difference+=d;max=Math.max(max,d);pixelChange ||= d>0}changed+=pixelChange?1:0;brightness+=.2126*b[at]+.7152*b[at+1]+.0722*b[at+2]}
   return {pixels:indices.length,meanAbsoluteChannelDifference:difference/(indices.length*3),maxChannelDifference:max,changedPixels:changed,meanDisplayLuma:brightness/indices.length}
  })
  assert.ok(layers[band].pixels>200,'Each ridge has a visible interior sample')
  assert.ok(layers[band].meanAbsoluteChannelDifference>.02,'Own-band shading must change actual pixels')
  layers.forEach((layer,i)=>{if(i!==band)assert.ok(layer.maxChannelDifference<=1,'Unassigned ridge must stay unchanged')})
  return {band,name:state.response.ridges[band].band,label,inputEnergy:level,delivered:state.delivered[band],layers}
 })
 for(let band=0;band<6;band++){
  const quiet=cases.find(x=>x.band===band&&x.label==='quiet'),loud=cases.find(x=>x.band===band&&x.label==='loud')
  assert.ok(loud.layers[band].meanAbsoluteChannelDifference>quiet.layers[band].meanAbsoluteChannelDifference*1.25,'Louder input must have stronger rendered shading')
 }
 const dense=decode('active-wrap-standard-origin.png')
 const denseDisplayLuma=masks.map(indices=>indices.reduce((sum,at)=>sum+.2126*dense[at]+.7152*dense[at+1]+.0722*dense[at+2],0)/indices.length)
 const far=(denseDisplayLuma[0]+denseDisplayLuma[1])/2,middle=(denseDisplayLuma[2]+denseDisplayLuma[3])/2,near=(denseDisplayLuma[4]+denseDisplayLuma[5])/2
 assert.ok(far>middle&&middle>near,'All-band input must retain far/middle/near tonal hierarchy')
 const report={status:'passed rendered six-band attribution, quiet/loud ordering and depth hierarchy',method:'1440×810 DPR1; actual PNG differences classified by authored sampled silhouettes, fixed offsets0, excluding all edges by3pixels and UI. Controlled reader overrides, not native capture.',denseDisplayLuma,depthGroups:{far,middle,near},cases}
 await writeFile(base+'pixel-attribution.json',JSON.stringify(report,null,2))
 return report
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await assessLavenderLP03();console.log(r.status);console.log(r.cases.map(x=>({band:x.name,label:x.label,meanPixelDelta:x.layers[x.band].meanAbsoluteChannelDifference,maxOtherDelta:Math.max(...x.layers.filter((_,i)=>i!==x.band).map(y=>y.maxChannelDifference))})))}

import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {ridges} from '../src/scenes/lavender-peaks/terrain.ts'
import {ridgeHeight} from '../src/scenes/lavender-peaks/motion.ts'

export async function assessLavenderLP06(){
 const base='docs/evidence/lavender-peaks/lp06/current/',width=1440,height=810,zoom=67.5
 const capture=JSON.parse(await readFile(base+'capture.json'))
 const decode=name=>{const r=spawnSync('ffmpeg',['-v','error','-i',base+name,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:8*1024*1024});assert.equal(r.status,0,r.stderr.toString());assert.equal(r.stdout.length,width*height*3);return r.stdout}
 const periodic=x=>((x+12)%24+24)%24-12
 function assess(name){
  const pair=capture.pairs.find(x=>x.name===name),observed=capture.snapshots.find(x=>x.name===name+'-on').row
  // Observed material uniforms/positions are authoritative, including held replays.
  const held={...pair.heldState,positions:observed.positions,delivered:observed.delivered}
  const a=decode(name+'-off.png'),b=decode(name+'-on.png')
  const selected=held.delivered.map((x,i)=>x.traceOpacity>0?i:-1).filter(x=>x>=0)
  assert.equal(selected.length,1,'Controlled optical fixture contains one trace')
  const ridge=selected[0],u=held.delivered[ridge]
  const tops=Array.from({length:width},(_,x)=>ridges.map((r,i)=>{const local=(x+.5-width/2)/zoom-held.positions[i],left=Math.floor(local*8)/8,t=(local-left)*8;return ridgeHeight(left,r.peaks,r.base,r.detail,i)*(1-t)+ridgeHeight(left+.125,r.peaks,r.base,r.detail,i)*t}))
  let changed=0,total=0,weightedX=0,max=0,offRecipient=0,wide=0,outsidePath=0,pathRoundingPixels=0,sky=0,white=0,headTotal=0,headPixels=0,tailTotal=0,tailPixels=0
  for(let y=135;y<790;y++)for(let x=0;x<width;x++){
   const worldX=(x+.5-width/2)/zoom,worldY=(height/2-y-.5)/zoom,at=(y*width+x)*3
   if(tops[x].some(top=>Math.abs(worldY-top)<(name==='low-quality-trace'?3:2)/zoom))continue
   let layer=6;for(let i=5;i>=0;i--)if(worldY<tops[x][i]){layer=i;break}
   const d=Math.max(Math.abs(a[at]-b[at]),Math.abs(a[at+1]-b[at+1]),Math.abs(a[at+2]-b[at+2]))
   if(!d)continue
   if(layer!==ridge){if(d>1)offRecipient++;if(layer===6&&d>1)sky++;continue}
   let difference=0;for(let c=0;c<3;c++)difference+=Math.abs(a[at+c]-b[at+c])
   changed++;total+=difference;weightedX+=worldX*difference;max=Math.max(max,d)
   const along=periodic((worldX-held.positions[ridge]-u.traceHead)*u.traceDirection)
   if(along < -u.traceTail-.08 || along>.43){if(d>1)outsidePath++;else pathRoundingPixels++}
   if(tops[x][ridge]-worldY>.25&&d>1)wide++
   if(Math.abs(along)<.10){headTotal+=difference;headPixels++}
   if(along<-.30&&along>-.75){tailTotal+=difference;tailPixels++}
   if(b[at]>=254&&b[at+1]>=254&&b[at+2]>=254)white++
  }
  assert.ok(changed>10,'Trace must change visible ridge pixels')
  assert.equal(offRecipient,0,name+': only the assigned ridge receives trace pixels')
  assert.equal(wide,0,'Trace must stay close to its actual contour')
  assert.equal(outsidePath,0,name+': trace cannot light the entire periodic contour')
  assert.equal(sky,0);assert.equal(white,0)
  return {ridge,changedPixels:changed,totalDifference:total,maxChannelDifference:max,weightedWorldX:weightedX/total,offRecipientPixels:offRecipient,widePixels:wide,outsidePathPixels:outsidePath,pathRoundingPixels,headMean:headPixels?headTotal/headPixels:0,tailMean:tailPixels?tailTotal/tailPixels:0,headPhase:u.traceHead,direction:u.traceDirection}
 }
 const cases={}
 for(const name of ['high-mid-trace','bass-trace','low-mid-trace','air-trace','low-quality-trace','movement-0.2','movement-0.45','movement-0.7','seam-0','seam-24','seam--24','seam-cross-before','seam-cross-at','seam-cross-after'])cases[name]=assess(name)
 const movement=['movement-0.2','movement-0.45','movement-0.7'].map(x=>cases[x])
 assert.ok(movement[1].weightedWorldX>movement[0].weightedWorldX+.5&&movement[2].weightedWorldX>movement[1].weightedWorldX+.5,'Actual rendered light travels in the configured direction')
 assert.ok(movement.every(x=>x.headMean>x.tailMean),'Bright head stays distinguishable from fading tail')
 const seam=['seam-cross-before','seam-cross-at','seam-cross-after'].map(x=>cases[x])
 assert.ok(seam[1].weightedWorldX>seam[0].weightedWorldX&&seam[2].weightedWorldX>seam[1].weightedWorldX,'Rendered head crosses the periodic seam without a reversal')
 assert.ok(Math.abs(seam[2].weightedWorldX-seam[0].weightedWorldX)<.7,'No whole-tile jump at the seam')
 const {rows}=JSON.parse(await readFile(base+'isolated-attacks-trace.json'))
 const liveMotion={}
 for(const [band,ridge,start,end]of [['low',4,19.2,20.9],['mid',2,22.2,24],['high',0,25.2,27.3]]){
  const samples=rows.filter(x=>x.audioTime>=start&&x.audioTime<end&&x.delivered[ridge].traceOpacity>.04)
  assert.ok(samples.length>=3,'Each actual PCM event group produces a moving trace')
  const phase=samples.map(x=>x.delivered[ridge].traceHead)
  liveMotion[band]={ridge,samples:samples.length,direction:samples[0].delivered[ridge].traceDirection,firstHead:phase[0],lastHead:phase.at(-1)}
  assert.ok(periodic(phase.at(-1)-phase[0])*liveMotion[band].direction>.5)
 }
 const report={status:'passed actual contour pixels, head/tail contrast, directional movement and seam continuity',method:'Paired exact held renders; independently sampled unchanged ridge silhouettes;2px Standard/3px Low edge exclusion and1channel rounding tolerance. Additional actual-PCM short-trace motion verified separately from controlled path replay.',cases,liveMotion}
 await writeFile(base+'optical-assessment.json',JSON.stringify(report,null,2))
 capture.opticalAssessment='optical-assessment.json';capture.status='LP06 generated and optical checks passed; owner checkpoint review pending';await writeFile(base+'capture.json',JSON.stringify(capture,null,2))
 return report
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await assessLavenderLP06();console.log(r.status);console.log(JSON.stringify({movement:['movement-0.2','movement-0.45','movement-0.7'].map(x=>r.cases[x]),seam:['seam-cross-before','seam-cross-at','seam-cross-after'].map(x=>r.cases[x]),live:r.liveMotion},null,2))}

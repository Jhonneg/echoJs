import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl03-stone'
const baseline=JSON.parse(await readFile(root+'/baseline/capture.json'))
const current=JSON.parse(await readFile(root+'/current/capture.json'))
for(const r of [baseline,current]){assert.ok(!r.failure);assert.deepEqual(r.errors,[]);assert.ok(r.sourceUnchanged);assert.equal(r.performance.length,3)}
const percentile=(v,p)=>v.toSorted((a,b)=>a-b)[Math.round((v.length-1)*p)]
const timing=r=>r.performance.map(run=>({frames:run.length,medianMs:percentile(run.map(x=>x.dt*1000),.5),p95Ms:percentile(run.map(x=>x.dt*1000),.95),maximumMs:Math.max(...run.map(x=>x.dt*1000)),over33ms:run.filter(x=>x.dt*1000>33.4).length}))
const a=timing(baseline),b=timing(current),ratio=percentile(b.map(x=>x.medianMs),.5)/percentile(a.map(x=>x.medianMs),.5)
assert.ok(ratio<=1.1,'Median cadence regression >10%')
const before=baseline.screenshots.find(x=>x.name==='desktop-standard').row.cost
const after=current.screenshots.find(x=>x.name==='desktop-standard').row.cost
const low=current.screenshots.find(x=>x.name==='desktop-low').row.cost
assert.ok(after.calls<=12);assert.ok(after.triangles-before.triangles<1000);assert.equal(after.textures,before.textures)
for(const shot of current.screenshots.filter(x=>/^(desktop|wide|portrait)-/.test(x.name))){
 const old=baseline.screenshots.find(x=>x.name===shot.name)
 assert.deepEqual(shot.row.camera,old.row.camera)
 assert.deepEqual(shot.row.aurora,old.row.aurora)
 assert.deepEqual(shot.row.banks.map(({name,triangles,vertices})=>({name,triangles,vertices})),old.row.banks.map(({name,triangles,vertices})=>({name,triangles,vertices})))
}
const source=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json')),changed=[]
for(const row of source)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed,['src/scenes/bloom/BloomScene.tsx','src/scenes/bloom/monolith.ts'])
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:6e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
const differences=[]
for(const phase of ['resting','illuminated']){
 const left=decode(root+'/baseline/desktop-'+phase+'.png'),right=decode(root+'/current/desktop-'+phase+'.png')
 let outside=0,hero=0,water=0
 for(let y=0;y<900;y++)for(let x=0;x<1440;x++){
  const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(left[at+c]-right[at+c])))
  if(!d)continue
  if(x>=650&&x<900&&y>=70&&y<420)hero++
  else if(x>=645&&x<910&&y>=450&&y<810)water++
  else outside++
 }
 assert.equal(outside,0,'Scene outside the bounded hero/reflection regions must remain pixel-identical')
 assert.ok(hero>10000&&water>1000)
 const mean=(x0,y0,x1,y1)=>{
  let sum=0,count=0
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const at=(y*1440+x)*3;sum+=(right[at]+right[at+1]+right[at+2])/3;count++}
  return sum/count
 }
 const front=mean(770,150,800,350),side=mean(818,150,830,350)
 assert.ok(side-front>10,'Side face must remain distinguishable from the dark front')
 const centroid=(y0,y1,water)=>{
  let sum=0,weighted=0
  for(let y=y0;y<y1;y++)for(let x=720;x<765;x++){
   const at=(y*1440+x)*3,reference=right[(y*1440+600)*3]
   const weight=water?Math.max(0,right[at]-reference-8):Math.max(0,right[at]-200)
   sum+=weight;weighted+=x*weight
  }
  assert.ok(sum>100);return weighted/sum
 }
 const seam=centroid(130,360,false),reflection=centroid(540,700,true)
 assert.ok(Math.abs(seam-reflection)<3)
 differences.push({phase,protectedPixelsChanged:outside,heroPixelsChanged:hero,waterPixelsChanged:water,frontMean:front,sideMean:side,seamAlignment:{seam,reflection,errorPixels:Math.abs(seam-reflection)}})
}
const report={status:'BL03 stone correction technically verified; owner visual review pending',resources:{before,after,low,addedTriangles:after.triangles-before.triangles},timing:{baseline:a,current:b,medianRatio:ratio,limits:'Three 10s headless ANGLE windows, 1440x900 DPR1. Vsync-limited cadence, not GPU execution time or native hardware certification.'},differences,source:{changed,preserved:source.length-changed.length},reference:'Owner-supplied e9db88c2-38de-4c1f-a9d2-f061b5053b89.png; conceptual comparison only, never a runtime texture',limits:'Camera/terrain/auroras/shared illumination unchanged. Body/fragment reflection remains an inexpensive authored approximation, not a real-time scene reflection. No audio migration or BL05.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
function ffmpeg(args){const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const phase of ['resting','illuminated']){
 ffmpeg(['-i',root+'/baseline/desktop-'+phase+'.png','-i',root+'/current/desktop-'+phase+'.png','-filter_complex',
  `[0:v]scale=720:450,drawtext=text='Before - ${phase} aurora':fontcolor=white:fontsize=16:x=20:y=75[a];[1:v]scale=720:450,drawtext=text='BL03 correction - ${phase} aurora':fontcolor=white:fontsize=16:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/comparison-'+phase+'.png'])
}
for(const name of ['wide','portrait']){
 const w=name==='portrait'?390:960,h=name==='portrait'?844:405
 ffmpeg(['-i',root+'/baseline/'+name+'-standard.png','-i',root+'/current/'+name+'-standard.png','-filter_complex',
  `[0:v]scale=${w}:${h},drawtext=text='Before':fontcolor=white:fontsize=16:x=16:y=85[a];[1:v]scale=${w}:${h},drawtext=text='BL03 correction':fontcolor=white:fontsize=16:x=16:y=85[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/'+name+'-comparison.png'])
}
const reference='references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png'
ffmpeg(['-i',reference,'-i',root+'/baseline/desktop-illuminated.png','-i',root+'/current/desktop-illuminated.png','-filter_complex',
 `[0:v]scale=720:450:force_original_aspect_ratio=decrease,pad=720:450:(ow-iw)/2:(oh-ih)/2,drawtext=text='Approved concept':fontcolor=white:fontsize=18:x=15:y=15[a];[1:v]scale=720:450,drawtext=text='Before':fontcolor=white:fontsize=18:x=15:y=15[b];[2:v]scale=720:450,drawtext=text='BL03 correction':fontcolor=white:fontsize=18:x=15:y=15[c];[a][b][c]hstack=inputs=3[v]`,'-map','[v]','-frames:v','1',root+'/current/concept-before-after.png'])
ffmpeg(['-i',reference,'-i',root+'/baseline/desktop-illuminated.png','-i',root+'/current/desktop-illuminated.png','-filter_complex',
 `[0:v]crop=320:580:690:35,scale=400:560:force_original_aspect_ratio=decrease,pad=400:600:(ow-iw)/2:40,drawtext=text='Concept - hero detail':fontcolor=white:fontsize=18:x=15:y=12[a];[1:v]crop=280:350:640:70,scale=400:560:force_original_aspect_ratio=decrease,pad=400:600:(ow-iw)/2:40,drawtext=text='Before':fontcolor=white:fontsize=18:x=15:y=12[b];[2:v]crop=280:350:640:70,scale=400:560:force_original_aspect_ratio=decrease,pad=400:600:(ow-iw)/2:40,drawtext=text='BL03 correction':fontcolor=white:fontsize=18:x=15:y=12[c];[a][b][c]hstack=inputs=3[v]`,'-map','[v]','-frames:v','1',root+'/current/concept-detail-comparison.png'])
console.log(JSON.stringify(report,null,2))

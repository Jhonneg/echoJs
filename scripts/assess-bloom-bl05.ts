import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl05'
const baseline=JSON.parse(await readFile(root+'/baseline/capture.json','utf8'))
const current=JSON.parse(await readFile(root+'/current/capture.json','utf8'))
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
const source=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json','utf8')),changed:any[]=[]
for(const row of source)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed,['src/scenes/bloom/BloomScene.tsx'])
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:6e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
const differences:any[]=[]
for(const phase of ['resting','illuminated']){
 const left=decode(root+'/baseline/desktop-'+phase+'.png'),right=decode(root+'/current/desktop-'+phase+'.png')
 let outside=0,trails=0
 for(let y=0;y<900;y++)for(let x=0;x<1440;x++){
  const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(left[at+c]-right[at+c])))
  if(!d)continue
  if((x>=290&&x<550&&y>=270&&y<453)||(x>=950&&x<1160&&y>=285&&y<453))trails++
  else outside++
 }
 assert.equal(outside,0,'Pixels outside mountain trail regions must stay unchanged')
 assert.ok(trails>300)
 differences.push({phase,protectedPixelsChanged:outside,trailPixelsChanged:trails})
}
const reference=decode(root+'/baseline/desktop-resting.png')
for(const name of ['trails-hidden','trails-zero'])assert.deepEqual(decode(root+'/current/'+name+'.png'),reference,'Hidden/zero trails exactly restore approved composition')
const dim=decode(root+'/current/trails-dim.png'),full=decode(root+'/current/trails-full.png')
function energy(pixels){let sum=0;for(let i=0;i<pixels.length;i++)sum+=Math.max(0,pixels[i]-reference[i]);return sum}
assert.ok(energy(full)>energy(dim)*1.2,'Manual trail level must visibly change brightness')
const motion:any[]=[]
for(const time of [1.2,2.4,3.6]){
 const pixels=decode(root+'/current/travel-'+time+'.png')
 // Left-lane brightest pulse region; exclude the subdued continuous baseline.
 let sum=0,weightedY=0,weightedX=0
 for(let y=280;y<451;y++)for(let x=290;x<550;x++){
  const at=(y*1440+x)*3,light=Math.max(...[0,1,2].map(c=>pixels[at+c]-reference[at+c]))
  const weight=Math.max(0,light-50)**2
  sum+=weight;weightedY+=y*weight;weightedX+=x*weight
 }
 assert.ok(sum>0)
 motion.push({time,centerX:weightedX/sum,centerY:weightedY/sum})
}
for(let i=1;i<motion.length;i++)assert.ok(motion[i].centerY>motion[i-1].centerY+3&&motion[i].centerX>motion[i-1].centerX+3,'Pulse visibly progresses downhill toward the inner lake')
const report:Record<string,any>={status:'BL05 trails technically verified; owner visual review pending',resources:{before,after,low,addedTriangles:after.triangles-before.triangles},timing:{baseline:a,current:b,medianRatio:ratio,limits:'Three 10s headless ANGLE windows, 1440x900 DPR1. Vsync-limited cadence, not GPU execution time or native hardware certification.'},differences,motion,diagnosticEnergy:{dim:energy(dim),full:energy(full)},source:{changed,preserved:source.length-changed.length,newProduction:['src/scenes/bloom/trails.ts']},reference:'Owner-supplied e9db88c2-38de-4c1f-a9d2-f061b5053b89.png; conceptual comparison only, never a runtime texture',limits:'Autonomous scene-local trail animation only, not Music Intelligence. Camera/terrain/monolith/fragments/auroras/shared lighting and lake are unchanged. No BL06.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
function ffmpeg(args){const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const phase of ['resting','illuminated']){
 ffmpeg(['-i',root+'/baseline/desktop-'+phase+'.png','-i',root+'/current/desktop-'+phase+'.png','-filter_complex',
  `[0:v]scale=720:450,drawtext=text='Before - ${phase} aurora':fontcolor=white:fontsize=16:x=20:y=75[a];[1:v]scale=720:450,drawtext=text='BL05 trails - ${phase} aurora':fontcolor=white:fontsize=16:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/comparison-'+phase+'.png'])
}
for(const name of ['wide','portrait']){
 const w=name==='portrait'?390:960,h=name==='portrait'?844:405
 ffmpeg(['-i',root+'/baseline/'+name+'-standard.png','-i',root+'/current/'+name+'-standard.png','-filter_complex',
  `[0:v]scale=${w}:${h},drawtext=text='Before':fontcolor=white:fontsize=16:x=16:y=85[a];[1:v]scale=${w}:${h},drawtext=text='BL05 trails':fontcolor=white:fontsize=16:x=16:y=85[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/'+name+'-comparison.png'])
}
const concept='references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png'
ffmpeg(['-i',concept,'-i',root+'/baseline/desktop-illuminated.png','-i',root+'/current/desktop-illuminated.png','-filter_complex',
 `[0:v]scale=720:450:force_original_aspect_ratio=decrease,pad=720:450:(ow-iw)/2:(oh-ih)/2,drawtext=text='Approved concept':fontcolor=white:fontsize=18:x=15:y=15[a];[1:v]scale=720:450,drawtext=text='Before':fontcolor=white:fontsize=18:x=15:y=15[b];[2:v]scale=720:450,drawtext=text='BL05 trails':fontcolor=white:fontsize=18:x=15:y=15[c];[a][b][c]hstack=inputs=3[v]`,'-map','[v]','-frames:v','1',root+'/current/concept-before-after.png'])
console.log(JSON.stringify(report,null,2))

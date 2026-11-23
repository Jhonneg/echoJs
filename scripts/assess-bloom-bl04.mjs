import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl04'
const baseline=JSON.parse(await readFile(root+'/baseline/capture.json'))
const candidate=JSON.parse(await readFile(root+'/current/capture.json'))
for(const report of [baseline,candidate]){assert.ok(!report.failure);assert.deepEqual(report.errors,[]);assert.ok(report.sourceUnchanged);assert.equal(report.performance.length,3)}
const percentile=(v,p)=>v.toSorted((a,b)=>a-b)[Math.round((v.length-1)*p)]
const timing=report=>report.performance.map(run=>({frames:run.length,medianMs:percentile(run.map(x=>x.dt*1000),.5),p95Ms:percentile(run.map(x=>x.dt*1000),.95),maximumMs:Math.max(...run.map(x=>x.dt*1000)),over33ms:run.filter(x=>x.dt*1000>33.4).length}))
const a=timing(baseline),b=timing(candidate)
const ratio=percentile(b.map(x=>x.medianMs),.5)/percentile(a.map(x=>x.medianMs),.5)
assert.ok(ratio<=1.1,'Sustained frame cadence regression exceeds10%')
const before=baseline.screenshots.find(x=>x.name==='desktop-standard').row.cost
const after=candidate.screenshots.find(x=>x.name==='desktop-standard').row.cost
const low=candidate.screenshots.find(x=>x.name==='desktop-low').row.cost
assert.equal(after.calls,7);assert.ok(after.triangles<5000);assert.equal(after.textures,before.textures)
assert.equal(after.triangles,4808);assert.equal(low.triangles,1384)
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:5e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
const left=decode(root+'/baseline/desktop-standard.png'),right=decode(root+'/current/desktop-standard.png')
function difference(x0,y0,x1,y1){let pixels=0,max=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
 const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(left[at+c]-right[at+c])))
 if(d>0)pixels++;max=Math.max(max,d)
}return {changedPixels:pixels,maximumChannelDifference:max}}
const protectedMountains=difference(0,240,550,450),protectedSky=difference(400,0,1000,40),heroChange=difference(590,70,980,420)
assert.ok(protectedMountains.changedPixels>1000);assert.ok(heroChange.changedPixels>1000)
const offPixels=decode(root+'/current/aurora-off.png')
const centroid=(y0,y1,water)=>{
 let sum=0,weighted=0
 for(let y=y0;y<y1;y++)for(let x=700;x<840;x++){
  const pixels=offPixels;const at=(y*1440+x)*3,reference=pixels[(y*1440+600)*3]
  const weight=water?Math.max(0,pixels[at]-reference-6):pixels[at]>200?pixels[at]-200:0
  sum+=weight;weighted+=x*weight
 }
 assert.ok(sum>100);return weighted/sum
}
const seam=centroid(130,360,false),reflection=centroid(540,700,true)
assert.ok(Math.abs(seam-reflection)<4,'Reflected seam must align with projected seam')
const source=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json'))
const changed=[]
for(const row of source)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed,['src/scenes/bloom/BloomScene.tsx'])
for(const shot of candidate.screenshots.filter(x=>/^(desktop|wide|portrait)-/.test(x.name))){
 const old=baseline.screenshots.find(x=>x.name===shot.name)
 assert.deepEqual(shot.row.camera,old.row.camera)
}
const report={status:'BL04 aurora/illumination checks pass; owner visual gate pending',
 resources:{baseline:before,standard:after,low},baselineProvenance:baseline.baselineProvenance??'Fresh isolated baseline run',timing:{baseline:a,candidate:b,medianRatio:ratio,
 scope:`Three10s fixed-scene headless windows at1440x900 DPR1, GTX1660SUPER via ANGLE. Vsync-limited cadence; not GPU execution timing or native-window certification. Candidate has ${b.reduce((n,r)=>n+r.over33ms,0)} frames >33.4ms; max ${Math.max(...b.map(r=>r.maximumMs)).toFixed(1)}ms. Native review pending.`},
 protectedMountains,protectedSky,heroChange,seamAlignment:{heroX:seam,reflectionX:reflection,differencePixels:Math.abs(seam-reflection)},source:{changedExisting:changed,preservedExisting:source.length-changed.length,newProduction:['src/scenes/bloom/aurora.ts']},
 limits:'BL04 auroras/shared illumination are autonomous; monolith stays static and legacy background audio remains until BL06. No trails/MI migration. Owner art review and native performance remain separate.'}
const skyOnly=decode(root+'/current/sky-only.png'),all=decode(root+'/current/aurora-on.png')
const region=(x0,y0,x1,y1)=>{let pixels=0,total=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
 const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(all[at+c]-skyOnly[at+c])))
 if(d>0)pixels++;total+=d
}return {pixels,totalDifference:total}}
report.illumination={mountains:region(0,250,550,450),monolith:region(770,150,810,350),lake:region(400,520,700,760)}
for(const r of Object.values(report.illumination))assert.ok(r.pixels>100)
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
const ffmpeg=args=>{const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]]){
 const scale=name==='portrait'?1:.5,w=width*scale,h=height*scale
 ffmpeg(['-i',root+'/baseline/'+name+'-standard.png','-i',root+'/current/'+name+'-standard.png','-filter_complex',
  `[0:v]scale=${w}:${h},drawtext=text='Before':fontcolor=white:fontsize=18:x=20:y=75[a];[1:v]scale=${w}:${h},drawtext=text='BL04 - review pending':fontcolor=white:fontsize=18:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,
  '-map','[v]','-frames:v','1',root+'/current/'+name+'-comparison.png'])
}
console.log(JSON.stringify(report,null,2))

import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const sculpt=process.env.ECHO_BL02_SCULPT==='1',detail=!sculpt&&process.env.ECHO_BL02_DETAIL==='1',refinement=sculpt||detail||process.env.ECHO_BL02_REFINEMENT==='1'
const root=sculpt?'docs/evidence/bloom/bl02-sculpt':detail?'docs/evidence/bloom/bl02-detail':refinement?'docs/evidence/bloom/bl02-refinement':'docs/evidence/bloom/bl02'
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
assert.equal(after.calls,28);assert.ok(after.triangles<25000);assert.equal(after.textures,before.textures)
assert.equal(after.triangles-19972,4788);assert.equal(low.triangles-19972,1364)
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:5e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
const left=decode(root+'/baseline/desktop-standard.png'),right=decode(root+'/current/desktop-standard.png')
function difference(x0,y0,x1,y1){let pixels=0,max=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
 const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(left[at+c]-right[at+c])))
 if(d>0)pixels++;max=Math.max(max,d)
}return {changedPixels:pixels,maximumChannelDifference:max}}
const protectedLake=difference(530,480,1010,780),protectedSky=difference(400,0,1000,40),terrain=difference(0,240,550,450)
assert.equal(protectedLake.changedPixels,0);assert.equal(protectedSky.changedPixels,0);assert.ok(terrain.changedPixels>1000)
let portrait
if(detail){
 const coverage=pixels=>{
  let count=0,firstRow=370
  for(let y=295;y<370;y++)for(let x=0;x<390;x++)if(x<100||x>=350){
   const at=(y*390+x)*3,sky=(y*390+190)*3
   if(Math.max(...[0,1,2].map(c=>Math.abs(pixels[at+c]-pixels[sky+c])))>5){count++;firstRow=Math.min(firstRow,y)}
  }
  return {terrainPixels:count,firstVisibleRow:firstRow}
 }
 portrait={baseline:coverage(decode(root+'/baseline/portrait-standard.png')),current:coverage(decode(root+'/current/portrait-standard.png')),
  method:'Side regions x<100/x>=350,y295..370; pixels differing >5channels from same-row central sky. Fixed390x844 camera; excludes halo/UI.'}
 assert.ok(portrait.current.terrainPixels>portrait.baseline.terrainPixels+100)
 assert.ok(portrait.current.firstVisibleRow<portrait.baseline.firstVisibleRow)
}
const source=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json'))
const changed=[]
for(const row of source)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed,[refinement?'src/scenes/bloom/mountains.ts':'src/scenes/bloom/BloomScene.tsx'])
for(const shot of candidate.screenshots.filter(x=>/^(desktop|wide|portrait)-/.test(x.name))){
 const old=baseline.screenshots.find(x=>x.name===shot.name)
 assert.deepEqual(shot.row.camera,old.row.camera);assert.deepEqual(shot.row.halo,old.row.halo)
}
const report={status:'BL02 technical/resource/optical checks pass; owner visual gate pending',
 resources:{baseline:before,standard:after,low},timing:{baseline:a,candidate:b,medianRatio:ratio,
 scope:`Three10s fixed-scene headless windows at1440x900 DPR1, GTX1660SUPER via ANGLE. Vsync-limited cadence; not GPU execution timing or native-window certification. Candidate has ${b.reduce((n,r)=>n+r.over33ms,0)} frames >33.4ms; max ${Math.max(...b.map(r=>r.maximumMs)).toFixed(1)}ms. Native review pending.`},
 protectedLake,protectedSky,changedTerrain:terrain,portrait,source:{changedExisting:changed,preservedExisting:source.length-changed.length,newProduction:refinement?[]:['src/scenes/bloom/mountains.ts']},
 limits:'BL02 keeps the original analytic lake/halo and legacy Bloom audio; no monolith/aurora/trails/MI migration yet. Owner art review and native performance remain separate.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
const ffmpeg=args=>{const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const [name,width,height]of [['desktop',1440,900],['wide',1920,810],['portrait',390,844]]){
 const scale=name==='portrait'?1:.5,w=width*scale,h=height*scale
 ffmpeg(['-i',root+'/baseline/'+name+'-standard.png','-i',root+'/current/'+name+'-standard.png','-filter_complex',
  `[0:v]scale=${w}:${h},drawtext=text='Before':fontcolor=white:fontsize=18:x=20:y=75[a];[1:v]scale=${w}:${h},drawtext=text='BL02 - review pending':fontcolor=white:fontsize=18:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,
  '-map','[v]','-frames:v','1',root+'/current/'+name+'-comparison.png'])
}
console.log(JSON.stringify(report,null,2))

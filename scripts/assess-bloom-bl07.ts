import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl07'
const baseline=JSON.parse(await readFile(root+'/baseline/capture.json','utf8')),current=JSON.parse(await readFile(root+'/current/capture.json','utf8'))
const beforeTrace=JSON.parse(await readFile(root+'/baseline/sequence-trace.json','utf8')),afterTrace=JSON.parse(await readFile(root+'/current/sequence-trace.json','utf8'))
for(const r of [baseline,current]){assert.ok(!r.failure);assert.deepEqual(r.errors,[]);assert.ok(r.sourceUnchanged);assert.equal(r.performance.length,3);assert.equal(r.motionFrames,305)}
const percentile=(v,p)=>v.toSorted((a,b)=>a-b)[Math.round((v.length-1)*p)]
const timing=r=>r.performance.map(run=>({frames:run.length,medianMs:percentile(run.map(x=>x.dt*1000),.5),p95Ms:percentile(run.map(x=>x.dt*1000),.95),maxMs:Math.max(...run.map(x=>x.dt*1000))}))
const a=timing(baseline),b=timing(current)
assert.ok(percentile(b.map(x=>x.medianMs),.5)<=percentile(a.map(x=>x.medianMs),.5)*1.1)
for(const shot of current.screenshots.filter(x=>!x.name.startsWith('actual-')&&!['scene-reentry','reduced-motion'].includes(x.name))){
 const old=baseline.screenshots.find(x=>x.name===shot.name);assert.ok(old)
 assert.deepEqual(shot.row.cost,old.row.cost);assert.deepEqual(shot.row.camera,old.row.camera)
 assert.deepEqual(shot.row.input,old.row.input,'Exact matched feature publication per checkpoint')
}
for(const r of afterTrace){
 const d=r.delivered,o=r.response.output,p=r.response.projection
 assert.equal(d.seam,o.seamLevel);assert.equal(d.stoneSeam,o.seamLevel);assert.equal(d.stoneAurora,o.auroraStrength)
 assert.equal(d.water.seamLevel,o.seamLevel);assert.equal(d.water.auroraStrength,o.auroraStrength)
 assert.equal(r.hero.position[1],o.heroY);assert.equal(r.hero.rotation[1],o.heroYaw)
 assert.equal(d.water.seamX,p.seamX);assert.deepEqual(d.water.bodyDepth,[p.bottom,p.top])
 assert.deepEqual(d.trails.trailLevels,r.response.trails.map(t=>t.level))
 assert.equal(d.water.ringAge,r.response.ringAge);assert.equal(d.water.ringStrength,r.response.ringStrength)
 assert.ok(o.heroY>=2.25&&o.heroY<=2.55&&Math.abs(o.heroYaw+.38)<=.08)
}
for(let i=0;i<afterTrace.length;i++){
 assert.equal(afterTrace[i].time,beforeTrace[i].time)
 assert.deepEqual(afterTrace[i].input,beforeTrace[i].input)
 // No change to accepted high-mid seam calibration/qualification.
 assert.equal(afterTrace[i].response.output.seamLevel,beforeTrace[i].response.output.seamLevel)
}
const at=(rows,t)=>{const r=rows.find(x=>x.time===t);assert.ok(r);return r}
assert.ok(at(afterTrace,14.5).response.context.intensity<at(beforeTrace,14.5).response.context.intensity)
assert.ok(at(afterTrace,24).response.context.intensity>at(beforeTrace,24).response.context.intensity*1.2)
assert.ok(at(afterTrace,21.5).hero.position[1]>at(beforeTrace,21.5).hero.position[1]+.02)
const acceleration=rows=>{
 const values:any[]=[]
 for(let i=1;i<rows.length-1;i++)if(rows[i].time>=15&&rows[i].time<=21){
  const y=rows[i].hero.position[1],prev=rows[i-1].hero.position[1],next=rows[i+1].hero.position[1]
  values.push(Math.abs(next-2*y+prev)/(.125*.125))
 }
 return{maximum:Math.max(...values),rms:Math.sqrt(values.reduce((n,x)=>n+x*x,0)/values.length)}
}
const motion={baseline:acceleration(beforeTrace),current:acceleration(afterTrace)}
assert.ok(motion.current.rms<motion.baseline.rms*.5,'Monolith must have visibly weighted motion, not direct light-envelope following')
assert.equal(at(afterTrace,37).response.output.seamLevel,1)
const manifest=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json','utf8')),changed:any[]=[]
for(const row of manifest)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed,['src/scenes/bloom/music.ts'])
const trace=JSON.parse(await readFile(root+'/current/generated-trace.json','utf8'))
const peak=(start,end,key)=>Math.max(...trace.filter(r=>r.mediaTime>=start&&r.mediaTime<end).map(key))
assert.equal(peak(2.5,4.9,r=>r.response.bands[3].accent),0)
assert.equal(peak(33.5,37.5,r=>r.response.bands[3].accent),0)
assert.ok(peak(22.2,22.9,r=>r.response.bands[3].accent)>.15)
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:6e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
for(const name of ['desktop-standard','wide-standard','portrait-standard','idle'])assert.deepEqual(decode(root+'/baseline/'+name+'.png'),decode(root+'/current/'+name+'.png'),'Idle must preserve approved visual appearance exactly')
const full=decode(root+'/current/build-late.png'),quiet=decode(root+'/current/quiet.png')
function region(x0,y0,x1,y1){let count=0,total=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(full[at+c]-quiet[at+c])));if(d)count++;total+=d}return{changedPixels:count,totalDifference:total}}
const participation={sky:region(80,80,550,230),mountains:region(80,280,550,450),hero:region(710,65,840,420),lake:region(80,520,700,750)}
for(const r of Object.values(participation))assert.ok(r.changedPixels>1000)
const checkpoints=[6,9,14.5,16,21.5,24,37].map(time=>({time,before:{context:at(beforeTrace,time).response.context.intensity,heroY:at(beforeTrace,time).hero.position[1],aurora:at(beforeTrace,time).response.output.auroraStrength},after:{context:at(afterTrace,time).response.context.intensity,heroY:at(afterTrace,time).hero.position[1],aurora:at(afterTrace,time).response.output.auroraStrength,seam:at(afterTrace,time).delivered.seam}}))
const report:Record<string,any>={status:'BL07 technical choreography checks pass; owner visual/listening review pending',resources:current.screenshots[0].row.cost,timing:{baseline:a,current:b,limits:'Three10s headless ANGLE windows at1440x900 DPR1. Vsync-limited cadence, not native GPU execution/hardware certification.'},motion,checkpoints,participation,source:{changed,preserved:manifest.length-changed.length},generatedBandIsolation:{bassFalseHighMid:0,lowMidBesideHeldHighFalseAccent:0,highMidAccentPeak:peak(22.2,22.9,r=>r.response.bands[3].accent)},limits:'Annotated video replays authored test phases from generated spectra through production MI. No captured media or section/instrument inference; no audio in video. Native performance/real-song acceptance remains separate. BL08 unstarted.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
const ffmpeg=args=>{const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const name of ['quiet','build-late','attack-high-mid','release-early','release-mid']){
 ffmpeg(['-i',root+'/baseline/'+name+'.png','-i',root+'/current/'+name+'.png','-filter_complex',`[0:v]scale=720:450,drawtext=text='BL06 - ${name}':fontcolor=white:fontsize=17:x=20:y=75[a];[1:v]scale=720:450,drawtext=text='BL07 - ${name}':fontcolor=white:fontsize=17:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/comparison-'+name+'.png'])
}
ffmpeg(['-i',root+'/baseline/choreography.mp4','-i',root+'/current/choreography.mp4','-filter_complex','[0:v]scale=720:450[a];[1:v]scale=720:450[b];[a][b]hstack=inputs=2[v]','-map','[v]','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',root+'/current/choreography-comparison.mp4'])
ffmpeg(['-i',root+'/current/choreography-comparison.mp4','-vf','fps=1/8,scale=960:300,tile=1x4','-frames:v','1',root+'/current/motion-contact-sheet.png'])
console.log(JSON.stringify(report,null,2))

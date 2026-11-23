import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl06'
const baseline=JSON.parse(await readFile(root+'/baseline/capture.json'))
const current=JSON.parse(await readFile(root+'/current/capture.json'))
assert.ok(!baseline.failure&&!current.failure);assert.deepEqual(current.errors,[]);assert.ok(current.sourceUnchanged)
const shot=name=>{const item=current.screenshots.find(s=>s.name===name);assert.ok(item,name);return item.row}
const percentile=(v,p)=>v.toSorted((a,b)=>a-b)[Math.round((v.length-1)*p)]
const timing=r=>r.performance.map(run=>({frames:run.length,medianMs:percentile(run.map(x=>x.dt*1000),.5),p95Ms:percentile(run.map(x=>x.dt*1000),.95),maxMs:Math.max(...run.map(x=>x.dt*1000))}))
const a=timing(baseline),b=timing(current)
assert.equal(a.length,3);assert.equal(b.length,3);assert.ok(percentile(b.map(x=>x.medianMs),.5)<=percentile(a.map(x=>x.medianMs),.5)*1.1)
const original=baseline.screenshots.find(x=>x.name==='desktop-standard').row
assert.deepEqual(shot('desktop-standard').cost,original.cost)
for(const item of current.screenshots.filter(x=>/^(desktop|wide|portrait)-(standard|low)$/.test(x.name))){assert.deepEqual(item.row.camera,baseline.screenshots.find(s=>s.name===item.name).row.camera)}
for(const item of current.screenshots){
 const r=item.row,o=r.response.output,d=r.delivered,p=r.response.projection
 assert.equal(d.stoneSeam,o.seamLevel);assert.equal(d.stoneAurora,o.auroraStrength);assert.equal(d.seam,o.seamLevel);assert.equal(d.water.seamLevel,o.seamLevel)
 assert.equal(d.water.auroraStrength,o.auroraStrength);assert.equal(d.water.seamX,p.seamX)
 assert.deepEqual(d.water.bodyBounds,[p.left,p.right]);assert.deepEqual(d.water.bodyDepth,[p.bottom,p.top])
 assert.deepEqual(d.trails.trailLevels,r.response.trails.map(t=>t.level))
 assert.equal(r.hero.position[1],o.heroY);assert.equal(r.hero.rotation[1],o.heroYaw)
 const expected=.6+Math.cos(o.heroYaw)*(-.24)+Math.sin(o.heroYaw)*.283
 assert.ok(Math.abs(expected-p.seamX)<1e-12)
}
for(const name of ['bass-only','low-mid','treble-only','context-only'])assert.equal(shot(name).delivered.seam,1)
assert.equal(shot('low-mid-beside-held-high').response.bands[3].accent,0)
assert.ok(shot('high-mid-quiet').delivered.seam<shot('high-mid-moderate').delivered.seam)
assert.ok(shot('high-mid-moderate').delivered.seam<shot('high-mid-loud').delivered.seam)
assert.ok(shot('high-mid-attack').delivered.seam>shot('high-mid-loud').delivered.seam+.25)
assert.ok(shot('high-mid-release').response.bands[3].accent<shot('high-mid-attack').response.bands[3].accent)
assert.equal(shot('gain-zero').delivered.seam,1);assert.equal(shot('stale').response.fresh,false)
const trace=JSON.parse(await readFile(root+'/current/generated-trace.json'))
const peak=(start,end,key)=>Math.max(...trace.filter(r=>r.mediaTime>=start&&r.mediaTime<end).map(key))
const mean=(start,end,key)=>{const values=trace.filter(r=>r.mediaTime>=start&&r.mediaTime<end).map(key);assert.ok(values.length);return values.reduce((a,b)=>a+b)/values.length}
const actual={
 bassEnergy:mean(3,4.9,r=>r.input.energy.six.bass),
 highMidQuiet:mean(9,10.9,r=>r.input.energy.six.highMids),highMidLoud:mean(12,13.9,r=>r.input.energy.six.highMids),
 seamQuiet:mean(9,10.9,r=>r.delivered.seam),seamLoud:mean(12,13.9,r=>r.delivered.seam),
 highMidAttack:peak(22.2,22.9,r=>r.response.bands[3].accent),
 falseHighMidFromBass:peak(2.5,4.9,r=>r.response.bands[3].accent),
 falseHighMidFromLowMid:peak(33.5,37.5,r=>r.response.bands[3].accent),
 silenceSeam:mean(56,58,r=>r.delivered.seam),
 mixed:peak(45,48,r=>r.delivered.trails.trailLevels[0]+r.delivered.trails.trailLevels[1]),
}
assert.ok(actual.highMidQuiet>.035&&actual.highMidQuiet<.05)
assert.ok(actual.highMidLoud>actual.highMidQuiet*2.8)
assert.ok(actual.seamLoud>actual.seamQuiet+.05)
assert.ok(actual.highMidAttack>.15)
assert.equal(actual.falseHighMidFromBass,0);assert.equal(actual.falseHighMidFromLowMid,0)
assert.ok(actual.silenceSeam<1.01)
const manifest=JSON.parse(await readFile(root+'/baseline/pre-task-source-manifest.json')),changed=[]
for(const item of manifest)if(createHash('sha256').update(await readFile(item.file)).digest('hex')!==item.sha256)changed.push(item.file)
assert.deepEqual(changed,['src/App.tsx','src/scenes/bloom/BloomScene.tsx','src/scenes/bloom/aurora.ts','src/scenes/bloom/monolith.ts','src/scenes/bloom/trails.ts'])
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:6e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout}
const seamPixels={}
for(const name of ['silence','high-mid-quiet','high-mid-moderate','high-mid-loud','high-mid-attack','high-mid-release']){
 const pixels=decode(root+'/current/'+name+'.png');let sum=0
 for(let y=140;y<350;y++)for(let x=735;x<754;x++)sum+=pixels[(y*1440+x)*3]
 seamPixels[name]=sum/(210*19)
}
assert.ok(seamPixels['high-mid-loud']>seamPixels['high-mid-quiet']+1)
assert.ok(seamPixels['high-mid-attack']>seamPixels['high-mid-loud']+2)
const idleBefore=decode(root+'/baseline/desktop-standard.png'),idleAfter=decode(root+'/current/desktop-standard.png')
let changedIdle=0,maxIdle=0,protectedIdle=0
for(let i=0;i<idleBefore.length;i+=3){const diff=Math.max(...[0,1,2].map(c=>Math.abs(idleAfter[i+c]-idleBefore[i+c])));if(diff){changedIdle++;const x=(i/3)%1440,y=Math.floor(i/3/1440);if(!((x>=650&&x<900&&y>=70&&y<420)||(x>=645&&x<910&&y>=450&&y<810)||(x>=290&&x<550&&y>=270&&y<453)||(x>=950&&x<1160&&y>=285&&y<453)))protectedIdle++}maxIdle=Math.max(maxIdle,diff)}
assert.equal(protectedIdle,0,'Idle changes are restricted to corrected stone lighting/reflection and capped trail core regions')
for(const [file,marker]of [['monolith.ts','const stoneNoise'],['trails.ts','export const trailVertex'],['aurora.ts','// Shared world-space folds']]){
 const old=await readFile(root+'/baseline/'+file+'.txt','utf8'),next=await readFile('src/scenes/bloom/'+file,'utf8')
 assert.equal(next.slice(0,next.indexOf(marker)),old.slice(0,old.indexOf(marker)),'Approved geometry and ambient generators preserved')
}
const activeFrames=trace.filter(r=>r.mediaTime>=44&&r.mediaTime<49).map(r=>r.dt*1000)
const activeTiming={samples:activeFrames.length,medianMs:percentile(activeFrames,.5),p95Ms:percentile(activeFrames,.95),limits:'Sampled render deltas during generated mixed-frequency playback; not a continuous GPU execution measurement.'}
const matrix=current.screenshots.filter(s=>['silence','bass-only','low-mid','high-mid-loud','high-mid-attack','treble-only','context-only','stale','gain-zero','reduced-high-mid'].includes(s.name)).map(s=>({name:s.name,energy:s.row.input.energy.six,output:s.row.response.output,trails:s.row.response.trails.map(t=>({level:t.level,shimmer:t.shimmer}))}))
const report={status:'BL06 technical migration/controlled verification passed; owner visual/listening review pending',resources:original.cost,timing:{baseline:a,current:b,limits:'Headless ANGLE GTX1660SUPER, 1440x900 DPR1, three10s windows. Vsync cadence, not native/GPU execution certification.'},actualGeneratedAudio:actual,activeTiming,seamObservedMeanRed:seamPixels,idleComparison:{changedPixels:changedIdle,maxChannelDifference:maxIdle,protectedPixelsChanged:protectedIdle},matrix,source:{changed,preserved:manifest.length-changed.length,newProduction:['src/scenes/bloom/music.ts']},limitations:'No captured/owner media. Controlled/generated evidence does not certify real-song listening. Legacy reactivity helper remains for historical tests/unused debug component but is absent from Bloom runtime wiring. BL07 unstarted.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2)+'\n')
function ffmpeg(args){const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
for(const [file,left,right]of [['idle-comparison','../baseline/desktop-standard','desktop-standard'],['seam-sustained-attack','high-mid-loud','high-mid-attack'],['quiet-loud-high-mid','high-mid-quiet','high-mid-loud'],['bass-high-mid','bass-only','high-mid-loud']]){
 ffmpeg(['-i',root+'/current/'+left+'.png','-i',root+'/current/'+right+'.png','-filter_complex',`[0:v]scale=720:450,drawtext=text='${left.replace('../baseline/','Before - ')}':fontcolor=white:fontsize=17:x=20:y=75[a];[1:v]scale=720:450,drawtext=text='${right}':fontcolor=white:fontsize=17:x=20:y=75[b];[a][b]hstack=inputs=2[v]`,'-map','[v]','-frames:v','1',root+'/current/'+file+'.png'])
}
ffmpeg(['-i',root+'/current/high-mid-quiet.png','-i',root+'/current/high-mid-loud.png','-i',root+'/current/high-mid-attack.png','-filter_complex',`[0:v]crop=170:355:690:70,scale=255:532,drawtext=text='Quiet':fontcolor=white:fontsize=18:x=10:y=10[a];[1:v]crop=170:355:690:70,scale=255:532,drawtext=text='Sustained loud':fontcolor=white:fontsize=18:x=10:y=10[b];[2:v]crop=170:355:690:70,scale=255:532,drawtext=text='Fresh attack':fontcolor=white:fontsize=18:x=10:y=10[c];[a][b][c]hstack=inputs=3[v]`,'-map','[v]','-frames:v','1',root+'/current/seam-detail-comparison.png'])
console.log(JSON.stringify({...report,matrix:undefined},null,2))

import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import{spawnSync}from'node:child_process'
import assert from'node:assert/strict'
import{OrthographicCamera,Vector3}from'three'
const root='docs/evidence/bloom/bl07-complete',r=JSON.parse(await readFile(root+'/current/capture.json','utf8'))
assert.ok(!r.failure);assert.deepEqual(r.errors,[]);assert.ok(r.sourceUnchanged)
const cameraReport=JSON.parse(await readFile('docs/evidence/bloom/bl07-complete-camera/current/capture.json','utf8'));assert.ok(!cameraReport.failure);assert.deepEqual(cameraReport.errors,[]);assert.ok(cameraReport.sourceUnchanged)
const shot=n=>r.screenshots.find(s=>s.name===n).row
const rest=1.78
assert.ok(Math.abs(shot('resting').hero.position[1]-rest)<.001)
assert.ok(shot('hovering').floating.amount>.98)
assert.ok(shot('descending').floating.amount<shot('floating').floating.amount)
assert.ok(Math.abs(shot('paused-rest').hero.position[1]-rest)<.025)
assert.ok(shot('actual-quiet').hero.position[1]>rest+.45,'quiet playback must keep floating')
const frames=JSON.parse(await readFile(root+'/current/motion.json','utf8'))
for(let i=1;i<frames.length;i++)if(frames[i].time-frames[i-1].time<.25)assert.ok(Math.abs(frames[i].row.hero.position[1]-frames[i-1].row.hero.position[1])/(frames[i].time-frames[i-1].time)<.6,'continuous movement within contiguous footage')
let maxAlignment=0
const angles:any[]=[]
for(const s of [...r.screenshots,...cameraReport.screenshots]){const row=s.row,c=new OrthographicCamera(-720,720,450,-450,.1,60)
 c.position.fromArray(row.camera.position);c.quaternion.fromArray(row.camera.quaternion);c.zoom=row.camera.zoom;c.updateMatrixWorld();c.updateProjectionMatrix()
 const yaw=row.hero.rotation[1],v=new Vector3(.6+Math.cos(yaw)*(-.24)+Math.sin(yaw)*.283,row.hero.position[1],-Math.sin(yaw)*(-.24)+Math.cos(yaw)*.283).applyMatrix4(c.matrixWorldInverse)
 const error=Math.abs(v.x-row.delivered.water.seamX)*c.zoom;maxAlignment=Math.max(error,maxAlignment);assert.ok(error<.01)
 assert.equal(row.delivered.seam,row.delivered.stoneSeam);assert.equal(row.delivered.seam,row.delivered.water.seamLevel)
 if(s.name.startsWith('pointer-'))angles.push({name:s.name,yaw:Math.atan2(c.position.x,c.position.z)*180/Math.PI,pitch:Math.asin(c.position.y/20)*180/Math.PI,seamErrorPx:error})
}
assert.ok(Math.abs(shot('neutral').parallax.x)<.01)
assert.ok(angles.some(a=>Math.abs(a.yaw)>2),'pointer must produce actual view change')
const p=JSON.parse(await readFile(root+'/current/generated-trace.json','utf8'))
const peak=(a,b,fn)=>Math.max(...p.filter(x=>x.mediaTime>=a&&x.mediaTime<b).map(fn))
assert.equal(peak(2.5,4.9,x=>x.response.bands[3].accent),0)
assert.equal(peak(33.5,37.5,x=>x.response.bands[3].accent),0)
const percentile=(v,p)=>v.toSorted((a,b)=>a-b)[Math.round((v.length-1)*p)]
const performance=r.performance.map(f=>({frames:f.length,median:percentile(f.map(x=>x.dt*1000),.5),p95:percentile(f.map(x=>x.dt*1000),.95)}))
const manifest=JSON.parse(await readFile(root+'/baseline/manifest.json','utf8')),changed:any[]=[]
for(const f of manifest)if(createHash('sha256').update(await readFile(f.file)).digest('hex')!==f.sha256)changed.push(f.file)
assert.ok(changed.every(f=>f.startsWith('src/scenes/bloom/')||['src/App.tsx','src/components/AudioControls.tsx'].includes(f)))
const report:Record<string,any>={status:'Implementation and measured browser checks pass; owner visual/musical acceptance pending',changed,preserved:manifest.length-changed.length,newProduction:['src/scenes/bloom/lifecycle.ts'],lifecycle:{rest,hovering:shot('hovering').floating,quietY:shot('actual-quiet').hero.position[1],pausedY:shot('paused-rest').hero.position[1]},camera:angles,maxSeamGeometricErrorPx:maxAlignment,cost:shot('hovering').cost,performance,pointerProfile:'Fine pointer emulated only in isolated camera run; actual browser pointer events. Native pointer feel manual pending.',limits:'Analytic reflection uses projected body bounds and fragment impressions with wet distortion, not a physical scene reflection pass. Geometric seam alignment is measured; full optical fidelity and aesthetics require owner review. Native tab picker/device performance and real-song listening remain manual.'}
await writeFile(root+'/current/assessment.json',JSON.stringify(report,null,2))
for(const [name,a,b]of [['rest-hover','resting','hovering'],['camera-extremes','pointer-left','pointer-right'],['quiet-energetic','actual-quiet','actual-mixed']] as const){
 const v=spawnSync('ffmpeg',['-y','-loglevel','error','-i',(name==='camera-extremes'?'docs/evidence/bloom/bl07-complete-camera/current/':root+'/current/')+a+'.png','-i',(name==='camera-extremes'?'docs/evidence/bloom/bl07-complete-camera/current/':root+'/current/')+b+'.png','-filter_complex',`[0:v]scale=720:450,drawtext=text='${a}':fontcolor=white:fontsize=18:x=20:y=75[a];[1:v]scale=720:450,drawtext=text='${b}':fontcolor=white:fontsize=18:x=20:y=75[b];[a][b]hstack[v]`,'-map','[v]','-frames:v','1',root+'/current/'+name+'.png'],{encoding:'utf8'});assert.equal(v.status,0,v.stderr)
}
console.log(JSON.stringify(report,null,2))

// R2 generated evidence: actual per-instance buffer delivery and event direction.
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const base='docs/evidence/nocturne/nt13-refinement',load=async path=>JSON.parse(await readFile(`${base}/${path}`,'utf8'))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),mean=values=>values.reduce((a,b)=>a+b,0)/values.length
const source=await load('r1/source-manifest.json'),changed:any[]=[]
for(const x of source)if(hash(await readFile(x.file))!==x.sha256)changed.push(x.file)
assert.deepEqual(changed.sort(),['src/scenes/nocturne/ArchitectureDetails.tsx','src/scenes/nocturne/LightingDriver.tsx','src/scenes/nocturne/bridge.ts','src/scenes/nocturne/visualState.ts'])
for(const x of await load('r2/source-manifest.json'))assert.equal(hash(await readFile(x.file)),x.sha256,'Source changed after R2 capture: '+x.file)
const result:Record<string,any>={changedExistingSource:changed,unchangedExistingSource:source.length-changed.length,newSource:['src/scenes/nocturne/spatial.ts'],runs:[],sequences:[],manualPixelDifferences:{}}
for(const quality of ['standard','low','standard-reduced']){
 const directory=`r2/nocturne/${quality}/baseline`,capture=await load(`${directory}/capture.json`),{rows,frames}=await load(`${directory}/trace.json`)
 assert.ok(capture.status&&!capture.failure);assert.deepEqual(capture.errors,[])
 assert.equal(capture.pcmHash,(await load('r1/nocturne/standard/baseline/capture.json')).pcmHash)
 const data={quality,samples:rows.length,frames:frames.length,renderer:rows[0].renderer,calls:[...new Set(rows.map(r=>r.cost.calls))],geometries:[...new Set(rows.map(r=>r.cost.geometries))],textures:[...new Set(rows.map(r=>r.cost.textures))],meanFrameSeconds:mean(rows.map(r=>r.cost.dt)),maxScreenshotBracketSeconds:Math.max(...frames.map(f=>f.after-f.before)),lateSilenceAllOff:true}
 assert.deepEqual(data.calls,[196]);assert.deepEqual(data.geometries,[114]);assert.deepEqual(data.textures,[6])
 for(const r of rows){
  assert.deepEqual(r.camera,[0,1.6,5]);assert.equal(r.renderer.exposure,1);assert.equal(r.renderer.toneMapping,4)
  for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10)
  for(const x of r.emitters){
   if(x.instances){
    assert.equal(x.intensity,1.3)
    assert.ok(x.instances.levels.every(v=>Number.isFinite(v)&&v>=0&&v<=1))
    x.instances.levels.forEach((v,i)=>assert.ok(Math.abs(v-r.instanceLevels[x.instances.channel][x.instances.indices[i]])<1e-7))
   }else assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)
  }
  for(const [channel,levels]of Object.entries(r.instanceLevels))assert.ok(Math.abs(r.channels[channel].level-mean(levels))<1e-10)
  if(quality==='standard-reduced'){
   for(const levels of Object.values<any>(r.instanceLevels))assert.ok(levels.every(v=>v===levels[0]))
   assert.ok(Object.values<any>(r.channels).every(x=>x.accent===0));assert.ok(r.bridgeSections.every(v=>v===0))
  }
  if(r.audioTime>52){assert.ok(Object.values<any>(r.channels).every(x=>x.level===0));assert.ok(Object.values<any>(r.instanceLevels).every(levels=>levels.every(x=>x===0)))}
  if(r.audioTime>5&&r.audioTime<8.8)assert.ok(r.bridgeSections.every(x=>x===0),'Bass cannot trigger treble bridge')
 }
 for(const snapshot of capture.snapshots){
  const r=snapshot.record
  if(['manual-all-on','manual-all-off','paused-after-audio'].includes(snapshot.name)){
   const expected=snapshot.name==='manual-all-on'?1:0
   for(const levels of Object.values<any>(r.instanceLevels))assert.ok(levels.every(x=>x===expected))
   for(const x of r.emitters)if(x.instances)assert.ok(x.instances.levels.every(v=>v===expected))
  }
 }
 result.runs.push(data)
 if(quality==='standard'){
  // Locate this generated run's temporary frames by an exact retained-image hash.
  // Future captures also record their directory in capture metadata.
  const reference=frames.reduce((a,b)=>Math.abs(b.time-19)<Math.abs(a.time-19)?b:a),imageHash=hash(await readFile(`${base}/${directory}/dense.jpg`))
  let frameDirectory=capture.generatedFramesDirectory
  if(!frameDirectory)for(const dir of await readdir('/tmp')){
   if(!dir.startsWith('echo-r0-'))continue
   try{if(hash(await readFile(join('/tmp',dir,reference.name)))===imageHash){frameDirectory=join('/tmp',dir);break}}catch{}
  }
  for(const [role,start,end]of [['magentaSecondary',3,4.35],['cyanWindows',9,10.4],['cyanDetails',9,10.4],['bridge',15,16.1]] as const){
   const selected=rows.filter(r=>r.audioTime>=start&&r.audioTime<=end)
   const values=r=>role==='bridge'?r.bridgeSections:r.instanceLevels[role],count=values(selected[0]).length
   const sequence:Record<string,any>={role,peaks:[]}
   for(let i=0;i<count;i++){
    const delta=r=>values(r)[i]-(role==='bridge'?0:Math.min(...values(r)))
    const peak=selected.reduce((a,b)=>delta(b)>delta(a)?b:a),frame=frames.reduce((a,b)=>Math.abs(b.time-peak.audioTime)<Math.abs(a.time-peak.audioTime)?b:a)
    assert.ok(delta(peak)>.03,'Distinct event above own sustained baseline')
    if(i>0)assert.ok(peak.audioTime>sequence.peaks[i-1].audioTime+.06,'Ordered peak progression')
    const name=`${role}-step-${i}.jpg`
    if(frameDirectory)await copyFile(join(frameDirectory,frame.name),`${base}/r2/${name}`)
    sequence.peaks.push({index:i,audioTime:peak.audioTime,increment:delta(peak),screenshotTime:frame.time,screenshotBracket:[frame.before,frame.after],image:name})
   }
   result.sequences.push(sequence)
  }
 }
}
for(const quality of ['standard','low'])for(const state of ['manual-all-on','manual-all-off']){
 const out=spawnSync('magick',['compare','-metric','AE',`${base}/r1/nocturne/${quality}/baseline/${state}.png`,`${base}/r2/nocturne/${quality}/baseline/${state}.png`,'null:'],{encoding:'utf8'})
 if(quality==='standard'||state==='manual-all-off')assert.equal(out.status,0,out.stderr)
 else assert.ok(out.status===0||out.status===1,'Image comparison executed')
 result.manualPixelDifferences[`${quality}/${state}`]=out.stderr.trim()
}
await writeFile(`${base}/r2/measurements.json`,JSON.stringify(result,null,2))
console.log(JSON.stringify(result,null,2))

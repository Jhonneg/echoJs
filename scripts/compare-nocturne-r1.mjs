// Compare generated R1 against immutable R0 evidence; never inspect owner input.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {calibrateNocturneLevel} from '../src/scenes/nocturne/visualState.ts'
const root='docs/evidence/nocturne/nt13-refinement',load=async p=>JSON.parse(await readFile(`${root}/${p}`))
const manifest=await load('r0/source-manifest.json'),changed=[]
for(const x of manifest)if(createHash('sha256').update(await readFile(x.file)).digest('hex')!==x.sha256)changed.push(x.file)
assert.deepEqual(changed.sort(),['src/scenes/nocturne/NocturneScene.tsx','src/scenes/nocturne/visualState.ts'])
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length
const summary={changedSourceFiles:changed,unchangedSourceFiles:manifest.length-changed.length,runs:[],displayCrops:[]}
for(const quality of ['standard','low','standard-reduced']){
 const directory=`r1/nocturne/${quality}/baseline`,capture=await load(`${directory}/capture.json`),{rows,frames}=await load(`${directory}/trace.json`)
 assert.ok(capture.status&&!capture.failure);assert.deepEqual(capture.errors,[])
 assert.equal(capture.pcmHash,(await load('r0/nocturne/standard/baseline/capture.json')).pcmHash)
 const result={quality,samples:rows.length,frames:frames.length,renderer:rows[0].renderer,meanFrameSeconds:mean(rows.map(r=>r.cost.dt)),drawCalls:[...new Set(rows.map(r=>r.cost.calls))],geometries:[...new Set(rows.map(r=>r.cost.geometries))],textures:[...new Set(rows.map(r=>r.cost.textures))],stages:[]}
 for(const r of rows){
  assert.deepEqual(r.camera,[0,1.6,5]);assert.equal(r.renderer.exposure,1);assert.equal(r.renderer.toneMapping,4)
  for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10)
  for(const x of r.emitters)assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)
  assert.ok(Math.abs(r.channels.bridge.level-mean(r.bridgeSections))<1e-10)
  if(quality.endsWith('reduced'))assert.ok(Object.values(r.channels).every(c=>c.accent===0))
 }
 for(const [name,a,b]of [['quiet',.7,2.5],['bass',5,8.8],['dense',16,22.8],['silent',52,54.7]]){
  const selected=rows.filter(r=>r.audioTime>=a&&r.audioTime<=b)
  const stage={name,channels:Object.fromEntries(Object.keys(rows[0].channels).map(k=>[k,mean(selected.map(r=>r.channels[k].level))]))}
  if(name==='bass'){
   assert.ok(selected.every(r=>r.channels.cyanPanel.sustainTarget<.0001&&r.channels.cyanPanel.accent===0),'No bass-driven cyan target/accent beyond measured FFT leakage')
   assert.ok(selected.every(r=>r.channels.cyanPanel.level<(quality.endsWith('reduced')?.01:.001)),'Only tiny leakage or reduced-motion decay from preceding high mids')
   stage.panelPeak=Math.max(...selected.map(r=>r.channels.cyanPanel.level))
  }
  if(name==='silent')assert.ok(selected.every(r=>Object.values(r.channels).every(c=>c.level===0)))
  result.stages.push(stage)
 }
 const snapshots=capture.snapshots
 for(const name of ['manual-all-on','manual-all-off','audio-after-manual','paused-after-audio'])assert.ok(snapshots.some(x=>x.name===name))
 summary.runs.push(result)
}
// Replay every copied R0 scalar frame through the final display curve. This isolates
// mapping from the browser runs' different frame/FFT scheduling.
const baseline=(await load('r0/nocturne/standard/baseline/trace.json')).rows
summary.sameTraceCalibration={}
for(const [name,a,b]of [['quiet',.7,2.5],['dense',16,22.8]]){
 const rows=baseline.filter(r=>r.audioTime>=a&&r.audioTime<=b)
 summary.sameTraceCalibration[name]=Object.fromEntries(Object.keys(rows[0].channels).map(k=>[k,{before:mean(rows.map(r=>r.channels[k].level)),after:mean(rows.map(r=>k==='bridge'?mean(r.bridgeSections.map(calibrateNocturneLevel)):calibrateNocturneLevel(r.channels[k].level)))}]))
}
const crops={floor:'550x180+460+530',leftWall:'40x140+470+325',rightWall:'120x220+1050+220',bridge:'460x100+490+225',gate:'40x40+700+425'}
for(const phase of ['r0','r1'])for(const name of ['quiet','dense','silent','manual-all-off']){
 const image=`${root}/${phase}/nocturne/standard/baseline/${name}.${name.startsWith('manual')?'png':'jpg'}`,result={phase,name,crops:{}}
 for(const [label,crop]of Object.entries(crops)){
  const out=spawnSync('magick',[image,'-crop',crop,'+repage','-colorspace','sRGB','-format','%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]','info:'],{encoding:'utf8'});assert.equal(out.status,0,out.stderr)
  const rgb=out.stdout.trim().split(/\s+/).map(Number);result.crops[label]=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]
 }
 summary.displayCrops.push(result)
}
await writeFile(`${root}/r1/measurements.json`,JSON.stringify(summary,null,2))
console.log(JSON.stringify(summary,null,2))

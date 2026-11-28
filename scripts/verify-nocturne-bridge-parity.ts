// NT07 deliberately changes only bridge response and diffuser segmentation.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {createNocturneVisualState,updateNocturneVisualState} from '../src/scenes/nocturne/visualState.ts'
import {emptySixBands} from '../src/audio/signal.ts'
const baseline=process.env.ECHO_NT06_BASELINE
assert.ok(baseline,'Set ECHO_NT06_BASELINE to the isolated NT06 source snapshot containing src/')
const old=await import(pathToFileURL(resolve(baseline,'src/scenes/nocturne/visualState.ts')).href)
const report:Record<string,any>={baseline,frames:0,bridgeChanges:0,protectedFiles:[]},manual={magenta:.4,cyan:.2,cyanPanel:.6,violet:.3}
for(const hz of [30,60,120]){
 const before=old.createNocturneVisualState(),after=createNocturneVisualState()
 const view:any={session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,events:[],
  energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},context:{intensity:0}}
 const reader={read:()=>view}
 for(let i=0;i<20*hz;i++){
  const time=1+i/hz,phase=Math.floor(i/hz),mode=phase===8?'manual':'audio',gain=phase===9?0:phase===10?.3:1,reduced=phase===11
  if(i===15*hz){view.session++;view.sequence=0;view.events=[]}
  view.frame++;view.updatedAtSeconds=time;view.status=phase===12?'inactive':phase===13?'priming':'active'
  view.energy.low=.2;view.energy.mid=phase%2?.3:0;view.energy.high=phase%3?.1:0;view.energy.six.bass=.2;view.energy.six.lowMids=phase%2?.2:0;view.energy.six.subBass=phase%2?.1:0
  view.energy.six.highMids=phase%3===1?(i%hz<hz/4?.4:.1):0;view.context.intensity=.3
  if(i%(hz/2)===0){view.events.push({session:view.session,sequence:++view.sequence,band:['low','mid','high'][phase%3],strength:.2,timeSeconds:time,emittedAtSeconds:time});view.events=view.events.slice(-16)}
  const now=phase===14?time+.3:time
  old.updateNocturneVisualState(before,reader,mode,manual,gain,reduced,1/hz,now)
  updateNocturneVisualState(after,reader,mode,manual,gain,reduced,1/hz,now)
  for(const name of ['magentaMain','magentaSecondary','cyanWindows','cyanDetails','cyanPanel','violet']){
   assert.deepEqual(after.channels[name],before.channels[name],name)
   assert.equal(after.reflections[name],before.reflections[name],name)
  }
  assert.deepEqual(after.atmosphere,before.atmosphere)
  if(mode==='manual')assert.equal(after.channels.bridge.level,before.channels.bridge.level)
  if(after.channels.bridge.level!==before.channels.bridge.level)report.bridgeChanges++
  assert.ok(after.channels.magentaMain.level<=.92000001&&after.channels.magentaSecondary.level<=1)
  report.frames++
 }
}
assert.ok(report.bridgeChanges>0)
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
const allowed=new Set(['src/scenes/nocturne/bridge.ts','src/scenes/nocturne/visualState.ts','src/scenes/nocturne/LightingDriver.tsx','src/scenes/nocturne/ArchitectureDetails.tsx'])
for(const file of await files('src')){
 if(allowed.has(file))continue
 const current=await readFile(file),previous=await readFile(join(baseline,file));assert.ok(current.equals(previous),file)
 report.protectedFiles.push({file,sha256:createHash('sha256').update(current).digest('hex')})
}
report.checks=['All non-bridge channels/reflections and atmosphere exact NT06 parity at30/60/120Hz','Manual bridge level preserved','Only bridge controller/state/binding/segmentation differ; shared audio and other scenes byte-identical']
await mkdir('docs/evidence/nocturne/nt07',{recursive:true});await writeFile('docs/evidence/nocturne/nt07/state-parity.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.frames} frames, ${report.protectedFiles.length} protected files; only bridge response differs`)

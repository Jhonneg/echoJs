// NT10 deliberately changes only atmospheric response/delivery.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {createNocturneVisualState,updateNocturneVisualState} from '../src/scenes/nocturne/visualState.ts'
import {emptySixBands} from '../src/audio/signal.ts'
const baseline=process.env.ECHO_NT09_BASELINE
assert.ok(baseline,'Set ECHO_NT09_BASELINE to the isolated NT09 source snapshot containing src/')
const old=await import(pathToFileURL(resolve(baseline,'src/scenes/nocturne/visualState.ts')))
const report={baseline,frames:0,atmosphereChanges:0,protectedFiles:[]},manual={magenta:.4,cyan:.2,cyanPanel:.6,violet:.3}
for(const hz of [30,60,120]){
 const before=old.createNocturneVisualState(),after=createNocturneVisualState()
 const view={session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,events:[],
  energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},context:{intensity:0}}
 const reader={read:()=>view}
 for(let i=0;i<20*hz;i++){
  const time=1+i/hz,phase=Math.floor(i/hz),mode=phase===8?'manual':'audio',gain=phase===9?0:phase===10?.3:1,reduced=phase===11
  if(i===15*hz){view.session++;view.sequence=0;view.events=[]}
  view.frame++;view.updatedAtSeconds=time;view.status=phase===12?'inactive':phase===13?'priming':'active'
  view.energy.low=.2;view.energy.mid=phase%2?.3:0;view.energy.high=phase%3?.1:0;view.energy.six.bass=.2;view.energy.six.lowMids=phase%2?.2:0;view.energy.six.subBass=phase%2?.1:0
  view.energy.six.highMids=phase%3===1?(i%hz<hz/4?.4:.1):0;view.energy.six.presence=phase%2?.2:0;view.energy.six.air=phase%3?.1:0;view.context.intensity=.3;view.context.activity=phase%2?.5:0;view.context.brightness=phase%2?.9:.1;view.context.brightnessValid=phase!==7
  if(i%(hz/2)===0){view.events.push({session:view.session,sequence:++view.sequence,band:['low','mid','high'][phase%3],strength:.2,timeSeconds:time,emittedAtSeconds:time});view.events=view.events.slice(-16)}
  const now=phase===14?time+.3:time
  old.updateNocturneVisualState(before,reader,mode,manual,gain,reduced,1/hz,now)
  updateNocturneVisualState(after,reader,mode,manual,gain,reduced,1/hz,now)
  for(const name of ['magentaMain','magentaSecondary','cyanWindows','cyanDetails','cyanPanel','violet','violetSecondary','bridge']){
   assert.deepEqual(after.channels[name],before.channels[name],name)
   assert.equal(after.reflections[name],before.reflections[name],name)
  }
  assert.deepEqual(after.bridge,before.bridge)
  if(mode==='manual'){
    for(const name of ['level','magenta','cyan','violet'])assert.equal(after.atmosphere[name],before.atmosphere[name])
    assert.equal(after.atmosphere.fogNear,17);assert.equal(after.atmosphere.fogFar,74)
  }
  if(after.atmosphere.level!==before.atmosphere.level)report.atmosphereChanges++
  assert.ok(after.channels.magentaMain.level<=.92000001&&after.channels.magentaSecondary.level<=1)
  report.frames++
 }
}
assert.ok(report.atmosphereChanges>0)
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
const allowed=new Set(['src/scenes/nocturne/atmosphereResponse.ts','src/scenes/nocturne/visualState.ts','src/scenes/nocturne/LightingDriver.tsx'])
for(const file of await files('src')){
 if(allowed.has(file))continue
 const current=await readFile(file),previous=await readFile(join(baseline,file));assert.ok(current.equals(previous),file)
 report.protectedFiles.push({file,sha256:createHash('sha256').update(current).digest('hex')})
}
report.checks=['All fixture channels/reflections and complete bridge state exact NT09 parity at30/60/120Hz','Manual atmospheric colors and fog17/74 preserved','Only atmospheric controller/state/delivery differ; shared audio and all other scene source unchanged']
await mkdir('docs/evidence/nocturne/nt10',{recursive:true});await writeFile('docs/evidence/nocturne/nt10/state-parity.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.frames} frames, ${report.protectedFiles.length} protected files; only atmosphere differs`)

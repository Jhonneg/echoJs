// NT13 approved local spill gains; exact protection of existing visual interpretation.
import assert from 'node:assert/strict'
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {emptySixBands} from '../src/audio/signal.ts'
import {createNocturneVisualState,updateNocturneVisualState,applyNocturneVisualState,NOCTURNE_VISUAL_CHANNELS} from '../src/scenes/nocturne/visualState.ts'
import {runNocturneResponseMatrix} from './nocturne-response-matrix.mjs'
const baseline=process.env.ECHO_NT13_SPILL_BASELINE
assert.ok(baseline,'Set ECHO_NT13_SPILL_BASELINE to the pre-lift source snapshot')
const old=await import(pathToFileURL(resolve(baseline,'src/scenes/nocturne/visualState.ts')))
const report={baseline,frames:0,cappedFrames:0,protectedFiles:[],contract:runNocturneResponseMatrix().summary}
const manual={magenta:.4,cyan:.6,cyanPanel:.8,violet:.2}
for(const hz of [30,60,120]){
 const before=old.createNocturneVisualState(),after=createNocturneVisualState()
 const view={session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,events:[],energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},context:{intensity:.3,activity:.5,brightness:.7,brightnessValid:true}}
 const reader={read:()=>view}
 const emitters=NOCTURNE_VISUAL_CHANNELS.filter(n=>n!=='bridge').map(channel=>({channel,material:{emissiveIntensity:0}})),lights=[['magentaMain',50],['bridge',40],['cyanWindows',65],['cyanDetails',40],['cyanPanel',30],['violet',12],['violetSecondary',12]].map(([channel,full])=>({channel,full,light:{intensity:0}}))
 for(let i=0;i<20*hz;i++){
  const time=1+i/hz,phase=Math.floor(i/hz),mode=phase===8?'manual':'audio',gain=phase===9?0:phase===10?.3:1,reduced=phase===11
  if(i===15*hz){view.session++;view.sequence=0;view.events=[]}
  view.frame++;view.updatedAtSeconds=time;view.status=phase===12?'inactive':phase===13?'priming':'active'
  Object.assign(view.energy.six,{bass:phase<7?1:.2,subBass:.2,lowMids:phase%2?.3:0,highMids:phase%3?.2:0,presence:.1,air:.1})
  view.energy.low=.3;view.energy.mid=.2;view.energy.high=.1
  if(i%(hz/2)===0){view.events.push({session:view.session,sequence:++view.sequence,band:['low','mid','high'][phase%3],strength:.3,timeSeconds:time,emittedAtSeconds:time});view.events=view.events.slice(-16)}
  const now=phase===14?time+.3:time
  old.updateNocturneVisualState(before,reader,mode,manual,gain,reduced,1/hz,now);updateNocturneVisualState(after,reader,mode,manual,gain,reduced,1/hz,now)
  for(const key of ['channels','reflections','atmosphere','panel','magenta','midrange','violet','bridge','context','broad'])assert.deepEqual(after[key],before[key],key)
  applyNocturneVisualState({emitters,lights},after)
  for(const x of emitters)assert.equal(x.material.emissiveIntensity,before.channels[x.channel].level*1.3)
  for(const x of lights){const mult=mode==='manual'?1:({magentaMain:1.5,cyanWindows:2,cyanDetails:2}[x.channel]??1),expected=Math.min(1,before.channels[x.channel].level*mult);assert.equal(after.spill[x.channel],expected);assert.equal(x.light.intensity,expected*x.full);assert.ok(x.light.intensity<=x.full)}
  if(after.spill.magentaMain===1&&before.channels.magentaMain.level<1&&mode==='audio')report.cappedFrames++
  report.frames++
 }
}
assert.ok(report.cappedFrames>0)
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
for(const file of await files('src'))if(file!=='src/scenes/nocturne/visualState.ts'){const bytes=await readFile(file);assert.ok(bytes.equals(await readFile(join(baseline,file))),file);report.protectedFiles.push({file,sha256:createHash('sha256').update(bytes).digest('hex')})}
await mkdir('docs/evidence/nocturne/nt13/spill-applied',{recursive:true});await writeFile('docs/evidence/nocturne/nt13/spill-applied/preservation.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.frames} matched frames, ${report.contract.cases} contract cases, ${report.protectedFiles.length} protected sources; only approved spill delivery changes`)

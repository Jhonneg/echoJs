// Compare NT03 against an explicit, isolated NT02 source snapshot. No media capture.
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { createNocturneVisualState, updateNocturneVisualState, NOCTURNE_VISUAL_CHANNELS } from '../src/scenes/nocturne/visualState.ts'
import { emptySixBands } from '../src/audio/signal.ts'
const baseline=process.env.ECHO_NT02_BASELINE
assert.ok(baseline,'Set ECHO_NT02_BASELINE to the isolated NT02 task-start tree (containing src/)')
const oldBroad=await import(pathToFileURL(resolve(baseline,'src/scenes/nocturne/reactivity.ts')))
const oldPanel=await import(pathToFileURL(resolve(baseline,'src/scenes/nocturne/cyanPanel.ts')))
const manual={magenta:.2,cyan:.4,cyanPanel:.6,violet:.8}, evidence={baseline,frames:0,maxDifference:0,checks:[],protectedFiles:[]}
for(const hz of [30,60,120]){
 const current=createNocturneVisualState(), broad=oldBroad.createNocturneResponse(),panel=oldPanel.createCyanPanelResponse()
 const view={session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,
   energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},events:[],context:{intensity:0}}
 const reader={read:()=>view}
 for(let i=0;i<30*hz;i++){
  const time=1+i/hz,phase=Math.floor(i/hz)%15, mode=phase===8?'manual':'audio',gain=phase===9?0:phase===10?.3:1,reduced=phase===11
  if(i===15*hz){view.session++;view.sequence=0;view.events=[]}
  view.frame++;view.updatedAtSeconds=time;view.status=phase===12?'inactive':phase===13?'priming':'active'
  view.energy.low=phase%3===0?.2:0;view.energy.mid=phase%3===1?.3:0;view.energy.high=phase%3===2?.15:0
  view.energy.six.highMids=phase===4||phase===6?(i%hz<hz/4?.4:.1):0
  view.context.intensity=phase===7?.7:0
  if(i%(hz/2)===0){view.events.push({session:view.session,sequence:++view.sequence,band:['low','mid','high'][phase%3],strength:.7,timeSeconds:time,emittedAtSeconds:time});view.events=view.events.slice(-16)}
  const now=phase===14?time+.3:time
  oldBroad.updateNocturneResponse(broad,reader,mode,manual,gain,reduced,1/hz,now)
  oldPanel.updateCyanPanelResponse(panel,reader,1/hz,now,mode==='manual'?0:gain,reduced)
  updateNocturneVisualState(current,reader,mode,manual,gain,reduced,1/hz,now)
  const expected={magentaMain:broad.magenta,magentaSecondary:broad.magenta,bridge:broad.magenta,
    cyanWindows:broad.cyan,cyanDetails:broad.cyan,violet:broad.violet,cyanPanel:mode==='manual'?manual.cyanPanel:panel.level}
  for(const channel of NOCTURNE_VISUAL_CHANNELS){
   const difference=Math.abs(current.channels[channel].level-expected[channel]);evidence.maxDifference=Math.max(evidence.maxDifference,difference)
   assert.equal(current.channels[channel].level,expected[channel],`${hz}Hz frame ${i} ${channel}`)
   assert.equal(current.reflections[channel],expected[channel])
  }
  for(const [group,weight] of [['magenta',.24],['cyan',.85],['violet',.16]])
   assert.equal(current.atmosphere[group],(mode==='manual'?broad[group]:broad.atmosphere)*weight)
  assert.equal(current.panel.accent,panel.accent)
  assert.equal(current.panel.sustained,panel.sustained)
  assert.ok(current.panel.count<=64)
  evidence.frames++
 }
}
async function files(path){const entries=await readdir(path,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(join(path,e.name)):[join(path,e.name)]))).flat()}
const protectedPaths=[...await files('src/audio'),...await files('src/scenes/bloom'),...await files('src/scenes/lavender-peaks'),...await files('src/scenes/crimson-horizon'),
 ...['ArchitectureDetails.tsx','Atmosphere.tsx','WetGround.tsx','WallSurface.tsx','NocturneScene.tsx','lighting.ts'].map(f=>'src/scenes/nocturne/'+f),'src/App.tsx','src/engine/LandscapeCanvas.tsx']
for(const file of protectedPaths){const a=await readFile(file),b=await readFile(join(baseline,file));assert.ok(a.equals(b),`Protected source changed: ${file}`);evidence.protectedFiles.push({file,sha256:createHash('sha256').update(a).digest('hex')})}
evidence.checks=['Exact NT02 final-level, reflection source and atmosphere-weight parity at30/60/120Hz',
 'Sustain, mixed events, silence, reduced motion, Manual, zero/partial gain, stale, priming, inactivity and session reset',
 'Panel sustain/accents identical; bounded64-sample history','Audio engine, other scenes, geometry, App and canvas unchanged']
await mkdir('docs/evidence/nocturne/nt03',{recursive:true})
await writeFile('docs/evidence/nocturne/nt03/state-parity.json',JSON.stringify(evidence,null,2))
console.log(`PASS: ${evidence.frames} frames, maximum difference ${evidence.maxDifference}, ${protectedPaths.length} protected files`)

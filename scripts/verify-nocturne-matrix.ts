// NT12 two deterministic layers: explicit MusicFeatures contract and unchanged MI processor.
import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {runNocturneResponseMatrix} from './nocturne-response-matrix.ts'
import {createMusicAnalysis} from '../src/audio/music/analysis.ts'
import {BLACKMAN_MEAN_SQUARE} from '../src/audio/music/energy.ts'
import {createNocturneVisualState,updateNocturneVisualState,NOCTURNE_VISUAL_CHANNELS,applyNocturneVisualState} from '../src/scenes/nocturne/visualState.ts'
const baseline=process.env.ECHO_NT11_BASELINE
assert.ok(baseline,'Set ECHO_NT11_BASELINE to the task-start source snapshot')
const out='docs/evidence/nocturne/nt12';await mkdir(out,{recursive:true})
const contract=runNocturneResponseMatrix({trace:true})
await writeFile(out+'/contract-trace.json',JSON.stringify(contract.trace))
const report:Record<string,any>={baseline:resolve(baseline),contract:{summary:contract.summary,cases:contract.cases},spectralCases:[],protectedFiles:[],limitations:['Contract features and synthetic spectrum are deterministic tests, not recorded audio or a replacement browser FFT. Browser generated-PCM evidence is separate. Native capture, real-music feel and hardware performance remain manual.']}
const trace:any[]=[]
for(const rate of [44100,48000,96000])for(const hz of [30,60,120])for(const [frequency,feature,allowed]of [[100,'bass',['magentaMain','magentaSecondary','bridge']],[450,'lowMids',['cyanWindows','cyanDetails']],[1000,'highMids',['cyanWindows','cyanPanel']],[8000,'air',['violet','violetSecondary']]] as const){
 const fft=rate>48000?4096:2048,bins=new Float32Array(fft/2),mi=createMusicAnalysis(),state=createNocturneVisualState(),events=new Map(),rows:any[]=[]
 const emitters:any[]=NOCTURNE_VISUAL_CHANNELS.filter(n=>n!=='bridge').map(channel=>({channel,material:{emissiveIntensity:0}}))
 for(let segment=0;segment<6;segment++)emitters.push({channel:'bridge',segment,material:{emissiveIntensity:0}})
 const lights:any[]=[['magentaMain',50],['bridge',40],['cyanWindows',65],['cyanDetails',40],['cyanPanel',30],['violet',12],['violetSecondary',12]].map(([channel,full])=>({channel,full,light:{intensity:0}}))
 for(let i=0;i<10*hz;i++){
  const t=i/hz,now=1+t
  const energy=t>=1&&t<3?.1:t>=3&&t<5?.3:t>=6&&t<6.15||t>=6.7&&t<6.85?.3:t>=7.5&&t<8.5?.05+.25*(t-7.5):0
  bins.fill(-Infinity)
  if(energy>0)bins[Math.round(frequency*fft/rate)]=20*Math.log10(energy*.5*Math.sqrt(BLACKMAN_MEAN_SQUARE/2))
  mi.update(bins,rate,fft,now*1000,true)
  updateNocturneVisualState(state,mi.reader,'audio',{magenta:0,cyan:0,cyanPanel:0,violet:0},1,false,1/hz,now)
  applyNocturneVisualState({emitters,lights},state)
  const view=mi.reader.read()
  for(const n of NOCTURNE_VISUAL_CHANNELS)if(!(allowed as readonly string[]).includes(n))assert.equal(state.channels[n].level,0,`${rate}/${hz}/${frequency}: ${n}`)
  for(const x of emitters)assert.equal(x.material.emissiveIntensity,(x.segment===undefined?state.channels[x.channel].level:state.bridge.levels[x.segment])*1.3)
  for(const x of lights)assert.equal(x.light.intensity,state.channels[x.channel].level*x.full)
  for(const e of view.events)events.set(e.sequence,e)
  if(i%Math.max(1,Math.round(hz/10))===0){
   const row={rate,hz,frequency,time:t,inputEnergy:energy,features:JSON.parse(JSON.stringify(view)),channels:JSON.parse(JSON.stringify(state.channels)),materials:emitters.map(x=>({channel:x.channel,segment:x.segment,value:x.material.emissiveIntensity})),lights:lights.map(x=>({channel:x.channel,value:x.light.intensity}))}
   rows.push(row);trace.push(row)
  }
 }
 const quiet=rows.filter(x=>x.time>=1.8&&x.time<2.9),loud=rows.filter(x=>x.time>=4&&x.time<4.9)
 const q=quiet.reduce((n,x)=>n+x.features.energy.six[feature],0)/quiet.length,l=loud.reduce((n,x)=>n+x.features.energy.six[feature],0)/loud.length
 assert.ok(Math.abs(q-.1)<1e-7&&Math.abs(l-.3)<1e-7,'fixed calibrated feature energy')
 assert.ok([...events.values()].some(e=>e.emittedAtSeconds>=7&&e.emittedAtSeconds<8),'isolated event reaches shared MI')
 assert.ok(![...events.values()].some(e=>e.timeSeconds>2.5&&e.timeSeconds<3.8),'no repeated onset during held quiet energy')
 report.spectralCases.push({rate,hz,fft,frequency,actualBinHz:Math.round(frequency*fft/rate)*rate/fft,expectedFeature:feature,quietEnergy:q,loudEnergy:l,events:[...events.values()],allowedGroups:allowed,status:'passed'})
}
await writeFile(out+'/spectral-trace.json',JSON.stringify(trace))
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
for(const file of await files('src')){const bytes=await readFile(file);assert.ok(bytes.equals(await readFile(join(baseline,file))),file);report.protectedFiles.push({file,sha256:createHash('sha256').update(bytes).digest('hex')})}
await writeFile(out+'/deterministic-results.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.contract.summary.cases} contract cases, ${report.spectralCases.length} spectral cases, ${report.protectedFiles.length} protected source files`)

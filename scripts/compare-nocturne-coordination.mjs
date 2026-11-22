// NT11 staged coordination assessment: observed outputs, not a genre/section detector.
import {readFile,writeFile,readdir} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const baseline=process.env.ECHO_NT10_BASELINE
assert.ok(baseline,'Set ECHO_NT10_BASELINE to the task-start NT10 snapshot containing src/')
const dir='docs/evidence/nocturne/nt11',load=async label=>JSON.parse(await readFile(`${dir}/${label}/trace.json`))
const current=await load('current'),reduced=await load('reduced')
const names=['magentaMain','magentaSecondary','cyanWindows','cyanDetails','cyanPanel','violet','violetSecondary','bridge']
const caps={magentaMain:.92,magentaSecondary:.24,cyanWindows:.18,cyanDetails:.4,cyanPanel:1,violet:.48,violetSecondary:.48,bridge:.48}
const stages=[['intro',.7,2.5],['bass',5,8.8],['mid-addition',11,14.8],['dense',16,22.8],['breakdown',26,28.8],['return',30,36.8],['silence',52,54.8]]
const report={baseline:resolve(baseline),method:'Per-render scalar probes after final delivery in an isolated app; source/DSP unchanged. Stage labels come from generated arrangement schedule, not detection. Peak/mean fixture levels are not equivalent to whole-scene luminance.',stages:[],runs:[],protectedFiles:[],decision:'Retain current mappings: generated arrangement preserves musical roles and bounded localized overlaps; no new shared gain/limiter or rolling-energy layer is justified. Owner artistic approval remains pending.'}
for(const [label,data]of [['current',current],['reduced',reduced]]){
 const all=data.renderTrace
 assert.ok(all.length<6000&&all.length>data.frames.length)
 for(const r of all){
  for(const name of names){const x=r.channels[name];assert.ok(Number.isFinite(x.level)&&x.level>=0&&x.level<=caps[name]+1e-10)}
  r.emitters.forEach(x=>assert.equal(x.intensity,(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment])*1.3))
  r.points.forEach(x=>assert.equal(x.intensity,r.channels[x.channel].level*x.full))
  assert.ok([r.channels.violet.accent,r.channels.violetSecondary.accent].filter(x=>x>0).length<=1)
  assert.ok(r.bridgeSections.filter(x=>x>0).length<=3)
  if(label==='reduced')assert.ok(names.every(n=>r.channels[n].accent===0)&&r.bridgeSections.every(x=>x===0))
 }
 for(const [name,a,b]of stages){
  const rows=all.filter(x=>x.audioTime>=a&&x.audioTime<b);assert.ok(rows.length>5)
  const mean=f=>rows.reduce((n,x)=>n+f(x),0)/rows.length,max=f=>Math.max(...rows.map(f))
  const channels=Object.fromEntries(names.map(n=>[n,{mean:mean(x=>x.channels[n].level),peak:max(x=>x.channels[n].level),accentPeak:max(x=>x.channels[n].accent)}]))
  report.stages.push({label,name,samples:rows.length,channels,atmosphereMean:mean(x=>x.atmosphere.level),maximumVioletAccentBanks:max(x=>[x.channels.violet.accent,x.channels.violetSecondary.accent].filter(v=>v>0).length),maximumLitBridgeSections:max(x=>x.bridgeSections.filter(v=>v>0).length)})
 }
 assert.deepEqual(data.errors,[])
 report.runs.push({label,renderSamples:all.length,pollSamples:data.trace.length,frames:data.frames.length,resources:[...new Set(all.map(x=>JSON.stringify({geometries:x.resources.geometries,textures:x.resources.textures})))],lastAtmosphere:all.at(-1).atmosphere})
}
const stage=name=>report.stages.find(x=>x.label==='current'&&x.name===name)
assert.ok(stage('intro').channels.cyanPanel.mean>.01&&stage('intro').channels.magentaMain.mean<.001)
assert.ok(stage('bass').channels.magentaMain.mean>.05&&stage('bass').channels.cyanPanel.mean<.001)
assert.ok(stage('mid-addition').channels.cyanWindows.mean>stage('intro').channels.cyanWindows.mean*2&&stage('mid-addition').channels.cyanDetails.mean>.02&&stage('mid-addition').channels.cyanPanel.mean>.04)
assert.ok(stage('dense').channels.magentaMain.accentPeak>0&&stage('dense').channels.cyanPanel.accentPeak>0&&stage('dense').channels.violet.accentPeak>0)
assert.ok(stage('breakdown').channels.magentaMain.mean<.005&&stage('breakdown').channels.cyanPanel.mean>.02)
assert.ok(stage('return').channels.magentaMain.mean>.08&&stage('return').channels.cyanPanel.mean>.05)
for(const x of report.stages.filter(x=>x.name==='silence')){assert.ok(names.every(n=>x.channels[n].peak===0));assert.ok(x.atmosphereMean<.03)}
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
for(const file of await files('src')){
 const bytes=await readFile(file);assert.ok(bytes.equals(await readFile(join(baseline,file))),file)
 report.protectedFiles.push({file,sha256:createHash('sha256').update(bytes).digest('hex')})
}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2))
const csv=['run,stage,group,mean,peak,accentPeak',...report.stages.flatMap(s=>names.map(n=>[s.label,s.name,n,s.channels[n].mean,s.channels[n].peak,s.channels[n].accentPeak].join(',')))].join('\n')
await writeFile(dir+'/stage-levels.csv',csv+'\n')
console.log(`PASS: seven-stage roles/delivery/local overlap, reduced suppression, silent fixture settling; all ${report.protectedFiles.length} source files preserved`)

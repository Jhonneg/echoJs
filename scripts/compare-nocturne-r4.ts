// R4 generated matrix and real-UI lifecycle assessment; source stays identical to R3.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {calibrateNocturneLevel} from '../src/scenes/nocturne/visualState.ts'
const base='docs/evidence/nocturne/nt13-refinement',load=async p=>JSON.parse(await readFile(`${base}/${p}`,'utf8'))
const manifest=await load('r3/source-manifest.json')
for(const x of manifest)assert.equal(createHash('sha256').update(await readFile(x.file)).digest('hex'),x.sha256,x.file)
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length
const windows=[['silence',.7,1.5],['bass',3,4.5],['low-mid',6,7.5],['quiet-high-mid',9,10.5],['loud-high-mid',12,13.5],['treble',15,16.5],['low-attacks',19.2,21.5],['high-mid-attacks',22.2,24.5],['high-attacks',25.2,27.5],['bass-near-high-mid',29,32.5],['low-mid-near-high-mid',34,37.5],['dense',45,48.5],['late-silence',62,64.7]] as const
const output:Record<string,any>={productionUnchanged:manifest.length,ownerWindowReview:await load('r4/owner-review.json'),runs:[],automationLimitations:['Forced CDP freeze did not restart requestAnimationFrame; this is not claimed as a passing simulated lifecycle test. Real background-tab return passed and owner reports native minimize/restore and Escape work.'],manualPending:['Owner perception of high-mid accent/hierarchy and final real-song parity remain separate from numeric checks.']}
for(const quality of ['standard','low','standard-reduced']){
 const dir=`r4/nocturne/${quality}/baseline`,capture=await load(`${dir}/capture.json`),controls=await load(`r4/nocturne/${quality}/controls/capture.json`),trace=await load(`${dir}/trace.json`),rows=trace.rows,reduced=quality.endsWith('reduced')
 assert.ok(controls.status&&!controls.failure);assert.deepEqual(capture.errors,[]);assert.deepEqual(controls.errors,[])
 const result:Record<string,any>={quality,samples:rows.length,frames:trace.frames.length,pcmHash:capture.pcmHash,build:capture.build,initialHarnessFailure:capture.failure??null,cases:[],integration:[],maxFixtureLevel:0}
 for(const r of rows){
  assert.deepEqual(r.camera,[0,1.6,5]);assert.equal(r.renderer.exposure,1)
  for(const c of Object.values<any>(r.channels)){assert.ok(Number.isFinite(c.level)&&c.level>=0&&c.level<=1);result.maxFixtureLevel=Math.max(result.maxFixtureLevel,c.level)}
  for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10)
  assert.ok(Math.abs(r.environment.depthIntensity-18*r.environment.depthLight)<1e-10)
  for(const x of r.emitters){if(x.instances){const source=x.instances.channel==='bridge'?r.bridgeSections:r.instanceLevels[x.instances.channel];x.instances.levels.forEach((v,i)=>assert.ok(Math.abs(v-(x.instances.indices[i]===255?0:source[x.instances.indices[i]]*x.instances.scale))<1e-7))}else assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)}
  if(reduced){assert.ok(Object.values<any>(r.channels).every(c=>c.accent===0));assert.ok(r.bridgeSections.every(v=>v===0))}
 }
 for(const [name,start,end]of windows){
  const selected=rows.filter(r=>r.audioTime>=start&&r.audioTime<=end),data:Record<string,any>={name,highMidEnergyMean:mean(selected.map(r=>r.features.energy.six.highMids)),panelMean:mean(selected.map(r=>r.channels.cyanPanel.level)),panelPeak:Math.max(...selected.map(r=>r.channels.cyanPanel.level)),panelAccentPeak:Math.max(...selected.map(r=>r.channels.cyanPanel.accent)),magentaMean:mean(selected.map(r=>r.channels.magentaMain.level)),bridgePeak:Math.max(...selected.map(r=>Math.max(...r.bridgeSections))),cyanPointMean:mean(selected.map(r=>r.points.find(x=>x.channel==='cyanPanel').intensity))}
  data.panelDeliveredAccentPeak=Math.max(...selected.map(r=>{const c=r.channels.cyanPanel,raw=c.level/(2-c.level);return c.level-calibrateNocturneLevel(Math.max(0,raw-c.accent))}))
  if(['bass','low-mid'].includes(name)){assert.ok(data.panelPeak<.001);assert.equal(data.panelAccentPeak,0)}
  if(['bass','low-attacks'].includes(name))assert.equal(data.bridgePeak,0)
  if(name==='low-mid-near-high-mid'){assert.equal(data.panelAccentPeak,0);assert.ok(data.panelMean>.1)}
  if(name==='high-mid-attacks'&&!reduced){assert.ok(data.panelAccentPeak>.02);assert.ok(data.panelDeliveredAccentPeak>.02)}
  if(name==='high-attacks'&&!reduced)assert.ok(data.bridgePeak>.1)
  if(name==='late-silence'){assert.ok(selected.every(r=>Object.values<any>(r.channels).every(c=>c.level===0)));assert.ok(selected.every(r=>Object.values<any>(r.instanceLevels).every(a=>a.every(x=>x===0))))}
  result.cases.push(data)
 }
 const quiet=result.cases.find(c=>c.name==='quiet-high-mid'),loud=result.cases.find(c=>c.name==='loud-high-mid')
 assert.ok(loud.highMidEnergyMean>quiet.highMidEnergyMean*3);assert.ok(loud.panelMean>quiet.panelMean*2);assert.ok(result.maxFixtureLevel<.99,'Generated ordinary peaks retain headroom')
 const names=controls.integration.checks.map(c=>c.name)
 for(const name of ['positive-generated-input','zero-reactivity','manual-at-zero-reactivity','actual-seek-new-session','synthetic-stale-reader','synthetic-session-retained-event','scene-switch-return','quality-switch-same-canvas','dynamic-reduced-motion','portrait-controls-open','wide-controls-open','fullscreen-native-api','background-return','browser-lifecycle-freeze-return','abrupt-generated-file-disconnect'])assert.ok(names.includes(name),name)
 for(const check of controls.integration.checks){const r=check.state;assert.ok(r);result.integration.push({name:check.name,statusOfCheck:check.status??'passed',sampleAge:check.sampleAge,visibilityWhileBackgrounded:check.visibilityWhileBackgrounded,hiddenObserved:check.hiddenObserved,status:r.features.status,panel:r.channels.cyanPanel.level,depth:r.environment.depthIntensity,syntheticReader:check.syntheticReader??false})}
 output.runs.push(result)
}
await writeFile(`${base}/r4/assessment.json`,JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2))

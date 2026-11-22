// NT08 generated-only physical transforms, final brightness, static pixels and bounded cost.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt08',load=async path=>JSON.parse(await readFile(`${dir}/${path}.json`))
const before=await load('before/trace'),after=await load('after/trace'),reduced=await load('reduced/trace')
const matrices=rows=>rows.flatMap(b=>Array.from({length:b.count},(_,i)=>JSON.stringify(b.matrices.slice(i*16,(i+1)*16)))).sort()
const violet=data=>data.violetBatches.filter(x=>x.name!=='nocturne-cyanPanel')
assert.deepEqual(matrices(violet(before)),matrices(violet(after)))
assert.deepEqual(violet(before).map(x=>x.count),[12]);assert.deepEqual(violet(after).map(x=>x.count),[6,6])
assert.ok(violet(after).every(x=>x.color===violet(before)[0].color))
assert.deepEqual(before.violetBatches.find(x=>x.name==='nocturne-cyanPanel'),after.violetBatches.find(x=>x.name==='nocturne-cyanPanel'))
const report={geometry:'All12 violet instance transforms and palette exact;6 per side; approved cyan exact',manual:[],sections:[],wholeFrame:{},accepted:[]}
for(const [label,data]of [['before',before],['after',after],['reduced',reduced]]){
 for(const [name,a,b]of [['bass',1.5,2.8],['low-mid',3.5,4.8],['quiet-presence',6,6.8],['loud-presence',8,8.8],['isolated',9.2,10.9],['dense',11.2,13.8],['air',14.5,15.8],['mixed',16.2,17.8],['silence',19.2,19.8]]){
  const rows=data.trace.filter(x=>x.audioTime>=a&&x.audioTime<b),max=f=>Math.max(...rows.map(f)),mean=f=>rows.reduce((n,x)=>n+f(x),0)/rows.length
  report.sections.push({label,name,presencePeak:max(x=>x.review.feature.presence),airPeak:max(x=>x.review.feature.air),rightMean:mean(x=>x.review.violet.levels[0]),leftMean:mean(x=>x.review.violet.levels[1]),accentPeak:max(x=>Math.max(...x.review.violet.accents))})
 }
}
for(const row of after.trace){
 const v=row.review.violet
 assert.equal(v.emissives.length,2);v.emissives.forEach((x,i)=>assert.equal(x,v.levels[i]*1.3))
 assert.deepEqual(v.points.map(x=>x.channel).sort(),['violet','violetSecondary'])
 v.points.forEach(x=>assert.equal(x.intensity,v.levels[x.channel==='violet'?0:1]*12))
 assert.ok(v.accents.filter(x=>x>0).length<=1)
 assert.equal(row.review.panel.point,row.review.panel.level*30);assert.equal(row.review.panel.emissive,row.review.panel.level*1.3)
 const start=v.startedAt
 if(Number.isFinite(start)&&!report.accepted.some(x=>x.start===start))report.accepted.push({start,bank:v.bank,audioTimeObserved:row.audioTime})
}
assert.ok(report.accepted.every((x,i)=>i===0||(x.start-report.accepted[i-1].start>=.4-1e-8&&x.bank!==report.accepted[i-1].bank)))
assert.ok(reduced.trace.every(x=>x.review.violet.accents.every(v=>v===0)))
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const r=spawnSync('magick',['compare','-metric','AE',`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`,'null:'],{encoding:'utf8'})
 assert.ok(r.status===0||r.status===1,r.stderr);const count=Number.parseFloat(r.stderr)
 report.manual.push({name,rawAE:r.stderr.trim()});assert.equal(count,0,name)
}
for(const label of ['before','after']){
 const {samples}=await load(`${label}/whole-frame-cost`)
 report.wholeFrame[label]={samples:samples.length,calls:[...new Set(samples.map(x=>x.calls))],triangles:[...new Set(samples.map(x=>x.triangles))],geometries:[...new Set(samples.map(x=>x.geometries))],textures:[...new Set(samples.map(x=>x.textures))]}
}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2))
console.log('PASS: violet transforms/palette and cyan exact, independent material/spill delivery, localized cooldown accents, eight static pixel matches')
console.log(JSON.stringify(report.wholeFrame))

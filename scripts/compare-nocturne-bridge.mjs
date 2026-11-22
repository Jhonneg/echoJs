// Generated-only NT07 evidence: physical footprints, delivered brightness and bounded rendering cost.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt07',load=async path=>JSON.parse(await readFile(`${dir}/${path}.json`))
const before=await load('before/trace'),after=await load('after/trace'),reduced=await load('reduced/trace')
assert.deepEqual(before.bridgeBatches.find(x=>x.name==='nocturne-cyanPanel'),after.bridgeBatches.find(x=>x.name==='nocturne-cyanPanel'))
const original=before.bridgeBatches.find(x=>x.name==='nocturne-magentaBridge'),segments=after.bridgeBatches.filter(x=>x.name.startsWith('nocturne-bridge'))
assert.equal(original.count,2);assert.equal(segments.length,6)
segments.forEach((s,i)=>{
 assert.equal(s.count,1);assert.equal(s.color,original.color)
 const old=original.matrices.slice(Math.floor(i/3)*16,Math.floor(i/3)*16+16),expected=[...old]
 expected[0]=old[0]/3;expected[12]=old[12]-old[0]/2+(i%3+.5)*old[0]/3
 expected.forEach((x,j)=>assert.ok(Math.abs(x-s.matrices[j])<2e-7,`footprint ${i}/${j}`))
})
const report={geometry:'Six contiguous thirds exactly cover the two original diffuser footprints (Float32 tolerance2e-7); housings/approved cyan unchanged',manual:[],sections:[],resources:{},wholeFrame:{},direction:[]}
for(const [label,data] of [['before',before],['after',after],['reduced',reduced]]){
 report.resources[label]=[...new Set(data.trace.map(x=>JSON.stringify(x.review.resources)))]
 for(const [name,a,b] of [['isolated',1.2,3.8],['held-bass',5.5,6.8],['dense',7.1,11.5],['mid-only',12.2,12.8],['weak',13.2,14.1],['mixed',14.3,16.5],['silence',17.1,17.8]]){
  const rows=data.trace.filter(x=>x.audioTime>=a&&x.audioTime<b)
  report.sections.push({label,name,meanBridge:rows.reduce((n,x)=>n+x.review.bridge.level,0)/rows.length,peakBridge:Math.max(...rows.map(x=>x.review.bridge.level)),peakSection:label==='before'?null:Math.max(...rows.flatMap(x=>x.review.bridge.levels)),bassPeak:Math.max(...rows.map(x=>x.review.feature.bass))})
 }
}
for(const row of after.trace){
 const b=row.review.bridge;assert.equal(b.point,b.level*40);b.levels.forEach((x,i)=>assert.equal(b.emissives[i],x*1.3))
 assert.equal(row.review.panel.point,row.review.panel.level*30);assert.equal(row.review.panel.emissive,row.review.panel.level*1.3)
}
assert.ok(reduced.trace.every(x=>x.review.bridge.level===0))
for(let i=0;i<6;i++){
 const rows=after.trace.filter(x=>x.audioTime>1.2&&x.audioTime<2.4),row=rows.reduce((a,b)=>b.review.bridge.levels[i]>a.review.bridge.levels[i]?b:a)
 report.direction.push({section:i,audioTime:row.audioTime,level:row.review.bridge.levels[i]})
}
assert.ok(report.direction.every((x,i)=>i===0||x.audioTime>report.direction[i-1].audioTime))
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const r=spawnSync('magick',['compare','-metric','AE',`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`,'null:'],{encoding:'utf8'})
 assert.ok(r.status===0||r.status===1,r.stderr);const countResult=spawnSync('magick',[`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`,'-compose','difference','-composite','-alpha','off','-separate','-evaluate-sequence','Max','-threshold','0','-format','%[fx:mean*w*h]','info:'],{encoding:'utf8'})
 assert.equal(countResult.status,0,countResult.stderr)
 const maxResult=spawnSync('magick',[`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`,'-compose','difference','-composite','-alpha','off','-format','%[fx:maxima]','info:'],{encoding:'utf8'})
 assert.equal(maxResult.status,0,maxResult.stderr)
 const count=Number(countResult.stdout),maxError=Number(maxResult.stdout)
 report.manual.push({name,differingPixels:count,maxChannelError:maxError,rawAE:r.stderr.trim()})
 assert.ok(maxError<=.02,`${name}: bounded sub-five-step8-bit raster error from contiguous subdivision`)
 assert.ok(count<=10,`${name}: any raster difference must be sparse`)

}
const montage=spawnSync('magick',[...Array.from({length:6},(_,i)=>['(',`${dir}/after/head-${i}.jpg`,'-crop','460x100+490+225','+repage',')']).flat(),'-append',`${dir}/after/travel-strip.jpg`],{encoding:'utf8'})
assert.equal(montage.status,0,montage.stderr)
for(const label of ['before','after']){
 const {samples}=await load(`${label}/whole-frame-cost`)
 report.wholeFrame[label]={samples:samples.length,calls:[...new Set(samples.map(x=>x.calls))],triangles:[...new Set(samples.map(x=>x.triangles))],geometries:[...new Set(samples.map(x=>x.geometries))],textures:[...new Set(samples.map(x=>x.textures))]}
}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2))
console.log('PASS: ordered travel, exact delivered materials/spill, preserved footprints/cyan, eight static pixel pairs and paired whole-frame counters')
console.log(JSON.stringify(report.wholeFrame))

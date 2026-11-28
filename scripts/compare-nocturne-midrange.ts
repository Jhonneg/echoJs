// NT06: physical cyan transforms, actual fixture delivery and descriptive same-source measurements.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt06',before=JSON.parse(await readFile(dir+'/before/trace.json','utf8')),after=JSON.parse(await readFile(dir+'/after/trace.json','utf8'))
const matrices=rows=>rows.flatMap(b=>Array.from({length:b.count},(_,i)=>JSON.stringify(b.matrices.slice(i*16,(i+1)*16)))).sort()
assert.deepEqual(matrices(before.cyanBatches.filter(x=>x.name!=='nocturne-cyanPanel')),matrices(after.cyanBatches.filter(x=>x.name!=='nocturne-cyanPanel')))
assert.deepEqual(before.cyanBatches.find(x=>x.name==='nocturne-cyanPanel'),after.cyanBatches.find(x=>x.name==='nocturne-cyanPanel'))
const report:Record<string,any>={batches:{before:before.cyanBatches.map(x=>({name:x.name,count:x.count})),after:after.cyanBatches.map(x=>({name:x.name,count:x.count}))},before:[],after:[],resources:{},manual:[]}
for(const [label,data] of [['before',before],['after',after]] as const){
 report.resources[label]=[...new Set(data.trace.map(x=>JSON.stringify(x.review.resources)))]
 for(const [name,a,b] of [['lowmid',4.5,5.8],['highmid',6.7,7.8],['attacks',8.2,10.8],['stationary-highmid',12,13.8],['mixed',14.5,15.8],['silence',19,19.8]] as const){
  const rows=data.trace.filter(x=>x.audioTime>=a&&x.audioTime<b),mean=f=>rows.reduce((n,x)=>n+f(x),0)/rows.length,max=f=>Math.max(...rows.map(f))
  report[label].push({name,windowsMean:mean(x=>x.review.cyanWindows.level),detailsMean:mean(x=>x.review.cyanDetails.level),detailAccentPeak:max(x=>x.review.cyanDetails.accent),panelMean:mean(x=>x.review.panel.level),panelAccentPeak:max(x=>x.review.panel.accent),lowMidPeak:max(x=>x.review.feature.lowMids),highMidPeak:max(x=>x.review.feature.highMids)})
 }
}
for(const row of after.trace){
 assert.equal(row.review.cyanWindows.emissive,row.review.cyanWindows.level*1.3)
 assert.equal(row.review.cyanDetails.emissive,row.review.cyanDetails.level*1.3)
 assert.equal(row.review.cyanWindows.point,row.review.cyanWindows.level*65)
 assert.equal(row.review.cyanDetails.point,row.review.cyanDetails.level*40)
 assert.equal(row.review.panel.emissive,row.review.panel.level*1.3)
 assert.equal(row.review.panel.point,row.review.panel.level*30)
}
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const r=spawnSync('magick',['compare','-metric','AE',`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`,'null:'],{encoding:'utf8'})
 assert.ok(r.status===0||r.status===1,r.stderr)
 const count=Number.parseFloat(r.stderr);report.manual.push({name,differingPixels:count});assert.equal(count,0,name)
}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2))
console.log('PASS: cyan transforms/protected panel unchanged, exact delivered values, eight pixel-identical static pairs')

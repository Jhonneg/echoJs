// NT05: exact transforms/delivery, static Manual parity, and descriptive generated-audio statistics.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt05'
const before=JSON.parse(await readFile(dir+'/before/trace.json')),after=JSON.parse(await readFile(dir+'/after/trace.json'))
const matrices=rows=>rows.flatMap(b=>Array.from({length:b.count},(_,i)=>JSON.stringify(b.matrices.slice(i*16,(i+1)*16)))).sort()
assert.deepEqual(matrices(before.trace[0].review.batches),matrices(after.trace[0].review.batches))
assert.deepEqual(after.trace[0].review.batches.map(b=>b.count),[1,5,2])
const report={geometryTransforms:'All eight magenta instance transforms identical; batches8→1/5/2',before:[],after:[],resources:{},manual:[]}
for(const [label,data] of [['before',before],['after',after]]){
 report.resources[label]=[...new Set(data.trace.map(x=>JSON.stringify(x.review.resources)))]
 for(const [name,a,b] of [['quiet',1.5,2.8],['loud',3.5,4.8],['attacks',6.2,9.5],['sub',10.5,11.8],['silence',16,16.8]]){
  const rows=data.trace.filter(x=>x.audioTime>=a&&x.audioTime<b),mean=f=>rows.reduce((n,x)=>n+f(x),0)/rows.length,max=f=>Math.max(...rows.map(f))
  report[label].push({name,mainMean:mean(x=>x.review.magenta.level),mainPeak:max(x=>x.review.magenta.level),accentPeak:max(x=>x.review.mainAccent),secondaryMean:mean(x=>x.review.secondary.level),bridgeMean:mean(x=>x.review.bridge.level)})
 }
}
for(const row of after.trace){
 assert.equal(row.review.magenta.emissive,row.review.magenta.level*1.3)
 assert.equal(row.review.secondary.emissive,row.review.secondary.level*1.3)
 assert.equal(row.review.bridge.emissive,row.review.bridge.level*1.3)
 assert.equal(row.review.magenta.points[0],row.review.magenta.level*50)
 assert.equal(row.review.magenta.points[1],row.review.bridge.level*40)
}
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const result=spawnSync('magick',['compare','-metric','AE',`docs/evidence/nocturne/nt04/production/${name}.png`,`${dir}/manual/after/${name}.png`,'null:'],{encoding:'utf8'})
 assert.ok(result.status===0||result.status===1,result.stderr)
 const count=Number.parseFloat(result.stderr);report.manual.push({name,differingPixels:count});assert.equal(count,0,name)
}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2))
console.log('PASS: eight identical magenta transforms, exact delivered brightness, and eight pixel-identical Manual/idle views')

import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl08',r=JSON.parse(await readFile(root+'/current/capture.json'))
assert.ok(!r.failure&&r.sourceUnchanged);assert.deepEqual(r.errors,[]);assert.deepEqual(r.unexpectedWarnings,[])
const manifest=JSON.parse(await readFile(root+'/current/source-manifest.json'))
for(const row of manifest)assert.equal(createHash('sha256').update(await readFile(row.file)).digest('hex'),row.sha256)
for(const q of ['standard','low'])for(const v of ['desktop','wide','portrait'])for(const state of ['rest','active']){
 const row=r.screenshots.find(s=>s.name===`${v}-${q}-${state}`).row
 assert.equal(row.cost.calls,13);assert.equal(row.cost.triangles,q==='low'?2308:6852);assert.equal(row.cost.geometries,9);assert.equal(row.cost.programs,7)
 assert.deepEqual(row.camera.position,[0,0,20]);assert.deepEqual(row.camera.quaternion,[0,0,0,1])
 assert.equal(row.delivered.water.seamLevel,row.delivered.seam)
 assert.equal(row.delivered.stoneAurora,row.response.output.auroraStrength)
}
assert.equal(r.performance.length,9)
const groups=[]
for(let i=0;i<9;i+=3){const rows=r.performance.slice(i,i+3),sample=rows[0],x=sample.resources;assert.equal(x.renderer.dpr,sample.quality==='low'?.75:sample.deviceDpr===2?1.5:1);groups.push({quality:sample.quality,deviceDpr:sample.deviceDpr,renderDpr:x.renderer.dpr,drawingBuffer:x.drawingBuffer,uniqueGeometryBytes:x.bufferBytes,triangles:x.cost.triangles,median:rows.map(v=>v.median),p95:rows.map(v=>v.p95),max:Math.max(...rows.map(v=>v.max))})}
const result={status:'BL08 controlled audit PASS; owner review/native measurements remain open',productionFilesUnchanged:manifest.length,groups,errors:r.errors,unexpectedWarnings:r.unexpectedWarnings,knownClockDeprecations:r.knownDependencyWarnings.length,gpu: r.screenshots[0].row.renderer.gpu,limitations:['Headless frame cadence includes temporary probe overhead; not GPU execution time or native-device certification.','Unique geometry-array bytes exclude driver allocations, framebuffer/AA attachments, programs and CPU heap.','Shared-tab/native pointer/live-song gates carried forward; no captured media or approval inferred.'],decision:'Preserve approved visuals and existing Low fallback; no production changes justified by this audit.'}
await writeFile(root+'/assessment.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))

import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
const root='docs/evidence/bloom/',main=JSON.parse(await readFile(root+'bl07-final-gaps/current/capture.json','utf8')),matrix=JSON.parse(await readFile(root+'bl07-final-matrix/current/capture.json','utf8')),cleanup=JSON.parse(await readFile(root+'bl07-reflection-cleanup/current/capture.json','utf8')),optics=JSON.parse(await readFile(root+'bl07-optics/current/silhouette-assessment.json','utf8'))
for(const r of [main,matrix,cleanup]){assert.ok(!r.failure);assert.deepEqual(r.errors,[]);assert.ok(r.sourceUnchanged)}
for(const r of optics.results){assert.equal(r.missingBeyond1px,0);assert.equal(r.extraBeyond1px,0)}
const percentile=(a,p)=>a.toSorted((a,b)=>a-b)[Math.round((a.length-1)*p)]
const timing=main.performance.map(r=>({samples:r.length,medianMs:percentile(r.map(x=>x.dt*1000),.5),p95Ms:percentile(r.map(x=>x.dt*1000),.95),maximumMs:Math.max(...r.map(x=>x.dt*1000))}))
const impulses=matrix.screenshots.filter(x=>x.name.endsWith('-attack')).map(x=>({band:x.name,input:x.row.input.energy.six,qualified:x.row.response.bands.map(b=>b.accent),left:x.row.floating.fragments[0].impulse,right:x.row.floating.fragments[1].impulse}))
assert.ok(impulses.find(x=>x.band==='lowMids-attack').left>.005)
assert.ok(impulses.find(x=>x.band==='highMids-attack').right>.005)
const before=JSON.parse(await readFile(root+'bl07-final-gaps/before-manifest.json','utf8')),changed:any[]=[]
for(const f of before)if(createHash('sha256').update(await readFile(f.file)).digest('hex')!==f.sha256)changed.push(f.file)
assert.deepEqual(changed,['src/scenes/bloom/BloomScene.tsx','src/scenes/bloom/lifecycle.ts'])
const report:Record<string,any>={implementation:'Remaining implementation gaps addressed; BL07 owner/native acceptance is still open',changedExisting:changed,newProduction:['src/scenes/bloom/reflection.ts'],preservedSources:before.length-changed.length,cost:main.screenshots[0].row.cost,timing,impulses,fullSilhouetteViews:optics.results,cleanup:cleanup.checks,passed:['55 test files','lint','typecheck/build (existing chunk warning)','nine camera GPU silhouette masks versus actual source triangles','six separate bands and independently qualified stone impulses','repeated quality and landscape replacement without resource growth'],manualPending:['native pointer feel and real shared-tab floating control','owner real-song visual/musical acceptance','native hardware performance certification'],limits:'Geometry-based projected wet reflections, not a full physical scene reflection; automatic silhouette tolerance1px. Isolated fine-pointer emulation is declared. No captured media or audio recording. No BL08/commit/push.'}
await writeFile(root+'bl07-final-gaps/assessment.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({changed,timing,cost:report.cost,impulses},null,2))

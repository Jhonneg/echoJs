import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/lavender-peaks/lp07/current'
const capture=JSON.parse(await readFile(root+'/capture.json','utf8'))
const trace=JSON.parse(await readFile(root+'/trace.json','utf8'))
assert.ok(!capture.failure);assert.deepEqual(capture.errors,[]);assert.ok(capture.sourceUnchanged)
const decode=path=>{const r=spawnSync('ffmpeg',['-v','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:5e6});assert.equal(r.status,0);return r.stdout}
const off=decode(root+'/mixed-dense-off.png'),on=decode(root+'/mixed-dense-on.png')
let protectedSamples=0,protectedDifferences=0
for(let y=0;y<240;y++)for(let x=0;x<1440;x++)if(Math.hypot(x+.5-828,y+.5-276.75)<1.65*.75*67.5-1){
 const at=(y*1440+x)*3;protectedSamples++
 if(on[at]!==off[at]||on[at+1]!==off[at+1]||on[at+2]!==off[at+2])protectedDifferences++
}
assert.ok(protectedSamples>1000);assert.equal(protectedDifferences,0)
const baseline=JSON.parse(await readFile('docs/evidence/lavender-peaks/corona-approved/source-manifest.json','utf8'))
const changed:any[]=[]
for(const row of baseline)if(createHash('sha256').update(await readFile(row.file)).digest('hex')!==row.sha256)changed.push(row.file)
assert.deepEqual(changed.sort(),['src/scenes/lavender-peaks/LavenderPeaksScene.tsx','src/scenes/lavender-peaks/response.ts'].sort())
let maximumDensityRate=0
for(let i=1;i<trace.rows.length;i++){
 const a=trace.rows[i-1],b=trace.rows[i]
 if(a.atmosphere.session===b.atmosphere.session&&b.now>a.now)maximumDensityRate=Math.max(maximumDensityRate,Math.abs(b.atmosphere.density-a.atmosphere.density)/(b.now-a.now))
}
assert.ok(maximumDensityRate<.51)
const report:Record<string,any>={status:'LP07 generated/material and optical checks pass; owner real-song/visual gate pending',
 protectedEmitter:{samples:protectedSamples,changedPixels:protectedDifferences,scope:'Exposed upper emitter circle in matched on/off sky pixels; excludes mountain occluders'},
 quietDifference:capture.pairs.find(x=>x.name==='quiet').difference,
 activeDifference:capture.pairs.find(x=>x.name==='mixed-dense').difference,
 lateSilence:capture.pairs.find(x=>x.name==='late-silence').atmosphere,
 maximumDensityRate,maximumDensity:capture.music.maximumDensity,maximumWarmth:capture.music.maximumWarmth,
 sourceChanges:changed,otherExistingSourcesPreserved:baseline.length-changed.length,
 resources:capture.music.cost,renderer:capture.music.renderer,
 limits:'Generated PCM validates actual MI delivery; not a real acoustic/electronic listening gate or native performance benchmark. Mist/sky/contrast use bounded color modulation, not particles or geometric displacement.'}
await writeFile(root+'/assessment.json',JSON.stringify(report,null,2)+'\n');console.log(report)

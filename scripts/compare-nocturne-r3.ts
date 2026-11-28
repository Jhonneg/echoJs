// Generated-only R3 environment/foreground/midground checkpoint.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const base='docs/evidence/nocturne/nt13-refinement',load=async p=>JSON.parse(await readFile(`${base}/${p}`,'utf8'))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),mean=values=>values.reduce((a,b)=>a+b,0)/values.length
const previous=await load('r2/source-manifest.json'),changed:any[]=[]
for(const x of previous)if(hash(await readFile(x.file))!==x.sha256)changed.push(x.file)
assert.deepEqual(changed.sort(),['src/scenes/nocturne/ArchitectureDetails.tsx','src/scenes/nocturne/Atmosphere.tsx','src/scenes/nocturne/LightingDriver.tsx','src/scenes/nocturne/WetGround.tsx','src/scenes/nocturne/visualState.ts'])
for(const x of await load('r3/source-manifest.json'))assert.equal(hash(await readFile(x.file)),x.sha256)
const output:Record<string,any>={changedSource:changed,unchangedSource:previous.length-changed.length,runs:[],crops:[]}
for(const quality of ['standard','low','standard-reduced']){
 const dir=`r3/nocturne/${quality}/baseline`,capture=await load(`${dir}/capture.json`),{rows,frames}=await load(`${dir}/trace.json`)
 assert.ok(capture.status&&!capture.failure);assert.deepEqual(capture.errors,[])
 assert.equal(capture.pcmHash,(await load('r2/nocturne/standard/baseline/capture.json')).pcmHash)
 const result={quality,samples:rows.length,frames:frames.length,renderer:rows[0].renderer,calls:[...new Set(rows.map(r=>r.cost.calls))],geometries:[...new Set(rows.map(r=>r.cost.geometries))],textures:[...new Set(rows.map(r=>r.cost.textures))],meanFrameSeconds:mean(rows.map(r=>r.cost.dt)),depthPeak:Math.max(...rows.map(r=>r.environment.depthIntensity)),depthLate:mean(rows.filter(r=>r.audioTime>52).map(r=>r.environment.depthIntensity)),contourInstances:0,contourPeak:0,contourPeakTime:0}
 assert.deepEqual(result.calls,[196]);assert.deepEqual(result.geometries,[114]);assert.deepEqual(result.textures,[6])
 for(const r of rows){
  assert.deepEqual(r.camera,[0,1.6,5]);assert.equal(r.renderer.exposure,1);assert.equal(r.renderer.toneMapping,4)
  assert.deepEqual(r.environment.depthPosition,[0,2.8,-42]);assert.ok(Math.abs(r.environment.depthIntensity-18*r.environment.depthLight)<1e-10)
  assert.ok(r.environment.depthLight>=0&&r.environment.depthLight<=.65)
  for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10)
  for(const x of r.emitters){
   if(x.instances){
    assert.equal(x.intensity,1.3)
    const levels=x.instances.channel==='bridge'?r.bridgeSections:r.instanceLevels[x.instances.channel]
    x.instances.levels.forEach((v,i)=>{const index=x.instances.indices[i],expected=index===255?0:levels[index]*x.instances.scale;assert.ok(Math.abs(v-expected)<1e-7)})
    if(x.instances.channel==='bridge'){
     assert.equal(x.toneMapped,true)
     result.contourInstances=x.instances.indices.filter(i=>i!==255).length;assert.equal(result.contourInstances,9)
     const peak=Math.max(...x.instances.levels)
     if(peak>result.contourPeak){result.contourPeak=peak;result.contourPeakTime=r.audioTime}
     if(quality==='standard-reduced'||r.audioTime>52)assert.equal(peak,0)
    }
   }else assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)
  }
  if(r.audioTime>52)assert.ok(Object.values<any>(r.channels).every(x=>x.level===0))
 }
 assert.ok(capture.snapshots.some(s=>s.name==='manual-controls-open'));assert.ok(capture.snapshots.some(s=>s.name==='audio-controls-open'))
 for(const snapshot of capture.snapshots){
  if(snapshot.name==='manual-all-on')assert.ok(Math.abs(snapshot.record.environment.depthIntensity-11.7)<1e-10)
  if(snapshot.name==='manual-all-off')assert.equal(snapshot.record.environment.depthIntensity,0)
 }
 if(quality!=='standard-reduced')assert.ok(result.contourPeak>.01)
 output.runs.push(result)
}
const crops={floor:'550x180+460+530',bridge:'460x100+490+225',depthWall:'60x120+760+350',gate:'40x40+700+425'}
for(const phase of ['r2','r3'])for(const name of ['quiet','dense','silent','manual-all-on','manual-all-off']){
 const image=`${base}/${phase}/nocturne/standard/baseline/${name}.${name.startsWith('manual')?'png':'jpg'}`,result={phase,name,values:{}}
 for(const [label,crop]of Object.entries(crops)){
  const r=spawnSync('magick',[image,'-crop',crop,'+repage','-colorspace','sRGB','-format','%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]','info:'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)
  const rgb=r.stdout.trim().split(/\s+/).map(Number);result.values[label]=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]
 }
 output.crops.push(result)
}
const resting=spawnSync('magick',['compare','-metric','AE',`${base}/r2/nocturne/standard/baseline/manual-all-off.png`,`${base}/r3/nocturne/standard/baseline/manual-all-off.png`,'null:'],{encoding:'utf8'})
assert.equal(resting.status,0,resting.stderr);output.restingPixelDifference=resting.stderr.trim()
await writeFile(`${base}/r3/measurements.json`,JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2))

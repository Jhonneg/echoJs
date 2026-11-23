// Generated-only R0 measurements. Display RGB is not scene radiance.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const base='docs/evidence/nocturne/nt13-refinement/r0'
const load=async p=>JSON.parse(await readFile(`${base}/${p}`))
const source=await load('source-manifest.json')
for(const entry of source)assert.equal(createHash('sha256').update(await readFile(entry.file)).digest('hex'),entry.sha256,entry.file)
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,range=a=>({mean:mean(a),min:Math.min(...a),max:Math.max(...a)})
const stages=[['quiet',.7,2.5],['bass',5,8.8],['mids',11,14.8],['dense',16,22.8],['breakdown',26,28.8],['return',30,36.8],['silent',52,54.7]]
const results={sourceFilesUnchanged:source.length,runs:[],pixels:[],limitations:['Generated source soundtrack aligned to screenshot request midpoint; not captured audio output or sample-accurate timing.','8 Hz requested screenshots; measured brackets and cadence retained. Headless browser costs are not device performance acceptance.','Crimson retains authored camera travel, so cross-scene pixels are not a camera-controlled artistic parity metric.','Display RGB crop means describe screen output, not luminance, radiance or calibrated human perception.']}
for(const scene of ['nocturne','crimson-horizon'])for(const quality of ['standard','low']){
 const root=`${scene}/${quality}/baseline`,capture=await load(`${root}/capture.json`),trace=await load(`${root}/trace.json`),rows=trace.rows
 assert.ok(capture.status&&!capture.failure);assert.deepEqual(capture.errors,[])
 assert.equal(capture.pcmHash,results.runs[0]?.pcmHash??capture.pcmHash)
 const first=rows[0];assert.equal(first.renderer.exposure,1);assert.equal(first.renderer.colorSpace,'srgb');assert.equal(first.renderer.dpr,quality==='low'?.75:1)
 const data={scene,quality,pcmHash:capture.pcmHash,samples:rows.length,frames:trace.frames.length,renderer:first.renderer,frameSeconds:range(rows.map(r=>r.cost.dt)),drawCalls:range(rows.map(r=>r.cost.calls)),triangles:range(rows.map(r=>r.cost.triangles)),geometries:range(rows.map(r=>r.cost.geometries)),textures:range(rows.map(r=>r.cost.textures)),cameraStart:first.camera,cameraEnd:rows.at(-1).camera,screenshotBracketSeconds:range(trace.frames.map(f=>f.after-f.before)),freshness:range(rows.filter(r=>r.features.status==='active').map(r=>r.now-r.features.updatedAtSeconds)),stages:[]}
 for(const [name,start,end]of stages){const selected=rows.filter(r=>r.audioTime>=start&&r.audioTime<=end),stage={name,energy:Object.fromEntries(Object.keys(first.features.energy.six).map(k=>[k,range(selected.map(r=>r.features.energy.six[k]))])),context:Object.fromEntries(['intensity','activity','brightness'].map(k=>[k,range(selected.map(r=>r.features.context[k]))]))}
 if(scene==='nocturne'){
 stage.channels=Object.fromEntries(Object.keys(first.channels).map(k=>[k,range(selected.map(r=>r.channels[k].level))]));stage.spill=Object.fromEntries(Object.keys(first.spill).map(k=>[k,range(selected.map(r=>r.spill[k]))]));stage.points=selected[0].points.map((p,i)=>({channel:p.channel,full:p.full,...range(selected.map(r=>r.points[i].intensity))}));stage.atmosphere=range(selected.map(r=>r.atmosphere.level))
 }else stage.response=Object.fromEntries(['body','low','mid','high','glowActivity','weight'].filter(k=>typeof first.response[k]==='number').map(k=>[k,range(selected.map(r=>r.response[k]))]))
 if(scene==='nocturne')stage.accents=Object.fromEntries(Object.keys(first.channels).map(k=>[k,range(selected.map(r=>r.channels[k].accent))]));
 data.stages.push(stage)}
 if(scene==='nocturne')for(const r of rows){assert.deepEqual(r.camera,[0,1.6,5]);for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10);for(const x of r.emitters)assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)}
 assert.ok(data.freshness.min>=0&&data.freshness.max<=.25,'Active features fresh throughout generated playback');
 results.runs.push(data)
}
const crops={floor:'550x180+460+530',leftWall:'40x140+470+325',rightWall:'120x220+1050+220',bridge:'460x100+490+225',gate:'40x40+700+425'}
for(const quality of ['standard','low']){
 const prefix=`nocturne/${quality}`,capture=await load(`${prefix}/diagnostics/capture.json`);assert.ok(capture.status&&!capture.failure)
 for(const name of ['quiet-normal','quiet-emitters-only','quiet-no-reflection','quiet-environment','dense-normal','dense-emitters-only','dense-no-reflection','dense-environment','manual-all-on','manual-all-off']){
 const path=name.startsWith('manual')?`${prefix}/baseline/${name}.png`:`${prefix}/diagnostics/${name}.png`
 const values={quality,name,crops:{}}
 for(const [label,crop]of Object.entries(crops)){const result=spawnSync('magick',[`${base}/${path}`,'-crop',crop,'+repage','-colorspace','sRGB','-format','%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]','info:'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const rgb=result.stdout.trim().split(/\s+/).map(Number);values.crops[label]={rgb,displayWeightedMean:.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}}
 results.pixels.push(values)}
}
await writeFile(`${base}/measurements.json`,JSON.stringify(results,null,2))
console.log(JSON.stringify({sourceFilesUnchanged:source.length,runs:results.runs.map(({scene,quality,samples,frames,renderer,drawCalls,frameSeconds})=>({scene,quality,samples,frames,renderer,drawCalls,frameSeconds})),cropCases:results.pixels.length},null,2))

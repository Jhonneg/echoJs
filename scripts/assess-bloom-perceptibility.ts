import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root='docs/evidence/bloom/bl07-perceptibility'
const json=async p=>JSON.parse(await readFile(`${root}/${p}.json`,'utf8'))
const baseline=await json('baseline/capture'),current=await json('current/capture')
const shot=(r,n)=>r.screenshots.find(s=>s.name===n).row
const report:Record<string,any>={checks:[],mapping:[],illumination:{},motion:{},performance:{},unchangedSources:0}
for(const r of [baseline,current]){assert.deepEqual(r.errors,[]);assert.ok(r.sourceUnchanged&&!r.failure)}
for(const name of ['resting','moderate','energetic']){
 const a=shot(baseline,name),b=shot(current,name)
 assert.deepEqual(a.input,b.input);assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.hero,b.hero)
 assert.equal(b.delivered.seam,b.response.output.seamLevel);assert.equal(b.delivered.stoneSeam,b.delivered.seam)
 assert.equal(b.delivered.water.seamLevel,b.delivered.seam);assert.equal(b.delivered.stoneAurora,b.response.output.auroraStrength)
 b.delivered.mountains.forEach(m=>assert.ok(Math.abs(m.strength-(b.response.output.auroraStrength-.18))<1e-10))
 report.mapping.push({name,energy:b.input.energy.six,aurora:b.response.output.auroraStrength,mountainExcess:b.delivered.mountains[0].strength,seamBefore:a.delivered.seam,seamAfter:b.delivered.seam})
}
const rgb=(path,region)=>{
 const result=spawnSync('magick',[`${root}/${path}.png`,'-crop',region,'+repage','-depth','8','rgb:-'],{maxBuffer:8e6});assert.equal(result.status,0,result.stderr.toString());return result.stdout
}
const difference=(a,b)=>{assert.equal(a.length,b.length);let delta=0,changed=0,max=0;for(let i=0;i<a.length;i+=3){let pixel=0;for(let c=0;c<3;c++)pixel+=Math.abs(a[i+c]-b[i+c]);delta+=pixel;max=Math.max(max,pixel/3);if(pixel>3)changed++}return{meanAbsoluteChannelDelta:delta/a.length,changedPixels:changed,maxPixelChannelDelta:max}}
for(const [material,region]of [['mountains','450x150+130+285'],['stone','65x275+750+100'],['haze','160x75+50+240'],['lake','1000x260+200+510']] as const){
 const on=rgb('current/energetic',region),off=rgb('current/energetic-without-'+material+'-fill',region),delta=difference(on,off)
 assert.ok(delta.changedPixels>100&&delta.meanAbsoluteChannelDelta>.1,material+' must change actual delivered pixels')
 const sky=difference(rgb('current/energetic','400x170+20+20'),rgb('current/energetic-without-'+material+'-fill','400x170+20+20'))
 assert.equal(sky.changedPixels,0,'material-local controls must not brighten the sky')
 report.illumination[material]={region,...delta,unaffectedSky:sky}
}
const floating=await json('current/autonomous-floating'),quiet=floating.filter(f=>f.label.startsWith('QUIET'))
assert.ok(quiet.at(-1).time-quiet[0].time>11.5);assert.ok(quiet.every(f=>Object.values(f.row.input.energy.six).every(x=>x===0)))
const span=(rows,read)=>Math.max(...rows.map(read))-Math.min(...rows.map(read))
report.motion.monolithQuietYSpan=span(quiet,f=>f.row.floating.y);assert.ok(report.motion.monolithQuietYSpan>.21)
report.motion.fragments=[0,1].map(i=>({xPixels:span(quiet,f=>f.row.delivered.fragments[i].screen[0])*720,yPixels:span(quiet,f=>f.row.delivered.fragments[i].screen[1])*450,rotationRadians:span(quiet,f=>f.row.delivered.fragments[i].rotation[0])}))
report.motion.fragments.forEach(f=>assert.ok(f.xPixels>24&&f.yPixels>25&&f.rotationRadians>.70))
const pointer=await json('current/mouse-parallax'),last=pointer.at(-1).row
assert.ok(Math.abs(last.parallax.x)<1e-4&&Math.abs(last.parallax.y)<1e-4)
report.motion.cameraPositionSpans=[0,1].map(i=>span(pointer,f=>f.row.camera.position[i]))
assert.ok(report.motion.cameraPositionSpans[0]>1.6&&report.motion.cameraPositionSpans[1]>.8)
for(const band of ['bass','lowMids','presence','air'])assert.equal(shot(current,band+'-attack').delivered.seam,1)
const beamBody=rgb('current/highMids-sustained','70x260+725+100'),beamHit=rgb('current/highMids-attack','70x260+725+100')
const mean=p=>p.reduce((sum,v)=>sum+v,0)/p.length
report.motion.beamAttack={sustained:shot(current,'highMids-sustained').delivered.seam,accent:shot(current,'highMids-attack').delivered.seam,surfaceMeanDelta:mean(beamHit)-mean(beamBody)}
assert.ok(report.motion.beamAttack.surfaceMeanDelta>1)
for(const effect of ['mountain-trails','aurora-surfaces','monolith-beam','water-ripples','complete-scene']){
 const frames=await json('current/'+effect)
 assert.ok(frames.length>40)
 for(const f of frames){assert.equal(f.row.delivered.seam,f.row.response.output.seamLevel);assert.equal(f.row.delivered.water.ringAge,f.row.response.ringAge);assert.deepEqual(f.row.camera.position,[0,0,20])}
}
const water=await json('current/water-ripples'),rings=water.filter(f=>f.row.response.ringStrength>.1)
assert.ok(rings.some(f=>f.row.response.ringAge>2.5));assert.ok(rings.every(f=>Math.abs(f.row.delivered.water.anchorX-.6)<1e-6))
report.motion.rippleRadiusAt2Seconds={beforeWorld:1.2*.85*2,afterWorld:1.5*1.05*2,beforePixels:1.2*.85*2*90,afterPixels:1.5*1.05*2*90}
const perfBefore=await json('baseline/performance-capture'),perfAfter=await json('current/water-capture')
report.performance={before:perfBefore.performance,after:perfAfter.performance,limitation:'Headless ANGLE vsync frame cadence; not GPU execution time/native-window certification.'}
for(const row of perfAfter.performance){assert.equal(row.cost.calls,13);assert.equal(row.cost.programs,7);assert.equal(row.cost.geometries,9)}
const expected=new Set(['src/scenes/bloom/BloomScene.tsx','src/scenes/bloom/lifecycle.ts','src/scenes/bloom/trails.ts','src/scenes/bloom/music.ts','src/scenes/bloom/monolith.ts'])
for(const f of await json('baseline/manifest')){
 if(expected.has(f.file))continue
 const hash=createHash('sha256').update(await readFile(f.file)).digest('hex');assert.equal(hash,f.sha256,f.file+' changed outside scope');report.unchangedSources++
}
// Stone and terrain constructors stay byte-identical; only the stone shader changes.
const original=await readFile(root+'/baseline/monolith.ts.txt','utf8'),now=await readFile('src/scenes/bloom/monolith.ts','utf8')
assert.equal(original.split('const stoneNoise')[0],now.split('const stoneNoise')[0])
report.checks.push('Matched input/camera/monolith pose; final controller→actual material bindings; separate material-only pixel comparisons with unchanged sky; quiet autonomous float; visible independent stone movement; parallax/reduced return; ring origin/range; individual and complete films; source/geometry protection')
await writeFile(root+'/assessment.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))

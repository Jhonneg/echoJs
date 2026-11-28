// R5 comparative evidence only. Generated soundtrack; no owner audio access.
import {readFile,writeFile,mkdtemp} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import assert from 'node:assert/strict'
const root='docs/evidence/nocturne/nt13-refinement/r5',load=async p=>JSON.parse(await readFile(`${root}/${p}`,'utf8'))
const manifest=await load('source-manifest.json'),old=JSON.parse(await readFile('docs/evidence/nocturne/nt13-refinement/r3/source-manifest.json','utf8'))
assert.deepEqual(manifest,old)
for(const x of manifest)assert.equal(createHash('sha256').update(await readFile(x.file)).digest('hex'),x.sha256)
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,range=a=>({mean:mean(a),min:Math.min(...a),max:Math.max(...a)})
const phases=[['quiet',.7,2.5],['bass',5,8.8],['mids',11,14.8],['dense',16,22.8],['breakdown',26,28.8],['return',30,36.8],['silence',52,54.7]]
const result:Record<string,any>={productionFilesUnchanged:manifest.length,source:'Existing generated55s NT11 arrangement, identical WAV SHA256 in every run',soundtrack:'Generated source WAV muxed at the common source offset; not recorded browser output',runs:[],pairs:[],ownerApproval:'pending; automated matching does not approve artistic parity or all real-song cases'}
try{result.ownerReview=await load('owner-review.json');result.ownerApproval=result.ownerReview.decision}catch(e:any){if(e.code!=='ENOENT')throw e}
const temporary=await mkdtemp(join(tmpdir(),'echo-r5-comparison-')),font='/usr/share/fonts/noto/NotoSans-Regular.ttf'
for(const quality of ['standard','low']){
 const pair:any[]=[]
 for(const scene of ['nocturne','crimson-horizon']){
  const directory=`${scene}/${quality}/baseline`,capture=await load(`${directory}/capture.json`),trace=await load(`${directory}/trace.json`),rows=trace.rows
  assert.ok(capture.status&&!capture.failure);assert.deepEqual(capture.errors,[])
  assert.equal(capture.pcmHash,result.runs[0]?.pcmHash??capture.pcmHash)
  const renderer=rows[0].renderer
  for(const r of rows){assert.equal(r.renderer.exposure,1);assert.equal(r.renderer.toneMapping,4);assert.equal(r.renderer.colorSpace,'srgb');assert.equal(r.renderer.dpr,quality==='low'?.75:1)}
  const summary:Record<string,any>={scene,quality,pcmHash:capture.pcmHash,samples:rows.length,frames:trace.frames.length,renderer,cameraFirst:rows[0].camera,cameraLast:rows.at(-1).camera,screenshotBracketSeconds:range(trace.frames.map(f=>f.after-f.before)),stages:[]}
  for(const [name,start,end]of phases){
   const selected=rows.filter(r=>r.audioTime>=start&&r.audioTime<=end)
   const stage:Record<string,any>={name,energy:Object.fromEntries(Object.keys(rows[0].features.energy.six).map(k=>[k,range(selected.map(r=>r.features.energy.six[k]))])),intensity:range(selected.map(r=>r.features.context.intensity))}
   if(scene==='nocturne'){
    stage.channels=Object.fromEntries(Object.keys(rows[0].channels).map(k=>[k,range(selected.map(r=>r.channels[k].level))]));stage.accents=Object.fromEntries(Object.keys(rows[0].channels).map(k=>[k,range(selected.map(r=>r.channels[k].accent))]));stage.depthIntensity=range(selected.map(r=>r.environment.depthIntensity));stage.panelPoint=range(selected.map(r=>r.points.find(p=>p.channel==='cyanPanel').intensity))
   }else stage.responses=Object.fromEntries(['body','low','mid','high','weight','glowActivity'].filter(k=>typeof rows[0].response[k]==='number').map(k=>[k,range(selected.map(r=>r.response[k]))]))
   summary.stages.push(stage)
  }
  if(scene==='nocturne'){
   for(const r of rows){
    assert.deepEqual(r.camera,[0,1.6,5]);assert.deepEqual(r.quaternion,rows[0].quaternion)
    for(const x of r.points)assert.ok(Math.abs(x.intensity-r.spill[x.channel]*x.full)<1e-10)
    assert.ok(Math.abs(r.environment.depthIntensity-18*r.environment.depthLight)<1e-10)
    for(const x of r.emitters){if(x.instances){const levels=x.instances.channel==='bridge'?r.bridgeSections:r.instanceLevels[x.instances.channel];x.instances.levels.forEach((v,i)=>assert.ok(Math.abs(v-(x.instances.indices[i]===255?0:levels[x.instances.indices[i]]*x.instances.scale))<1e-7))}else assert.ok(Math.abs(x.intensity-1.3*(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment]))<1e-10)}
    if(r.audioTime>52)assert.ok(Object.values<any>(r.channels).every(c=>c.level===0))
   }
   assert.ok(capture.snapshots.some(s=>s.name==='manual-all-on'));assert.ok(capture.snapshots.some(s=>s.name==='manual-all-off'))
  }
  result.runs.push(summary);pair.push({directory,capture,trace})
 }
 const start=Math.max(.5,...pair.map(p=>p.trace.frames[0].time+.05)),end=Math.min(54.5,...pair.map(p=>p.trace.frames.at(-1).time-.05))
 const caption=join(temporary,quality+'-caption.txt')
 await writeFile(caption,`Elapsed %{pts} s | common source offset +${start.toFixed(3)} s | generated soundtrack, not captured output\nSource phases: 0-3 quiet | 3-9 bass | 9-15 mids | 15-23 dense | 23-29 breakdown | 29-37 return | 37-55 silence`)
 const labels=['NOCTUNE - FIXED CAMERA','CRIMSON - AUTHORED CAMERA TRAVEL']
 const filters=pair.map((p,i)=>`[${i}:v]trim=start=${start-p.trace.frames[0].time}:end=${end-p.trace.frames[0].time},setpts=PTS-STARTPTS,scale=720:405,drawtext=fontfile=${font}:text='${labels[i]}':fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6:x=12:y=12[v${i}]`).join(';')+`;[v0][v1]hstack=inputs=2,pad=1440:466:0:0:color=0x111820,drawtext=fontfile=${font}:textfile=${caption}:fontsize=16:fontcolor=white:x=12:y=414[v]`
 const movie=`${root}/${quality}-comparison.mp4`,cmd=['-y','-loglevel','error','-i',`${root}/${pair[0].directory}/generated-baseline.mp4`,'-i',`${root}/${pair[1].directory}/generated-baseline.mp4`,'-ss',String(start),'-i','/tmp/echo-nocturne-coordination-review.wav','-filter_complex',filters,'-map','[v]','-map','2:a:0','-t',String(end-start),'-r','25','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',movie]
 const encoded=spawnSync('ffmpeg',cmd,{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr)
 result.pairs.push({quality,sourceStart:start,sourceEnd:end,file:movie,cameraDifference:'Noctune fixed. Crimson retains authored movement/rebasing; journey phase is not synchronized. Separate runs share source time, not identical analyser/event frames.',timingLimit:'Source midpoint alignment;8Hz capture/request brackets and video quantization prevent sample-accurate onset claims.'})
 console.log('PASS',quality,'paired comparison',start.toFixed(3),'to',end.toFixed(3),'source seconds')
}
await writeFile(`${root}/comparison.json`,JSON.stringify(result,null,2))

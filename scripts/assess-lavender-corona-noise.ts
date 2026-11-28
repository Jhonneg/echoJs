import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {SUN,CORONA_SETTINGS} from '../src/scenes/lavender-peaks/corona.ts'
const directory='docs/evidence/lavender-peaks/corona-noise',root=directory+'/current'
const capture=JSON.parse(await readFile(root+'/capture.json','utf8'))
const baseline=JSON.parse(await readFile(directory+'/baseline/capture.json','utf8'))
const trace=JSON.parse(await readFile(root+'/trace.json','utf8'))
assert.ok(!capture.failure);assert.deepEqual(capture.errors,[])
const percentile=(v,p)=>{v=v.toSorted((a,b)=>a-b);return v[Math.round((v.length-1)*p)]}
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length
const deviation=v=>{const m=mean(v);return Math.sqrt(mean(v.map(x=>(x-m)**2)))}
const decode=name=>{const r=spawnSync('ffmpeg',['-v','error','-i',root+'/'+name,'-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:5e6});assert.equal(r.status,0);return r.stdout}
// Sun geometry from the scene (centred and 2× since 2026-11-28; was centre x 828, core radius .75).
const core=CORONA_SETTINGS.sunRadius,radius=1.65*core,restRadius=core*1.125*1.15,zoom=67.5,center=[720+SUN.x*zoom,405-SUN.y*zoom]
function contour(name){
 const pixels=decode(name)
 const sample=(x,y)=>{
  x-=.5;y-=.5;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy
  const channel=(a,b)=>pixels[(b*1440+a)*3]
  return (channel(ix,iy)*(1-fx)+channel(ix+1,iy)*fx)*(1-fy)+(channel(ix,iy+1)*(1-fx)+channel(ix+1,iy+1)*fx)*fy
 }
 const result:any[]=[]
 for(let angle=0;angle<360;angle++){
  const a=angle*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),values:any[]=[]
  for(let r=.76*SUN.scale*zoom;r<=radius*zoom;r+=.2)values.push({r,v:sample(center[0]+cs*r,center[1]-sn*r)})
  const peak=values.reduce((a,b)=>b.v>a.v?b:a);assert.ok(peak.v>5,'Missing outer contour '+name+' '+angle)
  const around=values.filter(x=>Math.abs(x.r-peak.r)<=2.5),weight=around.reduce((a,x)=>a+x.v,0)
  result.push(around.reduce((a,x)=>a+x.r*x.v,0)/weight/zoom)
 }
 return result
}
const shapes:Record<string,any>={silence:[],moderate:[],strong:[]},measurements:any[]=[]
for(let frame=0;frame<24;frame++){
 const item={frame}
 for(const label of Object.keys(shapes)){
  const r=contour('shape-'+label+'-'+String(frame).padStart(2,'0')+'.png');shapes[label].push(r)
  item[label]={meanRadius:mean(r),radialRms:deviation(r),maxRadius:Math.max(...r),minRadius:Math.min(...r)}
  assert.ok(Math.max(...r)<radius)
 }
 measurements.push(item)
}
const geometry:Record<string,any>={}
for(const label of Object.keys(shapes)){
 const differences=shapes[label].map((r,i)=>r.map((v,a)=>v-shapes.silence[i][a]))
 const rms=mean(measurements.map(x=>x[label].radialRms))
 const temporal=shapes[label].slice(1).flatMap((r,i)=>r.map((v,a)=>Math.abs(v-shapes[label][i][a])))
 geometry[label]={meanRadialRms:rms,rmsFractionOfRestRadius:rms/restRadius,
  meanAbsoluteRadiusChange:mean(differences.map(x=>Math.abs(mean(x)))),
  deformationRms:mean(differences.map(x=>deviation(x))),
  maximumDisplacement:Math.max(...shapes[label].flatMap(r=>r.map(v=>Math.abs(v-restRadius)))),
  maximumRadius:Math.max(...shapes[label].flat()),temporalP99Per100ms:percentile(temporal,.99)}
 geometry[label].maximumDisplacementFractionOfRestRadius=geometry[label].maximumDisplacement/restRadius
 geometry[label].maximumDisplacementFractionOfCoreRadius=geometry[label].maximumDisplacement/core
}
const thresholds={moderateRms:geometry.moderate.rmsFractionOfRestRadius>=.04,strongRms:geometry.strong.rmsFractionOfRestRadius>=.06,
 strongOverModerate:geometry.strong.meanRadialRms>=1.3*geometry.moderate.meanRadialRms,
 shapeOverMeanRadius:geometry.strong.deformationRms>geometry.strong.meanAbsoluteRadiusChange,
 smoothTemporal:geometry.strong.temporalP99Per100ms<.06*restRadius}
const onset:any[]=[]
for(const item of capture.onsetDiagnostic??[]){
 const on=contour('onset-'+item.index+'-on.png'),off=contour('onset-'+item.index+'-off.png')
 const differences=on.map((v,i)=>Math.max(0,v-off[i]-.003)),sum=differences.reduce((a,b)=>a+b,0)
 if(sum===0)continue
 const x=differences.reduce((s,w,a)=>s+w*Math.cos(a*Math.PI/180),0),y=differences.reduce((s,w,a)=>s+w*Math.sin(a*Math.PI/180),0)
 onset.push({time:item.time,angle:Math.atan2(y,x),maximumDisplacement:Math.max(...on.map((v,i)=>v-off[i])),fractionOfCircumference:differences.filter(x=>x>0).length/360})
}
assert.ok(onset.length>=5)
assert.ok(onset[0].angle-onset.at(-1).angle>.6,'Localized bulge must travel around the upper arc')
assert.ok(onset.every(x=>x.fractionOfCircumference<.25),'Accent must stay localized')
const attacks={}
for(const [label,a,b,expected]of [['isolated',23,26,1],['2Hz',26,31,10],['4Hz',31,35,16],['bass-free',39,44,0]] as const){
 const rows=trace.rows.filter(r=>a<=r.audioTime&&r.audioTime<b)
 const notices=trace.rows.filter((r,i)=>i>0&&a<=r.audioTime&&r.audioTime<b&&r.corona.lastBassSequence>trace.rows[i-1].corona.lastBassSequence)
 attacks[label]={freshNotices:notices.length,maximumDeliveredLobes:Math.max(...rows.map(r=>r.skyUniforms.coronaBassPulses.filter((v,i)=>i%2===1&&v>0).length))}
 assert.equal(notices.length,expected);assert.ok(attacks[label].maximumDeliveredLobes<=3)
}
const stats=v=>({median:percentile(v,.5),p95:percentile(v,.95)})
const performance={baseline:baseline.performance.map(r=>({frames:r.length,frameMs:stats(r.map(x=>x.dt*1000)),cpuSubmissionMs:stats(r.map(x=>x.cpuMs))})),
 candidate:capture.performance.map(r=>({frames:r.length,frameMs:stats(r.map(x=>x.dt*1000)),cpuSubmissionMs:stats(r.map(x=>x.cpuMs))})),
 scope:'Headless Brave, same fixed camera and held envelope/detail/lighting at1440x810 DPR1, three4s windows after warmup. CPU submission is not GPU execution time; frame cadence is vsync limited. Native-window performance not certified.'}
const signals={}
for(const [label,a,b]of [['moderate',6,9],['strong',16,19],['bass-free',41,43.5]] as const){
 const rows=trace.rows.filter(r=>r.audioTime>=a&&r.audioTime<=b)
 signals[label]={bass:stats(rows.map(r=>r.features.energy.six.bass)),subBass:stats(rows.map(r=>r.features.energy.six.subBass)),envelope:stats(rows.map(r=>r.corona.envelope)),maximumAccent:Math.max(...rows.map(r=>r.corona.lowAccent))}
}
const report:Record<string,any>={status:Object.values(thresholds).every(Boolean)?'Silhouette acceptance targets passed':'Silhouette acceptance targets need review',
 geometry,thresholds,coreRadius:core,restingOuterStrandRadius:restRadius,hardOuterRadius:radius,maximumRadiusRatio:1.65,signals,onset,attacks,performance,
 resources:capture.resources,renderer:capture.renderer,method:'Actual rendered outer-strand centerline,360polar rays at24matched phases; equal opacity, isolated outer strand and no mountain occlusion in development-only diagnostics. Normal videos retain occlusion and all three strands.'}
const lightOn=decode('environment-on.png'),lightOff=decode('environment-off.png')
let changedLightPixels=0,maximumLightDifference=0,protectedChanges=0
for(let y=0;y<650;y++)for(let x=0;x<1440;x++){
 const at=(y*1440+x)*3,d=Math.max(...[0,1,2].map(c=>Math.abs(lightOn[at+c]-lightOff[at+c])))
 if(d>0){changedLightPixels++;maximumLightDifference=Math.max(maximumLightDifference,d)
  if(y<235&&Math.hypot(x+.5-center[0],y+.5-center[1])<radius*zoom-1)protectedChanges++
 }
}
assert.ok(changedLightPixels>1000);assert.equal(protectedChanges,0)
report.environment={changedPixels:changedLightPixels,maximumChannelDifference:maximumLightDifference,protectedEmitterChanges:protectedChanges,
 moderateLight:capture.states.moderate.illumination.coronaLight,strongLight:capture.states.strong.illumination.coronaLight,
 method:'Matched sky/slope/mist/glint illumination on/off; same held corona, sun, atmosphere, ridge responses and clock.'}
await writeFile(root+'/assessment.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
assert.ok(Object.values(thresholds).every(Boolean),report.status)
const ffmpeg=args=>{const r=spawnSync('ffmpeg',['-y','-loglevel','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
const labels=['silence','moderate','strong']
const layout=labels.map((label,i)=>`[${i}:v]crop=280:240:688:145,scale=560:480,drawtext=text='${label==='silence'?'silence':label+' bass'}':fontcolor=0x322e50:fontsize=20:x=18:y=20[v${i}]`).join(';')+';[v0][v1][v2]hstack=inputs=3[v]'
ffmpeg([...labels.flatMap(label=>['-framerate','10','-i',root+'/matched-'+label+'-%02d.jpg']),'-filter_complex',layout,'-map','[v]','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',root+'/silence-moderate-strong.mp4'])
ffmpeg([...labels.flatMap(label=>['-i',root+'/matched-'+label+'-06.jpg']),'-filter_complex',layout,'-map','[v]','-frames:v','1',root+'/silence-moderate-strong.png'])
const diagnosticLayout=labels.map((label,i)=>`[${i}:v]crop=210:210:723:172,scale=420:420,drawtext=text='${label} - equal opacity':fontcolor=white:fontsize=18:x=15:y=18[v${i}]`).join(';')+';[v0][v1][v2]hstack=inputs=3[v]'
ffmpeg([...labels.flatMap(label=>['-framerate','10','-i',root+'/shape-'+label+'-%02d.png']),'-filter_complex',diagnosticLayout,'-map','[v]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',root+'/silhouette-diagnostic.mp4'])
const schedule=JSON.parse(await readFile(root+'/generated-schedule.json','utf8'))
const start=trace.frames[0].time
const annotations=schedule.sections.map(([label,a,b])=>`drawtext=text='Generated input - ${label}':fontcolor=0x322e50:fontsize=20:x=28:y=75:enable='between(t,${Math.max(0,a-start)},${b-start})'`).join(',')
ffmpeg(['-i',root+'/generated-corona-demo.mp4','-vf',annotations,'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',root+'/annotated-generated-demo.mp4'])

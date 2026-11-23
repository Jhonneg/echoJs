// NT12 generated-PCM expectations versus actual production feature/material/light values.
import {readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt12',report={criteria:[],runs:[],sections:[]}
for(const label of ['current','reduced']){
 const data=JSON.parse(await readFile(`${dir}/${label}/trace.json`)),rows=data.renderTrace
 const section=(a,b)=>rows.filter(x=>x.audioTime>=a&&x.audioTime<b),peak=(r,f)=>Math.max(...r.map(f)),mean=(r,f)=>r.reduce((n,x)=>n+f(x),0)/r.length
 function check(name,expected,passed,observed){assert.ok(passed,`${label}: ${name}`);report.criteria.push({label,name,expected,observed,status:'passed'})}
 const normal=label==='current'
 for(const r of rows){
  assert.deepEqual(r.camera,[0,1.6,5])
  r.emitters.forEach(x=>assert.equal(x.intensity,(x.segment===undefined?r.channels[x.channel].level:r.bridgeSections[x.segment])*1.3))
  r.points.forEach(x=>assert.equal(x.intensity,r.channels[x.channel].level*x.full))
 }
 const definitions=[['silence-start',.4,1.8],['bass100',3.5,4.8],['lowmid450',7.5,7.85],['quiet1000',9.5,10.8],['loud1000',12.5,13.8],['high8000',16,16.8],['low-attacks',19.2,21.5],['mid-attacks',22.2,24.5],['high-attacks',25.2,27.5],['bass-highmid',29.4,32.5],['lowmid-near-highmid',34,37.5],['dynamics',39,43.5],['silence',57,59.8]]
 for(const [name,a,b]of definitions){
  const s=section(a,b);assert.ok(s.length>5)
  report.sections.push({label,name,samples:s.length,energyMean:Object.fromEntries(Object.keys(s[0].feature.energy).map(n=>[n,mean(s,x=>x.feature.energy[n])])),channels:Object.fromEntries(Object.keys(s[0].channels).map(n=>[n,{mean:mean(s,x=>x.channels[n].level),peak:peak(s,x=>x.channels[n].level),accentPeak:peak(s,x=>x.channels[n].accent)}]))})
 }
 const get=n=>report.sections.find(x=>x.label===label&&x.name===n)
 const start=get('silence-start'),bass=get('bass100'),low=get('lowmid450'),quiet=get('quiet1000'),loud=get('loud1000'),high=get('high8000'),near=get('lowmid-near-highmid'),mixed=get('bass-highmid'),end=get('silence')
 check('silence','All fixture levels0',Object.values(start.channels).every(x=>x.peak===0),start.channels)
 check('100Hz band','Bass feature>.1; panel/violet accents0',bass.energyMean.bass>.1&&bass.channels.cyanPanel.accentPeak===0&&bass.channels.violet.accentPeak===0,bass)
 check('450Hz band','Low-mid feature>.1; high-mid panel accent0',low.energyMean.lowMids>.1&&low.channels.cyanPanel.accentPeak===0,low)
 check('1000Hz strength','Loud high-mid feature and panel mean exceed quiet',loud.energyMean.highMids>quiet.energyMean.highMids*3&&loud.channels.cyanPanel.mean>quiet.channels.cyanPanel.mean*2,{quiet,loud})
 check('8000Hz band','Air feature>.1; panel/magenta accents0',high.energyMean.air>.1&&high.channels.cyanPanel.accentPeak===0&&high.channels.magentaMain.accentPeak===0,high)
 if(normal){
  for(const [name,channel]of [['low-attacks','magentaMain'],['mid-attacks','cyanPanel'],['high-attacks','violet']]){
   const s=get(name);check(name,'Own finite accent>.01',s.channels[channel].accentPeak>.01,s.channels[channel])
  }
  check('held high-mid near bass attacks','Panel accent0, stable mean near .092 while magenta accents',mixed.channels.cyanPanel.accentPeak===0&&mixed.channels.magentaMain.accentPeak>.01&&mixed.channels.cyanPanel.mean>.08&&mixed.channels.cyanPanel.mean<.1,mixed)
  check('low-mid attacks near held high mids','Detail accent>.01; panel accent0',near.channels.cyanDetails.accentPeak>.01&&near.channels.cyanPanel.accentPeak===0,near)
  check('sustain no repeated accents','Settled1000/8000 sections have accent0',loud.channels.cyanPanel.accentPeak===0&&high.channels.violet.accentPeak===0,{loud:loud.channels.cyanPanel,high:high.channels.violet})
  check('settled band isolation','Unrelated final levels<.001',bass.channels.cyanPanel.peak<.001&&bass.channels.violet.peak<.001&&low.channels.cyanPanel.peak<.001&&high.channels.cyanPanel.peak<.001,{bassPanel:bass.channels.cyanPanel,lowPanel:low.channels.cyanPanel,highPanel:high.channels.cyanPanel})
 }else check('reduced suppression','All channel accents/bridge sections0',rows.every(x=>Object.values(x.channels).every(c=>c.accent===0)&&x.bridgeSections.every(v=>v===0)),{renderSamples:rows.length})

 const early=section(38.8,39.3),top=section(41.2,41.8),fall=section(43.4,43.9)
 const up=mean(top,x=>x.channels.cyanPanel.level),lo=mean(early,x=>x.channels.cyanPanel.level),down=mean(fall,x=>x.channels.cyanPanel.level)
 check('rising/falling dynamics','Panel increases then decreases with1000Hz ramp',up>lo*1.4&&down<up*.9,{early:lo,top:up,fall:down})
 check('silence recovery','Every fixture0 in final window',Object.values(end.channels).every(x=>x.peak===0),end.channels)

 const controlData=JSON.parse(await readFile(`${dir}/${label}/controls.json`))
 const control=n=>controlData.controls.find(x=>x.name===n).review
 const zero=control('zero-reactivity'),on=control('manual-all-on-at-zero-gain'),off=control('manual-all-off'),paused=control('pause-recovery')
 check('browser zero with positive input','High-mid>.1 but all delivered fixtures and atmosphere0',zero.feature.energy.highMids>.1&&zero.emitters.every(x=>x.intensity===0)&&zero.points.every(x=>x.intensity===0)&&zero.atmosphere.level===0,zero)
 check('browser Manual independent of gain','Original on/off previews deliver1.3/all-full or0',on.emitters.every(x=>x.intensity===1.3)&&on.points.every(x=>x.intensity===x.full)&&off.emitters.every(x=>x.intensity===0)&&off.points.every(x=>x.intensity===0),{on,off})
 check('browser pause recovery','All fixture outputs settle0',Object.values(paused.channels).every(x=>x.level===0),paused)
 assert.deepEqual(controlData.errors,[])
 report.runs.push({label,renderSamples:rows.length,frames:data.frames.length,errors:data.errors,resources:[...new Set(rows.map(x=>JSON.stringify({geometries:x.resources.geometries,textures:x.resources.textures})))],lastAtmosphere:rows.at(-1).atmosphere})
 assert.deepEqual(data.errors,[])
}
await writeFile(dir+'/browser-results.json',JSON.stringify(report,null,2))
console.log(`PASS: ${report.criteria.length} PCM criteria; exact actual material/light delivery in both runs`)

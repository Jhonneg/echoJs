// NT10 actual atmospheric delivery, controlled context and static preservation.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {Color} from 'three'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt10',load=async p=>JSON.parse(await readFile(`${dir}/${p}.json`,'utf8'))
const before=await load('before/trace'),after=await load('after/trace'),reduced=await load('reduced/trace')
const report:Record<string,any>={sections:[],manual:[],controlled:[],wholeFrame:{}}
const magenta=new Color('#ff005c'),cyan=new Color('#00e5ff'),violet=new Color('#b066ff'),base=new Color('#05070b')
for(const [label,data]of [['before',before],['after',after],['reduced',reduced]] as const){
 for(const row of data.trace){
  const r=row.review,a=r.atmosphere
  const expected=magenta.clone().multiplyScalar(a.magenta).add(cyan.clone().multiplyScalar(a.cyan)).add(violet.clone().multiplyScalar(a.violet)).toArray()
  expected.forEach((x,i)=>assert.ok(Math.abs(x-r.actual.gate[i])<1e-12))
  assert.deepEqual(r.actual.gate,r.actual.haze)
  expected.forEach((x,i)=>assert.ok(Math.abs(x*.018+base.toArray()[i]-r.actual.fog[i])<1e-12))
  r.emitters.filter(x=>x.segment===undefined).forEach(x=>assert.equal(x.intensity,r.channels[x.channel]*1.3))
  r.points.forEach(x=>assert.equal(x.intensity,r.channels[x.channel]*x.full))
  // Bridge segments differ from its mean; validate them in the preservation comparison instead.
 }
 for(const [name,a,b]of [['quiet',7,9],['energetic',17,19],['recovery',26,28],['silence',43,44.8]] as const){
  const rows=data.trace.filter(x=>x.audioTime>=a&&x.audioTime<b),mean=f=>rows.reduce((n,x)=>n+f(x),0)/rows.length
  report.sections.push({label,name,contextIntensity:mean(x=>x.review.feature.context.intensity),activity:mean(x=>x.review.feature.context.activity),brightness:mean(x=>x.review.feature.context.brightness),level:mean(x=>x.review.atmosphere.level),fogFar:mean(x=>x.review.actual.far)})
 }
}
function compare(a,b,crop?){
 const args=['compare','-metric','AE'];if(crop)args.push('(',a,'-crop',crop,'+repage',')','(',b,'-crop',crop,'+repage',')');else args.push(a,b)
 args.push('null:');const r=spawnSync('magick',args,{encoding:'utf8'});assert.ok(r.status===0||r.status===1,r.stderr);return Number.parseFloat(r.stderr)
}
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const pixels=compare(`${dir}/manual/before/${name}.png`,`${dir}/manual/after/${name}.png`);assert.equal(pixels,0,name);report.manual.push({name,rawAE:pixels})
}
const bctx=await load('before/controlled-context'),actx=await load('after/controlled-context')
for(const c of actx.cases){
 const b=bctx.cases.find(x=>x.name===c.name)
 assert.deepEqual(c.review.channels,b.review.channels)
 assert.deepEqual(c.review.emitters,b.review.emitters);assert.deepEqual(c.review.points,b.review.points)
 const near=compare(`${dir}/before/context-${c.name}.png`,`${dir}/after/context-${c.name}.png`,'30x200+980+210')
 assert.equal(near,0,'foreground fixture crop '+c.name)
 report.controlled.push({name:c.name,level:c.review.atmosphere.level,density:c.review.response.density,tint:c.review.response.tint,far:c.review.actual.far,foregroundRawAE:near})
}
assert.equal(compare(`${dir}/before/context-quiet.png`,`${dir}/after/context-quiet.png`),0)
const gateBlue=name=>{
 const r=spawnSync('magick',[`${dir}/after/context-${name}.png`,'-crop','40x40+700+425','+repage','-format','%[fx:mean.b]','info:'],{encoding:'utf8'})
 assert.equal(r.status,0,r.stderr);return Number(r.stdout)
}
report.gatePixelBlue={quiet:gateBlue('quiet'),highSpectrum:gateBlue('high-spectrum'),maximum:gateBlue('maximum')}
assert.ok(report.gatePixelBlue.maximum>report.gatePixelBlue.quiet+.1,'maximum glow visible in the composited gate crop')

const c=n=>actx.cases.find(x=>x.name===n).review
assert.ok(Math.abs(c('low-spectrum').atmosphere.level-.39)<1e-10)
assert.ok(Math.abs(c('high-spectrum').atmosphere.level-.39)<1e-10)
assert.ok(c('low-spectrum').response.tint<0&&c('high-spectrum').response.tint>0)
assert.equal(c('invalid-brightness').response.tint,0)
assert.ok(Math.abs(c('maximum').actual.far-66)<1e-10);assert.ok(Math.abs(c('maximum').atmosphere.level-.65)<1e-10)
assert.equal(c('high-spectrum').actual.far,74);assert.ok(Math.abs(c('dense').actual.far-69.2)<1e-10)
for(const [name,a,b]of [['brightness','low-spectrum','high-spectrum'],['density','high-spectrum','dense']] as const){
 const pixels=compare(`${dir}/after/context-${a}.png`,`${dir}/after/context-${b}.png`);assert.ok(pixels>0,name);report.controlled.push({change:name,rawAE:pixels})
}
for(const label of ['before','after']){const {samples}=await load(`${label}/whole-frame-cost`);report.wholeFrame[label]={samples:samples.length,calls:[...new Set(samples.map(x=>x.calls))],triangles:[...new Set(samples.map(x=>x.triangles))],geometries:[...new Set(samples.map(x=>x.geometries))],textures:[...new Set(samples.map(x=>x.textures))]}}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2));console.log('PASS: actual gate/haze/fog delivery, controlled intensity/activity/brightness, protected foreground and eight Manual pixel pairs');console.log(JSON.stringify(report.wholeFrame))

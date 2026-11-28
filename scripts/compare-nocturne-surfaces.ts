// NT09 generated-scene image measurements. Display RGB, not physical radiance.
import {readFile,writeFile,readdir} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import assert from 'node:assert/strict'
const baseline=process.env.ECHO_NT09_BASELINE||'f0485eb'
const root='docs/evidence/nocturne/nt09',dir=root+'/surfaces'
const evidence=JSON.parse(await readFile(dir+'/verification.json','utf8'))
function pixels(name,crop){
 const r=spawnSync('magick',[`${dir}/${name}.png`,'-crop',crop,'+repage','-alpha','off','-colorspace','sRGB','-depth','8','rgb:-'],{maxBuffer:4e6})
 assert.equal(r.status,0,r.stderr?.toString());return r.stdout
}
function summary(buffer){
 const mean=[0,0,0];for(let i=0;i<buffer.length;i++)mean[i%3]+=buffer[i]/(buffer.length/3)
 return {meanRGB:mean,cyan:(mean[1]+mean[2])/2-mean[0],magenta:(mean[0]+mean[2])/2-mean[1]}
}
function difference(a,b){let changed=0,absolute=0,max=0;assert.equal(a.length,b.length)
 for(let i=0;i<a.length;i+=3){let any=false;for(let c=0;c<3;c++){const v=Math.abs(a[i+c]-b[i+c]);absolute+=v;max=Math.max(max,v);any||=v>0}changed+=any?1:0}
 return {changedPixels:changed,meanAbsoluteRGB:absolute/a.length,maxChannelDifference:max}
}
const crops={floor:'550x180+460+530',leftWall:'40x140+470+325',rightWall:'120x220+1050+220'}
const report:Record<string,any>={baseline,method:'Matched1440x810 browser screenshots; all atmosphere outputs zero, other fixture emitters/points zero. Fixed crop measurements use8-bit display RGB, not radiance. Reflection/spill suppression temporary diagnostics only.',crops,levels:[],causal:[],supporting:[],protectedFiles:[],productionPairs:[]}
for(const quality of ['standard','low']){
 for(const channel of ['magentaMain','cyanPanel']){
  const color=channel==='cyanPanel'?'cyan':'magenta',wall=channel==='cyanPanel'?'leftWall':'rightWall'
  const off=pixels(`${quality}-off`,crops.floor)
  const quiet=pixels(`${quality}-${channel}-0.25`,crops.floor),bright=pixels(`${quality}-${channel}-0.75`,crops.floor)
  const measures=[off,quiet,bright].map(summary)
  assert.ok(measures[1][color]>measures[0][color]+.1,`${quality}/${channel} floor responds`)
  assert.ok(measures[2][color]>measures[1][color],`${quality}/${channel} floor increases`)
  report.levels.push({quality,channel,off:measures[0],quiet:measures[1],bright:measures[2],offToBright:difference(bright,off)})
  for(const component of ['reflection','spill']){
   const crop=component==='reflection'?crops.floor:crops[wall]
   const normal=pixels(`${quality}-${channel}-0.75`,crop),suppressed=pixels(`${quality}-${channel}-no-${component}`,crop),diff=difference(normal,suppressed)
   assert.ok(diff.changedPixels>100&&diff.maxChannelDifference>3,`${quality}/${channel}/${component} contribution`)
   report.causal.push({quality,channel,component,crop,normal:summary(normal),suppressed:summary(suppressed),difference:diff})
  }
 }
 for(const name of ['violet','violetSecondary','cyanWindows','cyanDetails','bridge-0','bridge-5']){
  const diff=difference(pixels(`${quality}-${name}`,crops.floor),pixels(`${quality}-off`,crops.floor))
  report.supporting.push({quality,name,difference:diff})
 }
}
for(const c of evidence.captures){
 assert.ok(c.floor.uniforms.every(x=>!['time','energy','intensity','audio'].includes(x)))
 assert.ok(Object.values(c.atmosphere).every(x=>x===0));assert.deepEqual(c.camera,[0,1.6,5])
 if(c.drive.channel==='bridge')assert.equal(c.points.find(x=>x.channel==='bridge').intensity,.48/6*40)
}
assert.equal(difference(pixels('standard-cyanPanel-0.75',crops.floor),pixels('reduced-cyanPanel',crops.floor)).changedPixels,0)
assert.equal(difference(pixels('standard-off',crops.floor),pixels('reduced-off',crops.floor)).changedPixels,0)
for(const quality of ['standard','low'])for(const state of ['off','cyan-on']){
 const r=spawnSync('magick',['compare','-metric','AE',`${root}/production/${quality}-${state}.png`,`${dir}/${quality}-${state==='off'?'off':'cyanPanel-0.75'}.png`,'null:'],{encoding:'utf8'})
 assert.ok(r.status===0||r.status===1,r.stderr);assert.equal(Number.parseFloat(r.stderr),0)
 report.productionPairs.push({name:`${quality}-${state}`,rawAE:r.stderr.trim()})
}
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat()}
// Task began clean at this commit. Compare bytes against Git rather than a reconstructed baseline.
for(const file of await files('src')){
 const original=spawnSync('git',['show',`${baseline}:${file}`],{maxBuffer:4e6});assert.equal(original.status,0)
 const current=await readFile(file);assert.ok(current.equals(original.stdout),file)
 report.protectedFiles.push({file,sha256:createHash('sha256').update(current).digest('hex')})
}
report.decision='Existing reflection and local point/material response sufficient for NT09. Preserve production implementation; no additional highlight shader, audio uniform, lighting or material tuning.'
await writeFile(root+'/comparison.json',JSON.stringify(report,null,2))
console.log(`PASS: matched local floor/wall influence at both qualities; reduced static parity; all ${report.protectedFiles.length} source files unchanged`)

// NT13 proposal verification only. Production remains unchanged.
import {readFile,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const dir='docs/evidence/nocturne/nt13/spill-candidate',e=JSON.parse(await readFile(dir+'/verification.json','utf8'))
const captures=n=>e.captures.find(x=>x.name===n),report:Record<string,any>={proposal:{AudioOnlyGains:{magentaMain:1.5,cyanWindows:2,cyanDetails:2},cap:'original full point intensity',unchanged:'all emitters, approved cyan panel and its point, violet, bridge, atmosphere, Manual, geometry, camera, MI'},pairs:[],protectedFiles:[]}
function meanRGB(name,crop){const r=spawnSync('magick',[`${dir}/${name}.png`,'-crop',crop,'+repage','-colorspace','sRGB','-format','%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]','info:'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim().split(' ').map(Number)}
for(const quality of ['standard','low'])for(const preset of ['bass','dense','silence']){
 const a=captures(`${quality}-${preset}-current`),b=captures(`${quality}-${preset}-candidate`)
 assert.deepEqual(a.emitters,b.emitters);assert.deepEqual(a.atmosphere,b.atmosphere);assert.deepEqual(a.camera,b.camera)
 b.points.forEach((p,i)=>{const old=a.points[i];const gain=report.proposal.AudioOnlyGains[p.channel]??1;assert.equal(p.intensity,Math.min(p.full,old.intensity*gain));if(p.channel==='cyanPanel')assert.equal(p.intensity,old.intensity)})
 assert.deepEqual(a.resources,b.resources)
 const pair:Record<string,any>={quality,preset,pointsBefore:a.points,pointsCandidate:b.points,floorBefore:meanRGB(a.name,'550x180+460+530'),floorCandidate:meanRGB(b.name,'550x180+460+530'),rightWallBefore:meanRGB(a.name,'120x220+1050+220'),rightWallCandidate:meanRGB(b.name,'120x220+1050+220')}
 if(preset!=='silence'){assert.ok(pair.floorCandidate.reduce((x,y)=>x+y)>pair.floorBefore.reduce((x,y)=>x+y));assert.ok(pair.rightWallCandidate.reduce((x,y)=>x+y)>pair.rightWallBefore.reduce((x,y)=>x+y))}
 else {const r=spawnSync('magick',['compare','-metric','AE',`${dir}/${a.name}.png`,`${dir}/${b.name}.png`,'null:'],{encoding:'utf8'});assert.equal(Number.parseFloat(r.stderr),0);pair.silenceRawAE=r.stderr.trim()}
 report.pairs.push(pair)
}
const manual=captures('standard-manual-all-on');assert.ok(manual.emitters.every(x=>x.intensity===1.3)&&manual.points.every(x=>x.intensity===x.full))
const manifest=JSON.parse(await readFile('docs/evidence/nocturne/nt12/deterministic-results.json','utf8'))
for(const p of manifest.protectedFiles){const bytes=await readFile(p.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.file);report.protectedFiles.push(p)}
await writeFile(dir+'/comparison.json',JSON.stringify(report,null,2));console.log('PASS: local floor/wall lift at both qualities; exact emitter/approved cyan/atmosphere preservation, silence parity, Manual full levels; all90 production sources unchanged')

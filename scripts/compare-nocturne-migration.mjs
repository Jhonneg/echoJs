// Compare NT04 captures and prove production source was untouched during verification.
import { spawnSync } from 'node:child_process'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import assert from 'node:assert/strict'
const baseline=process.env.ECHO_NT04_SOURCE_BASELINE
assert.ok(baseline,'Set ECHO_NT04_SOURCE_BASELINE to the task-start snapshot containing src/')
const root='docs/evidence/nocturne/nt04',comparison={manual:[],checks:[],protectedFiles:[]}
function pixels(a,b,crop){const args=['compare','-metric','AE'];if(crop)args.push('-extract',crop);args.push(a,b,'null:');const r=spawnSync('magick',args,{encoding:'utf8'});assert.ok(r.status===0||r.status===1,r.stderr);return Number.parseFloat(r.stderr)}
for(const name of ['audio-idle','manual-desktop-standard','manual-desktop-low','manual-wide-standard','manual-wide-low','manual-portrait-standard','manual-portrait-low','manual-panel-off']){
 const count=pixels(`${root}/legacy/${name}.png`,`${root}/production/${name}.png`)
 assert.equal(count,0,name);comparison.manual.push({name,differingPixels:count})
}
comparison.reducedPointerPixels=pixels(`${root}/production/reduced-centered.png`,`${root}/production/reduced-pointer.png`)
assert.equal(comparison.reducedPointerPixels,0,'Reduced-motion pointer frame')
for(const name of ['zero-reactivity','paused','disconnected']){
 const count=pixels(`${root}/production/audio-idle.png`,`${root}/production/${name}.png`,'1440x500+0+0')
 assert.equal(count,0,name);comparison.checks.push({name,upperSceneDifferingPixels:count})
}
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat()}
for(const file of await files('src')){const now=await readFile(file),before=await readFile(join(baseline,file));assert.ok(now.equals(before),file);comparison.protectedFiles.push({file,sha256:createHash('sha256').update(now).digest('hex')})}
comparison.mixedAudioNote='Calibrated MI broad groups and atmosphere are intentionally lower than legacy soft-knee normalization; owner review required. Panel coefficients preserved.'
await writeFile(root+'/comparison.json',JSON.stringify(comparison,null,2))
console.log(`PASS: eight legacy/manual parity pairs, reduced-pointer equality, three recovered-state crops and ${comparison.protectedFiles.length} unchanged production files`)

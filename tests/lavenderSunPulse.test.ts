import test from 'node:test'
import assert from 'node:assert/strict'
import {createSunPulse,updateSunPulse} from '../src/scenes/lavender-peaks/sunPulse.ts'
import {createLavenderResponse} from '../src/scenes/lavender-peaks/response.ts'
const fixture=()=>{const r=createLavenderResponse();r.session=1;r.fresh=true;return {r,s:createSunPulse()}}
function run(f:ReturnType<typeof fixture>,n=120,gain=1,reduced=false){for(let i=0;i<n;i++)updateSunPulse(f.s,f.r,1/60,gain,reduced);return f.s.value}
test('sun body and attacks follow low bands only, with original weighted blend',()=>{
 for(let i=0;i<6;i++){const f=fixture();f.r.ridges[i].target=.5;assert.equal(run(f)>.09,i>=4)}
 const f=fixture();f.r.ridges[4].target=.5;const body=run(f);f.r.ridges[4].accent=.5
 const attack=run(f,6);assert.ok(attack>body*4);assert.ok(attack<=.5)
 f.r.ridges[4].accent=0;assert.ok(run(f)>body*.99);assert.ok(f.s.value<body*1.01)
})
test('sun releases during silence/stale; gain0 and reduced motion suppress pulse immediately',()=>{
 const f=fixture();f.r.ridges[4].target=.5;run(f);const before=f.s.value;f.r.fresh=false
 assert.ok(run(f,1)>0&&f.s.value<before);assert.equal(run(f,180),0)
 f.r.fresh=true;run(f);assert.equal(run(f,1,0),0);run(f);assert.equal(run(f,1,1,true),0)
})
test('sun resets old sessions and does not apply gain twice or mutate corona inputs',()=>{
 const a=fixture(),b=fixture();a.r.ridges[4].target=b.r.ridges[4].target=.25
 assert.equal(run(a,120,.5),run(b,120,1))
 const original=structuredClone(a.r);run(a,1);assert.deepEqual(a.r,original)
 a.r.session++;a.r.fresh=false;assert.equal(run(a,1),0)
})

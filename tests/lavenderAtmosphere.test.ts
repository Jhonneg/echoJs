import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtmosphere,updateAtmosphere} from '../src/scenes/lavender-peaks/atmosphere.ts'
import {createLavenderResponse,updateLavenderResponse} from '../src/scenes/lavender-peaks/response.ts'
const fixture=()=>{const r=createLavenderResponse();r.session=1;r.fresh=true;return {r,s:createAtmosphere()}}
function run(f,n=600,gain=1,reduced=false,hz=60){for(let i=0;i<n;i++)updateAtmosphere(f.s,f.r,1/hz,gain,reduced);return f.s}
test('quiet stays unchanged; quiet/loud and sparse/busy context stay distinguishable and bounded',()=>{
 const quiet=fixture();run(quiet);assert.equal(quiet.s.density+quiet.s.warmth,0)
 const values:any[]=[]
 for(const intensity of [.02,.12,.5]){const f=fixture();f.r.context.intensity=intensity;f.r.context.brightnessValid=true;f.r.context.brightness=.6;run(f);values.push(f.s.density);assert.ok(f.s.warmth>0&&f.s.warmth<1)}
 assert.ok(values[0]<values[1]&&values[1]<values[2])
 const sparse=fixture(),busy=fixture();sparse.r.context.intensity=busy.r.context.intensity=.2;busy.r.context.activity=1
 run(sparse);run(busy);assert.ok(busy.s.density>sparse.s.density+.3);assert.ok(busy.s.density<1)
})
test('events and invalid brightness cannot flash or warm the atmosphere',()=>{
 const f=fixture();f.r.context.intensity=.4;f.r.context.brightness=1;f.r.ridges.forEach(r=>r.accent=1)
 run(f,1);assert.ok(f.s.density<.006);assert.equal(f.s.warmth,0)
 f.r.context.brightnessValid=true;run(f);assert.ok(f.s.warmth>0)
 f.r.context.brightnessValid=false;const old=f.s.warmth;run(f,60);assert.ok(f.s.warmth<old)
})
test('stale releases smoothly; gain0 and sessions clear; gain applied once',()=>{
 const full=fixture(),half=fixture();full.r.context.intensity=half.r.context.intensity=.4
 run(full);run(half,600,.5);assert.ok(Math.abs(half.s.density/full.s.density-.5)<1e-10)
 half.r.fresh=false;const old=half.s.density;run(half,1);assert.ok(half.s.density<old&&half.s.density>0)
 run(half,3600);assert.equal(half.s.density,0)
 assert.equal(run(full,1,0).density,0);run(full);full.r.session++;full.r.fresh=false;assert.equal(run(full,1).density,0)
})
test('reduced response is slower, cadence independent, invalid deltas do not jump; response not mutated',()=>{
 const normal=fixture(),reduced=fixture();normal.r.context.intensity=reduced.r.context.intensity=.4
 run(normal,60);run(reduced,60,1,true);assert.ok(reduced.s.density<normal.s.density)
 const levels:any[]=[]
 for(const hz of [30,60,120]){const f=fixture();f.r.context.intensity=.3;run(f,hz*3,1,false,hz);levels.push(f.s.density)}
 assert.ok(Math.max(...levels)-Math.min(...levels)<1e-10)
 const f=fixture();f.r.context.intensity=.4;const before=structuredClone(f.r)
 for(const dt of [NaN,Infinity,-1])updateAtmosphere(f.s,f.r,dt,1,false)
 assert.equal(f.s.density,0);assert.deepEqual(f.r,before)
})
test('context is copied during the single borrowed MI read, clamped and invalidated on stale input',()=>{
 const r=createLavenderResponse();let reads=0
 const view:any={session:1,frame:1,sequence:0,status:'active',updatedAtSeconds:1,events:[],
  energy:{six:{air:0,presence:0,highMids:0,lowMids:0,bass:0,subBass:0}},
  context:{intensity:.2,activity:2,brightness:.7,brightnessValid:true}}
 const reader={read:()=>{reads++;return view}}
 updateLavenderResponse(r,reader,1/60,1,1,false);assert.equal(reads,1)
 assert.deepEqual(r.context,{intensity:.2,activity:1,brightness:.7,brightnessValid:true})
 view.context.intensity=.9;assert.equal(r.context.intensity,.2)
 updateLavenderResponse(r,reader,1/60,2,1,false)
 assert.deepEqual(r.context,{intensity:0,activity:0,brightness:0,brightnessValid:false})
})

test('layer mist: farther ridges get more, the frontmost none, fading upward from each base', async () => {
  const { LAYER_MIST, layerMist, atmosphereRidge } = await import('../src/scenes/lavender-peaks/atmosphere.ts')
  const { ridges } = await import('../src/scenes/lavender-peaks/terrain.ts')
  assert.equal(LAYER_MIST.strength.length, ridges.length)
  for (let i = 1; i < LAYER_MIST.strength.length; i++) assert.ok(LAYER_MIST.strength[i] < LAYER_MIST.strength[i - 1], 'less mist on nearer ridges')
  assert.equal(layerMist(ridges.length - 1, 0), 0, 'the frontmost ridge has no mist')
  for (let i = 0; i < ridges.length - 1; i++) {
    assert.equal(layerMist(i, 0), LAYER_MIST.strength[i], 'full at the base band')
    let previous = Infinity
    for (let above = 0; above <= 5; above += 0.25) { const m = layerMist(i, above); assert.ok(m <= previous && m >= 0); previous = m }
    assert.ok(layerMist(i, 4) < LAYER_MIST.strength[i] * 0.1, 'mostly gone a few units up')
  }
  assert.equal(layerMist(0, Number.NaN), 0)
  assert.ok(atmosphereRidge.includes('layerMistColor'), 'the ridge shader applies the mist')
})

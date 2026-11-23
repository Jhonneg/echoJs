import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createLavenderResponse, updateLavenderResponse, RIDGE_BANDS, lavenderDrive} from '../src/scenes/lavender-peaks/response.ts'
import {createMusicFeatureStore} from '../src/audio/musicFeatures.ts'
import {RIDGE_SHADING} from '../src/scenes/lavender-peaks/shading.ts'

function fixture() {
  const state=createLavenderResponse()
  const view={version:1,session:1,frame:0,sequence:0,updatedAtSeconds:1,status:'active',
    energy:{low:0,mid:0,high:0,overall:0,six:Object.fromEntries(RIDGE_BANDS.map(b=>[b,0]))},
    context:{intensity:0,brightness:0,brightnessValid:false,activity:0},events:[]}
  const reader={read:()=>view}; let time=1
  function step({energy={},event,gain=1,reduced=false,fresh=true}={}) {
    time+=1/60;view.frame++;if(fresh)view.updatedAtSeconds=time
    Object.assign(view.energy.six,energy)
    view.energy.low=Math.hypot(view.energy.six.bass,view.energy.six.subBass)
    view.events=event?[{session:view.session,sequence:++view.sequence,band:event,timeSeconds:time,emittedAtSeconds:time,strength:1}]:[]
    return updateLavenderResponse(state,reader,1/60,time,gain,reduced)
  }
  function run(n,options){for(let i=0;i<n;i++)step(options);return state}
  const now=()=>time
  step()
  return {state,view,reader,step,run,now}
}

test('six independent calibrated responses preserve weak/loud ordering without global intensity drive',()=>{
  for(let band=0;band<6;band++){
    const f=fixture();f.view.context.intensity=1;f.view.energy.overall=1
    f.run(300,{energy:{[RIDGE_BANDS[band]]:.0424}})
    const quiet=f.state.ridges[band].sustained
    assert.ok(quiet>.14&&quiet<.15)
    f.run(300,{energy:{[RIDGE_BANDS[band]]:.1413}})
    assert.ok(f.state.ridges[band].sustained>quiet*2.4)
    f.state.ridges.forEach((x,i)=>{if(i!==band)assert.equal(x.sustained,0);assert.equal(x.accent,0)})
  }
  assert.equal(lavenderDrive(0),0);assert.equal(lavenderDrive(NaN),0);assert.ok(lavenderDrive(1)<1)
})

test('qualified events address only rising energy in their own broad/narrow bands',()=>{
  for(let band=0;band<6;band++){
    const f=fixture();f.run(12)
    f.run(4,{energy:{[RIDGE_BANDS[band]]:.3}})
    f.step({event:['high','high','mid','mid','low','low'][band]})
    assert.ok(f.state.ridges[band].accent>.9)
    f.state.ridges.forEach((x,i)=>{if(i!==band)assert.equal(x.accent,0)})
    f.run(200);assert.equal(f.state.ridges[band].accent,0)
  }
})

test('low-mid attack beside held high mids cannot fire a high-mid accent',()=>{
  const f=fixture();f.run(120,{energy:{highMids:.3}})
  f.run(4,{energy:{lowMids:.3}});f.step({event:'mid'})
  assert.equal(f.state.ridges[2].accent,0);assert.ok(f.state.ridges[3].accent>.9)
})

test('delayed publication qualifies the band at peak time and history storage stays bounded',()=>{
  const f=fixture();f.run(120)
  f.run(3,{energy:{highMids:.3}})
  const peak=f.now()
  f.run(6,{energy:{highMids:0}})
  f.view.sequence=1;f.view.events=[{session:1,sequence:1,band:'mid',strength:.7,timeSeconds:peak,emittedAtSeconds:f.now()}]
  updateLavenderResponse(f.state,f.reader,1/60,f.now(),1,false)
  assert.ok(f.state.ridges[2].accent>.6)
  assert.equal(f.state.times.length,64);assert.equal(f.state.energies.length,384);assert.equal(f.state.rises.length,384)
  assert.ok(f.state.count<=64)
})

test('events are deduplicated, including repeated render reads and disabled-to-enabled transitions',()=>{
  const f=fixture();f.run(10);f.run(4,{energy:{highMids:.3}});f.step({event:'mid'})
  const first=f.state.ridges[2].accent,count=f.state.count
  updateLavenderResponse(f.state,f.reader,1/60,f.now()+.01,1,false)
  assert.ok(f.state.ridges[2].accent<first);assert.equal(f.state.count,count)
  updateLavenderResponse(f.state,f.reader,1/60,f.now()+.02,0,false)
  assert.ok(f.state.ridges.every(x=>x.sustained===0&&x.accent===0))
  updateLavenderResponse(f.state,f.reader,1/60,f.now()+.03,1,false)
  assert.equal(f.state.ridges[2].accent,0)
})

test('session reset and scene re-entry discard retained onsets and old scalar histories',()=>{
  const f=fixture();f.run(10);f.run(4,{energy:{bass:.4}});f.step({event:'low'})
  assert.ok(f.state.ridges[4].accent>0)
  f.view.session++;f.view.sequence=1;f.view.events=[{session:f.view.session,sequence:1,band:'low',timeSeconds:f.now(),emittedAtSeconds:f.now(),strength:1}]
  updateLavenderResponse(f.state,f.reader,0,f.now(),1,false)
  assert.equal(f.state.count,1);assert.equal(f.state.ridges[4].accent,0)
  const reentry=createLavenderResponse();updateLavenderResponse(reentry,f.reader,1/60,f.now(),1,false)
  assert.equal(reentry.ridges[4].accent,0)
})

test('stale, inactive, priming and future publications clear accents and release sustained response',()=>{
  for(const invalid of ['stale','inactive','priming','future']){
    const f=fixture();f.run(120,{energy:{bass:.4}});f.step({event:'low'})
    if(invalid==='inactive'||invalid==='priming')f.view.status=invalid
    else f.view.updatedAtSeconds=f.now()+(invalid==='future'?1:-1)
    updateLavenderResponse(f.state,f.reader,1/60,f.now(),1,false)
    assert.equal(f.state.fresh,false);assert.equal(f.state.count,0);assert.equal(f.state.ridges[4].accent,0)
    for(let i=0;i<1200;i++)updateLavenderResponse(f.state,f.reader,1/60,f.now()+i/60,1,false)
    assert.equal(f.state.ridges[4].sustained,0)
  }
})

test('old, wrong-session, malformed and future events cannot create accents',()=>{
  for(const change of [{session:99},{emittedAtSeconds:-1},{emittedAtSeconds:99},{timeSeconds:99},{timeSeconds:NaN}]){
    const f=fixture();f.run(10);f.run(4,{energy:{highMids:.4}})
    f.view.events=[{session:1,sequence:1,band:'mid',strength:1,timeSeconds:f.now(),emittedAtSeconds:f.now(),...change}];f.view.sequence=1
    updateLavenderResponse(f.state,f.reader,1/60,f.now(),1,false)
    assert.equal(f.state.ridges[2].accent,0)
  }
})

test('reduced motion suppresses attacks while permitting calm sustained response',()=>{
  const f=fixture();f.run(120,{energy:{bass:.4,highMids:.4},event:'low',reduced:true})
  assert.equal(f.state.count,0)
  assert.ok(f.state.ridges[2].sustained>.5);assert.ok(f.state.ridges.every(x=>x.accent===0))
})

test('borrowed publication reuse cannot rewrite retained scalar history',()=>{
  const f=fixture(),store=createMusicFeatureStore();store.publish({...f.view,sampleRate:48000,fftSize:2048})
  const state=createLavenderResponse();updateLavenderResponse(state,store.reader,1/60,f.now(),1,false)
  const before=Array.from(state.energies)
  f.view.energy.six.highMids=.9;store.publish({...f.view,updatedAtSeconds:f.now()+.01,sampleRate:48000,fftSize:2048})
  assert.deepEqual(Array.from(state.energies),before)
  updateLavenderResponse(state,store.reader,1/60,f.now()+.01,1,false)
  assert.equal(state.energies[2],0);assert.equal(state.energies[8],.9)
})

test('sustained response is comparable at30/60/120Hz and invalid inputs stay finite',()=>{
  const levels=[]
  for(const hz of [30,60,120]){
    const f=fixture();f.view.energy.six.highMids=.2
    for(let i=0;i<hz;i++){f.view.frame++;f.view.updatedAtSeconds=2+i/hz;updateLavenderResponse(f.state,f.reader,1/hz,2+i/hz,1,false)}
    levels.push(f.state.ridges[2].sustained)
    f.view.energy.six.highMids=NaN;updateLavenderResponse(f.state,f.reader,NaN,3,1,false)
    assert.ok(Number.isFinite(f.state.ridges[2].sustained))
  }
  assert.ok(Math.max(...levels)-Math.min(...levels)<1e-10)
})

test('equal-band rises have distinct depth dynamics without changing zero-input or gain bounds',()=>{
  const f=fixture();f.run(15,{energy:Object.fromEntries(RIDGE_BANDS.map(b=>[b,.3]))})
  for(let i=1;i<6;i++)assert.ok(f.state.ridges[i-1].sustained>f.state.ridges[i].sustained)
  assert.equal(RIDGE_SHADING.length,6)
  for(const s of RIDGE_SHADING){assert.ok(s.upper+s.accent<1);assert.ok(s.lower>=0&&s.lower<=.1)}
  f.step({gain:0});assert.ok(f.state.ridges.every(x=>x.sustained===0&&x.accent===0))
})

test('Lavender retains its MI input alongside the migrated Bloom and existing Crimson delivery',()=>{
  const app=readFileSync('src/App.tsx','utf8')
  assert.match(app,/<LavenderPeaksScene quality=\{quality\} musicFeatures=\{analysis.musicFeatures!\}/)
  for(const file of ['LavenderPeaksScene.tsx','motion.ts','response.ts']){
    const source=readFileSync('src/scenes/lavender-peaks/'+file,'utf8')
    assert.doesNotMatch(source,/AudioSignal|signal\.(fast|slow|transient|flux|intensity|sixBands)|signal=\{/)
  }
  assert.match(app,/<BloomScene musicFeatures=\{analysis.musicFeatures!\}/)
  assert.match(app,/<CrimsonHorizonScene.*signal=\{analysis.signal\}/)
})

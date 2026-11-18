import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createOnsetDetector,ONSET_BANDS,ONSET_SETTINGS} from '../src/dev/audioLab/onsets.ts'
import {createEnergy,createEnergyMeter} from '../src/dev/audioLab/energy.ts'
import {onsetFixtures,compareOnsets,assessOnsets} from '../src/dev/audioLab/onsetComparison.ts'

const silence=()=>new Float32Array(1024).fill(-Infinity)
function setup(){const detector=createOnsetDetector(48000,2048),meter=createEnergyMeter(48000,2048),energy=createEnergy();let time=0;return {detector,step(bins=silence(),dt=1/60,active=true){time+=dt;meter.update(bins,energy);return detector.update(bins,energy.rms,time,active)}}}
const bin=(value)=>{const bins=silence();if(value>0)bins[43]=20*Math.log10(value);return bins}
function median(values){const sorted=[...values].sort((a,b)=>a-b);return sorted.length%2?sorted[Math.floor(sorted.length/2)]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2}
test('adaptive median/MAD excludes current novelty and expires history in seconds',()=>{
  const x=setup(),prior=[];let magnitude=0,time=0
  for(let i=0;i<180;i++){
    const dt=i%2?1/120:1/30;time+=dt;magnitude+=([.0001,.001,.002,.0004,.003][i%5])
    const eligible=prior.filter(p=>p.time>=time-1).map(p=>p.value)
    const m=eligible.length?median(eligible):0,mad=eligible.length?median(eligible.map(v=>Math.abs(v-m))):0
    const view=x.step(bin(magnitude),dt)
    assert.ok(Math.abs(view.debug.mid.threshold-Math.max(.0005,m+3*mad))<1e-10)
    prior.push({time,value:view.debug.mid.novelty})
  }
})
test('one attack emits one immutable event with observed peak/emission clocks and stronger inputs produce stronger events',()=>{
  let previous=0
  for(const db of [-36,-24,-12,-6]){
    const x=setup();for(let i=0;i<30;i++)x.step()
    for(let i=0;i<180;i++)x.step(bin(.21*10**(db/20)))
    for(let i=0;i<30;i++)x.step()
    const events=x.detector.view.events
    assert.equal(events.length,1);assert.equal(events[0].band,'mid');assert.equal(events[0].sequence,1)
    assert.ok(events[0].emittedAtSeconds>events[0].timeSeconds);assert.ok(Object.isFrozen(events[0]))
    assert.ok(events[0].strength>previous);previous=events[0].strength
  }
})
test('spacing suppresses close peaks without queueing them and other bands remain independent',()=>{
  const x=setup();for(let i=0;i<30;i++)x.step()
  const all=silence();all[4]=all[43]=all[341]=-20
  x.step(all);x.step()
  assert.deepEqual(x.detector.view.events.map(e=>e.band),['low','mid','high'])
  for(let i=0;i<4;i++)x.step()
  x.step(all);x.step()
  assert.equal(x.detector.view.events.length,3)
  for(let i=0;i<10;i++)x.step()
  assert.equal(x.detector.view.events.length,3)
  x.step(all);x.step()
  assert.equal(x.detector.view.events.length,6)
})
test('falling energy and quiet noise do not become attacks; reset/invalid/gap primes without events',()=>{
  const x=setup();for(let i=0;i<30;i++)x.step()
  x.step(bin(.1));x.step(bin(.1))
  const shifted=bin(.07);shifted[44]=20*Math.log10(.04)
  for(let i=0;i<8;i++)x.step(shifted)
  assert.equal(x.detector.view.events.length,1)
  const session=x.detector.view.session;x.detector.reset();assert.ok(x.detector.view.session>session)
  x.step(bin(.1));x.step(bin(.1));assert.equal(x.detector.view.sequence,0)
  x.step(bin(.2),.5);x.step(bin(.2));assert.equal(x.detector.view.sequence,0)
  x.step(bin(.2),1/60,false);assert.equal(x.detector.view.primed,false)
  const y=setup();for(let i=0;i<300;i++)y.step(bin(i%2?.0002:.0001))
  assert.equal(y.detector.view.sequence,0)
  y.detector.update(silence(),{bass:NaN,midrange:0,treble:0},100)
  assert.equal(y.detector.view.primed,false)
})
test('confirmation rejects weak release sidebands but retains dominant decays and weak attacks over a steady bed',()=>{
  function mixture(low,mid){const bins=silence();if(low)bins[4]=20*Math.log10(low);if(mid)bins[43]=20*Math.log10(mid);return bins}
  for(const [peak,confirmationLow,confirmationMid,rejected] of [[.003,.03,.003,true],[.1,.03,.03,false],[.003,.1,.003,false]]){
    const x=setup()
    // Prime a stable bass bed without producing an initial event.
    for(let i=0;i<30;i++)x.step(mixture(.1,0))
    x.step(mixture(.1,peak))
    assert.equal(x.detector.view.sequence,0)
    x.step(mixture(confirmationLow,confirmationMid))
    assert.equal(x.detector.view.debug.mid.rejected.falling,rejected?1:0)
    assert.equal(x.detector.view.events.filter(e=>e.band==='mid').length,rejected?0:1)
    if(!rejected)assert.ok(Math.abs(x.detector.view.events[0].emittedAtSeconds-x.detector.view.events[0].timeSeconds-1/60)<1e-10)
  }
  // The first mixture can also represent a genuine weak new mid attack under a
  // declining bass bed. Magnitude-only attribution cannot distinguish the two;
  // its suppression is an explicit limitation, not evidence of music accuracy.
})
test('event history is bounded while the sequence and counters never replay old events',()=>{
  const x=setup()
  for(let i=0;i<900;i++)x.step(i%15===0?bin(.1):silence())
  const view=x.detector.view
  assert.ok(view.sequence>view.events.length)
  assert.ok(view.events.length<=256)
  assert.ok(view.events.every(e=>e.timeSeconds>=15-10-1e-8))
  assert.equal(view.debug.mid.accepted,view.sequence)
  assert.equal(new Set(view.events.map(e=>`${e.session}/${e.sequence}`)).size,view.events.length)
})
test('core/stress manifests cover phases without aliasing label identities; empty report fails',()=>{
  assert.equal(onsetFixtures.length,87)
  assert.equal(onsetFixtures.filter(f=>f.stress).length,9)
  for(const phase of [0,.007,.017])assert.ok(onsetFixtures.some(f=>f.phaseSeconds===phase))
  assert.equal(assessOnsets([]).pass,false)
  const fixture=onsetFixtures.find(f=>f.specimen==='burst-50-1000hz'&&f.phaseSeconds===0)
  const frames=Array.from({length:360},(_,i)=>{const time=(i+1)/120;const active=fixture.tones.find(t=>time>=t.start&&time<t.end);return {time,bins:active?bin(10**(active.db/20)):silence(),rms:0}})
  const row=compareOnsets(fixture,48000,2048,frames,120)
  assert.equal(row.expected,4);assert.equal(row.matched,4);assert.deepEqual(row.checks,{counts:true,timing:true,identity:true,reset:true})
  assert.equal(ONSET_SETTINGS.spacingSeconds,.12);assert.equal(ONSET_BANDS.length,3)
})

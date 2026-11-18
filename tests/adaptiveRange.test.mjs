import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createAdaptiveScaling,createAdaptiveView,applyAdaptive,resetAdaptiveView,RANGE_SETTINGS} from '../src/dev/audioLab/adaptive.ts'
import {createEnergy} from '../src/dev/audioLab/energy.ts'
import {createDiagnosticObserver} from '../src/dev/audioLab/diagnostics.ts'
import {silentSignal,emptyBands} from '../src/audio/signal.ts'
import {rangeFixtures,compareRange,assessRange} from '../src/dev/audioLab/rangeComparison.ts'
import {generateFixture} from '../src/dev/audioLab/fixtures.ts'

function feed(scaling,rms,seconds,hz=60) {for(let i=0;i<seconds*hz;i++)scaling.update(rms,1/hz)}
test('two-second unity hold and five-second rise use elapsed seconds at all test cadences',()=>{
  const gains=[]
  for(const hz of [30,60,120]) {
    const scaling=createAdaptiveScaling()
    feed(scaling,.02,2,hz);assert.ok(Math.abs(scaling.state.gain-1)<1e-12)
    feed(scaling,.02,5,hz);gains.push(scaling.state.gain)
    assert.ok(Math.abs(scaling.state.gain-(2-Math.exp(-1)))<1e-10)
    assert.equal(scaling.state.targetGain,2)
    assert.ok(scaling.state.gain<=2)
  }
  assert.ok(Math.max(...gains)-Math.min(...gains)<1e-10)
})
test('low-level noise cannot increase gain; silence has fast gain reduction without a signal gate',()=>{
  const scaling=createAdaptiveScaling()
  feed(scaling,.0005,60);assert.equal(scaling.state.gain,1)
  assert.equal(scaling.state.eligible,false)
  feed(scaling,.02,20);const boosted=scaling.state.gain;assert.ok(boosted>1.9)
  feed(scaling,.0005,1)
  assert.ok(Math.abs(scaling.state.gain-(1+(boosted-1)*Math.exp(-1/.3)))<1e-10)
  const energy=createEnergy(),view=createAdaptiveView();energy.rms.bass=.0005
  applyAdaptive(energy,scaling.state,view)
  assert.ok(view.broad.bass>0,'adaptation floor does not gate energy')
  feed(scaling,0,20);energy.rms.bass=0;applyAdaptive(energy,scaling.state,view)
  assert.equal(view.broad.bass,0)
})
test('one shared gain preserves ratios and never mutates fixed candidate values',()=>{
  const scaling=createAdaptiveScaling();feed(scaling,.02,30)
  const energy=createEnergy(),view=createAdaptiveView()
  energy.rms.bass=.04;energy.rms.midrange=.08;energy.rms.treble=.12;energy.six.rms.bass=.03
  const before=structuredClone(energy)
  applyAdaptive(energy,scaling.state,view)
  assert.ok(Math.abs(view.broad.midrange/view.broad.bass-2)<1e-12)
  assert.ok(Math.abs(view.broad.treble/view.broad.bass-3)<1e-12)
  assert.deepEqual(energy,before)
  const nested=view.broad;resetAdaptiveView(view)
  assert.equal(view.broad,nested);assert.deepEqual(view,createAdaptiveView())
})
test('source inactivity, discontinuities and invalid values reset gain and history',()=>{
  for(const [rms,dt,active] of [[0,.016,false],[.02,.3,true],[.02,0,true],[NaN,.016,true],[.02,Infinity,true]]) {
    const scaling=createAdaptiveScaling();feed(scaling,.02,20)
    const reference=scaling.state
    scaling.update(rms,dt,active)
    assert.equal(scaling.state,reference)
    assert.equal(reference.gain,1);assert.equal(reference.elapsed,0);assert.equal(reference.slowRms,0)
  }
  let view
  const observer=createDiagnosticObserver(s=>{view=s})
  const analyser={fftSize:2048,context:{sampleRate:48000,currentTime:0},getFloatTimeDomainData(v){v.fill(.02)}}
  const bins=new Float32Array(1024).fill(-Infinity)
  for(let i=0;i<1200;i++)observer.read(analyser,bins,silentSignal(),emptyBands(),undefined,true,i*1000/60,1/60)
  assert.ok(view.adaptive.gain>1.9)
  observer.reset();assert.deepEqual(view.adaptive,createAdaptiveView())
})
test('long fixtures and sectioned noise are deterministic without changing legacy fixtures',()=>{
  assert.equal(rangeFixtures.length,9)
  const fixture=rangeFixtures.find(f=>f.id==='range-noise-quiet-noise')
  const a=generateFixture(fixture,8000),b=generateFixture(fixture,8000)
  assert.deepEqual(a,b)
  assert.ok(a.some(v=>v!==0));assert.ok(a.every(v=>Number.isFinite(v)&&Math.abs(v)<1))
  assert.equal(RANGE_SETTINGS.floorDbfs,-50)
})
test('comparison rejects absent/duplicated measurements and records loud-step clipping fairly',()=>{
  assert.equal(assessRange([]).pass,false)
  const fixture=rangeFixtures.find(f=>f.id==='range-intro-loud-silence-1000hz')
  const bins=new Float32Array(1024).fill(-Infinity)
  const row=compareRange(fixture,48000,2048,[],60)
  assert.equal(row.checks.bounded,false)
  assert.equal(assessRange(Array.from({length:81},()=>row)).complete,false)
  const frames=Array.from({length:3960},(_,i)=>{
    const time=(i+1)/120,rms=time<.5?0:time<16.5?.0112:time<24.5?.3544:0
    const fft=bins.slice();if(rms>0)fft[43]=20*Math.log10(rms*Math.sqrt(.3046/2))
    return {time,bins:fft,rms}
  })
  const result=compareRange(fixture,48000,2048,frames,60)
  assert.equal(result.checks.hold,true);assert.equal(result.checks.floor,true)
  assert.equal(result.checks.loud,true);assert.equal(result.checks.reset,true)
  assert.ok(result.extraClippingEarlySeconds>0)
  assert.equal(result.extraClippingAfterGraceSeconds,0)
  assert.ok(result.quietMaxRatio<=2)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicAnalysis } from '../src/audio/music/analysis.ts'
import { createDiagnosticObserver } from '../src/dev/audioLab/diagnostics.ts'
import { createMusicBridge } from '../src/dev/audioLab/musicBridge.ts'
import { silentSignal, emptyBands } from '../src/audio/signal.ts'

test('production processor exactly matches validated diagnostic features without time-domain reads', () => {
  for(const rate of [44100,48000,96000]) {
    const fft=rate>48000?4096:2048, bins=new Float32Array(fft/2), signal=silentSignal(), raw=emptyBands()
    const production=createMusicAnalysis(), bridge=createMusicBridge(), observer=createDiagnosticObserver(snapshot=>bridge.publish(snapshot))
    const analyser={fftSize:fft,context:{sampleRate:rate,currentTime:0},getFloatTimeDomainData(time){time.fill(0)}}
    for(let i=1;i<=1200;i++) {
      bins.fill(-Infinity)
      const phase=i%120, db=phase<60?-12:-60
      if(phase<90) { bins[Math.round(100*fft/rate)]=db; bins[Math.round(1000*fft/rate)]=db-3; bins[Math.round(8000*fft/rate)]=db-6 }
      const active=i<1100, now=i*1000/60
      production.update(bins,rate,fft,now,active);observer.read(analyser,bins,signal,raw,undefined,active,now,1/60)
      const actual=production.reader.read(), expected=bridge.reader.read()
      assert.deepEqual(actual,expected,`rate ${rate}, tick ${i}`)
      assert.ok(actual.events.every(event=>event.session===actual.session))
    }
  }
})
test('source/seek/format/gap resets clear old events and epochs while active silence stays fresh',()=>{
  const p=createMusicAnalysis(), bins=new Float32Array(1024).fill(-Infinity)
  for(let i=1;i<180;i++)p.update(bins,48000,2048,i*1000/60,true)
  const view=p.reader.read(), session=view.session
  assert.equal(view.status,'active');assert.equal(view.energy.overall,0)
  const original=performance.now;performance.now=()=>10000
  try { p.reset(.1) } finally { performance.now=original }
  assert.equal(view.status,'inactive');assert.equal(view.updatedAtSeconds,0);assert.equal(view.sequence,0);assert.equal(view.events.length,0);assert.ok(view.session>session)
  const resetSession=view.session
  p.update(bins,48000,2048,10000,true);assert.equal(view.status,'priming');assert.ok(view.session>resetSession)
  p.update(new Float32Array(2048).fill(-Infinity),96000,4096,10016,true)
  assert.equal(view.sampleRate,96000);assert.equal(view.fftSize,4096);assert.equal(view.status,'priming')
  p.update(new Float32Array(2048).fill(-Infinity),96000,4096,11000,true)
  const formatSession=view.session;p.update(new Float32Array(2048).fill(-Infinity),96000,4096,12000,true)
  assert.ok(view.session>formatSession);assert.equal(view.events.length,0)
})

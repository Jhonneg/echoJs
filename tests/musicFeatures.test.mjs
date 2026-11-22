import test from 'node:test'
import assert from 'node:assert/strict'
import { createSnapshot } from '../src/dev/audioLab/diagnostics.ts'
import { createMusicBridge } from '../src/dev/audioLab/musicBridge.ts'
import { createMusicPilot, updateMusicPilot, onsetEnvelope } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { createJourney, updateJourney } from '../src/scenes/crimson-horizon/journey.ts'
import { silentSignal } from '../src/audio/signal.ts'
function setup() {
  const snapshot = createSnapshot(), bridge = createMusicBridge()
  snapshot.state = 'running'; snapshot.timestamp = 1000; snapshot.sampleRate = 48000; snapshot.fftSize = 2048
  snapshot.onsets.primed = snapshot.context.primed = true; snapshot.onsets.session = 1
  bridge.publish(snapshot)
  return { snapshot, bridge }
}
function event(snapshot, band, strength, time) {
  snapshot.onsets.events.push(Object.freeze({ session: snapshot.onsets.session, sequence: ++snapshot.onsets.sequence,
    band, strength, timeSeconds: time - .04, emittedAtSeconds: time }))
}
test('reader publishes exact validated controls once, reused reads do not drain and reset is explicit', () => {
  const { snapshot, bridge } = setup(), view = bridge.reader.read()
  snapshot.energy.linear.bass = .234; snapshot.energy.six.linear.air = .87
  snapshot.context.intensity = .123; snapshot.context.intensityTarget = .456
  snapshot.context.brightness = .678; snapshot.context.activity = .89; snapshot.context.brightnessValid = true
  event(snapshot, 'low', .3, 1)
  bridge.publish(snapshot)
  assert.equal(bridge.reader.read(), view); assert.equal(view.frame, 2)
  assert.equal(view.energy.low, .234); assert.equal(view.energy.overall, .456); assert.equal(view.energy.six.air, .87)
  assert.equal(view.context.intensity, .123); assert.equal(view.context.brightness, .678); assert.equal(view.context.activity, .89)
  assert.equal(view.events[0], snapshot.onsets.events[0]); assert.equal(view.sampleRate, 48000); assert.equal(view.fftSize, 2048)
  assert.equal(bridge.reader.read().sequence, 1); assert.equal(bridge.reader.read().frame, 2)
  snapshot.state = 'reset'; snapshot.onsets.session++; snapshot.onsets.sequence = 0; snapshot.onsets.events = []
  bridge.publish(snapshot); assert.equal(view.status, 'inactive'); assert.equal(view.frame, 1); assert.equal(view.events.length, 0)
})
test('independent consumers prime retained events, consume hidden events, never replay, and reject stale/reset input', () => {
  const { snapshot, bridge } = setup(), a = createMusicPilot(), b = createMusicPilot()
  const tick = (s, now, profile='candidate') => updateMusicPilot(s, bridge.reader, profile, 1/60, now, 1, false)
  event(snapshot,'low',1,1); bridge.publish(snapshot)
  tick(a,1); tick(b,1); assert.equal(a.low,0)
  event(snapshot,'low',.5,1.05); snapshot.timestamp=1050;bridge.publish(snapshot)
  tick(a,1.08);tick(b,1.08);assert.equal(a.low,.5);assert.equal(b.low,.5)
  tick(a,1.09);assert.equal(a.pulses.length,1)
  tick(a,1.1,'legacy');tick(a,1.11,'candidate');assert.equal(a.pulses.length,0);assert.ok(a.low<.5)
  tick(b,1.4);assert.equal(b.low,0);assert.equal(b.enabled,false)
  snapshot.timestamp=1500;snapshot.onsets.session++;bridge.publish(snapshot);tick(a,1.5);assert.equal(a.low,0)
})
test('isolated strengths proportional, bands independent, cadence peak variation below ten percent', () => {
  for (const band of ['low','mid','high']) {
    const peaks=[]
    for (const hz of [30,60,120]) {
      const levels=[]
      for (const strength of [.1,.3,.6,1]) {
        const { snapshot, bridge }=setup(), s=createMusicPilot()
        updateMusicPilot(s,bridge.reader,'candidate',.05,1,1,false)
        event(snapshot,band,strength,1.01);bridge.publish(snapshot)
        let peak=0
        for(let i=1;i<=hz;i++) {const now=1+i/hz;snapshot.timestamp=now*1000;bridge.publish(snapshot);updateMusicPilot(s,bridge.reader,'candidate',1/hz,now,1,false);peak=Math.max(peak,s[band]);if(band!=='low')assert.equal(s.low,0)}
        levels.push(peak);assert.ok(peak<=strength)
      }
      for(let i=1;i<levels.length;i++)assert.ok(levels[i]>levels[i-1])
      peaks.push(levels[3])
    }
    assert.ok(Math.max(...peaks)/Math.min(...peaks)<=1.1)
  }
  assert.equal(onsetEnvelope(-1),0);assert.equal(onsetEnvelope(3),0)
})
test('energy is monotonic, constant energy never pulses; motion overrides, silence and terrain clamp are safe', () => {
  let previous=0
  for(const energy of [.001,.1,.3,.6,1]) {
    const { snapshot, bridge }=setup(), p=createMusicPilot(), j=createJourney(), signal=silentSignal()
    snapshot.energy.linear.bass=energy;snapshot.context.intensityTarget=energy
    for(let i=0;i<240;i++) {const now=1+i/60;snapshot.timestamp=now*1000;bridge.publish(snapshot);updateMusicPilot(p,bridge.reader,'candidate',1/60,now,1,false);updateJourney(j,signal,1,false,1/60,now*1000,10,p)}
    assert.equal(p.low,0);assert.ok(p.speed>=previous);previous=p.speed;assert.ok(j.distance<=10);assert.ok(j.distance>=0)
    updateMusicPilot(p,bridge.reader,'candidate',1/60,5.1,0,false);updateJourney(j,signal,0,false,1/60,5100,10,p);assert.equal(j.speed,0)
    updateMusicPilot(p,bridge.reader,'candidate',1/60,5.1,1,true);updateJourney(j,signal,1,true,1/60,5100,10,p);assert.equal(j.speed,0);assert.equal(p.low,0)
  }
})
test('profile blends preserve one distance integrator, partial gain scales effects, and format priming is inactive', () => {
  const { snapshot, bridge }=setup(), p=createMusicPilot(), j=createJourney(), signal=silentSignal()
  snapshot.context.intensityTarget=.5;snapshot.energy.linear.bass=.5
  let last=0
  for(let i=1;i<600;i++) {
    const now=1+i/60;snapshot.timestamp=now*1000;bridge.publish(snapshot)
    updateMusicPilot(p,bridge.reader,i%120<60?'legacy':'candidate',1/60,now,1,false)
    updateJourney(j,signal,1,false,1/60,now*1000,Infinity,p)
    assert.ok(j.distance>=last);assert.ok(j.distance-last<=16/60+1e-9);last=j.distance
  }
  snapshot.onsets.primed=false;snapshot.fftSize=4096;snapshot.sampleRate=96000;snapshot.timestamp=12000;bridge.publish(snapshot)
  assert.equal(bridge.reader.read().status,'priming');assert.equal(bridge.reader.read().fftSize,4096)
  updateMusicPilot(p,bridge.reader,'candidate',1/60,12,1,false);assert.equal(p.enabled,false)
  snapshot.onsets.primed=true;bridge.publish(snapshot)
  updateMusicPilot(p,bridge.reader,'candidate',1/60,12,.5,false);assert.equal(p.sun,.5)
  event(snapshot,'low',1,12.01);snapshot.timestamp=12010;bridge.publish(snapshot)
  updateMusicPilot(p,bridge.reader,'candidate',1/60,12.04,.5,false);assert.equal(p.low,.5)
  snapshot.state='inactive';bridge.publish(snapshot);updateMusicPilot(p,bridge.reader,'candidate',1/60,12.05,1,false);assert.equal(p.low,0);assert.equal(p.enabled,false)
})

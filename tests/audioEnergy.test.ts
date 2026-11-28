import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEnergy, createEnergyMeter, resetEnergy, spectralRms, linearEnergy, softKneeEnergy, ENERGY_REFERENCE_RMS } from '../src/dev/audioLab/energy.ts'
import { createDiagnosticObserver } from '../src/dev/audioLab/diagnostics.ts'
import { emptyBands, silentSignal } from '../src/audio/signal.ts'
import { compareEnergy, energyFixtures, assessEnergy } from '../src/dev/audioLab/energyComparison.ts'

// Exact bin-centred sine spectrum under the specified Blackman window.
function spectrum(amplitude = 1) {
  const bins = new Float32Array(1024).fill(-Infinity)
  for (const [offset, coefficient] of [[0,.21],[-1,.125],[1,.125],[-2,.02],[2,.02]]) bins[16 + offset] = 20 * Math.log10(amplitude * coefficient)
  return bins
}
test('window correction recovers sine RMS and integrates distributed power without dividing by width', () => {
  for (const db of [-36,-24,-12,-6]) {
    const amplitude = 10 ** (db / 20), bins = spectrum(amplitude), value = spectralRms(bins,0,1024)
    assert.ok(Math.abs(20 * Math.log10(value / (amplitude / Math.SQRT2))) < 0.00001)
    const energy = createEnergy(); createEnergyMeter(48000,2048).update(bins,energy)
    assert.ok(Math.abs(energy.rms.midrange-value)<1e-12)
    assert.equal(energy.rms.bass,0); assert.equal(energy.rms.treble,0)
    assert.equal(energy.six.rms.lowMids,energy.rms.midrange)
  }
  assert.equal(spectralRms(new Float32Array([-Infinity,NaN,Infinity]),0,3),0)
  assert.ok(spectralRms(new Float32Array([-90]),0,1)>0, 'candidate does not inherit legacy -80 dB bin rejection')
  const one = spectralRms(new Float32Array([-Infinity,-30,-30]),1,2)
  assert.ok(Math.abs(spectralRms(new Float32Array([-Infinity,-30,-30]),1,3) / one - Math.SQRT2)<1e-12)
})
test('fixed candidate transfer is monotonic, bounded, stateless and preserves approved loud-end contrast', () => {
  for (const curve of [linearEnergy,softKneeEnergy]) {
    const values = [-36,-24,-12,-6].map(db=>curve(10**(db/20)/Math.SQRT2))
    assert.ok(values.every((v,i)=>v>=0&&v<=1&&(i===0||v>values[i-1])))
    assert.ok(values[3]-values[2]>=.15)
    assert.equal(curve(0),0); assert.equal(curve(NaN),0); assert.equal(curve(Infinity),0)
    assert.ok(curve(100)<=1)
    const quiet = curve(.001); curve(.5); assert.equal(curve(.001),quiet)
  }
  assert.equal(ENERGY_REFERENCE_RMS,.5)
})
test('energy comparison measures steady calibration separately from legacy controls', () => {
  const bins = spectrum(.25), frames = Array.from({length:480},(_,i)=>({time:(i+1)/120,bins,rms:.25/Math.SQRT2}))
  const fixture:any={id:'calibration-test',duration:4,tones:[{hz:375,db:20*Math.log10(.25),start:.5,end:3.5}],events:[]}
  for(const cadence of [30,60,120]) {
    const row = compareEnergy(fixture,48000,2048,frames,cadence)
    assert.ok(row.steady);assert.ok(Math.abs(row.steady.sixErrorDb)<.00001)
    assert.equal(row.finiteAndBounded,true)
    assert.ok(row.steady.legacyBroad!==row.steady.linearBroad)
  }
  assert.equal(energyFixtures.length,48)
  assert.equal(assessEnergy([]).calibrationPass,false)
  assert.ok(assessEnergy([]).curves.every(curve=>!curve.checks.monotonic))
})
test('observer exposes isolated reusable candidate values, resets them and rebuilds format ranges', () => {
  let view
  const observer=createDiagnosticObserver(snapshot=>{view=snapshot})
  const analyser={fftSize:2048,context:{sampleRate:48000,currentTime:1},getFloatTimeDomainData(data){data.fill(.1)}} as any
  const signal=silentSignal(), bins=spectrum(.25)
  observer.read(analyser,bins,signal,emptyBands(),undefined,true,1000,.016)
  assert.ok(view.energy.linear.midrange>0)
  assert.deepEqual(signal,silentSignal())
  const reference=view.energy.six.rms
  observer.reset()
  assert.equal(view.energy.six.rms,reference)
  assert.ok(Object.values(view.energy.linear).every(v=>v===0))
  analyser.context.sampleRate=44100
  observer.read(analyser,bins,signal,emptyBands(),undefined,true,1016,.016)
  assert.equal(view.sampleRate,44100)
  const energy=createEnergy();createEnergyMeter(48000,2048).update(bins,energy);resetEnergy(energy)
  assert.deepEqual(energy,createEnergy())
})

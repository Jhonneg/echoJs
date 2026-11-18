import { BAND_NAMES, SIX_BAND_NAMES } from '../../audio/signal.ts'
import { type Fixture, type Tone } from './fixtures.ts'
import { createEnergy, createEnergyMeter } from './energy.ts'
import { createAdaptiveScaling, createAdaptiveView, applyAdaptive, resetAdaptiveView, RANGE_SETTINGS, RANGE_TARGETS } from './adaptive.ts'
import { type Frame } from './baseline.ts'

interface Section { kind: 'quiet' | 'loud' | 'silence' | 'noise' | 'sustain' | 'hits'; start: number; end: number }
export interface RangeFixture extends Fixture { sections: Section[] }
const tone = (hz: number, db: number, start: number, end: number): Tone => ({ hz, db, start, end, edge: 0.002 })
const make = (id: string, tones: Tone[], sections: Section[]): RangeFixture => ({ id: `range-${id}`, duration: 33, tones, sections,
  events: tones.map(t => ({ time: t.start, band: t.hz < 250 ? 'bass' : t.hz < 4000 ? 'midrange' : 'treble' })) })
export const rangeFixtures: RangeFixture[] = [
  make('silence', [], [{ kind: 'silence', start: 0, end: 33 }]),
  { ...make('noise-60db', [], [{ kind: 'noise', start: 0, end: 33 }]), noise: -60 },
  ...[100,1000,8000].map(hz => make(`intro-loud-silence-${hz}hz`, [tone(hz,-36,.5,16.5),tone(hz,-6,16.5,24.5)],
    [{kind:'quiet',start:.5,end:16.5},{kind:'loud',start:16.5,end:24.5},{kind:'silence',start:24.5,end:33}])),
  make('loud-quiet-loud', [tone(1000,-6,.5,6.5),tone(1000,-36,6.5,22.5),tone(1000,-6,22.5,30.5)],
    [{kind:'loud',start:.5,end:6.5},{kind:'quiet',start:6.5,end:22.5},{kind:'loud',start:22.5,end:30.5},{kind:'silence',start:30.5,end:33}]),
  make('sustain', [tone(100,-24,.5,30.5)], [{kind:'sustain',start:.5,end:30.5},{kind:'silence',start:30.5,end:33}]),
  make('repeated-hits', [tone(100,-36,.5,30.5), ...Array.from({length:54},(_,i)=>tone(100,-6,3+i*.5,3.05+i*.5))],
    [{kind:'hits',start:.5,end:30.5},{kind:'silence',start:30.5,end:33}]),
  { ...make('noise-quiet-noise',[tone(1000,-36,10.5,26.5)],
    [{kind:'noise',start:0,end:10.5},{kind:'quiet',start:10.5,end:26.5},{kind:'noise',start:26.5,end:33}]),
    noiseSegments:[{start:0,end:10.5,db:-60},{start:26.5,end:33,db:-60}] },
]
export function compareRange(fixture: RangeFixture, rate: number, fft: number, frames: Frame[], cadence: number) {
  const meter = createEnergyMeter(rate,fft), energy = createEnergy(), scaling = createAdaptiveScaling(), view = createAdaptiveView()
  let extraClippingSeconds=0, adaptiveClippingSeconds=0, fixedClippingSeconds=0
  let previous = 0, gainMin = Infinity, gainMax = 1, noiseMax = 0, silenceMax = 0, quietMaxRatio = 0
  let holdViolations = 0, floorIncreaseViolations = 0, bounded = true, extraClippingAfterGraceSeconds = 0, extraClippingEarlySeconds = 0
  const sections = fixture.sections.map(s => ({...s, samples:0, seconds:0, gainMin:Infinity, gainMax:1, gainMean:0, fixedMean:0, adaptiveMean:0,extraClippingSeconds:0}))
  const gainSamples: {time:number,gain:number}[] = []
  const windowMargin = (fft + 128) / rate
  for(let i=120/cadence-1; i<frames.length; i+=120/cadence) {
    const frame=frames[i], dt=frame.time-previous; previous=frame.time
    const before=scaling.state.gain
    meter.update(frame.bins,energy)
    const state=scaling.update(frame.rms,dt)
    applyAdaptive(energy,state,view)
    gainSamples.push({time:frame.time,gain:state.gain})
    gainMin=Math.min(gainMin,state.gain);gainMax=Math.max(gainMax,state.gain)
    bounded &&= Number.isFinite(state.gain)&&state.gain>=1&&state.gain<=2
    if(state.elapsed<=2+1e-9 && Math.abs(state.gain-1)>1e-12)holdViolations++
    if(frame.rms<10**(-50/20) && state.gain>before+1e-12)floorIncreaseViolations++
    const fixed=[...BAND_NAMES.map(b=>energy.linear[b]),...SIX_BAND_NAMES.map(b=>energy.six.linear[b])]
    const adaptive=[...BAND_NAMES.map(b=>view.broad[b]),...SIX_BAND_NAMES.map(b=>view.six[b])]
    bounded &&= adaptive.every(v=>Number.isFinite(v)&&v>=0&&v<=1)
    const peak=Math.max(...adaptive), fixedPeak=Math.max(...fixed)
    const extraClip=adaptive.some((v,index)=>v>=1 && fixed[index]<1)
    if (extraClip) extraClippingSeconds+=dt
    if (peak>=1) adaptiveClippingSeconds+=dt
    if (fixedPeak>=1) fixedClippingSeconds+=dt
    for(const section of sections) {
      if(frame.time<section.start||frame.time>=section.end)continue
      section.samples++;section.seconds+=dt
      if (extraClip) section.extraClippingSeconds+=dt
      section.gainMin=Math.min(section.gainMin,state.gain);section.gainMax=Math.max(section.gainMax,state.gain)
      section.gainMean+=state.gain*dt;section.fixedMean+=fixedPeak*dt;section.adaptiveMean+=peak*dt
      if(frame.time>=section.start+windowMargin) {
        if(section.kind==='noise')noiseMax=Math.max(noiseMax,peak)
        if(section.kind==='silence')silenceMax=Math.max(silenceMax,peak)
        if(section.kind==='quiet')quietMaxRatio=Math.max(quietMaxRatio,...adaptive.map((v,j)=>fixed[j]>0?v/fixed[j]:0))
      }
      if(section.kind==='loud'&&extraClip) {
        if(frame.time>=section.start+RANGE_TARGETS.loudGraceSeconds)extraClippingAfterGraceSeconds+=dt
        else extraClippingEarlySeconds+=dt
      }
    }
  }
  let maxHitGainDip=0
  for(const hit of fixture.tones.filter(t=>t.end-t.start<.1)) {
    const before=gainSamples.filter(s=>s.time>=hit.start-.15&&s.time<hit.start).map(s=>s.gain)
    const after=gainSamples.filter(s=>s.time>=hit.start&&s.time<=hit.start+.25).map(s=>s.gain)
    if(before.length&&after.length)maxHitGainDip=Math.max(maxHitGainDip,Math.max(...before)-Math.min(...after))
  }
  bounded &&= gainSamples.length>0
  if (!Number.isFinite(gainMin)) gainMin=1
  scaling.reset();resetAdaptiveView(view)
  const resetPass=scaling.state.gain===1&&scaling.state.elapsed===0&&scaling.state.slowRms===0&&Object.values(view.broad).every(v=>v===0)&&Object.values(view.six).every(v=>v===0)
  return {fixture:fixture.id,rate,fft,cadence,updates:gainSamples.length,gainMin,gainMax,noiseMax,silenceMax,quietMaxRatio,
    holdViolations,floorIncreaseViolations,bounded,extraClippingSeconds,adaptiveClippingSeconds,fixedClippingSeconds,extraClippingAfterGraceSeconds,extraClippingEarlySeconds,maxHitGainDip,resetPass,
    sections:sections.map(s=>({...s,gainMin:Number.isFinite(s.gainMin)?s.gainMin:1,gainMean:s.seconds?s.gainMean/s.seconds:0,fixedMean:s.seconds?s.fixedMean/s.seconds:0,adaptiveMean:s.seconds?s.adaptiveMean/s.seconds:0})),
    checks:{bounded,hold:holdViolations===0,floor:floorIncreaseViolations===0,silence:silenceMax===0,noise:noiseMax<=RANGE_TARGETS.noise,
      quiet:quietMaxRatio<=2+1e-12,loud:extraClippingAfterGraceSeconds===0,reset:resetPass} }
}
export type RangeRow=ReturnType<typeof compareRange>
export function assessRange(rows:RangeRow[]) {
  const identifiers=new Set(rangeFixtures.map(f=>f.id))
  const unique=new Set(rows.map(r=>`${r.fixture}/${r.rate}/${r.cadence}`))
  const complete=rows.length===rangeFixtures.length*9&&unique.size===rows.length&&rows.every(r=>identifiers.has(r.fixture)&&[44100,48000,96000].includes(r.rate)&&[30,60,120].includes(r.cadence))
  const checks=Object.fromEntries((['bounded','hold','floor','silence','noise','quiet','loud','reset'] as const).map(key=>[key,complete&&rows.every(r=>r.checks[key])]))
  const max=(key:'noiseMax'|'silenceMax'|'quietMaxRatio'|'gainMax'|'extraClippingAfterGraceSeconds'|'extraClippingEarlySeconds'|'maxHitGainDip'|'extraClippingSeconds'|'adaptiveClippingSeconds'|'fixedClippingSeconds')=>Math.max(0,...rows.map(r=>r[key]))
  return {settings:RANGE_SETTINGS,targets:RANGE_TARGETS,complete,checks,pass:complete&&Object.values(checks).every(Boolean),
    extraClippingSeconds:max('extraClippingSeconds'),adaptiveClippingSeconds:max('adaptiveClippingSeconds'),fixedClippingSeconds:max('fixedClippingSeconds'),noiseMax:max('noiseMax'),silenceMax:max('silenceMax'),quietMaxRatio:max('quietMaxRatio'),gainMax:max('gainMax'),
    extraClippingAfterGraceSeconds:max('extraClippingAfterGraceSeconds'),extraClippingEarlySeconds:max('extraClippingEarlySeconds'),maxHitGainDip:max('maxHitGainDip'),
    failures:rows.filter(r=>!Object.values(r.checks).every(Boolean)).map(r=>({fixture:r.fixture,rate:r.rate,cadence:r.cadence,checks:r.checks}))}
}

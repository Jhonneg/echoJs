import { createMusicalContext, CONTEXT_SETTINGS, CONTEXT_TARGETS } from './context.ts'
import { createEnergy, createEnergyMeter } from './energy.ts'
import { createOnsetDetector, type OnsetEvent } from './onsets.ts'
import { type Frame } from './baseline.ts'
import { type Fixture, type Tone } from './fixtures.ts'

interface Window { name:string;start:number;end:number;hz?:number;db?:number }
export interface ContextFixture extends Fixture { specimen:string;phaseSeconds:number;windows:Window[] }
const tone=(hz:number,db:number,start:number,end:number):Tone=>({hz,db,start,end,edge:.002})
function make(specimen:string,tones:Tone[],duration:number,windows:Window[]=[]):ContextFixture {
  return {id:`context-${specimen}`,specimen,phaseSeconds:0,tones,duration,windows,
    events:tones.map(t=>({time:t.start,band:t.hz<250?'bass':t.hz<4000?'midrange':'treble'}))}
}
const bases:ContextFixture[]=[make('silence',[],16),{...make('noise',[],16),noise:-60},
  make('drone',[tone(100,-12,.5,5.5)],16,[{name:'steady',start:4.5,end:5.5,hz:100}])]
for(const hz of [100,1000,8000])bases.push(make(`amplitude-${hz}`,
  [-36,-24,-12,-6].map((db,i)=>tone(hz,db,.5+3*i,3.5+3*i)),14,
  [-36,-24,-12,-6].map((db,i)=>({name:`level-${db}`,start:3+3*i,end:3.5+3*i,hz,db}))))
bases.push(make('frequency-steps',[100,1000,8000].map((hz,i)=>tone(hz,-12,.5+4*i,4.5+4*i)),14,
  [100,1000,8000].map((hz,i)=>({name:`frequency-${hz}`,start:3.5+4*i,end:4.5+4*i,hz}))))
bases.push(make('equal-mixture',[100,1000,8000].map(hz=>tone(hz,-18,.5,6.5)),17,[{name:'steady',start:5.5,end:6.5}]))
bases.push(make('sparse-melody',Array.from({length:10},(_,i)=>tone([1000,2000,500,8000][i%4],-12,.5+i,.65+i)),16,[{name:'steady',start:7.5,end:8.5}]))
bases.push(make('busy-pulses',Array.from({length:32},(_,i)=>tone([100,1000,8000][i%3],-12,.5+i*.25,.55+i*.25)),19,[{name:'steady',start:6.5,end:7.5}]))
bases.push(make('rate-steps',[...Array.from({length:5},(_,i)=>tone(1000,-12,.5+i,.55+i)),...Array.from({length:17},(_,i)=>tone(1000,-12,6+i*.25,6.05+i*.25))],16,
  [{name:'sparse',start:3.5,end:4.5},{name:'busy',start:9,end:10}]))
bases.push(make('quiet-loud',[tone(1000,-36,.5,5.5),tone(1000,-6,5.5,10.5)],20,
  [{name:'quiet',start:4.5,end:5.5,hz:1000},{name:'loud',start:9.5,end:10.5,hz:1000}]))
export const contextFixtures=bases.flatMap(f=>[0,.007,.017].map(phase=>({...f,id:`${f.id}-phase${Math.round(phase*1000)}ms`,phaseSeconds:phase,duration:f.duration+phase,
  tones:f.tones.map(t=>({...t,start:t.start+phase,end:t.end+phase})),events:f.events.map(e=>({...e,time:e.time+phase})),
  windows:f.windows.map(w=>({...w,start:w.start+phase,end:w.end+phase}))})))
const names=['intensity','brightness','activity'] as const
const brightness=(hz:number)=>Math.max(0,Math.min(1,Math.log2(hz/100)/Math.log2(100)))
export function compareContext(fixture:ContextFixture,rate:number,fft:number,frames:Frame[],cadence:number) {
  const engine=createMusicalContext(rate,fft),meter=createEnergyMeter(rate,fft),energy=createEnergy(),detector=createOnsetDetector(rate,fft)
  const events:Readonly<OnsetEvent>[]=[],curve:{time:number;intensity:number;brightness:number;activity:number}[]=[]
  const windows=fixture.windows.map(w=>({...w,seconds:0,intensity:0,brightness:0,activity:0,target:0,centroid:0,countRate:0,strengthRate:0,cadenceSeconds:0,cadenceMean:{intensity:0,brightness:0,activity:0}}))
  const checks={bounds:true,continuity:true,capacity:true,activityOracle:true,intensity:true,brightness:true,drone:true,silence:true,noise:true,decay:true,reset:true}
  let sequence=0,previousTime=0,nextPlot=0,maxOracleError=0,noiseIntensity=0,silenceMaximum=0,updates=0,brightnessInvalid=true,settledDecayMaximum=0
  let previousIntensity=0,previousBrightness=0,previousActivity=0
  for(let i=120/cadence-1;i<frames.length;i+=120/cadence) {
    const frame=frames[i],dt=previousTime?frame.time-previousTime:0;previousTime=frame.time;updates++
    meter.update(frame.bins,energy)
    const onsets=detector.update(frame.bins,energy.rms,frame.time)
    for(const e of onsets.events)if(e.sequence>sequence){events.push(e);sequence=e.sequence}
    const view=engine.update(frame.bins,energy.rms,onsets,frame.time)
    const active=events.filter(e=>e.timeSeconds>frame.time-4&&e.timeSeconds<=frame.time)
    const countRate=active.length/4,strengthRate=active.reduce((s,e)=>s+e.strength,0)/4
    maxOracleError=Math.max(maxOracleError,Math.abs(view.countRate-countRate),Math.abs(view.strengthRate-strengthRate))
    checks.bounds&&=names.every(k=>Number.isFinite(view[k])&&view[k]>=0&&view[k]<=1)
    checks.capacity&&=!view.overflow
    if(dt>0){
      checks.continuity&&=Math.abs(view.intensity-previousIntensity)<=-Math.expm1(-dt/.75)+1e-12
        &&Math.abs(view.brightness-previousBrightness)<=-Math.expm1(-dt/.5)+1e-12
        &&Math.abs(view.activity-previousActivity)<=-Math.expm1(-dt/.5)+1e-12
    }
    previousIntensity=view.intensity;previousBrightness=view.brightness;previousActivity=view.activity
    if(frame.time>=nextPlot){curve.push({time:frame.time,intensity:view.intensity,brightness:view.brightness,activity:view.activity});nextPlot+=.1}
    for(const w of windows)if(frame.time>=w.end-1&&frame.time<w.end){w.cadenceSeconds+=dt;for(const key of names)w.cadenceMean[key]+=view[key]*dt}
    for(const w of windows)if(frame.time>=w.start&&frame.time<w.end){w.seconds+=dt;for(const key of names)w[key]+=view[key]*dt;w.target+=view.intensityTarget*dt;w.centroid+=(view.centroidHz??0)*dt;w.countRate+=view.countRate*dt;w.strengthRate+=view.strengthRate*dt}
    if(fixture.specimen==='noise'){noiseIntensity=Math.max(noiseIntensity,view.intensity);brightnessInvalid&&=!view.brightnessValid}
    if(fixture.specimen==='silence')silenceMaximum=Math.max(silenceMaximum,...names.map(k=>view[k]))
    const lastEnd=Math.max(0,...fixture.tones.map(t=>t.end)),lastEvent=events.at(-1)?.timeSeconds??0
    if(fixture.tones.length&&frame.time>=Math.max(lastEnd,lastEvent)+10)settledDecayMaximum=Math.max(settledDecayMaximum,...names.map(k=>view[k]))
    if(fixture.specimen==='drone'&&frame.time>1+CONTEXT_SETTINGS.activityWindow)checks.drone&&=view.countRate===0
  }
  for(const w of windows)if(w.cadenceSeconds)for(const key of names)w.cadenceMean[key]/=w.cadenceSeconds
  for(const w of windows)if(w.seconds){for(const key of names)w[key]/=w.seconds;w.target/=w.seconds;w.centroid/=w.seconds;w.countRate/=w.seconds;w.strengthRate/=w.seconds}
  checks.activityOracle=maxOracleError<=1e-9
  if(fixture.specimen.startsWith('amplitude-')) {
    checks.intensity=windows.every((w,i)=>Math.abs(w.intensity-w.target)<=Math.max(.002,.05*w.target)&&(i===0||w.intensity>windows[i-1].intensity))&&windows[3].intensity-windows[2].intensity>=.15
    checks.brightness=windows.every(w=>Math.abs(w.brightness-brightness(w.hz!))<=.03&&Math.abs(w.centroid-w.hz!)<=Math.max(rate/fft,.02*w.hz!))&&Math.max(...windows.map(w=>w.brightness))-Math.min(...windows.map(w=>w.brightness))<=.03
  }
  if(['frequency-steps','drone','quiet-loud'].includes(fixture.specimen))checks.brightness=windows.every(w=>Math.abs(w.brightness-brightness(w.hz!))<=.03&&Math.abs(w.centroid-w.hz!)<=Math.max(rate/fft,.02*w.hz!))
  if(fixture.specimen==='frequency-steps')checks.brightness&&=windows.every((w,i)=>i===0||w.brightness>windows[i-1].brightness)
  if(fixture.specimen==='quiet-loud')checks.intensity=windows[1].intensity-windows[0].intensity>=.15
  checks.silence=silenceMaximum===0
  checks.noise=noiseIntensity<=.005&&brightnessInvalid&&(fixture.specimen!=='noise'||events.length===0)
  checks.decay=settledDecayMaximum<=.005
  engine.reset();checks.reset=names.every(k=>engine.view[k]===0)&&engine.view.eventCount===0&&!engine.view.primed
  const matched=new Set<number>();let extras=0
  for(const e of events){const at=fixture.events.findIndex((l,j)=>!matched.has(j)&&e.band===(l.band==='bass'?'low':l.band==='midrange'?'mid':'high')&&e.timeSeconds>=l.time&&e.timeSeconds-l.time<=.1);if(at>=0)matched.add(at);else extras++}
  return {fixture:fixture.id,specimen:fixture.specimen,phaseSeconds:fixture.phaseSeconds,rate,fft,cadence,updates,checks,windows,curve,maxOracleError,noiseIntensity,silenceMaximum,settledDecayMaximum,
    onsets:{expected:fixture.events.length,accepted:events.length,matched:matched.size,missed:fixture.events.length-matched.size,extras}}
}
export type ContextRow=ReturnType<typeof compareContext>
export function assessContext(rows:ContextRow[]) {
  const complete=rows.length===324&&new Set(rows.map(r=>`${r.fixture}/${r.rate}/${r.cadence}`)).size===324&&rows.every(r=>contextFixtures.some(f=>f.id===r.fixture)&&[44100,48000,96000].includes(r.rate)&&[30,60,120].includes(r.cadence)&&r.updates>0)
  const cadenceFailures:{fixture:string;rate:number;window:string;signal:string;difference:number}[]=[],transitionDifferences:{fixture:string;rate:number;signal:string;maximum:number}[]=[]
  for(const f of contextFixtures)for(const rate of [44100,48000,96000]) {
    const group=rows.filter(r=>r.fixture===f.id&&r.rate===rate)
    if(group.length!==3)continue
    for(const w of f.windows)for(const signal of names){const values=group.map(r=>r.windows.find(v=>v.name===w.name)!.cadenceMean[signal]);const difference=Math.max(...values)-Math.min(...values);if(difference>(signal==='activity'?.05:.03))cadenceFailures.push({fixture:f.id,rate,window:w.name,signal,difference})}
    for(const signal of names){let maximum=0;for(let i=0;i<Math.min(...group.map(r=>r.curve.length));i++){const values=group.map(r=>r.curve[i][signal]);maximum=Math.max(maximum,Math.max(...values)-Math.min(...values))}transitionDifferences.push({fixture:f.id,rate,signal,maximum})}
  }
  const relationFailures:{fixture:string;rate:number;cadence:number}[]=[]
  for(const row of rows)if(row.specimen==='rate-steps'&&row.windows[1].activity<=row.windows[0].activity)relationFailures.push({fixture:row.fixture,rate:row.rate,cadence:row.cadence})
  const failures=rows.filter(r=>Object.values(r.checks).some(v=>!v)).map(r=>({fixture:r.fixture,rate:r.rate,cadence:r.cadence,checks:r.checks}))
  return {settings:CONTEXT_SETTINGS,targets:CONTEXT_TARGETS,complete,pass:complete&&!failures.length&&!cadenceFailures.length&&!relationFailures.length,failures,cadenceFailures,relationFailures,transitionDifferences,
    onsetDiagnostics:{expected:rows.reduce((s,r)=>s+r.onsets.expected,0),matched:rows.reduce((s,r)=>s+r.onsets.matched,0),missed:rows.reduce((s,r)=>s+r.onsets.missed,0),extras:rows.reduce((s,r)=>s+r.onsets.extras,0)}}
}

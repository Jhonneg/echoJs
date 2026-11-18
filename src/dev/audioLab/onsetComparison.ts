import {createOnsetDetector,ONSET_BANDS,ONSET_SETTINGS,ONSET_TARGETS,type OnsetBand,type OnsetEvent} from './onsets.ts'
import {createEnergy,createEnergyMeter} from './energy.ts'
import {createReplay,type Frame} from './baseline.ts'
import {type Fixture,type Tone} from './fixtures.ts'
import {BAND_NAMES} from '../../audio/signal.ts'

interface Label {time:number;band:OnsetBand;levelDb?:number;group?:string}
export interface OnsetFixture extends Fixture {labels:Label[];category:string;stress:boolean;phaseSeconds:number;specimen:string}
const band=(hz:number):OnsetBand=>hz<250?'low':hz<4000?'mid':'high'
const make=(id:string,category:string,tones:Tone[],labels:Label[],duration:number,stress=false):OnsetFixture=>({
  id:`onset-${id}`,specimen:id,category,tones,labels,duration,stress,phaseSeconds:0,
  events:labels.map(l=>({time:l.time,band:l.band==='low'?'bass':l.band==='mid'?'midrange':'treble'})),
})
const tone=(hz:number,db:number,start:number,duration:number):Tone=>({hz,db,start,end:start+duration,edge:.002})
const bases:OnsetFixture[]=[]
bases.push(make('silence','silence',[],[],3))
bases.push({...make('noise-60db','noise',[],[],3),noiseSegments:[{start:0,end:3,db:-60}]})
for(const hz of [100,1000,8000]) {
  for(const shape of ['sustain','burst-50','burst-100','burst-20']) {
    const duration=shape==='sustain'?3:shape==='burst-50'?.05:shape==='burst-100'?.1:.02
    const starts=[-36,-24,-12,-6].map((db,i)=>({db,time:.5+i*(shape==='sustain'?4:.5)}))
    bases.push(make(`${shape}-${hz}hz`,shape,starts.map(s=>tone(hz,s.db,s.time,duration)),
      starts.map(s=>({time:s.time,band:band(hz),levelDb:s.db,group:`${shape}-${hz}`})),starts.at(-1)!.time+duration+1,shape==='burst-20'))
  }
  for(const spacing of [.25,.5]) {
    const tones:Tone[]=[],labels:Label[]=[]
    for(const [level,db] of [-36,-24,-12,-6].entries())for(let hit=0;hit<3;hit++) {
      const time=.5+level*(3*spacing+.5)+hit*spacing
      tones.push(tone(hz,db,time,.05));labels.push({time,band:band(hz),levelDb:db,group:`repeat-${hz}-${spacing}-${hit}`})
    }
    bases.push(make(`repeat-${hz}hz-${spacing}s`,'repeat',tones,labels,tones.at(-1)!.end+1))
    const hits:Tone[]=[],hitLabels:Label[]=[{time:.5,band:band(hz),levelDb:-36}]
    for(const [level,db] of [-24,-12,-6].entries())for(let hit=0;hit<4;hit++) {
      const time=2+level*(4*spacing+.5)+hit*spacing
      hits.push(tone(hz,db,time,.05));hitLabels.push({time,band:band(hz),levelDb:db,group:`over-bed-${hz}-${spacing}-${hit}`})
    }
    const end=hits.at(-1)!.end+.5
    bases.push(make(`over-bed-${hz}hz-${spacing}s`,'over-bed',[tone(hz,-36,.5,end-.5),...hits],hitLabels,end+1))
  }
}
bases.push(make('mixture','mixture',[100,1000,8000].map(hz=>tone(hz,-18,.5,.1)),ONSET_BANDS.map(b=>({time:.5,band:b,levelDb:-18})),2))
bases.push(make('high-sharp','high-only',[tone(8000,-6,.5,.05)],[{time:.5,band:'high',levelDb:-6}],2))
bases.push(make('release','release',[tone(100,-12,.5,5)],[{time:.5,band:'low',levelDb:-12}],6.5))
export const onsetFixtures=bases.flatMap(f=>[0,.007,.017].map(phase=>({...f,id:`${f.id}-phase${Math.round(phase*1000)}ms`,phaseSeconds:phase,duration:f.duration+phase,
  tones:f.tones.map(t=>({...t,start:t.start+phase,end:t.end+phase})),
  noiseSegments:f.noiseSegments?.map(s=>({...s,start:s.start+phase,end:s.end+phase})),
  labels:f.labels.map(l=>({...l,time:l.time+phase})),events:f.events.map(e=>({...e,time:e.time+phase})),
})))

export function compareOnsets(fixture:OnsetFixture,rate:number,fft:number,frames:Frame[],cadence:number) {
  const detector=createOnsetDetector(rate,fft),meter=createEnergyMeter(rate,fft),energy=createEnergy(),legacy=createReplay(rate,fft)
  const events:Readonly<OnsetEvent>[]=[],legacyCrossings={low:0,mid:0,high:0},legacyHigh={low:false,mid:false,high:false}
  let sequence=0,updates=0
  for(let i=120/cadence-1;i<frames.length;i+=120/cadence) {
    const f=frames[i];updates++;meter.update(f.bins,energy);legacy.step(f)
    const view=detector.update(f.bins,energy.rms,f.time)
    for(const e of view.events)if(e.sequence>sequence){events.push(e);sequence=e.sequence}
    for(const [j,name]of ONSET_BANDS.entries()) {
      const high=Math.max(legacy.signal.transient[BAND_NAMES[j]],legacy.signal.flux[BAND_NAMES[j]])>=.1
      if(high&&!legacyHigh[name])legacyCrossings[name]++
      legacyHigh[name]=high
    }
  }
  const used=new Set<number>(),matched:{label:Label,event:Readonly<OnsetEvent>,peakDelayMs:number,emissionDelayMs:number}[]=[],extras:Readonly<OnsetEvent>[]=[]
  for(const e of [...events].sort((a,b)=>a.timeSeconds-b.timeSeconds||a.sequence-b.sequence)) {
    let selected=-1,difference=Infinity
    fixture.labels.forEach((l,index)=>{const delta=e.timeSeconds-l.time;if(!used.has(index)&&l.band===e.band&&delta>=0&&delta<=ONSET_TARGETS.peakDelaySeconds&&delta<difference){selected=index;difference=delta}})
    if(selected<0)extras.push(e)
    else{used.add(selected);matched.push({label:fixture.labels[selected],event:e,peakDelayMs:difference*1000,emissionDelayMs:(e.emittedAtSeconds-fixture.labels[selected].time)*1000})}
  }
  const missed=fixture.labels.filter((_,index)=>!used.has(index))
  const wrongBand=extras.filter(e=>fixture.labels.some(l=>l.band!==e.band&&e.timeSeconds>=l.time&&e.timeSeconds<=l.time+ONSET_TARGETS.peakDelaySeconds)).length
  const releases=extras.filter(e=>fixture.tones.some(t=>e.timeSeconds>=t.end&&e.timeSeconds<=t.end+.15)).length
  const rejected=Object.fromEntries(ONSET_BANDS.map(b=>[b,{...detector.view.debug[b].rejected}]))
  const identityPass=new Set(events.map(e=>`${e.session}/${e.sequence}`)).size===events.length&&events.every((e,i)=>e.sequence===i+1&&e.strength>=0&&e.strength<=1&&Number.isFinite(e.strength))
  const eventCounts=events.length,hit=matched.length
  detector.reset()
  return {fixture:fixture.id,specimen:fixture.specimen,category:fixture.category,stress:fixture.stress,phaseSeconds:fixture.phaseSeconds,rate,fft,cadence,updates,
    expected:fixture.labels.length,detected:eventCounts,matched:hit,missed,extras,wrongBand,releases,
    precision:eventCounts?hit/eventCounts:fixture.labels.length?0:1,recall:fixture.labels.length?hit/fixture.labels.length:1,
    observations:matched,legacyExcursions:legacyCrossings,rejected,
    checks:{counts:missed.length===0&&extras.length===0,timing:matched.every(m=>m.emissionDelayMs<=ONSET_TARGETS.emissionDelaySeconds*1000),identity:identityPass,
      reset:detector.view.events.length===0&&detector.view.sequence===0&&!detector.view.primed} }
}
export type OnsetRow=ReturnType<typeof compareOnsets>
export function assessOnsets(rows:OnsetRow[]) {
  const expected=onsetFixtures.length*9,ids=new Set(onsetFixtures.map(f=>f.id))
  const complete=rows.length===expected&&new Set(rows.map(r=>`${r.fixture}/${r.rate}/${r.cadence}`)).size===expected&&rows.every(r=>ids.has(r.fixture)&&[44100,48000,96000].includes(r.rate)&&[30,60,120].includes(r.cadence)&&r.updates>0)
  const core=rows.filter(r=>!r.stress),stress=rows.filter(r=>r.stress)
  const strengthFailures:{fixture:string,rate:number,cadence:number,group:string,levels:number[],strengths:number[]}[]=[]
  let strengthGroups=0
  for(const row of core) {
    const groups=new Map<string,typeof row.observations>()
    for(const observation of row.observations)if(observation.label.group){const group=groups.get(observation.label.group)??[];group.push(observation);groups.set(observation.label.group,group)}
    const expectedGroups=new Set(onsetFixtures.find(f=>f.id===row.fixture)!.labels.flatMap(l=>l.group?[l.group]:[]))
    for(const group of expectedGroups){strengthGroups++;const values=(groups.get(group)??[]).sort((a,b)=>a.label.levelDb!-b.label.levelDb!);const expectedCount=onsetFixtures.find(f=>f.id===row.fixture)!.labels.filter(l=>l.group===group).length
      if(values.length!==expectedCount||values.some((v,i)=>i>0&&v.event.strength<=values[i-1].event.strength))strengthFailures.push({fixture:row.fixture,rate:row.rate,cadence:row.cadence,group,levels:values.map(v=>v.label.levelDb!),strengths:values.map(v=>v.event.strength)})}
  }
  const summarize=(selected:OnsetRow[])=>({cases:selected.length,expected:selected.reduce((s,r)=>s+r.expected,0),detected:selected.reduce((s,r)=>s+r.detected,0),matched:selected.reduce((s,r)=>s+r.matched,0),missed:selected.reduce((s,r)=>s+r.missed.length,0),extras:selected.reduce((s,r)=>s+r.extras.length,0),wrongBand:selected.reduce((s,r)=>s+r.wrongBand,0),releaseEvents:selected.reduce((s,r)=>s+r.releases,0),
    maxPeakDelayMs:Math.max(0,...selected.flatMap(r=>r.observations.map(m=>m.peakDelayMs))),maxEmissionDelayMs:Math.max(0,...selected.flatMap(r=>r.observations.map(m=>m.emissionDelayMs)))})
  const coreFailures=core.filter(r=>!Object.values(r.checks).every(Boolean)).map(r=>({fixture:r.fixture,category:r.category,rate:r.rate,cadence:r.cadence,missed:r.missed.length,extras:r.extras.length,checks:r.checks}))
  return {settings:ONSET_SETTINGS,targets:ONSET_TARGETS,complete,pass:complete&&coreFailures.length===0&&strengthFailures.length===0,
    core:summarize(core),stress:summarize(stress),strengthGroups,strengthFailures,coreFailures,
    categories:[...new Set(core.map(r=>r.category))].map(category=>({category,...summarize(core.filter(r=>r.category===category))}))}
}

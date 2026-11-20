import { binRange, type BandValues } from '../../audio/signal.ts'
import type { OnsetEvent } from './onsets.ts'

export const CONTEXT_SETTINGS = { intensityReference:.5, intensityRise:.75, intensityFall:1.5,
  brightnessFloor:.002, brightnessLowHz:100, brightnessHighHz:10000, brightnessTau:.5,
  activityWindow:4, activityReference:1, activityRise:.5, activityFall:1,
  eventCapacity:256, gapSeconds:.25 } as const
export const CONTEXT_TARGETS = { plateauRelative:.05, plateauAbsolute:.002, contrast:.15,
  brightness:.03, intensityCadence:.03, brightnessCadence:.03, activityCadence:.05, silence:.005 } as const
export function createContextView() {
  return {session:0,time:0,primed:false,state:'reset',intensity:0,brightness:0,activity:0,
    intensityTarget:0,brightnessTarget:0,activityTarget:0,broadRms:0,centroidHz:null as number|null,
    brightnessValid:false,countRate:0,strengthRate:0,eventCount:0,sequence:0,overflow:false}
}
export type ContextView=ReturnType<typeof createContextView>
type EventInput={session:number;sequence:number;events:readonly Readonly<OnsetEvent>[]}
const clamp=(value:number)=>Math.max(0,Math.min(1,value))
export function createMusicalContext(rate:number,fft:number,sessionSeed=0) {
  const view=createContextView();view.session=sessionSeed
  const times=new Float64Array(CONTEXT_SETTINGS.eventCapacity),strengths=new Float64Array(CONTEXT_SETTINGS.eventCapacity)
  const [startBin,endBin]=binRange(20,Math.min(20000,rate/2),rate,fft)
  let previous:number|null=null,sourceSession:number|null=null,start=0,count=0
  function reset(reason='reset') {
    view.session++;view.time=0;view.primed=false;view.state=reason
    view.intensity=view.brightness=view.activity=view.intensityTarget=view.brightnessTarget=view.activityTarget=0
    view.broadRms=view.countRate=view.strengthRate=view.eventCount=view.sequence=0
    view.centroidHz=null;view.brightnessValid=false;view.overflow=false
    previous=null;sourceSession=null;start=count=0;times.fill(0);strengths.fill(0)
  }
  function smooth(value:number,target:number,dt:number,rise:number,fall:number){return value+(target-value)*(-Math.expm1(-dt/(target>value?rise:fall)))}
  reset()
  return {view,reset,update(bins:Float32Array,rms:BandValues,onsets:EventInput,time:number,active=true) {
    if(!active){if(view.primed)reset('inactive');return view}
    if(!Number.isFinite(time)||bins.length!==fft/2||!Number.isFinite(rms.bass)||!Number.isFinite(rms.midrange)||!Number.isFinite(rms.treble)||Math.min(rms.bass,rms.midrange,rms.treble)<0){reset('invalid-input');return view}
    if(sourceSession!==null&&sourceSession!==onsets.session)reset('source')
    if(previous!==null&&(time<=previous||time-previous>CONTEXT_SETTINGS.gapSeconds))reset('gap')
    sourceSession=onsets.session
    const dt=previous===null?0:time-previous
    view.time=time;view.broadRms=Math.hypot(rms.bass,rms.midrange,rms.treble)
    view.intensityTarget=clamp(view.broadRms/CONTEXT_SETTINGS.intensityReference)
    let power=0,weighted=0
    for(let k=startBin;k<endBin;k++) {
      if(!Number.isFinite(bins[k]))continue
      const p=10**(bins[k]/10)
      if(Number.isFinite(p)){power+=p;weighted+=p*k*rate/fft}
    }
    view.brightnessValid=view.broadRms>=CONTEXT_SETTINGS.brightnessFloor&&power>0&&Number.isFinite(weighted)
    view.centroidHz=view.brightnessValid?weighted/power:null
    view.brightnessTarget=view.centroidHz===null?0:clamp(Math.log2(view.centroidHz/CONTEXT_SETTINGS.brightnessLowHz)/Math.log2(CONTEXT_SETTINGS.brightnessHighHz/CONTEXT_SETTINGS.brightnessLowHz))
    if(previous===null){view.sequence=onsets.sequence;previous=time;view.primed=true;view.state='priming';return view}
    while(count&&times[start]<=time-CONTEXT_SETTINGS.activityWindow){start=(start+1)%times.length;count--}
    for(const event of onsets.events) {
      if(event.session!==onsets.session||event.sequence<=view.sequence)continue
      view.sequence=event.sequence
      if(event.timeSeconds<=time-CONTEXT_SETTINGS.activityWindow||event.timeSeconds>time)continue
      if(count===times.length){view.overflow=true;continue}
      const at=(start+count)%times.length;times[at]=event.timeSeconds;strengths[at]=event.strength;count++
    }
    let sum=0;for(let i=0;i<count;i++)sum+=strengths[(start+i)%times.length]
    view.eventCount=count;view.countRate=count/CONTEXT_SETTINGS.activityWindow;view.strengthRate=sum/CONTEXT_SETTINGS.activityWindow
    view.activityTarget=clamp(view.strengthRate/CONTEXT_SETTINGS.activityReference)
    view.intensity=smooth(view.intensity,view.intensityTarget,dt,CONTEXT_SETTINGS.intensityRise,CONTEXT_SETTINGS.intensityFall)
    view.brightness=smooth(view.brightness,view.brightnessTarget,dt,CONTEXT_SETTINGS.brightnessTau,CONTEXT_SETTINGS.brightnessTau)
    view.activity=smooth(view.activity,view.activityTarget,dt,CONTEXT_SETTINGS.activityRise,CONTEXT_SETTINGS.activityFall)
    view.primed=true;view.state='running';previous=time
    return view
  }}
}

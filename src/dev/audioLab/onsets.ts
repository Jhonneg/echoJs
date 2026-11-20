import { BAND_NAMES, binRange, type BandValues } from '../../audio/signal.ts'
import { BLACKMAN_MEAN_SQUARE } from './energy.ts'

export const ONSET_BANDS = ['low', 'mid', 'high'] as const
export type OnsetBand = typeof ONSET_BANDS[number]
export interface OnsetEvent { readonly session:number; readonly sequence:number; readonly band:OnsetBand; readonly timeSeconds:number; readonly emittedAtSeconds:number; readonly strength:number }
export const ONSET_SETTINGS = { historySeconds:1, historyCapacity:512, thresholdMad:3, noveltyFloor:.0005,
  rmsFloor:.002, riseFloor:.0005, riseSeconds:.05, noveltyPowerShare:.05, fallFloor:.002, fallFraction:.05,
  spacingSeconds:.12, rearmFraction:.6, strengthReference:.5, attackWindowSeconds:.04, eventSeconds:10, eventCapacity:256, gapSeconds:.25 } as const
export const ONSET_TARGETS = { peakDelaySeconds:.1, emissionDelaySeconds:.15 } as const
export const REJECTION_NAMES = ['belowRms','noRise','falling','share','spacing','rearm'] as const
export function createOnsetView() {
  const debug=()=>({novelty:0,threshold:Number(ONSET_SETTINGS.noveltyFloor),rms:0,rise:0,attackRise:0,observedRms:0,pendingPeak:null as number|null,earliestEmission:null as number|null,decision:'priming',accepted:0,
    rejected:{belowRms:0,noRise:0,falling:0,share:0,spacing:0,rearm:0}})
  return {session:0,sequence:0,primed:false,events:[] as Readonly<OnsetEvent>[],debug:{low:debug(),mid:debug(),high:debug()}}
}
export type OnsetView=ReturnType<typeof createOnsetView>

// Time-indexed scalar ring plus sorted novelty values. Median/MAD reuse storage;
// no PCM/FFT histories leave the detector and no sort buffers are allocated per tick.
function history() {
  const size=ONSET_SETTINGS.historyCapacity,times=new Float64Array(size),values=new Float64Array(size),rms=new Float64Array(size),totals=new Float64Array(size),sorted=new Float64Array(size)
  let start=0,count=0
  const lower=(value:number)=>{let low=0,high=count;while(low<high){const mid=(low+high)>>>1;if(sorted[mid]<value)low=mid+1;else high=mid}return low}
  function remove() {const at=lower(values[start]);for(let i=at;i<count-1;i++)sorted[i]=sorted[i+1];start=(start+1)%size;count--}
  return {
    clear(){start=count=0;times.fill(0);values.fill(0);rms.fill(0);totals.fill(0);sorted.fill(0)},
    prune(time:number){while(count&&times[start]<time-ONSET_SETTINGS.historySeconds)remove()},
    threshold(){
      if(!count)return ONSET_SETTINGS.noveltyFloor
      const m=count%2?sorted[count>>>1]:(sorted[count/2-1]+sorted[count/2])/2
      let left=Math.floor((count-1)/2),right=left+1,previous=0,current=0
      for(let i=0;i<=Math.floor(count/2);i++) {
        previous=current
        const a=left>=0?m-sorted[left]:Infinity,b=right<count?sorted[right]-m:Infinity
        if(a<=b){current=a;left--}else{current=b;right++}
      }
      const mad=count%2?current:(previous+current)/2
      return Math.max(ONSET_SETTINGS.noveltyFloor,m+ONSET_SETTINGS.thresholdMad*mad)
    },
    baseline(time:number,currentRms:number,currentTotal:number){
      let minimum=currentRms,maximum=currentTotal
      for(let i=0;i<count;i++){const k=(start+i)%size;if(times[k]>=time-ONSET_SETTINGS.riseSeconds){minimum=Math.min(minimum,rms[k]);maximum=Math.max(maximum,totals[k])}}
      return {rise:Math.max(0,currentRms-minimum),falling:maximum-currentTotal>Math.max(ONSET_SETTINGS.fallFloor,ONSET_SETTINGS.fallFraction*maximum)}
    },
    append(time:number,value:number,bandRms:number,total:number){
      if(count===size)remove()
      const at=lower(value);for(let i=count;i>at;i--)sorted[i]=sorted[i-1];sorted[at]=value
      const k=(start+count)%size;times[k]=time;values[k]=value;rms[k]=bandRms;totals[k]=total;count++
    },
  }
}
const sample=()=>({time:0,novelty:0,threshold:.0005,rms:0,total:0,rise:0,baseline:0,falling:false})
const attack=()=>({active:false,ready:false,time:0,deadline:0,threshold:.0005,baseline:0,maximumRms:0,totalAtMaximum:0,falling:false})
export function createOnsetDetector(rate:number,fft:number,sessionSeed=0) {
  const view=createOnsetView();view.session=sessionSeed
  const previousSpectrum=new Float32Array(fft/2),changes=new Float64Array(fft/2)
  const ranges=[[20,250],[250,4000],[4000,20000]].map(([lo,hi])=>binRange(lo,hi,rate,fft))
  const bands=ONSET_BANDS.map(()=>({history:history(),previous:sample(),current:sample(),attack:attack(),beforeNovelty:0,armed:true,trigger:.0005,lastEvent:-Infinity}))
  let previousTime:number|null=null
  function reset(reason='reset') {
    view.session++;view.sequence=0;view.primed=false;view.events.length=0;previousTime=null
    previousSpectrum.fill(0);changes.fill(0)
    for(const [index,name] of ONSET_BANDS.entries()) {
      const band=bands[index];band.history.clear();Object.assign(band.previous,sample());Object.assign(band.current,sample())
      Object.assign(band.attack,attack())
      band.beforeNovelty=0;band.armed=true;band.trigger=ONSET_SETTINGS.noveltyFloor;band.lastEvent=-Infinity
      const d=view.debug[name];d.novelty=d.rms=d.rise=d.accepted=0;d.threshold=ONSET_SETTINGS.noveltyFloor;d.decision=reason
      d.attackRise=d.observedRms=0;d.pendingPeak=d.earliestEmission=null
      for(const key of REJECTION_NAMES)d.rejected[key]=0
    }
  }
  reset()
  return {view,reset,update(bins:Float32Array,rms:BandValues,time:number,active=true) {
    if(!active){if(view.primed)reset('inactive');return view}
    if(!Number.isFinite(time)){reset('invalid-time');return view}
    if(bins.length!==previousSpectrum.length||BAND_NAMES.some(b=>!Number.isFinite(rms[b])||rms[b]<0)){reset('invalid-input');return view}
    const dt=previousTime===null?null:time-previousTime
    if(dt!==null&&(!Number.isFinite(dt)||dt<=0||dt>ONSET_SETTINGS.gapSeconds))reset('gap')
    const prime=!view.primed,total=Math.hypot(...BAND_NAMES.map(b=>rms[b]))
    for(let i=0;i<previousSpectrum.length;i++) {
      const db=bins[i],m=Number.isFinite(db)?10**(db/20):0,value=Number.isFinite(m)?m:0
      changes[i]=prime?0:Math.max(0,value-previousSpectrum[i]);previousSpectrum[i]=value
    }
    for(const [index,name] of ONSET_BANDS.entries()) {
      const band=bands[index],current=band.current;band.history.prune(time)
      let power=0;for(let k=ranges[index][0];k<ranges[index][1];k++)power+=changes[k]*changes[k]
      current.time=time;current.novelty=Math.sqrt(2*power/BLACKMAN_MEAN_SQUARE);current.threshold=band.history.threshold();current.rms=rms[BAND_NAMES[index]];current.total=total
      const baseline=band.history.baseline(time,current.rms,total);current.rise=prime?0:baseline.rise;current.falling=baseline.falling
      // Preserve the pre-attack minimum through a rising novelty segment. At
      // coarse cadences the peak's own 50 ms history can already contain only
      // elevated RMS; extending observation alone cannot recover that baseline.
      const minimum=current.rms-current.rise
      current.baseline=current.novelty>band.previous.novelty&&band.previous.novelty>band.beforeNovelty?Math.min(band.previous.baseline,minimum):minimum
      const d=view.debug[name];d.novelty=current.novelty;d.threshold=current.threshold;d.rms=current.rms;d.rise=current.rise;d.decision=prime?'priming':'not-peak'
    }
    const attackPower=bands.reduce((sum,b)=>sum+Math.max(b.previous.novelty,b.current.novelty)**2,0)
    if(!prime)for(const [index,name] of ONSET_BANDS.entries()) {
      const b=bands[index],p=b.previous,d=view.debug[name]
      const a=b.attack,wasObserving=a.active
      if(!wasObserving&&p.novelty>b.beforeNovelty&&p.novelty>=b.current.novelty&&p.novelty>=p.threshold) {
        const reason=attackPower===0||p.novelty*p.novelty/attackPower<ONSET_SETTINGS.noveltyPowerShare?'share':
          p.time-b.lastEvent<ONSET_SETTINGS.spacingSeconds?'spacing':!b.armed?'rearm':null
        if(reason){d.rejected[reason]++;d.decision=reason}
        else {
          a.active=true;a.time=p.time;a.deadline=p.time+ONSET_SETTINGS.attackWindowSeconds;a.threshold=p.threshold
          a.baseline=p.baseline;a.maximumRms=p.rms;a.totalAtMaximum=p.total;a.falling=p.falling
        }
      }
      if(a.active) {
        if(time<=a.deadline+1e-12){
          a.falling ||= b.current.falling
          if(b.current.rms>a.maximumRms){a.maximumRms=b.current.rms;a.totalAtMaximum=b.current.total}
        }
        d.observedRms=a.maximumRms;d.attackRise=Math.max(0,a.maximumRms-a.baseline)
        d.pendingPeak=a.time;d.earliestEmission=a.deadline;d.decision='observing'
        if(time+1e-12>=a.deadline) {
          // Qualify at the band's RMS maximum, before a weak release tail can
          // appear dominant merely because its stronger neighbour has faded.
          const weak=a.totalAtMaximum>0&&(a.maximumRms/a.totalAtMaximum)**2<ONSET_SETTINGS.noveltyPowerShare
          const reason=a.maximumRms<ONSET_SETTINGS.rmsFloor?'belowRms':d.attackRise<ONSET_SETTINGS.riseFloor?'noRise':a.falling&&weak?'falling':null
          if(reason){d.rejected[reason]++;d.decision=reason}
          else {
            a.ready=true;d.decision='accepted'
          }
          a.active=false;d.pendingPeak=d.earliestEmission=null
        }
      }
      if(b.current.novelty<ONSET_SETTINGS.rearmFraction*b.trigger)b.armed=true
    }
    // Irregular feature ticks can mature multiple different peak times at once.
    // Publish in peak-time order so sequence consumers retain a chronological
    // event window, without sorting/allocating another per-update collection.
    for(let emitted=0;emitted<bands.length;emitted++) {
      let selected=-1
      for(let i=0;i<bands.length;i++)if(bands[i].attack.ready&&(selected<0||bands[i].attack.time<bands[selected].attack.time))selected=i
      if(selected<0)break
      const b=bands[selected],a=b.attack,name=ONSET_BANDS[selected],d=view.debug[name]
      const event=Object.freeze({session:view.session,sequence:++view.sequence,band:name,timeSeconds:a.time,emittedAtSeconds:time,strength:Math.max(0,Math.min(1,d.attackRise/ONSET_SETTINGS.strengthReference))})
      view.events.push(event);d.accepted++;a.ready=false;b.trigger=a.threshold;b.lastEvent=a.time
      b.armed=b.current.novelty<ONSET_SETTINGS.rearmFraction*b.trigger
    }
    for(const b of bands){b.history.append(time,b.current.novelty,b.current.rms,total);b.beforeNovelty=b.previous.novelty;Object.assign(b.previous,b.current)}
    while(view.events.length>ONSET_SETTINGS.eventCapacity||(view.events[0]&&view.events[0].timeSeconds<time-ONSET_SETTINGS.eventSeconds))view.events.shift()
    view.primed=true;previousTime=time;return view
  }}
}

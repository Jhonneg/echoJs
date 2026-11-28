// Known generated FFT tone spectra through the unchanged production MI engine.
// No media capture, no musical-section inference: labels are authored test phases.
import {mkdir,writeFile} from 'node:fs/promises'
import {createMusicAnalysis} from '../src/audio/music/analysis.ts'
const seconds=38,hz=60,rate=48000,fft=2048,engine=createMusicAnalysis(),bins=new Float32Array(1024)
const bands=['subBass','bass','lowMids','highMids','presence','air'],frequencies=[46.875,140.625,468.75,1500,4500,10007.8125]
const lowHits=[15.5,16.5,17.5,18.5,19.5,20.5],midHits=[15.9,17.1,18.9,20.1],highHits=[16.2,18.2,20.2]
const phases=[{start:0,end:3,label:'silence / priming'},{start:3,end:7,label:'quiet sustained mix'},
 {start:7,end:15,label:'gradual build'},{start:15,end:21,label:'layered qualified attacks'},{start:21,end:38,label:'release into silence'}]
const frames:any[]=[]
for(let i=1;i<=seconds*hz;i++){
 const time=i/hz,amplitudes=bands.map(()=>0)
 let base=0
 if(time>=3&&time<7)base=.03
 if(time>=7&&time<15)base=.03+.19*(time-7)/8
 if(time>=15&&time<21)base=.16
 const weights=[.2,.8,.55,.65,.25,.15]
 for(let b=0;b<6;b++)amplitudes[b]=base*weights[b]
 const hit=(times,length)=>times.reduce((sum,start)=>sum+(time>=start&&time<start+length?.22*Math.sin(Math.PI*(time-start)/length):0),0)
 amplitudes[1]+=hit(lowHits,.14);amplitudes[3]+=hit(midHits,.12);amplitudes[4]+=hit(highHits,.10)
 bins.fill(-Infinity)
 for(let b=0;b<6;b++)if(amplitudes[b]>0){const k=Math.round(frequencies[b]*fft/rate)
  for(let off=-2;off<=2;off++)bins[k+off]=20*Math.log10(amplitudes[b]*[.02,.125,.21,.125,.02][off+2])
 }
 engine.update(bins,rate,fft,time*1000,true)
 const v=engine.reader.read();frames.push({time,amplitudes,features:structuredClone(v)})
}
const report:Record<string,any>={method:'Authored synthetic Blackman spectra; existing production createMusicAnalysis, 48kHz/2048 at60Hz. No audio captured, no raw media stored. Phase names describe this test schedule only.',seconds,hz,phases,hits:{low:lowHits,mid:midHits,high:highHits},frames}
await mkdir('docs/evidence/bloom/bl07',{recursive:true});await writeFile('docs/evidence/bloom/bl07/generated-sequence.json',JSON.stringify(report)+'\n')
console.log(JSON.stringify({seconds,frames:frames.length,eventCount:frames.at(-1).features.sequence,phases},null,2))

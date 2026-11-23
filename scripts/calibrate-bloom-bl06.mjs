// Generated periodic-bin tone spectra only; existing production MI processor.
import {mkdir,writeFile} from 'node:fs/promises'
import {createMusicAnalysis} from '../src/audio/music/analysis.ts'
const bands=['subBass','bass','lowMids','highMids','presence','air'],frequencies=[46.875,140.625,468.75,1500,4500,10007.8125]
const report=[]
for(let band=0;band<6;band++)for(const amplitude of [.03,.10,.30]){
 const engine=createMusicAnalysis(),bins=new Float32Array(1024),events=[];let peak=0,context=0
 for(let i=1;i<=480;i++){
  bins.fill(-Infinity)
  const pulse=i>=180&&i<240||i>=300&&i<360||i>=420
  if(pulse){const k=Math.round(frequencies[band]*2048/48000);for(let off=-2;off<=2;off++)bins[k+off]=20*Math.log10(amplitude*[.02,.125,.21,.125,.02][off+2])}
  engine.update(bins,48000,2048,i*1000/60,true)
  const v=engine.reader.read();if(pulse)peak=Math.max(peak,v.energy.six[bands[band]])
  context=Math.max(context,v.context.intensity)
  for(const e of v.events)if(!events.some(x=>x.sequence===e.sequence))events.push({...e})
 }
 report.push({band:bands[band],amplitude,peakLinearEnergy:peak,peakContextIntensity:context,eventStrengths:events.map(e=>e.strength),broadBands:[...new Set(events.map(e=>e.band))]})
}
await mkdir('docs/evidence/bloom/bl06',{recursive:true});await writeFile('docs/evidence/bloom/bl06/calibration.json',JSON.stringify({method:'Known Blackman-windowed periodic FFT tone bins, 48kHz/2048, existing createMusicAnalysis; synthetic spectra, not captured audio.',report},null,2)+'\n')
console.log(JSON.stringify(report.map(({band,amplitude,peakLinearEnergy,eventStrengths})=>({band,amplitude,peakLinearEnergy,eventStrengths})),null,2))

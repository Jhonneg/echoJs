// Generated PCM only; no captured content.
import {writeFile} from 'node:fs/promises'
const rate=48000,seconds=64,wav=Buffer.alloc(44+rate*seconds*2)
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40)
export const sections=[['silence',0,3],['moderate bass',3,10],['silence',10,13],['strong bass',13,20],['silence',20,23],['isolated bass onset',23,26],['bass hits 2Hz',26,31],['bass hits 4Hz',31,35],['silence',35,38],['bass-free mix',38,44],['silence',44,50],['mixed frequencies',50,56],['silence release',56,64]]
const hits=[23.3,...Array.from({length:10},(_,i)=>26+i*.5),...Array.from({length:16},(_,i)=>31+i*.25)]
for(let i=0;i<rate*seconds;i++){
 const t=i/rate,fade=(a,b)=>Math.max(0,Math.min(1,(t-a)/.012,(b-t)/.012))
 let bass=t>=3&&t<10?.2*fade(3,10):t>=13&&t<20?.4*fade(13,20):0
 for(const a of hits)if(t>=a&&t<a+.12)bass+=.3*fade(a,a+.12)
 let v=bass*Math.sin(2*Math.PI*100*t)
 if((t>=38&&t<44)||(t>=50&&t<56)){
  const a=t<44?38:50,b=t<44?44:56
  v+=fade(a,b)*(.10*Math.sin(2*Math.PI*450*t)+.08*Math.sin(2*Math.PI*1000*t)+.06*Math.sin(2*Math.PI*8000*t))
  if(a===50)v+=fade(a,b)*.15*Math.sin(2*Math.PI*100*t)
 }
 wav.writeInt16LE(Math.round(v*32767),44+i*2)
}
await writeFile('/tmp/echo-lavender-corona-noise.wav',wav)
await writeFile('/tmp/echo-lavender-corona-noise-schedule.json',JSON.stringify({rate,seconds,sections,hits},null,2))
console.log('/tmp/echo-lavender-corona-noise.wav')

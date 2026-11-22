// Entirely generated NT10 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const rate=48000,seconds=45,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:2,label:'silence'},{start:2,end:10,label:'quiet mixed110/450/1500/8000Hz'},{start:10,end:20,label:'energetic mixed110/450/1500/8000Hz with repeated attacks'},{start:20,end:45,label:'return to silence and atmosphere recovery'}]
const attacks=Array.from({length:20},(_,i)=>10.2+i*.48)
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let amplitude=0
 if(t>=2&&t<10)amplitude=.025*fade(2,10)
 if(t>=10&&t<20)amplitude=.12*fade(10,20)
 let hit=0;for(const a of attacks)if(t>=a&&t<a+.07)hit=.08*fade(a,a+.07)
 const value=(amplitude+hit)*(Math.sin(2*Math.PI*110*t)+Math.sin(2*Math.PI*450*t)+Math.sin(2*Math.PI*1500*t)+Math.sin(2*Math.PI*8000*t))
 wav.writeInt16LE(Math.round(32767*value),44+i*2)
}
const audio=join(tmpdir(),'echo-nocturne-atmosphere-review.wav'),schedule=join(tmpdir(),'echo-nocturne-atmosphere-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks},null,2));console.log(audio)

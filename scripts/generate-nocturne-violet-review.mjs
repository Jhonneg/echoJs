// Entirely generated NT08 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const rate=48000,seconds=20,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:1,label:'silence'},{start:1,end:3,label:'bass110Hz only'},{start:3,end:5,label:'low-mid450Hz only'},{start:5,end:7,label:'quiet presence4500Hz'},{start:7,end:9,label:'loud presence4500Hz'},{start:9,end:11,label:'isolated high8000Hz attacks9.2 and10.2s'},{start:11,end:14,label:'dense high8000Hz attacks every100ms'},{start:14,end:16,label:'sustained air12000Hz'},{start:16,end:18,label:'mixed frequencies and high attacks16.2 and17.2s'},{start:18,end:20,label:'silence'}]
const attacks=[9.2,10.2,...Array.from({length:29},(_,i)=>11.1+i*.1),16.2,17.2]
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,mid=0,presence=0,high=0,air=0
 if(t>=1&&t<3)bass=.2*fade(1,3)
 if(t>=3&&t<5)mid=.2*fade(3,5)
 if(t>=5&&t<7)presence=.06*fade(5,7)
 if(t>=7&&t<9)presence=.2*fade(7,9)
 if(t>=14&&t<16)air=.15*fade(14,16)
 if(t>=16&&t<18){bass=.14*fade(16,18);mid=.1*fade(16,18)}
 for(const a of attacks)if(t>=a&&t<a+.045)high+=.3*fade(a,a+.045)
 wav.writeInt16LE(Math.round(32767*(bass*Math.sin(2*Math.PI*110*t)+mid*Math.sin(2*Math.PI*450*t)+presence*Math.sin(2*Math.PI*4500*t)+high*Math.sin(2*Math.PI*8000*t)+air*Math.sin(2*Math.PI*12000*t))),44+i*2)
}
const audio=join(tmpdir(),'echo-nocturne-violet-review.wav'),schedule=join(tmpdir(),'echo-nocturne-violet-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks},null,2));console.log(audio)

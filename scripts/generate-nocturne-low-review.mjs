// Entirely generated NT05 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const rate=48000,seconds=17,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:1,label:'silence'},{start:1,end:3,label:'quiet bass110Hz'},{start:3,end:5,label:'loud bass110Hz'},{start:5,end:6,label:'silence release'},{start:6,end:10,label:'bass sustain + four short attacks'},{start:10,end:12,label:'sub-bass47Hz'},{start:12,end:14,label:'high-mid1500Hz only'},{start:14,end:15,label:'high8000Hz only'},{start:15,end:17,label:'silence'}]
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,sub=0,mid=0,high=0
 if(t>=1&&t<3)bass=.06*fade(1,3)
 if(t>=3&&t<5)bass=.24*fade(3,5)
 if(t>=6&&t<10){bass=.1*fade(6,10);for(const a of [6.25,7.05,7.85,8.65])if(t>=a&&t<a+.11)bass+=.36*fade(a,a+.11)}
 if(t>=10&&t<12)sub=.2*fade(10,12)
 if(t>=12&&t<14)mid=.2*fade(12,14)
 if(t>=14&&t<15)high=.15*fade(14,15)
 wav.writeInt16LE(Math.round(32767*(bass*Math.sin(2*Math.PI*110*t)+sub*Math.sin(2*Math.PI*47*t)+mid*Math.sin(2*Math.PI*1500*t)+high*Math.sin(2*Math.PI*8000*t))),44+i*2)
}
const audio=join(tmpdir(),'echo-nocturne-low-review.wav'),schedule=join(tmpdir(),'echo-nocturne-low-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks:[6.25,7.05,7.85,8.65]},null,2));console.log(audio)

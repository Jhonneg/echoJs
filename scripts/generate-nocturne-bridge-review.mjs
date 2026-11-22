// Entirely generated NT07 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const rate=48000,seconds=18,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:1,label:'silence'},{start:1,end:4,label:'isolated bass attacks110Hz at1.2 and2.7s'}, {start:4,end:7,label:'held bass110Hz: no automatic cycling'}, {start:7,end:11,label:'dense bass attacks every200ms: ignored during active sweep/cooldown'}, {start:11,end:13,label:'mid1500Hz only: no bridge trigger'}, {start:13,end:14,label:'weak bass attack110Hz at13.2s'}, {start:14,end:16,label:'mixed110Hz +1500Hz with attacks14.2 and15.5s'}, {start:16,end:18,label:'silence'}]
const attacks=[1.2,2.7,...Array.from({length:20},(_,i)=>7.1+i*.2),13.2,14.2,15.5]
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,sub=0,mid=0,high=0
 if(t>=4&&t<7)bass=.14*fade(4,7)
 if(t>=11&&t<13)mid=.2*fade(11,13)
 if(t>=14&&t<16){bass=.06*fade(14,16);mid=.15*fade(14,16)}
 for(const a of attacks)if(t>=a&&t<a+.1)bass+=(a===13.2?.1:.4)*fade(a,a+.1)
 wav.writeInt16LE(Math.round(32767*(bass*Math.sin(2*Math.PI*110*t)+sub*Math.sin(2*Math.PI*47*t)+mid*Math.sin(2*Math.PI*1500*t)+high*Math.sin(2*Math.PI*8000*t))),44+i*2)
}
const audio=join(tmpdir(),'echo-nocturne-bridge-review.wav'),schedule=join(tmpdir(),'echo-nocturne-bridge-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks},null,2));console.log(audio)

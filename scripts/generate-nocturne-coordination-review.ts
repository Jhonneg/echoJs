// Entirely generated NT11 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const rate=48000,seconds=55,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:3,label:'quiet intro:1500Hz pad'},{start:3,end:9,label:'bass entrance:110Hz sustain and attacks'},{start:9,end:15,label:'midrange addition:450/1500Hz plus bass'},{start:15,end:23,label:'dense mixed passage with staggered low/mid/high attacks'},{start:23,end:29,label:'breakdown:quiet1500Hz pad only'},{start:29,end:37,label:'return:layered mixed-frequency content'},{start:37,end:55,label:'silence and atmosphere recovery'}]
const series=(a,b,step)=>Array.from({length:Math.ceil((b-a)/step)},(_,i)=>a+i*step).filter(t=>t<b)
const attacks={low:[...series(3.4,15,1),...series(15.1,23,.6),...series(29.1,37,.6)],mid:[...series(15.4,23,.75),...series(29.4,37,.75)],high:[...series(15.2,23,.45),...series(29.2,37,.45)]}
let peak=0
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,lowMid=0,highMid=0,presence=0,air=0
 if(t<3)highMid=.025*fade(0,3)
 if(t>=3&&t<9)bass=.14*fade(3,9)
 if(t>=9&&t<15){bass=.1*fade(9,15);lowMid=.08*fade(9,15);highMid=.07*fade(9,15)}
 if((t>=15&&t<23)||(t>=29&&t<37)){
  const a=t<23?15:29,b=t<23?23:37
  bass=.12*fade(a,b);lowMid=.1*fade(a,b);highMid=.09*fade(a,b);presence=.04*fade(a,b);air=.04*fade(a,b)
 }
 if(t>=23&&t<29)highMid=.035*fade(23,29)
 for(const a of attacks.low)if(t>=a&&t<a+.09)bass+=.1*fade(a,a+.09)
 for(const a of attacks.mid)if(t>=a&&t<a+.08)highMid+=.14*fade(a,a+.08)
 for(const a of attacks.high)if(t>=a&&t<a+.055)air+=.15*fade(a,a+.055)
 const value=bass*Math.sin(2*Math.PI*110*t)+lowMid*Math.sin(2*Math.PI*450*t)+highMid*Math.sin(2*Math.PI*1500*t)+presence*Math.sin(2*Math.PI*4500*t)+air*Math.sin(2*Math.PI*8000*t)
 peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>1)throw Error('Generated fixture clips')
 wav.writeInt16LE(Math.round(32767*value),44+i*2)
}
const audio=join(tmpdir(),'echo-nocturne-coordination-review.wav'),schedule=join(tmpdir(),'echo-nocturne-coordination-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks,peak},null,2));console.log(audio)

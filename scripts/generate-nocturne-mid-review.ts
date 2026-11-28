// NT06 generated midrange isolation/qualification fixture; no captured media.
import {writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const rate=48000,seconds=20,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:1,label:'silence'},{start:1,end:3,label:'bass110Hz only'},{start:3,end:4,label:'silence'},{start:4,end:6,label:'low-mid450Hz only'},{start:6,end:8,label:'high-mid1500Hz only'},{start:8,end:11,label:'low-mid sustain + four attacks'},{start:11,end:14,label:'stationary high mids + low-mid attacks'},{start:14,end:16,label:'bass + stationary high mids'},{start:16,end:20,label:'silence release'}]
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,low=0,high=0
 if(t>=1&&t<3)bass=.24*fade(1,3)
 if(t>=4&&t<6)low=.14*fade(4,6)
 if(t>=6&&t<8)high=.2*fade(6,8)
 if(t>=8&&t<11){low=.1*fade(8,11);for(const a of [8.25,8.9,9.55,10.2])if(t>=a&&t<a+.11)low+=.3*fade(a,a+.11)}
 if(t>=11&&t<16)high=.14*fade(11,16)
 if(t>=11&&t<14)for(const a of [11.6,12.4,13.2])if(t>=a&&t<a+.11)low=.28*fade(a,a+.11)
 if(t>=14&&t<16)bass=.18*fade(14,16)
 wav.writeInt16LE(Math.round(32767*(bass*Math.sin(2*Math.PI*110*t)+low*Math.sin(2*Math.PI*450*t)+high*Math.sin(2*Math.PI*1500*t))),44+i*2)
}
writeFileSync(join(tmpdir(),'echo-nocturne-mid-review.wav'),wav)
writeFileSync(join(tmpdir(),'echo-nocturne-mid-review-sections.json'),JSON.stringify({rate,seconds,sections},null,2))

import { writeFileSync } from 'node:fs'
const rate=48000, duration=16.5, count=Math.round(rate*duration), wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:1,label:'silence'},{start:1,end:3,label:'bass-only 110 Hz'},{start:3,end:4,label:'silence'},{start:4,end:6,label:'low-mid-only 450 Hz'},{start:6,end:7,label:'silence'},{start:7,end:9,label:'high-mid sustain 1500 Hz'},{start:9,end:12.5,label:'high-mid sustain + short attacks 1500 Hz'},{start:12.5,end:13.5,label:'silence'},{start:13.5,end:15.5,label:'bass + high-mid mixed'},{start:15.5,end:16.5,label:'silence'}]
for(let i=0;i<count;i++){
 const t=i/rate, fade=(begin,end)=>Math.min(1,Math.max(0,(t-begin)/.012),Math.max(0,(end-t)/.012))
 let bass=0,low=0,high=0
 if(t>=1&&t<3)bass=.24*fade(1,3)
 if(t>=4&&t<6)low=.22*fade(4,6)
 if(t>=7&&t<9)high=.14*fade(7,9)
 if(t>=9&&t<12.5){high=.10;for(let j=0;j<5;j++){const at=9.25+j*.55;if(t>=at&&t<at+.11)high+=.36*fade(at,at+.11)}}
 if(t>=13.5&&t<15.5){bass=.18*fade(13.5,15.5);high=.12*fade(13.5,15.5)}
 const sample=bass*Math.sin(2*Math.PI*110*t)+low*Math.sin(2*Math.PI*450*t)+high*Math.sin(2*Math.PI*1500*t)
 wav.writeInt16LE(Math.round(32767*Math.max(-1,Math.min(1,sample))),44+i*2)
}
const path='/tmp/echo-nocturne-generated-review.wav';writeFileSync(path,wav)
writeFileSync('/tmp/echo-nocturne-generated-review-sections.json',JSON.stringify({sampleRate:rate,duration,sections,attacks:[9.25,9.8,10.35,10.9,11.45]},null,2))
console.log(path)

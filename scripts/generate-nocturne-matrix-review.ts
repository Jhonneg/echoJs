// Entirely generated NT12 test signal. No captured media.
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const refinement=process.env.ECHO_MATRIX_REFINEMENT==='1'
const rate=48000,seconds=refinement?65:60,count=rate*seconds,wav=Buffer.alloc(44+count*2)
wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40)
const sections=[{start:0,end:2,label:'silence'},{start:2,end:5,label:'bass100Hz sustain'},{start:5,end:8,label:'low-mid450Hz sustain'},{start:8,end:11,label:'quiet high-mid1000Hz sustain'},{start:11,end:14,label:'loud high-mid1000Hz sustain'},{start:14,end:17,label:'high8000Hz sustain'},{start:17,end:19,label:'silence release'},{start:19,end:22,label:'isolated100Hz attacks'},{start:22,end:25,label:'isolated1000Hz attacks'},{start:25,end:28,label:'isolated8000Hz attacks'},{start:28,end:33,label:'bass+held1000Hz, bass attacks only'},{start:33,end:38,label:'low-mid450Hz attacks near held1000Hz'},{start:38,end:44,label:'rising/falling1000Hz dynamics'},{start:44,end:60,label:'silence recovery'}]
if(refinement){sections.pop();sections.push({start:44,end:49,label:'dense100/450/1000/8000Hz mix'},{start:49,end:65,label:'silence recovery'})}
const attacks={low:[19.2,20.1,29,31],mid:[22.2,23.1],high:[25.2,26.1],lowMid:[34,35.4,36.8]}
let peak=0
for(let i=0;i<count;i++){
 const t=i/rate,fade=(a,b)=>Math.min(1,Math.max(0,(t-a)/.012),Math.max(0,(b-t)/.012))
 let bass=0,lowMid=0,highMid=0,air=0
 if(t>=2&&t<5)bass=.2*fade(2,5)
 if(t>=5&&t<8)lowMid=.2*fade(5,8)
 if(t>=8&&t<11)highMid=.06*fade(8,11)
 if(t>=11&&t<14)highMid=.2*fade(11,14)
 if(t>=14&&t<17)air=.2*fade(14,17)
 for(const a of attacks.low)if(t>=a&&t<a+.12)bass+=.3*fade(a,a+.12)
 for(const a of attacks.mid)if(t>=a&&t<a+.12)highMid+=.3*fade(a,a+.12)
 for(const a of attacks.high)if(t>=a&&t<a+.12)air+=.3*fade(a,a+.12)
 if(t>=28&&t<33)bass+=.1*fade(28,33)
 if(t>=28&&t<38)highMid+=.1*fade(28,38)
 for(const a of attacks.lowMid)if(t>=a&&t<a+.12)lowMid+=.3*fade(a,a+.12)
 if(t>=38&&t<44)highMid=(.025+.175*(1-Math.abs(t-41)/3))*fade(38,44)
 if(refinement&&t>=44&&t<49){bass=.15*fade(44,49);lowMid=.12*fade(44,49);highMid=.12*fade(44,49);air=.08*fade(44,49)}
 const value=bass*Math.sin(2*Math.PI*100*t)+lowMid*Math.sin(2*Math.PI*450*t)+highMid*Math.sin(2*Math.PI*1000*t)+air*Math.sin(2*Math.PI*8000*t)
 peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>1)throw Error('Generated fixture clips')
 wav.writeInt16LE(Math.round(32767*value),44+i*2)
}
const audio=join(tmpdir(),refinement?'echo-nocturne-r4-review.wav':'echo-nocturne-matrix-review.wav'),schedule=join(tmpdir(),refinement?'echo-nocturne-r4-review-sections.json':'echo-nocturne-matrix-review-sections.json')
writeFileSync(audio,wav);writeFileSync(schedule,JSON.stringify({rate,seconds,sections,attacks,peak},null,2));console.log(audio)

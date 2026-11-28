import assert from 'node:assert/strict'
import { test } from 'node:test'
import { audioFeedback } from '../src/components/audioFeedback.ts'
import type { CaptureState } from '../src/audio/tabCapture.ts'
import type { LocalFileState } from '../src/audio/localFile.ts'
import type { AnalysisHealth } from '../src/audio/health.ts'
const capture:CaptureState={status:'disconnected',audioTracks:0,message:'Disconnected'},local:LocalFileState={status:'empty',name:'',message:'Choose audio'},running={status:'running',message:'Running'} as AnalysisHealth
test('visible recovery distinguishes capture failure, suspension, silent connection and graph failure',()=>{
 const get=(c:Partial<CaptureState>,h=running,receiving=false)=>audioFeedback('tab',{...capture,...c},local,h,receiving)
 assert.equal(get({status:'connecting'}).action,'cancel')
 assert.equal(get({status:'unsupported',message:'Unavailable'}).action,'choose-file')
 assert.equal(get({status:'error',message:'Denied'}).action,'retry-tab')
 assert.equal(get({status:'connected'}).text,'Tab connected · waiting for sound.')
 assert.equal(get({status:'connected'},running,true).text,'Listening to your shared tab.')
 const failure=get({status:'connected'},{status:'error',message:'Graph failed'})
 assert.equal(failure.text,'Graph failed');assert.equal(failure.action,'reconnect-tab');assert.equal(failure.tone,'error')
 assert.equal(get({status:'connected'},{status:'suspended',message:'Suspended'}).action,'resume')
 assert.equal(get({status:'connected'},{status:'idle',message:'Idle'}).tone,'error')
})
test('file decode and blocked-play errors retain actionable messages without confusing pause with silence',()=>{
 const get=(l:Partial<LocalFileState>)=>audioFeedback('file',capture,{...local,...l},running,false)
 assert.equal(get({status:'error',message:'Decode failed'}).action,'choose-file')
 assert.equal(get({status:'paused',message:'Paused'}).text,'Paused')
 assert.equal(get({status:'paused',message:'Blocked',retryPlayback:true}).action,'play')
 assert.equal(get({status:'playing'}).text,'Playing local audio.')
})
test('APP02: a switch notice overrides source feedback; errors offer a file choice',()=>{
 const connected:CaptureState={...capture,status:'connected'}
 assert.equal(audioFeedback('tab',connected,local,running,true,{text:'Opening x.wav…',tone:'neutral'}).action,null)
 const failed=audioFeedback('tab',connected,local,running,true,{text:'x.wav could not be played',tone:'error'})
 assert.equal(failed.text,'x.wav could not be played');assert.equal(failed.action,'choose-file');assert.equal(failed.tone,'error')
 assert.equal(audioFeedback('tab',connected,local,running,true,null).text,'Listening to your shared tab.')
})

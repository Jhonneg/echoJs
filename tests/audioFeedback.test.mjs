import assert from 'node:assert/strict'
import { test } from 'node:test'
import { audioFeedback } from '../src/components/audioFeedback.ts'
const capture={status:'disconnected',message:'Disconnected'},local={status:'empty',message:'Choose audio'},running={status:'running',message:'Running'}
test('visible recovery distinguishes capture failure, suspension, silent connection and graph failure',()=>{
 const get=(c,h=running,receiving=false)=>audioFeedback('tab',{...capture,...c},local,h,receiving)
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
 const get=l=>audioFeedback('file',capture,{...local,...l},running,false)
 assert.equal(get({status:'error',message:'Decode failed'}).action,'choose-file')
 assert.equal(get({status:'paused',message:'Paused'}).text,'Paused')
 assert.equal(get({status:'paused',message:'Blocked',retryPlayback:true}).action,'play')
 assert.equal(get({status:'playing'}).text,'Playing local audio.')
})
test('APP02: a switch notice overrides source feedback; errors offer a file choice',()=>{
 const connected={...capture,status:'connected'}
 assert.equal(audioFeedback('tab',connected,local,running,true,{text:'Opening x.wav…',tone:'neutral'}).action,null)
 const failed=audioFeedback('tab',connected,local,running,true,{text:'x.wav could not be played',tone:'error'})
 assert.equal(failed.text,'x.wav could not be played');assert.equal(failed.action,'choose-file');assert.equal(failed.tone,'error')
 assert.equal(audioFeedback('tab',connected,local,running,true,null).text,'Listening to your shared tab.')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTabCapture } from '../src/audio/tabCapture.ts'

function setup() {
  const states = []
  const requests = []
  Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
  Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: {
    getDisplayMedia(options) {
      assert.deepEqual(options, { video: true, audio: true })
      return new Promise((resolve, reject) => requests.push({ resolve, reject }))
    },
  } }, configurable: true })
  return { states, requests, capture: createTabCapture((state) => states.push(state)) }
}
function stream(audio = true) {
  const tracks = (audio ? ['video', 'audio'] : ['video']).map((kind) => {
    const track = new EventTarget()
    Object.assign(track, { kind, readyState: 'live', stops: 0, stop() { this.stops++; this.readyState = 'ended' } })
    return track
  })
  return { getTracks: () => tracks, getAudioTracks: () => tracks.filter((t) => t.kind === 'audio') }
}
function stopped(value) { assert.ok(value.getTracks().every((t) => t.readyState === 'ended')) }

test('connect, duplicate connect, disconnect and reconnect cleanly', async () => {
  const { capture, requests, states } = setup()
  const pending = capture.connect()
  await capture.connect()
  assert.equal(requests.length, 1)
  const first = stream()
  requests[0].resolve(first)
  await pending
  assert.equal(states.at(-1).status, 'connected')
  assert.equal(states.at(-1).audioTracks, 1)
  capture.disconnect()
  capture.disconnect()
  stopped(first)
  assert.ok(first.getTracks().every((t) => t.stops === 1))
  const next = capture.connect()
  const second = stream()
  requests[1].resolve(second)
  await next
  capture.dispose()
  stopped(second)
})
test('missing audio stops video and allows retry', async () => {
  const { capture, requests, states } = setup()
  const pending = capture.connect()
  const video = stream(false)
  requests[0].resolve(video)
  await pending
  stopped(video)
  assert.equal(states.at(-1).status, 'error')
  assert.equal(states.at(-1).audioTracks, 0)
  const retry = capture.connect()
  requests[1].reject(new DOMException('cancelled', 'NotAllowedError'))
  await retry
  assert.match(states.at(-1).message, /cancelled or denied/)
})
test('either track ending releases all tracks and removes listeners', async () => {
  for (const index of [0, 1]) {
    const { capture, requests, states } = setup()
    const pending = capture.connect()
    const value = stream()
    requests[0].resolve(value)
    await pending
    value.getTracks()[index].dispatchEvent(new Event('ended'))
    stopped(value)
    assert.equal(states.at(-1).status, 'ended')
    const count = states.length
    value.getTracks()[index].dispatchEvent(new Event('ended'))
    assert.equal(states.length, count)
  }
})
test('stale resolution cannot replace newer stream; stale rejection cannot replace state', async () => {
  const { capture, requests, states } = setup()
  const old = capture.connect()
  capture.disconnect()
  const current = capture.connect()
  const active = stream()
  requests[1].resolve(active)
  await current
  const stale = stream()
  requests[0].resolve(stale)
  await old
  stopped(stale)
  assert.equal(states.at(-1).status, 'connected')
  assert.ok(active.getTracks().every((t) => t.readyState === 'live'))
  capture.disconnect()
  const rejected = capture.connect()
  capture.disconnect()
  requests[2].reject(new DOMException('denied', 'NotAllowedError'))
  await rejected
  assert.equal(states.at(-1).status, 'disconnected')
})
test('dispose during picker stops eventual stream without state updates', async () => {
  const { capture, requests, states } = setup()
  const pending = capture.connect()
  capture.dispose()
  const count = states.length
  const late = stream()
  requests[0].resolve(late)
  await pending
  stopped(late)
  assert.equal(states.length, count)
  await capture.connect()
  assert.equal(requests.length, 1)
})
test('unsupported context and error labels', async () => {
  const { capture, states, requests } = setup()
  Object.defineProperty(globalThis, 'isSecureContext', { value: false, configurable: true })
  await capture.connect()
  assert.equal(states.at(-1).status, 'unsupported')
  assert.equal(requests.length, 0)
  Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
  for (const name of ['InvalidStateError', 'NotFoundError', 'NotReadableError', 'AbortError', 'TypeError']) {
    const pending = capture.connect()
    requests.at(-1).reject(new DOMException('failure', name))
    await pending
    assert.equal(states.at(-1).status, 'error')
    assert.ok(states.at(-1).message)
  }
})

test('analysis starts with acquired stream and stops with capture lifecycle', async () => {
  setup()
  let resolve
  navigator.mediaDevices.getDisplayMedia = () => new Promise((done) => { resolve = done })
  const calls = []
  const capture = createTabCapture(() => {}, {
    prepare() { calls.push('prepare'); return {ok:true} },
    start(stream) { assert.equal(stream.getAudioTracks().length, 1); calls.push('start'); return {ok:true} },
    stop() { calls.push('stop') },
  })
  const pending = capture.connect()
  assert.deepEqual(calls, ['prepare'])
  const value = stream()
  resolve(value)
  await pending
  assert.deepEqual(calls, ['prepare', 'start'])
  value.getTracks()[0].dispatchEvent(new Event('ended'))
  assert.deepEqual(calls, ['prepare', 'start', 'stop'])
  stopped(value)
})

test('prepare failure never opens the picker or reports a connected source',async()=>{
 const {requests,states}=setup();let stops=0
 const capture=createTabCapture(s=>states.push(s),{prepare:()=>({ok:false,message:'Context unavailable'}),start:()=>assert.fail('start after prepare failure'),stop(){stops++}})
 await capture.connect();assert.equal(requests.length,0);assert.equal(states.at(-1).status,'error');assert.equal(states.at(-1).message,'Context unavailable');assert.equal(stops,1)
})
test('graph attachment failure releases every acquired track and permits a successful retry',async()=>{
 const {requests,states}=setup();let succeeds=false
 const capture=createTabCapture(s=>states.push(s),{prepare:()=>({ok:true}),start:()=>succeeds?{ok:true}:{ok:false,message:'Graph failed'},stop(){}})
 const first=capture.connect(),bad=stream();requests[0].resolve(bad);await first
 stopped(bad);assert.equal(states.at(-1).status,'error');assert.equal(states.at(-1).message,'Graph failed');assert.equal(states.at(-1).audioTracks,0)
 succeeds=true;const retry=capture.connect(),good=stream();requests[1].resolve(good);await retry
 assert.equal(states.at(-1).status,'connected');capture.dispose();stopped(good)
})

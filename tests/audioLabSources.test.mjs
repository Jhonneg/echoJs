import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLabSources } from '../src/dev/audioLab/sources.ts'

function setup() {
  const requests = [], elements = [], states = [], calls = [], revoked = []
  Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })
  Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: {
    getDisplayMedia(options) {
      assert.deepEqual(options, { video: true, audio: true })
      return new Promise((resolve, reject) => requests.push({ resolve, reject }))
    },
  } }, configurable: true })
  globalThis.Audio = class extends EventTarget {
    paused = true; ended = false
    constructor() { super(); elements.push(this) }
    play() { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve() }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')) }
    removeAttribute() {}
    load() {}
  }
  let urls=0
  URL.createObjectURL = () => `blob:synthetic-${++urls}`
  URL.revokeObjectURL = value => revoked.push(value)
  const analysis = { prepare() { calls.push('prepare') }, start(stream) { calls.push(stream) },
    startElement(element) { calls.push(element); return true }, resume() { calls.push('resume') }, stop() { calls.push('stop') } }
  const sources = createLabSources(analysis, state => states.push(state))
  const stream = (audio = true) => {
    const tracks = (audio ? ['audio', 'video'] : ['video']).map(kind => Object.assign(new EventTarget(), {
      kind, readyState: 'live', stop() { this.readyState = 'ended' },
    }))
    return { getTracks: () => tracks, getAudioTracks: () => tracks.filter(t => t.kind === 'audio') }
  }
  return { sources, requests, elements, states, calls, stream, revoked }
}
const fixture = () => new File(['synthetic'], 'synthetic.wav')
test('sharing replaces fixture synchronously, does not duplicate requests, and fixture play releases tracks', async () => {
  const x = setup()
  await x.sources.play(fixture())
  const pending = x.sources.share()
  assert.equal(x.requests.length, 1, 'picker called before share returns')
  assert.equal(x.elements[0].paused, true)
  assert.equal(x.states.at(-1).mode, 'tab')
  assert.equal(x.states.at(-1).captureStatus, 'connecting')
  await x.sources.share()
  assert.equal(x.requests.length, 1)
  const stream = x.stream(); x.requests[0].resolve(stream); await pending
  assert.equal(x.states.at(-1).captureStatus, 'connected')
  assert.equal(x.calls.at(-1), stream)
  await x.sources.play(fixture())
  assert.ok(stream.getTracks().every(t => t.readyState === 'ended'))
  assert.equal(x.states.at(-1).mode, 'fixture')
})
test('cancelled or replaced requests release late tracks without clearing newer fixture state', async () => {
  const x = setup(), pending = x.sources.share()
  x.sources.stop()
  assert.match(x.states.at(-1).message, /Close the native picker/)
  await x.sources.play(fixture())
  const before = x.states.length, stops = x.calls.filter(c => c === 'stop').length
  const late = x.stream(); x.requests[0].resolve(late); await pending
  assert.ok(late.getTracks().every(t => t.readyState === 'ended'))
  assert.equal(x.states.length, before)
  assert.equal(x.calls.filter(c => c === 'stop').length, stops)
  assert.equal(x.states.at(-1).mode, 'fixture')
})
test('denial, missing audio and native track end return to idle with accurate status', async () => {
  const x = setup()
  let pending = x.sources.share(); x.requests.at(-1).reject(new DOMException('denied', 'NotAllowedError')); await pending
  assert.equal(x.states.at(-1).mode, 'idle')
  assert.equal(x.states.at(-1).captureStatus, 'error')
  pending = x.sources.share(); const silent = x.stream(false); x.requests.at(-1).resolve(silent); await pending
  assert.ok(silent.getTracks().every(t => t.readyState === 'ended'))
  assert.match(x.states.at(-1).message, /No audio track/)
  pending = x.sources.share(); const stream = x.stream(); x.requests.at(-1).resolve(stream); await pending
  stream.getTracks()[0].dispatchEvent(new Event('ended'))
  assert.equal(x.states.at(-1).mode, 'idle')
  assert.equal(x.states.at(-1).captureStatus, 'ended')
  assert.ok(stream.getTracks().every(t => t.readyState === 'ended'))
})
test('dispose while picker pending prevents any later status or active source', async () => {
  const x = setup(), pending = x.sources.share()
  x.sources.dispose(); const before = x.states.length
  const stream = x.stream(); x.requests[0].resolve(stream); await pending
  assert.equal(x.states.length, before)
  assert.ok(stream.getTracks().every(t => t.readyState === 'ended'))
})
test('review selection waits for Play and resume keeps its element/node; Stop releases it',async()=>{
  const x=setup();x.sources.selectFile(fixture())
  assert.equal(x.states.at(-1).mode,'file');assert.equal(x.elements.length,1);assert.equal(x.elements[0].paused,true)
  assert.equal(x.calls.filter(c=>c==='prepare').length,0)
  await x.sources.playFile();x.sources.pause();await x.sources.playFile()
  assert.equal(x.elements.length,1);assert.equal(x.calls.filter(c=>c===x.elements[0]).length,1)
  assert.equal(x.elements[0].paused,false)
  x.sources.stop();assert.equal(x.states.at(-1).mode,'idle');assert.equal(x.elements[0].paused,true)
  assert.deepEqual(x.revoked,['blob:synthetic-1'])
})
test('late tab acquisition cannot replace a selected review file; file errors release URL/reset',async()=>{
  const x=setup(),pending=x.sources.share();x.sources.selectFile(fixture());await x.sources.playFile()
  const before=x.states.length,stream=x.stream();x.requests[0].resolve(stream);await pending
  assert.equal(x.states.length,before);assert.equal(x.states.at(-1).mode,'file')
  assert.ok(stream.getTracks().every(t=>t.readyState==='ended'))
  x.elements[0].dispatchEvent(new Event('error'))
  assert.equal(x.states.at(-1).mode,'idle');assert.match(x.states.at(-1).message,/could not be played/)
  assert.deepEqual(x.revoked,['blob:synthetic-1'])
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLocalFile } from '../src/audio/localFile.ts'

function setup() {
  const elements = [], revoked = [], states = [], calls = []
  let next = 0
  globalThis.Audio = class extends EventTarget {
    paused = true
    ended = false
    src = ''
    currentTime = 0
    volume = 1
    plays = 0
    rejectPlay = false
    constructor() { super(); elements.push(this) }
    play() {
      this.plays++
      if (this.rejectPlay) return Promise.reject(new DOMException('blocked', 'NotAllowedError'))
      this.paused = false
      this.ended = false
      this.dispatchEvent(new Event('playing'))
      return Promise.resolve()
    }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')) }
    removeAttribute() { this.src = '' }
    load() {}
  }
  URL.createObjectURL = () => `blob:test-${++next}`
  URL.revokeObjectURL = (url) => revoked.push(url)
  const analysis = {
    prepare() { calls.push('prepare'); return {ok:true} },
    startElement(element) { calls.push(element); return true },
    resume() { calls.push('resume') },
    stop() { calls.push('stop') },
  }
  const file = createLocalFile((state) => states.push(state), analysis)
  return { file, elements, revoked, states, calls, analysis }
}

test('selection does not autoplay; pause/replay attach only once; volume retained', async () => {
  const { file, elements, states, calls } = setup()
  file.setVolume(0.25)
  file.select({ name: 'tone.wav' })
  const audio = elements[0]
  assert.equal(audio.volume, 0.25)
  assert.equal(audio.plays, 0)
  assert.equal(states.at(-1).status, 'ready')
  await file.play()
  file.pause()
  assert.equal(states.at(-1).status, 'paused')
  await file.play()
  audio.ended = true
  audio.dispatchEvent(new Event('ended'))
  assert.equal(states.at(-1).status, 'ended')
  audio.currentTime = 20
  await file.play()
  assert.equal(audio.currentTime, 0)
  assert.equal(calls.filter((call) => call === audio).length, 1)
  file.setVolume(2)
  assert.equal(audio.volume, 1)
})
test('replacement, repeated selection and dispose release elements and URLs', async () => {
  const { file, elements, revoked, states } = setup()
  file.select({ name: 'same.wav' })
  await file.play()
  file.select({ name: 'same.wav' })
  assert.equal(elements[0].paused, true)
  assert.equal(elements[0].src, '')
  assert.deepEqual(revoked, ['blob:test-1'])
  const count = states.length
  elements[0].dispatchEvent(new Event('error'))
  assert.equal(states.length, count)
  file.dispose()
  assert.equal(elements[1].src, '')
  assert.deepEqual(revoked, ['blob:test-1', 'blob:test-2'])
  file.select({ name: 'ignored.wav' })
  assert.equal(elements.length, 2)
})
test('play rejection allows retry without creating another media node', async () => {
  const { file, elements, states, calls } = setup()
  file.select({ name: 'tone.wav' })
  elements[0].rejectPlay = true
  await file.play()
  assert.match(states.at(-1).message, /blocked/)
  elements[0].rejectPlay = false
  await file.play()
  assert.equal(states.at(-1).status, 'playing')
  assert.equal(calls.filter((call) => call === elements[0]).length, 1)
})
test('decode error releases resources and allows another file', () => {
  const { file, elements, states, revoked } = setup()
  file.select({ name: 'broken.wav' })
  elements[0].dispatchEvent(new Event('error'))
  assert.equal(states.at(-1).status, 'error')
  assert.deepEqual(revoked, ['blob:test-1'])
  assert.equal(elements[0].src, '')
  file.select({ name: 'valid.wav' })
  assert.equal(states.at(-1).status, 'ready')
})
test('late play rejection after replacement does not overwrite new state', async () => {
  const { file, elements, states } = setup()
  file.select({ name: 'first.wav' })
  let reject
  elements[0].play = () => new Promise((_, fail) => { reject = fail })
  const pending = file.play()
  file.select({ name: 'second.wav' })
  reject(new DOMException('aborted', 'AbortError'))
  await pending
  assert.equal(states.at(-1).name, 'second.wav')
  assert.equal(states.at(-1).status, 'ready')
})
test('graph failure releases local resources', async () => {
  const { file, analysis, states, revoked } = setup()
  analysis.startElement = () => false
  file.select({ name: 'tone.wav' })
  await file.play()
  assert.equal(states.at(-1).status, 'error')
  assert.deepEqual(revoked, ['blob:test-1'])
})

test('prepare failure preserves its reason, releases the selected file and never attaches or plays',async()=>{
 const {file,analysis,elements,states,revoked,calls}=setup()
 analysis.prepare=()=>({ok:false,message:'Web Audio unavailable'})
 file.select({name:'tone.wav'});await file.play()
 assert.equal(states.at(-1).status,'error');assert.equal(states.at(-1).message,'Web Audio unavailable')
 assert.equal(elements[0].plays,0);assert.ok(!calls.includes(elements[0]));assert.equal(revoked.length,1)
})

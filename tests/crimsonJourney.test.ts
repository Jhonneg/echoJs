import test from 'node:test'
import assert from 'node:assert/strict'
import { silentSignal, SIX_BAND_NAMES, type AudioSignal } from '../src/audio/signal.ts'
import { createJourney, updateJourney } from '../src/scenes/crimson-horizon/journey.ts'
import { createTerrainStream, localCameraZ, chunkRenderZ } from '../src/scenes/crimson-horizon/terrainStream.ts'

function feed(state: ReturnType<typeof createJourney>, signal: AudioSignal, seconds: number, gain = 1, reduced = false, hz = 60, limit = Infinity) {
  for (let i = 1; i <= seconds * hz; i++) {
    const now = i * 1000 / hz + 1
    signal.updatedAt = now
    updateJourney(state, signal, gain, reduced, 1 / hz, now, limit)
  }
}
function signalWith(count: number, level = 0.6) {
  const signal = silentSignal()
  signal.isPlaying = true
  for (const band of SIX_BAND_NAMES.slice(0, count)) signal.sixBands[band] = level
  return signal
}
test('sun target follows active bands while travel stays constant independently of energy', () => {
  let previous = -1
  for (let count = 0; count <= 6; count++) {
    const state = createJourney(), signal = signalWith(count)
    feed(state, signal, 4)
    assert.equal(state.activeCount, count)
    assert.ok(Math.abs(state.sun - count / 6) < 0.00001)
    assert.ok(state.sun > previous)
    previous = state.sun
    assert.ok(Math.abs(state.distance-96)<1e-9)
  }
  const quiet = createJourney(), loud = createJourney()
  feed(quiet, signalWith(6, 0.2), 2)
  feed(loud, signalWith(6, 0.9), 2)
  assert.ok(Math.abs(loud.distance-quiet.distance)<1e-9)
  assert.equal(loud.speed,24);assert.equal(quiet.speed,24)

})
test('sun pulses only on strong bass accents, decays, and respects motion settings', () => {
  const signal = signalWith(6), state = createJourney()
  signal.fast.midrange = signal.fast.treble = 1
  signal.transient.midrange = signal.transient.treble = 1
  feed(state, signal, 0.2)
  assert.equal(state.sunPulse, 0)
  signal.fast.bass = 0.4
  signal.transient.bass = 1
  feed(state, signal, 0.2)
  assert.equal(state.sunPulse, 0)
  signal.fast.bass = 1
  feed(state, signal, 0.2)
  assert.ok(state.sunPulse > 0.99 && state.sunPulse <= 1)
  const half = createJourney()
  feed(half, signal, 0.2, 0.5)
  assert.ok(Math.abs(half.sunPulse / state.sunPulse - 0.5) < 1e-10)
  signal.transient.bass = 0
  feed(state, signal, 2)
  assert.ok(state.sunPulse < 0.001, 'sustained bass settles after the accent')
  signal.flux.bass = 1
  feed(state, signal, 0.2)
  assert.ok(state.sunPulse > 0.99)
  for (const [gain, reduced] of [[0, false], [1, true]] as const) {
    feed(state, signal, 0.1, gain, reduced)
    assert.equal(state.sunPulse, 0)
  }
  feed(state, signal, 0.2)
  updateJourney(state, signal, 1, false, 0.05, signal.updatedAt + 251)
  assert.ok(state.sunPulse < 0.81, 'stale input must release rather than retrigger the pulse')
  signal.isPlaying = false
  feed(state, signal, 3)
  assert.equal(state.sunPulse, 0)
  assert.equal(state.speed, 24)
})

test('band hysteresis holds brief gaps and releases sustained silence', () => {
  const state = createJourney(), signal = signalWith(1)
  feed(state, signal, 0.1, 1, false, 100)
  signal.sixBands.subBass = 0.09
  feed(state, signal, 0.3, 1, false, 100)
  assert.equal(state.activeCount, 1)
  signal.sixBands.subBass = 0.07
  feed(state, signal, 0.14, 1, false, 100)
  assert.equal(state.activeCount, 1)
  feed(state, signal, 0.05, 1, false, 100)
  assert.equal(state.activeCount, 0)
  signal.sixBands.subBass = 0
  feed(state, signal, 4)
  assert.equal(state.speed, 24)
  assert.ok(state.sun < 0.01)
})
test('only reduced motion freezes travel; pause, stale input and zero Reactivity keep constant progress', () => {
  for (const mode of ['pause', 'stale', 'zero', 'reduced'] as const) {
    const state = createJourney(), signal = signalWith(6)
    feed(state, signal, 1)
    const previous = state.distance
    if (mode === 'pause') signal.isPlaying = false
    updateJourney(state, signal, mode === 'zero' ? 0 : 1, mode === 'reduced', 1 / 60,
      mode === 'stale' ? signal.updatedAt + 251 : signal.updatedAt)
    if(mode==='reduced'){assert.equal(state.distance,previous);assert.equal(state.speed,0)}
    else{assert.ok(Math.abs(state.distance-previous-.4)<1e-9);assert.equal(state.speed,24)}
    if (mode === 'pause' || mode === 'stale') assert.equal(state.activeCount, 0)
  }
})
test('forward integration is consistent at common render cadences and never crosses unloaded terrain', () => {
  const distances=[]
  for (const hz of [30, 60, 120]) {
    const state = createJourney()
    feed(state, signalWith(6), 10, 1, false, hz)
    distances.push(state.distance)
  }
  assert.ok(Math.abs(distances[0] - distances[2]) < 1e-8)
  assert.ok(Math.abs(distances[0]-240)<1e-8)
  const state = createJourney()
  feed(state, signalWith(6), 10, 1, false, 60, 2)
  assert.equal(state.distance, 2)
  assert.equal(state.blocked, true)
  assert.equal(state.speed, 0)
  feed(state, signalWith(6), 1)
  assert.ok(state.distance > 2)
})
// Carries only what the terrain stream uses.
class FakeWorker {
  requests: number[] = []
  onmessage: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  terminated = false
  postMessage(value: { index: number }) { this.requests.push(value.index) }
  terminate() { this.terminated = true }
  deliver(index: number) { this.onmessage?.({ data: { index, data: {} } }) }
}
test('stream stays bounded over many windows, stops safely for delays and ignores stale results', () => {
  const worker = new FakeWorker(), snapshots: any[] = []
  const stream = createTerrainStream(worker, value => snapshots.push(value))
  assert.equal(stream.distanceLimit(0), 0)
  for (const index of [-1, 0, 1, 2]) worker.deliver(index)
  assert.equal(stream.distanceLimit(0), 56)
  stream.requestWindow(1)
  assert.equal(stream.distanceLimit(48), 56)
  worker.deliver(3)
  assert.equal(stream.distanceLimit(48), 104)
  for (let index = 2; index <= 20; index++) {
    stream.requestWindow(index)
    worker.deliver(index + 2)
    assert.equal(snapshots.at(-1).chunks.length, 4)
    assert.ok(stream.distanceLimit(index * 48) > index * 48)
  }
  const count = snapshots.length
  worker.deliver(0)
  assert.equal(snapshots.length, count)
  const callback = worker.onmessage
  stream.dispose()
  callback!({ data: { index: 22, data: {} } })
  assert.equal(snapshots.length, count)
  assert.equal(worker.terminated, true)
  assert.equal(worker.onmessage, null)
})
test('worker errors freeze the stream and disposal cancels further notifications', () => {
  const worker = new FakeWorker(), snapshots: any[] = []
  const stream = createTerrainStream(worker, next => snapshots.push(next))
  worker.onerror!({})
  assert.equal(snapshots.at(-1).error, true)
  assert.equal(stream.distanceLimit(3), 3)
  stream.dispose()
})
test('render origin rebasing preserves relative camera-to-terrain positions', () => {
  for (const distance of [0, 47.9999, 48, 96, 480, 4800000]) {
    for (let index = Math.floor(distance / 48) - 1; index <= Math.floor(distance / 48) + 2; index++) {
      assert.ok(Math.abs((chunkRenderZ(index, distance) - localCameraZ(distance)) - (-index * 48 - 24 + distance)) < 1e-8)
    }
  }
})

test('disconnected silence travels at the same rate from the first frame and resumes exactly after a loading hold',()=>{
  const state=createJourney(),signal=silentSignal()
  updateJourney(state,signal,0,false,1/60,1,0)
  assert.equal(state.distance,0);assert.equal(state.speed,0);assert.equal(state.blocked,true)
  updateJourney(state,signal,0,false,1/60,2,100)
  assert.equal(state.speed,24);assert.equal(state.distance,.4)
})

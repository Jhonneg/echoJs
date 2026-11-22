import test from 'node:test'
import assert from 'node:assert/strict'
import { createNocturneResponse, updateNocturneResponse } from '../src/scenes/nocturne/reactivity.ts'
import { nocturneHasSignal } from '../src/scenes/nocturne/activity.ts'
const manual = { magenta: .2, cyan: .5, violet: .9, cyanPanel: .4 }
function fixture() {
  const view = { session: 1, sequence: 0, status: 'active', frame: 1, updatedAtSeconds: 1,
    energy: { low: 0, mid: 0, high: 0, overall: 0 }, context: { intensity: 0 }, events: [] }
  const reader = { read: () => view }, state = createNocturneResponse()
  function step({gain = 1, reduced = false, mode = 'audio', hz = 60, now} = {}) {
    view.updatedAtSeconds += 1 / hz; view.frame++
    updateNocturneResponse(state, view, mode, manual, gain, reduced, 1 / hz, now ?? view.updatedAtSeconds)
  }
  function advance(seconds = 2, options = {}) { for (let i = 0; i < seconds * (options.hz ?? 60); i++) step(options) }
  function event(band = 'low', strength = .5, extra = {}) {
    const e = {session: view.session, sequence: ++view.sequence, band, strength,
      timeSeconds: view.updatedAtSeconds, emittedAtSeconds: view.updatedAtSeconds, ...extra}
    view.events.push(e); return e
  }
  step()
  return {view, reader, state, step, advance, event}
}
const outputs = state => ['magenta', 'cyan', 'violet', 'atmosphere'].map(k => state[k])
test('calibrated bands stay independent, proportional and bounded during sustain', () => {
  for (const [band, group] of [['low','magenta'],['mid','cyan'],['high','violet']]) {
    const f = fixture(); f.view.energy[band] = .1; f.advance()
    const quiet = f.state[group]; assert.ok(Math.abs(quiet - .13) < .001)
    f.view.energy[band] = .4; f.advance(); assert.ok(Math.abs(f.state[group] - quiet * 4) < .001)
    for (const g of ['magenta','cyan','violet']) if (g !== group) assert.equal(f.state[g],0)
    f.advance(5); assert.equal(f.state.accents[group],0)
    f.view.energy[band] = 1;f.advance();assert.ok(f.state[group] <= .65)
  }
})
test('fresh events add finite proportional accents and duplicates never retrigger', () => {
  for (const [band, group] of [['low','magenta'],['mid','cyan'],['high','violet']]) {
    const f = fixture(); f.view.energy[band] = .1;f.advance()
    f.event(band,.5); f.step(); assert.equal(f.state.accents[group],.15)
    assert.ok(f.state[group] > .13)
    f.advance(3); assert.equal(f.state.accents[group],0);assert.ok(Math.abs(f.state[group]-.13)<.001)
  }
})
test('manual, zero gain and reduced motion consume suppressed events without replay', () => {
  for (const options of [{mode:'manual'},{gain:0},{reduced:true}]) {
    const f=fixture();f.event();f.step(options)
    assert.equal(f.state.accents.magenta,0)
    if(options.mode)assert.deepEqual(outputs(f.state),[.2,.5,.9,0])
    f.step();assert.equal(f.state.accents.magenta,0)
  }
})
test('stale, future, priming and inactive data release to zero, sessions skip retained events', () => {
  for (const kind of ['stale','future','priming','inactive','invalid']) {
    const f=fixture(); f.view.energy.low=.5;f.view.context.intensity=.8;f.advance()
    if(['priming','inactive'].includes(kind))f.view.status=kind
    const now=kind==='stale'?100:kind==='future'?0:kind==='invalid'?NaN:undefined
    f.advance(5,{now});assert.deepEqual(outputs(f.state),[0,0,0,0],kind)
  }
  const f=fixture();f.event();f.view.session++;f.event();f.step();assert.equal(f.state.accents.magenta,0)
})
test('wrong-session, future, expired and invalid events do not create accents', () => {
  for (const extra of [{session:2},{emittedAtSeconds:99},{emittedAtSeconds:0},{emittedAtSeconds:NaN}]) {
    const f=fixture();f.event('low',1,extra);f.step();assert.equal(f.state.accents.magenta,0)
  }
})
test('cadence, gain, invalid inputs and atmosphere isolation', () => {
  const levels=[30,60,120].map(hz=>{const f=fixture();f.view.energy.low=.3;f.advance(1,{hz});return f.state.magenta})
  assert.ok(Math.abs(levels[0]-levels[2])<1e-9)
  const f=fixture();f.view.context.intensity=1;f.advance();assert.ok(f.state.atmosphere>.99)
  assert.deepEqual(outputs(f.state).slice(0,3),[0,0,0])
  f.view.energy.low=NaN;f.step({gain:NaN});assert.deepEqual(outputs(f.state),[0,0,0,0])
})
test('Noctune activity feedback separates active silence, receiving, stale and missing MI', () => {
  const f=fixture(),now=f.view.updatedAtSeconds
  assert.equal(nocturneHasSignal(f.reader,now),false)
  f.view.energy.mid=.1;assert.equal(nocturneHasSignal(f.reader,now),true)
  assert.equal(nocturneHasSignal(f.reader,now+1),false)
  assert.equal(nocturneHasSignal(undefined,now),false)
  f.view.status='inactive';assert.equal(nocturneHasSignal(f.reader,now),false)
})

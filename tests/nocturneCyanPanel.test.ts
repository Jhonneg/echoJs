import test from 'node:test'
import assert from 'node:assert/strict'
import { createCyanPanelResponse, updateCyanPanelResponse } from '../src/scenes/nocturne/cyanPanel.ts'
import { createNocturneResponse, updateNocturneResponse } from '../src/scenes/nocturne/reactivity.ts'
import { applyNocturneVisualState, type NocturneVisualState } from '../src/scenes/nocturne/visualState.ts'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'

function fixture() {
  const state = createCyanPanelResponse()
  const view:any={ session: 1, sequence: 0, frame: 0, status: 'active', updatedAtSeconds: 0,
    energy: { six: { highMids: 0, lowMids: 0 } }, events: [] }
  const reader = { read: () => view }
  let time = 1
  function step(highMids = 0, lowMids = 0, overall = 0, event = false) {
    time += 1 / 60; view.frame++; view.updatedAtSeconds = time
    view.energy.six.highMids = highMids; view.energy.six.lowMids = lowMids
    view.context = { intensity: overall }
    view.events = event ? [{ session: 1, sequence: ++view.sequence, band: 'mid',
      timeSeconds: time, emittedAtSeconds: time, strength: 1 }] : []
    updateCyanPanelResponse(state, view, 1 / 60, time, 1, false)
    const material = { emissiveIntensity: NaN }, light = { intensity: NaN }
    applyNocturneVisualState({emitters:[{channel:'cyanPanel',material}],lights:[{channel:'cyanPanel',light,full:30}]},
      // A partial state: the adapter reads only the cyan panel here.
      {channels:{cyanPanel:{level:state.level}},spill:{cyanPanel:state.level}} as unknown as NocturneVisualState)
    return { highMids, lowMids, overall, sustained: state.sustained, accent: state.accent,
      level: state.level, emissive: material.emissiveIntensity, pointLight: light.intensity }
  }
  return { state, view, reader, step }
}

test('silence, bass, low mids and overall intensity do not illuminate the panel', () => {
  const f = fixture()
  for (let i = 0; i < 60; i++) f.step(0, i > 20 ? .9 : 0, 1, i === 30)
  assert.equal(f.state.level, 0)
  assert.equal(f.state.accent, 0)
  assert.equal(f.step(0, 0, 1).pointLight, 0)
})

test('quiet and loud sustained high mids deliver ordered material and point-light brightness', () => {
  const f = fixture()
  let quiet!: ReturnType<typeof f.step>, loud!: ReturnType<typeof f.step>
  for (let i = 0; i < 90; i++) quiet = f.step(.1)
  for (let i = 0; i < 90; i++) loud = f.step(.4)
  assert.ok(quiet.level > 0 && loud.level > quiet.level * 3)
  assert.ok(Math.abs(quiet.pointLight - quiet.level * 30) < 1e-12)
  assert.ok(Math.abs(loud.emissive - loud.level * 1.3) < 1e-12)
  assert.equal(loud.accent, 0, 'sustained energy does not manufacture attacks')
})

test('a short high-mid attack creates a separate accent, then expires', () => {
  const f = fixture()
  for (let i = 0; i < 30; i++) f.step()
  for (let i = 0; i < 5; i++) f.step(.4)
  const attack = f.step(.4, 0, 0, true)
  assert.ok(attack.accent > .1)
  assert.ok(attack.level > attack.sustained)
  for (let i = 0; i < 120; i++) f.step()
  assert.equal(f.state.accent, 0)
  assert.equal(f.state.level, 0)
})

test('one-frame high-mid attack survives delayed broad-mid event emission', () => {
  const f = fixture()
  for (let i = 0; i < 30; i++) f.step()
  const pulse = f.step(.5)
  for (let i = 0; i < 8; i++) f.step()
  f.view.frame++; f.view.updatedAtSeconds += 1 / 60
  f.view.events = [{ session: 1, sequence: ++f.view.sequence, band: 'mid',
    timeSeconds: f.view.updatedAtSeconds - 9 / 60, emittedAtSeconds: f.view.updatedAtSeconds, strength: 1 }]
  updateCyanPanelResponse(f.state, f.view, 1 / 60, f.view.updatedAtSeconds, 1, false)
  assert.ok(f.state.accent > .1)
  assert.ok(f.state.level > pulse.level)
})

test('a low-mid attack does not borrow a stationary high-mid sustain', () => {
  const f = fixture()
  for (let i = 0; i < 90; i++) f.step(.2)
  const baseline = f.state.level
  const result = f.step(.2, .8, 1, true)
  assert.equal(result.accent, 0)
  assert.ok(Math.abs(result.level - baseline) < .001)
})

test('mixed-frequency input keeps the panel on its own high-mid response', () => {
  const f = fixture()
  for (let i = 0; i < 30; i++) f.step(0, .8, 1)
  const lowMidOnly = f.state.level
  for (let i = 0; i < 90; i++) f.step(.25, .8, 1)
  const mixed = f.state.level
  assert.equal(lowMidOnly, 0)
  assert.ok(mixed > 0)
  assert.equal(f.state.accent, 0)
  const stable = f.step(.25, .8, 1, true)
  assert.equal(stable.accent, 0, 'a low-mid attack over steady high-mid energy is not a panel attack')
})

test('panel level ignores magenta final brightness and resets on stale/session/zero gain', () => {
  const f = fixture(), magenta = createNocturneResponse(), store = createMusicFeatureStore()
  for (let i = 0; i < 90; i++) f.step(.3)
  const panel = f.state.level
  for (let i = 0; i < 90; i++) {
    store.publish({session: 1, sequence: 0, status: 'active', updatedAtSeconds: 1 + i / 60,
      sampleRate: 48000, fftSize: 2048, events: [], energy: {low: .5, mid: 0, high: 0, overall: .5, six: emptySixBands()},
      context: {intensity: 0, brightness: 0, brightnessValid: false, activity: 0}})
    updateNocturneResponse(magenta, store.reader.read(), 'audio', { magenta: 0, cyan: 0, cyanPanel: 0, violet: 0 }, 1, false, 1 / 60, 1 + i / 60)
  }
  assert.ok(magenta.magenta > .6)
  assert.equal(f.state.level, panel)
  updateCyanPanelResponse(f.state, f.view, 1 / 60, f.view.updatedAtSeconds + .3, 1, false)
  assert.equal(f.state.accent, 0)
  updateCyanPanelResponse(f.state, f.view, 1 / 60, f.view.updatedAtSeconds + .3, 0, false)
  assert.equal(f.state.level, 0)
  f.view.session++
  f.step()
  assert.equal(f.state.level, 0)
})

test('reduced motion keeps sustained light gradual and suppresses sharp accents', () => {
  const f = fixture()
  for (let i = 0; i < 20; i++) f.step()
  f.view.frame++; f.view.updatedAtSeconds += 1 / 60
  f.view.energy.six.highMids = .5
  updateCyanPanelResponse(f.state, f.view, 1 / 60, f.view.updatedAtSeconds, 1, true)
  assert.ok(f.state.sustained > 0 && f.state.sustained < .02)
  f.view.events = [{ session: 1, sequence: ++f.view.sequence, band: 'mid',
    timeSeconds: f.view.updatedAtSeconds, emittedAtSeconds: f.view.updatedAtSeconds, strength: 1 }]
  updateCyanPanelResponse(f.state, f.view, 1 / 60, f.view.updatedAtSeconds, 1, true)
  assert.equal(f.state.accent, 0)
})

test('repeated rendering of a feature frame does not fill the history', () => {
  const f = fixture(); f.step(.3)
  const count=f.state.count
  for(let i=0;i<20;i++)updateCyanPanelResponse(f.state,f.view,1/120,f.view.updatedAtSeconds+.05,1,false)
  assert.equal(f.state.count,count)
})

test('zero/manual suppression consumes panel events before resuming Audio', () => {
  const f=fixture();for(let i=0;i<30;i++)f.step()
  for(let i=0;i<5;i++)f.step(.4)
  f.view.events=[{session:1,sequence:++f.view.sequence,band:'mid',timeSeconds:f.view.updatedAtSeconds,
    emittedAtSeconds:f.view.updatedAtSeconds,strength:1}]
  updateCyanPanelResponse(f.state,f.view,1/60,f.view.updatedAtSeconds,0,false)
  assert.equal(f.state.sequence,f.view.sequence)
  updateCyanPanelResponse(f.state,f.view,1/60,f.view.updatedAtSeconds,1,false)
  assert.equal(f.state.accent,0)
})

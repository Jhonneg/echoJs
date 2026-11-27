import test from 'node:test'
import assert from 'node:assert/strict'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import {
  calibrateNocturneLevel, NOCTURNE_VISUAL_CHANNELS, createNocturneVisualState, updateNocturneVisualState, applyNocturneVisualState, GATE_FLOOR,
} from '../src/scenes/nocturne/visualState.ts'

const manual = { magenta: .2, cyan: .4, cyanPanel: .6, violet: .8 }
function fixture() {
  const store = createMusicFeatureStore(), state = createNocturneVisualState()
  let reads = 0, time = 1, sequence = 0
  const reader = { read() { reads++; return store.reader.read() } }
  const input = { session: 1, status: 'active', sampleRate: 48000, fftSize: 2048, events: [], sequence: 0,
    updatedAtSeconds: 1, energy: { low: 0, mid: 0, high: 0, overall: 0, six: emptySixBands() },
    context: {intensity: 0, brightness: 0, brightnessValid: false, activity: 0} }
  function step({mode='audio',gain=1,reduced=false,hz=60,publish=true,now}={}) {
    time += 1/hz
    if(publish){input.updatedAtSeconds=time;store.publish(input)}
    updateNocturneVisualState(state,reader,mode,manual,gain,reduced,1/hz,now??time)
    return state
  }
  function advance(seconds=2,options={}){for(let i=0;i<seconds*(options.hz??60);i++)step(options)}
  function event(band='mid',strength=.5){input.sequence=++sequence;input.events.push({session:input.session,sequence,band,strength,timeSeconds:time,emittedAtSeconds:time})}
  step()
  return {state,input,store,reader,step,advance,event,reads:()=>reads}
}
const levels = state => NOCTURNE_VISUAL_CHANNELS.map(name=>state.channels[name].level)

test('one borrowed read per update and stable scene output/history storage',()=>{
  const f=fixture(), channels=f.state.channels, reflections=f.state.reflections, history=f.state.panel.energies
  const before=f.reads();f.step();assert.equal(f.reads()-before,1)
  f.input.energy.six.highMids=.2;f.step()
  const count=f.state.panel.count
  for(let i=0;i<5;i++)f.step({publish:false,hz:120})
  assert.equal(f.state.panel.count,count)
  assert.equal(f.state.channels,channels);assert.equal(f.state.reflections,reflections);assert.equal(f.state.panel.energies,history)
  assert.equal('view' in f.state,false)
})

test('each named output and physical reflection source can be exercised without WebGL',()=>{
  const f=fixture();f.input.energy.low=.2;f.input.energy.six.bass=.2;f.input.energy.mid=.3;f.input.energy.six.lowMids=.3;f.input.energy.high=.1;f.input.energy.six.presence=.1;f.input.energy.six.air=.1;f.input.energy.six.highMids=.4;f.advance(5)
  const expected={magentaMain:.2285714286,magentaSecondary:.0822857143,bridge:0,cyanWindows:.1697142857,cyanDetails:.24,violet:.0457142857,violetSecondary:.0457142857,cyanPanel:.52}
  const emitters=[],lights=[]
  for(const name of NOCTURNE_VISUAL_CHANNELS){
    assert.ok(Math.abs(f.state.channels[name].level-calibrateNocturneLevel(expected[name]))<.001,name)
    assert.equal(f.state.reflections[name],f.state.channels[name].level)
    emitters.push({channel:name,material:{emissiveIntensity:NaN}})
    lights.push({channel:name,light:{intensity:NaN},full:name==='cyanPanel'?30:40})
  }
  applyNocturneVisualState({emitters,lights},f.state)
  for(const {channel,material} of emitters)assert.equal(material.emissiveIntensity,f.state.channels[channel].level*1.3)
  for(const {channel,light,full} of lights)assert.equal(light.intensity,f.state.spill[channel]*full)
  assert.notEqual(f.state.channels.magentaMain,f.state.channels.magentaSecondary)
  f.state.channels.bridge.level=.05;f.state.spill.bridge=.05
  applyNocturneVisualState({emitters,lights},f.state)
  assert.equal(lights.find(x=>x.channel==='bridge').light.intensity,2)
  assert.ok(lights.find(x=>x.channel==='magentaMain').light.intensity>8)
})

test('Manual preview shares final outputs and atmosphere weights without corrupting MI',()=>{
  const f=fixture();f.input.energy.six.highMids=.4;f.advance()
  const viewBefore=JSON.stringify(f.store.reader.read())
  updateNocturneVisualState(f.state,f.reader,'manual',manual,0,false,1/60,f.input.updatedAtSeconds)
  assert.deepEqual(levels(f.state),[.2,.2,.4,.4,.6,.8,.8,.2])
  assert.deepEqual(f.state.atmosphere,{level:GATE_FLOOR,magenta:.2*.24,cyan:.4*.85,violet:.8*.16,fogNear:17,fogFar:74})
  assert.equal(JSON.stringify(f.store.reader.read()),viewBefore)
  f.event();f.step({mode:'manual'});f.step()
  assert.equal(f.state.panel.accent,0);assert.equal(f.state.broad.accents.cyan,0)
})

test('sustain, qualified accents and atmosphere remain separate',()=>{
  const f=fixture();f.input.energy.six.highMids=.25;f.input.energy.mid=.25;f.advance()
  const sustained=f.state.channels.cyanPanel.level
  f.input.energy.six.highMids=.5;for(let i=0;i<5;i++)f.step()
  f.event('mid',1);f.step()
  assert.ok(f.state.channels.cyanPanel.accent>0)
  assert.ok(f.state.channels.cyanPanel.level>sustained)
  f.advance(3)
  assert.equal(f.state.channels.cyanPanel.accent,0)
  assert.equal(f.state.channels.cyanWindows.accent,0)
  assert.equal(f.state.atmosphere.level,GATE_FLOOR)
  f.input.energy.mid=0;f.input.energy.six.highMids=0;f.input.context.intensity=1;f.advance(5)
  assert.deepEqual(levels(f.state),NOCTURNE_VISUAL_CHANNELS.map(()=>0))
  assert.ok(f.state.atmosphere.level>.59&&f.state.atmosphere.level<.65)
})

test('inactivity/session/zero clear history and suppressed attacks never replay',()=>{
  for(const options of [{gain:0},{mode:'manual'},{reduced:true}]){
    const f=fixture();for(let i=0;i<5;i++){f.input.energy.six.highMids=.4;f.step()}
    f.event('mid',1);f.step(options);f.step()
    assert.equal(f.state.panel.accent,0);assert.equal(f.state.broad.accents.cyan,0)
  }
  const f=fixture();f.input.energy.six.highMids=.3;f.advance()
  f.input.status='inactive';f.step();assert.equal(f.state.panel.count,0)
  f.advance(5);assert.deepEqual(levels(f.state),NOCTURNE_VISUAL_CHANNELS.map(()=>0))
  f.input.session++;f.input.status='active';f.event('mid',1);f.step();assert.equal(f.state.panel.accent,0)
  for(let i=0;i<200;i++)f.step()
  assert.ok(f.state.panel.count<=64)
  assert.equal(f.state.panel.times.length,64)
})

test('cadence, quiet/loud and silence keep every final output bounded',()=>{
  const results=[30,60,120].map(hz=>{const f=fixture();f.input.energy.low=.1;f.input.energy.six.highMids=.1;f.advance(2,{hz});return levels(f.state)})
  for(let i=0;i<results[0].length;i++)assert.ok(Math.abs(results[0][i]-results[2][i])<.001)
  const f=fixture();f.input.energy.low=1;f.input.energy.mid=1;f.input.energy.high=1;f.input.energy.six.highMids=1
  f.event('low',1);f.event('high',1);f.advance()
  assert.ok(levels(f.state).every(x=>Number.isFinite(x)&&x>=0&&x<=1))
  f.step({gain:0});assert.deepEqual(levels(f.state),NOCTURNE_VISUAL_CHANNELS.map(()=>0))
})


test('violet high events reach only the alternating bank and its point light',()=>{
 const f=fixture();f.input.energy.six.presence=.1;f.advance(1)
 f.event('high',.3);f.step();f.step()
 const targets={emitters:['violet','violetSecondary'].map(channel=>({channel,material:{emissiveIntensity:0}})),lights:['violet','violetSecondary'].map(channel=>({channel,light:{intensity:0},full:12}))}
 applyNocturneVisualState(targets,f.state)
 assert.ok(f.state.channels.violet.accent>.2);assert.equal(f.state.channels.violetSecondary.accent,0)
 for(const {channel,material}of targets.emitters)assert.equal(material.emissiveIntensity,f.state.channels[channel].level*1.3)
 for(const {channel,light}of targets.lights)assert.equal(light.intensity,f.state.channels[channel].level*12)
 assert.ok(targets.lights[0].light.intensity>targets.lights[1].light.intensity)
 f.advance(.5);f.event('high',.3);f.step();f.step()
 assert.equal(f.state.channels.violet.accent,0);assert.ok(f.state.channels.violetSecondary.accent>.2)
 assert.equal(f.state.channels.magentaMain.level,0);assert.equal(f.state.channels.cyanPanel.level,0);assert.ok(f.state.channels.bridge.level>0)
})


test('approved Audio spill lift is bounded, independent and absent from Manual/zero',()=>{
 const f=fixture();f.input.energy.six.bass=f.input.energy.six.lowMids=f.input.energy.six.highMids=.4;f.advance(3)
 const expected={magentaMain:1.5,cyanWindows:2,cyanDetails:2}
 for(const name of NOCTURNE_VISUAL_CHANNELS)assert.equal(f.state.spill[name],Math.min(1,f.state.channels[name].level*(expected[name]??1)))
 const panel=f.state.channels.cyanPanel.level;assert.equal(f.state.spill.cyanPanel,panel)
 f.event('low',1);f.step();f.step();assert.equal(f.state.spill.magentaMain,1);assert.ok(f.state.channels.magentaMain.level<1)
 assert.ok(Math.abs(f.state.channels.cyanPanel.level-panel)<1e-8)
 f.step({mode:'manual',gain:0});for(const name of NOCTURNE_VISUAL_CHANNELS)assert.equal(f.state.spill[name],f.state.channels[name].level)
 f.step({gain:0});assert.ok(Object.values(f.state.spill).every(x=>x===0))
 f.step({reduced:true});for(const name of NOCTURNE_VISUAL_CHANNELS)assert.equal(f.state.spill[name],Math.min(1,f.state.channels[name].level*(expected[name]??1)))
})


test('R1 brightness preserves off, headroom, ordering and proportional small-signal response',()=>{
  assert.equal(calibrateNocturneLevel(0),0)
  assert.equal(calibrateNocturneLevel(1),1)
  const values=[0,.001,.01,.05,.1,.2,.5,1].map(calibrateNocturneLevel)
  for(let i=1;i<values.length;i++)assert.ok(values[i]>values[i-1])
  assert.ok(calibrateNocturneLevel(.1)<.2)
  assert.ok(calibrateNocturneLevel(.5)<.7)
  assert.ok(Math.abs(calibrateNocturneLevel(.002)/calibrateNocturneLevel(.001)-2)<.003)
  const f=fixture();f.input.energy.six.highMids=.1;f.advance(4)
  const before=f.state.channels.cyanPanel.level
  f.input.energy.six.bass=.8;f.input.context.intensity=1;f.event('low',1);f.advance(1)
  assert.ok(Math.abs(f.state.channels.cyanPanel.level-before)<1e-8)
  f.input.energy.six.highMids=0;f.input.energy.six.bass=0;f.advance(10)
  assert.equal(f.state.channels.cyanPanel.level,0)
  f.step({gain:0});assert.ok(levels(f.state).every(x=>x===0))
})


test('R3 depth light follows only slow context, honors Manual and zero, resets on session',()=>{
 const f=fixture(),twin=fixture();f.input.context.intensity=twin.input.context.intensity=.6
 for(let i=0;i<120;i++){if(i%20===0)f.event('high',.3);f.step();twin.step();assert.equal(f.state.environment.depthLight,twin.state.environment.depthLight)}
 assert.ok(f.state.environment.depthLight>0&&f.state.environment.depthLight<.39)
 f.step({mode:'manual',gain:0});assert.equal(f.state.environment.depthLight,.65*.8)
 f.step({gain:0});assert.equal(f.state.environment.depthLight,0)
 f.advance(2);f.input.session++;f.step();assert.ok(f.state.environment.depthLight<.01)
})

test('R3 contour adapter lights only selected structural instances from real bridge sections',()=>{
 const state=createNocturneVisualState(),attribute={array:new Float32Array(4),needsUpdate:false},material={emissiveIntensity:0}
 state.bridge.levels.set([.1,.2,.3,.4,.5,.6])
 const emitter={channel:'bridge',material,instances:{channel:'bridge',scale:.16,indices:new Uint8Array([255,0,3,5]),attribute}}
 applyNocturneVisualState({emitters:[emitter],lights:[]},state)
 assert.equal(attribute.array[0],0)
 for(const [i,want] of [[1,.016],[2,.064],[3,.096]])assert.ok(Math.abs(attribute.array[i]-want)<1e-7)
 state.bridge.levels.fill(0);applyNocturneVisualState({emitters:[emitter],lights:[]},state)
 assert.ok(attribute.array.every(v=>v===0))
})

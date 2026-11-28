// NT12 deterministic scene-contract matrix; no browser or analysis-engine changes.
import assert from 'node:assert/strict'
import {emptySixBands} from '../src/audio/signal.ts'
import {createMusicFeatureStore} from '../src/audio/musicFeatures.ts'
import {createNocturneVisualState,updateNocturneVisualState,applyNocturneVisualState,NOCTURNE_VISUAL_CHANNELS,GATE_FLOOR} from '../src/scenes/nocturne/visualState.ts'
const manual={magenta:.2,cyan:.3,cyanPanel:.4,violet:.5}
function fixture(hz,rows?){
 const store=createMusicFeatureStore(),state=createNocturneVisualState()
 let time=1,sequence=0,reads=0
 const input:any={session:1,status:'active',updatedAtSeconds:time,sampleRate:48000,fftSize:2048,energy:{low:0,mid:0,high:0,overall:0,six:emptySixBands()},events:[],sequence:0,context:{intensity:0,activity:0,brightness:.5,brightnessValid:true}}
 const reader={read(){reads++;return store.reader.read()}}
 const emitters:any[]=NOCTURNE_VISUAL_CHANNELS.filter(n=>n!=='bridge').map(channel=>({channel,material:{emissiveIntensity:0}}))
 for(let segment=0;segment<6;segment++)emitters.push({channel:'bridge',segment,material:{emissiveIntensity:0}})
 const lights:any[]=[['magentaMain',50],['bridge',40],['cyanWindows',65],['cyanDetails',40],['cyanPanel',30],['violet',12],['violetSecondary',12]].map(([channel,full])=>({channel,full,light:{intensity:0}}))
 let label='prime'
 function snapshot(){return {time,features:JSON.parse(JSON.stringify(store.reader.read())),channels:JSON.parse(JSON.stringify(state.channels)),spill:{...state.spill},bridgeSections:[...state.bridge.levels],atmosphere:{...state.atmosphere},materials:emitters.map(x=>({channel:x.channel,segment:x.segment,value:x.material.emissiveIntensity})),lights:lights.map(x=>({channel:x.channel,value:x.light.intensity}))}}
 function step({mode='audio',gain=1,reduced=false,publish=true,stale=false}:{mode?:'audio'|'manual',gain?:number,reduced?:boolean,publish?:boolean,stale?:boolean}={}){
  time+=1/hz;if(publish){input.updatedAtSeconds=time;store.publish(input)}
  const before=reads,borrow=JSON.stringify(store.reader.read())
  updateNocturneVisualState(state,reader,mode,manual,gain,reduced,1/hz,stale?time+.3:time)
  assert.equal(reads,before+1);assert.equal(JSON.stringify(store.reader.read()),borrow)
  applyNocturneVisualState({emitters,lights},state)
  for(const x of emitters)assert.equal(x.material.emissiveIntensity,(x.segment===undefined?state.channels[x.channel].level:state.bridge.levels[x.segment])*1.3)
  // NT13 owner-approved Audio-only point lift; emitter/controller expectations unchanged.
  for(const x of lights){const gain=mode==='manual'?1:({magentaMain:1.5,cyanWindows:2,cyanDetails:2}[x.channel]??1);assert.equal(x.light.intensity,Math.min(1,state.channels[x.channel].level*gain)*x.full)}
  assert.ok(NOCTURNE_VISUAL_CHANNELS.every(n=>Number.isFinite(state.channels[n].level)&&state.channels[n].level>=0&&state.channels[n].level<=1))
  if(rows&&Math.round(time*hz)%Math.max(1,Math.round(hz/10))===0)rows.push({label,...snapshot()})
 }
 function advance(seconds,options={}){for(let i=0;i<Math.round(seconds*hz);i++)step(options)}
 function energy(values){Object.assign(input.energy.six,emptySixBands(),values);input.energy.low=(values.bass??0)+(values.subBass??0);input.energy.mid=(values.lowMids??0)+(values.highMids??0);input.energy.high=(values.presence??0)+(values.air??0)}
 function event(band,strength=.2){input.sequence=++sequence;input.events.push(Object.freeze({session:input.session,sequence,band,strength,timeSeconds:time,emittedAtSeconds:time}))}
 step();return{state,input,step,advance,energy,event,snapshot,label:value=>{label=value}}
}
export function runNocturneResponseMatrix({trace=false}={}){
 const rows=trace?[]:null,cases:any[]=[]
 function check(name,hz,expected,run){const f=fixture(hz,rows);f.label(name);const observed=run(f);cases.push({name,hz,expected,observed,status:'passed'})}
 for(const hz of [30,60,120]){
  check('silence',hz,'Every fixture level0; atmosphere at the NT18 gate floor',f=>{f.advance(2);assert.ok(Object.values<any>(f.state.channels).every(x=>x.level===0));assert.equal(f.state.atmosphere.level,GATE_FLOOR);return f.snapshot()})
  for(const [name,band,allowed]of [['bass', 'bass',['magentaMain','magentaSecondary']],['low-mid','lowMids',['cyanWindows','cyanDetails']],['high-mid','highMids',['cyanWindows','cyanPanel']],['air','air',['violet','violetSecondary']]] as const){
   check('sustain-'+name,hz,'Only own sustained roles; no invented accents or bridge travel',f=>{f.energy({[band]:.2});f.advance(4);for(const [n,x]of Object.entries<any>(f.state.channels)){if((allowed as readonly string[]).includes(n))assert.ok(x.level>.01,n);else assert.equal(x.level,0,n);assert.equal(x.accent,0,n)}return f.snapshot()})
  }
  for(const [band,feature,channel]of [['low','bass','magentaMain'],['mid','highMids','cyanPanel'],['high','air','violet']] as const){
   check('isolated-'+band+'-attack',hz,'Own fresh event produces finite accent above sustain',f=>{f.advance(.3);f.energy({[feature]:.2});f.advance(.067);f.event(band);let peak=0;for(let i=0;i<Math.round(hz*.3);i++){f.step();peak=Math.max(peak,f.state.channels[channel].accent)}assert.ok(peak>.01);f.advance(2);assert.equal(f.state.channels[channel].accent,0);return{peak,final:f.snapshot()}})
  }
  check('low-mid-attack-near-held-high-mid',hz,'Small-panel accent>0; approved high-mid panel accent0',f=>{f.energy({highMids:.2});f.advance(2);f.energy({highMids:.2,lowMids:.25});f.advance(.067);f.event('mid');f.step();assert.ok(f.state.midrange.detailAccent>.02);f.advance(.18);assert.ok(f.state.instances.cyanDetails[0]>f.state.instances.cyanDetails[5]);assert.equal(f.state.channels.cyanPanel.accent,0);return f.snapshot()})
  check('bass-plus-high-mid',hz,'Independent held high-mid level while bass event accents magenta',f=>{f.energy({highMids:.2});f.advance(3);const panel=f.state.channels.cyanPanel.level;f.energy({highMids:.2,bass:.2});f.event('low');f.advance(.1);assert.ok(f.state.channels.magentaMain.accent>0);assert.equal(f.state.channels.cyanPanel.accent,0);assert.ok(Math.abs(f.state.channels.cyanPanel.level-panel)<1e-8);return f.snapshot()})
  check('rising-falling-high-mid',hz,'Ordered quiet/loud response with R1 display headroom, no attacks',f=>{f.energy({highMids:.1});f.advance(3);const quiet=f.state.channels.cyanPanel.level;f.energy({highMids:.3});f.advance(3);const loud=f.state.channels.cyanPanel.level;assert.ok(loud>quiet*2&&loud<quiet*3);f.energy({highMids:.1});f.advance(3);assert.ok(Math.abs(f.state.channels.cyanPanel.level-quiet)<1e-6);return{quiet,loud,final:f.snapshot()}})
  check('duplicate-events',hz,'Repeated borrowed event list matches consumed-event control, never retriggers',f=>{const twin=fixture(hz);f.energy({bass:.2,highMids:.2,air:.2});twin.energy({bass:.2,highMids:.2,air:.2});f.advance(.1);twin.advance(.1);for(const band of ['low','mid','high']){f.event(band);twin.event(band)}f.step();twin.step();twin.input.events=[];for(let i=0;i<hz*2;i++){f.step();twin.step();assert.deepEqual(f.state.channels,twin.state.channels);assert.deepEqual(f.state.bridge,twin.state.bridge)}return f.snapshot()})
  for(const mode of ['stale','inactive','session','manual','zero','reduced']){
   check(mode,hz,'Lifecycle guards suppress sharp events; expected sustained/manual/reset behavior',f=>{
    f.energy({bass:.2,highMids:.2,air:.2});f.advance(2)
    for(const b of ['low','mid','high'])f.event(b)
    const options=mode==='stale'?{stale:true}:mode==='manual'?{mode:'manual'}:mode==='zero'?{gain:0}:mode==='reduced'?{reduced:true}:{}
    if(mode==='inactive')f.input.status='inactive'
    if(mode==='session')f.input.session++
    f.advance(.1,options)
    assert.ok(Object.values<any>(f.state.channels).every(x=>x.accent===0))
    assert.ok(f.state.bridge.levels.every(x=>mode==='manual'?x===manual.magenta:x===0))
    if(mode==='manual'){assert.deepEqual(Object.values<any>(f.state.channels).map(x=>x.level),[.2,.2,.3,.3,.4,.5,.5,.2]);assert.equal(f.state.atmosphere.fogFar,74)}
    if(mode==='zero')assert.ok(Object.values<any>(f.state.channels).every(x=>x.level===0))
    if(mode==='stale'||mode==='inactive'){f.advance(8,options);assert.ok(Object.values<any>(f.state.channels).every(x=>x.level===0))}
    if(mode==='inactive')f.input.status='active'
    f.step();assert.ok(Object.values<any>(f.state.channels).every(x=>x.accent===0),'suppressed attacks never replay')
    return f.snapshot()
   })
  }
 }
 return{cases,trace:rows??[],summary:{cases:cases.length,cadences:[30,60,120],status:'passed'}}
}

import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createCorona,updateCorona,CORONA_SETTINGS,CORONA_TIME_PERIOD,SUN} from '../src/scenes/lavender-peaks/corona.ts'
import {createLavenderResponse} from '../src/scenes/lavender-peaks/response.ts'

function fixture(){const response=createLavenderResponse();response.session=1;response.fresh=true;return {response,state:createCorona()}}
function run(f:ReturnType<typeof fixture>,n=180,gain=1,reduced=false,hz=60){for(let i=0;i<n;i++)updateCorona(f.state,f.response,1/hz,gain,reduced);return f.state}

test('rest has intrinsic continuous motion without musical input, even at gain0',()=>{
 const f=fixture();f.response.fresh=false;run(f,120,0)
 assert.ok(Math.abs(f.state.time-2)<1e-10);assert.equal(f.state.envelope,0);assert.equal(f.state.detail,0)
 assert.equal(f.state.lowAccent+f.state.midAccent+f.state.highAccent,0)
})
test('low energy shapes the envelope; high mids/upper bands shape detail; low mids cannot impersonate them',()=>{
 for(let i=0;i<6;i++){
  const f=fixture();f.response.ridges[i].sustained=f.response.ridges[i].target=.5;run(f)
  assert.equal(f.state.envelope>0,i>=4);assert.equal(f.state.detail>0,i<=2)
 }
})
test('quiet and strong sustained responses stay proportional and do not manufacture accents',()=>{
 const quiet=fixture(),loud=fixture()
 for(const [f,level]of [[quiet,.1],[loud,.5]] as const){f.response.ridges[4].sustained=f.response.ridges[4].target=level;f.response.ridges[2].sustained=level;run(f)}
 assert.ok(loud.state.envelope>quiet.state.envelope*4.9);assert.ok(loud.state.detail>quiet.state.detail*4.9)
 assert.equal(loud.state.midAccent,0)
})
test('upper accents remain bounded and band-specific; bass deformation requires qualified notices',()=>{
 for(let i=0;i<6;i++){
  const f=fixture();run(f,1);f.response.ridges[i].accent=.3;run(f,1)
  assert.equal(f.state.lowAccent,0);assert.equal(f.state.midAccent,i===2?.75:0);assert.equal(f.state.highAccent,i<=1?.75:0)
  assert.equal(f.state.envelope+f.state.detail,0)
 }
 const f=fixture();f.response.ridges[2].accent=99;run(f,1);assert.equal(f.state.midAccent,1)
})
test('zero gain clears musical values without stopping intrinsic time; scaling is not applied twice',()=>{
 const a=fixture(),b=fixture();a.response.ridges[4].target=b.response.ridges[4].target=.4
 run(a,180,.5);run(b,180,1);assert.equal(a.state.envelope,b.state.envelope)
 const before=a.state.time;run(a,1,0);assert.equal(a.state.envelope,0);assert.ok(a.state.time>before)
})
test('stale input clears accents and releases body/detail naturally',()=>{
 const f=fixture();f.response.ridges[4].target=f.response.ridges[2].sustained=.5;f.response.ridges[2].accent=.3;run(f)
 const before=f.state.envelope;f.response.fresh=false;run(f,1)
 assert.ok(f.state.envelope<before&&f.state.envelope>0);assert.equal(f.state.midAccent,0)
 run(f,1200);assert.equal(f.state.envelope,0);assert.equal(f.state.detail,0)
})
test('session change clears old modulation while intrinsic phase continues',()=>{
 const f=fixture();f.response.ridges[4].target=.5;run(f);const before=f.state.time
 f.response.session++;f.response.ridges.forEach(r=>{r.sustained=0;r.target=0;r.accent=0});run(f,1)
 assert.equal(f.state.envelope+f.state.detail+f.state.lowAccent,0);assert.ok(f.state.time>before)
})
test('reduced motion freezes geometry phase and removes attacks but permits calm brightness',()=>{
 const f=fixture();run(f,60);const before=f.state.time
 f.response.ridges[4].target=.5;f.response.ridges[2].accent=.5;run(f,180,1,true)
 assert.equal(f.state.time,before);assert.equal(f.state.motion,0);assert.equal(f.state.midAccent,0);assert.ok(f.state.envelope>.3)
 run(f,1);assert.ok(f.state.time>before);assert.equal(f.state.motion,1)
})
test('intrinsic clock is bounded and cadence independent; stalled/invalid delta cannot jump',()=>{
 const times=[]
 for(const hz of [30,60,120]){const f=fixture();run(f,hz*3,1,false,hz);times.push(f.state.time)}
 assert.ok(Math.max(...times)-Math.min(...times)<1e-10)
 const f=fixture();f.state.time=CORONA_TIME_PERIOD-.01;run(f,1);assert.ok(f.state.time>=0&&f.state.time<.01)
 const before=f.state.time;for(const dt of [NaN,Infinity,-1])updateCorona(f.state,f.response,dt,1,false)
 assert.equal(f.state.time,before);updateCorona(f.state,f.response,100,1,false);assert.ok(f.state.time-before<=.05+1e-10)
 for(const frequency of [.55,.31,.24,.2,.15,.12,.35])assert.ok(Math.abs(Math.sin(CORONA_TIME_PERIOD*frequency))<1e-10)
})
test('production uses the existing sky plane with bounded configurable corona and independent sun',()=>{
 const source=readFileSync('src/scenes/lavender-peaks/LavenderPeaksScene.tsx','utf8')
 assert.doesNotMatch(source,/Math\.random|setState/)
 assert.match(source,/position=\{\[0, 0, -10\]\}/);assert.match(source,/updateCorona\(corona.current, response.current/)
 assert.match(source,/float pulsedSunDistance = sunDistance \/ \(1\.0 \+ sunPulse \* 0\.24\);/)
 assert.match(source,/applyCorona\(color, sunOffset, sunDistance,/)
 assert.equal(CORONA_SETTINGS.maximumRadiusRatio,1.65);assert.equal(CORONA_SETTINGS.sunRadius,.75*SUN.scale);assert.equal(SUN.scale,2);assert.equal(SUN.x,0)
 assert.ok(CORONA_SETTINGS.maximumOpacity<.5);assert.ok(CORONA_SETTINGS.maximumAmplitude<CORONA_SETTINGS.sunRadius*.3)
})

function notice(f:ReturnType<typeof fixture>,sequence:number,strength=.15){
 Object.assign(f.response.ridges[4],{onsetSequence:sequence,onsetTimeSeconds:1,onsetStrength:strength})
 f.response.sampleTime=1
}
test('qualified bass notices launch localized travelling pulses once, deduplicating sub-bass',()=>{
 const f=fixture();run(f,1);notice(f,1)
 Object.assign(f.response.ridges[5],{onsetSequence:1,onsetTimeSeconds:1,onsetStrength:.2})
 run(f,1);assert.equal(f.state.pulses.filter(p=>p.strength>0).length,1)
 run(f,3);assert.ok(f.state.lowAccent>.5);const angle=f.state.pulseUniforms[0]
 run(f,6);assert.ok(f.state.pulseUniforms[0]<angle)
 run(f,60);assert.equal(f.state.lowAccent,0);assert.ok(f.state.pulseUniforms.every((x,i)=>i%2===0||x===0))
 assert.equal(f.state.pulses[0].sequence,1)
})
test('repeated bass attacks have bounded storage; reset/gain/reduced cannot replay retained events',()=>{
 const f=fixture();run(f,1)
 for(let seq=1;seq<=12;seq++){notice(f,seq);run(f,3)}
 assert.equal(f.state.pulses.length,3);assert.ok(f.state.lowAccent<=1);assert.equal(f.state.lastBassSequence,12)
 run(f,1,0);run(f,1);assert.equal(f.state.lowAccent,0)
 notice(f,13);run(f,4);assert.ok(f.state.lowAccent>0)
 run(f,1,1,true);run(f,1);assert.equal(f.state.lowAccent,0)
 f.response.session++;notice(f,14);run(f,4);assert.equal(f.state.lowAccent,0)
})
test('bass deformation bypasses slow ridge smoothing and releases without false bass-free activity',()=>{
 const f=fixture();f.response.ridges[4].target=.4;run(f,1)
 assert.ok(f.state.envelope>.1);assert.equal(f.response.ridges[4].sustained,0)
 f.response.ridges[4].target=0;run(f,300);assert.equal(f.state.envelope,0)
 f.response.ridges[2].target=.8;run(f,120);assert.equal(f.state.envelope,0)
})
test('expired or future bass notices cannot start travelling deformations',()=>{
 for(const emitted of [-1,3,NaN]){
  const f=fixture();run(f,1);notice(f,1)
  f.response.ridges[4].onsetTimeSeconds=emitted
  run(f,5);assert.equal(f.state.lowAccent,0)
 }
})

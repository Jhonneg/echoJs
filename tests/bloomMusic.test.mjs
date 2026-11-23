import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createBloomMusic,updateBloomMusic,bloomDrive} from '../src/scenes/bloom/music.ts'
import {MONOLITH,monolithProjection} from '../src/scenes/bloom/monolith.ts'
const names=['subBass','bass','lowMids','highMids','presence','air']
function fixture(){
 const state=createBloomMusic(),six=Object.fromEntries(names.map(n=>[n,0]))
 const view={version:1,session:1,frame:0,sequence:0,status:'active',updatedAtSeconds:1,energy:{low:0,mid:0,high:0,overall:0,six},context:{intensity:0,activity:0,brightness:0,brightnessValid:false},events:[]}
 let time=1,reads=0;const reader={read:()=>{reads++;return view}}
 function step({energy,event,strength=.424,gain=1,reduced=false,dt=1/60,fresh=true}={}){
  time+=dt;view.frame++;if(fresh)view.updatedAtSeconds=time
  if(energy)Object.assign(six,energy)
  view.events=event?[{session:view.session,sequence:++view.sequence,band:event,strength,timeSeconds:time,emittedAtSeconds:time}]:[]
  return updateBloomMusic(state,reader,dt,time,gain,reduced)
 }
 const run=(count,o)=>{for(let i=0;i<count;i++)step(o);return state}
 step();return{state,view,step,run,reader,now:()=>time,reads:()=>reads}
}

test('fixed calibrated knee preserves quiet/loud ordering independently of global intensity',()=>{
 for(const name of names){const f=fixture();f.view.context.intensity=1;f.view.energy.overall=1
  f.run(300,{energy:{[name]:.0424}});const quiet=f.state.bands[names.indexOf(name)].sustained
  f.run(300,{energy:{[name]:.424}});assert.ok(f.state.bands[names.indexOf(name)].sustained>quiet*3)
  f.state.bands.forEach((b,i)=>{if(names[i]!==name)assert.equal(b.sustained,0)})
 }
 assert.equal(bloomDrive(0),0);assert.equal(bloomDrive(NaN),0)
})
test('each six-band onset qualifies only its rising band; seam and trail voices remain independent',()=>{
 for(let b=0;b<6;b++){const f=fixture();f.run(12);f.run(3,{energy:{[names[b]]:.424}});f.step({event:['low','low','mid','mid','high','high'][b]})
  assert.ok(f.state.bands[b].accent>.65)
  f.state.bands.forEach((band,i)=>{if(i!==b)assert.equal(band.accent,0)})
  if(b<2){assert.equal(f.state.output.seamLevel,1);assert.ok(f.state.trails.every(t=>t.level===1));assert.ok(f.state.ringStrength>0)}
  if(b===2){assert.equal(f.state.output.seamLevel,1);assert.ok(f.state.trails[0].pulses.some(p=>p.strength>0));assert.ok(f.state.trails[1].pulses.every(p=>p.strength===0))}
  if(b===3){assert.ok(f.state.output.seamLevel>1.8);assert.ok(f.state.trails[1].pulses.some(p=>p.strength>0))}
 }
})
test('low-mid attacks beside sustained high mids never create a high-mid seam accent',()=>{
 const f=fixture();f.run(180,{energy:{highMids:.141}});f.run(4,{energy:{lowMids:.424}});f.step({event:'mid'})
 assert.equal(f.state.bands[3].accent,0);assert.ok(f.state.bands[2].accent>.6)
})
test('one borrowed read per update, no retention or duplicate history/events on repeated frame',()=>{
 const f=fixture();f.run(12);f.run(3,{energy:{highMids:.424}});f.step({event:'mid'})
 const accent=f.state.bands[3].accent,count=f.state.count,reads=f.reads(),cursor=f.state.trails[1].cursor
 updateBloomMusic(f.state,f.reader,.016,f.now()+.016,1,false)
 assert.equal(f.reads(),reads+1);assert.equal(f.state.count,count);assert.equal(f.state.trails[1].cursor,cursor);assert.ok(f.state.bands[3].accent<accent)
 const stored=f.state.bands[3].energy;f.view.energy.six.highMids=0;assert.equal(f.state.bands[3].energy,stored)
 assert.equal(f.state.times.length,64);assert.equal(f.state.energies.length,384)
})
test('delayed onset uses history at attack time; stale/future/foreign events cannot accent',()=>{
 const f=fixture();f.run(20);f.run(3,{energy:{highMids:.424}});const peak=f.now();f.run(6,{energy:{highMids:0}})
 f.view.events=[{session:1,sequence:++f.view.sequence,band:'mid',strength:.424,timeSeconds:peak,emittedAtSeconds:f.now()}]
 updateBloomMusic(f.state,f.reader,.016,f.now(),1,false);assert.ok(f.state.bands[3].accent>.6)
 for(const kind of ['stale','future','foreign']){const g=fixture();g.run(20);g.run(3,{energy:{highMids:.424}})
  g.view.events=[{session:kind==='foreign'?2:1,sequence:++g.view.sequence,band:'mid',strength:1,timeSeconds:g.now()-(kind==='stale'?1:0),emittedAtSeconds:g.now()+(kind==='future'?1:0)}]
  updateBloomMusic(g.state,g.reader,.016,g.now(),1,false);assert.equal(g.state.bands[3].accent,0)
 }
})
test('session, source gaps, priming and rollback discard history and retained events',()=>{
 for(const kind of ['session','gap','priming','rollback']){const f=fixture();f.run(20);f.run(3,{energy:{highMids:.424}});f.step({event:'mid'});assert.ok(f.state.bands[3].accent>0)
  if(kind==='session')f.view.session++
  if(kind==='gap')f.view.updatedAtSeconds=f.now()+1
  if(kind==='priming')f.view.status='priming'
  if(kind==='rollback'){f.view.frame=1;f.view.updatedAtSeconds=f.now()-.02}
  updateBloomMusic(f.state,f.reader,.016,kind==='gap'?f.now()+1:f.now(),1,false)
  assert.equal(f.state.bands[3].accent,0);assert.ok(f.state.trails.every(t=>t.pulses.every(p=>p.strength===0)))
 }
})
test('gain zero clears musical outputs; reduced motion freezes clocks and suppresses movement/attacks',()=>{
 const f=fixture();f.view.context.intensity=.9;f.view.context.activity=1;f.run(180,{energy:{bass:.424,highMids:.424}})
 f.step({event:'mid'});f.step({gain:0})
 assert.ok(f.state.bands.every(b=>b.sustained===0&&b.accent===0));assert.equal(f.state.output.heroY,MONOLITH.y);assert.equal(f.state.output.seamLevel,1)
 f.run(60,{reduced:true});const time=f.state.time,ambient=f.state.ambient.time,phase=f.state.trails[0].phase
 f.run(10,{reduced:true,event:'low'});assert.equal(f.state.time,time);assert.equal(f.state.ambient.time,ambient);assert.equal(f.state.trails[0].phase,phase)
 assert.equal(f.state.output.heroY,MONOLITH.y);assert.equal(f.state.output.heroYaw,MONOLITH.yaw);assert.equal(f.state.ringStrength,0)
})
test('silence decays musical light naturally while preserving the approved idle scene',()=>{
 const f=fixture();f.run(180,{energy:{bass:.424,highMids:.424}});f.step({event:'mid'});const peak=f.state.output.seamLevel
 f.run(15,{energy:{bass:0,highMids:0}});assert.ok(f.state.output.seamLevel<peak&&f.state.output.seamLevel>1)
 f.run(720);assert.equal(f.state.output.seamLevel,1);assert.equal(f.state.output.heroY,MONOLITH.y);assert.ok(f.state.output.auroraStrength>=.18)
})
test('invalid context brightness cannot bias hue; context alone cannot fire band accents',()=>{
 const f=fixture();f.view.context={intensity:1,activity:1,brightness:1,brightnessValid:false};f.run(300)
 assert.equal(f.state.context.brightness,.5);assert.equal(f.state.output.seamLevel,1);assert.ok(f.state.trails.every(t=>t.level===1));assert.ok(f.state.output.auroraStrength>f.state.ambient.strength)
})
test('pose projection stays aligned through bounded musical lift/yaw and reuses storage',()=>{
 const f=fixture();f.view.context.intensity=1;f.view.context.activity=1;const p=f.state.projection
 f.run(600,{energy:{bass:1}});const o=f.state.output
 assert.equal(p,f.state.projection);assert.ok(o.heroY<=MONOLITH.y+.3&&Math.abs(o.heroYaw-MONOLITH.yaw)<=.08)
 const expected=MONOLITH.x+Math.cos(o.heroYaw)*MONOLITH.seamX+Math.sin(o.heroYaw)*MONOLITH.seamZ
 assert.ok(Math.abs(p.seamX-expected)<1e-12);assert.ok(Math.abs(p.top-p.bottom-MONOLITH.height*MONOLITH.reflectionCompression)<1e-12)
 assert.equal(monolithProjection(o.heroY,o.heroYaw,p),p)
})
test('migration removes all legacy runtime wiring from Bloom and does not install camera tilt',()=>{
 const scene=readFileSync('src/scenes/bloom/BloomScene.tsx','utf8'),app=readFileSync('src/App.tsx','utf8')
 assert.doesNotMatch(scene,/AudioSignal|updateBloomResponse|createBloomResponse|signal=\{/)
 assert.match(scene,/cameraTilt=\{false\}/);assert.match(app,/<BloomScene[^>]*musicFeatures=\{analysis.musicFeatures!\}/)
})

test('existing production analysis feeds calibrated generated attacks to the correct Bloom voice',async()=>{
 const {createMusicAnalysis}=await import('../src/audio/music/analysis.ts')
 for(const [name,frequency]of [['bass',140.625],['lowMids',468.75],['highMids',1500],['air',10007.8125]]){
  const engine=createMusicAnalysis(),state=createBloomMusic(),bins=new Float32Array(1024);let peak=0,rawPeak=0
  for(let i=1;i<=420;i++){
   bins.fill(-Infinity)
   if(i>=180&&i<240||i>=300&&i<360){const k=Math.round(frequency*2048/48000);for(let off=-2;off<=2;off++)bins[k+off]=20*Math.log10(.1*[.02,.125,.21,.125,.02][off+2])}
   const now=i/60;engine.update(bins,48000,2048,now*1000,true);updateBloomMusic(state,engine.reader,1/60,now,1,false)
   const b=state.bands[names.indexOf(name)];peak=Math.max(peak,b.accent);rawPeak=Math.max(rawPeak,b.energy)
   if(name!=='highMids')assert.equal(state.bands[3].accent,0)
  }
  assert.ok(rawPeak>.14&&rawPeak<.142);assert.ok(peak>.35)
 }
})
test('sustained outputs converge across render cadences and event buffers remain bounded under repeated hits',()=>{
 const levels=[]
 for(const hz of [30,60,120]){const f=fixture();f.run(hz*3,{energy:{bass:.141,highMids:.141},dt:1/hz});levels.push(f.state.output.seamLevel)}
 assert.ok(Math.max(...levels)-Math.min(...levels)<.001)
 const f=fixture();for(let i=0;i<1200;i++)f.step({energy:{highMids:i%30<10?.424:0},event:i%30===2?'mid':undefined})
 assert.ok(f.state.count<=64);assert.equal(f.state.trails[1].pulses.length,2);assert.ok(f.state.trails[1].pulses.every(p=>Number.isFinite(p.progress)&&p.strength>=0&&p.strength<=1))
})

test('stone shader uniforms retain the material-owned seam and aurora controls',async()=>{
 const {Color}=await import('three'),{createStoneMaterial}=await import('../src/scenes/bloom/monolith.ts')
 const m=createStoneMaterial(new Color('#9CD7C8'),{value:.24})
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>\n#include <normal_fragment_maps>\n#include <emissivemap_fragment>'}
 m.onBeforeCompile(shader)
 assert.equal(shader.uniforms.stoneSeamLevel,m.seamLevel);assert.equal(shader.uniforms.stoneAuroraStrength,m.auroraStrength)
 m.seamLevel.value=2;m.auroraStrength.value=.45
 assert.equal(shader.uniforms.stoneSeamLevel.value,2);assert.equal(shader.uniforms.stoneAuroraStrength.value,.45)
 m.dispose()
})

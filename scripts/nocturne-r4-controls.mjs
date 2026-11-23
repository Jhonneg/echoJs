// Generated-input UI/lifecycle checks. All reader overrides are temporary-copy only.
import assert from 'node:assert/strict'
export async function runR4Controls({send,evaluate,wait,select,pause,snapshot,targetId,reduced,checks=[]}){
 const record=async(name,details={})=>{const state=await snapshot(name);checks.push({name,...details,state});return state}
 const off=r=>Object.values(r.channels).every(c=>c.level===0)&&Object.values(r.instanceLevels).every(a=>a.every(v=>v===0))
 const active=async()=>{
  await evaluate('delete window.__r4Override;delete window.__r4OverrideFresh;window.__r0Audio.pause();true')
  await wait('document.querySelector(".scene-player button")?.textContent==="Play"')
  await evaluate('window.__r0Audio.currentTime=45;document.querySelector(".scene-player button").click();true')
  await wait('(()=>{const a=window.__r0Audio,r=window.__r0Latest;if(a.currentTime>48){a.currentTime=45;return false}return !a.paused&&a.currentTime>45.2&&!r.override&&r.audioTime>45.15&&r.features.status==="active"&&r.channels.cyanPanel.level>.06})()')
 }
 const gain=async value=>{await evaluate(`(()=>{const e=document.querySelector('.slider-control input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,String(${value}));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);await pause(180)}
 await select('nocturne-lighting-mode','audio');await active()
 await evaluate('window.__r4OriginalAudio=window.__r0Audio;true')
 const original=await record('positive-generated-input');assert.ok(original.features.energy.six.highMids>.01)
 await gain(0);const zero=await record('zero-reactivity');assert.ok(off(zero));assert.equal(zero.environment.depthIntensity,0)
 await select('nocturne-lighting-mode','manual')
 await evaluate(`Array.from(document.querySelectorAll('.nocturne-lighting-presets button')).find(x=>x.textContent==='All on').click();true`)
 const manual=await record('manual-at-zero-reactivity');assert.ok(Object.values(manual.channels).every(c=>c.level===1));assert.ok(Math.abs(manual.environment.depthIntensity-11.7)<1e-10)
 await select('nocturne-lighting-mode','audio');await gain(1);await active()
 const actualSession=await evaluate('window.__r0Latest.features.session')
 await evaluate('window.__r0Audio.currentTime=11.5;true');await wait(`window.__r0Latest.features.session>${actualSession} && window.__r0Latest.features.status==='active'`)
 await record('actual-seek-new-session')
 await active()
 await evaluate(`(()=>{const v=JSON.parse(JSON.stringify(window.__r0Latest.features));v.status='active';v.updatedAtSeconds=performance.now()/1000-1;window.__r4Override=v;return true})()`)
 await wait('Object.values(window.__r0Latest.channels).every(c=>c.level===0)')
 const stale=await record('synthetic-stale-reader',{syntheticReader:true});assert.ok(off(stale));assert.ok(stale.now-stale.features.updatedAtSeconds>.25)
 await active()
 await evaluate(`(()=>{const v=JSON.parse(JSON.stringify(window.__r0Latest.features)),now=performance.now()/1000;v.status='active';v.session+=1000;v.sequence+=1;v.events=[{session:v.session,sequence:v.sequence,band:'high',strength:1,timeSeconds:now,emittedAtSeconds:now}];for(const k of Object.keys(v.energy.six))v.energy.six[k]=0;v.energy.low=v.energy.mid=v.energy.high=v.energy.overall=0;v.context.intensity=1;v.context.activity=0;window.__r4Override=v;window.__r4OverrideFresh=true;return true})()`)
 const fresh=await record('synthetic-session-retained-event',{syntheticReader:true});assert.ok(off(fresh));assert.ok(Object.values(fresh.channels).every(c=>c.accent===0));assert.ok(fresh.environment.depthIntensity>0)
 await active()
 for(const scene of ['bloom','lavender-peaks','crimson-horizon','nocturne']){await select('scene-select',scene);assert.equal(await evaluate('window.__r0Audio===window.__r4OriginalAudio'),true)}
 await wait('window.__r0Latest.now>performance.now()/1000-.2');await record('scene-switch-return')
 await evaluate('window.__r4OriginalCanvas=document.querySelector("canvas");true')
 for(const quality of ['low','standard']){await select('graphics-quality',quality);await wait(`window.__r0Latest.renderer.dpr===${quality==='low'?.75:1}`);assert.equal(await evaluate('window.__r4OriginalCanvas===document.querySelector("canvas")'),true)}
 await record('quality-switch-same-canvas')
 await active();await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(500)
 const reducedState=await record('dynamic-reduced-motion');assert.ok(Object.values(reducedState.channels).every(c=>c.accent===0));assert.ok(reducedState.bridgeSections.every(v=>v===0));assert.ok(reducedState.channels.cyanPanel.level>0)
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})
 await active();await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false})
 await evaluate("document.querySelector('details.audio-chooser').open=true;true")
 const portrait=await record('portrait-controls-open');assert.ok(portrait.channels.cyanPanel.level>0)
 const bounds=await evaluate(`(()=>{const r=document.querySelector('.audio-controls').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollHeight}})()`)
 assert.ok(bounds.x>=0&&bounds.right<=bounds.width+1&&bounds.y>=0&&bounds.bottom<=bounds.height+1);assert.ok(bounds.scroll<=bounds.height+1)
 checks.at(-1).bounds=bounds
 await send('Emulation.setDeviceMetricsOverride',{width:1920,height:810,deviceScaleFactor:1,mobile:false});await record('wide-controls-open')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});await active()
 await evaluate(`document.querySelector('.fullscreen-controls button').click();true`);await wait('!!document.fullscreenElement')
 await record('fullscreen-native-api');assert.equal(await evaluate('window.__r0Audio===window.__r4OriginalAudio'),true)
 await evaluate('document.exitFullscreen();true');await wait('!document.fullscreenElement')
 await evaluate("document.querySelector('details.audio-chooser').open=false;true")
 // Activate a real second page. This checks the browser visibility API, not OS minimization.
 const other=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:other.targetId});await pause(1200)
 const visibility=await evaluate('document.visibilityState')
 await evaluate('window.__r4ResumeRows=[];true');await send('Target.activateTarget',{targetId});await pause(400)
 const background=await record('background-return',{hiddenObserved:visibility==='hidden',visibilityWhileBackgrounded:visibility})
 background.resume=await evaluate('window.__r4ResumeRows');await send('Target.closeTarget',{targetId:other.targetId})
 await active();await evaluate('document.querySelector(".disconnect-button").click();true')
 await wait('window.__r0Latest.features.status==="inactive" && Object.values(window.__r0Latest.channels).every(c=>c.level===0)')
 const disconnected=await record('abrupt-generated-file-disconnect');assert.ok(off(disconnected));assert.equal(disconnected.environment.depthIntensity,0)
 assert.equal(await evaluate('window.__r0Audio.paused && !window.__r0Audio.getAttribute("src")'),true)
 // A new generated source after disconnect also verifies a fresh adapter/session.
 const dom=await send('DOM.getDocument',{depth:-1}),file=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'})
 await send('DOM.setFileInputFiles',{nodeId:file.nodeId,files:['/tmp/echo-nocturne-r4-review.wav']});await wait('!!document.querySelector(".scene-player button")');await active();await record('generated-file-reconnect')
 await evaluate('window.__r4ResumeRows=[];true');await send('Page.setWebLifecycleState',{state:'frozen'});await pause(1000);await send('Page.setWebLifecycleState',{state:'active'});await send('Page.bringToFront');await send('Target.activateTarget',{targetId});await pause(700)
 const sampleAge=await evaluate('performance.now()/1000-window.__r0Latest.now')
 await record('browser-lifecycle-freeze-return',{cdpLifecycleEmulation:true,sampleAge,status:sampleAge<.25?'resumed':'manual pending: CDP freeze did not resume animation frames',resume:await evaluate('window.__r4ResumeRows')})

 return {checks,notes:['Reader staleness/retained events are explicit synthetic temporary-reader cases.','Fullscreen API is real in a headless window; physical Escape/OS minimization remain separate manual checks.','No browser picker, owner media or audibility verification.']}
}

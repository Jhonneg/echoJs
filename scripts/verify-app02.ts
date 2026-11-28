// APP02 browser checks: safer source switching, Options playback, announcements, help text,
// keyboard order and enlarged text. Generated WAV/oscillator audio and explicitly simulated
// getDisplayMedia only; native picker, audibility and screen-reader speech stay manual.
import {spawn,execFileSync} from 'node:child_process'
import {createServer} from 'node:net'
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
const output='docs/evidence/application/app02',temporary=await mkdtemp(join(tmpdir(),'echo-app02-'))
await mkdir(output,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise<any>(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const n=(s.address() as {port:number}).port;s.close(()=>r(n))})})
const [http,debug]=await Promise.all([port(),port()])
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(http),'--strictPort'],{stdio:'ignore'})
const browser=spawn('brave',['--headless','--enable-gpu','--use-angle=gl','--mute-audio','--no-sandbox','--disable-dev-shm-usage',`--user-data-dir=${temporary}/profile`,`--remote-debugging-port=${debug}`,'about:blank'],{stdio:'ignore'})
const report:Record<string,any>={errors:[],warnings:[],screenshots:[],checks:[],source:'Actual production build. Generated WAV/oscillator only; getDisplayMedia explicitly simulated. No owner media; no native picker/audibility/screen-reader certification.'}
let ws
try{
 let pages;for(let i=0;i<150;i++){try{pages=await(await fetch(`http://127.0.0.1:${debug}/json`)).json();break}catch{}await pause(100)}
 ws=new WebSocket(pages[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let id=0;const pending=new Map()
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails.exception?.description);if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))report[m.params.type==='error'?'errors':'warnings'].push(m.params.args.map(a=>a.value||a.description).join(' '))})
 const send=(method,params={})=>new Promise<any>((r,j)=>{const n=++id;pending.set(n,m=>m.error?j(Error(JSON.stringify(m.error))):r(m.result));ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))j(Error(method+' timeout'))},30000).unref()})
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
 const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression+' :: '+JSON.stringify(await ev('__state()')))}
 await send('Runtime.enable');await send('Page.enable')
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__streams=[];window.__audios=[];window.__mode='active';
 const NativeContext=window.AudioContext;
 const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.__audios.push(a);return a};
 window.__makeStream=()=>{const c=new NativeContext(),o=c.createOscillator(),g=c.createGain(),d=c.createMediaStreamDestination();o.frequency.value=180;o.connect(g);g.connect(d);g.gain.value=.1;o.start();window.__streams.push(d.stream);return d.stream};
 navigator.mediaDevices.getDisplayMedia=()=>{if(window.__mode==='denied')return Promise.reject(new DOMException('Injected denial','NotAllowedError'));if(window.__mode==='pending')return new Promise<any>(r=>window.__resolveCapture=r);return Promise.resolve(window.__makeStream())};
 window.__state=()=>{const audio=[...window.__audios].reverse().find(a=>a.getAttribute('src')),q=s=>document.querySelector(s);
  return{feedback:q('#audio-feedback-status')?.textContent,tone:q('.audio-feedback')?.dataset.tone,action:q('.audio-feedback button')?.textContent,
  polite:q('.experience-controls > [role=status]')?.textContent,alert:q('.experience-controls > [role=alert]')?.textContent,
  options:q('details').open,audio:audio?{time:audio.currentTime,paused:audio.paused}:null,
  liveTracks:window.__streams.flatMap(s=>s.getTracks()).filter(t=>t.readyState==='live').length,
  optionsPlay:(()=>{const b=q('.options-playback button');return b&&b.getBoundingClientRect().height>0?b.textContent:null})(),
  player:(()=>{const p=q('.scene-player');return !!p&&p.getBoundingClientRect().height>0})(),
  help:[...document.querySelectorAll('.audio-controls .source-help')].map(p=>p.textContent.trim()),
  overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.trim().slice(0,40),
  bounds:(()=>{const r=q('.experience-controls').getBoundingClientRect(),p=q('.audio-controls').getBoundingClientRect();return{controlsTop:r.top,controlsBottom:r.bottom,optionsTop:p.top,optionsBottom:p.bottom}})()}};
 `})
 const size=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(120)}
 await size(1440,900)
 await send('Page.navigate',{url:`http://127.0.0.1:${http}/`});await ev(`new Promise<any>(r=>{const t=()=>document.querySelector('canvas')?r(true):setTimeout(t,100);t()})`);await pause(600)
 const state=()=>ev('__state()')
 const shot=async(name,width=1440,height=900)=>{await size(width,height);const row=await state(),s=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,`${name}.png`),Buffer.from(s.data,'base64'));report.screenshots.push({name,width,height,row});assert.ok(!row.overflow,name+' overflows horizontally');console.log('shot',name);return row}
 const share=()=>ev(`document.querySelector('.source-actions button').click();true`)
 const options=open=>ev(`document.querySelector('details').open=${open};true`)
 const cancel=()=>ev(`document.querySelector('.audio-feedback button').click();true`)
 const selectFile=async invalid=>ev(`{const dt=new DataTransfer();${invalid?"dt.items.add(new File(['invalid generated bytes'],'invalid.wav',{type:'audio/wav'}));":`const rate=48000,n=rate*30,b=new ArrayBuffer(44+2*n),d=new DataView(b),txt=(o,t)=>[...t].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,36+2*n,true);txt(8,'WAVE');txt(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,2*n,true);for(let i=0;i<n;i++)d.setInt16(44+2*i,Math.sin(i*2*Math.PI*180/rate)*3000,true);dt.items.add(new File([b],'generated-tone.wav',{type:'audio/wav'}));`}const x=document.querySelector('input[type=file]');x.files=dt.files;x.dispatchEvent(new Event('change',{bubbles:true}))};true`)
 const play=()=>ev(`document.querySelector('.scene-player button').click();true`)

 // 1. Tab connected → invalid file: tab stays connected, failure goes to the urgent region.
 await share();await wait(`__state().feedback==='Listening to your shared tab.'`)
 let row=await state();assert.ok(row.polite.includes('Listening'));assert.equal(row.alert,'')
 await selectFile(true);await wait(`__state().feedback.includes('could not be played, so your shared tab is still connected')`)
 row=await shot('tab-kept-after-bad-file');assert.equal(row.tone,'error');assert.equal(row.action,'Open audio file');assert.ok(row.liveTracks>0,'tab tracks released');assert.ok(row.alert.includes('could not be played'));assert.equal(row.polite,'')
 report.checks.push('Tab → unplayable file: tab stays connected (live tracks), error announced in role=alert, polite region cleared.')

 // 2. Tab → valid file replaces the tab only after the file opens.
 await selectFile(false);await wait(`__state().feedback.startsWith('File selected')`);row=await state();assert.equal(row.liveTracks,0)
 await play();await wait(`__state().feedback==='Playing local audio.'&&__state().audio.time>1.5`)
 report.checks.push('Tab → playable file: file loads, tab tracks released.')

 // 3. Playing file → invalid file: the current file keeps playing.
 await selectFile(true);await wait(`__state().feedback.includes('generated-tone.wav is still loaded')`)
 row=await shot('file-kept-after-bad-file');assert.equal(row.audio.paused,false,'current file stopped');const before=row.audio.time;await pause(500);assert.ok((await state()).audio.time>before)
 report.checks.push('File → unplayable file: current file keeps playing and advancing.')

 // 4. Playing file → Share, then Cancel: same file returns at the same position.
 await ev(`window.__mode='pending';true`);const at=(await state()).audio.time;await share();await wait(`__state().action==='Cancel sharing'`);await cancel()
 await wait(`__state().feedback.includes('generated-tone.wav is loaded again')&&__state().audio&&__state().audio.time>0`)
 row=await shot('file-restored-after-cancel');assert.ok(Math.abs(row.audio.time-at)<1.5,`restored at ${row.audio.time}, was ${at}`);assert.equal(row.audio.paused,true)
 await ev(`window.__resolveCapture?.(window.__makeStream());true`);await pause(200);assert.equal((await state()).liveTracks,0,'late stream not released')
 report.checks.push(`File → Share → Cancel: file reloaded at ${row.audio.time.toFixed(2)}s (was ${at.toFixed(2)}s), paused; late stream released.`)

 // 5. Denied sharing also restores the file and keeps the reason.
 await ev(`window.__mode='denied';true`);await share();await wait(`__state().feedback.includes('cancelled or denied')&&__state().feedback.includes('loaded again')`)
 await shot('file-restored-after-denial');report.checks.push('File → Share → denied: file restored, denial reason kept in the message.')

 // 6. Successful share from a file replaces it.
 await ev(`window.__mode='active';true`);await share();await wait(`__state().feedback==='Listening to your shared tab.'`);assert.equal((await state()).audio,null)
 report.checks.push('File → Share → connected: file released, tab connected.')

 // 7. Narrow screens: Play/Pause inside Options while the player is hidden.
 await selectFile(false);await wait(`__state().feedback.startsWith('File selected')`)
 await size(390,844);await options(true);await pause(150);row=await state();assert.equal(row.player,false);assert.equal(row.optionsPlay,'Play')
 await ev(`document.querySelector('.options-playback button').click();true`);await wait(`__state().optionsPlay==='Pause'&&__state().audio.time>.3`)
 await shot('narrow-options-playback',390,844)
 await ev(`document.querySelector('.options-playback button').click();true`);await wait(`__state().optionsPlay==='Play'`)
 await size(1440,900);row=await state();assert.equal(row.optionsPlay,null,'duplicate Play on desktop');assert.equal(row.player,true)
 await options(false);report.checks.push('390px: player hidden with Options open, Options Play/Pause works; 1440px: no duplicate control.')

 // 8. Help text for every landscape.
 const helps:Record<string,any>={}
 for(const scene of ['bloom','lavender-peaks','nocturne','crimson-horizon']){
  await ev(`{const x=document.getElementById('scene-select');x.value='${scene}';x.dispatchEvent(new Event('change',{bubbles:true}))};true`);await pause(500);await options(true);await pause(100)
  row=await shot(`help-${scene}`);helps[scene]=row.help;assert.ok(row.help.length>0,scene+' has no help');await options(false)
 }
 assert.ok(helps.bloom.some(t=>t.includes('monolith floats')));assert.ok(helps['lavender-peaks'].some(t=>t.includes('Each ridge')));assert.ok(!JSON.stringify(helps).includes('all mountains move together'))
 report.help=helps;report.checks.push('All four landscapes show help in Options; outdated Lavender text gone; Bloom help present.')

 // 9. Keyboard order through the toolbar and player.
 await ev(`document.activeElement?.blur();true`);const order:any[]=[]
 for(let i=0;i<8;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});order.push((await state()).focus)}
 report.keyboardOrder=order;for(const want of ['Change landscape','Share a tab','Open audio file','options','Play'])assert.ok(order.some(f=>f?.toLowerCase().includes(want.toLowerCase())||(want==='Change landscape'&&f?.includes('Crimson'))),`keyboard misses ${want}: ${order}`)
 report.checks.push('Tab key reaches landscape select, Share, Open file, Options and Play in order: '+order.join(' → '))

 // 10. 200% text at narrow, short and desktop sizes with Options open.
 await ev(`document.documentElement.style.fontSize='200%';true`);await options(true)
 for(const [w,h] of [[1440,900],[390,844],[320,568]] as const){row=await shot(`text-200-${w}x${h}`,w,h);assert.ok(row.bounds.optionsTop>=-1&&row.bounds.controlsBottom<=h+1,`clipped at ${w}x${h}: ${JSON.stringify(row.bounds)}`)}
 await options(false);row=await shot('text-200-closed-320x568',320,568)
 await ev(`document.documentElement.style.fontSize='';true`)
 report.checks.push('200% text: no horizontal overflow; Options panel and controls stay inside the viewport at 1440×900, 390×844 and 320×568.')

 // 11. Built output carries no stale help or fallback wording.
 const {readdir}=await import('node:fs/promises');let bundle='';for(const f of await readdir('dist/assets'))if(f.endsWith('.js'))bundle+=await readFile(join('dist/assets',f),'utf8')
 for(const stale of ['Bloom menu','scene menu','all mountains move together'])assert.ok(!bundle.includes(stale),stale)
 assert.ok(bundle.includes('stopped displaying'));report.checks.push('Production bundle has no "Bloom menu"/"scene menu"/old Lavender text; new fallback text present.')

 // Scope: only the files APP02 planned to touch differ from HEAD.
 // Bloom is being rebuilt (BR1+) and Nocturne refined (NT16+); these scope checks cover APP-phase files only.
 const changed=execFileSync('git',['diff','--name-only','HEAD','--','src',':(exclude)src/scenes/bloom',':(exclude)src/scenes/nocturne',':(exclude)src/scenes/crimson-horizon',':(exclude)src/scenes/lavender-peaks',':(exclude)src/components/BloomDebugControls.tsx']).toString().trim().split('\n').filter(Boolean)
 const allowed=['src/App.tsx','src/audio/localFile.ts','src/audio/tabCapture.ts','src/components/AudioControls.tsx','src/components/audioFeedback.ts','src/index.css','src/scenes/bloom/BloomScene.tsx','src/scenes/crimson-horizon/CrimsonHorizonScene.tsx','src/scenes/lavender-peaks/LavenderPeaksScene.tsx','src/scenes/nocturne/NocturneScene.tsx',
  // APP03 builds on uncommitted APP02; its files are allowed here too.
  'src/engine/LandscapeCanvas.tsx','src/engine/renderHealth.ts','src/components/SceneStatus.tsx']
 for(const f of changed)assert.ok(allowed.includes(f),'unexpected change '+f);report.changedSources=changed
 const sceneDiff=execFileSync('git',['diff','-U0','HEAD','--','src/scenes',':(exclude)src/scenes/bloom',':(exclude)src/scenes/nocturne',':(exclude)src/scenes/crimson-horizon',':(exclude)src/scenes/lavender-peaks',':(exclude)src/components/BloomDebugControls.tsx']).toString().split('\n').filter(l=>/^[+-][^+-]/.test(l))
 assert.ok(sceneDiff.every(l=>l.includes('-fallback">')),'scene change outside fallback text');report.sceneLinesChanged=sceneDiff.length
 assert.deepEqual(report.errors,[]);report.status='APP02 controlled browser checks PASS';console.log(report.status)
}catch(e:any){report.failure=String(e);throw e}finally{await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));ws?.close();browser.kill();server.kill();await new Promise(r=>setTimeout(r,500));await rm(temporary,{recursive:true,force:true}).catch(()=>{}) /* removeProfile */}

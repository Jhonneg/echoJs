import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'

const source = (await readFile(new URL('../src/audio/analysis.ts', import.meta.url), 'utf8'))
 .replaceAll('import.meta.env.DEV', 'false')
 .replace(/from '([^']+)'/g, (_, relative) => `from '${pathToFileURL(new URL(`../src/audio/${relative}.ts`, import.meta.url).pathname).href}'`)
const { createAnalysis } = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(source))}`)
const node = () => ({ connect() {}, disconnect() {} })
function setup() {
 globalThis.requestAnimationFrame = () => 1
 globalThis.cancelAnimationFrame = () => {}
 const contexts:any[]=[]
 ;(globalThis as any).AudioContext = class {
  state = 'running'; sampleRate = 48000; destination = {}; rejectResume = false
  constructor() { contexts.push(this) }
  resume() { if (this.rejectResume) return Promise.reject(Error('blocked')); this.state='running'; return Promise.resolve() }
  close() { this.state='closed'; return Promise.resolve() }
  createAnalyser() { return { ...node(), frequencyBinCount: 1024 } }
  createMediaStreamSource() { return node() }
  createMediaElementSource() { return node() }
 }
 return contexts
}
test('analysis health separates idle, prepared, running, suspended and closed contexts',async()=>{
 const contexts=setup(),a=createAnalysis()
 assert.equal(a.health.status,'idle');assert.deepEqual(a.prepare(),{ok:true});assert.equal(a.health.status,'starting')
 assert.deepEqual(a.start({}),{ok:true});assert.equal(a.health.status,'running')
 contexts[0].state='suspended';assert.equal(a.health.status,'suspended')
 a.resume();await Promise.resolve();assert.equal(a.health.status,'running')
 contexts[0].state='closed';assert.equal(a.health.status,'error')
 a.stop();assert.equal(a.health.status,'idle')
})
test('construction and graph failures return typed failure results and can recover',()=>{
 setup();(globalThis as any).AudioContext=class{constructor(){throw Error('unavailable')}}
 const a=createAnalysis();assert.equal(a.prepare().ok,false);assert.equal(a.health.status,'error');assert.equal(a.start({}).ok,false)
 const contexts=setup();assert.equal(a.prepare().ok,true)
 contexts[0].createMediaStreamSource=()=>{throw Error('graph failed')}
 const failed=a.start({});assert.equal(failed.ok,false);assert.match(failed.message,/could not start/)
 assert.equal(contexts[0].state,'closed');assert.equal(a.health.status,'error')
 assert.equal(a.prepare().ok,true);assert.equal(a.start({}).ok,true);a.stop()
})
test('resume rejection is recoverable and a late rejection cannot poison a replacement context',async()=>{
 const contexts=setup(),a=createAnalysis();a.prepare();a.start({});await Promise.resolve()
 contexts[0].state='suspended';contexts[0].rejectResume=true;a.resume();await Promise.resolve();await Promise.resolve()
 assert.equal(a.health.status,'suspended');assert.match(a.health.message,/could not resume/)
 contexts[0].rejectResume=false;a.resume();await Promise.resolve();assert.equal(a.health.status,'running')
 let reject;contexts[0].resume=()=>new Promise<any>((_,r)=>{reject=r});a.resume()
 a.prepare();a.start({});reject(Error('late blocked'));await Promise.resolve();await Promise.resolve()
 assert.equal(a.health.status,'running');a.stop()
})

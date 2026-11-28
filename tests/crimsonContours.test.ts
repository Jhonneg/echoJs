import test from 'node:test'
import assert from 'node:assert/strict'
import { createContourLighting, updateContourLighting, contourOrigin, contourStreakDrive, CONTOUR_STREAK_SECONDS } from '../src/scenes/crimson-horizon/contours.ts'
import { createMusicPilot, updateMusicPilot } from '../src/scenes/crimson-horizon/musicPilot.ts'
import { createMusicFeatureStore } from '../src/audio/musicFeatures.ts'
import { emptySixBands } from '../src/audio/signal.ts'
import { terrainVertex, terrainFragment } from '../src/scenes/crimson-horizon/material.ts'

function tick(state: ReturnType<typeof createContourLighting>, now: number, low=0, high=0, gain=1, active=true, reduced=false,hz=60,session=1) {
  updateContourLighting(state,low,high,session,Math.round(now*hz),now,now,1/hz,gain,active,reduced)
}
test('low mids gradually illuminate, high mids launch brief travelling streaks without sustain retriggers',()=>{
  const s=createContourLighting();tick(s,0)
  tick(s,1/60,.25,0);assert.ok(s.light>0&&s.light<.25);assert.equal(s.streak,0)
  for(let i=2;i<=180;i++)tick(s,i/60,.25,0)
  assert.ok(Math.abs(s.light-.25)<.0001)
  let peak=0,firstProgress=-1
  for(let i=181;i<=360;i++){tick(s,i/60,.25,.6);peak=Math.max(peak,s.streak);if(s.streak>0){assert.ok(s.progress>=firstProgress);firstProgress=s.progress}}
  assert.ok(peak>.5&&peak<=1);assert.equal(s.streak,0)
  for(let i=361;i<=480;i++){tick(s,i/60,.25,.6);assert.equal(s.streak,0)}
})
test('strengths are ordered, cadence stable, partial gain linear and high-only works without low mids',()=>{
  const peaks=[]
  for(const hz of [30,60,120]) {
    const row=[]
    for(const high of [.1,.3,.6,1]) {
      const full=createContourLighting(),half=createContourLighting();tick(full,0,0,0,1,true,false,hz);tick(half,0,0,0,.5,true,false,hz)
      let peak=0
      for(let i=1;i<=hz;i++){tick(full,i/hz,0,high,1,true,false,hz);tick(half,i/hz,0,high,.5,true,false,hz);peak=Math.max(peak,full.streak);assert.ok(Math.abs(half.streak-full.streak*.5)<1e-12);assert.equal(full.light,0)}
      row.push(peak)
    }
    for(let i=1;i<row.length;i++)assert.ok(row[i]>row[i-1]);peaks.push(row.at(-1)!)
  }
  assert.ok(Math.max(...peaks)/Math.min(...peaks)<1.1)
})
test('pause/stale/zero/reduced/session/profile priming cannot replay a streak',()=>{
  const s=createContourLighting();tick(s,0)
  for(let i=1;i<12;i++)tick(s,i/60,.5,.6)
  assert.ok(s.streak>0)
  tick(s,.2,.5,.6,0);assert.equal(s.light,0);assert.equal(s.streak,0)
  for(let i=13;i<=60;i++)tick(s,i/60,.5,.6,1,true,true)
  assert.equal(s.streak,0);assert.ok(s.light>0&&s.light<.5)
  tick(s,1.1,.5,.6,1,false);assert.equal(s.streak,0)
  tick(s,1.2,.5,.6,1,true,false,60,2);assert.equal(s.streak,0)
  for(let i=73;i<100;i++)tick(s,i/60,.5,.6,1,true,false,60,2)
  assert.equal(s.streak,0)
})
test('contour output ignores bass, overall intensity, broad onset events and treble',()=>{
  const stores=[createMusicFeatureStore(),createMusicFeatureStore()],pilots=[createMusicPilot(),createMusicPilot()]
  for(let i=0;i<240;i++) {
    const now=1+i/60,six=emptySixBands();six.lowMids=.3;six.highMids=i>30&&i<100?.5:0
    for(let b=0;b<2;b++) {
      stores[b].publish({session:1,updatedAtSeconds:now,status:'active',sampleRate:48000,fftSize:2048,
        energy:{low:b,mid:b,high:b,overall:b,six:{...six,bass:b,subBass:b,air:b,presence:b}},
        sequence:b?i:0,events:b?[{session:1,sequence:i,band:'mid',strength:1,timeSeconds:now,emittedAtSeconds:now}]:[],
        context:{intensity:b,brightness:b,brightnessValid:true,activity:b}})
      updateMusicPilot(pilots[b],stores[b].reader,'candidate',1/60,now,1,false)
    }
    assert.equal(pilots[0].contours.light,pilots[1].contours.light);assert.equal(pilots[0].contours.streak,pilots[1].contours.streak);assert.equal(pilots[0].contours.progress,pilots[1].contours.progress)
  }
})
test('authored vertex geometry/normals restored; logical streak phase matches chunk boundaries',()=>{
  assert.ok(!terrainVertex.includes('world.y +=')&&!terrainVertex.includes('deformation'))
  assert.ok(terrainVertex.includes('vNormal = normalize(mat3(modelMatrix) * normal)'))
  for(const index of [-100000,-1,0,1000000]) {
    const a=((contourOrigin(index)-48*.045)%1+1)%1,b=contourOrigin(index+1)
    assert.ok(Math.abs(a-b)<1e-9)
  }
  const emission=terrainFragment.slice(terrainFragment.indexOf('vec3 litContours'),terrainFragment.indexOf('// Full nightshade fade'))
  assert.ok(!emission.includes('activity')&&!emission.includes('musicHaze'))
})

test('changing Reactivity during an existing streak scales its current light',()=>{
  const s=createContourLighting();tick(s,0)
  for(let i=1;i<=8;i++)tick(s,i/60,0,.6)
  const full={...s},half={...s}
  tick(full,.15,0,.6,1);tick(half,.15,0,.6,.5)
  assert.ok(full.streak>0);assert.ok(Math.abs(half.streak-full.streak*.5)<1e-12)
})

test('VM02 illumination and peak emission remain proportional to input energy',()=>{
  let previous=0
  for(const level of [.1,.3,.6,1]) {
    const s=createContourLighting();tick(s,0)
    let peak=0
    for(let i=1;i<=180;i++){tick(s,i/60,level,level);peak=Math.max(peak,s.streak)}
    assert.ok(Math.abs(s.light-level)<.0001);assert.ok(Math.abs(peak-contourStreakDrive(level))<1e-10)
    assert.ok(peak>previous);previous=peak
  }
})

test('VP02 modest rises get readable ordered heads; travel outlasts the former950ms without sustained retrigger',()=>{
  assert.equal(contourStreakDrive(0),0);assert.equal(contourStreakDrive(1),1)
  assert.ok(contourStreakDrive(.1)>.4)
  const s=createContourLighting();tick(s,0)
  for(let i=1;i<=64;i++)tick(s,i/60,0,.2)
  assert.ok(s.streak>0);assert.ok(s.progress>0&&s.progress<1)
  const launch=s.lastLaunch
  for(let i=65;i<180;i++)tick(s,i/60,0,.2)
  assert.equal(s.lastLaunch,launch);assert.equal(s.streak,0);assert.equal(s.progress,1)
  assert.equal(CONTOUR_STREAK_SECONDS,1.25)
})

import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
// @ts-expect-error -- Stale since ec92ba0: water.ts no longer exports these, so this historical script fails to load.
import {sampleWater,createWaterGeometry} from '../src/scenes/bloom/water.ts'
const dir='docs/evidence/bloom/water-3d'
const manifest=JSON.parse(await readFile(dir+'-camera-study/current/source-manifest.json','utf8'))
const protectedFiles:any[]=[],changed:any[]=[]
for(const row of manifest){let hash:string|null=null;try{hash=createHash('sha256').update(await readFile(row.file)).digest('hex')}catch{};(hash===row.sha256?protectedFiles:changed).push(row.file)}
const measurements={protectedFiles,changed,geometry:{}}
for(const quality of ['standard','low']){
 const g=createWaterGeometry(quality),p=g.getAttribute('position');let min=Infinity,max=-Infinity,temporal=0,maxSlope=0
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=172-p.getY(i),values:any[]=[]
  for(let t=0;t<=6;t+=.25){const v=sampleWater(x,z,t);min=Math.min(min,v.height);max=Math.max(max,v.height);maxSlope=Math.max(maxSlope,Math.hypot(v.dx,v.dz));values.push(v.height)}
  temporal=Math.max(temporal,Math.max(...values)-Math.min(...values))
 }
 measurements.geometry[quality]={vertices:p.count,triangles:g.index.count/3,minimumHeight:min,maximumHeight:max,maxTemporalSpan:temporal,maxSlope,screenSpanAt90pxPerUnit:temporal*90}
 g.dispose()
}
await writeFile(dir+'/assessment.json',JSON.stringify(measurements,null,2));console.log(JSON.stringify({...measurements,protectedFiles:protectedFiles.length},null,2))

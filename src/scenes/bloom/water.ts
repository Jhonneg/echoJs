import { PlaneGeometry } from 'three'
import type { GraphicsQuality } from '../../engine/quality'
import { auroraFragment } from './aurora.ts'

export const WATER_VIEW = { distance: 512, pitch: Math.PI / 60, far: 572 } as const
export const WATER_BOUNDS = { width: 64, back: -8, front: 352 } as const
// [amplitude, x wave number, z wave number, temporal frequency, phase]
export const WATER_WAVES = [
  [.035, .85, .18, .6, 0], [.018, -1.13, .27, .8, 1.7],
  [.010, .46, .37, 1, 4.2], [.006, 1.74, -.42, 1.3, 2.8],
] as const
const smooth = (a: number, b: number, x: number) => { const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t) }

// Coherent C2 value noise; the integer hash is identical in JS and GLSL.
function hash(x:number,z:number){
  let h=(Math.imul(x,374761393)+Math.imul(z,668265263))>>>0
  h=Math.imul(h^(h>>>13),1274126177)>>>0
  return ((h^(h>>>16))>>>0)/4294967295*2-1
}
export function waterNoise(x:number,z:number){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz
  const u=fx*fx*fx*(fx*(fx*6-15)+10),v=fz*fz*fz*(fz*(fz*6-15)+10)
  const du=30*fx*fx*(fx-1)*(fx-1),dv=30*fz*fz*(fz-1)*(fz-1)
  const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1),cross=a-b-c+d
  return {height:a+(b-a)*u+(c-a)*v+cross*u*v,dx:((b-a)+cross*v)*du,dz:((c-a)+cross*u)*dv}
}

// CPU reference for verification only. Production evaluates this field on the GPU.
export function sampleWater(x: number, z: number, time: number, ringAge=3, ringStrength=0, anchorX=.6, waveStrength=1) {
  const q=Math.max(0,Math.min(1,z/6)),fade=q*q*(3-2*q),fadeZ=z>0&&z<6?q*(1-q):0
  const phase=.37*x+.19*z+.2*time,phaseB=-.23*x+.41*z-.3*time
  const warp=.7*Math.sin(phase)+.35*Math.sin(phaseB),wx=.259*Math.cos(phase)-.0805*Math.cos(phaseB),wz=.133*Math.cos(phase)+.1435*Math.cos(phaseB)
  let height=0,dx=0,dz=0
  for(const [a,kx,kz,w,p] of WATER_WAVES){
    const angle=kx*x+kz*z-w*time+p+warp,s=a*Math.sin(angle),d=a*Math.cos(angle)
    height+=s;dx+=d*(kx+wx);dz+=d*(kz+wz)
  }
  for(const [scale,amplitude,tx,tz] of [[1.1,.0035,.6*Math.cos(.2*time),.6*Math.sin(.2*time)],[2.3,.0015,.5*Math.sin(.3*time),.5*Math.cos(.3*time)]]){
    const n=waterNoise(x*scale+tx,z*scale+tz);height+=n.height*amplitude;dx+=n.dx*scale*amplitude;dz+=n.dz*scale*amplitude
  }
  dz=(dz*fade+height*fadeZ)*waveStrength;dx*=fade*waveStrength;height*=fade*waveStrength
  const px=x-anchorX,r=Math.hypot(px,z),offset=r-ringAge*1.575,width=.45
  const envelope=Math.exp(-offset*offset/(width*width)),osc=Math.sin(offset*8)
  const a=.022*Math.max(0,Math.min(1,ringStrength))*Math.exp(-ringAge*.45)*smooth(0,.10,ringAge)*(1-smooth(2.1,3,ringAge))
  const ring=a*osc*envelope,derivative=a*envelope*(8*Math.cos(offset*8)-2*offset/(width*width)*osc)
  height+=ring;dx+=derivative*px/Math.max(.0001,r);dz+=derivative*z/Math.max(.0001,r)
  return { height, dx, dz }
}

export function createWaterGeometry(quality: GraphicsQuality) {
  const geometry=new PlaneGeometry(WATER_BOUNDS.width,WATER_BOUNDS.front-WATER_BOUNDS.back,quality==='low'?96:128,quality==='low'?192:256)
  // Concentrate vertices around the monolith: ripple wavelength is ~0.79,
  // so uniform spacing over the grazing-view foreground would undersample it.
  const p=geometry.getAttribute('position'),depthSegments=quality==='low'?192:256
  const widthSegments=quality==='low'?96:128,nearSegments=quality==='low'?120:160
  const sideSegments=quality==='low'?18:24,centerSegments=widthSegments-2*sideSegments
  for(let row=0;row<=depthSegments;row++){
    const q=Math.max(0,(row-nearSegments)/(depthSegments-nearSegments))
    const z=row<=nearSegments?-8+20*row/nearSegments:12+340*Math.expm1(q*3)/Math.expm1(3)
    for(let col=0;col<=widthSegments;col++){
      const x=col<sideSegments?-5-27*Math.expm1((sideSegments-col)/sideSegments*2)/Math.expm1(2):col>sideSegments+centerSegments?5+27*Math.expm1((col-sideSegments-centerSegments)/sideSegments*2)/Math.expm1(2):-5+10*(col-sideSegments)/centerSegments
      const i=row*(widthSegments+1)+col
      p.setXY(i,x,(WATER_BOUNDS.front+WATER_BOUNDS.back)/2-z)
    }
  }
  geometry.computeBoundingSphere()
  geometry.computeBoundingBox();geometry.boundingBox!.min.z=-.1;geometry.boundingBox!.max.z=.1
  return geometry
}
const glsl=(v:number)=>Number.isInteger(v)?v.toFixed(1):String(v)
export const waterField = `
uniform float time;
uniform float ringAge;
uniform float ringStrength;
uniform float anchorX;
uniform float waveStrength;
float waterHash(ivec2 p){
  uint h=uint(p.x)*374761393u+uint(p.y)*668265263u;
  h=(h^(h>>13u))*1274126177u;
  return float(h^(h>>16u))/4294967295.0*2.0-1.0;
}
vec3 waterNoise(vec2 p){
  ivec2 i=ivec2(floor(p));vec2 f=fract(p);
  vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0),d=30.0*f*f*(f-1.0)*(f-1.0);
  float a=waterHash(i),b=waterHash(i+ivec2(1,0)),c=waterHash(i+ivec2(0,1)),e=waterHash(i+ivec2(1,1));
  float k=a-b-c+e;
  return vec3(a+(b-a)*u.x+(c-a)*u.y+k*u.x*u.y,((b-a)+k*u.y)*d.x,((c-a)+k*u.x)*d.y);
}
vec3 waterField(vec2 p){
  float q=clamp(p.y/6.0,0.0,1.0),fade=q*q*(3.0-2.0*q);
  float fadeZ=p.y>0.0&&p.y<6.0?q*(1.0-q):0.0;
  float phase=dot(p,vec2(.37,.19))+.2*time,phaseB=dot(p,vec2(-.23,.41))-.3*time;
  float warp=.7*sin(phase)+.35*sin(phaseB);
  vec2 warpGradient=vec2(.259,.133)*cos(phase)+vec2(-.0805,.1435)*cos(phaseB);
  vec3 field=vec3(0.0);
  ${WATER_WAVES.map(([a,x,z,w,phase])=>`{
    vec2 k=vec2(${glsl(x)},${glsl(z)});
    float angle=dot(p,k)-${glsl(w)}*time+${glsl(phase)}+warp;
    field+=vec3(${glsl(a)}*sin(angle),${glsl(a)}*cos(angle)*(k+warpGradient));
  }`).join('\n')}
  vec3 n1=waterNoise(p*1.1+.6*vec2(cos(.2*time),sin(.2*time)));
  vec3 n2=waterNoise(p*2.3+.5*vec2(sin(.3*time),cos(.3*time)));
  field+=n1*vec3(.0035,.00385,.00385)+n2*vec3(.0015,.00345,.00345);
  field=vec3(field.x*fade,field.y*fade,(field.z*fade+field.x*fadeZ))*waveStrength;
  vec2 delta=p-vec2(anchorX,0.0);float r=length(delta),offset=r-ringAge*1.575;
  float envelope=exp(-offset*offset/.2025),osc=sin(offset*8.0);
  float a=.022*clamp(ringStrength,0.0,1.0)*exp(-ringAge*.45)*smoothstep(0.0,.10,ringAge)*(1.0-smoothstep(2.1,3.0,ringAge));
  float derivative=a*envelope*(8.0*cos(offset*8.0)-2.0*offset/.2025*osc);
  field+=vec3(a*osc*envelope,derivative*delta/max(.0001,r));
  return field;
}`
export const waterVertex = `
uniform mat4 textureMatrix;
varying vec3 waterWorld;
varying vec4 waterReflection;
varying vec2 waterScreen;
${waterField}
void main(){
  vec3 p=position;vec4 world=modelMatrix*vec4(p,1.0);
  p.z+=waterField(world.xz).x;
  world=modelMatrix*vec4(p,1.0);waterWorld=world.xyz;
  waterReflection=textureMatrix*vec4(p,1.0);
  vec4 view=modelViewMatrix*vec4(p,1.0);waterScreen=view.xy;
  gl_Position=projectionMatrix*view;
}`
export const waterFragment = `
uniform sampler2D tDiffuse;
uniform vec2 reflectionTexel;
uniform vec3 viewDirection;
uniform vec3 keyColor;
uniform float keyStrength;
uniform vec3 midnight;
uniform vec3 indigo;
uniform vec3 lavender;
uniform vec3 rose;
uniform float atmosphere;
uniform float seamLevel;
uniform vec2 trailLights;
varying vec3 waterWorld;
varying vec4 waterReflection;
varying vec2 waterScreen;
${waterField}
${auroraFragment}
void main(){
  vec3 field=waterField(waterWorld.xz);
  vec3 n=normalize(vec3(-field.y,1.0,-field.z));
  vec3 v=normalize(viewDirection),ray=reflect(-v,n);
  float distance=max(0.0,waterWorld.z);
  vec3 base=mix(indigo,midnight,.25+.35*(1.0-exp(-distance/140.0)));
  vec2 uv=waterReflection.xy/waterReflection.w;
  // Small normal-dependent refraction of the single planar image, softened by
  // a bounded cross filter. No animated stripes or independently moving mask.
  uv+=vec2(n.x*.07,n.z*.16);
  vec4 reflected=texture2D(tDiffuse,uv)*.5;
  reflected+=texture2D(tDiffuse,uv+vec2(reflectionTexel.x,0.0))*.125;
  reflected+=texture2D(tDiffuse,uv-vec2(reflectionTexel.x,0.0))*.125;
  reflected+=texture2D(tDiffuse,uv+vec2(0.0,reflectionTexel.y))*.125;
  reflected+=texture2D(tDiffuse,uv-vec2(0.0,reflectionTexel.y))*.125;
  float fresnel=.04+.76*pow(1.0-max(dot(n,v),0.0),5.0);
  float skyDistance=clamp((waterWorld.z+12.0)/max(.15,-ray.z),0.0,250.0);
  vec2 skyPoint=vec2(waterWorld.x+ray.x*skyDistance,ray.y*skyDistance);
  vec3 environment=(auroraField(skyPoint)*.5+auroraField(skyPoint+vec2(.28,.35))*.25+auroraField(skyPoint-vec2(.28,.35))*.25)*.24;
  environment+=rose*.018*exp(-abs(skyPoint.y)*.8);
  vec3 color=base+environment*(.45+.55*fresnel);
  color=mix(color,reflected.rgb*.72/(1.0+reflected.rgb*.18),clamp(reflected.a*fresnel*.78,0.0,.85));
  vec3 lightDirection=normalize(vec3(-.02,.06,-1.0));
  float highlight=pow(max(dot(n,normalize(v+lightDirection)),0.0),96.0);
  color+=keyColor*highlight*min(keyStrength,5.0)*.028;
  float ringLight=abs(field.x)*ringStrength*exp(-ringAge*.5);
  color+=rose*ringLight*.32;
  vec2 shore=exp(-pow((vec2(waterWorld.x)-vec2(-2.45,3.0))/.35,vec2(2.0)));
  color+=(vec3(.80,.34,.52)*shore.x*trailLights.x+vec3(.34,.80,.70)*shore.y*trailLights.y)*.018*exp(-distance*.3);
  color+=rose*atmosphere*.018*exp(-distance/35.0);
  // The finite far shore blends into the authored horizon. It still writes
  // physical depth, so submerged mountain closures are occluded by the lake.
  float skyY=waterScreen.y;
  vec3 horizon=mix(lavender,midnight,smoothstep(0.0,5.5,skyY));
  horizon=mix(horizon,rose,exp(-abs(skyY)*1.1)*(.42+atmosphere*.12));
  horizon+=auroraField(waterScreen)*.65;
  color=mix(horizon,color,smoothstep(-8.0,4.0,waterWorld.z));
  gl_FragColor=vec4(color,1.0);
  #include <colorspace_fragment>
}`

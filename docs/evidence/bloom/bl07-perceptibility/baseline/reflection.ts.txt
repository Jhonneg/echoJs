import { Color, Matrix4, Vector3, type Camera } from 'three'
import { MONOLITH } from './monolith.ts'

// Same screen-space projection as the camera-neutral water card. Reuse actual
// source triangles, including bevels/groove/facets, rather than bounding boxes.
export const reflectionVertex = `
uniform mat4 sourceMatrix;
uniform vec3 sourceOffset;
uniform float reflectionTime;
varying vec2 reflectionUv;
varying vec3 stoneLocal;
varying vec3 stoneNormal;
varying float reflectionDepth;
void main(){
  reflectionUv=uv;stoneLocal=position;stoneNormal=normalize(mat3(sourceMatrix)*normal);
  vec4 source=viewMatrix*sourceMatrix*vec4(position+sourceOffset,1.0);
  reflectionDepth=(source.y+0.02)*0.82;
  float d=reflectionDepth;
  float wave=sin(d*47.0-reflectionTime*1.2)*0.018+sin(d*93.0+reflectionTime*0.9)*0.009;
  gl_Position=projectionMatrix*vec4(source.x+wave,-0.02-d,-21.98,1.0);
}`
export const reflectionFragment = `
uniform float reflectionTime;
uniform float beamLevel;
uniform float beamOnly;
uniform float reflectedAurora;
uniform vec3 reflectedColor;
varying vec2 reflectionUv;
varying vec3 stoneLocal;
varying vec3 stoneNormal;
varying float reflectionDepth;
void main(){
  if(reflectionDepth<0.0)discard;
  float fade=exp(-reflectionDepth*.26);
  float bands=.55+.45*pow(.5+.5*sin(reflectionDepth*95.0-reflectionTime*1.1),3.0);
  vec3 color=vec3(.035,.033,.050)+reflectedColor*reflectedAurora*.025;
  color+=vec3(.025,.018,.03)*max(0.0,stoneNormal.x);
  float alpha=.40*fade*(.55+.45*bands);
  if(beamOnly>.5){
    float x=(reflectionUv.x-.5)*2.0;
    float profile=exp(-x*x*5.6)+exp(-x*x*2.0)*.1;
    float ends=smoothstep(0.0,.045,reflectionUv.y)*(1.0-smoothstep(.955,1.0,reflectionUv.y));
    color=vec3(.92,.62,.80);alpha=profile*.70*beamLevel*fade*bands*ends;
  }else{
    float front=smoothstep(.27,.32,stoneLocal.z);
    color+=vec3(.15,.04,.08)*exp(-abs(stoneLocal.x+.24)*45.0/beamLevel)*front*beamLevel*.35;
  }
  gl_FragColor=vec4(color,alpha);
  #include <colorspace_fragment>
}`
export function createReflectionUniforms(beamOnly: boolean) {
  return { sourceMatrix:{value:new Matrix4()},sourceOffset:{value:new Vector3()},
    reflectionTime:{value:0},beamLevel:{value:1},beamOnly:{value:beamOnly?1:0},
    reflectedAurora:{value:.24},reflectedColor:{value:new Color('#9CD7C8')} }
}
// CPU reference for tests/diagnostics; matches the undistorted GPU vertex mapping.
export function reflectedVertex(target: Vector3, local: Vector3, world: Matrix4, camera: Camera) {
  target.copy(local).applyMatrix4(world).applyMatrix4(camera.matrixWorldInverse)
  target.y=MONOLITH.waterY-(target.y-MONOLITH.waterY)*MONOLITH.reflectionCompression
  return target
}

import { useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Matrix4, ShaderMaterial, Vector2, Vector3 } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import type { GraphicsQuality } from '../../engine/quality'
import { MONOLITH } from './monolith'
import { createWaterGeometry, WATER_BOUNDS, waterVertex, waterFragment } from './water'

export function WaterSurface({ quality, onMaterial }: { quality: GraphicsQuality, onMaterial: (material: ShaderMaterial | null) => void }) {
  const {scene,size}=useThree(),surface=useRef<Reflector | null>(null)
  useLayoutEffect(()=>{
    const geometry=createWaterGeometry(quality)
    const lake=new Reflector(geometry,{textureWidth:1,textureHeight:1,multisample:0,clipBias:.0001,shader:{
      name:'BloomWater3D',vertexShader:waterVertex,fragmentShader:waterFragment,
      uniforms:{color:{value:new Color()},tDiffuse:{value:null},textureMatrix:{value:new Matrix4()},
        reflectionTexel:{value:new Vector2(1,1)},viewDirection:{value:new Vector3(0,.05,1)},keyColor:{value:new Color('#F6D5EC')},keyStrength:{value:3},
        time:{value:0},ringAge:{value:3},ringStrength:{value:0},anchorX:{value:MONOLITH.x},waveStrength:{value:1},
        midnight:{value:new Color('#101322')},indigo:{value:new Color('#353451')},lavender:{value:new Color('#81769E')},rose:{value:new Color('#C69AB7')},
        atmosphere:{value:0},seamLevel:{value:1},trailLights:{value:new Vector2()},
        auroraTime:{value:0},auroraStrength:{value:.24},auroraColor:{value:new Color()},auroraExpansion:{value:0},auroraDetail:{value:0},auroraLayers:{value:quality==='low'?1:2}}
    }})
    lake.name='bloom-water-3d';lake.rotation.x=-Math.PI/2
    lake.position.set(0,MONOLITH.waterY,(WATER_BOUNDS.front+WATER_BOUNDS.back)/2)
    const renderReflection=lake.onBeforeRender
    lake.onBeforeRender=(...args)=>{
      const sky=scene.getObjectByName('bloom-sky'),visible=sky?.visible
      if(sky)sky.visible=false
      try { renderReflection.call(lake,...args) } finally { if(sky)sky.visible=visible! }
    }
    ;(lake.material as ShaderMaterial).toneMapped=false
    surface.current=lake;onMaterial(lake.material as ShaderMaterial);scene.add(lake)
    return()=>{onMaterial(null);surface.current=null;scene.remove(lake);lake.dispose();geometry.dispose()}
  },[scene,quality,onMaterial])
  useLayoutEffect(()=>{
    const lake=surface.current;if(!lake)return
    const cap=quality==='low'?512:1024,scale=Math.min(quality==='low'?.4:.65,cap/Math.max(size.width,size.height))
    const width=Math.max(128,Math.round(size.width*scale)),height=Math.max(128,Math.round(size.height*scale))
    lake.getRenderTarget().setSize(width,height)
    ;(lake.material as ShaderMaterial).uniforms.reflectionTexel.value.set(1/width,1/height)
  },[quality,size.width,size.height])
  return null
}

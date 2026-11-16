import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { PerformanceMeasurement } from '../engine/performance'

export function PerformanceProbe({ measurement, reactivity, reducedMotion }: {
  measurement: PerformanceMeasurement, reactivity: number, reducedMotion: boolean
}) {
  const { gl, size, viewport } = useThree()
  useEffect(() => {
    const context = gl.getContext()
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    measurement.setRenderEnvironment({
      width: size.width, height: size.height,
      renderDpr: gl.getPixelRatio(), deviceDpr: window.devicePixelRatio,
      renderer: String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER)),
      reactivity, reducedMotion,
    })
  }, [measurement, gl, size.width, size.height, viewport.dpr, reactivity, reducedMotion])
  useEffect(() => {
    const lost = () => measurement.invalidate('WebGL context was lost. Repeat after recovery.')
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost)
      measurement.invalidate('Scene was unmounted. Repeat the run.')
    }
  }, [gl, measurement])
  // Use actual frame timestamps, not Bloom's capped animation delta.
  useFrame(() => measurement.frame(performance.now()))
  return null
}

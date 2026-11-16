import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { PerformanceMeasurement } from '../engine/performance'
import type { GraphicsQuality } from '../engine/quality'

export function PerformanceProbe({ measurement, reactivity, reducedMotion, debugActive, quality }: {
  measurement: PerformanceMeasurement, reactivity: number, reducedMotion: boolean, debugActive: boolean, quality: GraphicsQuality
}) {
  const { gl, size, viewport } = useThree()
  useEffect(() => {
    const context = gl.getContext()
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    measurement.setRenderEnvironment({
      width: size.width, height: size.height,
      renderDpr: gl.getPixelRatio(), deviceDpr: window.devicePixelRatio,
      renderer: String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER)),
      reactivity, reducedMotion, quality,
    })
  }, [measurement, gl, size.width, size.height, viewport.dpr, reactivity, reducedMotion, quality])
  useEffect(() => {
    const lost = () => measurement.invalidate('WebGL context was lost. Repeat after recovery.')
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost)
      measurement.invalidate('Scene was unmounted. Repeat the run.')
    }
  }, [gl, measurement])
  // Use actual frame timestamps, not Bloom's capped animation delta.
  useFrame(() => {
    if (debugActive) measurement.invalidate('Reset visual debug before measuring performance.')
    else measurement.frame(performance.now())
  })
  return null
}

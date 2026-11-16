import type { GraphicsQuality } from './quality.ts'

export interface RenderEnvironment {
  width: number
  height: number
  renderDpr: number
  deviceDpr: number
  renderer: string
  reactivity: number
  reducedMotion: boolean
  quality: GraphicsQuality
}
export interface RunEnvironment {
  browser: string
  logicalCores: number
  build: 'production' | 'development'
  source: string
  sampleRate: number | null
  fftSize: number | null
}
export interface PerformanceResult {
  measuredAt: string
  environment: RunEnvironment & RenderEnvironment
  seconds: number
  frames: number
  fps: number
  meanFrameMs: number
  p50FrameMs: number
  p95FrameMs: number
  maxFrameMs: number
}
export function createPerformanceMeasurement() {
  let render: RenderEnvironment | null = null
  let environment: RunEnvironment | null = null
  let phase: 'idle' | 'warming' | 'measuring' | 'complete' | 'invalid' = 'idle'
  let reason = ''
  let result: PerformanceResult | null = null
  let started = 0
  let sampledStart = 0
  let last = 0
  let latest = 0
  let count = 0
  // Allocate once, never push/allocate in the recurring frame callback.
  const intervals = new Float64Array(32768)
  const active = () => phase === 'warming' || phase === 'measuring'
  function invalidate(message: string) {
    if (!active()) return
    phase = 'invalid'
    reason = message
    result = null
  }
  return {
    invalidate,
    setRenderEnvironment(next: RenderEnvironment) {
      if (render && JSON.stringify(render) !== JSON.stringify(next)) invalidate('Viewport or scene settings changed. Repeat the run.')
      render = next
    },
    start(next: RunEnvironment, now: number) {
      if (!render) return
      environment = { ...next }
      phase = 'warming'
      reason = ''
      result = null
      started = latest = now
      sampledStart = last = count = 0
    },
    frame(now: number) {
      if (!active()) return
      latest = now
      if (phase === 'warming') {
        if (now - started >= 5000) {
          phase = 'measuring'
          sampledStart = last = now
        }
        return
      }
      const interval = now - last
      if (interval <= 0) { invalidate('Non-increasing frame clock. Repeat the run.'); return }
      if (count === intervals.length) { invalidate('Frame buffer filled. Repeat the run.'); return }
      intervals[count++] = interval
      last = now
      if (now - sampledStart >= 30000 && render && environment) {
        const sorted = intervals.slice(0, count).sort()
        const seconds = (now - sampledStart) / 1000
        result = {
          measuredAt: new Date().toISOString(),
          environment: { ...environment, ...render },
          seconds, frames: count, fps: count / seconds,
          meanFrameMs: seconds * 1000 / count,
          p50FrameMs: sorted[Math.ceil(count * 0.5) - 1],
          p95FrameMs: sorted[Math.ceil(count * 0.95) - 1],
          maxFrameMs: sorted[count - 1],
        }
        phase = 'complete'
      }
    },
    get snapshot() {
      return { phase, reason, result, ready: render !== null, elapsedSeconds: Math.max(0, (latest - (phase === 'warming' ? started : sampledStart)) / 1000) }
    },
  }
}
export type PerformanceMeasurement = ReturnType<typeof createPerformanceMeasurement>

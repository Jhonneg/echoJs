import { bandLevel, bandMagnitude, binRange, emptyBands, resetSignal, silentSignal, smooth, type SignalTiming } from './signal'
import { updateSignalFeatures } from './features'
import { createSpectralFlux } from './flux'

export function createAnalysis() {
  const signal = silentSignal()
  const timing: SignalTiming = { renderAgeMs: null }
  const raw = emptyBands()
  const spectrum = new Float32Array(32)
  let context: AudioContext | undefined
  let source: AudioNode | undefined
  let analyser: AnalyserNode | undefined
  let frame = 0
  let message = 'Not active'
  let previous = 0
  let usingDefaultRate = false
  let flux: ReturnType<typeof createSpectralFlux> | undefined

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
    source?.disconnect()
    analyser?.disconnect()
    source = undefined
    analyser = undefined
    flux?.reset()
    flux = undefined
    const closing = context
    context = undefined
    if (closing && closing.state !== 'closed') void closing.close().catch(() => {})
    resetSignal(signal)
    timing.renderAgeMs = null
    spectrum.fill(0)
    message = 'Not active'
    usingDefaultRate = false
  }

  function resume() {
    const current = context
    if (!current || current.state === 'closed') return
    void current.resume().catch(() => {
      if (current === context) message = 'Audio context could not resume. Click Resume analysis or reconnect.'
    })
  }

  function prepare() {
    stop()
    try {
      try {
        context = new AudioContext({ sampleRate: 96000, latencyHint: 'interactive' })
      } catch (error) {
        if (!(error instanceof Error) || error.name !== 'NotSupportedError') throw error
        context = new AudioContext({ latencyHint: 'interactive' })
        usingDefaultRate = true
      }
      message = 'Waiting for shared audio'
      resume()
    } catch {
      message = 'Web Audio is unavailable. Reconnect in desktop Chrome.'
    }
  }

  function startInput(makeSource: (current: AudioContext) => AudioNode, element?: HTMLAudioElement) {
    if (!context) return false
    try {
      const current = context
      analyser = current.createAnalyser()
      // 96 kHz / 4096 retains the ~23 Hz bin spacing of 48 kHz / 2048.
      analyser.fftSize = current.sampleRate > 48000 ? 4096 : 2048
      analyser.smoothingTimeConstant = 0
      source = makeSource(current)
      source.connect(analyser)
      // Only local playback has an output route. Tab capture remains analysis-only.
      if (element) analyser.connect(current.destination)
      const bins = new Float32Array(analyser.frequencyBinCount)
      const bass = binRange(20, 250, current.sampleRate, analyser.fftSize)
      const mid = binRange(250, 4000, current.sampleRate, analyser.fftSize)
      const treble = binRange(4000, 20000, current.sampleRate, analyser.fftSize)
      flux = createSpectralFlux(bins.length, { bass, midrange: mid, treble })
      const bars = Array.from(spectrum, (_, i) => binRange(
        20 * (1000 ** (i / spectrum.length)),
        20 * (1000 ** ((i + 1) / spectrum.length)), current.sampleRate, analyser!.fftSize,
      ))
      previous = performance.now()
      let rateStart = previous
      let updates = 0
      function tick(now: number) {
        if (context !== current || !analyser) return
        const delta = (now - previous) / 1000
        previous = now
        const running = current.state === 'running'
        if (running && (!element || (!element.paused && !element.ended))) analyser.getFloatFrequencyData(bins)
        else bins.fill(-Infinity)
        raw.bass = bandMagnitude(bins, ...bass)
        raw.midrange = bandMagnitude(bins, ...mid)
        raw.treble = bandMagnitude(bins, ...treble)
        updateSignalFeatures(signal, raw, delta, now)
        flux?.update(bins, delta, running && (!element || (!element.paused && !element.ended)), signal.flux)
        updates++
        if (now - rateStart >= 1000) {
          signal.updateHz = updates * 1000 / (now - rateStart)
          updates = 0
          rateStart = now
        }
        const hasSignal = Math.max(signal.levels.bass, signal.levels.midrange, signal.levels.treble) > 0.001
        signal.isPlaying = running && (element ? !element.paused && !element.ended : hasSignal)
        bars.forEach(([low, high], i) => { spectrum[i] = smooth(spectrum[i], bandLevel(bins, low, high), delta) })
        message = !running ? 'Suspended — click Resume analysis' : element?.ended ? 'Playback ended' : element?.paused ? 'Playback paused' : hasSignal ? 'Receiving signal' : 'Connected, waiting / silent'
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
      return true
    } catch {
      stop()
      message = 'Analysis could not start. Disconnect and reconnect to retry.'
      return false
    }
  }

  function start(stream: MediaStream) {
    startInput((current) => current.createMediaStreamSource(stream))
  }

  function startElement(element: HTMLAudioElement) {
    return startInput((current) => current.createMediaElementSource(element), element)
  }

  return {
    recordRenderTime(now: number) {
      timing.renderAgeMs = signal.updatedAt > 0 ? Math.max(0, now - signal.updatedAt) : null
    },
    signal, timing, spectrum, prepare, start, startElement, stop, resume,
    get message() { return message },
    get format() {
      return { sampleRate: context?.sampleRate ?? null, fftSize: analyser?.fftSize ?? null, usingDefaultRate }
    },
  }
}

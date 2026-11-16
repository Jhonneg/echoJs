import { bandLevel, binRange, silentSignal, smooth } from './signal'

export function createAnalysis() {
  const signal = silentSignal()
  const spectrum = new Float32Array(32)
  let context: AudioContext | undefined
  let source: AudioNode | undefined
  let analyser: AnalyserNode | undefined
  let frame = 0
  let message = 'Not active'
  let previous = 0

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
    source?.disconnect()
    analyser?.disconnect()
    source = undefined
    analyser = undefined
    const closing = context
    context = undefined
    if (closing && closing.state !== 'closed') void closing.close().catch(() => {})
    Object.assign(signal, silentSignal())
    spectrum.fill(0)
    message = 'Not active'
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
      context = new AudioContext()
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
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0
      source = makeSource(current)
      source.connect(analyser)
      // Only local playback has an output route. Tab capture remains analysis-only.
      if (element) analyser.connect(current.destination)
      const bins = new Float32Array(analyser.frequencyBinCount)
      const bass = binRange(20, 250, current.sampleRate, analyser.fftSize)
      const mid = binRange(250, 4000, current.sampleRate, analyser.fftSize)
      const treble = binRange(4000, 20000, current.sampleRate, analyser.fftSize)
      const bars = Array.from(spectrum, (_, i) => binRange(
        20 * (1000 ** (i / spectrum.length)),
        20 * (1000 ** ((i + 1) / spectrum.length)), current.sampleRate, analyser!.fftSize,
      ))
      previous = performance.now()
      function tick(now: number) {
        if (context !== current || !analyser) return
        const delta = (now - previous) / 1000
        previous = now
        const running = current.state === 'running'
        if (running && (!element || (!element.paused && !element.ended))) analyser.getFloatFrequencyData(bins)
        else bins.fill(-Infinity)
        const b = bandLevel(bins, ...bass)
        const m = bandLevel(bins, ...mid)
        const t = bandLevel(bins, ...treble)
        signal.bass = smooth(signal.bass, b, delta)
        signal.midrange = smooth(signal.midrange, m, delta)
        signal.treble = smooth(signal.treble, t, delta)
        signal.intensity = smooth(signal.intensity, Math.max(b, m, t), delta, 0.2, 0.5)
        // Input activity only; never proof of audible source playback.
        const hasSignal = Math.max(b, m, t) > 0.001
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

  return { signal, spectrum, prepare, start, startElement, stop, resume, get message() { return message } }
}

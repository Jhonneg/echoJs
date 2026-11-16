export interface LocalFileState {
  status: 'empty' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'
  name: string
  message: string
}
interface LocalAnalysis {
  prepare(): void
  startElement(element: HTMLAudioElement): boolean
  resume(): void
  stop(): void
}

export function createLocalFile(onChange: (state: LocalFileState) => void, analysis: LocalAnalysis) {
  let element: HTMLAudioElement | undefined
  let url: string | undefined
  let attached = false
  let generation = 0
  let disposed = false
  let volume = 0.5
  let name = ''
  let removeListeners = () => {}

  function publish(status: LocalFileState['status'], message: string) {
    if (!disposed) onChange({ status, name, message })
  }
  function release() {
    generation++
    removeListeners()
    removeListeners = () => {}
    if (element) {
      element.pause()
      element.removeAttribute('src')
      element.load()
    }
    element = undefined
    attached = false
    analysis.stop()
    if (url) URL.revokeObjectURL(url)
    url = undefined
  }
  function clear() {
    release()
    name = ''
    publish('empty', 'Select a permitted local audio file. Nothing is uploaded.')
  }
  function select(file: File) {
    if (disposed) return
    release()
    name = file.name
    try {
      const current = new Audio()
      element = current
      current.preload = 'metadata'
      current.volume = volume
      url = URL.createObjectURL(file)
      const playing = () => publish('playing', 'Playing local audio')
      const paused = () => { if (!current.ended) publish('paused', 'Playback paused') }
      const ended = () => publish('ended', 'Playback ended. Play to restart.')
      const failed = () => {
        release()
        publish('error', 'This file could not be played. Select a browser-supported audio file, such as WAV or MP3.')
      }
      current.addEventListener('playing', playing)
      current.addEventListener('pause', paused)
      current.addEventListener('ended', ended)
      current.addEventListener('error', failed)
      removeListeners = () => {
        current.removeEventListener('playing', playing)
        current.removeEventListener('pause', paused)
        current.removeEventListener('ended', ended)
        current.removeEventListener('error', failed)
      }
      current.src = url
      publish('ready', 'File selected. Click Play to begin.')
    } catch {
      release()
      publish('error', 'Could not open this file. Select another file to retry.')
    }
  }
  async function play() {
    if (!element || disposed) return
    const current = element
    const request = generation
    if (!attached) {
      analysis.prepare()
      if (!analysis.startElement(current)) {
        release()
        publish('error', 'Audio analysis could not start. Select the file again to retry.')
        return
      }
      attached = true
    }
    analysis.resume()
    if (current.ended) current.currentTime = 0
    try {
      await current.play()
    } catch (error) {
      if (disposed || request !== generation) return
      // Keep the existing element/node for gesture-based retry; never create a second node.
      publish('paused', error instanceof Error && error.name === 'NotAllowedError'
        ? 'Playback was blocked. Click Play again to retry.' : 'Playback could not start. Retry Play or select another file.')
    }
  }
  return {
    select, play, clear,
    pause() { element?.pause() },
    setVolume(value: number) {
      volume = Math.max(0, Math.min(1, value))
      if (element) element.volume = volume
    },
    dispose() { disposed = true; release() },
  }
}

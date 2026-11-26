import type { AnalysisHealth, AudioStartResult } from './health.ts'

export interface LocalFileState {
  status: 'empty' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'
  name: string
  retryPlayback?: boolean
  message: string
}
interface LocalAnalysis {
  prepare(): AudioStartResult
  startElement(element: HTMLAudioElement): boolean
  resume(): void
  stop(): void
  readonly health?: AnalysisHealth
}

// Check that the browser can open a file before it replaces a working source.
// Uses a throwaway element that is never attached to analysis or played.
export function probeAudioFile(file: File, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    let url: string | undefined
    let probe: HTMLAudioElement | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (ok: boolean) => {
      if (timer === undefined) return
      clearTimeout(timer)
      timer = undefined
      probe?.removeEventListener('loadedmetadata', loaded)
      probe?.removeEventListener('error', failed)
      probe?.removeAttribute('src')
      probe?.load()
      if (url) URL.revokeObjectURL(url)
      resolve(ok)
    }
    const loaded = () => finish(true)
    const failed = () => finish(false)
    timer = setTimeout(failed, timeoutMs)
    try {
      probe = new Audio()
      probe.preload = 'metadata'
      probe.addEventListener('loadedmetadata', loaded)
      probe.addEventListener('error', failed)
      url = URL.createObjectURL(file)
      probe.src = url
    } catch { failed() }
  })
}

export function createLocalFile(onChange: (state: LocalFileState) => void, analysis: LocalAnalysis) {
  let element: HTMLAudioElement | undefined
  let url: string | undefined
  let attached = false
  let generation = 0
  let disposed = false
  let volume = 0.5
  let name = ''
  let selected: File | undefined
  let removeListeners = () => {}

  function publish(status: LocalFileState['status'], message: string, retryPlayback = false) {
    if (!disposed) onChange({ status, name, message, retryPlayback })
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
    selected = undefined
    publish('empty', 'Select a permitted local audio file. Nothing is uploaded.')
  }
  // `resume` restores a file that a failed source switch had to release.
  function select(file: File, resume?: { time: number, message: string }) {
    if (disposed) return
    release()
    name = file.name
    selected = file
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
        selected = undefined
        publish('error', 'This file could not be played. Select a browser-supported audio file, such as WAV or MP3.')
      }
      current.addEventListener('playing', playing)
      current.addEventListener('pause', paused)
      current.addEventListener('ended', ended)
      current.addEventListener('error', failed)
      const restore = () => {
        if (element === current && resume && Number.isFinite(resume.time)) current.currentTime = resume.time
      }
      if (resume) current.addEventListener('loadedmetadata', restore, { once: true })
      removeListeners = () => {
        current.removeEventListener('playing', playing)
        current.removeEventListener('pause', paused)
        current.removeEventListener('ended', ended)
        current.removeEventListener('error', failed)
        current.removeEventListener('loadedmetadata', restore)
      }
      current.src = url
      publish('ready', resume?.message ?? 'File selected. Click Play to begin.')
    } catch {
      release()
      selected = undefined
      publish('error', 'Could not open this file. Select another file to retry.')
    }
  }
  async function play() {
    if (!element || disposed) return
    const current = element
    const request = generation
    if (!attached) {
      const prepared = analysis.prepare()
      if (!prepared.ok) {
        release()
        publish('error', prepared.message)
        return
      }
      if (!analysis.startElement(current)) {
        const reason = analysis.health?.status === 'error' ? analysis.health.message : 'Audio analysis could not start. Select the file again to retry.'
        release()
        publish('error', reason)
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
        ? 'Playback was blocked. Click Play again to retry.' : 'Playback could not start. Retry Play or select another file.', true)
    }
  }
  return {
    select, play, clear,
    // The loaded file and position, so a source switch can put it back.
    snapshot() { return selected ? { file: selected, time: element?.currentTime ?? 0 } : null },
    pause() { element?.pause() },
    setVolume(value: number) {
      volume = Math.max(0, Math.min(1, value))
      if (element) element.volume = volume
    },
    dispose() { disposed = true; release() },
  }
}

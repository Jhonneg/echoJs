import type { AudioStartResult } from './health.ts'

export type CaptureStatus = 'disconnected' | 'connecting' | 'connected' | 'ended' | 'error' | 'unsupported'
export interface CaptureState {
  status: CaptureStatus
  audioTracks: number
  message: string
}

// How one connect() request ended, so callers can restore a source it replaced.
export type ConnectResult = { status: 'connected' | 'failed' | 'cancelled' | 'skipped', message: string }

interface AnalysisLifecycle {
  prepare(): AudioStartResult
  start(stream: MediaStream): AudioStartResult
  stop(): void
}

export function createTabCapture(onChange: (state: CaptureState) => void, analysis?: AnalysisLifecycle) {
  let generation = 0
  let stream: MediaStream | undefined
  let removeListeners = () => {}
  let disposed = false
  let pending = false

  function publish(status: CaptureStatus, message: string) {
    if (!disposed) onChange({ status, audioTracks: stream?.getAudioTracks().length ?? 0, message })
  }
  function fail(status: CaptureStatus, message: string): ConnectResult {
    publish(status, message)
    return { status: 'failed', message }
  }
  const cancelled: ConnectResult = { status: 'cancelled', message: 'Tab sharing was cancelled.' }

  function release() {
    analysis?.stop()
    removeListeners()
    removeListeners = () => {}
    stream?.getTracks().forEach((track) => track.stop())
    stream = undefined
  }

  function disconnect() {
    generation++
    pending = false
    release()
    publish('disconnected', 'Disconnected. All acquired tracks stopped.')
  }

  async function connect(): Promise<ConnectResult> {
    if (disposed || pending || stream) return { status: 'skipped', message: '' }
    if (!globalThis.isSecureContext)
      return fail('unsupported', 'Tab sharing needs a secure page. Open ECHO over HTTPS (or localhost), or open a local audio file.')
    // Phones and some browsers have no tab sharing at all.
    if (!navigator.mediaDevices?.getDisplayMedia)
      return fail('unsupported', 'This browser can’t share tab audio. Open a local audio file instead, or use desktop Chrome or Edge.')
    const request = ++generation
    pending = true
    publish('connecting', 'Choose a browser tab and enable Share tab audio. The native picker also requests video.')
    try {
      const prepared = analysis?.prepare()
      if (analysis && prepared?.ok !== true) {
        pending = false
        const message = prepared?.ok === false ? prepared.message : 'Audio preparation did not complete. Retry sharing.'
        release()
        return fail('error', message)
      }
      // Keep this call before any await to preserve the button's user activation.
      const acquired = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      if (disposed || request !== generation) {
        acquired.getTracks().forEach((track) => track.stop())
        return cancelled
      }
      pending = false
      stream = acquired
      if (acquired.getAudioTracks().length === 0) {
        release()
        return fail('error', 'No audio track received. Retry, select a browser tab, and enable Share tab audio.')
      }
      const endedMessage = 'Browser sharing ended. Connect again to choose a tab.'
      const ended = () => {
        generation++
        release()
        publish('ended', endedMessage)
      }
      acquired.getTracks().forEach((track) => track.addEventListener('ended', ended))
      removeListeners = () => acquired.getTracks().forEach((track) => track.removeEventListener('ended', ended))
      if (acquired.getTracks().some((track) => track.readyState === 'ended')) {
        ended()
        return { status: 'failed', message: endedMessage }
      }
      const started = analysis?.start(acquired)
      if (analysis && started?.ok !== true) {
        const message = started?.ok === false ? started.message : 'Audio analysis did not start. Retry sharing.'
        release()
        return fail('error', message)
      }
      const message = 'Audio track present. Keep playback in the source tab.'
      publish('connected', message)
      return { status: 'connected', message }
    } catch (error) {
      if (disposed || request !== generation) return cancelled
      pending = false
      release()
      const name = error instanceof Error ? error.name : 'UnknownError'
      const messages: Record<string, string> = {
        NotAllowedError: 'Sharing was cancelled or denied, or blocked by browser policy. You can retry.',
        InvalidStateError: 'Focus this page and click Connect again to open the picker.',
        NotFoundError: 'No sharing source is available. Open a permitted audio tab and retry.',
        NotReadableError: 'The browser or operating system could not share that source. Check sharing permissions and retry.',
        AbortError: 'Sharing could not start. Try again.',
      }
      return fail('error', messages[name] ?? `Sharing failed (${name}). Try desktop Chrome and reconnect.`)
    }
  }

  return {
    connect,
    disconnect,
    dispose() {
      disposed = true
      disconnect()
    },
  }
}

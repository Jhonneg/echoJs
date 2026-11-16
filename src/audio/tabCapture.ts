export type CaptureStatus = 'disconnected' | 'connecting' | 'connected' | 'ended' | 'error' | 'unsupported'
export interface CaptureState {
  status: CaptureStatus
  audioTracks: number
  message: string
}

interface AnalysisLifecycle {
  prepare(): void
  start(stream: MediaStream): void
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

  async function connect() {
    if (disposed || pending || stream) return
    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getDisplayMedia) {
      publish('unsupported', 'Tab sharing is unavailable. Use desktop Chrome on localhost or HTTPS.')
      return
    }
    const request = ++generation
    pending = true
    publish('connecting', 'Choose a browser tab and enable Share tab audio. The native picker also requests video.')
    try {
      analysis?.prepare()
      // Keep this call before any await to preserve the button's user activation.
      const acquired = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      if (disposed || request !== generation) {
        acquired.getTracks().forEach((track) => track.stop())
        return
      }
      pending = false
      stream = acquired
      if (acquired.getAudioTracks().length === 0) {
        release()
        publish('error', 'No audio track received. Retry, select a browser tab, and enable Share tab audio.')
        return
      }
      const ended = () => {
        generation++
        release()
        publish('ended', 'Browser sharing ended. Connect again to choose a tab.')
      }
      acquired.getTracks().forEach((track) => track.addEventListener('ended', ended))
      removeListeners = () => acquired.getTracks().forEach((track) => track.removeEventListener('ended', ended))
      if (acquired.getTracks().some((track) => track.readyState === 'ended')) {
        ended()
        return
      }
      analysis?.start(acquired)
      publish('connected', 'Audio track present. Keep playback in the source tab.')
    } catch (error) {
      if (disposed || request !== generation) return
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
      publish('error', messages[name] ?? `Sharing failed (${name}). Try desktop Chrome and reconnect.`)
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

import type { AudioStartResult } from '../../audio/health.ts'
import { createLocalFile } from '../../audio/localFile.ts'
import { createTabCapture, type CaptureStatus } from '../../audio/tabCapture.ts'

interface LabAnalysis {
  prepare(): AudioStartResult
  start(stream: MediaStream): AudioStartResult
  startElement(element: HTMLAudioElement): boolean
  resume(): void
  stop(): void
}
export interface LabSourceState {
  mode: 'idle' | 'fixture' | 'file' | 'tab'
  captureStatus: CaptureStatus
  message: string
}
// Own only source selection. Permission handling/routing remain in the existing adapters.
export function createLabSources(analysis: LabAnalysis, onChange: (state: LabSourceState) => void) {
  let state: LabSourceState = { mode: 'idle', captureStatus: 'disconnected', message: 'Ready' }
  const publish = () => onChange({ ...state })
  const local = createLocalFile(value => {
    if (state.mode !== 'fixture' && state.mode !== 'file') return
    state.message = value.message
    if (state.mode === 'file' && value.status === 'error') state.mode = 'idle'
    publish()
  }, analysis)
  const capture = createTabCapture(value => {
    if (state.mode !== 'tab') return
    state.captureStatus = value.status
    state.message = value.message
    if (value.status !== 'connecting' && value.status !== 'connected') state.mode = 'idle'
    publish()
  }, analysis)
  local.setVolume(0.25)

  function stop() {
    const pending = state.captureStatus === 'connecting'
    // Ignore cleanup callbacks from the source being replaced.
    state = { mode: 'idle', captureStatus: 'disconnected', message: pending
      ? 'Sharing cancelled here. Close the native picker too if it is still open.' : 'Stopped. Diagnostic view reset; acquired tracks released.' }
    capture.disconnect()
    local.clear()
    publish()
  }
  return {
    stop,
    share() {
      if (state.mode === 'tab') return Promise.resolve()
      stop()
      state.mode = 'tab'
      // No await before connect: retain the Share button's native user activation.
      return capture.connect()
    },
    play(file: File) {
      stop()
      state.mode = 'fixture'
      local.select(file)
      return local.play()
    },
    selectFile(file: File) {
      stop()
      state.mode = 'file'
      local.select(file)
    },
    playFile() { return state.mode === 'file' ? local.play() : Promise.resolve() },
    pause() { if (state.mode === 'fixture' || state.mode === 'file') local.pause() },
    resume() { if (state.mode === 'tab') analysis.resume() },
    setVolume(value: number) { local.setVolume(value) },
    dispose() {
      state.mode = 'idle'
      capture.dispose()
      local.dispose()
    },
  }
}

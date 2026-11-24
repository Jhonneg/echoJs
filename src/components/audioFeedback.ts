import type { AnalysisHealth } from '../audio/health.ts'
import type { CaptureState } from '../audio/tabCapture.ts'
import type { LocalFileState } from '../audio/localFile.ts'

export interface AudioFeedback {
  text: string
  tone: 'neutral' | 'error'
  action: 'resume' | 'retry-tab' | 'reconnect-tab' | 'choose-file' | 'cancel' | 'play' | null
}
// Presentation only: transport, capture and analysis retain separate owners.
export function audioFeedback(source: 'tab' | 'file', capture: CaptureState, local: LocalFileState,
  health: AnalysisHealth, receiving: boolean): AudioFeedback {
  if (source === 'file') {
    if (local.status === 'error') return { text: local.message, tone: 'error', action: 'choose-file' }
    if (local.status !== 'playing') return {
      text: local.status === 'empty' ? 'Choose a shared tab or a local audio file.' : local.message,
      tone: local.retryPlayback ? 'error' : 'neutral', action: local.retryPlayback ? 'play' : null,
    }
  } else {
    if (capture.status === 'connecting') return { text: 'Choose a browser tab and enable Share tab audio.', tone: 'neutral', action: 'cancel' }
    if (capture.status === 'unsupported') return { text: capture.message, tone: 'error', action: 'choose-file' }
    if (capture.status === 'error') return { text: capture.message, tone: 'error', action: 'retry-tab' }
    if (capture.status === 'ended') return { text: capture.message, tone: 'neutral', action: 'retry-tab' }
    if (capture.status === 'disconnected') return { text: 'Choose a shared tab or a local audio file.', tone: 'neutral', action: null }
  }
  if (health.status === 'error' || health.status === 'idle') return {
    text: health.status === 'error' ? health.message : 'Audio analysis stopped. Reconnect or select the file again.',
    tone: 'error', action: source === 'tab' ? 'reconnect-tab' : 'choose-file',
  }
  if (health.status === 'suspended') return { text: health.message, tone: 'error', action: 'resume' }
  if (health.status === 'starting') return { text: health.message, tone: 'neutral', action: null }
  return { text: source === 'file' ? 'Playing local audio.' : receiving ? 'Listening to your shared tab.' : 'Tab connected · waiting for sound.', tone: 'neutral', action: null }
}

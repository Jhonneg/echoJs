import { Component, useEffect, useState, type ReactNode } from 'react'

// How long a lost WebGL context may try to restore itself before Restart is offered.
export const RESTART_AFTER_MS = 4000

type Props = {
  // Landscape being loaded or that failed to load, if any.
  pending: { name: string, status: 'loading' | 'error' } | null
  graphicsLost: boolean
  // Changes on every new loss, restarting the wait before Restart is offered.
  lossEpisode: number
  sceneName: string
  onRetryLoad(): void
  onDismissLoad(): void
  onRestart(): void
}

function useStuck(active: boolean, episode: number) {
  const [stuckEpisode, setStuckEpisode] = useState(-1)
  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => setStuckEpisode(episode), RESTART_AFTER_MS)
    return () => clearTimeout(timer)
  }, [active, episode])
  return active && stuckEpisode === episode
}

// Landscape-level status, separate from audio status. Routine progress is announced
// politely and failures immediately; both regions stay mounted so changes are read.
export function SceneStatus(props: Props) {
  const stuck = useStuck(props.graphicsLost, props.lossEpisode)
  let text = '', tone: 'neutral' | 'error' = 'neutral', action: ReactNode = null
  if (props.pending?.status === 'error') {
    text = `${props.pending.name} couldn’t load. Check your connection and retry; audio keeps playing.`
    tone = 'error'
    action = <>
      <button onClick={props.onRetryLoad}>Retry</button>
      <button onClick={props.onDismissLoad}>Stay on {props.sceneName}</button>
    </>
  } else if (props.pending) {
    text = `Loading ${props.pending.name}…`
  } else if (props.graphicsLost && stuck) {
    text = `${props.sceneName} graphics didn’t come back. Restart the landscape; audio keeps playing.`
    tone = 'error'
    action = <button onClick={props.onRestart}>Restart landscape</button>
  } else if (props.graphicsLost) {
    text = 'Graphics were interrupted — restoring…'
  }
  return <>
    <p className="sr-only" role="status" aria-atomic="true">{tone === 'error' ? '' : text}</p>
    <p className="sr-only" role="alert" aria-atomic="true">{tone === 'error' ? text : ''}</p>
    {text && <div className="scene-status" data-tone={tone}>
      <p>{text}</p>
      {action}
    </div>}
  </>
}

// Catches a landscape that throws outside its own canvas boundary. Remounting with a new
// key (Restart) clears it; audio and the analysis reader live above it and are unaffected.
export class LandscapeBoundary extends Component<{ name: string, onRestart(): void, children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div className="scene-status scene-status-centered" data-tone="error" role="alert">
      <p>{this.props.name} stopped displaying. Restart it or choose another landscape; audio keeps playing.</p>
      <button onClick={this.props.onRestart}>Restart landscape</button>
    </div>
  }
}

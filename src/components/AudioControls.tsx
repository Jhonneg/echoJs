import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { createAnalysis } from '../audio/analysis'
import type { CaptureState } from '../audio/tabCapture'
import type { LocalFileState } from '../audio/localFile'
import type { GraphicsQuality } from '../engine/quality'

type Props = {
  source: 'tab' | 'file'
  capture: CaptureState
  local: LocalFileState
  analysis: ReturnType<typeof createAnalysis>
  reactivity: number
  volume: number
  fullscreenControl: ReactNode
  quality: GraphicsQuality
  onQuality(value: GraphicsQuality): void
  onShare(): void
  onFile(file: File): void
  onDisconnect(): void
  onPlay(): void
  onPause(): void
  onVolume(value: number): void
  onReactivity(value: number): void
}

export function AudioControls(props: Props) {
  const { source, capture, local, analysis } = props
  const chooser = useRef<HTMLDetailsElement>(null)
  const trigger = useRef<HTMLElement>(null)
  useEffect(() => {
    const close = () => {
      if (!chooser.current?.open) return
      chooser.current.open = false
      trigger.current?.focus({ preventScroll: true })
    }
    const outside = (event: PointerEvent) => {
      const panel = chooser.current
      if (panel?.open && event.target instanceof Node && !panel.contains(event.target)) close()
    }
    const escape = (event: KeyboardEvent) => {
      // Leave the browser's native fullscreen Escape behavior intact.
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  const shareButton = useRef<HTMLButtonElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef<'tab' | 'file' | null>(null)
  // Sample status only; hot signal values remain outside React state.
  const [activity, setActivity] = useState({ playing: false, suspended: false })
  useEffect(() => {
    const timer = window.setInterval(() => setActivity((previous) => {
      const playing = analysis.signal.isPlaying
      const suspended = analysis.message.startsWith('Suspended') || analysis.message.startsWith('Audio context could not resume')
      return previous.playing === playing && previous.suspended === suspended ? previous : { playing, suspended }
    }), 500)
    return () => clearInterval(timer)
  }, [analysis])

  const sharing = source === 'tab' && (capture.status === 'connecting' || capture.status === 'connected')
  const canDisconnect = source === 'file' ? local.status !== 'empty' : sharing
  useEffect(() => {
    // Cancel/Disconnect disables its own button. Move focus only after that
    // explicit action, once the next source control is enabled by the commit.
    if (canDisconnect || restoreFocus.current === null) return
    const next = restoreFocus.current === 'file' ? fileInput.current : shareButton.current
    restoreFocus.current = null
    next?.focus()
  }, [canDisconnect])
  const hasFile = source === 'file' && local.status !== 'empty'
  const canPlay = hasFile && local.status !== 'error' && local.status !== 'playing'
  const playing = hasFile && local.status === 'playing'
  const connected = source === 'file' ? playing : capture.status === 'connected'
  const suspended = connected && activity.suspended
  const title = source === 'file' && local.status !== 'empty' ? 'Local audio'
    : capture.status === 'connecting' ? 'Choose a browser tab'
      : source === 'tab' && capture.status === 'connected' ? 'Shared tab' : 'Choose your audio'
  const status = suspended ? 'Audio is suspended by the browser. Resume to continue.'
    : source === 'file' ? local.status === 'empty' ? 'Choose a shared tab or a local audio file.' : local.message
      : capture.status === 'connected' ? activity.playing ? 'Listening to your shared tab.' : 'Tab connected · waiting for sound.'
        : capture.status === 'disconnected' ? 'Choose a shared tab or a local audio file.' : capture.message

  return (
    <details ref={chooser} className="audio-chooser">
      <summary ref={trigger} className="chooser-trigger" aria-label="Bloom — audio and scene controls" title="Open audio and scene controls">
        Bloom
        <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
      </summary>
      <section id="audio-controls" className="audio-controls" aria-labelledby="source-heading">
        <div className="chooser-header">
          <h2 id="source-heading">{title}</h2>
          <button className="chooser-close" aria-label="Close audio controls" onClick={() => {
            if (chooser.current) chooser.current.open = false
            trigger.current?.focus()
          }}>×</button>
        </div>
        {hasFile && <p className="file-name" title={local.name}>{local.name}</p>}
        <p className="source-status" role="status" aria-atomic="true">{status}</p>
        <div className="source-actions">
          <button ref={shareButton} className="primary-button" disabled={sharing} onClick={props.onShare}>Share a tab</button>
          <label className="file-button">Open audio file
            <input ref={fileInput} type="file" accept="audio/*" aria-label="Open audio file" onChange={(event) => {
              const selected = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (selected) props.onFile(selected)
            }} />
          </label>
        </div>
        {hasFile && <div className="local-playback" role="group" aria-label="Local playback">
          <button disabled={!playing && !canPlay} onClick={playing ? props.onPause : props.onPlay}>{playing ? 'Pause' : local.status === 'ended' ? 'Replay' : 'Play'}</button>
          <label className="slider-control">Volume
            <input type="range" min="0" max="1" step="0.01" value={props.volume} onChange={(event) => props.onVolume(Number(event.currentTarget.value))} />
            <output>{Math.round(props.volume * 100)}%</output>
          </label>
        </div>}
        {suspended && <button onClick={analysis.resume}>Resume audio</button>}
        {source === 'tab' && capture.status === 'connecting' && <p className="source-help">Choose a tab and enable Share tab audio. Cancel here ends ECHO’s request; close the browser picker too.</p>}
        {canDisconnect && <button className="disconnect-button" onClick={() => {
          restoreFocus.current = source
          props.onDisconnect()
        }}>{capture.status === 'connecting' && source === 'tab' ? 'Cancel sharing' : 'Disconnect'}</button>}
        <div className="experience-settings">
          <label className="slider-control">Reactivity
            <input type="range" min="0" max="1" step="0.01" value={props.reactivity} onChange={(event) => props.onReactivity(Number(event.currentTarget.value))} />
            <output>{Math.round(props.reactivity * 100)}%</output>
          </label>
          <div className="quality-control">
            <label htmlFor="graphics-quality">Graphics quality</label>
            <select id="graphics-quality" value={props.quality} onChange={(event) => props.onQuality(event.currentTarget.value as GraphicsQuality)}>
              <option value="standard">Standard</option>
              <option value="low">Low</option>
            </select>
          </div>
          {props.fullscreenControl}
        </div>
        <p className="privacy-note">Audio stays on your device. Nothing is recorded or uploaded. Close this panel to enjoy the scene; Disconnect ends the source.</p>
      </section>
    </details>
  )
}

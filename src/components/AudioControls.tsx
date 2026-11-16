import { useEffect, useState, type ReactNode } from 'react'
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
    <section id="audio-controls" className="audio-controls" aria-labelledby="source-heading" tabIndex={-1}>
      <div className="source-summary">
        <p className="eyebrow">YOUR SOUND / BLOOM</p>
        <h2 id="source-heading">{title}</h2>
        {hasFile && <p className="file-name" title={local.name}>{local.name}</p>}
        <p className="source-status" role="status" aria-atomic="true">{status}</p>
      </div>
      <div className="source-actions">
        <div className="controls">
          <button className="primary-button" disabled={sharing} onClick={props.onShare}>Share a tab</button>
          <label className="file-button">Open audio file
            <input type="file" accept="audio/*" aria-label="Open audio file" onChange={(event) => {
              const selected = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (selected) props.onFile(selected)
            }} />
          </label>
          <button disabled={!canDisconnect} onClick={props.onDisconnect}>{capture.status === 'connecting' && source === 'tab' ? 'Cancel sharing' : 'Disconnect'}</button>
        </div>
        {hasFile && <div className="controls local-playback" role="group" aria-label="Local playback">
          <button disabled={playing ? false : !canPlay} onClick={playing ? props.onPause : props.onPlay}>{playing ? 'Pause' : local.status === 'ended' ? 'Replay' : 'Play'}</button>
          <label className="slider-control">Volume
            <input type="range" min="0" max="1" step="0.01" value={props.volume} onChange={(event) => props.onVolume(Number(event.currentTarget.value))} />
            <output>{Math.round(props.volume * 100)}%</output>
          </label>
        </div>}
        {suspended && <button onClick={analysis.resume}>Resume audio</button>}
        {source === 'tab' && capture.status === 'connecting' && <p className="source-help">Enable Share tab audio in the browser picker. Cancel here ends ECHO’s request; close the picker too.</p>}
      </div>
      <div className="experience-settings">
        <label className="slider-control">Reactivity
          <input type="range" min="0" max="1" step="0.01" value={props.reactivity} onChange={(event) => props.onReactivity(Number(event.currentTarget.value))} />
          <output>{Math.round(props.reactivity * 100)}%</output>
        </label>
        <div className="quality-control">
          <label htmlFor="graphics-quality">Graphics quality</label>
          <select id="graphics-quality" value={props.quality} onChange={(event) => props.onQuality(event.currentTarget.value as GraphicsQuality)} aria-describedby="quality-help">
            <option value="standard">Standard</option>
            <option value="low">Low</option>
          </select>
          <span id="quality-help">Low trades sharpness for fewer rendered pixels.</span>
        </div>
        {props.fullscreenControl}
        <a href="#audio-tools" onClick={() => { const tools = document.querySelector<HTMLDetailsElement>('#audio-tools'); if (tools) tools.open = true }}>Diagnostics &amp; tools</a>
      </div>
      <p className="privacy-note">Tabs keep their own playback. Local files play here. Audio stays on your device; nothing is recorded or uploaded.</p>
    </section>
  )
}

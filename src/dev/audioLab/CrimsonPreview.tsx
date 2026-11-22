import { useState } from 'react'
import type { AudioSignal } from '../../audio/signal'
import type { MusicFeatureReader } from '../../audio/musicFeatures'
import type { GraphicsQuality } from '../../engine/quality'
import CrimsonHorizonScene from '../../scenes/crimson-horizon/CrimsonHorizonScene'
import type { CrimsonProfile } from '../../scenes/crimson-horizon/musicPilot'

export default function CrimsonPreview({ signal, reader }: { signal: AudioSignal; reader: MusicFeatureReader }) {
  const [profile, setProfile] = useState<CrimsonProfile>('legacy')
  const [quality, setQuality] = useState<GraphicsQuality>('standard')
  const [reactivity, setReactivity] = useState(1)
  return <>
    <div className="crimson-preview-controls">
      <label>Crimson response <select id="crimson-profile" value={profile} onChange={event => setProfile(event.target.value as CrimsonProfile)}>
        <option value="legacy">Legacy</option><option value="candidate">Candidate · Music Intelligence</option>
      </select></label>
      <label>Quality <select id="crimson-quality" value={quality} onChange={event => setQuality(event.target.value as GraphicsQuality)}>
        <option value="standard">Standard</option><option value="low">Low</option>
      </select></label>
      <label>Reactivity <input id="crimson-reactivity" type="range" min="0" max="1" step="0.01" value={reactivity} onChange={event => setReactivity(Number(event.target.value))} /></label>
    </div>
    <div id="crimson-viewport"><CrimsonHorizonScene signal={signal} reactivity={reactivity} quality={quality} pilot={{ reader, profile }} /></div>
  </>
}

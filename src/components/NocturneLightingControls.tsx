import { NOCTURNE_ALL_OFF, NOCTURNE_ALL_ON, type NocturneLighting, type NocturneLightingMode } from '../scenes/nocturne/lighting'

export function NocturneLightingControls({ lighting, onChange, mode, onMode }: { lighting: NocturneLighting, onChange(value: NocturneLighting): void, mode: NocturneLightingMode, onMode(value: NocturneLightingMode): void }) {
  return <fieldset className="nocturne-lighting-controls">
    <legend>Nocturne lighting</legend>
    <label className="quality-control" htmlFor="nocturne-lighting-mode">Lighting mode
      <select id="nocturne-lighting-mode" value={mode} onChange={event => onMode(event.currentTarget.value as NocturneLightingMode)}>
        <option value="audio">Audio</option><option value="manual">Manual preview</option>
      </select>
    </label>
    <p className="source-help">{mode === 'audio' ? 'Lights follow the music with quick, smooth transitions. The distant gate and haze follow overall intensity.' : 'Isolate each group independently of audio. Manual values are kept when switching modes.'}</p>
    {mode === 'manual' && <>
    {(['magenta', 'cyan', 'violet'] as const).map(group => <label key={group} className="slider-control">
      {{ magenta: 'Magenta · fixtures and bridge', cyan: 'Cyan · windows and panels', violet: 'Violet · strips and accents' }[group]}
      <input id={`nocturne-${group}`} type="range" min="0" max="1" step="0.01" value={lighting[group]}
        onChange={event => onChange({ ...lighting, [group]: Number(event.currentTarget.value) })} />
      <output htmlFor={`nocturne-${group}`}>{Math.round(lighting[group] * 100)}%</output>
    </label>)}
    <div className="nocturne-lighting-presets">
      <button type="button" onClick={() => onChange(NOCTURNE_ALL_OFF)}>All off</button>
      <button type="button" onClick={() => onChange(NOCTURNE_ALL_ON)}>All on</button>
    </div>
    </>}
  </fieldset>
}

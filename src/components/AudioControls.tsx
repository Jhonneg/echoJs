import { NocturneLightingControls } from "./NocturneLightingControls";
import type {
  NocturneLighting,
  NocturneLightingMode,
} from "../scenes/nocturne/lighting";
import { useEffect, useRef, useState } from "react";
import type { createAnalysis } from "../audio/analysis";
import type { CaptureState } from "../audio/tabCapture";
import type { LocalFileState } from "../audio/localFile";
import type { GraphicsQuality } from "../engine/quality";
import { sceneNames, type SceneId } from "../scenes/scene";
import { musicFeaturesFresh } from "../audio/musicFeatures";
import { audioFeedback, type SwitchNotice } from "./audioFeedback";

type Props = {
  bloomFloating: boolean;
  onBloomFloating(value: boolean): void;
  nocturneLightingMode: NocturneLightingMode;
  onNocturneLightingMode(value: NocturneLightingMode): void;
  nocturneLighting: NocturneLighting;
  onNocturneLighting(value: NocturneLighting): void;
  source: "tab" | "file";
  capture: CaptureState;
  local: LocalFileState;
  analysis: ReturnType<typeof createAnalysis>;
  volume: number;
  notice: SwitchNotice | null;
  quality: GraphicsQuality;
  scene: SceneId;
  onScene(value: SceneId): void;
  onQuality(value: GraphicsQuality): void;
  onShare(): void;
  onFile(file: File): void;
  onDisconnect(): void;
  onPlay(): void;
  onPause(): void;
  onVolume(value: number): void;
};

export function AudioControls(props: Props) {
  const { source, capture, local, analysis } = props;
  const controls = useRef<HTMLDivElement>(null);
  const chooser = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (returnFocus = true) => {
      if (!chooser.current?.open) return;
      chooser.current.open = false;
      if (returnFocus) trigger.current?.focus({ preventScroll: true });
    };
    const outside = (event: PointerEvent) => {
      const panel = chooser.current;
      if (
        panel?.open &&
        event.target instanceof Node &&
        !panel.contains(event.target)
      )
        close(false);
    };
    const escape = (event: KeyboardEvent) => {
      // Leave the browser's native fullscreen Escape behavior intact.
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const shareButton = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recoveryButton = useRef<HTMLButtonElement>(null);
  const restoreRecoveryFocus = useRef(false);
  const restoreFocus = useRef<"tab" | "file" | null>(null);
  // Only sample low-rate health/activity; no feature frames enter React state.
  const [activity, setActivity] = useState(() => ({ health: analysis.health, receiving: false }));
  useEffect(() => {
    const timer = window.setInterval(() => {
      const health = analysis.health, view = analysis.musicFeatures?.read();
      const receiving = !!view && musicFeaturesFresh(view, performance.now() / 1000)
        && Math.max(view.energy.low, view.energy.mid, view.energy.high) > .001;
      setActivity(previous => previous.receiving === receiving
        && previous.health.status === health.status && previous.health.message === health.message
        ? previous : { health, receiving });
    }, 500);
    return () => clearInterval(timer);
  }, [analysis]);
  useEffect(() => {
    const element = controls.current;
    if (!element) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      element.style.setProperty('--controls-height', `${height}px`);
      // With large text on small screens Options has no room above the controls;
      // flag it so CSS pins the panel to the top, like the short-window rule.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      element.toggleAttribute('data-cramped', window.innerHeight - height < rem * 14);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const sharing =
    source === "tab" &&
    (capture.status === "connecting" || capture.status === "connected");
  const canDisconnect = source === "file" ? local.status !== "empty" : sharing;
  useEffect(() => {
    // Cancel/Disconnect disables its own button. Move focus only after that
    // explicit action, once the next source control is enabled by the commit.
    if (canDisconnect || restoreFocus.current === null) return;
    const next =
      restoreFocus.current === "file" ? fileInput.current : shareButton.current;
    restoreFocus.current = null;
    next?.focus();
  }, [canDisconnect]);
  const hasFile = source === "file" && local.status !== "empty";
  const canPlay =
    hasFile && local.status !== "error" && local.status !== "playing";
  const playing = hasFile && local.status === "playing";
  const showPlayer = hasFile && local.status !== "error";
  const playLabel = playing ? "Pause" : local.status === "ended" ? "Replay" : "Play";
  const feedback = audioFeedback(source, capture, local, analysis.health, activity.receiving, props.notice);
  useEffect(() => {
    if (feedback.action || !restoreRecoveryFocus.current) return;
    restoreRecoveryFocus.current = false;
    if (document.activeElement === document.body) trigger.current?.focus({ preventScroll: true });
  }, [feedback.action]);
  const title =
    source === "file" && local.status !== "empty"
      ? "Local audio"
      : capture.status === "connecting"
        ? "Choose a browser tab"
        : source === "tab" && capture.status === "connected"
          ? "Shared tab"
          : "Choose your audio";
  const disconnect = () => {
    restoreFocus.current = source;
    props.onDisconnect();
  };
  const recovery = () => {
    restoreRecoveryFocus.current = document.activeElement === recoveryButton.current;
    switch (feedback.action) {
      case 'resume': analysis.resume(); break;
      case 'retry-tab': props.onShare(); break;
      case 'reconnect-tab': props.onDisconnect(); props.onShare(); break;
      case 'choose-file': fileInput.current?.click(); break;
      case 'cancel': disconnect(); break;
      case 'play': props.onPlay(); break;
    }
  };
  const recoveryLabel = feedback.action && {
    resume: 'Resume audio', 'retry-tab': 'Retry sharing', 'reconnect-tab': 'Reconnect audio',
    'choose-file': 'Open audio file', cancel: 'Cancel sharing', play: 'Retry Play',
  }[feedback.action];

  return (
    <>
      <div className="experience-controls" ref={controls}>
        {/* Both regions stay mounted so screen readers announce changes:
            routine updates politely, failures immediately. */}
        <p className="sr-only" role="status" aria-atomic="true">{feedback.tone === "error" ? "" : feedback.text}</p>
        <p className="sr-only" role="alert" aria-atomic="true">{feedback.tone === "error" ? feedback.text : ""}</p>
        <div className="audio-feedback" data-tone={feedback.tone}>
          <div className="audio-feedback-body">
            <p id="audio-feedback-status">{feedback.text}</p>
            {recoveryLabel && <button ref={recoveryButton} onClick={recovery}>{recoveryLabel}</button>}
          </div>
        </div>
        <div
          className="experience-toolbar"
          role="group"
          aria-label="Landscape and audio actions"
        >
          <div className="landscape-switcher">
            <label className="sr-only" htmlFor="scene-select">
              Change landscape
            </label>
            <select
              id="scene-select"
              value={props.scene}
              onChange={(event) =>
                props.onScene(event.currentTarget.value as SceneId)
              }
            >
              <option value="nocturne">Nocturne</option>
              <option value="bloom">Bloom</option>
              <option value="lavender-peaks">Lavender Peaks</option>
              <option value="crimson-horizon">Crimson Horizon</option>
            </select>
          </div>
          <div className="source-actions">
            <button
              ref={shareButton}
              className="primary-button"
              aria-describedby="audio-feedback-status"
              disabled={sharing}
              onClick={props.onShare}
            >
              Share a tab
            </button>
            <label className="file-button">
              Open audio file
              <input
                ref={fileInput}
                type="file"
                accept="audio/*"
                aria-label="Open audio file"
                aria-describedby="audio-feedback-status"
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (selected) props.onFile(selected);
                }}
              />
            </label>
          </div>
          <details ref={chooser} className="audio-chooser">
            <summary
              ref={trigger}
              className="chooser-trigger"
              aria-label={`${sceneNames[props.scene]} options`}
              title="Open options"
            >
              Options
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </summary>
            <section
              id="audio-controls"
              className="audio-controls"
              aria-labelledby="source-heading"
            >
              <div className="chooser-header">
                <h2 id="source-heading">{title}</h2>
                <button
                  className="chooser-close"
                  aria-label="Close audio controls"
                  onClick={() => {
                    if (chooser.current) chooser.current.open = false;
                    trigger.current?.focus();
                  }}
                >
                  ×
                </button>
              </div>
              {hasFile && (
                <p className="file-name" title={local.name}>
                  {local.name}
                </p>
              )}
              <p className="source-status">{feedback.text}</p>
              {showPlayer && (
                // Narrow screens hide the floating player while Options is open.
                <div className="options-playback">
                  <button disabled={!playing && !canPlay} onClick={playing ? props.onPause : props.onPlay}>
                    {playLabel}
                  </button>
                </div>
              )}
              {source === "tab" && capture.status === "connecting" && (
                <p className="source-help">
                  Choose a tab and enable Share tab audio. Cancel here ends
                  ECHO’s request; close the browser picker too.
                </p>
              )}
              {canDisconnect && (
                <button
                  className="disconnect-button"
                  onClick={disconnect}
                >
                  {capture.status === "connecting" && source === "tab"
                    ? "Cancel sharing"
                    : "Disconnect"}
                </button>
              )}
              {props.scene === "bloom" && source === "tab" && capture.status === "connected" && <>
                <button onClick={() => props.onBloomFloating(!props.bloomFloating)}>{props.bloomFloating ? "Pause floating" : "Resume floating"}</button>
                <p className="source-help">Floating follows this control while sharing. Playback stays controlled in your source tab.</p>
              </>}
              <div className="experience-settings">
                {props.scene === "bloom" && (
                  <p className="source-help">
                    The monolith floats while audio plays and settles when it
                    stops. Bass fills the sky with aurora light, high mids
                    brighten the stone's seam and mids send light down the
                    mountains. Low hits ripple the lake. Move the mouse to shift
                    the view slightly.
                  </p>
                )}
                {props.scene === "lavender-peaks" && (
                  <p className="source-help">
                    The mountains drift on their own. Each ridge answers its own
                    range, from the highest sounds in the farthest ridge to deep
                    bass in the nearest, and sharp hits leave light traces. Bass
                    and low hits make the sun and its corona glow.
                  </p>
                )}
                {props.scene === "crimson-horizon" && (
                  <p className="source-help">
                    Travel stays steady, even in silence. Low hits pulse the
                    sun; low mids light the contours and high mids send brief
                    streaks. Move the mouse to look around.
                  </p>
                )}
                {props.scene === "nocturne" && (
                  <p className="source-help">
                    Bass drives magenta fixtures, mids drive cyan windows, high
                    mids drive the left cyan panel, and treble drives violet
                    accents. Low hits send light across the bridge, and overall
                    intensity lights the distant gate and haze.
                  </p>
                )}
                {props.scene === "nocturne" && (
                  <NocturneLightingControls
                    mode={props.nocturneLightingMode}
                    onMode={props.onNocturneLightingMode}
                    lighting={props.nocturneLighting}
                    onChange={props.onNocturneLighting}
                  />
                )}
                <div className="quality-control">
                  <label htmlFor="graphics-quality">Graphics quality</label>
                  <select
                    id="graphics-quality"
                    value={props.quality}
                    onChange={(event) =>
                      props.onQuality(
                        event.currentTarget.value as GraphicsQuality,
                      )
                    }
                  >
                    <option value="standard">Standard</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <p className="privacy-note">
                Audio stays on your device. Nothing is recorded or uploaded.
                Close this panel to enjoy the scene; Disconnect ends the source.
              </p>
            </section>
          </details>
        </div>
        {showPlayer && (
          <div
            className="scene-player"
            role="group"
            aria-label="Local audio player"
          >
            <span className="scene-player-title" title={local.name}>
              {local.name}
            </span>
            <div className="scene-player-actions">
              <button
                disabled={!playing && !canPlay}
                onClick={playing ? props.onPause : props.onPlay}
              >
                {playLabel}
              </button>
              <label className="slider-control">
                Volume
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={props.volume}
                  onChange={(event) =>
                    props.onVolume(Number(event.currentTarget.value))
                  }
                />
                <output>{Math.round(props.volume * 100)}%</output>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

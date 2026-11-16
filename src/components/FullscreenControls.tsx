import { useEffect, useId, useRef, useState, type RefObject } from 'react'

const failureMessage = 'Fullscreen could not change. Try again, or press Escape to leave fullscreen.'

export function FullscreenControls({ target }: {
  target: RefObject<HTMLElement | null>
}) {
  const [active, setActive] = useState(false)
  const supported = Boolean(document.fullscreenEnabled && typeof HTMLElement.prototype.requestFullscreen === 'function')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const changing = useRef(false)
  const messageId = useId()

  useEffect(() => {
    const changed = () => {
      setActive(document.fullscreenElement === target.current)
      setError('')
    }
    const failed = () => setError(failureMessage)
    document.addEventListener('fullscreenchange', changed)
    document.addEventListener('fullscreenerror', failed)
    return () => {
      document.removeEventListener('fullscreenchange', changed)
      document.removeEventListener('fullscreenerror', failed)
    }
  }, [target])

  async function toggle() {
    const element = target.current
    if (!element || !supported || changing.current) return
    changing.current = true
    setPending(true)
    setError('')
    try {
      // Call directly from the gesture; actual state comes from browser events.
      if (document.fullscreenElement === element) await document.exitFullscreen()
      else await element.requestFullscreen()
    } catch {
      setError(failureMessage)
    } finally {
      changing.current = false
      setPending(false)
    }
  }

  const message = supported ? error : 'Fullscreen is unavailable in this browser. You can keep using this view.'
  return (
    <div className="fullscreen-controls">
      <button type="button" disabled={!supported} aria-pressed={active} aria-busy={pending}
        aria-disabled={pending || !supported} aria-describedby={message ? messageId : undefined}
        onClick={() => { void toggle() }}>
        {active ? 'Exit fullscreen' : 'Enter fullscreen'}
      </button>
      {active && <span className="fullscreen-hint">Escape to exit</span>}
      <p id={messageId} role="status" className="fullscreen-message">{message}</p>
    </div>
  )
}

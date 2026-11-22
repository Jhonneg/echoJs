import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type CanvasProps } from '@react-three/fiber'
import type { AudioSignal } from '../audio/signal'
import { QUALITY_DPR, type GraphicsQuality } from './quality'
import { createBassMotion, resetBassMotion } from './bassMotion'
import { updateCameraTilt } from './cameraTilt'
import { bassMotionVariant } from './bassMotionVariant'

type MotionProps = { signal: AudioSignal, reactivity: number, reducedMotion: boolean }
type TiltInput = { cameraTilt: false, signal?: AudioSignal } | { cameraTilt?: true, signal: AudioSignal }

function CameraTilt({ signal, reactivity, reducedMotion }: MotionProps) {
  const get = useThree(state => state.get)
  const motion = useRef(createBassMotion())
  const enabled = bassMotionVariant === 'camera' || bassMotionVariant === 'both'
  useLayoutEffect(() => {
    const camera = get().camera
    // Reset before a demand-rendered frame, and when switching/disabling cameras.
    if (!enabled || reducedMotion || reactivity === 0) {
      resetBassMotion(motion.current)
      camera.rotation.z = 0
    }
    return () => { camera.rotation.z = 0 }
  }, [get, enabled, reducedMotion, reactivity])
  useFrame((state, delta) => {
    state.camera.rotation.z = updateCameraTilt(motion.current, signal, reactivity, reducedMotion, delta, enabled)
  })
  return null
}

// All landscapes use this host so shared camera behavior is installed once.
export function LandscapeCanvas({ signal, reactivity, reducedMotion, quality, children, fallback, frameloop = 'always', cameraTilt = true, projection = 'orthographic', camera }:
  Omit<MotionProps, 'signal'> & TiltInput & { quality: GraphicsQuality, children: ReactNode, fallback: ReactNode, frameloop?: 'always' | 'demand', projection?: 'orthographic' | 'perspective', camera?: CanvasProps['camera'] }) {
  return <Canvas orthographic={projection === 'orthographic'} camera={camera ?? { position: [0, 0, 20], zoom: 80, near: 0.1, far: 60 }}
    frameloop={frameloop} dpr={QUALITY_DPR[quality]} gl={{ antialias: true }} fallback={fallback}>
    {cameraTilt && signal && <CameraTilt signal={signal} reactivity={reactivity} reducedMotion={reducedMotion} />}
    {children}
  </Canvas>
}

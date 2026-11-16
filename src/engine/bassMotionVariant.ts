// Internal comparison builds apply camera motion consistently across landscapes.
const requested = import.meta.env.VITE_BASS_MOTION_VARIANT
export const bassMotionVariant = requested === 'off' || requested === 'halo' || requested === 'camera'
  ? requested : 'both'

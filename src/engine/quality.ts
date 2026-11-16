export type GraphicsQuality = 'standard' | 'low'

// Stable values let Canvas update drawing resolution without remounting.
export const QUALITY_DPR: Record<GraphicsQuality, number | [number, number]> = {
  standard: [1, 1.5],
  low: 0.75,
}

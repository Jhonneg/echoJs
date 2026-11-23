// Far to near: upper-slope tint, lower-slope weight and short local accents.
// Colors stay within the existing lavender/rose palette; the foreground stays dark.
export const RIDGE_SHADING = [
  { tint: '#e6dced', upper: .20, lower: 0, accent: .14, phase: .6, attack: .18, release: .65 },
  { tint: '#ead8e9', upper: .28, lower: 0, accent: .20, phase: 1.7, attack: .24, release: .85 },
  { tint: '#eed7e4', upper: .44, lower: 0, accent: .32, phase: 2.7, attack: .35, release: 1.1 },
  { tint: '#d9b7d8', upper: .36, lower: .02, accent: .24, phase: 3.8, attack: .5, release: 1.3 },
  { tint: '#c0a1cd', upper: .22, lower: .07, accent: .18, phase: 4.6, attack: .65, release: 1.5 },
  { tint: '#a88bb9', upper: .16, lower: .10, accent: .12, phase: 5.5, attack: .8, release: 1.6 },
] as const

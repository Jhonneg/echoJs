export type NocturneLightingMode = 'audio' | 'manual'
export type NocturneLighting = { magenta: number, cyan: number, cyanPanel: number, violet: number }
export const NOCTURNE_ALL_ON: NocturneLighting = { magenta: 1, cyan: 1, cyanPanel: 1, violet: 1 }
export const NOCTURNE_ALL_OFF: NocturneLighting = { magenta: 0, cyan: 0, cyanPanel: 0, violet: 0 }
export const NOCTURNE_LIGHT_COLORS = { magenta: '#ff005c', cyan: '#00e5ff', violet: '#b066ff' }

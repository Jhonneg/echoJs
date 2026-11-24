import type { Peak } from './motion'

export type Ridge = { peaks: Peak[], base: number, detail: number, upper: string, lower: string, z: number }

export const ridges: Ridge[] = [
  { peaks: [[-10, 1.4, 2.6], [-3.4, 1.9, 2.0], [1.6, 3.2, 2.2], [10.5, 2.2, 2.0]], base: -1.4, detail: 0.08, upper: '#c0b5df', lower: '#ddc9ea', z: -7 },
  { peaks: [[-8.8, 1.8, 1.5], [-1.7, 2.7, 1.5], [5.6, 1.5, 2.8], [11.4, 2.4, 1.4]], base: -2.0, detail: 0.11, upper: '#b2a4d5', lower: '#d6b9df', z: -6 },
  { peaks: [[-11, 2.0, 1.9], [-5.0, 1.8, 1.6], [0.0, 1.9, 2.5], [6.8, 2.2, 1.9]], base: -2.6, detail: 0.12, upper: '#a795c9', lower: '#cdb1d4', z: -5 },
  { peaks: [[-9.4, 1.4, 2.7], [-3.0, 2.6, 1.3], [3.4, 1.2, 1.8], [9.0, 2.7, 1.8]], base: -3.2, detail: 0.14, upper: '#9884bb', lower: '#bda2c7', z: -4 },
  { peaks: [[-11.0, 1.7, 1.4], [-6.4, 2.0, 1.6], [0.2, 1.3, 1.5], [5.6, 2.4, 2.0], [11.6, 1.4, 1.5]], base: -4.1, detail: 0.16, upper: '#8877af', lower: '#aa8fba', z: -3 },
  { peaks: [[-9.6, 1.5, 2.2], [-3.6, 2.4, 1.7], [3.0, 1.6, 2.2], [9.8, 2.2, 1.8]], base: -5.2, detail: 0.18, upper: '#7d70a5', lower: '#9b84ad', z: -2 },
]


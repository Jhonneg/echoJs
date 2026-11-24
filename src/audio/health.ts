// Source ownership and analysis health are separate from musical features.
export type AudioStartResult = { ok: true } | { ok: false; message: string }
export interface AnalysisHealth {
  status: 'idle' | 'starting' | 'running' | 'suspended' | 'error'
  message: string
}

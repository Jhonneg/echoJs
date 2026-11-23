import { MONOLITH } from './monolith.ts'

export const FLOAT_REST = MONOLITH.waterY + MONOLITH.height / 2
export const FLOAT_HEIGHT = MONOLITH.height * .18
export const createFloat = () => ({ phase: 0, elapsed: 0, amount: 0, velocity: 0, oscillation: 0,
  y: FLOAT_REST, yaw: MONOLITH.yaw as number, fragments: [{x:0,y:0,z:1.2,rotation:0,impulse:0},{x:0,y:0,z:-.9,rotation:0,impulse:0}] })
export function updateFloat(s: ReturnType<typeof createFloat>, playing: boolean, reduced: boolean, delta: number, leftAttack = 0, rightAttack = 0) {
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(.05, delta)) : 0
  s.elapsed += dt
  s.phase = (s.phase + dt * Math.PI * 2 / 6) % (Math.PI * 4)
  const target = playing ? 1 : 0, omega = playing ? 1.55 : 1.2
  const offset = s.amount-target, j=s.velocity+omega*offset, decay=Math.exp(-omega*dt)
  s.amount=target+(offset+j*dt)*decay; s.velocity=(s.velocity-omega*j*dt)*decay
  s.oscillation += ((reduced?0:1)-s.oscillation)*(1-Math.exp(-dt/.5))
  s.y=FLOAT_REST+FLOAT_HEIGHT*s.amount+MONOLITH.height*.03*Math.sin(s.phase)*s.amount*s.oscillation
  s.yaw=MONOLITH.yaw+.045*Math.sin(s.phase*.5)*s.amount*s.oscillation
  for(let i=0;i<2;i++){
    const f=s.fragments[i], a=Math.max(0,s.amount-(i? .20:.12))/(i?.80:.88), t=s.elapsed/(i?1.45:1.05)+i*2.3
    f.x=.14*Math.sin(t*.63)*a*s.oscillation
    const hit = playing && !reduced ? Math.max(0, Math.min(1, Number.isFinite(i ? rightAttack : leftAttack) ? (i ? rightAttack : leftAttack) : 0)) * .04 : 0
    f.impulse += (hit-f.impulse)*(1-Math.exp(-dt/.055))
    f.y=f.impulse*a+.22*a+.15*Math.sin(t)*a*s.oscillation
    f.z=(i?-.9:1.2)+.14*Math.cos(t*.63)*a*s.oscillation
    f.rotation=.38*Math.sin(t*.70)*a*s.oscillation
  }
  return s
}

export const createParallax = () => ({ x:0, y:0, targetX:0, targetY:0 })
export function updateParallax(s: ReturnType<typeof createParallax>, delta: number, enabled: boolean) {
  const dt=Number.isFinite(delta)?Math.max(0,Math.min(.05,delta)):0
  const mix=1-Math.exp(-dt/.25)
  s.x+=((enabled?s.targetX:0)-s.x)*mix;s.y+=((enabled?s.targetY:0)-s.y)*mix
  return s
}

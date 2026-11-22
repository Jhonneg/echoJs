import { ONSET_BANDS, type OnsetView } from './onsets.ts'
import type { DiagnosticSnapshot } from './diagnostics.ts'

export type ReviewMode='compare'|'legacy'|'candidate'
export const REVIEW_HOLD_SECONDS=.2
const bands=['bass','midrange','treble'] as const
const labels=['Low / bass','Mid / midrange','High / treble'] as const
export function createReviewState() {
  const view={mode:'compare' as ReviewMode,session:-1,sequence:0,bands:ONSET_BANDS.map(()=>({count:0,strength:0,emittedAt:0,pulseUntil:-Infinity}))}
  function clear(){for(const b of view.bands){b.count=b.strength=b.emittedAt=0;b.pulseUntil=-Infinity}}
  function update(onsets:OnsetView,now:number,active:boolean,reducedMotion=false) {
    if(view.session!==onsets.session){view.session=onsets.session;view.sequence=0;clear()}
    if(!active){view.sequence=onsets.sequence;clear();return view}
    for(const event of onsets.events){
      if(event.session!==onsets.session||event.sequence<=view.sequence)continue
      view.sequence=event.sequence
      const b=view.bands[ONSET_BANDS.indexOf(event.band)];b.count++;b.strength=event.strength;b.emittedAt=event.emittedAtSeconds
      const age=now-event.emittedAtSeconds
      b.pulseUntil=view.mode!=='legacy'&&!reducedMotion&&age>=0&&age<REVIEW_HOLD_SECONDS?event.emittedAtSeconds+REVIEW_HOLD_SECONDS:-Infinity
    }
    for(const b of view.bands)if(reducedMotion||view.mode==='legacy'||now>=b.pulseUntil)b.pulseUntil=-Infinity
    return view
  }
  return {view,update,setMode(mode:ReviewMode,onsets:OnsetView,now:number,active:boolean,reducedMotion=false){
    // Consume the latest snapshot before changing presentation; hidden events
    // can never become a fresh visual accent merely by revealing the candidate.
    update(onsets,now,active,reducedMotion)
    if(mode!==view.mode){view.mode=mode;for(const b of view.bands)b.pulseUntil=-Infinity}
  }}
}

export function createReviewRenderer(canvas:HTMLCanvasElement) {
  const state=createReviewState(),ctx=canvas.getContext('2d')!
  const clamp=(value:number)=>Math.max(0,Math.min(1,value))
  function bar(x:number,y:number,width:number,label:string,value:number,color:string) {
    ctx.fillStyle='#c8cde3';ctx.fillText(`${label} ${value.toFixed(3)}`,x,y)
    ctx.fillStyle='#20263a';ctx.fillRect(x,y+5,width,9)
    ctx.fillStyle=color;ctx.fillRect(x,y+5,width*clamp(value),9)
  }
  return {view:state.view,setMode:state.setMode,draw(snapshot:DiagnosticSnapshot,now:number,reducedMotion:boolean){
    const active=snapshot.state==='running',view=state.update(snapshot.onsets,now,active&&snapshot.onsets.primed,reducedMotion)
    const width=Math.max(280,Math.round(canvas.clientWidth)),stacked=width<760,compare=view.mode==='compare',height=compare&&stacked?880:440
    if(canvas.width!==width)canvas.width=width
    if(canvas.height!==height)canvas.height=height
    ctx.clearRect(0,0,width,height);ctx.font='13px system-ui';ctx.textBaseline='alphabetic'
    const columnWidth=compare&&!stacked?width/2:width
    for(let column=0;column<(compare?2:1);column++) {
      const candidate=compare?column===1:view.mode==='candidate',x=(compare&&!stacked?column*columnWidth:0)+14,top=compare&&stacked?column*440:0,w=columnWidth-28
      const color=candidate?'#55e4d4':'#ffb56b'
      ctx.fillStyle=color;ctx.fillText(candidate?'CANDIDATE · fixed energy + events':'LEGACY · levels + continuous accents',x,top+24)
      for(let i=0;i<bands.length;i++) {
        const key=bands[i],y=top+50+i*90,b=view.bands[i]
        ctx.fillStyle='#eef0fc';ctx.fillText(labels[i],x,y)
        bar(x,y+19,w,'Energy',active?(candidate?snapshot.energy.linear[key]:snapshot.signal.levels[key]):0,color)
        if(candidate){
          ctx.fillStyle='#c8cde3';ctx.fillText(`Events ${b.count} · last ${b.strength.toFixed(3)}`,x,y+56)
          if(b.count)ctx.fillText(`Emitted ${b.emittedAt.toFixed(3)} s`,x,y+73)
          // A fixed hold is only a review indicator; no feature or scene easing.
          if(now<b.pulseUntil){ctx.fillStyle=color;ctx.fillRect(x+w-12,y+45,12,12)}
        } else {
          ctx.fillStyle='#aeb7d3';ctx.fillText(`Transient ${active?snapshot.signal.transient[key].toFixed(3):'0.000'} · flux ${active?snapshot.signal.flux[key].toFixed(3):'0.000'}`,x,y+55)
          ctx.fillStyle='#577294';ctx.fillRect(x,y+62,w*clamp(active?snapshot.signal.transient[key]:0),4)
          ctx.fillStyle='#ad92df';ctx.fillRect(x,y+69,w*clamp(active?snapshot.signal.flux[key]:0),4)
        }
      }
      if(candidate){const c=snapshot.context
        bar(x,top+337,w,'Slow intensity',active?c.intensity:0,color)
        bar(x,top+370,w,c.brightnessValid?'Brightness':'Brightness (invalid)',active?c.brightness:0,color)
        bar(x,top+403,w,'Activity',active?c.activity:0,color)
      }else{
        bar(x,top+337,w,'Legacy atmosphere',active?snapshot.signal.atmosphere:0,color)
        ctx.fillStyle='#aeb7d3';ctx.fillText('Brightness / activity: no direct equivalent',x,top+380)
      }
    }
  }}
}

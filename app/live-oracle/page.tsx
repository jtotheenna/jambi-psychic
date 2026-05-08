"use client"

import { useEffect, useState } from "react"
import { getMoonData, type MoonData } from "@/lib/moon"
import type { TarotCardDraw } from "@/lib/tarotDeck"
import type { CartomancyCardDraw } from "@/lib/cartomancyDeck"
import { SHORT } from "@/lib/cartomancyDeck"

type LiveState = {
  question: string
  mode: "tarot" | "cartomancy"
  cards: TarotCardDraw[]
  cartoCards: CartomancyCardDraw[]
  reading: string
  showReading: boolean
}

const MENU_ITEMS = [
  { tokens:"10",  label:"Moon Reading",         desc:"Lunar energy & emotional guidance" },
  { tokens:"20",  label:"One Card Tarot Pull",  desc:"Quick oracle message" },
  { tokens:"20",  label:"Yes / No Oracle",      desc:"Direct symbolic guidance" },
  { tokens:"40",  label:"3 Card Tarot",         desc:"Past · Present · Future" },
  { tokens:"75",  label:"5 Card Full Spread",   desc:"Deep situation reading" },
  { tokens:"100", label:"Oracle Bundle",        desc:"Tarot + Moon Reading" },
  { tokens:"200", label:"Private Deep Session", desc:"Full immersive reading, all spreads" },
]

const TAROT_POS: Record<number,string[]> = {
  1:["Oracle Message"], 3:["Past","Present","Future"],
  5:["Situation","Challenge","Hidden Influence","Advice","Outcome"],
}
const CARTO_POS: Record<number,string[]> = {
  1:["The Message"], 3:["Past","Present","Future"],
  5:["You","Your Path","Hidden Force","What to Do","Outcome"],
}
const SUIT_GLOW: Record<string,string> = {
  Hearts:"#ff4466", Diamonds:"#f0cc6e", Clubs:"#a78bfa", Spades:"#67e8f9",
}

function TarotCard({ card, position, index }: { card:TarotCardDraw; position:string; index:number }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,
      animation:"cardReveal 0.45s ease forwards",animationDelay:`${index*0.12}s`,opacity:0 }}>
      <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.9vw,12px)",
        color:"#c9a84c",letterSpacing:"0.2em",textTransform:"uppercase",textAlign:"center" }}>{position}</div>
      <div style={{ width:"clamp(80px,8vw,140px)",aspectRatio:"2/3.46",
        transform:card.orientation==="reversed"?"rotate(180deg)":"none",
        borderRadius:8,overflow:"hidden",
        boxShadow:"0 0 16px rgba(201,168,76,0.25),0 6px 20px rgba(0,0,0,0.6)",
        border:"1px solid rgba(201,168,76,0.4)",flexShrink:0 }}>
        {err ? (
          <div style={{ width:"100%",height:"100%",background:"radial-gradient(ellipse at top,#2a0d5e,#0a0520)",
            display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,padding:10 }}>
            <div style={{ fontSize:20,color:"#c9a84c" }}>✦</div>
            <div style={{ fontFamily:"'Cinzel',serif",fontSize:9,color:"#ddd8f0",textAlign:"center",lineHeight:1.3 }}>{card.name}</div>
          </div>
        ) : (
          <img src={card.image} alt={card.name} onError={()=>setErr(true)}
            style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
        )}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.85vw,11px)",color:"#ddd8f0" }}>{card.name}</div>
        <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(8px,0.75vw,10px)",
          color:card.orientation==="reversed"?"#be123c":"#c9a84c",fontStyle:"italic" }}>
          {card.orientation==="reversed"?"Reversed":"Upright"}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard({ card, position, index }: { card:CartomancyCardDraw; position:string; index:number }) {
  const glow = SUIT_GLOW[card.suit]
  const short = SHORT[card.value] ?? card.value
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,
      animation:"cardReveal 0.45s ease forwards",animationDelay:`${index*0.12}s`,opacity:0 }}>
      <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.9vw,12px)",
        color:"#c9a84c",letterSpacing:"0.2em",textTransform:"uppercase",textAlign:"center" }}>{position}</div>
      <div style={{ width:"clamp(68px,7vw,118px)",aspectRatio:"2.5/3.5",
        transform:card.orientation==="reversed"?"rotate(180deg)":"none",
        borderRadius:8,flexShrink:0,position:"relative",
        background:"linear-gradient(160deg,#0d0520 0%,#1a0d3f 50%,#0a0110 100%)",
        border:`1px solid ${glow}44`,
        boxShadow:`0 0 14px ${glow}33,0 0 30px ${glow}18,0 6px 20px rgba(0,0,0,0.8)`,
        display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:4,border:`1px solid ${glow}22`,borderRadius:5,pointerEvents:"none" }} />
        <div style={{ position:"absolute",fontSize:"clamp(28px,4vw,60px)",opacity:0.07,userSelect:"none",
          filter:`drop-shadow(0 0 6px ${glow})` }}>💀</div>
        <div style={{ position:"absolute",top:5,left:6,textAlign:"center",lineHeight:1.1 }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif",fontWeight:"bold",
            fontSize:"clamp(9px,1vw,14px)",color:glow,textShadow:`0 0 6px ${glow}` }}>{short}</div>
          <div style={{ fontSize:"clamp(8px,0.9vw,12px)",color:glow,textShadow:`0 0 5px ${glow}`,lineHeight:1 }}>{card.suitSymbol}</div>
        </div>
        <div style={{ fontSize:"clamp(28px,4vw,54px)",color:glow,lineHeight:1,
          textShadow:`0 0 10px ${glow},0 0 25px ${glow}88,0 0 50px ${glow}44`,
          userSelect:"none",position:"relative",zIndex:1 }}>{card.suitSymbol}</div>
        <div style={{ position:"absolute",bottom:5,right:6,textAlign:"center",lineHeight:1.1,transform:"rotate(180deg)" }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif",fontWeight:"bold",
            fontSize:"clamp(9px,1vw,14px)",color:glow,textShadow:`0 0 6px ${glow}` }}>{short}</div>
          <div style={{ fontSize:"clamp(8px,0.9vw,12px)",color:glow,textShadow:`0 0 5px ${glow}`,lineHeight:1 }}>{card.suitSymbol}</div>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.85vw,11px)",color:"#ddd8f0" }}>{card.name}</div>
        <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(8px,0.75vw,10px)",
          color:card.orientation==="reversed"?"#be123c":"#c9a84c",fontStyle:"italic" }}>
          {card.orientation==="reversed"?"Reversed":"Upright"}
        </div>
      </div>
    </div>
  )
}

export default function LiveOracleOverlay() {
  const [state, setState] = useState<LiveState>({
    question:"",mode:"tarot",cards:[],cartoCards:[],reading:"",showReading:false
  })
  const [moon, setMoon] = useState<MoonData>(() => getMoonData(new Date()))

  useEffect(() => {
    try { const s=localStorage.getItem("galileo-live-state"); if(s) setState(JSON.parse(s)) } catch {}
    const ch = new BroadcastChannel("galileo-live")
    ch.onmessage = (e) => { if(e.data?.type==="state") setState(e.data.payload) }
    const t = setInterval(() => setMoon(getMoonData(new Date())), 10*60*1000)
    return () => { ch.close(); clearInterval(t) }
  }, [])

  const isTarot = state.mode==="tarot"
  const active = isTarot ? state.cards : state.cartoCards
  const positions = isTarot
    ? (TAROT_POS[state.cards.length as 1|3|5]??[])
    : (CARTO_POS[state.cartoCards.length as 1|3|5]??[])

  return (
    <>
      <style>{`
        @keyframes cardReveal { from{opacity:0;transform:translateY(16px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes shimmer { 0%,100%{opacity:0.2;}50%{opacity:0.5;} }
      `}</style>

      <div style={{ minHeight:"100vh",width:"100%",
        background:"radial-gradient(ellipse at 50% 0%,#1a0d3f 0%,#04020e 75%)",
        display:"flex",flexDirection:"column",position:"relative",overflow:"hidden" }}>

        {/* header */}
        <div style={{ textAlign:"center",padding:"18px 32px 10px",zIndex:1,
          borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(16px,2.2vw,30px)",
            color:"#c9a84c",letterSpacing:"0.1em",textShadow:"0 0 30px rgba(201,168,76,0.4)" }}>Ask Galileo</div>
          <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(9px,1vw,12px)",
            color:"#7a8ba8",letterSpacing:"0.4em",textTransform:"uppercase",marginTop:3 }}>Live Oracle</div>
        </div>

        <div style={{ flex:1,display:"flex",zIndex:1,minHeight:0 }}>

          {/* left: tip menu + moon */}
          <div style={{ width:"clamp(200px,26vw,340px)",flexShrink:0,
            borderRight:"1px solid rgba(201,168,76,0.1)",display:"flex",flexDirection:"column",padding:"14px 0" }}>
            <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.9vw,11px)",color:"#7a6230",
              letterSpacing:"0.3em",textTransform:"uppercase",textAlign:"center",marginBottom:8,padding:"0 14px" }}>
              Tip Menu
            </div>

            {/* moon */}
            <div style={{ margin:"0 10px 10px",padding:"8px 12px",background:"rgba(10,5,32,0.6)",
              border:"1px solid rgba(201,168,76,0.12)",borderRadius:8,textAlign:"center" }}>
              <div style={{ fontSize:"clamp(16px,2vw,24px)",lineHeight:1 }}>{moon.phaseEmoji}</div>
              <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(8px,0.85vw,10px)",color:"#c9a84c",letterSpacing:"0.1em",marginTop:3 }}>{moon.phase}</div>
              <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(8px,0.75vw,10px)",color:"#7a6230",fontStyle:"italic",marginTop:1 }}>
                {moon.illumination}% · Day {moon.dayOfCycle}
              </div>
              <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(6px,0.65vw,8px)",color:"#4a3870",letterSpacing:"0.06em",marginTop:2 }}>
                {moon.sunBearMoon.name}
              </div>
            </div>

            {MENU_ITEMS.map((item) => (
              <div key={item.tokens+item.label} style={{ display:"flex",alignItems:"center",gap:10,
                padding:"8px 14px",borderBottom:"1px solid rgba(201,168,76,0.06)" }}>
                <div style={{ fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(12px,1.4vw,18px)",
                  color:"#c9a84c",minWidth:"clamp(40px,5vw,64px)" }}>{item.tokens}</div>
                <div style={{ width:1,alignSelf:"stretch",background:"rgba(201,168,76,0.12)" }} />
                <div>
                  <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(9px,1vw,13px)",color:"#ddd8f0" }}>{item.label}</div>
                  <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(8px,0.85vw,11px)",color:"#7a6230",fontStyle:"italic" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* right: cards */}
          <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"16px 24px 12px",gap:12,minWidth:0 }}>
            <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:200 }}>
              {active.length===0 ? (
                <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(14px,1.6vw,22px)",
                  color:"#2a1a55",fontStyle:"italic",textAlign:"center",animation:"shimmer 3s ease-in-out infinite" }}>
                  The cards await…
                </div>
              ) : (
                <div style={{ display:"flex",gap:"clamp(8px,1.2vw,18px)",
                  flexWrap:active.length===5?"wrap":"nowrap",justifyContent:"center",alignItems:"flex-start",width:"100%" }}>
                  {isTarot
                    ? state.cards.map((c,i) => <TarotCard key={c.id+i} card={c} position={positions[i]} index={i} />)
                    : state.cartoCards.map((c,i) => <SkeletonCard key={c.id+i} card={c} position={positions[i]} index={i} />)
                  }
                </div>
              )}
            </div>

            {state.showReading && state.reading.trim() && (
              <div style={{ background:"rgba(4,2,14,0.9)",border:"1px solid rgba(201,168,76,0.2)",
                borderRadius:12,padding:"18px 24px",backdropFilter:"blur(10px)" }}>
                {state.question.trim() && (
                  <div style={{ fontFamily:"'Cinzel',serif",fontSize:"clamp(9px,1vw,12px)",
                    color:"#7a6230",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
                    ✦ {state.question}
                  </div>
                )}
                <div style={{ fontFamily:"'EB Garamond',serif",fontSize:"clamp(13px,1.5vw,19px)",
                  color:"#ddd8f0",lineHeight:1.8,whiteSpace:"pre-wrap" }}>{state.reading}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign:"center",padding:"8px 32px",fontFamily:"'EB Garamond',serif",
          fontSize:"clamp(9px,0.85vw,11px)",color:"#2a1a55",
          borderTop:"1px solid rgba(201,168,76,0.06)",zIndex:1 }}>
          For entertainment and reflection only. Not medical, legal, financial, or crisis advice.
        </div>
      </div>
    </>
  )
}

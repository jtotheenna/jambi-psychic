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

const TAROT_POS: Record<number, string[]> = {
  1: ["Oracle Message"],
  3: ["Past", "Present", "Future"],
  5: ["Situation", "Challenge", "Hidden Influence", "Advice", "Outcome"],
}
const CARTO_POS: Record<number, string[]> = {
  1: ["The Message"],
  3: ["Past", "Present", "Future"],
  5: ["You", "Your Path", "Hidden Force", "What to Do", "Outcome"],
}

// Suit glow colours — matches dark oracle palette
const SUIT_GLOW: Record<string, string> = {
  Hearts:   "#ff4466",
  Diamonds: "#f0cc6e",
  Clubs:    "#a78bfa",
  Spades:   "#67e8f9",
}

function TarotCard({ card, position, index }: { card: TarotCardDraw; position: string; index: number }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      animation:"cardReveal 0.5s ease forwards", animationDelay:`${index*0.15}s`, opacity:0 }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,1.2vw,15px)", color:"#c9a84c",
        letterSpacing:"0.2em", textTransform:"uppercase", textAlign:"center" }}>{position}</div>
      <div style={{ width:"clamp(120px,13vw,210px)", aspectRatio:"2/3.46",
        transform: card.orientation==="reversed" ? "rotate(180deg)" : "none",
        borderRadius:12, overflow:"hidden",
        boxShadow:"0 0 28px rgba(201,168,76,0.35), 0 10px 40px rgba(0,0,0,0.7)",
        border:"2px solid rgba(201,168,76,0.5)", flexShrink:0 }}>
        {err ? (
          <div style={{ width:"100%",height:"100%", background:"radial-gradient(ellipse at top,#2a0d5e,#0a0520)",
            display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,padding:12 }}>
            <div style={{ fontSize:28,color:"#c9a84c" }}>✦</div>
            <div style={{ fontFamily:"'Cinzel',serif",fontSize:11,color:"#ddd8f0",textAlign:"center",lineHeight:1.3 }}>{card.name}</div>
          </div>
        ) : (
          <img src={card.image} alt={card.name} onError={()=>setErr(true)}
            style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
        )}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,1.1vw,14px)", color:"#ddd8f0" }}>{card.name}</div>
        <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(9px,1vw,12px)",
          color: card.orientation==="reversed" ? "#be123c" : "#c9a84c", fontStyle:"italic", marginTop:2 }}>
          {card.orientation==="reversed" ? "Reversed" : "Upright"}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard({ card, position, index }: { card: CartomancyCardDraw; position: string; index: number }) {
  const glow = SUIT_GLOW[card.suit]
  const short = SHORT[card.value] ?? card.value
  const isRed = card.color === "red"

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      animation:"cardReveal 0.5s ease forwards", animationDelay:`${index*0.15}s`, opacity:0 }}>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,1.2vw,15px)", color:"#c9a84c",
        letterSpacing:"0.2em", textTransform:"uppercase", textAlign:"center" }}>{position}</div>

      <div style={{
        width:"clamp(105px,11vw,180px)", aspectRatio:"2.5/3.5",
        transform: card.orientation==="reversed" ? "rotate(180deg)" : "none",
        borderRadius:12, flexShrink:0, position:"relative",
        background:"linear-gradient(160deg,#0d0520 0%,#1a0d3f 50%,#0a0110 100%)",
        border:`2px solid ${glow}55`,
        boxShadow:`0 0 20px ${glow}44, 0 0 50px ${glow}22, 0 12px 40px rgba(0,0,0,0.8)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden",
      }}>
        {/* corner border lines */}
        <div style={{ position:"absolute",inset:5, border:`1px solid ${glow}33`, borderRadius:8, pointerEvents:"none" }} />

        {/* skull watermark */}
        <div style={{
          position:"absolute", fontSize:"clamp(42px,6vw,90px)",
          opacity:0.07, userSelect:"none", lineHeight:1,
          filter:`drop-shadow(0 0 8px ${glow})`,
        }}>💀</div>

        {/* top-left value */}
        <div style={{ position:"absolute", top:8, left:10, textAlign:"center", lineHeight:1.1 }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontWeight:"bold",
            fontSize:"clamp(11px,1.3vw,18px)", color:glow,
            textShadow:`0 0 8px ${glow}, 0 0 20px ${glow}88` }}>{short}</div>
          <div style={{ fontSize:"clamp(10px,1.1vw,16px)", color:glow,
            textShadow:`0 0 8px ${glow}`, lineHeight:1 }}>{card.suitSymbol}</div>
        </div>

        {/* center suit — glowing */}
        <div style={{
          fontSize:"clamp(38px,5.5vw,80px)", color:glow, lineHeight:1,
          textShadow:`0 0 12px ${glow}, 0 0 30px ${glow}88, 0 0 60px ${glow}44`,
          userSelect:"none", position:"relative", zIndex:1,
        }}>
          {card.suitSymbol}
        </div>

        {/* bottom-right value (rotated) */}
        <div style={{ position:"absolute", bottom:8, right:10, textAlign:"center",
          lineHeight:1.1, transform:"rotate(180deg)" }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontWeight:"bold",
            fontSize:"clamp(11px,1.3vw,18px)", color:glow,
            textShadow:`0 0 8px ${glow}, 0 0 20px ${glow}88` }}>{short}</div>
          <div style={{ fontSize:"clamp(10px,1.1vw,16px)", color:glow,
            textShadow:`0 0 8px ${glow}`, lineHeight:1 }}>{card.suitSymbol}</div>
        </div>
      </div>

      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,1.1vw,14px)", color:"#ddd8f0" }}>{card.name}</div>
        <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(9px,1vw,12px)",
          color: card.orientation==="reversed" ? "#be123c" : "#c9a84c", fontStyle:"italic", marginTop:2 }}>
          {card.orientation==="reversed" ? "Reversed" : "Upright"}
        </div>
      </div>
    </div>
  )
}

export default function LiveTarotOverlay() {
  const [state, setState] = useState<LiveState>({
    question:"", mode:"tarot", cards:[], cartoCards:[], reading:"", showReading:false
  })
  const [moon, setMoon] = useState<MoonData>(() => getMoonData(new Date()))

  useEffect(() => {
    try { const s = localStorage.getItem("galileo-live-state"); if (s) setState(JSON.parse(s)) } catch {}
    const ch = new BroadcastChannel("galileo-live")
    ch.onmessage = (e) => { if (e.data?.type==="state") setState(e.data.payload) }
    const t = setInterval(() => setMoon(getMoonData(new Date())), 10*60*1000)
    return () => { ch.close(); clearInterval(t) }
  }, [])

  const isTarot = state.mode === "tarot"
  const active = isTarot ? state.cards : state.cartoCards
  const positions = isTarot
    ? (TAROT_POS[state.cards.length as 1|3|5] ?? [])
    : (CARTO_POS[state.cartoCards.length as 1|3|5] ?? [])

  return (
    <>
      <style>{`
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(20px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%,100% { opacity:0.2; } 50% { opacity:0.5; }
        }
      `}</style>

      <div style={{ minHeight:"100vh", width:"100%",
        background:"radial-gradient(ellipse at 50% 0%,#1a0d3f 0%,#04020e 70%)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"24px 40px 16px", gap:24, position:"relative", overflow:"hidden" }}>

        <div style={{ position:"absolute",inset:0,pointerEvents:"none",
          background:"radial-gradient(ellipse at 50% 20%,rgba(124,58,237,0.07) 0%,transparent 60%)" }} />

        {/* title + moon pill */}
        <div style={{ display:"flex", alignItems:"center", gap:24, zIndex:1 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(18px,2.5vw,36px)",
              color:"#c9a84c", letterSpacing:"0.12em", textShadow:"0 0 30px rgba(201,168,76,0.4)" }}>Ask Galileo</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(9px,1vw,13px)",
              color:"#7a8ba8", letterSpacing:"0.4em", textTransform:"uppercase", marginTop:4 }}>
              {isTarot ? "Live Tarot Reading" : "Live Cartomancy Reading"}
            </div>
          </div>
          <div style={{ padding:"8px 16px", background:"rgba(10,5,32,0.6)",
            border:"1px solid rgba(201,168,76,0.18)", borderRadius:40,
            display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>{moon.phaseEmoji}</span>
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(9px,1vw,12px)", color:"#c9a84c" }}>{moon.phase}</div>
              <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(8px,0.85vw,11px)", color:"#7a6230", fontStyle:"italic" }}>
                {moon.illumination}% · Day {moon.dayOfCycle}
              </div>
            </div>
          </div>
        </div>

        {/* cards */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          width:"100%", zIndex:1, minHeight:320 }}>
          {active.length === 0 ? (
            <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(16px,2vw,26px)",
              color:"#2a1a55", fontStyle:"italic", textAlign:"center",
              animation:"shimmer 3s ease-in-out infinite" }}>The cards await…</div>
          ) : (
            <div style={{ display:"flex", gap:"clamp(12px,2vw,32px)",
              flexWrap: active.length===5 ? "wrap" : "nowrap",
              justifyContent:"center", alignItems:"flex-start", width:"100%" }}>
              {isTarot
                ? state.cards.map((c,i) => <TarotCard key={c.id+i} card={c} position={positions[i]} index={i} />)
                : state.cartoCards.map((c,i) => <SkeletonCard key={c.id+i} card={c} position={positions[i]} index={i} />)
              }
            </div>
          )}
        </div>

        {/* reading on stream */}
        {state.showReading && state.reading.trim() && (
          <div style={{ width:"100%", maxWidth:900, zIndex:2,
            background:"rgba(4,2,14,0.9)", border:"1px solid rgba(201,168,76,0.22)",
            borderRadius:16, padding:"24px 32px", backdropFilter:"blur(12px)" }}>
            {state.question.trim() && (
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(10px,1.1vw,13px)",
                color:"#7a6230", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:14 }}>
                ✦ {state.question}
              </div>
            )}
            <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(15px,1.8vw,22px)",
              color:"#ddd8f0", lineHeight:1.85, whiteSpace:"pre-wrap" }}>{state.reading}</div>
          </div>
        )}

        <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(9px,0.9vw,11px)",
          color:"#2a1a55", textAlign:"center", zIndex:1 }}>
          For entertainment and reflection only. Not medical, legal, financial, or crisis advice.
        </div>
      </div>
    </>
  )
}

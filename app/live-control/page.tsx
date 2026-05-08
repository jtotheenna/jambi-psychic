"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { drawTarotCards, type TarotCardDraw } from "@/lib/tarotDeck"
import { drawCartomancyCards, type CartomancyCardDraw } from "@/lib/cartomancyDeck"

type LiveState = {
  question: string
  mode: "tarot" | "cartomancy"
  cards: TarotCardDraw[]
  cartoCards: CartomancyCardDraw[]
  reading: string
  showReading: boolean
}

const TAROT_POS: Record<number,string[]> = {
  1:["Oracle Message"], 3:["Past","Present","Future"],
  5:["Situation","Challenge","Hidden Influence","Advice","Outcome"],
}
const CARTO_POS: Record<number,string[]> = {
  1:["The Message"], 3:["Past","Present","Future"],
  5:["You","Your Path","Hidden Force","What to Do","Outcome"],
}

const EMPTY: LiveState = { question:"", mode:"tarot", cards:[], cartoCards:[], reading:"", showReading:false }

function broadcast(state: LiveState) {
  try {
    localStorage.setItem("galileo-live-state", JSON.stringify(state))
    new BroadcastChannel("galileo-live").postMessage({ type:"state", payload:state })
  } catch {}
}

export default function LiveControlPage() {
  const [state, setState] = useState<LiveState>(EMPTY)
  const [copied, setCopied] = useState(false)
  const [copiedSend, setCopiedSend] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    channelRef.current = new BroadcastChannel("galileo-live")
    try { const s=localStorage.getItem("galileo-live-state"); if(s) setState(JSON.parse(s)) } catch {}
    return () => channelRef.current?.close()
  }, [])

  const update = useCallback((patch: Partial<LiveState>) => {
    setState(prev => { const next={...prev,...patch}; broadcast(next); return next })
  }, [])

  const drawTarot = useCallback((count: 1|3|5) => {
    update({ mode:"tarot", cards:drawTarotCards(count), cartoCards:[], reading:"", showReading:false })
  }, [update])

  const drawCarto = useCallback((count: 1|3|5) => {
    update({ mode:"cartomancy", cartoCards:drawCartomancyCards(count), cards:[], reading:"", showReading:false })
  }, [update])

  const reset = useCallback(() => { setState(EMPTY); broadcast(EMPTY) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key==="r"||e.key==="R") reset()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reset])

  const isTarot = state.mode==="tarot"
  const hasCards = isTarot ? state.cards.length>0 : state.cartoCards.length>0
  const activeCards = isTarot ? state.cards : state.cartoCards
  const activePos = isTarot
    ? (TAROT_POS[state.cards.length as 1|3|5]??[])
    : (CARTO_POS[state.cartoCards.length as 1|3|5]??[])

  const prompt = hasCards
    ? isTarot
      ? `Viewer question:\n${state.question.trim()||"(no question asked)"}\n\nTarot spread:\n${state.cards.map((c,i)=>`${activePos[i]}: ${c.name} — ${c.orientation[0].toUpperCase()+c.orientation.slice(1)}`).join("\n")}\n\nGive a mystical, emotionally intelligent tarot reading based on these cards. Do not claim certainty. Keep it reflective and symbolic. Do not give medical, legal, financial, pregnancy, death, or guaranteed love predictions. Use the cards as symbolic guidance only.`
      : `Viewer question:\n${state.question.trim()||"(no question asked)"}\n\nCartomancy spread:\n${state.cartoCards.map((c,i)=>`${activePos[i]}: ${c.name} — ${c.orientation[0].toUpperCase()+c.orientation.slice(1)}\n  Meaning: ${c.meaning}`).join("\n")}\n\nGive a mystical, emotionally intelligent cartomancy reading based on these playing cards. Speak to the energy, the story, the pattern. Do not claim certainty. Keep it reflective and symbolic. Do not give medical, legal, financial, pregnancy, death, or guaranteed love predictions.`
    : ""

  const copyPrompt = () => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(()=>setCopied(false),2500) }

  const copyToSend = () => {
    if (!state.reading.trim()) return
    const spreadLine = activeCards.map((c,i)=>`${activePos[i]}: ${c.name} (${c.orientation})`).join(" · ")
    const text = `✦ Your ${isTarot?"Tarot":"Cartomancy"} Reading ✦\n\nQuestion: ${state.question.trim()||"General guidance"}\nCards: ${spreadLine}\n\n${state.reading.trim()}\n\n— Ask Galileo Live Oracle\nFor entertainment & reflection only.`
    navigator.clipboard.writeText(text)
    setCopiedSend(true); setTimeout(()=>setCopiedSend(false),2500)
  }

  const btn: React.CSSProperties = {
    fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:"0.15em", textTransform:"uppercase",
    border:"1px solid rgba(201,168,76,0.4)", background:"rgba(201,168,76,0.07)", color:"#c9a84c",
    padding:"9px 20px", borderRadius:6, cursor:"pointer", whiteSpace:"nowrap",
  }
  const tarotBtn: React.CSSProperties = { ...btn, borderColor:"rgba(124,58,237,0.5)", background:"rgba(124,58,237,0.1)", color:"#a78bfa" }
  const cartoBtn: React.CSSProperties = { ...btn, borderColor:"rgba(220,64,64,0.5)", background:"rgba(220,64,64,0.08)", color:"#f87171" }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;} body{background:#0a0520;color:#ddd8f0;}
        input,textarea{background:rgba(10,5,32,0.8);border:1px solid rgba(201,168,76,0.2);border-radius:6px;
          padding:10px 14px;font-family:'EB Garamond',serif;font-size:16px;color:#ddd8f0;outline:none;width:100%;resize:vertical;}
        input::placeholder,textarea::placeholder{color:#4a3870;}
        label{font-family:'Cinzel',serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#4a3870;display:block;margin-bottom:5px;}
        .sec{display:flex;flex-direction:column;gap:6px;}
        .row{display:flex;gap:8px;flex-wrap:wrap;}
        hr{border:none;border-top:1px solid rgba(201,168,76,0.1);margin:4px 0;}
      `}</style>

      <div style={{ minHeight:"100vh", padding:"20px 28px", display:"flex", flexDirection:"column", gap:18, maxWidth:860, margin:"0 auto" }}>

        {/* header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
          borderBottom:"1px solid rgba(201,168,76,0.12)",paddingBottom:14 }}>
          <div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif",fontSize:18,color:"#c9a84c" }}>Ask Galileo</div>
            <div style={{ fontFamily:"'Cinzel',serif",fontSize:9,color:"#4a3870",letterSpacing:"0.3em",marginTop:2 }}>
              LIVE CONTROL PANEL — private, not captured by OBS
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <a href="/live-tarot" target="_blank" style={{ ...btn,fontSize:10,textDecoration:"none" }}>Card Overlay ↗</a>
            <a href="/live-oracle" target="_blank" style={{ ...btn,fontSize:10,textDecoration:"none" }}>Oracle Overlay ↗</a>
          </div>
        </div>

        {/* question */}
        <div className="sec">
          <label>Viewer's Question</label>
          <input type="text" value={state.question} onChange={e=>update({question:e.target.value})}
            placeholder="Type the viewer's question…" />
        </div>

        {/* tarot */}
        <div className="sec">
          <label>🔮 Tarot — 78-card deck, Fisher-Yates shuffled</label>
          <div className="row">
            <button style={tarotBtn} onClick={()=>drawTarot(1)}>Tarot · Draw 1</button>
            <button style={tarotBtn} onClick={()=>drawTarot(3)}>Tarot · Draw 3</button>
            <button style={tarotBtn} onClick={()=>drawTarot(5)}>Tarot · Draw 5</button>
          </div>
        </div>

        <hr />

        {/* cartomancy */}
        <div className="sec">
          <label>💀 Cartomancy — 52-card playing deck</label>
          <div className="row">
            <button style={cartoBtn} onClick={()=>drawCarto(1)}>Cards · Draw 1</button>
            <button style={cartoBtn} onClick={()=>drawCarto(3)}>Cards · Draw 3</button>
            <button style={cartoBtn} onClick={()=>drawCarto(5)}>Cards · Draw 5</button>
          </div>
        </div>

        <div className="row">
          <button style={btn} onClick={reset}>Reset All [R]</button>
        </div>

        {/* card chips */}
        {hasCards && (
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {activeCards.map((c,i) => (
              <div key={c.id+i} style={{ padding:"5px 12px",background:"rgba(10,5,32,0.8)",
                border:`1px solid ${isTarot?"rgba(124,58,237,0.3)":"rgba(220,64,64,0.3)"}`,
                borderRadius:20,fontFamily:"'Cinzel',serif",fontSize:10,
                color:c.orientation==="reversed"?"#be123c":(isTarot?"#a78bfa":"#f87171"),
                letterSpacing:"0.05em" }}>
                {activePos[i]}: {c.name} · {c.orientation}
              </div>
            ))}
          </div>
        )}

        <hr />

        {/* prompt */}
        {hasCards && (
          <div className="sec">
            <label>Step 1 — Copy prompt → paste into Galileo / Claude / ChatGPT</label>
            <textarea value={prompt} readOnly rows={8} style={{ color:"#8878a8",fontSize:13 }} />
            <div style={{ display:"flex",justifyContent:"flex-end" }}>
              <button style={{ ...btn,...(copied?{borderColor:"rgba(16,185,129,0.5)",color:"#34d399",background:"rgba(16,185,129,0.1)"}:{}) }}
                onClick={copyPrompt}>{copied?"✓ Copied!":"Copy Prompt"}</button>
            </div>
          </div>
        )}

        {/* reading */}
        {hasCards && (
          <div className="sec">
            <label>Step 2 — Paste the AI reading here</label>
            <textarea value={state.reading} onChange={e=>update({reading:e.target.value})} rows={8}
              placeholder="Paste the AI-generated reading here…"
              style={{ borderColor:isTarot?"rgba(124,58,237,0.3)":"rgba(220,64,64,0.25)",color:"#ddd8f0" }} />
            <div className="row" style={{ justifyContent:"flex-end" }}>
              <button style={{ ...btn,
                borderColor:state.showReading?"rgba(201,168,76,0.7)":(isTarot?"rgba(124,58,237,0.4)":"rgba(220,64,64,0.4)"),
                background:state.showReading?"rgba(201,168,76,0.12)":"rgba(124,58,237,0.08)",
                color:state.showReading?"#c9a84c":(isTarot?"#a78bfa":"#f87171"),
                opacity:state.reading.trim()?1:0.4 }}
                onClick={()=>update({showReading:!state.showReading})} disabled={!state.reading.trim()}>
                {state.showReading?"✦ Showing on Stream":"Show Reading on Stream"}
              </button>
              <button style={{ ...btn,...(copiedSend?{borderColor:"rgba(16,185,129,0.5)",color:"#34d399",background:"rgba(16,185,129,0.1)"}:{}),
                opacity:state.reading.trim()?1:0.4 }}
                onClick={copyToSend} disabled={!state.reading.trim()}>
                {copiedSend?"✓ Copied!":"Copy to Send (DM / Text)"}
              </button>
            </div>
          </div>
        )}

        <div style={{ fontFamily:"'EB Garamond',serif",fontSize:12,color:"#3a2a6a",marginTop:"auto",textAlign:"center" }}>
          Keep this window private. OBS Browser Source → /live-tarot or /live-oracle
        </div>
      </div>
    </>
  )
}

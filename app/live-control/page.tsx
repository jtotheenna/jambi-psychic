"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { drawTarotCards, type TarotCardDraw } from "@/lib/tarotDeck"

type LiveState = {
  question: string
  cards: TarotCardDraw[]
  reading: string
  showReading: boolean
}

const POSITIONS: Record<number, string[]> = {
  1: ["Oracle Message"],
  3: ["Past", "Present", "Future"],
  5: ["Situation", "Challenge", "Hidden Influence", "Advice", "Outcome"],
}

const EMPTY: LiveState = { question: "", cards: [], reading: "", showReading: false }

function broadcast(state: LiveState) {
  try {
    localStorage.setItem("galileo-live-state", JSON.stringify(state))
    new BroadcastChannel("galileo-live").postMessage({ type: "state", payload: state })
  } catch {}
}

export default function LiveControlPage() {
  const [state, setState] = useState<LiveState>(EMPTY)
  const [copied, setCopied] = useState(false)
  const [copiedSend, setCopiedSend] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    channelRef.current = new BroadcastChannel("galileo-live")
    // Restore last session
    try {
      const saved = localStorage.getItem("galileo-live-state")
      if (saved) setState(JSON.parse(saved))
    } catch {}
    return () => channelRef.current?.close()
  }, [])

  const update = useCallback((patch: Partial<LiveState>) => {
    setState(prev => {
      const next = { ...prev, ...patch }
      broadcast(next)
      return next
    })
  }, [])

  const draw = useCallback((count: 1 | 3 | 5) => {
    update({ cards: drawTarotCards(count), reading: "", showReading: false })
  }, [update])

  const reset = useCallback(() => {
    setState(EMPTY)
    broadcast(EMPTY)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "1") draw(1)
      else if (e.key === "3") draw(3)
      else if (e.key === "5") draw(5)
      else if (e.key === "r" || e.key === "R") reset()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [draw, reset])

  const positions = POSITIONS[state.cards.length as 1 | 3 | 5] ?? []

  const prompt = state.cards.length > 0
    ? `Viewer question:\n${state.question.trim() || "(no question asked)"}\n\nTarot spread:\n${state.cards.map((c, i) =>
        `${positions[i]}: ${c.name} — ${c.orientation.charAt(0).toUpperCase() + c.orientation.slice(1)}`
      ).join("\n")}\n\nGive a mystical, emotionally intelligent tarot reading based on these cards. Do not claim certainty. Keep it reflective and symbolic. Do not give medical, legal, financial, pregnancy, death, or guaranteed love predictions. Use the cards as symbolic guidance only.`
    : ""

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const copyToSend = () => {
    if (!state.reading.trim()) return
    const spreadLine = state.cards.map((c, i) =>
      `${positions[i]}: ${c.name} (${c.orientation})`
    ).join(" · ")
    const text = `✦ Your Oracle Reading ✦\n\nQuestion: ${state.question.trim() || "General guidance"}\nCards: ${spreadLine}\n\n${state.reading.trim()}\n\n— Ask Galileo Live Oracle\nFor entertainment & reflection only.`
    navigator.clipboard.writeText(text)
    setCopiedSend(true)
    setTimeout(() => setCopiedSend(false), 2500)
  }

  const btn: React.CSSProperties = {
    fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.15em",
    textTransform: "uppercase", border: "1px solid rgba(201,168,76,0.4)",
    background: "rgba(201,168,76,0.07)", color: "#c9a84c",
    padding: "9px 20px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
  }
  const drawBtn: React.CSSProperties = {
    ...btn, borderColor: "rgba(124,58,237,0.5)", background: "rgba(124,58,237,0.1)", color: "#a78bfa",
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { background: #0a0520; color: #ddd8f0; }
        input, textarea {
          background: rgba(10,5,32,0.8);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 6px;
          padding: 10px 14px;
          font-family: 'EB Garamond', serif;
          font-size: 16px;
          color: #ddd8f0;
          outline: none;
          width: 100%;
          resize: vertical;
        }
        input::placeholder, textarea::placeholder { color: #4a3870; }
        label {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4a3870;
          display: block;
          margin-bottom: 5px;
        }
        .section { display: flex; flex-direction: column; gap: 6px; }
        .row { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>

      <div style={{ minHeight: "100vh", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 820, margin: "0 auto" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,168,76,0.12)", paddingBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: "#c9a84c" }}>Ask Galileo</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.3em", marginTop: 2 }}>LIVE CONTROL PANEL — private, not captured by OBS</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href="/live-tarot" target="_blank" style={{ ...btn, fontSize: 10, textDecoration: "none", color: "#c9a84c" }}>Open Card Overlay ↗</a>
            <a href="/live-oracle" target="_blank" style={{ ...btn, fontSize: 10, textDecoration: "none", color: "#c9a84c" }}>Open Oracle Overlay ↗</a>
          </div>
        </div>

        {/* viewer question */}
        <div className="section">
          <label>Viewer's Question</label>
          <input
            type="text"
            value={state.question}
            onChange={e => update({ question: e.target.value })}
            placeholder="Type the viewer's question…"
          />
        </div>

        {/* draw controls */}
        <div className="section">
          <label>Draw Cards — keyboard: 1 · 3 · 5 · R to reset</label>
          <div className="row">
            <button style={drawBtn} onClick={() => draw(1)}>Draw 1 Card <span style={{ opacity: 0.5 }}>[1]</span></button>
            <button style={drawBtn} onClick={() => draw(3)}>Draw 3 Cards <span style={{ opacity: 0.5 }}>[3]</span></button>
            <button style={drawBtn} onClick={() => draw(5)}>Draw 5 Cards <span style={{ opacity: 0.5 }}>[5]</span></button>
            <button style={btn} onClick={reset}>Reset All <span style={{ opacity: 0.5 }}>[R]</span></button>
          </div>

          {/* mini card list */}
          {state.cards.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {state.cards.map((c, i) => (
                <div key={c.id + i} style={{
                  padding: "5px 12px",
                  background: "rgba(10,5,32,0.8)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 20,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 10,
                  color: c.orientation === "reversed" ? "#be123c" : "#c9a84c",
                  letterSpacing: "0.05em",
                }}>
                  {positions[i]}: {c.name} · {c.orientation}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* prompt */}
        {state.cards.length > 0 && (
          <div className="section">
            <label>Step 1 — Copy prompt → paste into Galileo / Claude / ChatGPT</label>
            <textarea value={prompt} readOnly rows={7} style={{ color: "#8878a8", fontSize: 14 }} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{ ...btn, ...(copied ? { borderColor: "rgba(16,185,129,0.5)", color: "#34d399", background: "rgba(16,185,129,0.1)" } : {}) }}
                onClick={copyPrompt}
              >
                {copied ? "✓ Copied!" : "Copy Prompt"}
              </button>
            </div>
          </div>
        )}

        {/* reading paste + stream controls */}
        {state.cards.length > 0 && (
          <div className="section">
            <label>Step 2 — Paste the AI reading here</label>
            <textarea
              value={state.reading}
              onChange={e => update({ reading: e.target.value })}
              rows={8}
              placeholder="Paste the AI-generated reading here…"
              style={{ borderColor: "rgba(124,58,237,0.3)", color: "#ddd8f0" }}
            />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                style={{
                  ...btn,
                  borderColor: state.showReading ? "rgba(201,168,76,0.7)" : "rgba(124,58,237,0.4)",
                  background: state.showReading ? "rgba(201,168,76,0.12)" : "rgba(124,58,237,0.08)",
                  color: state.showReading ? "#c9a84c" : "#a78bfa",
                }}
                onClick={() => update({ showReading: !state.showReading })}
                disabled={!state.reading.trim()}
              >
                {state.showReading ? "✦ Showing on Stream" : "Show Reading on Stream"}
              </button>
              <button
                style={{ ...btn, ...(copiedSend ? { borderColor: "rgba(16,185,129,0.5)", color: "#34d399", background: "rgba(16,185,129,0.1)" } : {}), opacity: state.reading.trim() ? 1 : 0.4 }}
                onClick={copyToSend}
                disabled={!state.reading.trim()}
              >
                {copiedSend ? "✓ Copied!" : "Copy to Send (DM / Text)"}
              </button>
            </div>
          </div>
        )}

        {/* footer */}
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 12, color: "#3a2a6a", marginTop: "auto", textAlign: "center" }}>
          Keep this window private. Your OBS Browser Source should point to /live-tarot or /live-oracle — not this page.
        </div>
      </div>
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { getMoonData, type MoonData } from "@/lib/moon"
import type { TarotCardDraw } from "@/lib/tarotDeck"

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

function TarotCard({ card, position, index }: { card: TarotCardDraw; position: string; index: number }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      animation: "cardReveal 0.5s ease forwards",
      animationDelay: `${index * 0.15}s`,
      opacity: 0,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(10px, 1.2vw, 15px)",
        color: "#c9a84c",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        {position}
      </div>

      <div style={{
        width: "clamp(120px, 13vw, 210px)",
        aspectRatio: "2 / 3.46",
        transform: card.orientation === "reversed" ? "rotate(180deg)" : "none",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 0 28px rgba(201,168,76,0.35), 0 10px 40px rgba(0,0,0,0.7)",
        border: "2px solid rgba(201,168,76,0.5)",
        flexShrink: 0,
      }}>
        {imgError ? (
          <div style={{
            width: "100%", height: "100%",
            background: "radial-gradient(ellipse at top, #2a0d5e, #0a0520)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8, padding: 12,
          }}>
            <div style={{ fontSize: 28, color: "#c9a84c" }}>✦</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#ddd8f0", textAlign: "center", lineHeight: 1.3 }}>
              {card.name}
            </div>
          </div>
        ) : (
          <img
            src={card.image}
            alt={card.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(10px, 1.1vw, 14px)",
          color: "#ddd8f0",
          letterSpacing: "0.05em",
        }}>
          {card.name}
        </div>
        <div style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: "clamp(9px, 1vw, 12px)",
          color: card.orientation === "reversed" ? "#be123c" : "#c9a84c",
          fontStyle: "italic",
          letterSpacing: "0.1em",
          marginTop: 2,
        }}>
          {card.orientation === "reversed" ? "Reversed" : "Upright"}
        </div>
      </div>
    </div>
  )
}

export default function LiveTarotOverlay() {
  const [state, setState] = useState<LiveState>({ question: "", cards: [], reading: "", showReading: false })
  const [moon, setMoon] = useState<MoonData>(() => getMoonData(new Date()))

  useEffect(() => {
    // Load last known state from storage on mount
    try {
      const saved = localStorage.getItem("galileo-live-state")
      if (saved) setState(JSON.parse(saved))
    } catch {}

    // Listen for real-time updates from the control panel
    const channel = new BroadcastChannel("galileo-live")
    channel.onmessage = (e) => {
      if (e.data?.type === "state") setState(e.data.payload)
    }

    // Auto-refresh moon phase
    const moonTimer = setInterval(() => setMoon(getMoonData(new Date())), 10 * 60 * 1000)

    return () => { channel.close(); clearInterval(moonTimer) }
  }, [])

  const positions = POSITIONS[state.cards.length as 1 | 3 | 5] ?? []

  return (
    <>
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", width: "100%",
        background: "radial-gradient(ellipse at 50% 0%, #1a0d3f 0%, #04020e 70%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 40px 16px",
        gap: 24, position: "relative", overflow: "hidden",
      }}>

        {/* glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.07) 0%, transparent 60%)" }} />

        {/* title + moon */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(18px, 2.5vw, 36px)", color: "#c9a84c", letterSpacing: "0.12em", textShadow: "0 0 30px rgba(201,168,76,0.4)" }}>
              Ask Galileo
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(9px, 1vw, 13px)", color: "#7a8ba8", letterSpacing: "0.4em", textTransform: "uppercase", marginTop: 4 }}>
              Live Oracle Reading
            </div>
          </div>

          <div style={{ padding: "8px 16px", background: "rgba(10,5,32,0.6)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 40, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{moon.phaseEmoji}</span>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(9px, 1vw, 12px)", color: "#c9a84c", letterSpacing: "0.08em" }}>{moon.phase}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(8px, 0.85vw, 11px)", color: "#7a6230", fontStyle: "italic" }}>{moon.illumination}% · Day {moon.dayOfCycle}</div>
            </div>
          </div>
        </div>

        {/* cards or waiting state */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", zIndex: 1, minHeight: 320 }}>
          {state.cards.length === 0 ? (
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(16px, 2vw, 26px)", color: "#2a1a55", fontStyle: "italic", textAlign: "center", animation: "shimmer 3s ease-in-out infinite" }}>
              The cards await…
            </div>
          ) : (
            <div style={{
              display: "flex",
              gap: "clamp(12px, 2vw, 32px)",
              flexWrap: state.cards.length === 5 ? "wrap" : "nowrap",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
            }}>
              {state.cards.map((card, i) => (
                <TarotCard key={card.id + i} card={card} position={positions[i]} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* reading text — shown on stream when streamer toggles it */}
        {state.showReading && state.reading.trim() && (
          <div style={{
            width: "100%", maxWidth: 900, zIndex: 2,
            background: "rgba(4,2,14,0.88)",
            border: "1px solid rgba(201,168,76,0.22)",
            borderRadius: 16, padding: "24px 32px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 60px rgba(201,168,76,0.07)",
          }}>
            {state.question.trim() && (
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(10px, 1.1vw, 13px)", color: "#7a6230", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
                ✦ {state.question}
              </div>
            )}
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(15px, 1.8vw, 22px)", color: "#ddd8f0", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {state.reading}
            </div>
          </div>
        )}

        {/* disclaimer */}
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(9px, 0.9vw, 11px)", color: "#2a1a55", textAlign: "center", zIndex: 1, letterSpacing: "0.05em" }}>
          For entertainment and reflection only. Not medical, legal, financial, or crisis advice.
        </div>
      </div>
    </>
  )
}

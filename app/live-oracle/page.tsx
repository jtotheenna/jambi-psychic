"use client"

import { useState, useEffect, useCallback } from "react"
import { drawTarotCards, TarotCardDraw } from "@/lib/tarotDeck"
import { getMoonData, type MoonData } from "@/lib/moon"

const MENU_ITEMS = [
  { tokens: "10",  label: "Moon Reading",              desc: "Lunar energy & emotional guidance" },
  { tokens: "20",  label: "One Card Tarot Pull",       desc: "Quick oracle message" },
  { tokens: "20",  label: "Yes / No Oracle",           desc: "Direct symbolic guidance" },
  { tokens: "40",  label: "3 Card Tarot",              desc: "Past · Present · Future" },
  { tokens: "75",  label: "5 Card Full Spread",        desc: "Deep situation reading" },
  { tokens: "100", label: "Oracle Bundle",             desc: "Tarot + Moon Reading" },
  { tokens: "200", label: "Private Deep Session",      desc: "Full immersive reading, all spreads" },
]

const POSITIONS: Record<number, string[]> = {
  1: ["Oracle Message"],
  3: ["Past", "Present", "Future"],
  5: ["Situation", "Challenge", "Hidden Influence", "Advice", "Outcome"],
}

function CardBack() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "radial-gradient(ellipse at center, #2a0d5e 0%, #0a0520 100%)",
      border: "2px solid #c9a84c",
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 28, color: "#c9a84c" }}>✦</div>
      <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 9, color: "#7a6230", letterSpacing: "0.15em", textAlign: "center" }}>
        ASK GALILEO
      </div>
    </div>
  )
}

function TarotCard({ card, position, index }: { card: TarotCardDraw; position: string; index: number }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      animation: "cardReveal 0.45s ease forwards",
      animationDelay: `${index * 0.12}s`,
      opacity: 0,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "clamp(8px, 0.9vw, 12px)",
        color: "#c9a84c",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        {position}
      </div>

      <div style={{
        width: "clamp(80px, 8vw, 140px)",
        aspectRatio: "2 / 3.46",
        transform: card.orientation === "reversed" ? "rotate(180deg)" : "none",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 0 16px rgba(201,168,76,0.25), 0 6px 20px rgba(0,0,0,0.6)",
        border: "1px solid rgba(201,168,76,0.4)",
        flexShrink: 0,
      }}>
        {imgError ? (
          <CardBack />
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
          fontSize: "clamp(8px, 0.85vw, 11px)",
          color: "#ddd8f0",
        }}>
          {card.name}
        </div>
        <div style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: "clamp(8px, 0.75vw, 10px)",
          color: card.orientation === "reversed" ? "#be123c" : "#c9a84c",
          fontStyle: "italic",
        }}>
          {card.orientation === "reversed" ? "Reversed" : "Upright"}
        </div>
      </div>
    </div>
  )
}

export default function LiveOraclePage() {
  const [question, setQuestion] = useState("")
  const [cards, setCards] = useState<TarotCardDraw[]>([])
  const [obsMode, setObsMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [moon, setMoon] = useState<MoonData>(() => getMoonData(new Date()))
  const [reading, setReading] = useState("")
  const [showReading, setShowReading] = useState(false)
  const [copiedReading, setCopiedReading] = useState(false)

  // Refresh moon phase every 10 minutes so OBS browser source stays accurate overnight
  useEffect(() => {
    const id = setInterval(() => setMoon(getMoonData(new Date())), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback((count: 1 | 3 | 5) => setCards(drawTarotCards(count)), [])
  const reset = useCallback(() => { setCards([]); setQuestion(""); setReading(""); setShowReading(false) }, [])
  const toggleObs = useCallback(() => setObsMode(m => !m), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "1") draw(1)
      else if (e.key === "3") draw(3)
      else if (e.key === "5") draw(5)
      else if (e.key === "r" || e.key === "R") reset()
      else if (e.key === "h" || e.key === "H") toggleObs()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [draw, reset, toggleObs])

  const positions = POSITIONS[cards.length as 1 | 3 | 5] ?? []

  const prompt = cards.length > 0
    ? `Viewer question:\n${question.trim() || "(no question asked)"}\n\nTarot spread:\n${cards.map((c, i) =>
        `${positions[i]}: ${c.name} — ${c.orientation.charAt(0).toUpperCase() + c.orientation.slice(1)}`
      ).join("\n")}\n\nGive a mystical, emotionally intelligent tarot reading based on these cards. Do not claim certainty. Keep it reflective and symbolic. Do not give medical, legal, financial, pregnancy, death, or guaranteed love predictions. Use the cards as symbolic guidance only.`
    : ""

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes floatStar {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.9; }
        }
        .ob-btn {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(201,168,76,0.4);
          background: rgba(201,168,76,0.07);
          color: #c9a84c;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ob-btn:hover { background: rgba(201,168,76,0.16); border-color: #c9a84c; }
        .ob-btn.draw {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.08);
          color: #a78bfa;
        }
        .ob-btn.draw:hover { background: rgba(124,58,237,0.18); border-color: #a78bfa; }
        .menu-row-o {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(201,168,76,0.07);
        }
        .menu-row-o:last-child { border-bottom: none; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        width: "100%",
        background: "radial-gradient(ellipse at 50% 0%, #1a0d3f 0%, #04020e 75%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ambient stars */}
        {[8,19,33,47,62,76,89,4,25,54,71,93,13,38,67,82,96].map((x, i) => {
          const y = [12,34,7,22,5,18,9,48,61,44,58,42,77,85,72,91,66][i]
          return (
            <div key={i} style={{
              position: "absolute", left: `${x}%`, top: `${y}%`,
              width: 1, height: 1, borderRadius: "50%",
              background: "rgba(200,212,232,0.7)",
              animation: `floatStar ${2.5 + (i * 0.3) % 2}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 2}s`,
              pointerEvents: "none",
            }} />
          )
        })}

        {/* glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 20%, rgba(124,58,237,0.07) 0%, transparent 60%)",
        }} />

        {/* header */}
        <div style={{
          textAlign: "center",
          padding: "20px 32px 12px",
          zIndex: 1,
          borderBottom: "1px solid rgba(201,168,76,0.1)",
        }}>
          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: "clamp(16px, 2.2vw, 30px)",
            color: "#c9a84c",
            letterSpacing: "0.1em",
            textShadow: "0 0 30px rgba(201,168,76,0.4)",
          }}>
            Ask Galileo
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(9px, 1vw, 12px)",
            color: "#7a8ba8",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            marginTop: 3,
          }}>
            Live Oracle
          </div>
        </div>

        {/* main content */}
        <div style={{
          flex: 1,
          display: "flex",
          gap: 0,
          zIndex: 1,
          minHeight: 0,
        }}>

          {/* left: tip menu */}
          <div style={{
            width: "clamp(220px, 28vw, 360px)",
            flexShrink: 0,
            borderRight: "1px solid rgba(201,168,76,0.12)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 0",
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(9px, 1vw, 12px)",
              color: "#7a6230",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 10,
              padding: "0 16px",
            }}>
              Tip Menu
            </div>

            {/* Live moon phase */}
            <div style={{
              margin: "0 12px 12px",
              padding: "10px 12px",
              background: "rgba(10,5,32,0.6)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: 8,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "clamp(18px, 2vw, 26px)", lineHeight: 1 }}>{moon.phaseEmoji}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(8px, 0.9vw, 11px)", color: "#c9a84c", letterSpacing: "0.1em", marginTop: 4 }}>
                {moon.phase}
              </div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(8px, 0.8vw, 10px)", color: "#7a6230", fontStyle: "italic", marginTop: 2 }}>
                {moon.illumination}% · Day {moon.dayOfCycle}
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(7px, 0.7vw, 9px)", color: "#4a3870", letterSpacing: "0.08em", marginTop: 3 }}>
                {moon.sunBearMoon.name}
              </div>
            </div>
            {MENU_ITEMS.map((item) => (
              <div key={item.tokens + item.label} className="menu-row-o">
                <div style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: "clamp(13px, 1.5vw, 20px)",
                  color: "#c9a84c",
                  minWidth: "clamp(52px, 6vw, 78px)",
                  letterSpacing: "0.04em",
                }}>
                  {item.tokens}
                </div>
                <div style={{
                  width: 1, alignSelf: "stretch",
                  background: "rgba(201,168,76,0.15)",
                }} />
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "clamp(10px, 1.1vw, 14px)",
                    color: "#ddd8f0",
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "clamp(9px, 0.9vw, 12px)",
                    color: "#7a6230",
                    fontStyle: "italic",
                  }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* right: tarot area */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "16px 24px 12px",
            gap: 14,
            minWidth: 0,
          }}>

            {/* controls */}
            {!obsMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Viewer's question…"
                  style={{
                    width: "100%",
                    background: "rgba(10,5,32,0.7)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 6,
                    padding: "10px 16px",
                    fontFamily: "'EB Garamond', serif",
                    fontSize: 16,
                    color: "#ddd8f0",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="ob-btn draw" onClick={() => draw(1)}>Draw 1 <span style={{ opacity: 0.45, fontSize: 10 }}>[1]</span></button>
                  <button className="ob-btn draw" onClick={() => draw(3)}>Draw 3 <span style={{ opacity: 0.45, fontSize: 10 }}>[3]</span></button>
                  <button className="ob-btn draw" onClick={() => draw(5)}>Draw 5 <span style={{ opacity: 0.45, fontSize: 10 }}>[5]</span></button>
                  <button className="ob-btn" onClick={reset}>Reset <span style={{ opacity: 0.45, fontSize: 10 }}>[R]</span></button>
                  <button
                    className="ob-btn"
                    onClick={toggleObs}
                    style={{ borderColor: "rgba(16,185,129,0.4)", color: "#34d399", background: "rgba(16,185,129,0.07)" }}
                  >
                    Hide Controls <span style={{ opacity: 0.45, fontSize: 10 }}>[H]</span>
                  </button>
                  {cards.length > 0 && (
                    <button
                      className="ob-btn"
                      onClick={copyPrompt}
                      style={{
                        marginLeft: "auto",
                        background: copied ? "rgba(16,185,129,0.12)" : undefined,
                        borderColor: copied ? "rgba(16,185,129,0.4)" : undefined,
                        color: copied ? "#34d399" : undefined,
                      }}
                    >
                      {copied ? "✓ Copied!" : "Copy Prompt"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* OBS show button */}
            {obsMode && (
              <button
                onClick={toggleObs}
                style={{
                  alignSelf: "flex-end",
                  fontFamily: "'Cinzel', serif", fontSize: 10,
                  color: "#34d399", background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 5, padding: "5px 12px", cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                Show Controls [H]
              </button>
            )}

            {/* cards */}
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}>
              {cards.length === 0 ? (
                <div style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: "clamp(13px, 1.5vw, 20px)",
                  color: "#3a2a6a",
                  fontStyle: "italic",
                  textAlign: "center",
                  animation: "shimmer 3s ease-in-out infinite",
                }}>
                  The cards await…
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  gap: "clamp(8px, 1.2vw, 18px)",
                  flexWrap: cards.length === 5 ? "wrap" : "nowrap",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  width: "100%",
                }}>
                  {cards.map((card, i) => (
                    <TarotCard key={card.id + i} card={card} position={positions[i]} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* generated prompt (collapsed view in OBS mode) */}
            {!obsMode && cards.length > 0 && (
              <textarea
                readOnly
                value={prompt}
                rows={5}
                style={{
                  width: "100%",
                  background: "rgba(10,5,32,0.7)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 13,
                  color: "#8878a8",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.6,
                }}
              />
            )}
          </div>
        </div>

        {/* footer */}
        <div style={{
          textAlign: "center",
          padding: "10px 32px",
          fontFamily: "'EB Garamond', serif",
          fontSize: "clamp(9px, 0.85vw, 11px)",
          color: "#3a2a6a",
          borderTop: "1px solid rgba(201,168,76,0.07)",
          zIndex: 1,
          letterSpacing: "0.04em",
        }}>
          For entertainment and reflection only. Not medical, legal, financial, or crisis advice.
        </div>
      </div>
    </>
  )
}

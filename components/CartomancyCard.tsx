"use client"

import { useState } from "react"
import { CARTOMANCY_DECK } from "@/lib/cartomancy"

type Props = {
  name: string
  suit: string
  rank: string
  position?: string
  revealDelay?: number
}

const SUIT_SYMBOL: Record<string, string> = {
  Hearts: "♥", Diamonds: "♦", Clubs: "♣", Spades: "♠"
}
const RANK_ABBR: Record<string, string> = {
  Ace: "A", Two: "2", Three: "3", Four: "4", Five: "5",
  Six: "6", Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K",
}
const SUIT_DESC: Record<string, string> = {
  Hearts: "Love, emotion, relationships, the inner life",
  Diamonds: "Money, work, material world, practical outcomes",
  Clubs: "Ambition, career, energy, action",
  Spades: "Truth, conflict, difficulty, transformation",
}

function CardModal({ name, suit, rank, onClose }: { name: string; suit: string; rank: string; onClose: () => void }) {
  const cardData = CARTOMANCY_DECK.find(c => c.name === name)
  const isRed = suit === "Hearts" || suit === "Diamonds"
  const sym = SUIT_SYMBOL[suit]
  const rankAbbr = RANK_ABBR[rank] || rank
  const color = isRed ? "#c41e3a" : "#111"

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(4,2,14,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg, #130930 0%, #0a0520 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: 32, maxWidth: 460, width: "100%", display: "flex", gap: 24, alignItems: "flex-start", boxShadow: "0 0 60px rgba(79,70,229,0.2)" }}>

        {/* Card face */}
        <div style={{ flexShrink: 0, width: 90, height: 126, borderRadius: 8, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color, lineHeight: 1 }}>
            <div style={{ fontSize: rankAbbr.length > 1 ? 13 : 16 }}>{rankAbbr}</div>
            <div style={{ fontSize: 14 }}>{sym}</div>
          </div>
          <div style={{ textAlign: "center", fontSize: 34, color, lineHeight: 1 }}>{sym}</div>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color, lineHeight: 1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>
            <div style={{ fontSize: rankAbbr.length > 1 ? 13 : 16 }}>{rankAbbr}</div>
            <div style={{ fontSize: 14 }}>{sym}</div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 14, letterSpacing: "0.08em", marginBottom: 4 }} className="text-shimmer">
            {name}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: isRed ? "#e879a0" : "#9a8ab8", letterSpacing: "0.15em", marginBottom: 12 }}>
            {suit.toUpperCase()} · {isRed ? "♥♦" : "♣♠"}
          </div>

          {cardData && (
            <>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#c8d4e8", lineHeight: 1.7, marginBottom: 14 }}>
                {cardData.uprightMeaning}
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.12em", marginBottom: 6 }}>KEYWORDS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {cardData.keywords.map(kw => (
                  <span key={kw} style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: "#a5b4fc", background: "rgba(79,70,229,0.12)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 20, padding: "2px 10px" }}>
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}

          <div style={{ paddingTop: 12, borderTop: "1px solid rgba(42,26,85,0.5)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.12em", marginBottom: 4 }}>THE SUIT</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#6a5a8a", fontStyle: "italic", lineHeight: 1.6 }}>
              {SUIT_DESC[suit]}
            </div>
          </div>

          <button onClick={onClose} style={{ marginTop: 18, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#7a8ba8", background: "none", border: "1px solid rgba(42,26,85,0.5)", borderRadius: 6, padding: "6px 16px", cursor: "pointer" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartomancyCard({ name, suit, rank, position, revealDelay = 0 }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const isRed = suit === "Hearts" || suit === "Diamonds"
  const sym = SUIT_SYMBOL[suit]
  const rankAbbr = RANK_ABBR[rank] || rank
  const color = isRed ? "#c41e3a" : "#111"

  // Auto-reveal after delay
  useState(() => {
    const t = setTimeout(() => setRevealed(true), revealDelay)
    return () => clearTimeout(t)
  })

  return (
    <>
      {showModal && <CardModal name={name} suit={suit} rank={rank} onClose={() => setShowModal(false)} />}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, opacity: revealed ? 1 : 0, transition: "opacity 0.4s ease", cursor: "pointer" }} onClick={() => revealed && setShowModal(true)}>
        {position && (
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: "0.1em", color: "#7a8ba8", textAlign: "center", maxWidth: 84, textTransform: "uppercase" }}>
            {position}
          </div>
        )}
        <div style={{ width: 80, height: 112, borderRadius: 7, background: "#fff", border: "1px solid #ccc", boxShadow: "0 6px 20px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "6px 7px", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 28px rgba(0,0,0,0.65)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.55)" }}
        >
          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color, lineHeight: 1 }}>
            <div style={{ fontSize: rankAbbr.length > 1 ? 12 : 14 }}>{rankAbbr}</div>
            <div style={{ fontSize: 13 }}>{sym}</div>
          </div>
          <div style={{ textAlign: "center", fontSize: 30, color, lineHeight: 1 }}>{sym}</div>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color, lineHeight: 1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>
            <div style={{ fontSize: rankAbbr.length > 1 ? 12 : 14 }}>{rankAbbr}</div>
            <div style={{ fontSize: 13 }}>{sym}</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: "#7a8ba8", textAlign: "center", maxWidth: 84 }}>
          {name}
        </div>
      </div>
    </>
  )
}

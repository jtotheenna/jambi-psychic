"use client"

import { TarotCard as TarotCardType } from "@/lib/tarot"
import { useState, useEffect } from "react"
import Image from "next/image"

type Props = {
  card: TarotCardType
  position?: string
  revealDelay?: number
  isReversed?: boolean
}

function cardSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function CardModal({ card, isReversed, onClose }: { card: TarotCardType; isReversed: boolean; onClose: () => void }) {
  const imgSrc = `/cards/${cardSlug(card.name)}.jpg`
  const meaning = isReversed ? card.reversedMeaning : card.uprightMeaning

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(4,2,14,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #130930 0%, #0a0520 100%)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          width: "100%",
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          boxShadow: "0 0 60px rgba(79,70,229,0.2)",
        }}
      >
        {/* Card image */}
        <div style={{ flexShrink: 0, width: 100, height: 166, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", transform: isReversed ? "rotate(180deg)" : "none", position: "relative" }}>
          <Image src={imgSrc} alt={card.name} fill style={{ objectFit: "cover" }} sizes="100px" />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 14, letterSpacing: "0.1em", marginBottom: 4 }} className="text-shimmer">
            {card.name}
          </div>
          {isReversed && (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#be123c", letterSpacing: "0.15em", marginBottom: 8 }}>↻ REVERSED</div>
          )}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#7a8ba8", letterSpacing: "0.15em", marginBottom: 12 }}>
            {card.arcana === "major" ? "MAJOR ARCANA" : `${card.suit?.toUpperCase()} · MINOR ARCANA`}
          </div>

          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#c8d4e8", lineHeight: 1.7, marginBottom: 16 }}>
            {meaning}
          </div>

          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.12em", marginBottom: 6 }}>
            KEYWORDS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {card.keywords.map((kw) => (
              <span key={kw} style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: "#a5b4fc", background: "rgba(79,70,229,0.12)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 20, padding: "2px 10px" }}>
                {kw}
              </span>
            ))}
          </div>

          {/* Other direction */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(42,26,85,0.5)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.12em", marginBottom: 6 }}>
              {isReversed ? "UPRIGHT MEANING" : "REVERSED MEANING"}
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", lineHeight: 1.6, fontStyle: "italic" }}>
              {isReversed ? card.uprightMeaning : card.reversedMeaning}
            </div>
          </div>

          <button onClick={onClose} style={{ marginTop: 20, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#7a8ba8", background: "none", border: "1px solid rgba(42,26,85,0.5)", borderRadius: 6, padding: "6px 16px", cursor: "pointer" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TarotCard({ card, position, revealDelay = 0, isReversed = false }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), revealDelay)
    return () => clearTimeout(t)
  }, [revealDelay])

  const suitColors: Record<string, string> = {
    Cups: "#4f46e5",
    Wands: "#c9a84c",
    Swords: "#c8d4e8",
    Pentacles: "#16a34a",
  }
  const suitSymbols: Record<string, string> = {
    Cups: "🏺",
    Wands: "🔥",
    Swords: "⚔",
    Pentacles: "⭐",
  }

  const color = card.suit ? suitColors[card.suit] : "#a5b4fc"
  const symbol = card.suit ? suitSymbols[card.suit] : "☽"
  const imgSrc = `/cards/${cardSlug(card.name)}.jpg`
  const useImage = !imgError

  return (
    <>
    {showModal && <CardModal card={card} isReversed={isReversed} onClose={() => setShowModal(false)} />}
    <div
      className={`flex flex-col items-center gap-1 ${revealed ? "animate-card-reveal" : "opacity-0"}`}
      style={{ animationDelay: `${revealDelay}ms`, cursor: "pointer" }}
      onClick={() => revealed && setShowModal(true)}
      title="Click to learn more"
    >
      {position && (
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: "0.15em",
            color: "#7a8ba8",
            textTransform: "uppercase",
          }}
        >
          {position}
        </div>
      )}

      <div
        style={{
          width: 90,
          height: 150,
          borderRadius: 8,
          border: "1.5px solid",
          borderColor: useImage ? "rgba(201,168,76,0.5)" : `${color}60`,
          boxShadow: useImage
            ? "0 0 18px rgba(201,168,76,0.2), 0 4px 24px rgba(0,0,0,0.7)"
            : `0 0 15px ${color}30, 0 4px 20px rgba(0,0,0,0.6)`,
          transform: isReversed ? "rotate(180deg)" : "none",
          position: "relative",
          overflow: "hidden",
          background: "#0a0520",
          flexShrink: 0,
        }}
      >
        {useImage ? (
          <Image
            src={imgSrc}
            alt={card.name}
            fill
            style={{ objectFit: "cover", borderRadius: 7 }}
            onError={() => setImgError(true)}
            sizes="90px"
          />
        ) : (
          <>
            {/* CSS fallback card */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(160deg, #130930 0%, #0a0520 100%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 6px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(ellipse at 50% 40%, ${color}15 0%, transparent 70%)`,
                }}
              />
              <div style={{ fontSize: 8, color: `${color}80`, letterSpacing: 2, position: "relative" }}>✦ ✦ ✦</div>
              <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${color})`, position: "relative" }}>{symbol}</div>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 8,
                  color: color,
                  textAlign: "center",
                  letterSpacing: "0.05em",
                  lineHeight: 1.3,
                  position: "relative",
                }}
              >
                {card.name}
              </div>
              <div style={{ fontSize: 8, color: `${color}80`, letterSpacing: 2, position: "relative" }}>✦ ✦ ✦</div>
            </div>
          </>
        )}
      </div>

      {/* Name + reversed tag always shown below */}
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 8,
          color: "#7a8ba8",
          textAlign: "center",
          letterSpacing: "0.05em",
          lineHeight: 1.4,
          maxWidth: 90,
        }}
      >
        {card.name}
        {isReversed && (
          <div style={{ fontSize: 7, color: "#be123c", marginTop: 1 }}>↻ reversed</div>
        )}
      </div>
    </div>
    </>
  )
}

"use client"

import { TarotCard as TarotCardType } from "@/lib/tarot"
import { useState } from "react"
import Image from "next/image"

type Props = {
  card: TarotCardType
  position?: string
  revealDelay?: number
  isReversed?: boolean
}

// "The Moon" → "the-moon", "Ace of Cups" → "ace-of-cups"
function cardSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function TarotCard({ card, position, revealDelay = 0, isReversed = false }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!revealed) {
    setTimeout(() => setRevealed(true), revealDelay)
  }

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
    <div
      className={`flex flex-col items-center gap-1 ${revealed ? "animate-card-reveal" : "opacity-0"}`}
      style={{ animationDelay: `${revealDelay}ms` }}
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
  )
}
